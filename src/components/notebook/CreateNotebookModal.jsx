import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNotebookStore } from '../../store/notebookStore'
import { THEMES, THEME_CATEGORIES } from '../../data/themes'
import ThemeDetailModal from '../editor/ThemeDetailModal'

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
  const [themeCategory, setThemeCategory] = useState('Occasion')
  const [themeId, setThemeId] = useState('classic')
  const [saving, setSaving] = useState(false)
  const [previewThemeId, setPreviewThemeId] = useState(null)

  const theme = THEMES.find(t => t.id === themeId) ?? THEMES[0]
  const filteredThemes = THEMES.filter(t => t.category === themeCategory)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    const notebook = await create({ name: name.trim(), description, pageSize, theme })
    navigate(`/journal/${notebook.id}`)
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 pt-6 pb-4 border-b border-stone-100 flex-shrink-0">
          <h2 className="text-xl font-bold text-stone-900">New Travel Journal</h2>
          <p className="text-sm text-stone-500 mt-1">Set up your trip notebook</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
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

          {/* Theme */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">Theme</label>
            <div className="flex gap-1.5 mb-2">
              {THEME_CATEGORIES.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setThemeCategory(c)}
                  className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${
                    themeCategory === c ? 'bg-amber-700 text-white' : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2 max-h-56 overflow-y-auto p-0.5">
              {filteredThemes.map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setThemeId(t.id)}
                  className={`relative rounded-lg overflow-hidden border-2 text-left transition-all ${
                    themeId === t.id ? 'border-amber-500 shadow-md' : 'border-stone-200 hover:border-stone-400'
                  }`}
                  style={{ backgroundColor: t.backgroundColor }}
                >
                  <div className="px-2 pt-2 pb-1.5">
                    <p className="text-xs font-bold leading-tight" style={{ fontFamily: t.fontHeading, color: t.accentColor }}>
                      {t.icon} {t.label}
                    </p>
                    <p className="text-[9px] leading-snug opacity-60 mt-0.5" style={{ fontFamily: t.fontBody, color: t.accentColor }}>
                      Aa Bb
                    </p>
                  </div>
                  {themeId === t.id && (
                    <div className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-amber-500 flex items-center justify-center">
                      <span className="text-white" style={{ fontSize: 8 }}>✓</span>
                    </div>
                  )}
                  <span
                    role="button"
                    title="Preview this theme"
                    onClick={e => { e.stopPropagation(); setPreviewThemeId(t.id) }}
                    className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-white/80 flex items-center justify-center text-[10px] hover:bg-white transition-colors"
                  >
                    👁
                  </span>
                </button>
              ))}
            </div>
            <p className="text-xs text-stone-400 mt-2">Sets your journal's colors, fonts, and curated stickers &amp; page templates — change it anytime from the editor. Tap 👁 on a theme for a full preview.</p>
          </div>

          {previewThemeId && (
            <ThemeDetailModal
              initialThemeId={previewThemeId}
              onClose={() => setPreviewThemeId(null)}
              onSelect={(t) => setThemeId(t.id)}
            />
          )}

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
