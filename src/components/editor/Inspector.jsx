import { useEditorStore } from '../../store/editorStore'
import { TILE_STYLES } from '../map/RouteMap'
import ThemePanel from './ThemePanel'

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

function ImageInspector({ element }) {
  const { deleteElement } = useEditorStore()

  return (
    <div className="p-4 space-y-4">
      <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">Image Block</p>
      <p className="text-xs text-stone-400 leading-relaxed">
        Photo upload, crop, filters, and captions are coming in Phase 3.
      </p>
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
