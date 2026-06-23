import { useState } from 'react'
import { X, FileJson, BookOpen, AlertCircle } from 'lucide-react'

export default function SlideImportModal({ onClose, onImport }) {
  const [activeTab, setActiveTab] = useState('import')
  const [jsonText, setJsonText] = useState('')
  const [error, setError] = useState('')

  const handleImport = () => {
    setError('')
    if (!jsonText.trim()) {
      setError('Please paste JSON code to import.')
      return
    }
    
    try {
      const parsed = JSON.parse(jsonText)
      if (!Array.isArray(parsed)) {
        throw new Error('Root level must be an array of slides.')
      }
      onImport(parsed)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
      <div className="flex flex-col w-full max-w-4xl h-[80vh] bg-[#0f0f0f] border border-[#242424] rounded-xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between border-b border-[#242424] px-4 py-3 bg-[#111]">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <FileJson className="w-4 h-4 text-[#eccb45]" />
            Import JSON Slides
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-[#242424] text-[#a2a8a5] hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="shrink-0 flex items-center gap-4 px-4 border-b border-[#242424] bg-[#0a0a0a]">
          <button
            onClick={() => setActiveTab('import')}
            className={`flex items-center gap-1.5 py-2.5 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'import' ? 'border-[#eccb45] text-[#eccb45]' : 'border-transparent text-[#a2a8a5] hover:text-white'
            }`}
          >
            <FileJson className="w-3.5 h-3.5" />
            Paste JSON
          </button>
          <button
            onClick={() => setActiveTab('docs')}
            className={`flex items-center gap-1.5 py-2.5 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'docs' ? 'border-[#eccb45] text-[#eccb45]' : 'border-transparent text-[#a2a8a5] hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Documentation
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col relative">
          {activeTab === 'import' ? (
            <div className="flex-1 p-4 flex flex-col gap-4">
              {error && (
                <div className="shrink-0 flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 p-2.5 rounded-lg text-xs">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}
              <textarea
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
                placeholder="Paste your JSON array of slides here..."
                className="flex-1 w-full bg-[#111] border border-[#242424] rounded-lg p-3 text-xs text-[#dffdee] font-mono resize-none focus:outline-none focus:border-[#eccb45]/50 transition-colors"
              />
              <div className="shrink-0 flex justify-end gap-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded text-xs font-medium border border-[#333] text-[#a2a8a5] hover:bg-[#1a1a1a] hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImport}
                  className="px-4 py-2 rounded text-xs font-medium bg-[#eccb45] text-black hover:bg-[#d4b53b] transition-colors"
                >
                  Import Slides
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-5 text-sm text-[#c8cdc9] space-y-6">
              
              <section>
                <h3 className="text-white font-semibold mb-2">JSON Schema Overview</h3>
                <p className="text-xs text-[#a2a8a5] leading-relaxed mb-3">
                  The JSON must be an array of slide objects. Each slide object should contain an array of `elements`. 
                  All Konva attributes (e.g., rotation, opacity, stroke, cornerRadius, fontStyle, fill) are fully supported.
                  The canvas size is <b>960x540</b>, so all `x`, `y`, `width`, and `height` properties should be relative to this space.
                </p>
                <pre className="bg-[#111] p-3 rounded-lg border border-[#242424] overflow-x-auto text-xs text-[#58d68d]">
{`[
  {
    "title": "Slide Title",
    "backgroundColor": "#1a1a1a", // Optional: Any slide-level property is fully supported!
    "elements": [
      // Array of element objects
    ]
  }
]`}
                </pre>
              </section>

              <section>
                <h3 className="text-white font-semibold mb-2">Supported Elements</h3>
                <div className="space-y-4">
                  
                  <div className="bg-[#111] border border-[#242424] rounded-lg p-3">
                    <h4 className="text-xs font-semibold text-[#eccb45] mb-1">Text</h4>
                    <pre className="text-[11px] text-[#a2a8a5] overflow-x-auto">
{`{
  "type": "text",
  "text": "Hello World",
  "x": 50, "y": 50, "width": 860, "height": 100,
  "fontSize": 32,
  "fontFamily": "Inter, sans-serif",
  "fontStyle": "bold", // "normal", "italic", "bold italic"
  "textAlign": "center", // "left", "center", "right"
  "fill": "#ffffff" // Text color
}`}
                    </pre>
                  </div>

                  <div className="bg-[#111] border border-[#242424] rounded-lg p-3">
                    <h4 className="text-xs font-semibold text-[#eccb45] mb-1">Image</h4>
                    <p className="text-[10px] text-[#657069] mb-2">If the image fails to load, a gray placeholder will be rendered.</p>
                    <pre className="text-[11px] text-[#a2a8a5] overflow-x-auto">
{`{
  "type": "image",
  "src": "https://example.com/image.png",
  "x": 200, "y": 150, "width": 400, "height": 300,
  "cornerRadius": 8 // Optional rounded corners
}`}
                    </pre>
                  </div>

                  <div className="bg-[#111] border border-[#242424] rounded-lg p-3">
                    <h4 className="text-xs font-semibold text-[#eccb45] mb-1">Rectangle</h4>
                    <pre className="text-[11px] text-[#a2a8a5] overflow-x-auto">
{`{
  "type": "rect",
  "x": 100, "y": 100, "width": 200, "height": 100,
  "fill": "#333333", // Background color
  "stroke": "#eccb45", // Border color
  "strokeWidth": 2,
  "cornerRadius": 8
}`}
                    </pre>
                  </div>

                  <div className="bg-[#111] border border-[#242424] rounded-lg p-3">
                    <h4 className="text-xs font-semibold text-[#eccb45] mb-1">Circle</h4>
                    <pre className="text-[11px] text-[#a2a8a5] overflow-x-auto">
{`{
  "type": "circle",
  "x": 480, "y": 270, // Center coordinates
  "width": 120, "height": 120, // Uses radius based on size
  "fill": "#e74c3c"
}`}
                    </pre>
                  </div>

                </div>
              </section>

              <section>
                <h3 className="text-white font-semibold mb-2">General Konva Properties</h3>
                <p className="text-xs text-[#a2a8a5] leading-relaxed">
                  All elements support additional properties such as: <br />
                  - <code className="text-[#eccb45]">rotation</code> (number in degrees) <br />
                  - <code className="text-[#eccb45]">opacity</code> (number between 0 and 1) <br />
                  - <code className="text-[#eccb45]">zIndex</code> (number to control stacking order)
                </p>
              </section>

            </div>
          )}
        </div>
      </div>
    </div>
  )
}
