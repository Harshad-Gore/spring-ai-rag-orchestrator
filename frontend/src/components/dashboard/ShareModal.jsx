import { useState } from 'react'
import { Link, Copy, Check, Trash2, Globe, Shield, RefreshCw } from 'lucide-react'
import { Button } from '../ui/button.jsx'

function ShareModal({ notebook, onClose, onShare, onRevoke }) {
  const originalShareType = notebook?.shareType || 'READ_ONLY'
  const originalIncludeDocs = notebook?.sharedResources?.includes('DOCS') ?? true
  const originalIncludeChat = notebook?.sharedResources?.includes('CHAT') ?? false

  const [shareType, setShareType] = useState(originalShareType)
  const [includeDocs, setIncludeDocs] = useState(originalIncludeDocs)
  const [includeChat, setIncludeChat] = useState(originalIncludeChat)
  const [isCopied, setIsCopied] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  const isShared = !!notebook?.shareToken
  const shareUrl = isShared ? `${window.location.origin}/shared/${notebook.shareToken}` : ''
  const isSettingsUnchanged = isShared && shareType === originalShareType && includeDocs === originalIncludeDocs && includeChat === originalIncludeChat

  const handleGenerate = async () => {
    setIsGenerating(true)
    const resources = []
    if (includeDocs) resources.push('DOCS')
    if (includeChat) resources.push('CHAT')
    await onShare(shareType, resources.join(','))
    setIsGenerating(false)
  }

  const handleCopy = () => {
    if (!shareUrl) return
    navigator.clipboard.writeText(shareUrl)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-md rounded-2xl border border-[#242424] bg-[#0d0d0d] shadow-2xl flex flex-col overflow-hidden animate-slide-up">
        <div className="p-5 border-b border-[#242424]">
          <h2 className="text-lg font-semibold text-white">Share Notebook</h2>
          <p className="mt-1 text-sm text-[#657069]">Generate a link to share this notebook.</p>
        </div>

        <div className="p-5 space-y-6">
          {/* Share Type Selection */}
          <div className="space-y-3">
            <label className="text-xs font-medium uppercase tracking-wider text-[#9aa39f]">Access Level</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setShareType('READ_ONLY')}
                className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-all ${
                  shareType === 'READ_ONLY'
                    ? 'border-[#58d68d] bg-[#58d68d]/10 text-[#58d68d]'
                    : 'border-[#242424] bg-[#111] text-[#657069] hover:border-[#333] hover:bg-[#1a1a1a]'
                }`}
              >
                <Globe className="size-6" />
                <span className="text-sm font-medium">Read-Only</span>
              </button>
              <button
                type="button"
                onClick={() => setShareType('CLONE')}
                className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-all ${
                  shareType === 'CLONE'
                    ? 'border-[#58d68d] bg-[#58d68d]/10 text-[#58d68d]'
                    : 'border-[#242424] bg-[#111] text-[#657069] hover:border-[#333] hover:bg-[#1a1a1a]'
                }`}
              >
                <RefreshCw className="size-6" />
                <span className="text-sm font-medium">Allow Clone</span>
              </button>
            </div>
          </div>

          {/* Resources Selection */}
          <div className="space-y-3">
            <label className="text-xs font-medium uppercase tracking-wider text-[#9aa39f]">Include Resources</label>
            <div className="space-y-2">
              <label className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-all ${includeDocs ? 'border-[#58d68d]/30 bg-[#58d68d]/5' : 'border-[#242424] bg-[#111] hover:border-[#333]'}`}>
                <input
                  type="checkbox"
                  checked={includeDocs}
                  onChange={(e) => setIncludeDocs(e.target.checked)}
                  className="size-4 rounded border-[#333] bg-[#0d0d0d] accent-[#58d68d] focus:ring-[#58d68d]/20"
                />
                <span className="text-sm font-medium text-white">Source Documents</span>
              </label>
              <label className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-all ${includeChat ? 'border-[#58d68d]/30 bg-[#58d68d]/5' : 'border-[#242424] bg-[#111] hover:border-[#333]'}`}>
                <input
                  type="checkbox"
                  checked={includeChat}
                  onChange={(e) => setIncludeChat(e.target.checked)}
                  className="size-4 rounded border-[#333] bg-[#0d0d0d] accent-[#58d68d] focus:ring-[#58d68d]/20"
                />
                <span className="text-sm font-medium text-white">Chat History</span>
              </label>
            </div>
          </div>

          {/* Link Section */}
          {isShared && (
            <div className="space-y-2">
              <label className="text-xs font-medium uppercase tracking-wider text-[#9aa39f]">Share Link</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="flex-1 rounded-lg border border-[#242424] bg-[#111] px-3 py-2 text-sm text-[#c8cdc9] outline-none"
                />
                <Button onClick={handleCopy} variant="outline" className="shrink-0">
                  {isCopied ? <Check className="size-4 text-[#58d68d]" /> : <Copy className="size-4" />}
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-[#242424] bg-[#090909] p-5">
          {isShared ? (
            <Button
              variant="outline"
              onClick={onRevoke}
              className="text-red-400 hover:bg-red-500/10 hover:text-red-300 border-red-500/20"
            >
              <Shield className="size-4 mr-2" />
              Revoke Access
            </Button>
          ) : (
            <div /> // Spacer
          )}
          <div className="flex gap-3">
            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>
            <Button onClick={handleGenerate} disabled={isGenerating || isSettingsUnchanged}>
              {isGenerating ? 'Generating...' : isShared ? 'Update Link' : 'Generate Link'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ShareModal
