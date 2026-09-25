import { useRef } from 'react'
import { useEditorStore } from '../../../store/editorStore'
import { uploadPhoto } from '../../../firebase/storageHelpers'
import { fsSavePhoto } from '../../../firebase/firestoreHelpers'
import { useAuth } from '../../../context/AuthContext'

export default function CollageElement({ element }) {
  const { updateElement, notebook } = useEditorStore()
  const { user } = useAuth()
  const { data } = element
  const photos = data.photos ?? []
  const cols = data.columns ?? 2
  const gap = data.gap ?? 4
  const radius = data.borderRadius ?? 4
  const fileRef = useRef(null)
  const pendingSlot = useRef(null)

  const handleFileChange = async (e) => {
    const file = e.target.files[0]
    if (!file || !user || !notebook) return
    e.target.value = ''
    const photoMeta = await uploadPhoto(file, file.name, user.uid, notebook.id)
    await fsSavePhoto(user.uid, { ...photoMeta, notebookId: notebook.id })
    const slot = pendingSlot.current
    const newPhotos = [...photos]
    if (slot != null && slot < newPhotos.length) {
      newPhotos[slot] = { photoId: photoMeta.id, thumbnailUrl: photoMeta.thumbnailUrl, storageUrl: photoMeta.storageUrl }
    } else {
      newPhotos.push({ photoId: photoMeta.id, thumbnailUrl: photoMeta.thumbnailUrl, storageUrl: photoMeta.storageUrl })
    }
    updateElement(element.id, { data: { ...data, photos: newPhotos } })
    pendingSlot.current = null
  }

  const triggerUpload = (slot) => {
    pendingSlot.current = slot
    fileRef.current?.click()
  }

  const removePhoto = (idx) => {
    const next = photos.filter((_, i) => i !== idx)
    updateElement(element.id, { data: { ...data, photos: next } })
  }

  const maxPhotos = cols * Math.ceil(6 / cols)

  return (
    <div className="absolute inset-0 p-1" style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: `${gap}px` }}>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      {photos.map((photo, idx) => (
        <div key={idx} className="relative group overflow-hidden" style={{ borderRadius: radius }}>
          <img
            src={photo.thumbnailUrl}
            alt=""
            className="w-full h-full object-cover"
          />
          <button
            className="absolute top-1 right-1 w-5 h-5 bg-black/50 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
            onClick={e => { e.stopPropagation(); removePhoto(idx) }}
          >×</button>
        </div>
      ))}
      {photos.length < maxPhotos && (
        <button
          className="relative overflow-hidden border-2 border-dashed border-stone-300 hover:border-amber-400 transition-colors flex flex-col items-center justify-center gap-1 text-stone-400 hover:text-amber-600"
          style={{ borderRadius: radius, minHeight: 40 }}
          onClick={e => { e.stopPropagation(); triggerUpload(photos.length) }}
        >
          <span className="text-xl leading-none">+</span>
          <span className="text-[9px]">Add photo</span>
        </button>
      )}
    </div>
  )
}
