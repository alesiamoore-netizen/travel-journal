import { useState } from 'react'
import { useNotebookStore } from '../../store/notebookStore'

const PAGE_SIZE_LABELS = {
  '8x10':   '8 × 10"',
  '8.5x11': '8.5 × 11"',
  '11x8.5': '11 × 8.5" landscape',
}

export default function NotebookCard({ notebook, onOpen }) {
  const { delete: deleteNotebook } = useNotebookStore()
  const [menuOpen, setMenuOpen] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const accent = notebook.theme?.accentColor || '#c0813a'
  const bg = notebook.theme?.backgroundColor || '#f5f0e8'

  const updatedDate = new Date(notebook.updatedAt).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })

  const handleDelete = async (e) => {
    e.stopPropagation()
    if (!confirming) { setConfirming(true); return }
    setDeleting(true)
    await deleteNotebook(notebook.id)
  }

  const handleMenuToggle = (e) => {
    e.stopPropagation()
    setMenuOpen((v) => !v)
    setConfirming(false)
  }

  return (
    <div
      className="bg-white rounded-xl overflow-hidden shadow-sm border border-stone-200 hover:shadow-md transition-all cursor-pointer group"
      onClick={() => !menuOpen && onOpen()}
    >
      {/* Cover */}
      <div
        className="h-44 relative flex items-center justify-center"
        style={{ backgroundColor: bg }}
      >
        <span
          className="text-6xl select-none opacity-20 group-hover:opacity-40 transition-opacity"
          style={{ color: accent }}
        >
          ✈
        </span>

        {/* Accent stripe */}
        <div
          className="absolute bottom-0 left-0 right-0 h-1"
          style={{ backgroundColor: accent }}
        />

        {/* Menu */}
        <div className="absolute top-2 right-2" onClick={(e) => e.stopPropagation()}>
          <button
            className="w-8 h-8 rounded-full bg-white/80 hover:bg-white flex items-center justify-center text-stone-500 opacity-0 group-hover:opacity-100 transition-all text-lg leading-none"
            onClick={handleMenuToggle}
            aria-label="Notebook options"
          >
            ⋮
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-9 bg-white border border-stone-200 rounded-lg shadow-lg py-1 min-w-36 z-20">
              <button
                className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                  confirming
                    ? 'text-red-600 bg-red-50 font-medium'
                    : 'text-red-600 hover:bg-stone-50'
                }`}
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? 'Deleting…' : confirming ? 'Tap again to confirm' : 'Delete journal'}
              </button>
              {confirming && (
                <button
                  className="w-full text-left px-4 py-2 text-sm text-stone-600 hover:bg-stone-50"
                  onClick={(e) => { e.stopPropagation(); setConfirming(false); setMenuOpen(false) }}
                >
                  Cancel
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-semibold text-stone-900 truncate">{notebook.name}</h3>
        {notebook.description && (
          <p className="text-sm text-stone-500 mt-0.5 truncate">{notebook.description}</p>
        )}
        <div className="flex items-center justify-between mt-3 text-xs text-stone-400">
          <span>{PAGE_SIZE_LABELS[notebook.pageSize] ?? notebook.pageSize}</span>
          <span>{updatedDate}</span>
        </div>
      </div>
    </div>
  )
}
