import { useState, useCallback, useEffect } from 'react'
import { Sparkles, LayoutTemplate, Loader2, Presentation } from 'lucide-react'
import { getStoredAuthToken } from '../../services/authApi.js'
import { useSlideEditor, uid, createTextElement, createSlide } from '../../hooks/useSlideEditor.js'
import { getTheme } from '../../lib/slideThemes.js'
import { exportSlidesToPPTX } from '../../lib/pptxExport.js'
import SlideEditorCanvas from '../slides/SlideEditorCanvas.jsx'
import SlideToolbar from '../slides/SlideToolbar.jsx'
import SlideThumbnailPanel from '../slides/SlideThumbnailPanel.jsx'
import PropertiesPanel from '../slides/PropertiesPanel.jsx'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080').replace(/\/+$/, '')

export default function SlidesArena({ notebookId, pinnedDocIds }) {
  const editor = useSlideEditor()
  const {
    state, activeSlide, selectedElement, canUndo, canRedo,
    addSlide, deleteSlide, duplicateSlide, setActiveSlide, reorderSlides,
    updateSlideBg, updateSlideTitle, addElement, updateElement, deleteElement,
    selectElement, bringToFront, sendToBack, setTheme, setZoom,
    loadAiSlides, startBlank, undo, redo,
  } = editor

  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState('')

  // ─── Keyboard shortcuts (Ctrl+Z / Ctrl+Y) ─────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') return
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault()
        undo()
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'Z'))) {
        e.preventDefault()
        redo()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [undo, redo])

  // ─── AI Generation ─────────────────────────────────────────────
  const handleGenerate = useCallback(async () => {
    setIsGenerating(true)
    setError('')
    try {
      const token = getStoredAuthToken()
      const res = await fetch(`${API_BASE_URL}/api/chat/stream-slides`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          query: 'Generate slides',
          notebookId,
          model: 'openai/gpt-oss-120b',
          pinnedDocIds: [...(pinnedDocIds || [])],
        }),
      })

      if (!res.ok) throw new Error('Failed to start stream')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let rawBuffer = ''
      let accumulatedText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        rawBuffer += decoder.decode(value, { stream: true })

        const blocks = rawBuffer.split('\n\n')
        rawBuffer = blocks.pop() ?? ''

        for (const block of blocks) {
          if (!block.trim()) continue
          const lines = block.split('\n')
          const eventType = lines.find(l => l.startsWith('event:'))?.slice(6).trim()
          const data = lines.find(l => l.startsWith('data:'))?.slice(5).trim() ?? ''

          if (eventType === 'token') {
            try { accumulatedText += JSON.parse(data) } catch { /* ignore */ }
          } else if (eventType === 'error') {
            throw new Error(data || 'Stream error')
          }
        }
      }

      // Parse JSON
      let rawJson = accumulatedText.trim()
      if (rawJson.startsWith('```json')) rawJson = rawJson.replace(/```json/g, '').replace(/```/g, '').trim()
      else if (rawJson.startsWith('```')) rawJson = rawJson.replace(/```/g, '').trim()

      let parsed = []
      try {
        parsed = JSON.parse(rawJson)
      } catch {
        // Try to heal truncated JSON
        let healed = rawJson
        let success = false
        while (healed.lastIndexOf('}') !== -1) {
          healed = healed.substring(0, healed.lastIndexOf('}') + 1)
          try {
            parsed = JSON.parse(healed + ']')
            success = true
            break
          } catch {
            healed = healed.substring(0, healed.length - 1)
          }
        }
        if (!success) throw new Error('AI output was too malformed to salvage.')
      }

      if (!Array.isArray(parsed)) throw new Error('AI did not return an array')

      // Convert AI output to canvas-compatible slides
      const theme = getTheme(state.themeKey)
      const newSlides = parsed.map((s, idx) => {
        const elements = []
        
        // Title element
        if (s.title) {
          elements.push(createTextElement({
            x: 50,
            y: 30,
            width: 860,
            height: 50,
            text: s.title,
            fontSize: 32,
            fontStyle: 'bold',
            fill: theme.title,
          }))
        }

        // Process AI elements
        if (Array.isArray(s.elements)) {
          let yOffset = 100
          for (const el of s.elements) {
            if (el.type === 'text') {
              elements.push(createTextElement({
                x: el.x || 50,
                y: el.y || yOffset,
                width: el.width || 860,
                height: el.height || 80,
                text: el.text || el.content || '',
                fontSize: el.fontSize || 18,
                fontStyle: el.fontStyle || '',
                fill: el.fill || el.color || theme.body,
                textAlign: el.textAlign || 'left',
              }))
              yOffset += (el.height || 80) + 10
            }
          }
        } else if (Array.isArray(s.bullets) || s.content) {
          // Fallback for old-schema AI output (bullets array or content string)
          const content = Array.isArray(s.bullets)
            ? s.bullets.map(b => `• ${b}`).join('\n')
            : (s.content || '')
          if (content) {
            elements.push(createTextElement({
              x: 50,
              y: 100,
              width: 860,
              height: 400,
              text: content,
              fontSize: 18,
              fill: theme.body,
            }))
          }
        }

        return createSlide({
          title: s.title || `Slide ${idx + 1}`,
          elements,
        })
      })

      loadAiSlides(newSlides)
    } catch (err) {
      console.error(err)
      setError('Failed to generate slides. ' + err.message)
    } finally {
      setIsGenerating(false)
    }
  }, [notebookId, pinnedDocIds, state.themeKey, loadAiSlides])

  // ─── PPTX Export ───────────────────────────────────────────────
  const handleExport = useCallback(async () => {
    try {
      const theme = getTheme(state.themeKey)
      await exportSlidesToPPTX(state.slides, theme, 'Presentation.pptx')
    } catch (err) {
      console.error('Export failed:', err)
      setError('Export failed: ' + err.message)
    }
  }, [state.slides, state.themeKey])

  // ─── Render: Start screen ─────────────────────────────────────
  if (!state.hasStarted) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full bg-[#0f0f0f] text-[#dffdee] p-8 overflow-y-auto">
        <div className="max-w-2xl w-full">
          <div className="mb-8 border-b border-[#242424] pb-6">
            <h1 className="text-xl font-semibold mb-2 text-white flex items-center gap-2">
              <Presentation className="w-5 h-5 text-[#eccb45]" />
              Presentation Builder
            </h1>
            <p className="text-[#a2a8a5] text-sm">
              Create slides directly from your uploaded documents. Let the AI extract the key points, or start with a blank deck.
              Drag, resize, and position elements on a real canvas — just like PowerPoint or Canva.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="group flex items-start gap-4 p-5 bg-[#111] border border-[#242424] rounded-lg hover:bg-[#1a1a1a] hover:border-[#333] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-left cursor-pointer"
            >
              <div className="mt-0.5">
                {isGenerating
                  ? <Loader2 className="w-5 h-5 text-[#58d68d] animate-spin" />
                  : <Sparkles className="w-5 h-5 text-[#58d68d]" />
                }
              </div>
              <div>
                <h3 className="text-white text-sm font-medium mb-1">Generate from Context</h3>
                <p className="text-[#657069] text-xs">AI reads your docs and builds an outline automatically.</p>
              </div>
            </button>

            <button
              onClick={startBlank}
              disabled={isGenerating}
              className="group flex items-start gap-4 p-5 bg-[#111] border border-[#242424] rounded-lg hover:bg-[#1a1a1a] hover:border-[#333] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-left cursor-pointer"
            >
              <div className="mt-0.5">
                <LayoutTemplate className="w-5 h-5 text-[#eccb45]" />
              </div>
              <div>
                <h3 className="text-white text-sm font-medium mb-1">Start Blank</h3>
                <p className="text-[#657069] text-xs">Build your presentation slides entirely from scratch.</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ─── Render: Editor ────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full w-full bg-[#0f0f0f] text-[#dffdee] overflow-hidden">
      {error && (
        <div className="px-3 py-1.5 bg-red-500/10 border-b border-red-500/20 text-red-400 text-[10px] flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-red-400 hover:text-white text-xs">✕</button>
        </div>
      )}

      {/* Toolbar */}
      <SlideToolbar
        selectedElement={selectedElement}
        themeKey={state.themeKey}
        zoom={state.zoom}
        canUndo={canUndo}
        canRedo={canRedo}
        isGenerating={isGenerating}
        onAddElement={addElement}
        onUpdateElement={updateElement}
        onDeleteElement={deleteElement}
        onBringToFront={bringToFront}
        onSendToBack={sendToBack}
        onSetTheme={setTheme}
        onSetZoom={setZoom}
        onUndo={undo}
        onRedo={redo}
        onExport={handleExport}
        onGenerate={handleGenerate}
      />

      {/* Three-panel layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Thumbnails */}
        <SlideThumbnailPanel
          slides={state.slides}
          activeSlideId={state.activeSlideId}
          themeKey={state.themeKey}
          onSetActiveSlide={setActiveSlide}
          onAddSlide={addSlide}
          onDeleteSlide={deleteSlide}
          onDuplicateSlide={duplicateSlide}
          onReorderSlides={reorderSlides}
        />

        {/* Center: Canvas */}
        <SlideEditorCanvas
          slide={activeSlide}
          themeKey={state.themeKey}
          zoom={state.zoom}
          selectedElementId={state.selectedElementId}
          onSelectElement={selectElement}
          onUpdateElement={updateElement}
          onDeleteElement={deleteElement}
          onAddElement={addElement}
        />

        {/* Right: Properties */}
        <PropertiesPanel
          selectedElement={selectedElement}
          activeSlide={activeSlide}
          themeKey={state.themeKey}
          onUpdateElement={updateElement}
          onUpdateSlideBg={updateSlideBg}
          onUpdateSlideTitle={updateSlideTitle}
        />
      </div>
    </div>
  )
}
