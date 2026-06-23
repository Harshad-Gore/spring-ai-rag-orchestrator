import { useState, useRef, useCallback } from 'react'
import { Plus, Trash2, Copy, GripVertical } from 'lucide-react'
import { getTheme } from '../../lib/slideThemes.js'

/**
 * Left sidebar showing draggable slide thumbnails.
 * Supports reorder via drag-and-drop, duplicate, and delete.
 */
export default function SlideThumbnailPanel({
  slides,
  activeSlideId,
  themeKey,
  onSetActiveSlide,
  onAddSlide,
  onDeleteSlide,
  onDuplicateSlide,
  onReorderSlides,
}) {
  const theme = getTheme(themeKey)
  const [dragIdx, setDragIdx] = useState(null)
  const [dropIdx, setDropIdx] = useState(null)

  const handleDragStart = useCallback((e, idx) => {
    setDragIdx(idx)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', String(idx))
  }, [])

  const handleDragOver = useCallback((e, idx) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDropIdx(idx)
  }, [])

  const handleDrop = useCallback((e, idx) => {
    e.preventDefault()
    if (dragIdx === null || dragIdx === idx) {
      setDragIdx(null)
      setDropIdx(null)
      return
    }
    const reordered = [...slides]
    const [moved] = reordered.splice(dragIdx, 1)
    reordered.splice(idx, 0, moved)
    onReorderSlides(reordered)
    setDragIdx(null)
    setDropIdx(null)
  }, [dragIdx, slides, onReorderSlides])

  const handleDragEnd = useCallback(() => {
    setDragIdx(null)
    setDropIdx(null)
  }, [])

  return (
    <div className="w-52 shrink-0 bg-[#0a0a0a] border-r border-[#1a1a1a] flex flex-col h-full">
      {/* Header */}
      <div className="px-3 py-2 border-b border-[#1a1a1a] flex items-center justify-between">
        <span className="text-[10px] font-semibold text-[#657069] uppercase tracking-wider">Slides</span>
        <button
          onClick={() => onAddSlide()}
          className="p-1 hover:bg-[#242424] rounded text-[#657069] hover:text-white transition-colors"
          title="Add Slide"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Slide list */}
      <div className="flex-1 overflow-y-auto py-2 px-2 space-y-1.5">
        {slides.map((slide, idx) => {
          const isActive = slide.id === activeSlideId
          const isDragging = dragIdx === idx
          const isDropTarget = dropIdx === idx && dragIdx !== idx

          return (
            <div
              key={slide.id}
              draggable
              onDragStart={(e) => handleDragStart(e, idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDrop={(e) => handleDrop(e, idx)}
              onDragEnd={handleDragEnd}
              onClick={() => onSetActiveSlide(slide.id)}
              className={`
                group relative rounded-lg border transition-all cursor-pointer
                ${isDragging ? 'opacity-40' : ''}
                ${isDropTarget ? 'border-[#eccb45]' : ''}
                ${isActive
                  ? 'border-[#eccb45]/60 bg-[#1a1a1a]'
                  : 'border-[#1a1a1a] hover:border-[#333] bg-[#111]'
                }
              `}
            >
              {/* Slide number + grip */}
              <div className="flex items-center gap-1 px-2 pt-1.5">
                <GripVertical className="w-3 h-3 text-[#333] opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" />
                <span className="text-[9px] text-[#657069] font-mono">{idx + 1}</span>
                <span className="flex-1" />
                {/* Actions */}
                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => { e.stopPropagation(); onDuplicateSlide(slide.id) }}
                    className="p-0.5 text-[#657069] hover:text-white rounded transition-colors"
                    title="Duplicate"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDeleteSlide(slide.id) }}
                    className="p-0.5 text-[#657069] hover:text-red-400 rounded transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Thumbnail preview */}
              <div
                className="mx-2 mb-2 mt-1 rounded aspect-video overflow-hidden"
                style={{ background: slide.backgroundColor ? `#${slide.backgroundColor}` : `#${theme.bg}` }}
              >
                {/* Simplified mini-preview: just shows title text */}
                <div className="w-full h-full flex flex-col justify-center px-2">
                  <p
                    className="text-[6px] font-semibold truncate leading-tight"
                    style={{ color: `#${theme.title}` }}
                  >
                    {slide.title || 'Untitled'}
                  </p>
                  {slide.elements.length > 0 && (
                    <p
                      className="text-[4px] truncate mt-0.5 leading-tight"
                      style={{ color: `#${theme.body}` }}
                    >
                      {slide.elements.length} element{slide.elements.length !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )
        })}

        {slides.length === 0 && (
          <div className="text-center py-6">
            <p className="text-[10px] text-[#657069]">No slides yet</p>
          </div>
        )}
      </div>
    </div>
  )
}
