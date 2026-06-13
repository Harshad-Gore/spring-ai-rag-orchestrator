import { useState } from 'react'
import { X, Plus, Trash2, Tag as TagIcon } from 'lucide-react'

const COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6', 
  '#3b82f6', '#6366f1', '#a855f7', '#ec4899', '#f43f5e'
]

export default function ManageTagsModal({ isOpen, onClose, tags, onCreateTag, onDeleteTag }) {
  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState(COLORS[0])
  const [isCreating, setIsCreating] = useState(false)

  if (!isOpen) return null

  async function handleCreate(e) {
    e.preventDefault()
    if (!newTagName.trim()) return
    setIsCreating(true)
    await onCreateTag(newTagName.trim(), newTagColor)
    setNewTagName('')
    setNewTagColor(COLORS[0])
    setIsCreating(false)
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div
        className="w-full max-w-md scale-100 overflow-hidden rounded-xl border border-[#242424] bg-[#0d0d0d] shadow-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#242424] px-6 py-4">
          <h2 className="text-lg font-semibold text-white">Manage Tags</h2>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-[#657069] transition hover:bg-[#1a1a1a] hover:text-white"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6 space-y-2">
            <h3 className="text-sm font-medium text-[#c8cdc9]">Existing Tags</h3>
            {tags.length === 0 ? (
              <p className="text-xs text-[#657069]">No tags created yet.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <div
                    key={tag.id}
                    className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium"
                    style={{ backgroundColor: `${tag.colorHex}20`, color: tag.colorHex, border: `1px solid ${tag.colorHex}40` }}
                  >
                    <span>{tag.name}</span>
                    <button 
                      onClick={() => onDeleteTag(tag.id)}
                      className="ml-1 rounded-full p-0.5 hover:bg-black/20"
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <form onSubmit={handleCreate} className="space-y-4 rounded-lg border border-[#242424] bg-[#141414] p-4">
            <h3 className="text-sm font-medium text-[#c8cdc9]">Create New Tag</h3>
            
            <div className="space-y-2">
              <label className="text-xs text-[#657069]">Name</label>
              <input
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="e.g. Important"
                className="w-full rounded-lg border border-[#333] bg-[#0a0a0a] px-3 py-2 text-sm text-white placeholder-[#444] transition focus:border-[#58d68d] focus:outline-none"
                maxLength={20}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs text-[#657069]">Color</label>
              <div className="flex flex-wrap gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setNewTagColor(c)}
                    className={`size-6 rounded-full border-2 transition-all ${
                      newTagColor === c ? 'border-white scale-110' : 'border-transparent hover:scale-110'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={!newTagName.trim() || isCreating}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-[#58d68d] px-4 py-2 text-sm font-medium text-black transition hover:bg-[#4bc27f] disabled:opacity-50"
            >
              <Plus className="size-4" />
              {isCreating ? 'Creating...' : 'Create Tag'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
