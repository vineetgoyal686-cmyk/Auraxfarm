import { supabase, isSupabaseConfigured } from './supabaseClient'
import { pendingRows, markSynced, deleteRow } from './localStore'

// Tables that participate in offline -> online sync, in the order they
// should be pushed (farmers before farms before crops, so foreign keys
// resolve on the server).
export const SYNCED_TABLES = ['farmers', 'farms', 'crops']

/**
 * Push every pending (unsynced) row for one table to Supabase.
 * Returns { pushed, failed } counts.
 */
async function syncTable(table) {
  if (!isSupabaseConfigured) return { pushed: 0, failed: 0 }
  const rows = pendingRows(table)
  let pushed = 0
  let failed = 0

  for (const row of rows) {
    const { pending_op, synced, ...payload } = row
    try {
      if (pending_op === 'delete') {
        const { error } = await supabase.from(table).delete().eq('id', row.id)
        if (error) throw error
        deleteRow(table, row.id)
      } else {
        const { error } = await supabase.from(table).upsert(payload, { onConflict: 'id' })
        if (error) throw error
        markSynced(table, row.id)
      }
      pushed++
    } catch (err) {
      console.warn(`Sync failed for ${table}/${row.id}:`, err.message)
      failed++
    }
  }
  return { pushed, failed }
}

export async function syncAll() {
  if (!navigator.onLine || !isSupabaseConfigured) {
    return { pushed: 0, failed: 0, skipped: true }
  }
  let pushed = 0
  let failed = 0
  for (const table of SYNCED_TABLES) {
    const res = await syncTable(table)
    pushed += res.pushed
    failed += res.failed
  }
  return { pushed, failed, skipped: false }
}

export function pendingCount() {
  return SYNCED_TABLES.reduce((sum, t) => sum + pendingRows(t).length, 0)
}

/**
 * Pull the latest rows down from Supabase into local storage. Call this
 * after login / when coming back online so a device sees data captured
 * by other field users.
 */
export async function pullAll() {
  if (!navigator.onLine || !isSupabaseConfigured) return
  const { replaceTable } = await import('./localStore')
  for (const table of SYNCED_TABLES) {
    const { data, error } = await supabase.from(table).select('*').order('created_at', { ascending: false })
    if (!error && data) {
      replaceTable(table, data.map((r) => ({ ...r, synced: true, pending_op: null })))
    }
  }
}
