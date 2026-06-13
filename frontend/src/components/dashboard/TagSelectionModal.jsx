import { useState } from 'react'
import { X, CheckSquare, Square } from 'lucide-react'

export default function TagSelectionModal({ isOpen, onClose, notebook, allTags, onUpdateTags }) {
  // Local state for optimistic updates within the modal before saving
  const [selectedTagIds, setSelectedTagIds] = useState(() => new Set(notebook.tagIds || []))
  const [isSaving, setIsSaving] = useState(false)

  if (!isOpen) return null

  function toggleTag(tagId) {
    const next = new Set(selectedTagIds)
    if (next.has(tagId)) {
      next.delete(tagId)
    } else {
      next.add(tagId)
    }
    setSelectedTagIds(next)
  }

  async function handleSave() {
    setIsSaving(true)
    await onUpdateTags(Array.from(selectedTagIds))
    setIsSaving(false)
    onClose()
  }

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        onClose()
      }}
    >
      <div
        className="w-full max-w-sm scale-100 overflow-hidden rounded-xl border border-[#242424] bg-[#0d0d0d] shadow-2xl transition-all"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
        }}
      >
        <div className="flex items-center justify-between border-b border-[#242424] px-6 py-4">
          <h2 className="text-lg font-semibold text-white">Edit Tags</h2>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-[#657069] transition hover:bg-[#1a1a1a] hover:text-white"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-sm text-[#657069] mb-4">Select tags for <strong>{notebook.title}</strong></p>
          
          <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
            {allTags.length === 0 ? (
              <p className="text-sm text-[#657069]">No tags available. Create some in the Dashboard.</p>
            ) : (
              allTags.map((tag) => {
                const isSelected = selectedTagIds.has(tag.id)
                return (
                  <button
                    key={tag.id}
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      toggleTag(tag.id)
                    }}
                    className="flex w-full items-center justify-between rounded-lg border border-[#242424] bg-[#141414] px-3 py-2 text-sm transition hover:border-[#333]"
                  >
                    <div 
                      className="flex items-center gap-2 rounded-full px-2 py-0.5"
                      style={{ backgroundColor: `${tag.colorHex}20`, color: tag.colorHex, border: `1px solid ${tag.colorHex}40` }}
                    >
                      {tag.name}
                    </div>
                    {isSelected ? (
                      <CheckSquare className="size-4 text-[#58d68d]" />
                    ) : (
                      <Square className="size-4 text-[#657069]" />
                    )}
                  </button>
                )
              })
            )}
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 rounded-lg border border-[#333] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#1a1a1a]"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 rounded-lg bg-[#58d68d] px-4 py-2 text-sm font-medium text-black transition hover:bg-[#4bc27f] disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
