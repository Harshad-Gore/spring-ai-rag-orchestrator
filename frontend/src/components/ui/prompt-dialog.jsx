import { useState, useEffect, useRef } from 'react'
import { Edit2, X } from 'lucide-react'
import { Button } from './button.jsx'

export function PromptDialog({
  isOpen,
  title,
  description,
  defaultValue = '',
  placeholder = '',
  confirmText = 'Save',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
}) {
  const [value, setValue] = useState(defaultValue)
  const inputRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      setValue(defaultValue)
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus()
          inputRef.current.select()
        }
      }, 50)
    }
  }, [isOpen, defaultValue])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-md overflow-hidden rounded-xl border border-[#242424] bg-[#0d0d0d] p-6 shadow-2xl animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="prompt-modal-title"
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
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#58d68d]/10 sm:size-10">
            <Edit2 className="size-5 text-[#58d68d]" aria-hidden="true" />
          </div>
          <div className="mt-1 text-center sm:text-left w-full">
            <h3 className="text-lg font-semibold leading-6 text-white" id="prompt-modal-title">
              {title}
            </h3>
            {description && (
              <div className="mt-2">
                <p className="text-sm text-[#9aa39f]">
                  {description}
                </p>
              </div>
            )}
            <div className="mt-4 pr-6">
              <input
                ref={inputRef}
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={placeholder}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    if (value.trim()) onConfirm(value)
                  } else if (e.key === 'Escape') {
                    onCancel()
                  }
                }}
                className="w-full rounded-md border border-[#333] bg-[#1a1a1a] px-3 py-2 text-sm text-white placeholder-[#657069] outline-none transition focus:border-[#58d68d] focus:ring-1 focus:ring-[#58d68d]"
              />
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="w-full sm:w-auto"
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            onClick={() => {
              if (value.trim()) onConfirm(value)
            }}
            disabled={!value.trim()}
            className="w-full sm:w-auto bg-[#58d68d] text-black hover:bg-[#4bc67d]"
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  )
}
