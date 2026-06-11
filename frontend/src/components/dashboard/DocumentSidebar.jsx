import { useState, useRef, useEffect } from 'react'
import { ChevronLeft, FileText, Pencil, Trash2, Upload } from 'lucide-react'
import { Button } from '../ui/button.jsx'

function DocumentSidebar({ notebook, onBack, onOpenUpload, onRemoveDocument, onRenameNotebook }) {
  const documents = notebook?.documents ?? []
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(notebook?.title ?? '')
  const inputRef = useRef(null)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  useEffect(() => {
    setEditTitle(notebook?.title ?? '')
  }, [notebook?.title])

  function handleRenameSubmit() {
    const trimmed = editTitle.trim()
    if (trimmed && trimmed !== notebook?.title && onRenameNotebook) {
      onRenameNotebook(notebook.id, trimmed)
    } else {
      setEditTitle(notebook?.title ?? '')
    }
    setIsEditing(false)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleRenameSubmit()
    } else if (e.key === 'Escape') {
      setEditTitle(notebook?.title ?? '')
      setIsEditing(false)
    }
  }

  return (
    <aside className="flex h-full flex-col border-r border-[#242424] bg-[#090909]">
      {/* Header */}
      <div className="shrink-0 border-b border-[#242424] px-4 py-4">
        <button
          type="button"
          onClick={onBack}
          className="mb-3 inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 text-xs font-medium text-[#9aa39f] transition hover:bg-white/[0.06] hover:text-white focus:outline-none focus:ring-2 focus:ring-[#b9f7d3]/25"
        >
          <ChevronLeft aria-hidden="true" className="size-3.5" />
          Back
        </button>
        <div className="group flex items-center gap-2">
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={handleRenameSubmit}
              onKeyDown={handleKeyDown}
              className="w-full rounded-md border border-[#dffdee]/30 bg-[#111] px-2 py-1 text-base font-semibold text-white outline-none focus:border-[#dffdee]/50 focus:ring-2 focus:ring-[#b9f7d3]/15"
            />
          ) : (
            <>
              <h2
                className="min-w-0 flex-1 truncate text-base font-semibold text-white cursor-pointer"
                onDoubleClick={() => setIsEditing(true)}
                title="Double-click to rename"
              >
                {notebook?.title ?? 'Notebook'}
              </h2>
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="flex size-6 shrink-0 items-center justify-center rounded-md text-[#657069] opacity-0 transition group-hover:opacity-100 hover:bg-white/[0.08] hover:text-white focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-[#b9f7d3]/25"
                aria-label="Rename notebook"
              >
                <Pencil aria-hidden="true" className="size-3" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Upload button */}
      <div className="shrink-0 px-4 py-3">
        <Button
          type="button"
          variant="outline"
          onClick={onOpenUpload}
          className="w-full"
        >
          <Upload aria-hidden="true" className="size-4" />
          Upload Source
        </Button>
      </div>

      {/* Document list */}
      <div className="flex-1 overflow-y-auto px-2">
        {documents.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
            <div className="flex size-10 items-center justify-center rounded-lg border border-[#2d2d2d] bg-[#111]">
              <FileText aria-hidden="true" className="size-4 text-[#657069]" />
            </div>
            <p className="text-sm text-[#657069]">No sources uploaded yet</p>
          </div>
        ) : (
          <ul className="space-y-0.5 py-1">
            {documents.map((doc) => (
              <li
                key={doc.id}
                className="group flex items-center gap-2.5 rounded-lg px-3 py-2.5 transition hover:bg-white/[0.04]"
              >
                <FileText
                  aria-hidden="true"
                  className="size-4 shrink-0 text-[#dffdee]/40"
                />
                <span className="min-w-0 flex-1 truncate text-sm text-[#c8cdc9]">
                  {doc.title}
                </span>
                <button
                  type="button"
                  onClick={() => onRemoveDocument(doc.id)}
                  className="flex size-6 shrink-0 items-center justify-center rounded-md text-[#657069] opacity-0 transition group-hover:opacity-100 hover:bg-red-500/10 hover:text-red-400 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-[#b9f7d3]/25"
                  aria-label={`Remove ${doc.title}`}
                >
                  <Trash2 aria-hidden="true" className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  )
}

export default DocumentSidebar
