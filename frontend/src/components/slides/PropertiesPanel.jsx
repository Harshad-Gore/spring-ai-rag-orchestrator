import { useState, useRef } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { HexColorPicker } from 'react-colorful'
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
  onUpdateAllSlidesBg,
  onUpdateSlideTitle,
}) {
  const theme = getTheme(themeKey)

  if (!activeSlide) {
    // Force Vite HMR reload
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
            onUpdateAllBg={onUpdateAllSlidesBg}
            onUpdateTitle={onUpdateSlideTitle}
          />
        )}
      </div>
    </div>
  )
}

// ─── Slide properties ─────────────────────────────────────────────
function SlideProperties({ slide, theme, onUpdateBg, onUpdateAllBg, onUpdateTitle }) {
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
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ColorInput
              value={slide.backgroundColor || theme.bg}
              onChange={(hex) => onUpdateBg(hex)}
            />
            <span className="text-[10px] text-[#657069] font-mono">#{slide.backgroundColor || theme.bg}</span>
          </div>
          <button
            onClick={() => onUpdateAllBg(slide.backgroundColor || theme.bg)}
            title="Apply to all slides"
            className="px-1.5 py-0.5 text-[9px] font-medium rounded border border-[#333] bg-[#1a1a1a] text-[#a2a8a5] hover:bg-[#242424] hover:text-[#eccb45] transition-colors"
          >
            Apply to all
          </button>
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
  const [isOpen, setIsOpen] = useState(false)
  const safeValue = value ? value.replace(/^#/, '') : '000000'
  const hexString = `#${safeValue}`
  
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-5 h-5 rounded border border-[#333] shrink-0 cursor-pointer hover:border-[#eccb45]/50 transition-colors"
        style={{ background: hexString }}
      />
      
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full right-0 sm:left-0 sm:right-auto mt-2 p-3 bg-[#111] border border-[#242424] rounded-xl shadow-2xl z-50 flex flex-col gap-3 w-[200px] animate-fade-in">
            
            {/* Interactive Color Spectrum */}
            <div className="rounded overflow-hidden border border-[#242424]">
              <HexColorPicker 
                color={hexString} 
                onChange={(color) => onChange(color.replace('#', ''))} 
                style={{ width: '100%', height: '140px' }}
              />
            </div>

            {/* Hex Input */}
            <div className="flex items-center gap-1.5 bg-[#1a1a1a] border border-[#333] rounded px-2 py-1.5 focus-within:border-[#eccb45]/50 transition-colors">
              <span className="text-[#657069] text-xs font-mono">#</span>
              <input
                type="text"
                value={safeValue}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9A-Fa-f]/g, '').slice(0, 6)
                  onChange(val)
                }}
                className="w-full bg-transparent text-xs text-white outline-none font-mono uppercase"
                placeholder="000000"
              />
            </div>
            
            {/* Predefined Swatches */}
            <div className="grid grid-cols-6 gap-1.5 mt-0.5">
              {[
                'ffffff', 'c8cdc9', '657069', '333333', '1a1a1a', '000000', 
                'eccb45', 'f1c40f', 'e67e22', 'e74c3c', '3498db', '9b59b6'
              ].map(c => (
                <button
                  key={c}
                  onClick={() => onChange(c)}
                  className="w-full aspect-square rounded border border-[#242424] hover:border-[#eccb45] hover:scale-110 transition-all cursor-pointer"
                  style={{ background: `#${c}` }}
                  title={`#${c}`}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
