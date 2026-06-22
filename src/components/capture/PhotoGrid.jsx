import { useEffect, useState } from 'react'
import { useCaptureStore } from '../../store/captureStore'

function PhotoCard({ photo }) {
  const { deletePhoto } = useCaptureStore()
  const [thumbUrl, setThumbUrl] = useState(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!photo.thumbnailBlob) return
    const url = URL.createObjectURL(photo.thumbnailBlob)
    setThumbUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [photo.id])

  const hasGps   = photo.exif?.lat != null
  const location = photo.exif?.locationName
  const date     = photo.exif?.dateTaken
    ? new Date(photo.exif.dateTaken).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : new Date(photo.uploadedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  const handleDelete = async (e) => {
    e.stopPropagation()
    setDeleting(true)
    await deletePhoto(photo.id)
  }

  return (
    <div className="relative group rounded-xl overflow-hidden bg-stone-200 aspect-square">
      {thumbUrl ? (
        <img src={thumbUrl} alt={photo.filename} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-stone-400 text-2xl">🖼</div>
      )}

      {/* Overlay info */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
        <div className="flex items-end justify-between gap-1">
          <div className="min-w-0">
            {location && (
              <p className="text-white text-xs font-medium truncate leading-tight">{location}</p>
            )}
            <p className="text-white/70 text-xs">{date}</p>
          </div>
          {hasGps && <span className="text-base flex-shrink-0" title="GPS location embedded">📍</span>}
        </div>
      </div>

      {/* Delete button */}
      <button
        onClick={handleDelete}
        disabled={deleting}
        className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/50 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-all"
      >
        ×
      </button>
    </div>
  )
}

export default function PhotoGrid({ photos }) {
  if (photos.length === 0) {
    return (
      <div className="text-center py-10 text-stone-400">
        <p className="text-3xl mb-2 select-none">🏔</p>
        <p className="text-sm">Your uploaded photos will appear here.</p>
        <p className="text-xs mt-1 opacity-70">GPS data is read automatically from each photo.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {photos.map(photo => (
        <PhotoCard key={photo.id} photo={photo} />
      ))}
    </div>
  )
}
