import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNotebookStore } from '../store/notebookStore'
import { useAuth } from '../context/AuthContext'
import { fsLoadPhotos } from '../firebase/firestoreHelpers'

function fmtDate(s) {
  if (!s) return ''
  try { return new Date(s + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) }
  catch { return '' }
}

export default function Memories() {
  const { notebooks } = useNotebookStore()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [lightbox, setLightbox] = useState(null)

  useEffect(() => {
    if (!user || !notebooks.length) { setLoading(false); return }
    Promise.all(
      notebooks.map(nb => fsLoadPhotos(user.uid, nb.id).then(ps => ps.map(p => ({ ...p, notebookId: nb.id, notebookName: nb.name, notebookAccent: nb.theme?.accentColor ?? '#c0813a' }))))
    ).then(results => {
      const all = results.flat().sort((a, b) => (b.uploadedAt ?? '').localeCompare(a.uploadedAt ?? ''))
      setPhotos(all)
    }).finally(() => setLoading(false))
  }, [user, notebooks])

  // Group photos by month
  const grouped = photos.reduce((acc, photo) => {
    const month = fmtDate(photo.uploadedAt?.slice(0, 10)) || 'Unknown'
    if (!acc[month]) acc[month] = []
    acc[month].push(photo)
    return acc
  }, {})

  return (
    <div className="min-h-screen pb-16" style={{ backgroundColor: '#f0ebe3' }}>
      {/* Header */}
      <header className="px-4 sm:px-8 py-4 sm:py-6 flex items-center gap-4 sticky top-0 z-10 border-b border-stone-200" style={{ backgroundColor: '#f0ebe3' }}>
        <button onClick={() => navigate('/')} className="text-stone-500 hover:text-stone-800 text-sm transition-colors">
          ← Journals
        </button>
        <div className="w-px h-4 bg-stone-300" />
        <h1 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight" style={{ fontFamily: 'Georgia, serif' }}>
          All Memories
        </h1>
        <span className="text-sm text-stone-400 ml-1">{photos.length > 0 ? `${photos.length} photos` : ''}</span>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-8 py-8">
        {loading && (
          <div className="text-center py-20 text-stone-400 text-sm">Loading your photos…</div>
        )}

        {!loading && photos.length === 0 && (
          <div className="text-center py-24">
            <div className="text-6xl mb-6 opacity-30 select-none">🖼️</div>
            <h2 className="text-xl font-semibold text-stone-700 mb-2" style={{ fontFamily: 'Georgia, serif' }}>No photos yet</h2>
            <p className="text-stone-400 text-sm">Upload photos to your journals and they'll appear here.</p>
          </div>
        )}

        {!loading && Object.entries(grouped).map(([month, monthPhotos]) => (
          <section key={month} className="mb-10">
            <h2 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-3">{month}</h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-1.5">
              {monthPhotos.map(photo => (
                <button
                  key={photo.id}
                  onClick={() => setLightbox(photo)}
                  className="relative aspect-square rounded-lg overflow-hidden group"
                  style={{ outline: `2px solid ${photo.notebookAccent}00` }}
                  title={photo.notebookName}
                >
                  {photo.thumbnailUrl ? (
                    <img
                      src={photo.thumbnailUrl}
                      alt=""
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full bg-stone-200" />
                  )}
                  {/* Journal color accent dot on hover */}
                  <div className="absolute bottom-1 right-1 w-2 h-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ backgroundColor: photo.notebookAccent }} />
                </button>
              ))}
            </div>
          </section>
        ))}
      </main>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <img
            src={lightbox.storageUrl ?? lightbox.thumbnailUrl}
            alt=""
            className="max-w-full max-h-[80vh] rounded-xl shadow-2xl object-contain"
            onClick={e => e.stopPropagation()}
          />
          <div className="mt-4 flex items-center gap-3" onClick={e => e.stopPropagation()}>
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: lightbox.notebookAccent }} />
            <button
              onClick={() => { setLightbox(null); navigate(`/journal/${lightbox.notebookId}`) }}
              className="text-sm text-white/80 hover:text-white transition-colors underline underline-offset-2"
            >
              {lightbox.notebookName}
            </button>
            <button onClick={() => setLightbox(null)} className="ml-4 text-white/50 hover:text-white text-lg leading-none">×</button>
          </div>
        </div>
      )}
    </div>
  )
}
