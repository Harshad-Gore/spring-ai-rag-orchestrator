import { createContext, useCallback, useContext, useEffect, useState } from 'react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((type, message, opts = {}) => {
    const id = Math.random().toString(36).slice(2, 9)
    const toast = { id, type, message }
    setToasts((t) => [...t, toast])
    const ttl = opts.duration ?? 4000
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), ttl)
    return id
  }, [])

  const removeToast = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), [])

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <div aria-live="polite" className="fixed right-4 top-4 z-50 flex flex-col gap-3">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`max-w-sm rounded p-3 text-sm shadow-sm ${t.type === 'success' ? 'bg-[#0b291e] text-[#bff7d6]' : 'bg-[#2a0b0b] text-[#ffd3d3]'}`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
