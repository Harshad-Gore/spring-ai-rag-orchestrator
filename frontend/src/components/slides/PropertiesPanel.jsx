import { useState, useRef } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { getTheme } from '../../lib/slideThemes.js'

/**
 * Right sidebar showing properties of the selected element or slide background.
 * Compact design matching the app's explorer aesthetic.
 */
export default function PropertiesPanel({
  selectedElement,
  activeSlide,
  themeKey,
  onUpdateElement,
  onUpdateSlideBg,
  onUpdateSlideTitle,
}) {
  const theme = getTheme(themeKey)

  if (!activeSlide) {
    return (
      <div className="w-56 shrink-0 bg-[#0a0a0a] border-l border-[#1a1a1a] flex items-center justify-center">
        <p className="text-[10px] text-[#657069]">No slide selected</p>
      </div>
    )
  }

  return (
    <div className="w-56 shrink-0 bg-[#0a0a0a] border-l border-[#1a1a1a] flex flex-col h-full overflow-y-auto">
      <div className="px-3 py-2 border-b border-[#1a1a1a]">
        <span className="text-[10px] font-semibold text-[#657069] uppercase tracking-wider">
          {selectedElement ? `${selectedElement.type} Properties` : 'Slide Properties'}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {selectedElement ? (
          <ElementProperties element={selectedElement} onUpdate={onUpdateElement} />
        ) : (
          <SlideProperties
            slide={activeSlide}
            theme={theme}
            onUpdateBg={onUpdateSlideBg}
            onUpdateTitle={onUpdateSlideTitle}
          />
        )}
      </div>
    </div>
  )
}

// ─── Slide properties ─────────────────────────────────────────────
function SlideProperties({ slide, theme, onUpdateBg, onUpdateTitle }) {
  return (
    <div className="p-3 space-y-3">
      <PropGroup label="Title">
        <input
          value={slide.title || ''}
          onChange={(e) => onUpdateTitle(slide.id, e.target.value)}
          className="w-full bg-[#1a1a1a] border border-[#333] rounded px-2 py-1 text-xs text-white outline-none focus:border-[#eccb45]/50 transition-colors"
          placeholder="Slide title..."
        />
      </PropGroup>
      <PropGroup label="Background">
        <div className="flex items-center gap-2">
          <ColorInput
            value={slide.backgroundColor || theme.bg}
            onChange={(hex) => onUpdateBg(hex)}
          />
          <span className="text-[10px] text-[#657069] font-mono">#{slide.backgroundColor || theme.bg}</span>
        </div>
      </PropGroup>
    </div>
  )
}

// ─── Element properties ───────────────────────────────────────────
function ElementProperties({ element, onUpdate }) {
  const update = (field, value) => onUpdate(element.id, { [field]: value })

  return (
    <div className="p-3 space-y-3">
      {/* Position */}
      <PropGroup label="Position">
        <div className="grid grid-cols-2 gap-1.5">
          <NumInput label="X" value={element.x} onChange={(v) => update('x', v)} />
          <NumInput label="Y" value={element.y} onChange={(v) => update('y', v)} />
        </div>
      </PropGroup>

      {/* Size */}
      <PropGroup label="Size">
        <div className="grid grid-cols-2 gap-1.5">
          <NumInput label="W" value={element.width} onChange={(v) => update('width', v)} />
          <NumInput label="H" value={element.height} onChange={(v) => update('height', v)} />
        </div>
      </PropGroup>

      {/* Rotation */}
      <PropGroup label="Transform">
        <div className="grid grid-cols-2 gap-1.5">
          <NumInput label="°" value={element.rotation || 0} onChange={(v) => update('rotation', v)} />
          <NumInput label="α" value={Math.round((element.opacity ?? 1) * 100)} onChange={(v) => update('opacity', v / 100)} min={0} max={100} />
        </div>
      </PropGroup>

      {/* Fill */}
      {element.type !== 'line' && element.type !== 'image' && (
        <PropGroup label="Fill">
          <div className="flex items-center gap-2">
            <ColorInput
              value={element.fill || '333333'}
              onChange={(hex) => update('fill', hex)}
            />
            <span className="text-[10px] text-[#657069] font-mono">#{element.fill || '333333'}</span>
          </div>
        </PropGroup>
      )}

      {/* Stroke */}
      {(element.type === 'rect' || element.type === 'circle' || element.type === 'line') && (
        <PropGroup label="Stroke">
          <div className="flex items-center gap-2">
            <ColorInput
              value={element.stroke || '000000'}
              onChange={(hex) => update('stroke', hex)}
            />
            <NumInput label="px" value={element.strokeWidth || 0} onChange={(v) => update('strokeWidth', v)} min={0} max={20} />
          </div>
        </PropGroup>
      )}

      {/* Corner radius */}
      {element.type === 'rect' && (
        <PropGroup label="Corners">
          <NumInput label="r" value={element.cornerRadius || 0} onChange={(v) => update('cornerRadius', v)} min={0} max={100} />
        </PropGroup>
      )}

      {/* Text-specific */}
      {element.type === 'text' && (
        <>
          <PropGroup label="Font">
            <select
              value={element.fontFamily || 'Inter, sans-serif'}
              onChange={(e) => update('fontFamily', e.target.value)}
              className="w-full bg-[#1a1a1a] border border-[#333] rounded px-2 py-1 text-xs text-white outline-none focus:border-[#eccb45]/50"
            >
              <option value="Inter, sans-serif">Inter</option>
              <option value="Arial, sans-serif">Arial</option>
              <option value="Georgia, serif">Georgia</option>
              <option value="Courier New, monospace">Courier New</option>
              <option value="Roboto, sans-serif">Roboto</option>
            </select>
          </PropGroup>
          <PropGroup label="Size">
            <NumInput label="px" value={element.fontSize || 20} onChange={(v) => update('fontSize', v)} min={8} max={120} />
          </PropGroup>
          <PropGroup label="Color">
            <div className="flex items-center gap-2">
              <ColorInput
                value={element.fill || 'c8cdc9'}
                onChange={(hex) => update('fill', hex)}
              />
              <span className="text-[10px] text-[#657069] font-mono">#{element.fill || 'c8cdc9'}</span>
            </div>
          </PropGroup>
        </>
      )}
    </div>
  )
}

// ─── Primitives ───────────────────────────────────────────────────

function PropGroup({ label, children }) {
  return (
    <div>
      <label className="text-[9px] font-semibold text-[#657069] uppercase tracking-wider mb-1 block">{label}</label>
      {children}
    </div>
  )
}

function NumInput({ label, value, onChange, min, max }) {
  return (
    <div className="flex items-center gap-1 bg-[#1a1a1a] border border-[#333] rounded px-1.5 py-1">
      <span className="text-[9px] text-[#657069] w-3 shrink-0">{label}</span>
      <input
        type="number"
        value={Math.round(value ?? 0)}
        onChange={(e) => {
          let v = parseInt(e.target.value, 10) || 0
          if (min !== undefined) v = Math.max(min, v)
          if (max !== undefined) v = Math.min(max, v)
          onChange(v)
        }}
        className="w-full bg-transparent text-xs text-white outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
    </div>
  )
}

function ColorInput({ value, onChange }) {
  const ref = useRef(null)
  return (
    <>
      <button
        onClick={() => ref.current?.click()}
        className="w-5 h-5 rounded border border-[#333] shrink-0 cursor-pointer hover:border-[#eccb45]/50 transition-colors"
        style={{ background: `#${value}` }}
      />
      <input
        ref={ref}
        type="color"
        value={`#${value}`}
        onChange={(e) => onChange(e.target.value.replace('#', ''))}
        className="sr-only"
      />
    </>
  )
}
