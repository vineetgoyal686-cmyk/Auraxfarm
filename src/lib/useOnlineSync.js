import { useEffect, useState, useCallback } from 'react'
import { syncAll, pendingCount } from './sync'

export function useOnlineSync() {
  const [online, setOnline] = useState(navigator.onLine)
  const [pending, setPending] = useState(pendingCount())
  const [lastSync, setLastSync] = useState(null)
  const [lastError, setLastError] = useState(null)

  const refreshPending = useCallback(() => setPending(pendingCount()), [])

  const runSync = useCallback(async () => {
    const result = await syncAll()
    refreshPending()
    setLastSync(new Date())
    setLastError(result.failed > 0 ? result.errors[0]?.message || 'Sync failed' : null)
    return result
  }, [refreshPending])

  // Try syncing as soon as the app loads (not just on the 'online' event or
  // the next 20s poll tick), so a device that was already online when the
  // page opened doesn't sit with a stale pending queue.
  useEffect(() => {
    if (navigator.onLine) runSync()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    function goOnline() {
      setOnline(true)
      runSync()
    }
    function goOffline() {
      setOnline(false)
    }
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [runSync])

  // Auto-sync poll every 20s while online (covers the case where the
  // connection is flaky rather than fully off).
  useEffect(() => {
    const id = setInterval(() => {
      if (navigator.onLine) runSync()
      refreshPending()
    }, 20000)
    return () => clearInterval(id)
  }, [runSync, refreshPending])

  return { online, pending, lastSync, lastError, runSync, refreshPending }
}
