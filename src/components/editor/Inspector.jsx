import { useCallback, useEffect, useRef, useState } from 'react'
import { useEditorStore } from '../../store/editorStore'
import { useAuth } from '../../context/AuthContext'
import { TILE_STYLES } from '../map/RouteMap'
import ThemePanel from './ThemePanel'
import CollabPanel from './CollabPanel'
import { TEXT_STYLES, applyTextStyle } from '../../data/textStyles'
import { STICKER_LIST } from './elements/StickerElement'
import { fsLoadPhotos, fsSavePhoto } from '../../firebase/firestoreHelpers'
import { uploadPhoto } from '../../firebase/storageHelpers'

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

function PhotoPicker({ notebookId, uid, selectedId, onSelect }) {
  const [photos, setPhotos] = useState([])

  useEffect(() => {
    if (uid && notebookId) {
      fsLoadPhotos(uid, notebookId).then(ps => setPhotos(ps ?? []))
    }
  }, [uid, notebookId])

  if (photos.length === 0) {
    return (
      <p className="text-xs text-stone-400 leading-relaxed">
        No photos yet — drag an image into an image block to upload.
      </p>
    )
  }

  return (
    <div className="grid grid-cols-3 gap-1 max-h-48 overflow-y-auto">
      {photos.map(p => (
        <button
          key={p.id}
          onClick={() => onSelect(p)}
          className={`aspect-square rounded overflow-hidden border-2 transition-colors ${
            selectedId === p.id
              ? 'border-amber-500'
              : 'border-transparent hover:border-stone-300'
          }`}
        >
          {p.thumbnailUrl
            ? <img src={p.thumbnailUrl} alt="" className="w-full h-full object-cover" />
            : <div className="w-full h-full bg-stone-200" />}
        </button>
      ))}
    </div>
  )
}

function ImageInspector({ element }) {
  const { updateElement, deleteElement, notebook, setCoverPhoto } = useEditorStore()
  const { user } = useAuth()
  const { data } = element
  const update = patch => updateElement(element.id, { data: { ...data, ...patch } })
  const fileInputRef = useRef(null)
  const [uploading, setUploading] = useState(false)

  const handleUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !user || !notebook) return
    setUploading(true)
    try {
      const photo = await uploadPhoto(file, file.name, user.uid, notebook.id)
      await fsSavePhoto(user.uid, photo)
      update({ photoId: photo.id, storageUrl: photo.storageUrl, thumbnailUrl: photo.thumbnailUrl })
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  return (
    <div className="p-4 space-y-4">
      <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">Image Block</p>

      <Field label="Photo library">
        <PhotoPicker
          notebookId={notebook?.id}
          uid={user?.uid}
          selectedId={data.photoId}
          onSelect={p => update({ photoId: p.id, storageUrl: p.storageUrl, thumbnailUrl: p.thumbnailUrl })}
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
          disabled={uploading}
          className="mt-2 w-full py-1.5 text-xs font-medium border border-stone-200 rounded-md text-stone-600 hover:bg-stone-50 transition-colors disabled:opacity-50"
        >
          {uploading ? 'Uploading…' : '+ Upload photo'}
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
          placeholder="Caption text…"
          className="w-full border border-stone-200 rounded-md px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
        />
        {data.caption && (
          <div className="space-y-2 mt-1">
            <div className="flex gap-1">
              {[['below', 'Below photo'], ['overlay', 'Overlay']].map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => update({ captionStyle: val })}
                  className={`flex-1 py-1 text-xs rounded border transition-colors ${
                    (data.captionStyle ?? 'below') === val
                      ? 'bg-amber-700 text-white border-amber-700'
                      : 'border-stone-200 text-stone-500 hover:border-stone-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={data.captionColor ?? '#888888'}
                onChange={e => update({ captionColor: e.target.value })}
                className="w-7 h-7 rounded border border-stone-200 cursor-pointer p-0.5 flex-shrink-0"
                title="Caption color"
              />
              <select
                value={data.captionFont ?? 'Georgia'}
                onChange={e => update({ captionFont: e.target.value })}
                className="flex-1 border border-stone-200 rounded px-1.5 py-1 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                style={{ fontFamily: data.captionFont ?? 'Georgia' }}
              >
                {FONT_OPTIONS.map(f => (
                  <option key={f.value} value={f.value} style={{ fontFamily: f.value }}>{f.label}</option>
                ))}
              </select>
              <div className="flex gap-0.5 flex-shrink-0">
                {[['left','←'],['center','↔'],['right','→']].map(([val, icon]) => (
                  <button
                    key={val}
                    onClick={() => update({ captionAlign: val })}
                    title={val}
                    className={`w-6 h-6 text-xs rounded border transition-colors ${
                      (data.captionAlign ?? 'center') === val
                        ? 'bg-amber-700 text-white border-amber-700'
                        : 'border-stone-200 text-stone-500 hover:border-stone-300'
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
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

      {data.storageUrl && (
        <Field label="Journal cover">
          <button
            onClick={() => setCoverPhoto(data.storageUrl)}
            title="Use this photo as the journal cover thumbnail"
            className="w-full py-1.5 text-xs border border-amber-200 text-amber-700 rounded-md hover:bg-amber-50 transition-colors"
          >
            ⊕ Set as journal cover
          </button>
        </Field>
      )}

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
  const isPinMode = data.mode === 'pin'
  const isItinerary = data.mode === 'itinerary'

  const [pinSearch, setPinSearch] = useState('')
  const [pinSearching, setPinSearching] = useState(false)
  const [pinError, setPinError] = useState('')
  const [stopSearch, setStopSearch] = useState('')
  const [stopSearching, setStopSearching] = useState(false)

  const searchPin = async () => {
    const q = pinSearch.trim()
    if (!q) return
    setPinSearching(true)
    setPinError('')
    try {
      const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=1&language=en&format=json`)
      const d = await res.json()
      if (!d.results?.length) throw new Error(`"${q}" not found`)
      const { latitude, longitude, name, country } = d.results[0]
      update({ pinLat: latitude, pinLng: longitude, pinLabel: `${name}, ${country}` })
      setPinSearch('')
    } catch (e) {
      setPinError(e.message)
    } finally {
      setPinSearching(false)
    }
  }

  const addStop = async () => {
    const q = stopSearch.trim()
    if (!q) return
    setStopSearching(true)
    try {
      const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=1&language=en&format=json`)
      const d = await res.json()
      if (!d.results?.length) return
      const { latitude, longitude, name, country } = d.results[0]
      const stops = [...(data.stops ?? []), { id: crypto.randomUUID(), label: `${name}, ${country}`, lat: latitude, lng: longitude }]
      update({ stops })
      setStopSearch('')
    } finally {
      setStopSearching(false)
    }
  }

  return (
    <div className="p-4 space-y-4">
      <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">Map</p>

      <Field label="Mode">
        <div className="grid grid-cols-3 gap-1">
          {[['route', 'Route'], ['pin', 'Pin'], ['itinerary', 'Stops']].map(([val, label]) => (
            <button
              key={val}
              onClick={() => update({ mode: val })}
              className={`py-1.5 text-xs rounded border font-medium transition-colors ${
                (data.mode ?? 'route') === val
                  ? 'bg-amber-700 text-white border-amber-700'
                  : 'border-stone-200 text-stone-600 hover:bg-stone-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </Field>

      {isItinerary ? (
        <div className="space-y-2">
          <p className="text-xs text-stone-500 font-medium">Stops ({(data.stops ?? []).length})</p>
          {(data.stops ?? []).map((stop, idx) => (
            <div key={stop.id} className="flex items-center gap-1.5 bg-stone-50 rounded-md px-2 py-1.5">
              <span className="w-4 h-4 rounded-full bg-amber-700 text-white text-[9px] flex items-center justify-center flex-shrink-0 font-bold">{idx + 1}</span>
              <span className="flex-1 text-xs text-stone-700 truncate">{stop.label}</span>
              <button
                onClick={() => update({ stops: (data.stops ?? []).filter(s => s.id !== stop.id) })}
                className="text-stone-300 hover:text-red-500 text-xs flex-shrink-0"
              >×</button>
            </div>
          ))}
          <div className="flex gap-1">
            <input
              type="text"
              value={stopSearch}
              onChange={e => setStopSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addStop()}
              placeholder="Add a stop…"
              className="flex-1 border border-stone-200 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 min-w-0"
            />
            <button
              onClick={addStop}
              disabled={stopSearching || !stopSearch}
              className="px-2 py-1 text-xs bg-amber-700 text-white rounded-md disabled:opacity-40"
            >
              {stopSearching ? '…' : '+'}
            </button>
          </div>
        </div>
      ) : isPinMode ? (
        <>
          <Field label="Location">
            <div className="flex gap-1">
              <input
                type="text"
                value={pinSearch}
                onChange={e => setPinSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && searchPin()}
                placeholder="Search place…"
                className="flex-1 border border-stone-200 rounded-md px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 min-w-0"
              />
              <button
                onClick={searchPin}
                disabled={pinSearching || !pinSearch}
                className="px-2 py-1 text-xs bg-amber-700 text-white rounded-md disabled:opacity-40 flex-shrink-0"
              >
                {pinSearching ? '…' : '↵'}
              </button>
            </div>
            {pinError && <p className="text-[9px] text-red-500 mt-1">{pinError}</p>}
            {data.pinLabel && <p className="text-[10px] text-stone-500 mt-1 truncate">📍 {data.pinLabel}</p>}
          </Field>
          <Field label={`Zoom — ${data.pinZoom ?? 13}`}>
            <input
              type="range" min="5" max="17" step="1"
              value={data.pinZoom ?? 13}
              onChange={e => update({ pinZoom: Number(e.target.value) })}
              className="w-full accent-amber-700"
            />
          </Field>
        </>
      ) : (
        <>
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
                <input type="checkbox" checked={data.showRoute} onChange={e => update({ showRoute: e.target.checked })} className="accent-amber-700" />
                <span className="text-xs text-stone-600">Show route line</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={data.showPins} onChange={e => update({ showPins: e.target.checked })} className="accent-amber-700" />
                <span className="text-xs text-stone-600">Show location pins</span>
              </label>
            </div>
          </Field>
        </>
      )}

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

function LocationAutocomplete({ value, onChange }) {
  const [query, setQuery] = useState(value ?? '')
  const [results, setResults] = useState([])
  const [open, setOpen] = useState(false)
  const timer = useRef(null)

  useEffect(() => { setQuery(value ?? '') }, [value])

  const handleChange = useCallback((e) => {
    const q = e.target.value
    setQuery(q)
    onChange(q)
    clearTimeout(timer.current)
    if (q.trim().length < 2) { setResults([]); setOpen(false); return }
    timer.current = setTimeout(async () => {
      try {
        const r = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=5&language=en&format=json`)
        const data = await r.json()
        const hits = data.results ?? []
        setResults(hits)
        setOpen(hits.length > 0)
      } catch { setResults([]); setOpen(false) }
    }, 300)
  }, [onChange])

  const pick = useCallback((r) => {
    const label = [r.name, r.admin1, r.country].filter(Boolean).join(', ')
    setQuery(label)
    onChange(label)
    setResults([])
    setOpen(false)
  }, [onChange])

  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={handleChange}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onFocus={() => results.length > 0 && setOpen(true)}
        placeholder="City, Country…"
        className="w-full border border-stone-200 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
      />
      {open && results.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-stone-200 rounded-md shadow-lg z-50 overflow-hidden">
          {results.map(r => {
            const label = [r.name, r.admin1, r.country].filter(Boolean).join(', ')
            return (
              <button
                key={r.id}
                onMouseDown={() => pick(r)}
                className="w-full text-left px-2.5 py-1.5 text-xs text-stone-700 hover:bg-amber-50 transition-colors"
              >
                {label}
              </button>
            )
          })}
        </div>
      )}
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
        <LocationAutocomplete value={page.location ?? ''} onChange={v => upd({ location: v })} />
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

function KeepeakeInspector({ element }) {
  const { updateElement, deleteElement, notebook } = useEditorStore()
  const { data } = element
  const accent = notebook?.theme?.accentColor ?? '#c0813a'
  const update = patch => updateElement(element.id, { data: { ...data, ...patch } })

  return (
    <div className="p-4 space-y-4">
      <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">Keepsake Box</p>

      <Field label="Label">
        <input
          type="text"
          value={data.label ?? ''}
          onChange={e => update({ label: e.target.value })}
          placeholder="Ticket stub, receipt…"
          className="w-full border border-stone-200 rounded-md px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
        />
      </Field>

      <Field label="Hint">
        <input
          type="text"
          value={data.hint ?? ''}
          onChange={e => update({ hint: e.target.value })}
          placeholder="Tape or glue here…"
          className="w-full border border-stone-200 rounded-md px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
        />
      </Field>

      <Field label="Style">
        <div className="grid grid-cols-3 gap-1">
          {[['dashed', 'Dashed'], ['polaroid', 'Polaroid'], ['pocket', 'Pocket']].map(([val, label]) => (
            <button
              key={val}
              onClick={() => update({ style: val })}
              className={`py-1.5 text-xs rounded border font-medium transition-colors ${
                data.style === val ? 'bg-amber-700 text-white border-amber-700' : 'border-stone-200 text-stone-600 hover:bg-stone-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Border color">
        <div className="flex items-center gap-2">
          <button
            onClick={() => update({ borderColor: 'accent' })}
            className={`px-2 py-1 text-xs rounded border transition-colors ${data.borderColor === 'accent' ? 'bg-amber-700 text-white border-amber-700' : 'border-stone-200 text-stone-500 hover:bg-stone-50'}`}
          >
            Theme
          </button>
          <input
            type="color"
            value={data.borderColor === 'accent' ? accent : (data.borderColor ?? accent)}
            onChange={e => update({ borderColor: e.target.value })}
            className="w-8 h-8 rounded border border-stone-200 cursor-pointer p-0.5"
          />
        </div>
      </Field>

      <div className="pt-3 border-t border-stone-100">
        <button
          onClick={() => deleteElement(element.id)}
          className="w-full py-1.5 text-sm text-red-600 border border-red-200 rounded-md hover:bg-red-50 transition-colors"
        >
          Delete keepsake box
        </button>
      </div>
    </div>
  )
}

function WeatherInspector({ element }) {
  const { updateElement, deleteElement } = useEditorStore()
  const { data } = element
  const update = patch => updateElement(element.id, { data: { ...data, ...patch } })

  return (
    <div className="p-4 space-y-4">
      <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">Weather Block</p>

      {data.weatherData ? (
        <>
          <div className="rounded-md bg-stone-50 p-3 space-y-1">
            <p className="text-xs font-semibold text-stone-700">{data.weatherData.locationName}</p>
            <p className="text-xs text-stone-400">{data.weatherData.date}</p>
          </div>
          <Field label="Units">
            <div className="flex gap-1">
              {[['metric', '°C Metric'], ['imperial', '°F Imperial']].map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => update({ units: val })}
                  className={`flex-1 py-1 text-xs rounded border transition-colors ${
                    (data.units ?? 'metric') === val ? 'bg-amber-700 text-white border-amber-700' : 'border-stone-200 text-stone-500 hover:bg-stone-50'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </Field>
          <button
            onClick={() => update({ weatherData: null })}
            className="w-full py-1.5 text-xs text-stone-500 border border-stone-200 rounded-md hover:bg-stone-50 transition-colors"
          >
            Edit location / date
          </button>
        </>
      ) : (
        <p className="text-xs text-stone-400 leading-relaxed">Enter a city and date directly on the element to fetch weather data.</p>
      )}

      <div className="pt-3 border-t border-stone-100">
        <button
          onClick={() => deleteElement(element.id)}
          className="w-full py-1.5 text-sm text-red-600 border border-red-200 rounded-md hover:bg-red-50 transition-colors"
        >
          Delete weather block
        </button>
      </div>
    </div>
  )
}

function CollageInspector({ element }) {
  const { updateElement, deleteElement } = useEditorStore()
  const { data } = element
  const update = patch => updateElement(element.id, { data: { ...data, ...patch } })

  return (
    <div className="p-4 space-y-4">
      <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">Collage</p>

      <Field label="Columns">
        <div className="flex gap-1">
          {[2, 3, 4].map(c => (
            <button key={c} onClick={() => update({ columns: c })}
              className={`flex-1 py-1 text-xs rounded border transition-colors ${(data.columns ?? 2) === c ? 'bg-amber-700 text-white border-amber-700' : 'border-stone-200 text-stone-500 hover:bg-stone-50'}`}>
              {c}
            </button>
          ))}
        </div>
      </Field>

      <Field label={`Gap — ${data.gap ?? 4}px`}>
        <input type="range" min="0" max="16" step="2" value={data.gap ?? 4}
          onChange={e => update({ gap: Number(e.target.value) })} className="w-full accent-amber-700" />
      </Field>

      <Field label={`Radius — ${data.borderRadius ?? 4}px`}>
        <input type="range" min="0" max="20" step="2" value={data.borderRadius ?? 4}
          onChange={e => update({ borderRadius: Number(e.target.value) })} className="w-full accent-amber-700" />
      </Field>

      {(data.photos ?? []).length > 0 && (
        <button onClick={() => update({ photos: [] })}
          className="w-full py-1.5 text-xs text-stone-500 border border-stone-200 rounded-md hover:bg-stone-50 transition-colors">
          Clear all photos
        </button>
      )}

      <div className="pt-3 border-t border-stone-100">
        <button onClick={() => deleteElement(element.id)}
          className="w-full py-1.5 text-sm text-red-600 border border-red-200 rounded-md hover:bg-red-50 transition-colors">
          Delete collage
        </button>
      </div>
    </div>
  )
}

function DrawingInspector({ element }) {
  const { updateElement, deleteElement } = useEditorStore()
  const { data } = element
  const update = patch => updateElement(element.id, { data: { ...data, ...patch } })

  return (
    <div className="p-4 space-y-4">
      <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">Drawing</p>

      <Field label="Pen color">
        <div className="flex items-center gap-2.5">
          <input type="color" value={data.strokeColor ?? '#2c2c2c'}
            onChange={e => update({ strokeColor: e.target.value })}
            className="w-8 h-8 rounded border border-stone-200 cursor-pointer p-0.5" />
          <code className="text-xs text-stone-500">{data.strokeColor ?? '#2c2c2c'}</code>
        </div>
      </Field>

      <Field label={`Stroke width — ${data.strokeWidth ?? 2}`}>
        <input type="range" min="1" max="12" step="1" value={data.strokeWidth ?? 2}
          onChange={e => update({ strokeWidth: Number(e.target.value) })} className="w-full accent-amber-700" />
      </Field>

      <Field label="Background">
        <div className="flex gap-1">
          {[['transparent', 'None'], ['#ffffff', 'White'], ['#fffef0', 'Cream']].map(([val, label]) => (
            <button key={val} onClick={() => update({ backgroundColor: val })}
              className={`flex-1 py-1 text-[10px] rounded border transition-colors ${(data.backgroundColor ?? 'transparent') === val ? 'bg-amber-700 text-white border-amber-700' : 'border-stone-200 text-stone-500 hover:bg-stone-50'}`}>
              {label}
            </button>
          ))}
        </div>
      </Field>

      {(data.strokes ?? []).length > 0 && (
        <button onClick={() => update({ strokes: [] })}
          className="w-full py-1.5 text-xs text-stone-500 border border-stone-200 rounded-md hover:bg-stone-50 transition-colors">
          Clear drawing
        </button>
      )}

      <div className="pt-3 border-t border-stone-100">
        <button onClick={() => deleteElement(element.id)}
          className="w-full py-1.5 text-sm text-red-600 border border-red-200 rounded-md hover:bg-red-50 transition-colors">
          Delete drawing
        </button>
      </div>
    </div>
  )
}

function CoverInspector({ element }) {
  const { updateElement, deleteElement } = useEditorStore()
  const { data } = element
  const update = patch => updateElement(element.id, { data: { ...data, ...patch } })

  return (
    <div className="p-4 space-y-4">
      <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">Cover Block</p>

      <Field label="Title">
        <input type="text" value={data.title ?? ''} onChange={e => update({ title: e.target.value })}
          placeholder="Journal title…"
          className="w-full border border-stone-200 rounded-md px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500" />
      </Field>

      <Field label="Subtitle">
        <input type="text" value={data.subtitle ?? ''} onChange={e => update({ subtitle: e.target.value })}
          placeholder="Dates, location, tagline…"
          className="w-full border border-stone-200 rounded-md px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500" />
      </Field>

      <Field label="Text align">
        <div className="flex gap-1">
          {[['left', '←'], ['center', '↔'], ['right', '→']].map(([val, icon]) => (
            <button key={val} onClick={() => update({ titleAlign: val })}
              className={`flex-1 py-1 text-sm rounded border transition-colors ${(data.titleAlign ?? 'center') === val ? 'bg-amber-700 text-white border-amber-700' : 'border-stone-200 text-stone-500 hover:bg-stone-50'}`}>
              {icon}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Title color">
        <input type="color" value={data.titleColor ?? '#ffffff'}
          onChange={e => update({ titleColor: e.target.value })}
          className="w-8 h-8 rounded border border-stone-200 cursor-pointer p-0.5" />
      </Field>

      <Field label="Overlay darkness">
        <input type="range" min="0" max="0.85" step="0.05"
          value={parseFloat((data.overlayColor ?? '#00000055').length === 9 ? parseInt((data.overlayColor ?? '#00000055').slice(7), 16) / 255 : 0.33)}
          onChange={e => {
            const hex = Math.round(Number(e.target.value) * 255).toString(16).padStart(2, '0')
            update({ overlayColor: `#000000${hex}` })
          }}
          className="w-full accent-amber-700" />
      </Field>

      <div className="pt-3 border-t border-stone-100">
        <button onClick={() => deleteElement(element.id)}
          className="w-full py-1.5 text-sm text-red-600 border border-red-200 rounded-md hover:bg-red-50 transition-colors">
          Delete cover block
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
      ) : selected.type === 'keepsake' ? (
        <KeepeakeInspector element={selected} />
      ) : selected.type === 'weather' ? (
        <WeatherInspector element={selected} />
      ) : selected.type === 'collage' ? (
        <CollageInspector element={selected} />
      ) : selected.type === 'drawing' ? (
        <DrawingInspector element={selected} />
      ) : selected.type === 'cover' ? (
        <CoverInspector element={selected} />
      ) : null}
    </aside>
  )
}
