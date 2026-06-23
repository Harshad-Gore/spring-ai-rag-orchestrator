import { useState, useEffect, useRef, useCallback } from 'react'
import { Text, Transformer } from 'react-konva'

/**
 * A Konva Text element that supports inline editing via an HTML textarea overlay.
 * - Single click = select
 * - Double click = enter edit mode (shows a textarea positioned over the text)
 * - Blur / Enter = commit edit
 */
export default function EditableText({
  element,
  isSelected,
  onSelect,
  onChange,
  onDragEnd,
  onTransformEnd,
  themeBodyColor,
  stageRef,
  containerRef,
}) {
  const textRef = useRef(null)
  const trRef = useRef(null)
  const [isEditing, setIsEditing] = useState(false)

  const fillColor = element.fill
    ? `#${element.fill}`
    : themeBodyColor
      ? `#${themeBodyColor}`
      : '#c8cdc9'

  // Attach transformer when selected
  useEffect(() => {
    if (isSelected && trRef.current && textRef.current && !isEditing) {
      trRef.current.nodes([textRef.current])
      trRef.current.getLayer()?.batchDraw()
    }
  }, [isSelected, isEditing])

  const handleDblClick = useCallback(() => {
    if (!containerRef?.current || !stageRef?.current) return
    setIsEditing(true)

    const textNode = textRef.current
    if (!textNode) return

    // Hide the Konva text while we show the HTML textarea
    textNode.hide()
    if (trRef.current) trRef.current.hide()

    const stage = stageRef.current
    const stageBox = stage.container().getBoundingClientRect()
    const textPosition = textNode.absolutePosition()
    const absScale = textNode.getAbsoluteScale()

    const textarea = document.createElement('textarea')
    document.body.appendChild(textarea)

    textarea.value = element.text || ''
    textarea.style.position = 'fixed'
    textarea.style.zIndex = '100000'
    
    // Calculate position relative to viewport (fixed positioning is robust against scroll/offset issues)
    const areaTop = stageBox.top + textPosition.y
    const areaLeft = stageBox.left + textPosition.x

    textarea.style.top = `${areaTop}px`
    textarea.style.left = `${areaLeft}px`
    textarea.style.width = `${textNode.width() * absScale.x}px`
    textarea.style.height = `${textNode.height() * absScale.y + 2}px`
    textarea.style.fontSize = `${element.fontSize * absScale.y}px`
    textarea.style.fontFamily = element.fontFamily || 'Inter, sans-serif'
    textarea.style.fontWeight = (element.fontStyle || '').includes('bold') ? 'bold' : 'normal'
    textarea.style.fontStyle = (element.fontStyle || '').includes('italic') ? 'italic' : 'normal'
    textarea.style.textAlign = element.textAlign || 'left'
    textarea.style.color = fillColor
    textarea.style.background = 'rgba(0,0,0,0.7)'
    textarea.style.border = '1px solid #eccb45'
    textarea.style.borderRadius = '0px'
    textarea.style.padding = '0px'
    textarea.style.margin = '0px'
    textarea.style.outline = 'none'
    textarea.style.resize = 'none'
    textarea.style.overflow = 'hidden'
    textarea.style.lineHeight = '1.2'
    textarea.style.boxSizing = 'border-box'
    textarea.style.transformOrigin = 'left top'

    if (element.rotation) {
      textarea.style.transform = `rotateZ(${element.rotation}deg)`
    }

    textarea.focus()
    textarea.select()

    const cleanup = () => {
      const newText = textarea.value
      onChange({ text: newText })
      textarea.remove()
      textNode.show()
      if (trRef.current) trRef.current.show()
      setIsEditing(false)
    }

    textarea.addEventListener('blur', cleanup, { once: true })
    textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        textarea.blur()
      }
      // Shift+Enter for newline, Enter alone to commit
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        textarea.blur()
      }
    })

    // Auto-resize textarea
    textarea.addEventListener('input', () => {
      textarea.style.height = 'auto'
      textarea.style.height = textarea.scrollHeight + 'px'
    })
  }, [element, fillColor, onChange, containerRef, stageRef])

  return (
    <>
      <Text
        ref={textRef}
        id={element.id}
        x={element.x}
        y={element.y}
        width={element.width}
        height={element.height}
        rotation={element.rotation || 0}
        text={element.text || ''}
        fontSize={element.fontSize || 20}
        fontFamily={element.fontFamily || 'Inter, sans-serif'}
        fontStyle={element.fontStyle || ''}
        align={element.textAlign || 'left'}
        fill={fillColor}
        opacity={element.opacity ?? 1}
        draggable
        onClick={onSelect}
        onTap={onSelect}
        onDblClick={handleDblClick}
        onDblTap={handleDblClick}
        onDragEnd={(e) => {
          onDragEnd({
            x: Math.round(e.target.x()),
            y: Math.round(e.target.y()),
          })
        }}
        onTransformEnd={() => {
          const node = textRef.current
          if (!node) return
          const scaleX = node.scaleX()
          const scaleY = node.scaleY()
          node.scaleX(1)
          node.scaleY(1)
          onTransformEnd({
            x: Math.round(node.x()),
            y: Math.round(node.y()),
            width: Math.round(Math.max(20, node.width() * scaleX)),
            height: Math.round(Math.max(10, node.height() * scaleY)),
            rotation: Math.round(node.rotation()),
          })
        }}
      />
      {isSelected && !isEditing && (
        <Transformer
          ref={trRef}
          anchorSize={7}
          anchorCornerRadius={2}
          anchorStroke="#eccb45"
          anchorFill="#1a1a1a"
          borderStroke="#eccb45"
          borderStrokeWidth={1}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 20 || newBox.height < 10) return oldBox
            return newBox
          }}
        />
      )}
    </>
  )
}
