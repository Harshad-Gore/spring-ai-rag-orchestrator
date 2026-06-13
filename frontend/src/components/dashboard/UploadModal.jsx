import { useState, useRef, useCallback } from 'react'
import { FileText, Globe, Link2, Loader2, Plus, Trash2, UploadCloud, X, Video } from 'lucide-react'
import { Button } from '../ui/button.jsx'

function isYouTubeUrl(url) {
  return /(?:youtube\.com\/watch|youtu\.be\/|youtube\.com\/shorts)/i.test(url)
}

function UploadModal({ onClose, onUpload, onAddUrl }) {
  const [files, setFiles] = useState([])
  const [dragging, setDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [activeTab, setActiveTab] = useState('files')
  const [urlInput, setUrlInput] = useState('')
  const [urls, setUrls] = useState([])
  const [isAddingUrl, setIsAddingUrl] = useState(false)
  const inputRef = useRef(null)
  const dragCounter = useRef(0)

  const addFiles = useCallback((newFiles) => {
    setFiles((prev) => {
      const existing = new Set(prev.map((f) => f.name + f.size))
      const unique = Array.from(newFiles).filter(
        (f) => !existing.has(f.name + f.size),
      )
      return [...prev, ...unique]
    })
  }, [])

  function handleDragEnter(e) {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current += 1
    setDragging(true)
  }

  function handleDragLeave(e) {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current -= 1
    if (dragCounter.current === 0) setDragging(false)
  }

  function handleDragOver(e) {
    e.preventDefault()
    e.stopPropagation()
  }

  function handleDrop(e) {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current = 0
    setDragging(false)
    if (e.dataTransfer.files?.length) {
      addFiles(e.dataTransfer.files)
    }
  }

  function handleInputChange(e) {
    if (e.target.files?.length) {
      addFiles(e.target.files)
    }
    e.target.value = ''
  }

  function removeFile(index) {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleUpload() {
    if (files.length > 0) {
      setIsUploading(true)
      try {
        await onUpload(files)
      } finally {
        setIsUploading(false)
      }
    }
  }

  async function handleAddUrl() {
    const trimmed = urlInput.trim()
    if (!trimmed || isAddingUrl) return
    setIsAddingUrl(true)
    try {
      const success = await onAddUrl(trimmed)
      if (success) {
        setUrls(prev => [...prev, trimmed])
        setUrlInput('')
      }
    } finally {
      setIsAddingUrl(false)
    }
  }

  function formatSize(bytes) {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={isUploading ? undefined : onClose}
    >
      <div
        className="mx-4 w-full max-w-lg overflow-hidden rounded-xl border border-[#242424] bg-[#0d0d0d] shadow-[0_24px_80px_rgba(0,0,0,0.6)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#242424] px-5 py-4">
          <h2 className="text-base font-semibold text-white">
            Upload Sources
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={isUploading}
            className="flex size-7 items-center justify-center rounded-md text-[#657069] transition hover:bg-white/[0.06] hover:text-white focus:outline-none focus:ring-2 focus:ring-[#b9f7d3]/25"
            aria-label="Close"
          >
            <X aria-hidden="true" className="size-4" />
          </button>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 border-b border-[#242424] px-5">
          {[{ id: 'files', label: 'Files', icon: FileText }, { id: 'weblink', label: 'Web Link', icon: Globe }].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={[
                'flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium transition border-b-2 -mb-px',
                activeTab === tab.id
                  ? 'border-[#58d68d] text-[#dffdee]'
                  : 'border-transparent text-[#657069] hover:text-[#9aa39f]'
              ].join(' ')}
            >
              <tab.icon aria-hidden="true" className="size-3.5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Body */}
        {activeTab === 'files' && (
          <div className="p-5">
            {/* Drop zone */}
            <div
              className={[
                'flex cursor-pointer use-native-cursor flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors duration-200',
                dragging
                  ? 'border-[#dffdee]/50 bg-[#dffdee]/[0.03]'
                  : 'border-[#2d2d2d] bg-[#0a0a0a] hover:border-[#3a3a3a]',
              ].join(' ')}
              onClick={() => inputRef.current?.click()}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <div className="flex size-12 items-center justify-center rounded-xl border border-[#2d2d2d] bg-[#111]">
                <UploadCloud
                  aria-hidden="true"
                  className={[
                    'size-5 transition-colors',
                    dragging ? 'text-[#dffdee]' : 'text-[#657069]',
                  ].join(' ')}
                />
              </div>
              <div>
                <p className="text-sm font-medium text-[#c8cdc9]">
                  Drag files here or click to browse
                </p>
                <p className="mt-1 text-xs text-[#657069]">
                  PDF, TXT, DOCX, MD — up to 25 MB each
                </p>
              </div>
              <input
                ref={inputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleInputChange}
                accept=".pdf,.txt,.docx,.md,.csv"
              />
            </div>

            {/* File list */}
            {files.length > 0 && (
              <div className="mt-4 max-h-48 space-y-1.5 overflow-y-auto">
                {files.map((file, i) => (
                  <div
                    key={`${file.name}-${file.size}-${i}`}
                    className="flex items-center gap-3 rounded-lg border border-[#1a1a1a] bg-[#111] px-3 py-2.5"
                  >
                    <FileText
                      aria-hidden="true"
                      className="size-4 shrink-0 text-[#dffdee]/50"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-[#c8cdc9]">
                        {file.name}
                      </p>
                      <p className="text-xs text-[#657069]">
                        {formatSize(file.size)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      className="flex size-6 shrink-0 items-center justify-center rounded-md text-[#657069] transition hover:bg-red-500/10 hover:text-red-400 focus:outline-none"
                      aria-label={`Remove ${file.name}`}
                    >
                      <Trash2 aria-hidden="true" className="size-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'weblink' && (
          <div className="p-5">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Link2 aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#657069]" />
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddUrl() } }}
                  placeholder="Paste a web URL or YouTube link..."
                  className="w-full rounded-lg border border-[#2d2d2d] bg-[#0a0a0a] pl-10 pr-4 py-2.5 text-sm text-[#c8cdc9] outline-none transition placeholder:text-[#4a5a4e] focus:border-[#2a4a34] focus:ring-1 focus:ring-[#58d68d]/20"
                />
              </div>
              <Button
                type="button"
                variant="default"
                onClick={handleAddUrl}
                disabled={!urlInput.trim() || isAddingUrl}
              >
                {isAddingUrl ? <Loader2 aria-hidden="true" className="size-4 animate-spin" /> : <Plus aria-hidden="true" className="size-4" />}
                Add
              </Button>
            </div>
            {urls.length > 0 && (
              <div className="mt-4 max-h-48 space-y-1.5 overflow-y-auto">
                {urls.map((u, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-lg border border-[#1a1a1a] bg-[#111] px-3 py-2.5">
                    {isYouTubeUrl(u) ? <Video aria-hidden="true" className="size-4 shrink-0 text-red-400" /> : <Globe aria-hidden="true" className="size-4 shrink-0 text-[#5dade2]" />}
                    <p className="min-w-0 flex-1 truncate text-sm text-[#c8cdc9]">{u}</p>
                    <button type="button" onClick={() => setUrls(prev => prev.filter((_, j) => j !== i))} className="flex size-6 shrink-0 items-center justify-center rounded-md text-[#657069] transition hover:bg-red-500/10 hover:text-red-400"><Trash2 aria-hidden="true" className="size-3.5" /></button>
                  </div>
                ))}
              </div>
            )}
            <p className="mt-3 text-xs text-[#657069]">Supports web pages, YouTube videos, documentation sites, and learning platforms.</p>
          </div>
        )}

        {/* Footer */}
        {activeTab === 'files' && (
          <div className="flex items-center justify-end gap-3 border-t border-[#242424] px-5 py-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isUploading}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="default"
              onClick={handleUpload}
              disabled={files.length === 0 || isUploading}
            >
              {isUploading ? (
                <Loader2 aria-hidden="true" className="size-4 animate-spin" />
              ) : (
                <UploadCloud aria-hidden="true" className="size-4" />
              )}
              {isUploading ? 'Uploading...' : `Upload ${files.length > 0 ? `(${files.length})` : ''}`}
            </Button>
          </div>
        )}

        {activeTab === 'weblink' && (
          <div className="flex items-center justify-end gap-3 border-t border-[#242424] px-5 py-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

export default UploadModal
