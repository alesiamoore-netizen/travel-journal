import { useEffect, useState } from 'react'
import { db } from '../../../db'

export default function ImageElement({ element }) {
  const { data } = element
  const [src, setSrc] = useState(null)

  useEffect(() => {
    if (!data.photoId) { setSrc(null); return }
    let url
    db.photos.get(data.photoId).then(photo => {
      if (!photo?.blob) return
      url = URL.createObjectURL(photo.blob)
      setSrc(url)
    })
    return () => { if (url) URL.revokeObjectURL(url) }
  }, [data.photoId])

  if (!src) {
    return (
      <div className="h-full w-full bg-stone-100 border-2 border-dashed border-stone-300 flex flex-col items-center justify-center gap-2 text-stone-400 select-none">
        <span className="text-3xl">🖼</span>
        <span className="text-xs font-medium">Image block</span>
        <span className="text-xs opacity-60">Select a photo in the inspector →</span>
      </div>
    )
  }

  return (
    <div className="h-full w-full relative overflow-hidden">
      <img
        src={src}
        alt={data.caption || ''}
        className="w-full h-full"
        style={{ objectFit: data.fit ?? 'cover' }}
        draggable={false}
      />
      {data.caption && (
        <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs px-2 py-1 text-center leading-snug">
          {data.caption}
        </div>
      )}
    </div>
  )
}
