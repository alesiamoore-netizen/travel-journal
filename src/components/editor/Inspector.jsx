import { useEffect, useRef, useState } from 'react'
import { useEditorStore } from '../../store/editorStore'
import { TILE_STYLES } from '../map/RouteMap'
import ThemePanel from './ThemePanel'
import { db } from '../../db'

const FONT_OPTIONS = [
  { label: 'Georgia',         value: 'Georgia' },
  { label: 'Times New Roman', value: 'Times New Roman' },
  { label: 'Garamond',        value: 'Garamond' },
  { label: 'Palatino',        value: 'Palatino Linotype' },
  { label: 'Arial',           value: 'Arial' },
  { label: 'Helvetica Neue',  value: 'Helvetica Neue' },
  { label: 'Trebuchet MS',    value: 'Trebuchet MS' },
  { label: 'Courier New',     value: 'Courier New' },
]

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs text-stone-400 mb-1.5">{label}</label>
      {children}
    </div>
  )
}

function TextInspector({ element }) {
  const { updateElement, deleteElement } = useEditorStore()
  const { data } = element

  const update = patch => updateElement(element.id, { data: { ...data, ...patch } })

  return (
    <div className="p-4 space-y-4">
      <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">Text Block</p>

      <Field label="Font family">
        <select
          value={data.fontFamily}
          onChange={e => update({ fontFamily: e.target.value })}
          className="w-full border border-stone-200 rounded-md px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
          style={{ fontFamily: data.fontFamily }}
        >
          {FONT_OPTIONS.map(f => (
            <option key={f.value} value={f.value} style={{ fontFamily: f.value }}>
              {f.label}
            </option>
          ))}
        </select>
      </Field>

      <Field label={`Font size — ${data.fontSize}px`}>
        <input
          type="range" min="10" max="72"
          value={data.fontSize}
          onChange={e => update({ fontSize: Number(e.target.value) })}
          className="w-full accent-amber-700"
        />
      </Field>

      <Field label="Text color">
        <div className="flex items-center gap-2.5">
          <input
            type="color"
            value={data.color}
            onChange={e => update({ color: e.target.value })}
            className="w-8 h-8 rounded border border-stone-200 cursor-pointer p-0.5"
          />
          <code className="text-xs text-stone-500">{data.color}</code>
        </div>
      </Field>

      <Field label="Columns">
        <div className="flex gap-1">
          {[1, 2, 3].map(n => (
            <button
              key={n}
              onClick={() => update({ columns: n })}
              className={`flex-1 py-1.5 text-sm rounded-md border font-medium transition-colors ${
                data.columns === n
                  ? 'bg-amber-700 text-white border-amber-700'
                  : 'border-stone-200 text-stone-600 hover:bg-stone-50'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </Field>

      <div className="pt-3 border-t border-stone-100 space-y-2">
        <p className="text-xs text-stone-400 leading-relaxed">
          Ctrl+B bold · Ctrl+I italic · Ctrl+U underline
        </p>
        <button
          onClick={() => deleteElement(element.id)}
          className="w-full py-1.5 text-sm text-red-600 border border-red-200 rounded-md hover:bg-red-50 transition-colors"
        >
          Delete element
        </button>
      </div>
    </div>
  )
}

function PhotoPicker({ notebookId, selectedId, onSelect }) {
  const [photos, setPhotos] = useState([])
  const [thumbUrls, setThumbUrls] = useState({})

  useEffect(() => {
    db.photos.where('notebookId').equals(notebookId).reverse().sortBy('uploadedAt').then(setPhotos)
  }, [notebookId])

  useEffect(() => {
    const urls = {}
    photos.forEach(p => {
      if (p.thumbnailBlob) urls[p.id] = URL.createObjectURL(p.thumbnailBlob)
    })
    setThumbUrls(urls)
    return () => Object.values(urls).forEach(URL.revokeObjectURL)
  }, [photos])

  if (photos.length === 0) {
    return (
      <p className="text-xs text-stone-400 leading-relaxed">
        No photos yet — go to Capture to upload some first.
      </p>
    )
  }

  return (
    <div className="grid grid-cols-3 gap-1 max-h-48 overflow-y-auto">
      {photos.map(p => (
        <button
          key={p.id}
          onClick={() => onSelect(p.id)}
          className={`aspect-square rounded overflow-hidden border-2 transition-colors ${
            selectedId === p.id
              ? 'border-amber-500'
              : 'border-transparent hover:border-stone-300'
          }`}
        >
          {thumbUrls[p.id]
            ? <img src={thumbUrls[p.id]} alt="" className="w-full h-full object-cover" />
            : <div className="w-full h-full bg-stone-200" />}
        </button>
      ))}
    </div>
  )
}

function ImageInspector({ element }) {
  const { updateElement, deleteElement, notebook } = useEditorStore()
  const { data } = element
  const update = patch => updateElement(element.id, { data: { ...data, ...patch } })
  const fileInputRef = useRef(null)

  const handleUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const { generateThumbnail } = await import('../../utils/thumbnail')
    const thumbnailBlob = await generateThumbnail(file, 400)
    const photo = {
      id: crypto.randomUUID(),
      notebookId: notebook.id,
      filename: file.name,
      mimeType: file.type,
      size: file.size,
      blob: file,
      thumbnailBlob,
      uploadedAt: new Date().toISOString(),
      exif: {},
    }
    await db.photos.add(photo)
    update({ photoId: photo.id })
    e.target.value = ''
  }

  return (
    <div className="p-4 space-y-4">
      <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">Image Block</p>

      <Field label="Photo">
        <PhotoPicker
          notebookId={notebook.id}
          selectedId={data.photoId}
          onSelect={photoId => update({ photoId })}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleUpload}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="mt-2 w-full py-1.5 text-xs font-medium border border-stone-200 rounded-md text-stone-600 hover:bg-stone-50 transition-colors"
        >
          + Upload photo
        </button>
      </Field>

      <Field label="Fit">
        <div className="flex gap-1">
          {['cover', 'contain', 'fill'].map(f => (
            <button
              key={f}
              onClick={() => update({ fit: f })}
              className={`flex-1 py-1.5 text-xs rounded-md border font-medium capitalize transition-colors ${
                (data.fit ?? 'cover') === f
                  ? 'bg-amber-700 text-white border-amber-700'
                  : 'border-stone-200 text-stone-600 hover:bg-stone-50'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Caption">
        <input
          type="text"
          value={data.caption ?? ''}
          onChange={e => update({ caption: e.target.value })}
          placeholder="Optional caption…"
          className="w-full border border-stone-200 rounded-md px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
        />
      </Field>

      <div className="pt-3 border-t border-stone-100">
        <button
          onClick={() => deleteElement(element.id)}
          className="w-full py-1.5 text-sm text-red-600 border border-red-200 rounded-md hover:bg-red-50 transition-colors"
        >
          Delete element
        </button>
      </div>
    </div>
  )
}

function MapInspector({ element }) {
  const { updateElement, deleteElement } = useEditorStore()
  const { data } = element
  const update = patch => updateElement(element.id, { data: { ...data, ...patch } })

  return (
    <div className="p-4 space-y-4">
      <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">Route Map</p>

      <Field label="Map style">
        <div className="grid grid-cols-2 gap-1">
          {Object.entries(TILE_STYLES).map(([key, style]) => (
            <button
              key={key}
              onClick={() => update({ tileStyle: key })}
              className={`py-1.5 text-xs rounded-md border font-medium transition-colors ${
                data.tileStyle === key
                  ? 'bg-amber-700 text-white border-amber-700'
                  : 'border-stone-200 text-stone-600 hover:bg-stone-50'
              }`}
            >
              {style.label}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Route color">
        <div className="flex items-center gap-2.5">
          <input
            type="color"
            value={data.routeColor}
            onChange={e => update({ routeColor: e.target.value })}
            className="w-8 h-8 rounded border border-stone-200 cursor-pointer p-0.5"
          />
          <code className="text-xs text-stone-500">{data.routeColor}</code>
        </div>
      </Field>

      <Field label="Pin color">
        <div className="flex items-center gap-2.5">
          <input
            type="color"
            value={data.pinColor}
            onChange={e => update({ pinColor: e.target.value })}
            className="w-8 h-8 rounded border border-stone-200 cursor-pointer p-0.5"
          />
          <code className="text-xs text-stone-500">{data.pinColor}</code>
        </div>
      </Field>

      <Field label="Options">
        <div className="flex flex-col gap-1.5">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={data.showRoute}
              onChange={e => update({ showRoute: e.target.checked })}
              className="accent-amber-700"
            />
            <span className="text-xs text-stone-600">Show route line</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={data.showPins}
              onChange={e => update({ showPins: e.target.checked })}
              className="accent-amber-700"
            />
            <span className="text-xs text-stone-600">Show location pins</span>
          </label>
        </div>
      </Field>

      <div className="pt-3 border-t border-stone-100">
        <button
          onClick={() => deleteElement(element.id)}
          className="w-full py-1.5 text-sm text-red-600 border border-red-200 rounded-md hover:bg-red-50 transition-colors"
        >
          Delete element
        </button>
      </div>
    </div>
  )
}

export default function Inspector() {
  const { elements, selectedId } = useEditorStore()
  const selected = elements.find(e => e.id === selectedId)

  return (
    <aside className="w-56 bg-white border-l border-stone-200 overflow-y-auto flex-shrink-0">
      {!selected ? (
        <ThemePanel />
      ) : selected.type === 'text' ? (
        <TextInspector element={selected} />
      ) : selected.type === 'image' ? (
        <ImageInspector element={selected} />
      ) : selected.type === 'map' ? (
        <MapInspector element={selected} />
      ) : null}
    </aside>
  )
}
