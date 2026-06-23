import { useRef } from 'react'
import {
  Type, Square, Circle, Minus, ImagePlus, Undo2, Redo2,
  Download, Sparkles, ZoomIn, ZoomOut, ArrowUpToLine, ArrowDownToLine,
  Bold, Italic, AlignLeft, AlignCenter, AlignRight, Trash2, Palette, Loader2,
} from 'lucide-react'
import { THEMES } from '../../lib/slideThemes.js'
import {
  createTextElement, createRectElement, createCircleElement, createLineElement, createImageElement,
} from '../../hooks/useSlideEditor.js'

export default function SlideToolbar({
  selectedElement,
  themeKey,
  zoom,
  canUndo,
  canRedo,
  isGenerating,
  onAddElement,
  onUpdateElement,
  onDeleteElement,
  onBringToFront,
  onSendToBack,
  onSetTheme,
  onSetZoom,
  onUndo,
  onRedo,
  onExport,
  onGenerate,
}) {
  const fileInputRef = useRef(null)
  const colorInputRef = useRef(null)

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file || !file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = () => {
      onAddElement(createImageElement(reader.result))
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const handleColorChange = (e) => {
    if (!selectedElement) return
    const hex = e.target.value.replace('#', '')
    if (selectedElement.type === 'text') {
      onUpdateElement(selectedElement.id, { fill: hex })
    } else {
      onUpdateElement(selectedElement.id, { fill: hex })
    }
  }

  const toggleBold = () => {
    if (!selectedElement || selectedElement.type !== 'text') return
    const style = selectedElement.fontStyle || ''
    const hasBold = style.includes('bold')
    const newStyle = hasBold
      ? style.replace('bold', '').trim()
      : `bold ${style}`.trim()
    onUpdateElement(selectedElement.id, { fontStyle: newStyle })
  }

  const toggleItalic = () => {
    if (!selectedElement || selectedElement.type !== 'text') return
    const style = selectedElement.fontStyle || ''
    const hasItalic = style.includes('italic')
    const newStyle = hasItalic
      ? style.replace('italic', '').trim()
      : `${style} italic`.trim()
    onUpdateElement(selectedElement.id, { fontStyle: newStyle })
  }

  const setAlign = (align) => {
    if (!selectedElement || selectedElement.type !== 'text') return
    onUpdateElement(selectedElement.id, { textAlign: align })
  }

  const isText = selectedElement?.type === 'text'
  const curStyle = selectedElement?.fontStyle || ''

  return (
    <div className="h-10 shrink-0 border-b border-[#242424] bg-[#111] flex items-center px-3 gap-0.5 relative z-10">
      {/* Insert group */}
      <ToolGroup>
        <ToolBtn icon={Type} tip="Text" onClick={() => onAddElement(createTextElement())} />
        <ToolBtn icon={Square} tip="Rectangle" onClick={() => onAddElement(createRectElement())} />
        <ToolBtn icon={Circle} tip="Circle" onClick={() => onAddElement(createCircleElement())} />
        <ToolBtn icon={Minus} tip="Line" onClick={() => onAddElement(createLineElement())} />
        <ToolBtn
          icon={ImagePlus}
          tip="Image"
          onClick={() => fileInputRef.current?.click()}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageUpload}
        />
      </ToolGroup>

      <Divider />

      {/* Text formatting (only when text selected) */}
      {isText && (
        <>
          <ToolGroup>
            <ToolBtn icon={Bold} tip="Bold" active={curStyle.includes('bold')} onClick={toggleBold} />
            <ToolBtn icon={Italic} tip="Italic" active={curStyle.includes('italic')} onClick={toggleItalic} />
            <ToolBtn icon={AlignLeft} tip="Left" active={selectedElement.textAlign === 'left'} onClick={() => setAlign('left')} />
            <ToolBtn icon={AlignCenter} tip="Center" active={selectedElement.textAlign === 'center'} onClick={() => setAlign('center')} />
            <ToolBtn icon={AlignRight} tip="Right" active={selectedElement.textAlign === 'right'} onClick={() => setAlign('right')} />
          </ToolGroup>
          <Divider />
        </>
      )}

      {/* Element actions */}
      {selectedElement && (
        <>
          <ToolGroup>
            <ToolBtn
              icon={Palette}
              tip="Color"
              onClick={() => colorInputRef.current?.click()}
            />
            <input
              ref={colorInputRef}
              type="color"
              className="sr-only"
              value={`#${selectedElement.fill || '333333'}`}
              onChange={handleColorChange}
            />
            <ToolBtn icon={ArrowUpToLine} tip="Bring to front" onClick={() => onBringToFront(selectedElement.id)} />
            <ToolBtn icon={ArrowDownToLine} tip="Send to back" onClick={() => onSendToBack(selectedElement.id)} />
            <ToolBtn icon={Trash2} tip="Delete" onClick={() => onDeleteElement(selectedElement.id)} destructive />
          </ToolGroup>
          <Divider />
        </>
      )}

      {/* Theme picker */}
      <ToolGroup>
        <div className="relative group">
          <button
            className="flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-medium text-[#a2a8a5] hover:bg-[#242424] hover:text-white transition-colors"
            title="Theme"
          >
            <div className="w-3 h-3 rounded-full border border-[#333]" style={{ background: `#${THEMES[themeKey]?.accent || 'eccb45'}` }} />
            <span className="hidden sm:inline">{THEMES[themeKey]?.label || 'Theme'}</span>
          </button>
          {/* The before:* classes create an invisible bridge so the mouse doesn't fall into a gap and lose hover */}
          <div className="absolute left-0 top-full mt-1 w-36 bg-[#1a1a1a] border border-[#333] rounded-lg shadow-[0_8px_32px_rgba(0,0,0,0.8)] py-1 z-50 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity before:absolute before:-top-2 before:left-0 before:w-full before:h-2 before:content-['']">
            {Object.entries(THEMES).map(([key, t]) => (
              <button
                key={key}
                onClick={() => onSetTheme(key)}
                className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs transition-colors ${
                  key === themeKey ? 'text-white bg-[#242424]' : 'text-[#a2a8a5] hover:bg-[#242424] hover:text-white'
                }`}
              >
                <div className="flex gap-0.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: `#${t.bg}`, border: '1px solid #444' }} />
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: `#${t.accent}` }} />
                </div>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </ToolGroup>

      <Divider />

      {/* Undo/Redo */}
      <ToolGroup>
        <ToolBtn icon={Undo2} tip="Undo (Ctrl+Z)" disabled={!canUndo} onClick={onUndo} />
        <ToolBtn icon={Redo2} tip="Redo (Ctrl+Y)" disabled={!canRedo} onClick={onRedo} />
      </ToolGroup>

      <Divider />

      {/* Zoom */}
      <ToolGroup>
        <ToolBtn icon={ZoomOut} tip="Zoom out" onClick={() => onSetZoom(zoom - 0.15)} />
        <span className="text-[10px] text-[#657069] font-mono w-8 text-center select-none">{Math.round(zoom * 100)}%</span>
        <ToolBtn icon={ZoomIn} tip="Zoom in" onClick={() => onSetZoom(zoom + 0.15)} />
      </ToolGroup>

      {/* Right-aligned actions */}
      <div className="flex-1" />

      <ToolGroup>
        <button
          onClick={onGenerate}
          disabled={isGenerating}
          className="mr-2 flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-medium rounded bg-[#1a1a1a] border border-[#333] text-[#58d68d] hover:bg-[#242424] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
          AI Generate
        </button>
        <button
          onClick={onExport}
          className="mr-2 flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-medium rounded bg-[#eccb45] text-black hover:bg-[#d4b53b] transition-colors"
        >
          <Download className="w-3 h-3" />
          Export
        </button>
      </ToolGroup>
    </div>
  )
}

// ─── Tiny helpers ─────────────────────────────────────────────────

function ToolGroup({ children }) {
  return <div className="flex items-center gap-0.5">{children}</div>
}

function Divider() {
  return <div className="w-px h-5 bg-[#242424] mx-1.5 shrink-0" />
}

function ToolBtn({ icon: Icon, tip, active, disabled, destructive, onClick }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={tip}
      className={`p-1.5 rounded transition-colors ${
        active
          ? 'bg-[#eccb45]/20 text-[#eccb45]'
          : destructive
            ? 'text-[#657069] hover:bg-red-500/20 hover:text-red-400'
            : 'text-[#657069] hover:bg-[#242424] hover:text-white'
      } disabled:opacity-30 disabled:cursor-not-allowed`}
    >
      <Icon className="w-3.5 h-3.5" />
    </button>
  )
}
