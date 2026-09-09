// A tiny local-first data layer.
//
// Every record lives in localStorage first (so the app works with zero
// signal in a field). Records carry a `synced` flag and a `pending_op`
// so the sync engine (see sync.js) knows what still needs to be pushed
// to Supabase once a connection is available.

const NS = 'auraxfarm:'

function readTable(table) {
  try {
    const raw = localStorage.getItem(NS + table)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function writeTable(table, rows) {
  localStorage.setItem(NS + table, JSON.stringify(rows))
}

export function listRows(table) {
  return readTable(table)
}

export function upsertRow(table, row) {
  const rows = readTable(table)
  const idx = rows.findIndex((r) => r.id === row.id)
  if (idx >= 0) rows[idx] = { ...rows[idx], ...row }
  else rows.unshift(row)
  writeTable(table, rows)
  return row
}

export function deleteRow(table, id) {
  const rows = readTable(table).filter((r) => r.id !== id)
  writeTable(table, rows)
}

export function markSynced(table, id) {
  const rows = readTable(table)
  const idx = rows.findIndex((r) => r.id === id)
  if (idx >= 0) {
    rows[idx].synced = true
    rows[idx].pending_op = null
    writeTable(table, rows)
  }
}

export function pendingRows(table) {
  return readTable(table).filter((r) => r.pending_op)
}

export function replaceTable(table, rows) {
  writeTable(table, rows)
}

export function newLocalId(prefix) {
  const rand = Math.floor(1000 + Math.random() * 9000)
  return `${prefix}-${rand}`
}
