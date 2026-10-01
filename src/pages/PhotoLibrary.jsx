import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  fsLoadPhotoLibrary, fsTrashPhoto, fsRestorePhoto, fsCheckPhotoReferences,
} from '../firebase/firestoreHelpers'

// Owner-only Photo Library — browse/reuse across journals, trash/restore. No physical
// deletion in this release; "where used" is informational only and never gates trash
// (trash is fully reversible, so there is nothing to protect by blocking it).
// Every photo shown here was loaded via the current user's own uid — this page has no
// visibility into, and no effect on, any distinct collaborator's own uploads.
//
// All Firebase access goes through firestoreHelpers.js (fsLoadPhotoLibrary — ONE read
// of the photos collection, split into {active, trashed} — fsTrashPhoto, fsRestorePhoto,
// fsCheckPhotoReferences). This component never touches Firestore directly.

const LOCATION_LABELS = {
  element: 'Used on a page',
  cover: 'Journal cover',
  'public-cover': 'Public share cover',
  'public-element': 'Used in a public share',
}

export default function PhotoLibrary() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('active') // 'active' | 'trashed'
  const [activePhotos, setActivePhotos] = useState([])
  const [trashedPhotos, setTrashedPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [busyId, setBusyId] = useState(null)
  const [actionError, setActionError] = useState(null) // { photoId, message }
  // photoId -> 'loading' | { locations: [...] } | { error: string } | undefined (closed)
  const [references, setReferences] = useState({})

  const reload = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setLoadError(null)
    try {
      const { active, trashed } = await fsLoadPhotoLibrary(user.uid)
      setActivePhotos(active)
      setTrashedPhotos(trashed)
    } catch (err) {
      console.error('[PhotoLibrary] failed to load photos:', err)
      setLoadError('Could not load your photos. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { reload() }, [reload])

  const handleTrash = async (photo) => {
    setBusyId(photo.id)
    setActionError(null)
    try {
      await fsTrashPhoto(user.uid, photo.id)
      await reload()
    } catch (err) {
      console.error('[PhotoLibrary] trash failed:', err)
      setActionError({ photoId: photo.id, message: 'Could not trash this photo. Please try again.' })
    } finally {
      setBusyId(null)
    }
  }

  const handleRestore = async (photo) => {
    setBusyId(photo.id)
    setActionError(null)
    try {
      await fsRestorePhoto(user.uid, photo.id)
      await reload()
    } catch (err) {
      console.error('[PhotoLibrary] restore failed:', err)
      setActionError({ photoId: photo.id, message: 'Could not restore this photo. Please try again.' })
    } finally {
      setBusyId(null)
    }
  }

  const loadReferences = useCallback(async (photo) => {
    setReferences(prev => ({ ...prev, [photo.id]: 'loading' }))
    try {
      const locations = await fsCheckPhotoReferences(user.uid, photo.id, photo.storageUrl)
      setReferences(prev => ({ ...prev, [photo.id]: { locations } }))
    } catch (err) {
      console.error('[PhotoLibrary] reference check failed:', err)
      setReferences(prev => ({ ...prev, [photo.id]: { error: 'Could not check where this photo is used.' } }))
    }
  }, [user])

  const handleShowReferences = (photo) => {
    if (references[photo.id]) {
      // toggle closed, from any state (loaded, loading, or errored)
      setReferences(prev => { const next = { ...prev }; delete next[photo.id]; return next })
      return
    }
    loadReferences(photo)
  }

  const photos = tab === 'active' ? activePhotos : trashedPhotos

  if (!user) return null

  return (
    <div className="min-h-screen pb-16" style={{ backgroundColor: '#f0ebe3' }}>
      <header className="px-4 sm:px-8 py-4 sm:py-6 flex items-center gap-4 sticky top-0 z-10 border-b border-stone-200" style={{ backgroundColor: '#f0ebe3' }}>
        <button onClick={() => navigate('/')} className="text-stone-500 hover:text-stone-800 text-sm transition-colors">
          ← Journals
        </button>
        <div className="w-px h-4 bg-stone-300" />
        <h1 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight" style={{ fontFamily: 'Georgia, serif' }}>
          Photo Library
        </h1>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-8 py-8">
        <div className="flex gap-1 mb-6 border-b border-stone-200">
          {[['active', `Active${activePhotos.length ? ` (${activePhotos.length})` : ''}`], ['trashed', `Trashed${trashedPhotos.length ? ` (${trashedPhotos.length})` : ''}`]].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${tab === key ? 'border-amber-700 text-amber-800' : 'border-transparent text-stone-400 hover:text-stone-600'}`}
            >
              {label}
            </button>
          ))}
        </div>

        {loading && <div className="text-center py-20 text-stone-400 text-sm">Loading your photos…</div>}

        {!loading && loadError && (
          <div className="text-center py-20">
            <p className="text-red-700 text-sm mb-3">{loadError}</p>
            <button
              onClick={reload}
              className="text-sm text-amber-800 hover:text-amber-900 underline underline-offset-2"
            >
              Try again
            </button>
          </div>
        )}

        {!loading && !loadError && photos.length === 0 && (
          <div className="text-center py-24">
            <div className="text-6xl mb-6 opacity-30 select-none">🖼️</div>
            <h2 className="text-xl font-semibold text-stone-700 mb-2" style={{ fontFamily: 'Georgia, serif' }}>
              {tab === 'active' ? 'No photos yet' : 'Nothing trashed'}
            </h2>
            <p className="text-stone-400 text-sm">
              {tab === 'active' ? 'Upload photos to your journals and they’ll appear here, reusable across every journal.' : 'Photos you trash will appear here until you restore them.'}
            </p>
          </div>
        )}

        {!loading && !loadError && photos.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {photos.map(photo => (
              <div key={photo.id} className="bg-white rounded-xl overflow-hidden shadow-sm border border-stone-200">
                <div className="aspect-square bg-stone-100">
                  {photo.thumbnailUrl ? (
                    <img src={photo.thumbnailUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-stone-300 text-3xl">🖼️</div>
                  )}
                </div>
                <div className="p-2.5 space-y-1.5">
                  <button
                    onClick={() => handleShowReferences(photo)}
                    className="text-[11px] text-stone-400 hover:text-stone-600 underline underline-offset-2 transition-colors"
                  >
                    Where is this used?
                  </button>
                  {references[photo.id] === 'loading' && (
                    <div className="text-[11px] text-stone-400">Checking…</div>
                  )}
                  {references[photo.id]?.error && (
                    <div className="text-[11px] space-y-0.5">
                      <div className="text-red-600">{references[photo.id].error}</div>
                      <button
                        onClick={() => loadReferences(photo)}
                        className="text-amber-800 hover:text-amber-900 underline underline-offset-2"
                      >
                        Retry
                      </button>
                    </div>
                  )}
                  {references[photo.id]?.locations && (
                    references[photo.id].locations.length === 0 ? (
                      <div className="text-[11px] text-stone-400">Not currently used anywhere.</div>
                    ) : (
                      <ul className="text-[11px] text-stone-500 space-y-0.5">
                        {references[photo.id].locations.map((loc, i) => (
                          <li key={i}>
                            {LOCATION_LABELS[loc.type] ?? loc.type} — <span className="font-medium">{loc.notebookName}</span>
                          </li>
                        ))}
                      </ul>
                    )
                  )}
                  {actionError?.photoId === photo.id && (
                    <div className="text-[11px] text-red-600">{actionError.message}</div>
                  )}
                  <div className="flex gap-2 pt-0.5">
                    {tab === 'active' ? (
                      <button
                        onClick={() => handleTrash(photo)}
                        disabled={busyId === photo.id}
                        className="flex-1 text-xs font-medium text-stone-500 hover:text-red-700 disabled:opacity-40 transition-colors py-1 rounded border border-stone-200 hover:border-red-200"
                      >
                        {busyId === photo.id ? '…' : 'Trash'}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleRestore(photo)}
                        disabled={busyId === photo.id}
                        className="flex-1 text-xs font-medium text-stone-500 hover:text-amber-800 disabled:opacity-40 transition-colors py-1 rounded border border-stone-200 hover:border-amber-200"
                      >
                        {busyId === photo.id ? '…' : 'Restore'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
