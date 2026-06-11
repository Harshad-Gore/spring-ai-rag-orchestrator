import { createContext, useContext, useState, useCallback } from 'react'
import { CheckCircle2, XCircle, X } from 'lucide-react'
import { cn } from '../../lib/utils.js'

const ToastContext = createContext(null)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback(({ type = 'success', message }) => {
    const id = Date.now().toString()
    setToasts((prev) => [...prev, { id, type, message }])
    
    // Auto remove after 3.5s
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id))
    }, 3500)
  }, [])

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "flex items-center gap-3 rounded-lg border px-4 py-3 shadow-[0_8px_30px_rgb(0,0,0,0.5)] transition-all md:min-w-[280px]",
              t.type === 'success' 
                ? "border-[#1e3a2a]/60 bg-[#0e1f16]/95 backdrop-blur-md text-[#dffdee]" 
                : "border-red-900/60 bg-[#2c1313]/95 backdrop-blur-md text-red-200"
            )}
            style={{ animation: 'toast-slide-in 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
          >
            {t.type === 'success' ? (
              <CheckCircle2 className="size-5 shrink-0 text-[#58d68d]" />
            ) : (
              <XCircle className="size-5 shrink-0 text-red-400" />
            )}
            <p className="flex-1 text-sm font-medium">{t.message}</p>
            <button
              onClick={() => removeToast(t.id)}
              className="shrink-0 rounded-md p-1 opacity-70 transition hover:bg-white/10 hover:opacity-100 cursor-pointer"
            >
              <X className="size-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
