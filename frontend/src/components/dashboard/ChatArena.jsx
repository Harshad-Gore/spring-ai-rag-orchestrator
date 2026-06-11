import { useState, useRef, useEffect, useCallback } from 'react'
import { Bot, Loader2, Send, Sparkles, User } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Button } from '../ui/button.jsx'
import CitationPill from './CitationPill.jsx'

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

// ---------------------------------------------------------------------------
// Single message bubble
// ---------------------------------------------------------------------------
function MessageBubble({ msg, isStreaming }) {
  const isUser = msg.role === 'user'

  return (
    <div className={['flex gap-3 group', isUser ? 'justify-end' : 'justify-start'].join(' ')}>
      {/* Avatar — assistant side */}
      {!isUser && (
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#1e3a28] to-[#0e1f16] border border-[#2a4a34] mt-0.5 shadow-[0_0_12px_rgba(94,234,141,0.08)]">
          <Bot aria-hidden="true" className="size-3.5 text-[#58d68d]" />
        </div>
      )}

      <div className={[
        'relative max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-7',
        isUser
          ? 'rounded-tr-sm bg-gradient-to-br from-[#1a3023] to-[#142519] border border-[#2a4a34] text-[#e8f5ed] shadow-[0_2px_12px_rgba(0,0,0,0.3)]'
          : 'rounded-tl-sm bg-[#0f1710]/80 border border-[#1e2b20] text-[#c8cdc9] shadow-[0_2px_12px_rgba(0,0,0,0.3)] backdrop-blur-sm',
      ].join(' ')}>
        {isUser ? (
          <p className="whitespace-pre-wrap">{msg.content}</p>
        ) : (
          <div className="prose prose-invert prose-p:leading-7 prose-headings:text-white prose-a:text-[#58d68d] max-w-none text-sm text-[#c8cdc9]">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({node, ...props}) => <h3 className="mt-4 mb-2 text-lg font-semibold text-white" {...props} />,
                h2: ({node, ...props}) => <h4 className="mt-4 mb-2 text-base font-semibold text-[#dffdee]/90" {...props} />,
                h3: ({node, ...props}) => <h5 className="mt-3 mb-1.5 text-sm font-medium text-[#dffdee]/80" {...props} />,
                p: ({node, ...props}) => <p className="mb-3 last:mb-0" {...props} />,
                ul: ({node, ...props}) => <ul className="mb-3 space-y-1 pl-5 list-disc marker:text-[#dffdee]/40" {...props} />,
                ol: ({node, ...props}) => <ol className="mb-3 space-y-1 pl-5 list-decimal marker:text-[#dffdee]/40" {...props} />,
                li: ({node, ...props}) => <li className="" {...props} />,
                strong: ({node, ...props}) => <strong className="font-semibold text-white" {...props} />,
                em: ({node, ...props}) => <em className="italic text-[#d8f3e8]" {...props} />,
                code: ({node, inline, className, children, ...props}) => {
                  const match = /language-(\w+)/.exec(className || '')
                  return inline ? (
                    <code className="rounded-md bg-[#1a2a1f] px-1.5 py-0.5 font-mono text-[13px] text-[#7ef2b0]" {...props}>
                      {children}
                    </code>
                  ) : (
                    <div className="mb-4 overflow-hidden rounded-lg border border-[#242424] bg-[#0d0d0d]">
                      {match && <div className="bg-[#141414] px-4 py-1.5 text-xs font-medium text-[#657069] border-b border-[#242424]">{match[1]}</div>}
                      <pre className="overflow-x-auto p-4 text-[13px] leading-6 text-[#e8f5ed] m-0 bg-transparent">
                        <code className="font-mono bg-transparent p-0" {...props}>{children}</code>
                      </pre>
                    </div>
                  )
                },
                table: ({node, ...props}) => <div className="mb-4 overflow-x-auto"><table className="min-w-full text-sm border-collapse" {...props} /></div>,
                th: ({node, ...props}) => <th className="border-b border-[#242424] p-3 text-left font-medium text-[#dffdee]/80" {...props} />,
                td: ({node, ...props}) => <td className="border-b border-[#242424]/50 p-3" {...props} />,
                blockquote: ({node, ...props}) => <blockquote className="border-l-2 border-[#58d68d]/30 pl-4 italic text-[#9aa39f] my-3" {...props} />
              }}
            >
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
      </div>

      {/* Avatar — user side */}
      {isUser && (
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#1a2e22] border border-[#2a4a34] mt-0.5">
          <User aria-hidden="true" className="size-3.5 text-[#dffdee]/60" />
        </div>
      )}
    </div>
  )
}

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

function ChatArena({ chatHistory, onSendMessage }) {
  const [inputValue, setInputValue] = useState('')
  const [isThinking, setIsThinking] = useState(false)         // waiting for first token
  const [isStreaming, setIsStreaming] = useState(false)        // tokens arriving
  const [streamingMsgId, setStreamingMsgId] = useState(null)
  const chatEndRef = useRef(null)
  const inputRef = useRef(null)
  const abortRef = useRef(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatHistory, isThinking, isStreaming])

  const handleSend = useCallback(async () => {
    const trimmed = inputValue.trim()
    if (!trimmed || isThinking || isStreaming) return

    setInputValue('')
    setIsThinking(true)

    const msgId = `stream-${Date.now()}`
    setStreamingMsgId(msgId)

    // Add user msg + empty placeholder for streaming response
    await onSendMessage(trimmed, msgId)
    setIsThinking(false)
    setIsStreaming(true)

    inputRef.current?.focus()
  }, [inputValue, isThinking, isStreaming, onSendMessage])

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
      <div className="flex-1 overflow-y-auto scroll-smooth px-4 py-6 sm:px-8">
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
            {chatHistory.map((msg) => {
              // Hide the empty placeholder while we are in the initial 'Thinking' state
              if (isThinking && msg.id === streamingMsgId && !msg.content) return null

              return (
                <MessageBubble
                  key={msg.id}
                  msg={msg}
                  isStreaming={isStreaming && msg.id === streamingMsgId}
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
              className="block max-h-36 min-h-[46px] w-full resize-none rounded-xl border border-white/[0.08] bg-[#0f1210]/95 px-4 py-3 text-sm font-medium text-[#f0fdf4] caret-[#58d68d] outline-none transition placeholder:text-[#4a5a4e] focus:border-[#2a4a34] focus:bg-[#0d1510] focus:ring-2 focus:ring-[#58d68d]/10 disabled:cursor-not-allowed disabled:opacity-50"
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
