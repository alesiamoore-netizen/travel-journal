import { useRef } from 'react'
import { useEditorStore } from '../../../store/editorStore'
import { uploadPhoto } from '../../../firebase/storageHelpers'
import { fsSavePhoto } from '../../../firebase/firestoreHelpers'
import { useAuth } from '../../../context/AuthContext'

export default function CoverElement({ element }) {
  const { updateElement, notebook } = useEditorStore()
  const { user } = useAuth()
  const { data } = element
  const fileRef = useRef(null)

  const bg = data.storageUrl ?? data.thumbnailUrl
  const title = data.title || notebook?.name || ''
  const subtitle = data.subtitle || ''
  const overlayColor = data.overlayColor ?? '#00000055'
  const titleColor = data.titleColor ?? '#ffffff'
  const subtitleColor = data.subtitleColor ?? '#ffffffcc'
  const titleAlign = data.titleAlign ?? 'center'

  const handleFile = async (e) => {
    const file = e.target.files[0]
    if (!file || !user || !notebook) return
    e.target.value = ''
    const meta = await uploadPhoto(file, file.name, user.uid, notebook.id)
    await fsSavePhoto(user.uid, { ...meta, notebookId: notebook.id })
    updateElement(element.id, { data: { ...data, storageUrl: meta.storageUrl, thumbnailUrl: meta.thumbnailUrl, photoId: meta.id } })
  }

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden">
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />

      {/* Background photo */}
      {bg ? (
        <img src={bg} alt="" className="absolute inset-0 w-full h-full object-cover" draggable={false} />
      ) : (
        <button
          className="absolute inset-0 bg-stone-200 flex flex-col items-center justify-center gap-2 text-stone-400 hover:bg-stone-300 transition-colors"
          onClick={e => { e.stopPropagation(); fileRef.current?.click() }}
        >
          <span className="text-4xl">🌅</span>
          <span className="text-xs">Click to add cover photo</span>
        </button>
      )}

      {/* Overlay */}
      {bg && <div className="absolute inset-0" style={{ backgroundColor: overlayColor }} />}

      {/* Text */}
      {bg && (
        <div className={`relative z-10 px-8 text-${titleAlign} w-full pointer-events-none`}>
          {title && (
            <div
              className="font-bold leading-tight mb-2"
              style={{
                color: titleColor,
                fontSize: 'clamp(18px, 6%, 52px)',
                fontFamily: data.titleFont ?? 'Georgia, serif',
                textShadow: '0 2px 8px rgba(0,0,0,0.4)',
              }}
            >
              {title}
            </div>
          )}
          {subtitle && (
            <div
              className="font-normal"
              style={{
                color: subtitleColor,
                fontSize: 'clamp(10px, 3%, 22px)',
                fontFamily: data.titleFont ?? 'Georgia, serif',
                textShadow: '0 1px 4px rgba(0,0,0,0.4)',
              }}
            >
              {subtitle}
            </div>
          )}
        </div>
      )}

      {/* Replace photo button when bg is set */}
      {bg && (
        <button
          className="absolute bottom-2 right-2 z-20 px-2 py-1 text-[10px] bg-black/40 text-white rounded hover:bg-black/60 transition-colors"
          onClick={e => { e.stopPropagation(); fileRef.current?.click() }}
        >
          Change photo
        </button>
      )}
    </div>
  )
}
