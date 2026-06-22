import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { db } from '../db'

export default function Editor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [notebook, setNotebook] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    db.notebooks.get(id).then((nb) => {
      if (!nb) { navigate('/'); return }
      setNotebook(nb)
      setLoading(false)
    })
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center text-stone-400">
        Loading…
      </div>
    )
  }

  const accent = notebook.theme?.accentColor || '#c0813a'

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col">
      <header className="bg-white border-b border-stone-200 px-6 py-3 flex items-center gap-4 shadow-sm">
        <button
          onClick={() => navigate('/')}
          className="text-stone-500 hover:text-stone-900 text-sm transition-colors"
        >
          ← Journals
        </button>
        <div className="w-px h-5 bg-stone-200" />
        <h1 className="text-base font-semibold text-stone-900 truncate">{notebook.name}</h1>
        <div
          className="h-2 w-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: accent }}
        />
        <div className="ml-auto flex items-center gap-3">
          <button
            onClick={() => navigate(`/journal/${id}/capture`)}
            className="text-sm text-stone-500 hover:text-stone-900 px-3 py-1.5 rounded-lg hover:bg-stone-100 transition-colors"
          >
            📷 Quick Capture
          </button>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center">
        <div className="text-center text-stone-400">
          <div className="text-6xl mb-5 select-none">🎨</div>
          <p className="text-lg font-semibold text-stone-600">Canvas Editor</p>
          <p className="text-sm mt-2 text-stone-400">Coming in Phase 2</p>
          <p className="text-xs mt-4 text-stone-300 max-w-xs mx-auto">
            Drag-and-drop layout grid, TipTap rich text, image blocks, and map elements.
          </p>
        </div>
      </main>
    </div>
  )
}
