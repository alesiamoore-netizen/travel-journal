import { useEffect, useRef, useState } from 'react'
import { useEditorStore } from '../../store/editorStore'
import { TILE_STYLES } from '../map/RouteMap'
import ThemePanel from './ThemePanel'
import CollabPanel from './CollabPanel'
import { db } from '../../db'
import { TEXT_STYLES, applyTextStyle } from '../../data/textStyles'
import { STICKER_LIST } from './elements/StickerElement'

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

      <Field label="Style">
        <div className="grid grid-cols-2 gap-1">
          {Object.entries(TEXT_STYLES).map(([id, s]) => (
            <button
              key={id}
              onClick={() => {
                const preset = applyTextStyle(id)
                update({ textStyle: id, fontSize: preset.fontSize, color: preset.color })
              }}
              className={`py-1 text-xs rounded border font-medium transition-colors ${
                (data.textStyle ?? 'body') === id
                  ? 'bg-amber-700 text-white border-amber-700'
                  : 'border-stone-200 text-stone-500 hover:bg-stone-50'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </Field>

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

      <Field label="Background">
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={data.backgroundColor === 'transparent' || !data.backgroundColor ? '#ffffff' : data.backgroundColor}
            onChange={e => update({ backgroundColor: e.target.value })}
            className="w-8 h-8 rounded border border-stone-200 cursor-pointer p-0.5"
          />
          <button
            onClick={() => update({ backgroundColor: 'transparent' })}
            className={`text-xs px-2 py-1 rounded border transition-colors ${
              (!data.backgroundColor || data.backgroundColor === 'transparent')
                ? 'bg-amber-700 text-white border-amber-700'
                : 'border-stone-200 text-stone-500 hover:bg-stone-50'
            }`}
          >
            None
          </button>
        </div>
      </Field>

      <Field label={`Rotation — ${data.rotation ?? 0}°`}>
        <input
          type="range" min="-12" max="12" step="0.5"
          value={data.rotation ?? 0}
          onChange={e => update({ rotation: Number(e.target.value) })}
          className="w-full accent-amber-700"
        />
        {(data.rotation ?? 0) !== 0 && (
          <button
            onClick={() => update({ rotation: 0 })}
            className="mt-1 text-xs text-stone-400 hover:text-stone-600"
          >
            Reset to straight
          </button>
        )}
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

      <Field label="Filter">
        <div className="grid grid-cols-3 gap-1">
          {[
            { id: 'none',      label: 'None'      },
            { id: 'warm',      label: 'Warm'      },
            { id: 'cool',      label: 'Cool'      },
            { id: 'grayscale', label: 'B&W'       },
            { id: 'sepia',     label: 'Sepia'     },
            { id: 'fade',      label: 'Fade'      },
            { id: 'dramatic',  label: 'Drama'     },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => update({ filter: f.id })}
              className={`py-1 text-xs rounded border font-medium transition-colors ${
                (data.filter ?? 'none') === f.id
                  ? 'bg-amber-700 text-white border-amber-700'
                  : 'border-stone-200 text-stone-500 hover:bg-stone-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Shadow">
        <div className="flex gap-1">
          {[
            { id: 'none', label: 'None' },
            { id: 'soft', label: 'Soft' },
            { id: 'hard', label: 'Hard' },
          ].map(s => (
            <button
              key={s.id}
              onClick={() => update({ shadow: s.id })}
              className={`flex-1 py-1 text-xs rounded border font-medium transition-colors ${
                (data.shadow ?? 'none') === s.id
                  ? 'bg-amber-700 text-white border-amber-700'
                  : 'border-stone-200 text-stone-500 hover:bg-stone-50'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Border">
        <div className="grid grid-cols-3 gap-1">
          {[
            { id: 'none',   label: 'None'   },
            { id: 'line',   label: 'Thin'   },
            { id: 'thick',  label: 'Thick'  },
            { id: 'double', label: 'Double' },
            { id: 'shadow', label: 'Shadow' },
            { id: 'dark',   label: 'Dark'   },
          ].map(b => (
            <button
              key={b.id}
              onClick={() => update({ borderStyle: b.id })}
              className={`py-1 text-xs rounded border font-medium transition-colors ${
                (data.borderStyle ?? 'none') === b.id
                  ? 'bg-amber-700 text-white border-amber-700'
                  : 'border-stone-200 text-stone-500 hover:bg-stone-50'
              }`}
            >
              {b.label}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Shape">
        <div className="grid grid-cols-4 gap-1">
          {[
            { id: 'none',     label: '▭ Full'   },
            { id: 'circle',   label: '● Circle'  },
            { id: 'diamond',  label: '◆ Diamond' },
            { id: 'arch',     label: '◑ Arch'   },
            { id: 'hexagon',  label: '⬡ Hex'    },
            { id: 'pentagon', label: '⬠ Pent'   },
            { id: 'tilt',     label: '▱ Tilt'   },
            { id: 'oval',     label: '⬭ Oval'   },
            { id: 'ovalv',    label: '⬯ OvalV'  },
            { id: 'star5',    label: '★ Star'   },
          ].map(s => (
            <button
              key={s.id}
              onClick={() => update({ clipShape: s.id })}
              title={s.label.split(' ')[1]}
              className={`py-1 text-xs rounded border font-medium transition-colors col-span-${s.id === 'none' ? 2 : 1} ${
                (data.clipShape ?? 'none') === s.id
                  ? 'bg-amber-700 text-white border-amber-700'
                  : 'border-stone-200 text-stone-500 hover:bg-stone-50'
              }`}
            >
              {s.label.split(' ')[0]}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Overlay text">
        <input
          type="text"
          value={data.overlayText ?? ''}
          onChange={e => update({ overlayText: e.target.value })}
          placeholder="Text on image…"
          className="w-full border border-stone-200 rounded-md px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
        />
        {data.overlayText && (
          <div className="grid grid-cols-2 gap-1 mt-1">
            {['bottom-left','bottom-right','top-left','top-right','center'].map(pos => (
              <button
                key={pos}
                onClick={() => update({ overlayPosition: pos })}
                className={`py-1 text-[10px] rounded border transition-colors ${
                  (data.overlayPosition ?? 'bottom-left') === pos
                    ? 'bg-amber-700 text-white border-amber-700'
                    : 'border-stone-200 text-stone-500 hover:bg-stone-50'
                }`}
              >
                {pos.replace('-', ' ')}
              </button>
            ))}
          </div>
        )}
      </Field>

      <Field label="Caption">
        <input
          type="text"
          value={data.caption ?? ''}
          onChange={e => update({ caption: e.target.value })}
          placeholder="Bottom bar caption…"
          className="w-full border border-stone-200 rounded-md px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
        />
      </Field>

      <Field label={`Rotation — ${data.rotation ?? 0}°`}>
        <input
          type="range" min="-12" max="12" step="0.5"
          value={data.rotation ?? 0}
          onChange={e => update({ rotation: Number(e.target.value) })}
          className="w-full accent-amber-700"
        />
        {(data.rotation ?? 0) !== 0 && (
          <button
            onClick={() => update({ rotation: 0 })}
            className="mt-1 text-xs text-stone-400 hover:text-stone-600"
          >
            Reset to straight
          </button>
        )}
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

function PagePanel() {
  const { pages, currentPageId, updatePage } = useEditorStore()
  const page = pages.find(p => p.id === currentPageId)
  if (!page) return null
  const upd = patch => updatePage(currentPageId, patch)

  return (
    <div className="p-4 space-y-4 border-b border-stone-100">
      <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">Page</p>

      <div>
        <label className="block text-xs text-stone-400 mb-1.5">Title</label>
        <input
          type="text"
          value={page.title ?? ''}
          onChange={e => upd({ title: e.target.value })}
          placeholder="Page title…"
          className="w-full border border-stone-200 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
        />
      </div>

      <div>
        <label className="block text-xs text-stone-400 mb-1.5">Location</label>
        <input
          type="text"
          value={page.location ?? ''}
          onChange={e => upd({ location: e.target.value })}
          placeholder="City, Country…"
          className="w-full border border-stone-200 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
        />
      </div>

      <div>
        <label className="block text-xs text-stone-400 mb-1.5">Date</label>
        <input
          type="date"
          value={page.date ?? ''}
          onChange={e => upd({ date: e.target.value })}
          className="w-full border border-stone-200 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
        />
      </div>
    </div>
  )
}

function DividerInspector({ element }) {
  const { updateElement, deleteElement, notebook } = useEditorStore()
  const { data } = element
  const accent = notebook?.theme?.accentColor ?? '#c0813a'
  const update = patch => updateElement(element.id, { data: { ...data, ...patch } })

  return (
    <div className="p-4 space-y-4">
      <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">Divider</p>

      <Field label="Style">
        <div className="grid grid-cols-2 gap-1">
          {[
            { id: 'line',   label: '— Thin'   },
            { id: 'thick',  label: '— Thick'  },
            { id: 'double', label: '= Double' },
            { id: 'dotted', label: '··· Dots'  },
            { id: 'ornate', label: '✦ Ornate' },
            { id: 'wave',   label: '~ Wave'   },
          ].map(s => (
            <button
              key={s.id}
              onClick={() => update({ style: s.id })}
              className={`py-1 text-xs rounded border font-medium transition-colors ${
                (data.style ?? 'line') === s.id
                  ? 'bg-amber-700 text-white border-amber-700'
                  : 'border-stone-200 text-stone-500 hover:bg-stone-50'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Color">
        <div className="flex items-center gap-2">
          <button
            onClick={() => update({ color: 'accent' })}
            className={`w-7 h-7 rounded border-2 flex-shrink-0 ${data.color === 'accent' ? 'border-amber-500' : 'border-stone-200'}`}
            style={{ backgroundColor: accent }}
            title="Accent color"
          />
          <input
            type="color"
            value={data.color === 'accent' ? accent : (data.color ?? accent)}
            onChange={e => update({ color: e.target.value })}
            className="w-7 h-7 rounded border border-stone-200 cursor-pointer p-0.5 flex-shrink-0"
          />
          <span className="text-xs text-stone-400">Custom</span>
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

function StickerInspector({ element }) {
  const { updateElement, deleteElement, notebook } = useEditorStore()
  const { data } = element
  const update = patch => updateElement(element.id, { data: { ...data, ...patch } })

  return (
    <div className="p-4 space-y-4">
      <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">Sticker</p>

      <Field label="Style">
        <div className="grid grid-cols-3 gap-1">
          {STICKER_LIST.map(s => (
            <button
              key={s.id}
              onClick={() => update({ stickerId: s.id })}
              className={`py-1 text-[10px] rounded border font-medium transition-colors ${
                (data.stickerId ?? 'compass') === s.id
                  ? 'bg-amber-700 text-white border-amber-700'
                  : 'border-stone-200 text-stone-500 hover:bg-stone-50'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Color">
        <div className="flex items-center gap-2.5">
          <input
            type="color"
            value={data.color ?? '#c0813a'}
            onChange={e => update({ color: e.target.value })}
            className="w-8 h-8 rounded border border-stone-200 cursor-pointer p-0.5"
          />
          <code className="text-xs text-stone-500">{data.color ?? '#c0813a'}</code>
        </div>
      </Field>

      <Field label={`Opacity — ${Math.round((data.opacity ?? 1) * 100)}%`}>
        <input
          type="range" min="0.1" max="1" step="0.05"
          value={data.opacity ?? 1}
          onChange={e => update({ opacity: Number(e.target.value) })}
          className="w-full accent-amber-700"
        />
      </Field>

      <Field label={`Rotation — ${data.rotation ?? 0}°`}>
        <input
          type="range" min="-180" max="180" step="1"
          value={data.rotation ?? 0}
          onChange={e => update({ rotation: Number(e.target.value) })}
          className="w-full accent-amber-700"
        />
        {(data.rotation ?? 0) !== 0 && (
          <button onClick={() => update({ rotation: 0 })} className="mt-1 text-xs text-stone-400 hover:text-stone-600">
            Reset
          </button>
        )}
      </Field>

      <div className="pt-3 border-t border-stone-100">
        <button
          onClick={() => deleteElement(element.id)}
          className="w-full py-1.5 text-sm text-red-600 border border-red-200 rounded-md hover:bg-red-50 transition-colors"
        >
          Delete sticker
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
        <>
          <PagePanel />
          <ThemePanel />
          <CollabPanel />
        </>
      ) : selected?.type === 'text' ? (
        <TextInspector element={selected} />
      ) : selected.type === 'image' ? (
        <ImageInspector element={selected} />
      ) : selected.type === 'map' ? (
        <MapInspector element={selected} />
      ) : selected.type === 'divider' ? (
        <DividerInspector element={selected} />
      ) : selected.type === 'sticker' ? (
        <StickerInspector element={selected} />
      ) : null}
    </aside>
  )
}
