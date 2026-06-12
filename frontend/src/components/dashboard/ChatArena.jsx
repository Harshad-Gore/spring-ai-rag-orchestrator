import { useState, useRef, useEffect, useLayoutEffect, useCallback, memo, useMemo } from 'react'
import { Bot, ChevronDown, ChevronLeft, ChevronRight, Loader2, Send, Sparkles, User, Copy, RefreshCcw, Check } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { Button } from '../ui/button.jsx'
import CitationPill from './CitationPill.jsx'
import { useToast } from '../ui/toast.jsx'

// ---------------------------------------------------------------------------
// Elapsed timer shown while streaming
// ---------------------------------------------------------------------------
function ElapsedTimer({ isActive }) {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (!isActive) { setElapsed(0); return }
    const start = Date.now()
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 500)
    return () => clearInterval(id)
  }, [isActive])

  if (!isActive) return null
  return <span className="text-[10px] tabular-nums text-[#657069]">{elapsed}s</span>
}

function CodeBlock({ inline, className, children, ...props }) {
  const match = /language-(\w+)/.exec(className || '')
  const language = match ? match[1] : ''
  const codeText = String(children).replace(/\n$/, '')
  
  const { toast } = useToast()
  const [isCopied, setIsCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(codeText)
    setIsCopied(true)
    toast({ message: 'Code copied to clipboard!' })
    setTimeout(() => setIsCopied(false), 2000)
  }

  return inline ? (
    <code className="rounded-md bg-[#1a2a1f] px-1.5 py-0.5 font-mono text-[13px] text-[#7ef2b0]" {...props}>{children}</code>
  ) : (
    <div className="mb-4 overflow-hidden rounded-lg border border-[#242424] bg-[#0d0d0d]">
      <div className="flex items-center justify-between bg-[#141414] px-4 py-2 border-b border-[#242424]">
        <span className="text-xs font-medium text-[#657069]">{language || 'text'}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-[#657069] transition-colors hover:bg-white/5 hover:text-[#f0fdf4] cursor-pointer"
        >
          {isCopied ? <Check className="size-3.5 text-[#58d68d]" /> : <Copy className="size-3.5" />}
          {isCopied ? 'Copied' : 'Copy code'}
        </button>
      </div>
      <div className="text-[13px] leading-6 max-h-[500px] overflow-auto">
        <SyntaxHighlighter
          style={vscDarkPlus}
          language={language}
          PreTag="div"
          customStyle={{ margin: 0, padding: '1rem', background: 'transparent' }}
          {...props}
        >
          {codeText}
        </SyntaxHighlighter>
      </div>
    </div>
  )
}

// Defined outside component — never recreated on re-render
const MD_COMPONENTS = {
  h1: ({node, ...props}) => <h3 className="mt-4 mb-2 text-lg font-semibold text-white" {...props} />,
  h2: ({node, ...props}) => <h4 className="mt-4 mb-2 text-base font-semibold text-[#dffdee]/90" {...props} />,
  h3: ({node, ...props}) => <h5 className="mt-3 mb-1.5 text-sm font-medium text-[#dffdee]/80" {...props} />,
  p:  ({node, ...props}) => <p className="mb-3 last:mb-0" {...props} />,
  ul: ({node, ...props}) => <ul className="mb-3 space-y-1 pl-5 list-disc marker:text-[#dffdee]/40" {...props} />,
  ol: ({node, ...props}) => <ol className="mb-3 space-y-1 pl-5 list-decimal marker:text-[#dffdee]/40" {...props} />,
  li: ({node, ...props}) => <li {...props} />,
  strong: ({node, ...props}) => <strong className="font-semibold text-white" {...props} />,
  em: ({node, ...props}) => <em className="italic text-[#d8f3e8]" {...props} />,
  code: CodeBlock,
  table: ({node, ...props}) => <div className="mb-4 overflow-x-auto"><table className="min-w-full text-sm border-collapse" {...props} /></div>,
  th: ({node, ...props}) => <th className="border-b border-[#242424] p-3 text-left font-medium text-[#dffdee]/80" {...props} />,
  td: ({node, ...props}) => <td className="border-b border-[#242424]/50 p-3" {...props} />,
  blockquote: ({node, ...props}) => <blockquote className="border-l-2 border-[#58d68d]/30 pl-4 italic text-[#9aa39f] my-3" {...props} />,
}

// ---------------------------------------------------------------------------
// Single message bubble
// ---------------------------------------------------------------------------
const MessageBubble = memo(function MessageBubble({ variants, isStreaming, fadeIn = false, fadeDelay = 0, isLatestAssistant, onRegenerate }) {
  const [variantIndex, setVariantIndex] = useState(variants ? variants.length - 1 : 0)
  
  useEffect(() => {
    if (variants) {
      setVariantIndex(variants.length - 1)
    }
  }, [variants?.length])

  const msg = variants ? variants[variantIndex] : null
  if (!msg) return null

  const isUser = msg.role === 'user'
  const hasMultipleVariants = variants.length > 1

  return (
    <div
      className={['flex gap-3 group', isUser ? 'justify-end' : 'justify-start', fadeIn ? 'animate-fade-in' : ''].join(' ')}
      style={fadeIn ? { animationDelay: `${fadeDelay}ms` } : undefined}
    >
      {/* Avatar — assistant side */}
      {!isUser && (
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#1e3a28] to-[#0e1f16] border border-[#2a4a34] mt-0.5 shadow-[0_0_12px_rgba(94,234,141,0.08)]">
          <Bot aria-hidden="true" className="size-3.5 text-[#58d68d]" />
        </div>
      )}

      <div className={[
        'relative max-w-[82%] min-h-[44px] rounded-2xl px-4 py-3 text-sm leading-7',
        isUser
          ? 'rounded-tr-sm bg-gradient-to-br from-[#1a3023] to-[#142519] border border-[#2a4a34] text-[#e8f5ed] shadow-[0_2px_12px_rgba(0,0,0,0.3)]'
          : 'rounded-tl-sm bg-[#0f1710]/80 border border-[#1e2b20] text-[#c8cdc9] shadow-[0_2px_12px_rgba(0,0,0,0.3)] backdrop-blur-sm',
      ].join(' ')}>
        {isUser ? (
          <p className="whitespace-pre-wrap">{msg.content}</p>
        ) : (
          <div className="prose prose-invert prose-p:leading-7 prose-headings:text-white prose-a:text-[#58d68d] max-w-none text-sm text-[#c8cdc9]">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={MD_COMPONENTS}>
              {msg.content + (isStreaming ? ' ▍' : '')}
            </ReactMarkdown>
          </div>
        )}

        {/* Citations */}
        {!isUser && msg.citations && msg.citations.length > 0 && !isStreaming && (
          <div className="mt-4 flex flex-wrap gap-2 border-t border-white/[0.05] pt-3">
            <span className="w-full text-[10px] font-medium uppercase tracking-wider text-[#657069]">Sources</span>
            {msg.citations.map((cite, i) => (
              <CitationPill key={i} index={i + 1} source={cite.source} excerpt={cite.excerpt} />
            ))}
          </div>
        )}

        {/* Footer actions for assistant */}
        {!isUser && !isStreaming && (
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(msg.content)
                  const toastEl = document.createElement('div')
                  toastEl.className = 'fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-lg border border-[#1e3a2a]/60 bg-[#0e1f16]/95 px-4 py-3 text-[#dffdee] shadow-[0_8px_30px_rgb(0,0,0,0.5)] animate-fade-in'
                  toastEl.innerHTML = `<svg class="size-5 text-[#58d68d]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg><p class="text-sm font-medium">Text copied to clipboard!</p>`
                  document.body.appendChild(toastEl)
                  setTimeout(() => {
                    toastEl.style.opacity = '0'
                    toastEl.style.transition = 'opacity 0.3s'
                    setTimeout(() => toastEl.remove(), 300)
                  }, 2000)
                }}
                className="p-1.5 text-[#657069] hover:text-[#c8cdc9] hover:bg-white/5 rounded-md transition-colors cursor-pointer"
                title="Copy message text"
              >
                <Copy className="size-3.5" />
              </button>
              {isLatestAssistant && onRegenerate && (
                <button
                  onClick={onRegenerate}
                  className="p-1.5 text-[#657069] hover:text-[#58d68d] hover:bg-[#58d68d]/10 rounded-md transition-colors cursor-pointer"
                  title="Regenerate response"
                >
                  <RefreshCcw className="size-3.5" />
                </button>
              )}
            </div>
            
            {hasMultipleVariants && (
              <div className="flex items-center gap-1.5 text-xs font-medium text-[#657069]">
                <button 
                  onClick={() => setVariantIndex(Math.max(0, variantIndex - 1))}
                  disabled={variantIndex === 0}
                  className="p-1 hover:text-[#dffdee] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                >
                  <ChevronLeft className="size-3.5" />
                </button>
                <span>{variantIndex + 1} <span className="opacity-50">/</span> {variants.length}</span>
                <button 
                  onClick={() => setVariantIndex(Math.min(variants.length - 1, variantIndex + 1))}
                  disabled={variantIndex === variants.length - 1}
                  className="p-1 hover:text-[#dffdee] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                >
                  <ChevronRight className="size-3.5" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Avatar — user side */}
      {isUser && (
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#1a2e22] border border-[#2a4a34] mt-0.5">
          <User aria-hidden="true" className="size-3.5 text-[#dffdee]/60" />
        </div>
      )}
    </div>
  )
})

// ---------------------------------------------------------------------------
// Thinking indicator shown before first token arrives
// ---------------------------------------------------------------------------
function ThinkingBubble({ elapsed }) {
  return (
    <div className="flex gap-3 justify-start">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#1e3a28] to-[#0e1f16] border border-[#2a4a34] mt-0.5 shadow-[0_0_12px_rgba(94,234,141,0.08)]">
        <Bot aria-hidden="true" className="size-3.5 text-[#58d68d]" />
      </div>
      <div className="rounded-2xl rounded-tl-sm bg-[#0f1710]/80 border border-[#1e2b20] px-4 py-3.5 shadow-[0_2px_12px_rgba(0,0,0,0.3)]">
        <div className="flex items-center gap-3">
          <div className="flex items-end gap-1 h-4">
            <span className="w-1 rounded-full bg-[#58d68d]/60" style={{ height: '4px', animation: 'wave 1.2s ease-in-out infinite', animationDelay: '0ms' }} />
            <span className="w-1 rounded-full bg-[#58d68d]/60" style={{ height: '4px', animation: 'wave 1.2s ease-in-out infinite', animationDelay: '150ms' }} />
            <span className="w-1 rounded-full bg-[#58d68d]/60" style={{ height: '4px', animation: 'wave 1.2s ease-in-out infinite', animationDelay: '300ms' }} />
          </div>
          <span className="text-xs text-[#657069]">Generating response</span>
          <ElapsedTimer isActive />
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main ChatArena
// ---------------------------------------------------------------------------
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080').replace(/\/+$/, '')

function getStoredToken() {
  try { return localStorage.getItem('auth_token') } catch { return null }
}

const GROQ_MODELS = [
  { id: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B', tag: 'General', tagColor: '#58d68d' },
  { id: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B', tag: 'Fast', tagColor: '#5dade2' },
  { id: 'meta-llama/llama-4-scout-17b-16e-instruct', label: 'Llama 4 Scout', tag: 'Balanced', tagColor: '#f4d03f' },
  { id: 'openai/gpt-oss-120b', label: 'GPT-OSS 120B', tag: 'Reasoning', tagColor: '#af7ac5' },
  { id: 'openai/gpt-oss-20b', label: 'GPT-OSS 20B', tag: 'Efficient', tagColor: '#eb984e' },
]

function ChatArena({ chatHistory, onSendMessage, onRegenerate, pinnedDocIds, isLoading = false }) {
  const [inputValue, setInputValue] = useState('')
  const [selectedModel, setSelectedModel] = useState(() => {
    return localStorage.getItem('selected_model') || GROQ_MODELS[0].id
  })
  const [isThinking, setIsThinking] = useState(false)         // waiting for first token
  const [isStreaming, setIsStreaming] = useState(false)        // tokens arriving
  const [streamingMsgId, setStreamingMsgId] = useState(null)
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false)
  const chatEndRef = useRef(null)
  const inputRef = useRef(null)
  const abortRef = useRef(null)
  const modelDropdownRef = useRef(null)

  // Auto-resize textarea to fit content
  useEffect(() => {
    const el = inputRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = el.scrollHeight + 'px'
  }, [inputValue])

  useEffect(() => {
    function handleClickOutside(e) {
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(e.target)) {
        setIsModelDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    localStorage.setItem('selected_model', selectedModel)
  }, [selectedModel])

  const chatScrollRef = useRef(null)
  const isInitialLoad = useRef(true)
  const initialHistoryLength = useRef(0)
  const [historyReady, setHistoryReady] = useState(false)
  const [scrollReady, setScrollReady] = useState(false)
  const scrollRef = useRef(null)

  const groupedHistory = useMemo(() => {
    if (!chatHistory) return []
    const groups = []
    for (let i = 0; i < chatHistory.length; i++) {
      const msg = chatHistory[i]
      if (msg.role === 'user') {
        groups.push({ id: msg.id, role: 'user', variants: [msg] })
      } else {
        const lastGroup = groups[groups.length - 1]
        if (lastGroup && lastGroup.role === 'assistant') {
          lastGroup.variants.push(msg)
        } else {
          groups.push({ id: msg.id, role: 'assistant', variants: [msg] })
        }
      }
    }
    return groups
  }, [chatHistory])

  // Reset when a new notebook is opened (isLoading flips true)
  useEffect(() => {
    if (isLoading) {
      isInitialLoad.current = true
      setHistoryReady(false)
      setScrollReady(false)
    }
  }, [isLoading])

  // Jump to bottom instantly once history is ready
  useLayoutEffect(() => {
    if (!historyReady) return
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight
    }
    setScrollReady(true)
  }, [historyReady])

  // Gate rendering once history arrives or notebook is empty
  useEffect(() => {
    if (!isInitialLoad.current) return
    if (isLoading) return
    if (chatHistory.length > 0) {
      initialHistoryLength.current = chatHistory.length
      isInitialLoad.current = false
      setHistoryReady(true)
      return
    }
    clearTimeout(scrollRef.current)
    scrollRef.current = setTimeout(() => {
      if (isInitialLoad.current) {
        isInitialLoad.current = false
        setHistoryReady(true)
        setScrollReady(true)
      }
    }, 300)
  }, [chatHistory, isLoading])

  // Smooth scroll for new messages after initial load
  useEffect(() => {
    if (isInitialLoad.current) return
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatHistory, isThinking, isStreaming])

  const handleSend = useCallback(async () => {
    const trimmed = inputValue.trim()
    if (!trimmed || isThinking || isStreaming) return

    setInputValue('')
    setIsThinking(true)
    if (inputRef.current) inputRef.current.style.height = 'auto'

    const msgId = `stream-${Date.now()}`
    setStreamingMsgId(msgId)

    // Add user msg + empty placeholder for streaming response
    await onSendMessage(trimmed, selectedModel, msgId)
    setIsThinking(false)
    setIsStreaming(true)

    inputRef.current?.focus()
  }, [inputValue, isThinking, isStreaming, selectedModel, onSendMessage])

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const isEmpty = !chatHistory || chatHistory.length === 0
  const isBusy = isThinking || isStreaming
  const streamingMsg = streamingMsgId ? chatHistory.find(m => m.id === streamingMsgId) : null

  // Notify parent when streaming finishes
  useEffect(() => {
    if (!isStreaming) return
    if (streamingMsg && streamingMsg.done) {
      setIsStreaming(false)
      setStreamingMsgId(null)
    }
  }, [isStreaming, streamingMsg])

  return (
    <div className="flex h-full flex-col bg-[#080908]">
      {/* Wave animation keyframes injected inline */}
      <style>{`
        @keyframes wave {
          0%, 100% { height: 4px; }
          50% { height: 14px; }
        }
      `}</style>

      {/* ── Chat history ─────────────────────────────────────────── */}
      <div ref={chatScrollRef} className="flex-1 overflow-y-auto px-4 py-6 sm:px-8">
        {isEmpty && !isBusy ? (
          /* Empty state */
          <div className="flex h-full items-center justify-center">
            <div className="flex flex-col items-center gap-5 text-center">
              <div className="relative flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1e3a28] to-[#0a1810] border border-[#2a4a34] shadow-[0_0_30px_rgba(94,234,141,0.10)]">
                <Sparkles aria-hidden="true" className="size-7 text-[#58d68d]" />
              </div>
              <div>
                <p className="text-base font-semibold text-white">Ask anything</p>
                <p className="mt-1.5 max-w-xs text-sm text-[#657069] leading-5">
                  Ask questions and get answers grounded in your uploaded sources.
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                {['Summarize the key points', 'What are the main topics?', 'Explain the core concepts'].map(hint => (
                  <button
                    key={hint}
                    type="button"
                    onClick={() => { setInputValue(hint); inputRef.current?.focus() }}
                    className="cursor-pointer rounded-full border border-[#242424] bg-[#111] px-3 py-1.5 text-xs text-[#9aa39f] transition hover:border-[#2a4a34] hover:bg-[#0f1710] hover:text-[#dffdee]"
                  >
                    {hint}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-4xl space-y-6">
            {historyReady && groupedHistory.map((group, i) => {
              const hasStreamingVariant = group.variants.some(v => v.id === streamingMsgId)
              if (isThinking && hasStreamingVariant && !group.variants.find(v => v.id === streamingMsgId)?.content) return null
              const isLast = i === groupedHistory.length - 1
              return (
                <MessageBubble
                  key={group.id}
                  variants={group.variants}
                  isStreaming={isStreaming && hasStreamingVariant}
                  fadeIn={isLast && initialHistoryLength.current > 0}
                  fadeDelay={0}
                  isLatestAssistant={isLast && group.role === 'assistant'}
                  onRegenerate={() => {
                    const lastUserGroup = groupedHistory[i - 1]
                    if (onRegenerate && lastUserGroup?.role === 'user') {
                      onRegenerate(lastUserGroup.variants[0].content, selectedModel)
                    }
                  }}
                />
              )
            })}

            {/* Thinking state — no tokens yet */}
            {isThinking && <ThinkingBubble />}

            <div ref={chatEndRef} />
          </div>
        )}
      </div>

      {/* ── Input bar ────────────────────────────────────────────── */}
      <div className="shrink-0 border-t border-[#1a1a1a] bg-[#080908] px-4 py-3 sm:px-8">
        <div className="mx-auto max-w-4xl flex items-center gap-2 pb-2">
          <span className="text-[10px] font-medium uppercase tracking-wider text-[#657069]">Model</span>
          <div className="relative" ref={modelDropdownRef}>
            <button
              type="button"
              onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
              className="flex items-center gap-2 appearance-none cursor-pointer rounded-lg border border-[#242424] bg-[#111] px-3 py-1.5 text-xs font-medium text-[#c8cdc9] outline-none transition hover:border-[#3a3a3a] focus:border-[#2a4a34] focus:ring-1 focus:ring-[#58d68d]/20"
            >
              {GROQ_MODELS.find(m => m.id === selectedModel)?.label} — {GROQ_MODELS.find(m => m.id === selectedModel)?.tag}
              <ChevronDown className={`size-3.5 text-[#657069] transition-transform ${isModelDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isModelDropdownOpen && (
              <div className="absolute left-0 bottom-[calc(100%+0.5rem)] z-50 w-56 overflow-hidden rounded-xl border border-[#242424] bg-[#0f1210] shadow-[0_-10px_40px_rgba(0,0,0,0.8)] backdrop-blur-xl">
                <div className="p-1.5 space-y-0.5">
                  {GROQ_MODELS.map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        setSelectedModel(m.id)
                        setIsModelDropdownOpen(false)
                      }}
                      className={`flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition ${
                        selectedModel === m.id
                          ? 'bg-[#1a2e21] text-[#58d68d] font-medium'
                          : 'text-[#c8cdc9] hover:bg-[#161a17] hover:text-[#f0fdf4]'
                      }`}
                    >
                      {m.label}
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                        selectedModel === m.id ? 'bg-[#58d68d]/20 text-[#58d68d]' : 'bg-[#1a1a1a] text-[#657069]'
                      }`}>
                        {m.tag}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        <form
          onSubmit={(e) => { e.preventDefault(); handleSend() }}
          className="mx-auto flex max-w-4xl items-end gap-2"
        >
          <div className="relative flex-1">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isBusy ? 'Generating response…' : 'Ask about your sources…'}
              disabled={isBusy}
              rows={1}
              className="block max-h-48 min-h-[46px] w-full resize-none overflow-y-auto rounded-xl border border-white/[0.08] bg-[#0f1210]/95 px-4 py-3 text-sm font-medium text-[#f0fdf4] caret-[#58d68d] outline-none transition placeholder:text-[#4a5a4e] focus:border-[#2a4a34] focus:bg-[#0d1510] focus:ring-2 focus:ring-[#58d68d]/10 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <Button
            type="submit"
            variant="default"
            size="icon"
            disabled={!inputValue.trim() || isBusy}
            aria-label={isBusy ? 'Generating…' : 'Send message'}
            className="shrink-0 size-[46px] rounded-xl bg-[#1a3023] border-[#2a4a34] text-[#58d68d] hover:bg-[#1e3a2a] hover:border-[#3a6044] disabled:opacity-40"
          >
            {isBusy ? (
              <Loader2 aria-hidden="true" className="size-4 animate-spin" />
            ) : (
              <Send aria-hidden="true" className="size-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}

export default ChatArena
