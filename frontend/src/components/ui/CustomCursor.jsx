import { useEffect, useState, useRef } from 'react'

export default function CustomCursor() {
  const [cursorType, setCursorType] = useState('normal')
  const [isVisible, setIsVisible] = useState(false)
  const [isClicking, setIsClicking] = useState(false)
  const [isHovering, setIsHovering] = useState(false)
  const [ripples, setRipples] = useState([])

  // Refs for direct DOM manipulation
  const mainCursorRef = useRef(null)
  const requestRef = useRef()
  
  // Tracking coordinates
  const mousePos = useRef({ x: -100, y: -100 })

  useEffect(() => {
    function onMouseMove(e) {
      mousePos.current = { x: e.clientX, y: e.clientY }
      if (!isVisible) setIsVisible(true)

      const target = e.target
      
      if (target.closest('input:disabled, button:disabled')) {
        setCursorType('unavailable')
        setIsHovering(false)
      } else if (target.closest('a, button, [role="button"], label, select, .cursor-pointer')) {
        setCursorType('link')
        setIsHovering(true)
      } else if (target.closest('input, textarea, [contenteditable="true"], .cursor-text')) {
        setCursorType('text')
        setIsHovering(true)
      } else if (target.closest('.cursor-move')) {
        setCursorType('move')
        setIsHovering(true)
      } else {
        setCursorType('normal')
        setIsHovering(false)
      }
    }

    function onMouseEnter() {
      setIsVisible(true)
    }

    function onMouseLeave(e) {
      if (!e.relatedTarget && !e.toElement) {
        setIsVisible(false)
      }
    }

    function onMouseDown(e) {
      setIsClicking(true)
      const newRipple = { id: Date.now(), x: e.clientX, y: e.clientY }
      setRipples(prev => [...prev, newRipple])
      setTimeout(() => {
        setRipples(prev => prev.filter(r => r.id !== newRipple.id))
      }, 500)
    }

    function onMouseUp() {
      setIsClicking(false)
    }

    window.addEventListener('mousemove', onMouseMove, { passive: true })
    document.addEventListener('mouseenter', onMouseEnter)
    document.addEventListener('mouseout', onMouseLeave)
    window.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mouseup', onMouseUp)

    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseenter', onMouseEnter)
      document.removeEventListener('mouseout', onMouseLeave)
      window.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [isVisible])

  // Animation Loop
  useEffect(() => {
    const renderLoop = () => {
      // Directly update DOM to avoid React re-renders (zero latency)
      if (mainCursorRef.current) {
        mainCursorRef.current.style.transform = `translate3d(${mousePos.current.x}px, ${mousePos.current.y}px, 0)`
      }
      requestRef.current = requestAnimationFrame(renderLoop)
    }
    requestRef.current = requestAnimationFrame(renderLoop)
    return () => cancelAnimationFrame(requestRef.current)
  }, [])

  if (typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches) {
    return null
  }
  
  return (
    <>
      {/* Click Ripples */}
      {ripples.map((ripple) => (
        <div
          key={ripple.id}
          className="pointer-events-none fixed top-0 left-0 z-[999997]"
          style={{ transform: `translate3d(${ripple.x}px, ${ripple.y}px, 0)` }}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-2.5 w-2.5 rounded-full border-[1.5px] border-[#58d68d]/40 bg-[#58d68d]/5 animate-[ping_0.5s_cubic-bezier(0.2,0.8,0.2,1)_forwards]" />
        </div>
      ))}

      {/* Main Sharp Cursor */}
      <div
        ref={mainCursorRef}
        className="pointer-events-none fixed top-0 left-0 z-[999999]"
        style={{ opacity: isVisible ? 1 : 0 }}
      >
        <div
          className="relative transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] will-change-transform"
          style={{
            width: 32,
            height: 32,
            marginTop: -5,
            marginLeft: -5,
            transform: isClicking ? 'scale(0.85)' : 'scale(1)',
            backgroundImage: `url(/cursors/${cursorType}.cur)`,
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'top left',
            filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))'
          }}
        />
      </div>
    </>
  )
}
