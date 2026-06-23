import { useEffect, useState } from 'react'
import { getPhotosToken, listPhotos, importGooglePhoto } from '../utils/photosApi'

export default function GooglePhotosPicker({ notebookId, onImported, onClose }) {
  const [token, setToken] = useState(null)
  const [status, setStatus] = useState('connecting') // connecting | loaded | error
  const [error, setError] = useState('')
  const [photos, setPhotos] = useState([])
  const [nextPage, setNextPage] = useState(null)
  const [loadingMore, setLoadingMore] = useState(false)
  const [importing, setImporting] = useState(null) // mediaItem.id being imported

  useEffect(() => {
    getPhotosToken()
      .then(t => { setToken(t); return loadPage(t, null) })
      .catch(err => { setStatus('error'); setError(err.message) })
  }, [])

  const loadPage = async (t, pageToken) => {
    try {
      const { items, next } = await listPhotos(t, pageToken)
      setPhotos(prev => pageToken ? [...prev, ...items] : items)
      setNextPage(next)
      setStatus('loaded')
    } catch (err) {
      setStatus('error')
      setError(err.message)
    }
  }

  const handleLoadMore = async () => {
    setLoadingMore(true)
    await loadPage(token, nextPage)
    setLoadingMore(false)
  }

  const handlePick = async (item) => {
    if (importing) return
    setImporting(item.id)
    try {
      const photo = await importGooglePhoto(item, notebookId)
      onImported(photo.id)
      onClose()
    } catch (err) {
      setError(err.message)
      setImporting(null)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col"
        style={{ maxHeight: '80vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-stone-100 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="font-semibold text-stone-900">Google Photos</h2>
            <p className="text-xs text-stone-400 mt-0.5">
              {status === 'loaded' ? 'Click a photo to import it into your journal' : 'Loading your library…'}
            </p>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600 text-xl leading-none">✕</button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-3 min-h-0">
          {status === 'connecting' && (
            <div className="text-center py-16 text-stone-400 text-sm">
              Connecting to Google Photos…
            </div>
          )}

          {status === 'error' && (
            <div className="text-center py-12 space-y-3 px-6">
              <p className="text-sm text-red-500 font-medium">Could not connect to Google Photos</p>
              <p className="text-xs text-stone-500 leading-relaxed">{error}</p>
              <div className="bg-stone-50 rounded-lg p-4 text-left space-y-1">
                <p className="text-xs font-semibold text-stone-600">Setup required:</p>
                <ol className="text-xs text-stone-500 space-y-1 list-decimal pl-4">
                  <li>Go to <span className="text-amber-700 font-medium">console.cloud.google.com</span></li>
                  <li>APIs &amp; Services → Library → enable <strong>Google Photos Library API</strong></li>
                  <li>OAuth consent screen → Add scope: <code className="bg-stone-100 px-1 rounded">photoslibrary.readonly</code></li>
                </ol>
              </div>
            </div>
          )}

          {status === 'loaded' && photos.length === 0 && (
            <div className="text-center py-16 text-stone-400 text-sm">No photos found in your library.</div>
          )}

          {photos.length > 0 && (
            <>
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5">
                {photos.map(item => (
                  <button
                    key={item.id}
                    onClick={() => handlePick(item)}
                    disabled={!!importing}
                    className="aspect-square rounded overflow-hidden relative group disabled:cursor-wait"
                  >
                    <img
                      src={item.baseUrl + '=w300-h300-c'}
                      alt={item.filename}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    {importing === item.id ? (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <span className="text-white text-xs font-medium">Importing…</span>
                      </div>
                    ) : (
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                    )}
                  </button>
                ))}
              </div>

              {nextPage && (
                <div className="text-center pt-4 pb-2">
                  <button
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="text-xs text-amber-700 hover:text-amber-800 font-medium disabled:opacity-50"
                  >
                    {loadingMore ? 'Loading…' : 'Load more photos'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
