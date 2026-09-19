import React, { useEffect, useState } from 'react'
import { AlertCircle, CheckCircle, Info, X, AlertTriangle } from 'lucide-react'
import { subscribeToasts, subscribeConfirm, resolveConfirm } from '../lib/notify.js'

const TOAST_ICONS = { error: AlertCircle, success: CheckCircle, info: Info }
const TOAST_STYLES = {
  error: 'bg-red-50 border-red-200 text-red-800',
  success: 'bg-green-50 border-green-200 text-green-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800'
}

// Mounted once near the app root — renders every toast/confirm triggered
// via src/lib/notify.js, replacing native alert()/confirm() popups with
// something that matches the app's own look.
export default function NotifyHost() {
  const [toasts, setToasts] = useState([])
  const [confirmState, setConfirmState] = useState(null)

  useEffect(() => {
    return subscribeToasts((toast) => {
      setToasts((list) => [...list, toast])
      setTimeout(() => {
        setToasts((list) => list.filter((t) => t.id !== toast.id))
      }, 4500)
    })
  }, [])

  useEffect(() => {
    subscribeConfirm((state) => setConfirmState(state))
  }, [])

  function answerConfirm(result) {
    setConfirmState(null)
    resolveConfirm(result)
  }

  return (
    <>
      {toasts.length > 0 && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] flex flex-col gap-2 w-full max-w-sm px-4 pointer-events-none">
          {toasts.map((t) => {
            const Icon = TOAST_ICONS[t.type] || TOAST_ICONS.error
            return (
              <div
                key={t.id}
                className={`p-3 rounded-lg border shadow-lg flex items-start gap-2 text-sm pointer-events-auto ${
                  TOAST_STYLES[t.type] || TOAST_STYLES.error
                }`}
              >
                <Icon className="w-4 h-4 mt-0.5 shrink-0" />
                <span className="flex-1">{t.message}</span>
                <button
                  onClick={() => setToasts((list) => list.filter((x) => x.id !== t.id))}
                  className="shrink-0 opacity-60 hover:opacity-100"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {confirmState && (
        <div className="fixed inset-0 z-[210] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-xl shadow-2xl overflow-hidden">
            <div className="p-5 flex gap-3">
              <div className="w-9 h-9 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <p className="text-sm text-gray-700 pt-1">{confirmState.message}</p>
            </div>
            <div className="p-4 border-t flex gap-3">
              <button
                onClick={() => answerConfirm(false)}
                className="flex-1 py-2.5 rounded-lg border text-sm font-bold text-gray-700"
              >
                {confirmState.cancelLabel || 'Cancel'}
              </button>
              <button
                onClick={() => answerConfirm(true)}
                className="flex-1 py-2.5 rounded-lg bg-red-600 text-white text-sm font-bold"
              >
                {confirmState.confirmLabel || 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
