import { supabase, isSupabaseConfigured } from './supabaseClient'
import { pendingRows, markSynced, deleteRow, upsertRow, listRows, replaceTable, isTempId } from './localStore'

// Tables that participate in offline -> online sync, in the order they
// should be pushed (farmers before farms before crops, so foreign keys
// resolve on the server).
export const SYNCED_TABLES = ['farmers', 'farms', 'crops']

// A brand-new farmer/land/crop is created locally with a temporary id
// (see newTempId in localStore.js) so the field app works offline. The
// real, permanent id is assigned by Postgres (a sequence-backed DEFAULT
// on each table's id column) the moment it's actually inserted, which is
// what keeps IDs unique and truly sequential even with many devices
// creating records offline at the same time. Once that happens, any
// local child rows still pointing at the temp id get rewritten to the
// real one — e.g. a farmer's land records, or a land record's crops.
async function insertWithServerId(table, tempId, payload, child) {
  const { id, ...insertPayload } = payload
  const { data, error } = await supabase.from(table).insert(insertPayload).select().single()
  if (error) throw error

  if (child) {
    const { table: childTable, foreignKey } = child
    const rows = listRows(childTable)
    let changed = false
    const remapped = rows.map((r) => {
      if (r[foreignKey] === tempId) {
        changed = true
        return { ...r, [foreignKey]: data.id }
      }
      return r
    })
    if (changed) replaceTable(childTable, remapped)
  }

  deleteRow(table, tempId)
  upsertRow(table, { ...data, synced: true, pending_op: null })
}

/**
 * Push every pending (unsynced) row for one table to Supabase.
 * Returns { pushed, failed } counts.
 */
async function syncTable(table) {
  if (!isSupabaseConfigured) return { pushed: 0, failed: 0, errors: [] }
  const rows = pendingRows(table)
  let pushed = 0
  let failed = 0
  const errors = []

  for (const row of rows) {
    const { pending_op, synced, ...payload } = row
    try {
      if (pending_op === 'delete') {
        const { error } = await supabase.from(table).delete().eq('id', row.id)
        if (error) throw error
        deleteRow(table, row.id)
      } else if (isTempId(row.id)) {
        const child =
          table === 'farmers'
            ? { table: 'farms', foreignKey: 'farmer_id' }
            : table === 'farms'
              ? { table: 'crops', foreignKey: 'farm_id' }
              : null
        await insertWithServerId(table, row.id, payload, child)
      } else {
        const { error } = await supabase.from(table).upsert(payload, { onConflict: 'id' })
        if (error) throw error
        markSynced(table, row.id)
      }
      pushed++
    } catch (err) {
      console.warn(`Sync failed for ${table}/${row.id}:`, err.message)
      failed++
      errors.push({ table, id: row.id, message: err.message })
    }
  }
  return { pushed, failed, errors }
}

export async function syncAll() {
  if (!navigator.onLine || !isSupabaseConfigured) {
    return { pushed: 0, failed: 0, errors: [], skipped: true }
  }
  let pushed = 0
  let failed = 0
  const errors = []
  for (const table of SYNCED_TABLES) {
    const res = await syncTable(table)
    pushed += res.pushed
    failed += res.failed
    errors.push(...res.errors)
  }
  return { pushed, failed, errors, skipped: false }
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
  for (const table of SYNCED_TABLES) {
    const { data, error } = await supabase.from(table).select('*').order('created_at', { ascending: false })
    if (!error && data) {
      // Keep whatever's still pending locally (e.g. a farmer created
      // offline that hasn't reached the server yet) instead of wiping it
      // out — this can otherwise race with syncAll() on app load and
      // silently drop not-yet-synced records.
      const pending = pendingRows(table)
      const pendingIds = new Set(pending.map((r) => r.id))
      const merged = [
        ...pending,
        ...data.filter((r) => !pendingIds.has(r.id)).map((r) => ({ ...r, synced: true, pending_op: null }))
      ]
      replaceTable(table, merged)
    }
  }
}
