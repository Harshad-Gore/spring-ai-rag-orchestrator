import { useState, useRef, useEffect } from 'react'
import { Loader2, MessageSquareText, Send, User } from 'lucide-react'
import { Button } from '../ui/button.jsx'
import CitationPill from './CitationPill.jsx'

function ChatArena({ chatHistory, onSendMessage }) {
  const [inputValue, setInputValue] = useState('')
  const [isThinking, setIsThinking] = useState(false)
  const chatEndRef = useRef(null)
  const inputRef = useRef(null)

  // Auto-scroll on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatHistory])

  async function handleSend() {
    const trimmed = inputValue.trim()
    if (!trimmed || isThinking) return

    setIsThinking(true)
    setInputValue('')

    try {
      await onSendMessage(trimmed)
    } finally {
      setIsThinking(false)
      inputRef.current?.focus()
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    handleSend()
  }

  const isEmpty = !chatHistory || chatHistory.length === 0

  return (
    <div className="flex h-full flex-col bg-[#090909]">
      {/* Chat history */}
      <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
        {isEmpty ? (
          <div className="flex h-full items-center justify-center">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="flex size-14 items-center justify-center rounded-2xl border border-[#2d2d2d] bg-[#111]">
                <MessageSquareText
                  aria-hidden="true"
                  className="size-6 text-[#dffdee]/40"
                />
              </div>
              <div>
                <p className="text-base font-semibold text-white">
                  Ask a question
                </p>
                <p className="mt-1 text-sm text-[#657069]">
                  Chat with your uploaded sources to get insights.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-3xl space-y-5">
            {chatHistory.map((msg) => (
              <div
                key={msg.id}
                className={[
                  'flex gap-3',
                  msg.role === 'user' ? 'justify-end' : 'justify-start',
                ].join(' ')}
              >
                {msg.role === 'assistant' && (
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-[#2d2d2d] bg-[#111] mt-0.5">
                    <MessageSquareText
                      aria-hidden="true"
                      className="size-3.5 text-[#dffdee]/60"
                    />
                  </div>
                )}

                <div
                  className={[
                    'max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-6',
                    msg.role === 'user'
                      ? 'bg-[#1a2e22] text-[#e8f5ed]'
                      : 'bg-[#111] text-[#c8cdc9] border border-[#1a1a1a]',
                  ].join(' ')}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>

                  {/* Citations */}
                  {msg.citations && msg.citations.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2 border-t border-white/[0.06] pt-3">
                      {msg.citations.map((cite, i) => (
                        <CitationPill
                          key={i}
                          index={i + 1}
                          source={cite.source}
                          excerpt={cite.excerpt}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {msg.role === 'user' && (
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-[#2d2d2d] bg-[#1a2e22] mt-0.5">
                    <User
                      aria-hidden="true"
                      className="size-3.5 text-[#dffdee]/60"
                    />
                  </div>
                )}
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
        )}
      </div>

      {/* Fixed input bar */}
      <div className="shrink-0 border-t border-[#242424] bg-[#090909] px-4 py-3 sm:px-6">
        <form onSubmit={handleSubmit} className="mx-auto flex max-w-3xl items-end gap-2">
          <div className="relative flex-1">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your sources..."
              disabled={isThinking}
              rows={1}
              className="block max-h-32 min-h-[44px] w-full resize-none rounded-xl border border-white/10 bg-[#101211]/95 px-4 py-3 pr-12 text-sm font-medium text-[#f6fff9] caret-[#dffdee] outline-none transition placeholder:text-[#657069] focus:border-[#dffdee]/45 focus:bg-[#111512] focus:ring-2 focus:ring-[#b9f7d3]/15 disabled:cursor-not-allowed disabled:border-[#1c211f] disabled:bg-[#0c0e0d] disabled:text-[#68736d]"
            />
          </div>

          <Button
            type="submit"
            variant="default"
            size="icon"
            disabled={!inputValue.trim() || isThinking}
            aria-label={isThinking ? 'Sending...' : 'Send message'}
            className="shrink-0"
          >
            {isThinking ? (
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
