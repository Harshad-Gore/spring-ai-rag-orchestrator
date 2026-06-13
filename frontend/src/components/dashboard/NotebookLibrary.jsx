import { useState, useEffect, useRef } from 'react'
import NotebookCard from './NotebookCard.jsx'
import EmptyState from './EmptyState.jsx'
import { LayoutGrid, List, ChevronDown, Check } from 'lucide-react'

function NotebookLibrary({
  notebooks,
  searchQuery,
  onOpenNotebook,
  onCreateNotebook,
  onRenameNotebook,
  onDeleteNotebook,
}) {
  const filtered = searchQuery
    ? notebooks.filter((nb) =>
        nb.title.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : notebooks

  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem('notebookViewMode') || 'grid'
  })
  const [viewMenuOpen, setViewMenuOpen] = useState(false)
  const viewMenuRef = useRef(null)

  useEffect(() => {
    localStorage.setItem('notebookViewMode', viewMode)
  }, [viewMode])

  useEffect(() => {
    if (!viewMenuOpen) return
    function handleClick(e) {
      if (viewMenuRef.current && !viewMenuRef.current.contains(e.target)) {
        setViewMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [viewMenuOpen])

  const viewOptions = [
    { id: 'grid-large', label: 'Extra Large Icons' },
    { id: 'grid', label: 'Medium Icons' },
    { id: 'grid-compact', label: 'Small Icons' },
    { id: 'list', label: 'List' },
    { id: 'list-compact', label: 'Compact List' },
  ]

  if (notebooks.length === 0) {
    return <EmptyState onCreateNotebook={onCreateNotebook} />
  }

  return (
    <div className="p-4 sm:p-6">
      {/* Section header */}
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Your Notebooks</h2>
        <div className="flex items-center gap-4">
          <span className="text-xs text-[#657069]">
            {filtered.length} of {notebooks.length}
          </span>
          <div className="relative" ref={viewMenuRef}>
            <button
              onClick={() => setViewMenuOpen(!viewMenuOpen)}
              className="flex items-center gap-2 rounded-lg border border-[#242424] bg-[#0d0d0d] px-3 py-1.5 text-sm text-[#c8cdc9] transition hover:bg-[#1a1a1a] hover:text-white"
            >
              {viewMode.startsWith('list') ? <List className="size-4" /> : <LayoutGrid className="size-4" />}
              <span>View</span>
              <ChevronDown className="size-3 text-[#657069]" />
            </button>

            {viewMenuOpen && (
              <div className="absolute right-0 top-full z-30 mt-2 w-48 overflow-hidden rounded-lg border border-[#242424] bg-[#111] shadow-[0_8px_32px_rgba(0,0,0,0.5)] py-1">
                {viewOptions.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => {
                      setViewMode(opt.id)
                      setViewMenuOpen(false)
                    }}
                    className="flex w-full items-center justify-between px-3 py-2 text-sm text-[#c8cdc9] transition hover:bg-white/[0.06] hover:text-white"
                  >
                    <span>{opt.label}</span>
                    {viewMode === opt.id && <Check className="size-4 text-[#58d68d]" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex min-h-[320px] items-center justify-center">
          <div className="text-center">
            <p className="text-sm font-medium text-[#9aa39f]">
              No notebooks matching "{searchQuery}"
            </p>
            <p className="mt-1 text-xs text-[#657069]">
              Try a different search term.
            </p>
          </div>
        </div>
      ) : (
        <div className={
          viewMode === 'grid-large' ? "grid grid-cols-1 md:grid-cols-2 gap-6" :
          viewMode === 'grid-compact' ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3" :
          viewMode.startsWith('list') ? "flex flex-col gap-3" :
          "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        }>
          {filtered.map((nb) => (
            <NotebookCard
              key={nb.id}
              notebook={nb}
              onOpen={onOpenNotebook}
              onRename={onRenameNotebook}
              onDelete={onDeleteNotebook}
              viewMode={viewMode}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default NotebookLibrary
