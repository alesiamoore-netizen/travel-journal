import { useRef, useState, useCallback } from 'react'
import { useEditorStore } from '../../../store/editorStore'

export default function DrawingElement({ element }) {
  const { updateElement, selectedId } = useEditorStore()
  const { data, id } = element
  const strokes = data.strokes ?? []
  const strokeColor = data.strokeColor ?? '#2c2c2c'
  const strokeWidth = data.strokeWidth ?? 2

  const [drawing, setDrawing] = useState(false)
  const [liveStroke, setLiveStroke] = useState(null)
  const svgRef = useRef(null)
  const isSelected = selectedId === id

  const getPos = (e) => {
    const svg = svgRef.current
    if (!svg) return { x: 0, y: 0 }
    const rect = svg.getBoundingClientRect()
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    return {
      x: ((clientX - rect.left) / rect.width) * 100,
      y: ((clientY - rect.top) / rect.height) * 100,
    }
  }

  const onPointerDown = useCallback((e) => {
    if (!isSelected) return
    e.stopPropagation()
    e.preventDefault()
    const pt = getPos(e)
    setDrawing(true)
    setLiveStroke({ id: crypto.randomUUID(), points: [pt], color: strokeColor, width: strokeWidth })
    svgRef.current?.setPointerCapture(e.pointerId)
  }, [isSelected, strokeColor, strokeWidth])

  const onPointerMove = useCallback((e) => {
    if (!drawing) return
    e.preventDefault()
    const pt = getPos(e)
    setLiveStroke(s => s ? { ...s, points: [...s.points, pt] } : s)
  }, [drawing])

  const onPointerUp = useCallback((e) => {
    if (!drawing || !liveStroke) return
    setDrawing(false)
    if (liveStroke.points.length >= 2) {
      const newStrokes = [...strokes, liveStroke]
      updateElement(id, { data: { ...data, strokes: newStrokes } })
    }
    setLiveStroke(null)
  }, [drawing, liveStroke, strokes, id, data, updateElement])

  const toPath = (points) => {
    if (!points.length) return ''
    const [first, ...rest] = points
    return `M ${first.x} ${first.y} ` + rest.map(p => `L ${p.x} ${p.y}`).join(' ')
  }

  return (
    <div className="absolute inset-0" style={{ backgroundColor: data.backgroundColor ?? 'transparent' }}>
      <svg
        ref={svgRef}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="w-full h-full"
        style={{ cursor: isSelected ? 'crosshair' : 'default', touchAction: 'none' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        {strokes.map(s => (
          <path
            key={s.id}
            d={toPath(s.points)}
            stroke={s.color}
            strokeWidth={s.width * 0.3}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
        {liveStroke && (
          <path
            d={toPath(liveStroke.points)}
            stroke={liveStroke.color}
            strokeWidth={liveStroke.width * 0.3}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
      </svg>
      {isSelected && (
        <div className="absolute bottom-1 right-1 text-[9px] text-stone-400 bg-white/80 px-1 rounded pointer-events-none select-none">
          Draw to sketch
        </div>
      )}
    </div>
  )
}
