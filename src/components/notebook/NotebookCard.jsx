import { useState, useEffect } from 'react'
import { useNotebookStore } from '../../store/notebookStore'
import { useAuth } from '../../context/AuthContext'
import { fsGetFirstPageCover } from '../../firebase/firestoreHelpers'

function darken(hex, amount = 0.35) {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return `rgb(${Math.round(r * (1 - amount))},${Math.round(g * (1 - amount))},${Math.round(b * (1 - amount))})`
}

function lighten(hex, amount = 0.4) {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return `rgb(${Math.round(r + (255 - r) * amount)},${Math.round(g + (255 - g) * amount)},${Math.round(b + (255 - b) * amount)})`
}

export default function NotebookCard({ notebook, onOpen }) {
  const { delete: deleteNotebook } = useNotebookStore()
  const { user } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [coverUrl, setCoverUrl] = useState(null)

  useEffect(() => {
    if (!user) return
    fsGetFirstPageCover(user.uid, notebook.id).then(url => { if (url) setCoverUrl(url) })
  }, [notebook.id, user])

  const accent = notebook.theme?.accentColor || '#c0813a'
  const spine = darken(accent, 0.4)
  const highlight = lighten(accent, 0.35)

  const updatedDate = new Date(notebook.updatedAt).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })

  const year = new Date(notebook.updatedAt).getFullYear()

  const handleDelete = async (e) => {
    e.stopPropagation()
    if (!confirming) { setConfirming(true); return }
    setDeleting(true)
    await deleteNotebook(notebook.id)
  }

  const handleMenuToggle = (e) => {
    e.stopPropagation()
    setMenuOpen(v => !v)
    setConfirming(false)
  }

  return (
    <div
      className="cursor-pointer group relative select-none"
      onClick={() => !menuOpen && onOpen()}
      style={{ filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.18)) drop-shadow(0 2px 6px rgba(0,0,0,0.12))' }}
    >
      <div className="transition-transform duration-300 group-hover:-translate-y-2" style={{ transformStyle: 'preserve-3d' }}>
        <div className="flex">
          {/* Spine */}
          <div
            className="w-7 flex-shrink-0 rounded-l-sm flex flex-col items-center justify-between py-4"
            style={{ backgroundColor: spine, minHeight: 260 }}
          >
            <div className="w-1 h-8 rounded-full opacity-20" style={{ backgroundColor: highlight }} />
            <span
              className="text-white/60 font-serif tracking-widest uppercase"
              style={{
                fontSize: 8,
                writingMode: 'vertical-rl',
                transform: 'rotate(180deg)',
                letterSpacing: '0.18em',
                maxHeight: 120,
                overflow: 'hidden',
              }}
            >
              {notebook.name}
            </span>
            <div className="w-1 h-8 rounded-full opacity-20" style={{ backgroundColor: highlight }} />
          </div>

          {/* Cover */}
          <div
            className="flex-1 rounded-r-sm flex flex-col overflow-hidden relative"
            style={{ backgroundColor: accent, minHeight: 260 }}
          >
            {/* Cover photo */}
            {coverUrl && (
              <img
                src={coverUrl}
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
                style={{ opacity: 0.55 }}
              />
            )}

            {/* Subtle texture overlay */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4'%3E%3Crect width='4' height='4' fill='none'/%3E%3Cpath d='M0 0h1v1H0zM2 2h1v1H2z' fill='rgba(255,255,255,0.04)'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'repeat',
              }}
            />

            {/* Inner frame */}
            <div className="absolute inset-3 border pointer-events-none" style={{ borderColor: `${highlight}60` }} />

            {/* Content */}
            <div className="relative flex-1 flex flex-col p-5 pt-7">
              {/* Decorative accent line */}
              <div className="w-10 h-0.5 mb-4" style={{ backgroundColor: highlight }} />

              {/* Title */}
              <h3
                className="font-bold leading-tight text-white"
                style={{ fontFamily: 'Georgia, serif', fontSize: 18, textShadow: '0 1px 4px rgba(0,0,0,0.2)' }}
              >
                {notebook.name}
              </h3>

              {notebook.description && (
                <p className="mt-2 text-sm leading-snug" style={{ color: `${highlight}CC`, fontFamily: 'Georgia, serif' }}>
                  {notebook.description}
                </p>
              )}

              <div className="mt-auto pt-4">
                <div className="w-10 h-px mb-3" style={{ backgroundColor: `${highlight}60` }} />
                <p className="text-xs tracking-widest uppercase font-medium" style={{ color: `${highlight}99`, letterSpacing: '0.15em' }}>
                  {year}
                </p>
                <p className="text-xs mt-0.5" style={{ color: `${highlight}70` }}>{updatedDate}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Page edge effect */}
        <div
          className="absolute right-0 top-1 bottom-1 w-1.5 rounded-r-sm"
          style={{
            background: `linear-gradient(to right, ${darken(accent, 0.1)}, #e8e0d5)`,
            transform: 'translateX(1px)',
            zIndex: -1,
          }}
        />
      </div>

      {/* Menu */}
      <div className="absolute top-2 right-2 z-10" onClick={e => e.stopPropagation()}>
        <button
          className="w-7 h-7 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-sm flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all text-base leading-none"
          onClick={handleMenuToggle}
        >
          ⋮
        </button>
        {menuOpen && (
          <div className="absolute right-0 top-8 bg-white border border-stone-200 rounded-lg shadow-xl py-1 min-w-40 z-20">
            <button
              className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                confirming ? 'text-red-600 bg-red-50 font-medium' : 'text-red-500 hover:bg-stone-50'
              }`}
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? 'Deleting…' : confirming ? 'Tap again to confirm' : 'Delete journal'}
            </button>
            {confirming && (
              <button
                className="w-full text-left px-4 py-2 text-sm text-stone-600 hover:bg-stone-50"
                onClick={e => { e.stopPropagation(); setConfirming(false); setMenuOpen(false) }}
              >
                Cancel
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
