// A tiny pub/sub so any file can trigger a toast or a confirm dialog
// without needing React context or prop-drilling — <NotifyHost /> (mounted
// once near the app root) is the only thing that actually renders them.

let toastListeners = []
let confirmListener = null
let pendingResolve = null

export function subscribeToasts(fn) {
  toastListeners.push(fn)
  return () => {
    toastListeners = toastListeners.filter((l) => l !== fn)
  }
}

export function notify(message, type = 'error') {
  const toast = { id: `${Date.now()}-${Math.random()}`, message, type }
  toastListeners.forEach((fn) => fn(toast))
}

export function subscribeConfirm(fn) {
  confirmListener = fn
}

export function confirmDialog(message, options = {}) {
  return new Promise((resolve) => {
    pendingResolve = resolve
    confirmListener?.({ message, ...options })
  })
}

export function resolveConfirm(result) {
  pendingResolve?.(result)
  pendingResolve = null
}
