import { useRef, useEffect, useState, useCallback } from 'react'
import { Stage, Layer, Rect, Circle, Line, Image as KonvaImage, Transformer } from 'react-konva'
import EditableText from './EditableText.jsx'
import { getTheme } from '../../lib/slideThemes.js'
import { CANVAS_W, CANVAS_H, createImageElement } from '../../hooks/useSlideEditor.js'

/**
 * Core canvas component rendering the active slide via Konva.
 * Supports drag, resize, rotate for all element types.
 */
export default function SlideEditorCanvas({
  slide,
  themeKey,
  zoom,
  selectedElementId,
  onSelectElement,
  onUpdateElement,
  onDeleteElement,
  onAddElement,
}) {
  const containerRef = useRef(null)
  const stageRef = useRef(null)
  const [containerSize, setContainerSize] = useState({ w: 800, h: 450 })
  const theme = getTheme(themeKey)

  // Responsive resize
  useEffect(() => {
    if (!containerRef.current) return
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        setContainerSize({ w: width, h: height })
      }
    })
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  // Calculate scale to fit canvas in container while maintaining 16:9
  const padding = 48
  const availW = containerSize.w - padding * 2
  const availH = containerSize.h - padding * 2
  const fitScale = Math.min(availW / CANVAS_W, availH / CANVAS_H)
  const scale = fitScale * zoom

  const stageW = CANVAS_W * scale
  const stageH = CANVAS_H * scale
  const offsetX = Math.max(0, (containerSize.w - stageW) / 2)
  const offsetY = Math.max(0, (containerSize.h - stageH) / 2)

  // Deselect when clicking empty space
  const handleStageClick = useCallback((e) => {
    if (e.target === e.target.getStage() || e.target.attrs?.id === 'slide-bg') {
      onSelectElement(null)
    }
  }, [onSelectElement])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e) => {
      if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') return
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedElementId) {
          e.preventDefault()
          onDeleteElement(selectedElementId)
        }
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [selectedElementId, onDeleteElement])

  // Handle image paste / drop
  const handleImageFile = useCallback((file) => {
    if (!file || !file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = () => {
      const el = createImageElement(reader.result, {
        x: 200 + Math.random() * 200,
        y: 100 + Math.random() * 200,
      })
      onAddElement(el)
    }
    reader.readAsDataURL(file)
  }, [onAddElement])

  useEffect(() => {
    const handlePaste = (e) => {
      const items = e.clipboardData?.items
      if (!items) return
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          e.preventDefault()
          handleImageFile(item.getAsFile())
          return
        }
      }
    }
    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
  }, [handleImageFile])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    const files = e.dataTransfer?.files
    if (files) {
      for (const file of files) {
        if (file.type.startsWith('image/')) {
          handleImageFile(file)
          return
        }
      }
    }
  }, [handleImageFile])

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }, [])

  const slideBg = slide?.backgroundColor
    ? `#${slide.backgroundColor}`
    : `#${theme.bg}`

  if (!slide) {
    return (
      <div ref={containerRef} className="flex-1 flex items-center justify-center bg-[#090909]">
        <p className="text-sm text-[#657069]">Select a slide to edit</p>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-auto bg-[#090909] relative"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      style={{ cursor: 'default' }}
    >
      <div
        style={{
          position: 'absolute',
          left: offsetX,
          top: offsetY,
        }}
      >
        <Stage
          ref={stageRef}
          width={stageW}
          height={stageH}
          scaleX={scale}
          scaleY={scale}
          onClick={handleStageClick}
          onTap={handleStageClick}
          style={{
            borderRadius: '6px',
            boxShadow: '0 4px 40px rgba(0,0,0,0.6)',
          }}
        >
          <Layer>
            {/* Slide background */}
            <Rect
              id="slide-bg"
              x={0}
              y={0}
              width={CANVAS_W}
              height={CANVAS_H}
              fill={slideBg}
              cornerRadius={0}
              listening={true}
            />

            {/* Render elements */}
            {slide.elements.map((el) => {
              switch (el.type) {
                case 'text':
                  return (
                    <EditableText
                      key={el.id}
                      element={el}
                      isSelected={selectedElementId === el.id}
                      onSelect={() => onSelectElement(el.id)}
                      onChange={(updates) => onUpdateElement(el.id, updates)}
                      onDragEnd={(pos) => onUpdateElement(el.id, pos)}
                      onTransformEnd={(attrs) => onUpdateElement(el.id, attrs)}
                      themeBodyColor={theme.body}
                      stageRef={stageRef}
                      containerRef={containerRef}
                    />
                  )
                case 'rect':
                  return (
                    <ShapeElement
                      key={el.id}
                      element={el}
                      ShapeComponent={Rect}
                      shapeProps={{
                        cornerRadius: el.cornerRadius || 0,
                      }}
                      isSelected={selectedElementId === el.id}
                      onSelect={() => onSelectElement(el.id)}
                      onDragEnd={(pos) => onUpdateElement(el.id, pos)}
                      onTransformEnd={(attrs) => onUpdateElement(el.id, attrs)}
                    />
                  )
                case 'circle':
                  return (
                    <ShapeElement
                      key={el.id}
                      element={el}
                      ShapeComponent={Rect}
                      shapeProps={{
                        cornerRadius: Math.min(el.width, el.height) / 2,
                      }}
                      isSelected={selectedElementId === el.id}
                      onSelect={() => onSelectElement(el.id)}
                      onDragEnd={(pos) => onUpdateElement(el.id, pos)}
                      onTransformEnd={(attrs) => onUpdateElement(el.id, attrs)}
                    />
                  )
                case 'line':
                  return (
                    <LineElement
                      key={el.id}
                      element={el}
                      isSelected={selectedElementId === el.id}
                      onSelect={() => onSelectElement(el.id)}
                      onDragEnd={(pos) => onUpdateElement(el.id, pos)}
                    />
                  )
                case 'image':
                  return (
                    <ImageElement
                      key={el.id}
                      element={el}
                      isSelected={selectedElementId === el.id}
                      onSelect={() => onSelectElement(el.id)}
                      onDragEnd={(pos) => onUpdateElement(el.id, pos)}
                      onTransformEnd={(attrs) => onUpdateElement(el.id, attrs)}
                    />
                  )
                default:
                  return null
              }
            })}
          </Layer>
        </Stage>
      </div>
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────

function ShapeElement({ element, ShapeComponent, shapeProps = {}, isSelected, onSelect, onDragEnd, onTransformEnd }) {
  const shapeRef = useRef(null)
  const trRef = useRef(null)

  useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current])
      trRef.current.getLayer()?.batchDraw()
    }
  }, [isSelected])

  return (
    <>
      <ShapeComponent
        ref={shapeRef}
        id={element.id}
        x={element.x}
        y={element.y}
        width={element.width}
        height={element.height}
        rotation={element.rotation || 0}
        fill={element.fill ? `#${element.fill}` : '#333'}
        stroke={element.stroke ? `#${element.stroke}` : undefined}
        strokeWidth={element.strokeWidth || 0}
        opacity={element.opacity ?? 1}
        draggable
        onClick={onSelect}
        onTap={onSelect}
        onDragEnd={(e) => onDragEnd({ x: Math.round(e.target.x()), y: Math.round(e.target.y()) })}
        onTransformEnd={() => {
          const node = shapeRef.current
          if (!node) return
          const scaleX = node.scaleX()
          const scaleY = node.scaleY()
          node.scaleX(1)
          node.scaleY(1)
          onTransformEnd({
            x: Math.round(node.x()),
            y: Math.round(node.y()),
            width: Math.round(Math.max(10, node.width() * scaleX)),
            height: Math.round(Math.max(10, node.height() * scaleY)),
            rotation: Math.round(node.rotation()),
          })
        }}
        {...shapeProps}
      />
      {isSelected && (
        <Transformer
          ref={trRef}
          anchorSize={7}
          anchorCornerRadius={2}
          anchorStroke="#eccb45"
          anchorFill="#1a1a1a"
          borderStroke="#eccb45"
          borderStrokeWidth={1}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 10 || newBox.height < 10) return oldBox
            return newBox
          }}
        />
      )}
    </>
  )
}

function LineElement({ element, isSelected, onSelect, onDragEnd }) {
  return (
    <Line
      id={element.id}
      x={element.x}
      y={element.y}
      points={[0, 0, element.width || 300, 0]}
      stroke={element.stroke ? `#${element.stroke}` : '#c8cdc9'}
      strokeWidth={element.strokeWidth || 2}
      opacity={element.opacity ?? 1}
      draggable
      onClick={onSelect}
      onTap={onSelect}
      hitStrokeWidth={12}
      onDragEnd={(e) => onDragEnd({ x: Math.round(e.target.x()), y: Math.round(e.target.y()) })}
    />
  )
}

function ImageElement({ element, isSelected, onSelect, onDragEnd, onTransformEnd }) {
  const imgRef = useRef(null)
  const trRef = useRef(null)
  const [image, setImage] = useState(null)

  useEffect(() => {
    if (!element.src) return
    const img = new window.Image()
    img.onload = () => setImage(img)
    img.src = element.src
  }, [element.src])

  useEffect(() => {
    if (isSelected && trRef.current && imgRef.current) {
      trRef.current.nodes([imgRef.current])
      trRef.current.getLayer()?.batchDraw()
    }
  }, [isSelected])

  if (!image) return null

  return (
    <>
      <KonvaImage
        ref={imgRef}
        id={element.id}
        image={image}
        x={element.x}
        y={element.y}
        width={element.width}
        height={element.height}
        rotation={element.rotation || 0}
        opacity={element.opacity ?? 1}
        draggable
        onClick={onSelect}
        onTap={onSelect}
        onDragEnd={(e) => onDragEnd({ x: Math.round(e.target.x()), y: Math.round(e.target.y()) })}
        onTransformEnd={() => {
          const node = imgRef.current
          if (!node) return
          const scaleX = node.scaleX()
          const scaleY = node.scaleY()
          node.scaleX(1)
          node.scaleY(1)
          onTransformEnd({
            x: Math.round(node.x()),
            y: Math.round(node.y()),
            width: Math.round(Math.max(20, node.width() * scaleX)),
            height: Math.round(Math.max(20, node.height() * scaleY)),
            rotation: Math.round(node.rotation()),
          })
        }}
      />
      {isSelected && (
        <Transformer
          ref={trRef}
          anchorSize={7}
          anchorCornerRadius={2}
          anchorStroke="#eccb45"
          anchorFill="#1a1a1a"
          borderStroke="#eccb45"
          borderStrokeWidth={1}
          keepRatio
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 20 || newBox.height < 20) return oldBox
            return newBox
          }}
        />
      )}
    </>
  )
}
