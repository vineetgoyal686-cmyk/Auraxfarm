import { useEffect, useState, useCallback } from 'react'
import { syncAll, pendingCount } from './sync'

export function useOnlineSync() {
  const [online, setOnline] = useState(navigator.onLine)
  const [pending, setPending] = useState(pendingCount())
  const [lastSync, setLastSync] = useState(null)

  const refreshPending = useCallback(() => setPending(pendingCount()), [])

  const runSync = useCallback(async () => {
    const result = await syncAll()
    refreshPending()
    setLastSync(new Date())
    return result
  }, [refreshPending])

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

  return { online, pending, lastSync, runSync, refreshPending }
}
