import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { db } from '../db'
import { useCaptureStore } from '../store/captureStore'
import DropZone from '../components/capture/DropZone'
import PhotoGrid from '../components/capture/PhotoGrid'

function NoteEntry({ onSave, onCancel }) {
  const [text, setText] = useState('')
  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-4 space-y-3">
      <textarea
        autoFocus
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="What are you seeing right now? Jot a quick thought…"
        rows={4}
        className="w-full resize-none text-sm text-stone-800 placeholder-stone-400 focus:outline-none leading-relaxed"
      />
      <div className="flex gap-2">
        <button
          onClick={onCancel}
          className="flex-1 py-2 rounded-xl border border-stone-200 text-sm text-stone-600 hover:bg-stone-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={() => { if (text.trim()) { onSave(text); setText('') } }}
          disabled={!text.trim()}
          className="flex-1 py-2 rounded-xl bg-amber-700 hover:bg-amber-800 disabled:opacity-40 text-white text-sm font-medium transition-colors"
        >
          Save Note
        </button>
      </div>
    </div>
  )
}

function NotesList({ notes, onDelete }) {
  return (
    <div className="space-y-2">
      {notes.map(note => (
        <div key={note.id} className="bg-white rounded-xl border border-stone-200 px-4 py-3 group relative">
          <p className="text-sm text-stone-800 leading-relaxed whitespace-pre-wrap">{note.text}</p>
          <p className="text-xs text-stone-400 mt-1.5">
            {new Date(note.createdAt).toLocaleString('en-US', {
              month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
            })}
          </p>
          <button
            onClick={() => onDelete(note.id)}
            className="absolute top-2 right-2 w-5 h-5 rounded-full text-stone-300 hover:text-red-500 hover:bg-red-50 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-all"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )
}

function UploadProgress({ current, total }) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0
  return (
    <div className="bg-white rounded-xl border border-stone-200 px-4 py-3 space-y-2">
      <div className="flex items-center justify-between text-xs text-stone-600">
        <span>Processing photo {current} of {total}…</span>
        <span className="font-medium">{pct}%</span>
      </div>
      <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-amber-600 rounded-full transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-stone-400">Extracting GPS & generating thumbnails…</p>
    </div>
  )
}

export default function Capture() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { load, photos, notes, uploading, progress, addPhotos, addNote, deleteNote } = useCaptureStore()
  const [notebook, setNotebook] = useState(null)
  const [showNote, setShowNote] = useState(false)
  const [gpsStatus, setGpsStatus] = useState(null) // null | 'locating' | { lat, lng, name }

  useEffect(() => {
    db.notebooks.get(id).then(nb => { if (!nb) { navigate('/'); return }; setNotebook(nb) })
    load(id)
  }, [id])

  const handleFiles = (files) => addPhotos(files)

  const handleDropPin = () => {
    setGpsStatus('locating')
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords
        const { reverseGeocode } = await import('../utils/exif')
        const name = await reverseGeocode(lat, lng)
        setGpsStatus({ lat, lng, name: name ?? `${lat.toFixed(4)}, ${lng.toFixed(4)}` })
      },
      () => setGpsStatus(null),
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  const accent = notebook?.theme?.accentColor ?? '#c0813a'

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button
          onClick={() => navigate(`/journal/${id}`)}
          className="text-stone-500 hover:text-stone-900 text-sm transition-colors"
        >
          ← Editor
        </button>
        <div className="w-px h-4 bg-stone-200" />
        <div>
          <p className="text-sm font-semibold text-stone-900 leading-tight">Quick Capture</p>
          {notebook && (
            <p className="text-xs text-stone-400 leading-tight">{notebook.name}</p>
          )}
        </div>
        <div className="ml-auto w-2 h-2 rounded-full" style={{ backgroundColor: accent }} />
      </header>

      {/* Body — max width for mobile-first feel */}
      <main className="flex-1 max-w-xl mx-auto w-full px-4 py-5 space-y-5">

        {/* Action grid */}
        <div className="grid grid-cols-2 gap-3">
          <DropZone onFiles={handleFiles} disabled={uploading} />

          <button
            onClick={() => setShowNote(v => !v)}
            className={`flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed py-6 px-4 transition-all ${
              showNote
                ? 'border-amber-500 bg-amber-50'
                : 'border-stone-300 bg-white hover:border-amber-400 hover:bg-amber-50'
            }`}
          >
            <span className="text-3xl">📝</span>
            <span className="text-sm font-semibold text-stone-700">Quick Note</span>
            <span className="text-xs text-stone-400">Write a thought</span>
          </button>
        </div>

        {/* GPS pin button */}
        <button
          onClick={handleDropPin}
          disabled={gpsStatus === 'locating'}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors ${
            gpsStatus && gpsStatus !== 'locating'
              ? 'border-green-300 bg-green-50 text-green-800'
              : 'border-stone-200 bg-white hover:bg-stone-50 text-stone-700'
          }`}
        >
          <span className="text-xl">{gpsStatus === 'locating' ? '⏳' : '📍'}</span>
          <div className="text-left">
            <p className="text-sm font-medium">
              {gpsStatus === 'locating' ? 'Locating…' : gpsStatus ? 'Location pinned' : 'Drop a pin here'}
            </p>
            {gpsStatus && gpsStatus !== 'locating' && (
              <p className="text-xs opacity-70 truncate">{gpsStatus.name}</p>
            )}
            {!gpsStatus && (
              <p className="text-xs text-stone-400">Uses your device GPS</p>
            )}
          </div>
        </button>

        {/* Note entry */}
        {showNote && (
          <NoteEntry
            onSave={async text => { await addNote(text); setShowNote(false) }}
            onCancel={() => setShowNote(false)}
          />
        )}

        {/* Upload progress */}
        {uploading && <UploadProgress current={progress.current} total={progress.total} />}

        {/* Notes list */}
        {notes.length > 0 && (
          <section>
            <h2 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Notes</h2>
            <NotesList notes={notes} onDelete={deleteNote} />
          </section>
        )}

        {/* Photo count summary */}
        {photos.length > 0 && (
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-stone-400 uppercase tracking-wider">
              Photos — {photos.length}
            </h2>
            <span className="text-xs text-stone-400">
              {photos.filter(p => p.exif?.lat).length} with GPS
            </span>
          </div>
        )}

        {/* Photo grid */}
        <PhotoGrid photos={photos} />

      </main>
    </div>
  )
}
