import { useEditorStore } from '../../store/editorStore'

const TEMPLATES = [
  {
    id: 'day',
    label: 'Day summary',
    icon: '🌅',
    elements: [
      { type: 'text', grid: { x: 0, y: 0, w: 12, h: 2 }, data: { textStyle: 'heading', content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Day Summary' }] }] }, fontFamily: 'Georgia', fontSize: 28, color: '#1a1a1a' } },
      { type: 'text', grid: { x: 0, y: 2, w: 12, h: 1 }, data: { textStyle: 'dateline', content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Location · Date' }] }] }, fontFamily: 'Georgia', fontSize: 11, color: '#c0813a' } },
      { type: 'image', grid: { x: 0, y: 3, w: 8, h: 8 }, data: { fit: 'cover' } },
      { type: 'text', grid: { x: 8, y: 3, w: 4, h: 8 }, data: { textStyle: 'body', content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Write your notes here…' }] }] }, fontFamily: 'Georgia', fontSize: 13, color: '#2c2c2c' } },
      { type: 'text', grid: { x: 0, y: 11, w: 12, h: 5 }, data: { textStyle: 'body', content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Reflections on the day…' }] }] }, fontFamily: 'Georgia', fontSize: 13, color: '#2c2c2c' } },
    ],
  },
  {
    id: 'restaurant',
    label: 'Restaurant',
    icon: '🍽️',
    elements: [
      { type: 'text', grid: { x: 0, y: 0, w: 12, h: 2 }, data: { textStyle: 'heading', content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Restaurant Name' }] }] }, fontFamily: 'Georgia', fontSize: 26, color: '#1a1a1a' } },
      { type: 'text', grid: { x: 0, y: 2, w: 12, h: 1 }, data: { textStyle: 'dateline', content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Location · Cuisine' }] }] }, fontFamily: 'Georgia', fontSize: 11, color: '#c0813a' } },
      { type: 'image', grid: { x: 0, y: 3, w: 6, h: 7 }, data: { fit: 'cover' } },
      { type: 'image', grid: { x: 6, y: 3, w: 6, h: 7 }, data: { fit: 'cover' } },
      { type: 'text', grid: { x: 0, y: 10, w: 12, h: 6 }, data: { textStyle: 'body', content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'What I ordered… how it tasted… would I come back?' }] }] }, fontFamily: 'Georgia', fontSize: 13, color: '#2c2c2c' } },
    ],
  },
  {
    id: 'hike',
    label: 'Hike / Walk',
    icon: '🥾',
    elements: [
      { type: 'text', grid: { x: 0, y: 0, w: 12, h: 2 }, data: { textStyle: 'heading', content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Trail Name' }] }] }, fontFamily: 'Georgia', fontSize: 26, color: '#1a1a1a' } },
      { type: 'map', grid: { x: 0, y: 2, w: 12, h: 7 }, data: { tileStyle: 'voyager', showRoute: true, showPins: true, mode: 'route' } },
      { type: 'text', grid: { x: 0, y: 9, w: 12, h: 7 }, data: { textStyle: 'body', content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Distance · Elevation · Highlights…' }] }] }, fontFamily: 'Georgia', fontSize: 13, color: '#2c2c2c' } },
    ],
  },
  {
    id: 'transit',
    label: 'Transit',
    icon: '✈️',
    elements: [
      { type: 'text', grid: { x: 0, y: 0, w: 12, h: 2 }, data: { textStyle: 'heading', content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Getting There' }] }] }, fontFamily: 'Georgia', fontSize: 26, color: '#1a1a1a' } },
      { type: 'map', grid: { x: 0, y: 2, w: 12, h: 8 }, data: { tileStyle: 'minimal', mode: 'route', showRoute: true, showPins: true } },
      { type: 'text', grid: { x: 0, y: 10, w: 6, h: 6 }, data: { textStyle: 'body', content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'From → To\nDeparture · Arrival\nNotes…' }] }] }, fontFamily: 'Georgia', fontSize: 13, color: '#2c2c2c' } },
      { type: 'image', grid: { x: 6, y: 10, w: 6, h: 6 }, data: { fit: 'cover' } },
    ],
  },
]

export default function PagePrompts() {
  const { applyLayout, notebook } = useEditorStore()
  const accent = notebook?.theme?.accentColor ?? '#c0813a'

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none">
      <div className="pointer-events-auto bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-5 mx-4 max-w-xs w-full text-center">
        <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-3">Start with a template</p>
        <div className="grid grid-cols-2 gap-2">
          {TEMPLATES.map(t => (
            <button
              key={t.id}
              onClick={() => applyLayout({ elements: t.elements })}
              className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border border-stone-200 hover:border-amber-300 hover:bg-amber-50 transition-colors"
            >
              <span className="text-xl">{t.icon}</span>
              <span className="text-[11px] font-medium text-stone-700">{t.label}</span>
            </button>
          ))}
        </div>
        <button
          onClick={() => applyLayout({ elements: [] })}
          className="mt-3 w-full text-xs text-stone-400 hover:text-stone-600 transition-colors py-1"
        >
          Start blank
        </button>
      </div>
    </div>
  )
}
