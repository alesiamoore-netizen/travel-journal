import { useState } from 'react'
import { LAYOUTS, LAYOUT_CATEGORIES } from '../../data/layouts'
import { useEditorStore } from '../../store/editorStore'

const COLS = 12
const ROWS = 16
const SW = 60
const SH = 80
const GAP = 0.8

const TYPE_COLOR = { image: '#c0813a', text: '#d6d3d1', map: '#8db4a0' }

function LayoutThumbnail({ elements }) {
  if (elements.length === 0) {
    return (
      <svg viewBox={`0 0 ${SW} ${SH}`} className="w-full h-full">
        <rect x="0" y="0" width={SW} height={SH} fill="#fafaf9" />
        <rect x="1" y="1" width={SW - 2} height={SH - 2} fill="none" stroke="#d6d3d1" strokeWidth="1" strokeDasharray="3 2" />
        <text x={SW / 2} y={SH / 2 + 3} textAnchor="middle" fontSize="8" fill="#c4c0bb">Blank</text>
      </svg>
    )
  }

  return (
    <svg viewBox={`0 0 ${SW} ${SH}`} className="w-full h-full">
      <rect x="0" y="0" width={SW} height={SH} fill="#fafaf9" />
      {elements.map((el, i) => {
        const x = (el.grid.x / COLS) * SW + GAP / 2
        const y = (el.grid.y / ROWS) * SH + GAP / 2
        const w = (el.grid.w / COLS) * SW - GAP
        const h = (el.grid.h / ROWS) * SH - GAP

        if (el.type === 'text') {
          const lineCount = Math.min(Math.floor(h / 5), 7)
          return (
            <g key={i}>
              <rect x={x} y={y} width={w} height={h} fill="#f5f5f4" />
              {Array.from({ length: lineCount }, (_, j) => (
                <line
                  key={j}
                  x1={x + 2} y1={y + 4 + j * 5}
                  x2={j % 3 === 2 ? x + w * 0.55 : x + w - 2} y2={y + 4 + j * 5}
                  stroke="#c4c0bb" strokeWidth="1.2" strokeLinecap="round"
                />
              ))}
            </g>
          )
        }

        if (el.type === 'map') {
          return (
            <g key={i}>
              <rect x={x} y={y} width={w} height={h} fill="#8db4a0" />
              <polyline
                points={`${x + 4},${y + h * 0.75} ${x + w * 0.3},${y + h * 0.45} ${x + w * 0.6},${y + h * 0.55} ${x + w - 4},${y + h * 0.2}`}
                fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.65"
              />
            </g>
          )
        }

        return (
          <g key={i}>
            <rect x={x} y={y} width={w} height={h} fill="#c0813a" opacity="0.75" />
            <rect
              x={x + w * 0.25} y={y + h * 0.2}
              width={w * 0.5} height={h * 0.6}
              fill="#e8a96a" opacity="0.35" rx="1"
            />
          </g>
        )
      })}
    </svg>
  )
}

export default function LayoutPicker({ onClose }) {
  const { elements, applyLayout } = useEditorStore()
  const [category, setCategory] = useState('All')
  const [confirming, setConfirming] = useState(null)

  const filtered = category === 'All' ? LAYOUTS : LAYOUTS.filter(l => l.category === category)

  const handleSelect = (layout) => {
    if (elements.length > 0 && layout.elements.length > 0) {
      setConfirming(layout)
    } else {
      applyLayout(layout)
      onClose()
    }
  }

  const handleConfirm = () => {
    if (confirming) { applyLayout(confirming); onClose() }
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col"
        style={{ maxHeight: '88vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-stone-100 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="font-semibold text-stone-900 text-lg">Choose a Layout</h2>
            <p className="text-xs text-stone-400 mt-0.5">Select a template — then move and resize any element to customize it</p>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-700 text-xl w-7 h-7 flex items-center justify-center rounded hover:bg-stone-100">✕</button>
        </div>

        {/* Category tabs */}
        <div className="flex gap-1 px-5 pt-3 pb-3 flex-shrink-0">
          {['All', ...LAYOUT_CATEGORIES].map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 py-1 text-xs rounded-full font-medium transition-colors ${
                category === cat
                  ? 'bg-amber-700 text-white'
                  : 'text-stone-500 hover:bg-stone-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto px-5 pb-5 min-h-0">
          <div className="grid grid-cols-4 gap-4">
            {filtered.map(layout => (
              <button
                key={layout.id}
                onClick={() => handleSelect(layout)}
                className="flex flex-col items-center gap-2 group"
              >
                <div className="w-full aspect-[3/4] rounded-lg overflow-hidden border-2 border-stone-200 group-hover:border-amber-500 transition-colors shadow-sm group-hover:shadow-md">
                  <LayoutThumbnail elements={layout.elements} />
                </div>
                <span className="text-xs text-stone-600 group-hover:text-amber-700 font-medium text-center leading-tight">
                  {layout.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Replace confirmation overlay */}
        {confirming && (
          <div className="absolute inset-0 bg-white/95 flex items-center justify-center rounded-xl z-10">
            <div className="text-center space-y-4 max-w-xs px-6">
              <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center mx-auto text-2xl">⊞</div>
              <p className="text-stone-900 font-semibold">Replace page content?</p>
              <p className="text-sm text-stone-500 leading-relaxed">
                The current elements on this page will be removed and replaced with the <strong>{confirming.name}</strong> layout.
              </p>
              <div className="flex gap-3 justify-center pt-1">
                <button
                  onClick={() => setConfirming(null)}
                  className="px-4 py-2 text-sm border border-stone-200 rounded-lg text-stone-600 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  className="px-4 py-2 text-sm bg-amber-700 text-white rounded-lg hover:bg-amber-800 font-medium"
                >
                  Apply Layout
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
