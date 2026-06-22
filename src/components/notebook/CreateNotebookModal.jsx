import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNotebookStore } from '../../store/notebookStore'

const ACCENT_PRESETS = [
  { label: 'Amber',      color: '#c0813a' },
  { label: 'Sage',       color: '#4a7c59' },
  { label: 'Navy',       color: '#1e3a5f' },
  { label: 'Rose',       color: '#9d4f6a' },
  { label: 'Terracotta', color: '#b85c38' },
  { label: 'Slate',      color: '#4a5568' },
]

const PAGE_SIZES = [
  { value: '8x10',   label: '8 × 10"',            desc: 'Portrait — standard photo book' },
  { value: '8.5x11', label: '8.5 × 11"',           desc: 'Portrait — US letter' },
  { value: '11x8.5', label: '11 × 8.5" landscape',  desc: 'Landscape — panoramic views' },
]

export default function CreateNotebookModal({ onClose }) {
  const { create } = useNotebookStore()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [pageSize, setPageSize] = useState('8x10')
  const [accentColor, setAccentColor] = useState('#c0813a')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    const notebook = await create({ name: name.trim(), description, pageSize, accentColor })
    navigate(`/journal/${notebook.id}`)
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 pt-6 pb-4 border-b border-stone-100">
          <h2 className="text-xl font-bold text-stone-900">New Travel Journal</h2>
          <p className="text-sm text-stone-500 mt-1">Set up your trip notebook</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Trip name <span className="text-red-500">*</span>
            </label>
            <input
              autoFocus
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Portugal 2026"
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Description <span className="text-stone-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Lisbon, Porto, Sintra road trip"
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>

          {/* Page size */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">Page size</label>
            <div className="space-y-2">
              {PAGE_SIZES.map((ps) => (
                <label key={ps.value} className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="radio"
                    name="pageSize"
                    value={ps.value}
                    checked={pageSize === ps.value}
                    onChange={() => setPageSize(ps.value)}
                    className="mt-0.5 accent-amber-700"
                  />
                  <div>
                    <div className="text-sm font-medium text-stone-800 group-hover:text-stone-900">
                      {ps.label}
                    </div>
                    <div className="text-xs text-stone-500">{ps.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Accent color */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">Accent color</label>
            <div className="flex gap-2 flex-wrap items-center">
              {ACCENT_PRESETS.map((p) => (
                <button
                  key={p.color}
                  type="button"
                  title={p.label}
                  onClick={() => setAccentColor(p.color)}
                  className={`w-8 h-8 rounded-full transition-transform focus:outline-none ${
                    accentColor === p.color
                      ? 'scale-125 ring-2 ring-offset-2 ring-stone-400'
                      : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: p.color }}
                />
              ))}
              <div className="relative">
                <input
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="w-8 h-8 rounded-full cursor-pointer opacity-0 absolute inset-0"
                  title="Custom color"
                />
                <div
                  className="w-8 h-8 rounded-full border-2 border-dashed border-stone-300 flex items-center justify-center text-stone-400 text-xs pointer-events-none"
                  title="Custom color"
                >
                  +
                </div>
              </div>
            </div>
            {/* Preview stripe */}
            <div
              className="mt-3 h-1 rounded-full transition-colors"
              style={{ backgroundColor: accentColor }}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-stone-300 text-stone-700 py-2.5 rounded-lg text-sm font-medium hover:bg-stone-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || saving}
              className="flex-1 bg-amber-700 hover:bg-amber-800 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
            >
              {saving ? 'Creating…' : 'Create Journal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
