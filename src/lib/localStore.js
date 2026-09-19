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

// A placeholder id used only until a record's very first sync. Two
// devices offline at once will never collide on this the way they could
// with a locally-counted sequential id, since it's never treated as the
// real id — the server assigns the permanent one at insert time (see
// sync.js) and every local reference gets remapped once that happens.
export function newTempId(prefix) {
  return `${prefix}-LOCAL-${Date.now()}-${Math.floor(Math.random() * 1e6)}`
}

export function isTempId(id) {
  return typeof id === 'string' && id.includes('-LOCAL-')
}

// Friendly label for an id that might still be a pre-sync placeholder.
export function displayId(id) {
  return isTempId(id) ? 'Pending sync…' : id
}
