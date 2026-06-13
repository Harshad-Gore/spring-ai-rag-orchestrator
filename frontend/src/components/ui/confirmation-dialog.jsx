import { AlertTriangle, X } from 'lucide-react'
import { Button } from './button.jsx'

export function ConfirmationDialog({
  isOpen,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  isDestructive = false,
}) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-md overflow-hidden rounded-xl border border-[#242424] bg-[#0d0d0d] p-6 shadow-2xl animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <button
          type="button"
          onClick={onCancel}
          className="absolute right-4 top-4 rounded-md text-[#657069] opacity-70 transition hover:bg-white/[0.08] hover:text-white hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-[#b9f7d3]/25 cursor-pointer"
        >
          <X className="size-5" />
          <span className="sr-only">Close</span>
        </button>

        <div className="flex gap-4 sm:items-start">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-red-500/10 sm:size-10">
            <AlertTriangle className="size-5 text-red-400" aria-hidden="true" />
          </div>
          <div className="mt-1 text-center sm:text-left w-full">
            <h3 className="text-lg font-semibold leading-6 text-white" id="modal-title">
              {title}
            </h3>
            <div className="mt-2">
              <p className="text-sm text-[#9aa39f]">
                {description}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            className="w-full sm:w-auto"
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            variant={isDestructive ? 'default' : 'outline'}
            onClick={onConfirm}
            className={isDestructive ? 'w-full sm:w-auto bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20 hover:border-red-500/30' : 'w-full sm:w-auto'}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  )
}
