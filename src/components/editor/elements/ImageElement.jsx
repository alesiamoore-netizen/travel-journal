import { useEffect, useRef, useState } from 'react'
import { db } from '../../../db/index'
import { useEditorStore } from '../../../store/editorStore'

const FILTERS = {
  none:       '',
  grayscale:  'grayscale(100%)',
  sepia:      'sepia(90%)',
  warm:       'sepia(35%) brightness(1.05) saturate(1.25)',
  cool:       'brightness(0.95) saturate(0.75) hue-rotate(20deg)',
  fade:       'brightness(1.08) saturate(0.55) contrast(0.9)',
  dramatic:   'contrast(1.3) saturate(0.7) brightness(0.95)',
}

const CLIP_STYLES = {
  none:     {},
  circle:   { clipPath: 'circle(50% at 50% 50%)' },
  diamond:  { clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' },
  diamond2: { clipPath: 'polygon(50% 5%, 95% 50%, 50% 95%, 5% 50%)' },
  arch:     { clipPath: 'ellipse(50% 55% at 50% 55%)' },
  hexagon:  { clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)' },
  pentagon: { clipPath: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)' },
  tilt:     { clipPath: 'polygon(10% 0%, 100% 0%, 90% 100%, 0% 100%)' },
  oval:     { clipPath: 'ellipse(50% 38% at 50% 50%)' },
  ovalv:    { clipPath: 'ellipse(38% 50% at 50% 50%)' },
  star5:    { clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' },
}

const OVERLAY_POSITIONS = {
  'bottom-left':  'bottom-0 left-0',
  'bottom-right': 'bottom-0 right-0',
  'top-left':     'top-0 left-0',
  'top-right':    'top-0 right-0',
  'center':       'inset-0 flex items-center justify-center',
}

async function storePhoto(blob, filename, notebookId) {
  const { generateThumbnail } = await import('../../../utils/thumbnail')
  const thumbnailBlob = await generateThumbnail(blob, 400)
  const photo = {
    id: crypto.randomUUID(),
    notebookId,
    filename,
    mimeType: blob.type || 'image/jpeg',
    size: blob.size,
    blob,
    thumbnailBlob,
    uploadedAt: new Date().toISOString(),
    exif: {},
  }
  await db.photos.add(photo)
  return photo.id
}

export default function ImageElement({ element }) {
  const { data } = element
  const { notebook, updateElement } = useEditorStore()
  const [src, setSrc] = useState(null)
  const [dragging, setDragging] = useState(false)
  const [urlInput, setUrlInput] = useState('')
  const [fetchStatus, setFetchStatus] = useState('idle')

  const handleUrlFetch = async () => {
    const url = urlInput.trim()
    if (!url.startsWith('http')) return
    setFetchStatus('loading')
    try {
      const res = await fetch(url)
      if (!res.ok) throw new Error('fetch failed')
      const blob = await res.blob()
      if (!blob.type.startsWith('image/')) throw new Error('not an image')
      const photoId = await storePhoto(blob, url.split('/').pop() || 'photo.jpg', notebook.id)
      updateElement(element.id, { data: { ...data, photoId } })
      setUrlInput('')
      setFetchStatus('idle')
    } catch {
      setFetchStatus('error')
      setTimeout(() => setFetchStatus('idle'), 2500)
    }
  }

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

  const handleDrop = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragging(false)
    const file = e.dataTransfer.files?.[0] ?? e.dataTransfer.items?.[0]?.getAsFile?.()
    if (file && file.type.startsWith('image/')) {
      const photoId = await storePhoto(file, file.name, notebook.id)
      updateElement(element.id, { data: { ...data, photoId } })
      return
    }
    const url = e.dataTransfer.getData('text/uri-list') || e.dataTransfer.getData('text/plain')
    if (url && /^https?:\/\//.test(url.trim())) {
      try {
        const res = await fetch(url.trim())
        if (!res.ok) throw new Error()
        const blob = await res.blob()
        if (!blob.type.startsWith('image/')) throw new Error()
        const photoId = await storePhoto(blob, url.split('/').pop() || 'photo.jpg', notebook.id)
        updateElement(element.id, { data: { ...data, photoId } })
      } catch { /* CORS/fetch failed */ }
    }
  }

  if (!src) {
    return (
      <div
        className={`h-full w-full border-2 border-dashed flex flex-col items-center justify-center gap-2 text-stone-400 select-none transition-colors ${
          dragging ? 'border-amber-400 bg-amber-50' : 'border-stone-300 bg-stone-100'
        }`}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        <span className="text-3xl">{dragging ? '📥' : '🖼'}</span>
        <span className="text-xs font-medium">{dragging ? 'Drop image here' : 'Image block'}</span>
        {!dragging && <span className="text-xs opacity-60">Drag a photo or paste a URL</span>}
        {!dragging && (
          <div className="absolute bottom-0 left-0 right-0 p-1.5 flex gap-1" onClick={e => e.stopPropagation()}>
            <input
              type="url"
              value={urlInput}
              onChange={e => setUrlInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleUrlFetch()}
              placeholder="https://…"
              className="flex-1 text-[10px] px-2 py-1 border border-stone-300 rounded bg-white/90 focus:outline-none focus:ring-1 focus:ring-amber-400 text-stone-600 min-w-0"
            />
            <button
              onClick={handleUrlFetch}
              disabled={fetchStatus === 'loading'}
              className={`text-[10px] px-2 py-1 rounded font-medium flex-shrink-0 transition-colors ${
                fetchStatus === 'error' ? 'bg-red-500 text-white' : 'bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50'
              }`}
            >
              {fetchStatus === 'loading' ? '…' : fetchStatus === 'error' ? '✗' : '↵'}
            </button>
          </div>
        )}
      </div>
    )
  }

  const cssFilter = FILTERS[data.filter] || ''
  const clipStyle = CLIP_STYLES[data.clipShape] ?? {}
  const overlayPos = data.overlayText ? (OVERLAY_POSITIONS[data.overlayPosition ?? 'bottom-left'] ?? 'bottom-0 left-0') : null

  return (
    <div
      className="h-full w-full relative"
      style={{ overflow: clipStyle.clipPath ? 'visible' : 'hidden', ...clipStyle }}
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
    >
      {dragging && (
        <div className="absolute inset-0 z-30 bg-amber-500/30 flex items-center justify-center pointer-events-none">
          <span className="text-white text-sm font-medium bg-amber-600/80 px-3 py-1.5 rounded-full">Drop to replace</span>
        </div>
      )}
      <img
        src={src}
        alt={data.caption || ''}
        className="w-full h-full"
        style={{ objectFit: data.fit ?? 'cover', filter: cssFilter }}
        draggable={false}
      />

      {/* Border overlays */}
      {data.borderStyle === 'line'   && <div className="absolute inset-3 border border-white/80 pointer-events-none" />}
      {data.borderStyle === 'thick'  && <div className="absolute inset-3 border-4 border-white pointer-events-none" />}
      {data.borderStyle === 'shadow' && <div className="absolute inset-0 pointer-events-none" style={{ boxShadow: 'inset 0 0 50px rgba(0,0,0,0.35)' }} />}
      {data.borderStyle === 'double' && <div className="absolute inset-2 border-2 border-white/70 pointer-events-none" />}
      {data.borderStyle === 'dark'   && <div className="absolute inset-3 border border-stone-900/60 pointer-events-none" />}

      {/* Bottom caption bar */}
      {data.caption && !data.overlayText && (
        <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs px-2 py-1.5 text-center leading-snug pointer-events-none">
          {data.caption}
        </div>
      )}

      {/* Overlay text */}
      {data.overlayText && (
        <div
          className={`absolute ${overlayPos} pointer-events-none`}
          style={{ padding: '8% 10%' }}
        >
          <span
            className="text-white font-bold leading-tight block"
            style={{
              fontSize: 'clamp(10px, 3cqw, 22px)',
              textShadow: '0 1px 6px rgba(0,0,0,0.7), 0 0 20px rgba(0,0,0,0.4)',
              fontFamily: 'Georgia, serif',
            }}
          >
            {data.overlayText}
          </span>
        </div>
      )}
    </div>
  )
}
