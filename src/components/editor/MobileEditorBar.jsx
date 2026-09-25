import { useEffect, useRef, useState } from 'react'
import { useEditorStore } from '../../store/editorStore'
import { useAuth } from '../../context/AuthContext'
import { uploadPhoto } from '../../firebase/storageHelpers'
import { fsSavePhoto, fsLoadPhotos } from '../../firebase/firestoreHelpers'
import { STICKER_LIST } from './elements/StickerElement'
import { TEXT_STYLES, applyTextStyle } from '../../data/textStyles'
import { LAYOUTS, LAYOUT_CATEGORIES } from '../../data/layouts'

// ── Shared Drawer shell ────────────────────────────────────────────────────────
function Drawer({ open, onClose, title, onBack, children }) {
  if (!open) return null
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl max-h-[82vh] flex flex-col">
        <div className="flex items-center gap-2 px-4 py-4 border-b border-stone-100 flex-shrink-0">
          {onBack && (
            <button onClick={onBack} className="text-stone-400 text-xl leading-none w-8 h-8 flex items-center justify-center rounded-lg hover:bg-stone-100">‹</button>
          )}
          <span className="font-semibold text-stone-800 flex-1">{title}</span>
          <button onClick={onClose} className="text-stone-400 text-2xl leading-none w-8 h-8 flex items-center justify-center">×</button>
        </div>
        <div className="overflow-y-auto flex-1 pb-8">{children}</div>
      </div>
    </>
  )
}

// ── Pages drawer ──────────────────────────────────────────────────────────────
function PagesDrawer({ onClose }) {
  const { pages, currentPageId, switchPage, insertPageAfter, deletePage, movePage, duplicatePage, updatePage } = useEditorStore()
  const [editingId, setEditingId] = useState(null)
  const editPage = pages.find(p => p.id === editingId)
  const upd = patch => updatePage(editingId, patch)

  if (editingId) {
    return (
      <Drawer open title="Page Info" onBack={() => setEditingId(null)} onClose={onClose}>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs text-stone-400 mb-1.5 font-medium uppercase tracking-wide">Title</label>
            <input autoFocus type="text" value={editPage?.title ?? ''} onChange={e => upd({ title: e.target.value })}
              placeholder="Page title…"
              className="w-full border border-stone-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-amber-400" />
          </div>
          <div>
            <label className="block text-xs text-stone-400 mb-1.5 font-medium uppercase tracking-wide">Location</label>
            <input type="text" value={editPage?.location ?? ''} onChange={e => upd({ location: e.target.value })}
              placeholder="City, Country…"
              className="w-full border border-stone-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-amber-400" />
          </div>
          <div>
            <label className="block text-xs text-stone-400 mb-1.5 font-medium uppercase tracking-wide">Date</label>
            <input type="date" value={editPage?.date ?? ''} onChange={e => upd({ date: e.target.value })}
              className="w-full border border-stone-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-amber-400" />
          </div>
          <button onClick={() => setEditingId(null)}
            className="w-full py-3 rounded-xl bg-amber-700 text-white font-semibold active:bg-amber-800">Done</button>
        </div>
      </Drawer>
    )
  }

  return (
    <Drawer open title="Pages" onClose={onClose}>
      <div className="p-4 space-y-2">
        {pages.map((p, i) => (
          <div key={p.id} className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-colors ${
            currentPageId === p.id ? 'bg-amber-50 border-amber-300' : 'bg-stone-50 border-stone-200'}`}>

            {/* Page number + title — tap to switch */}
            <button onClick={() => { switchPage(p.id); onClose() }} className="flex-1 flex items-center gap-2.5 text-left min-w-0">
              <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                currentPageId === p.id ? 'bg-amber-600 text-white' : 'bg-stone-300 text-stone-600'}`}>{i + 1}</span>
              <div className="min-w-0">
                <div className="font-medium text-sm text-stone-800 truncate">{p.title || `Page ${i + 1}`}</div>
                {p.location && <div className="text-xs text-stone-400 truncate">{p.location}</div>}
              </div>
            </button>

            {/* Controls */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <button onClick={() => movePage(p.id, -1)} disabled={i === 0}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-stone-400 hover:bg-stone-200 disabled:opacity-20 text-sm">▲</button>
              <button onClick={() => movePage(p.id, 1)} disabled={i === pages.length - 1}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-stone-400 hover:bg-stone-200 disabled:opacity-20 text-sm">▼</button>
              <button onClick={() => insertPageAfter(p.id)}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-stone-400 hover:bg-amber-100 hover:text-amber-700 text-base font-medium"
                title="Insert page after">+</button>
              <button onClick={() => setEditingId(p.id)}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-stone-400 hover:bg-stone-200">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487a2.1 2.1 0 113 3L7 20.25H4v-3L16.862 4.487z" />
                </svg>
              </button>
              {pages.length > 1 && (
                <button onClick={() => deletePage(p.id)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-stone-300 hover:text-red-500 hover:bg-red-50 text-lg leading-none">×</button>
              )}
            </div>
          </div>
        ))}
        <button onClick={() => { insertPageAfter(pages[pages.length - 1]?.id); onClose() }}
          className="w-full py-3 rounded-xl border-2 border-dashed border-stone-300 text-stone-500 text-sm font-medium hover:bg-stone-50">
          + Add page at end
        </button>
      </div>
    </Drawer>
  )
}

// ── Layout picker ─────────────────────────────────────────────────────────────
const COLS = 12, ROWS = 16, SW = 52, SH = 70
const TYPE_COLOR = { image: '#c0813a55', text: '#d6d3d1', map: '#8db4a044' }

function LayoutThumb({ elements }) {
  return (
    <svg viewBox={`0 0 ${SW} ${SH}`} className="w-full h-full">
      <rect width={SW} height={SH} fill="#fafaf9" />
      {elements.map((el, i) => {
        const x = (el.grid.x / COLS) * SW + 0.4
        const y = (el.grid.y / ROWS) * SH + 0.4
        const w = (el.grid.w / COLS) * SW - 0.8
        const h = (el.grid.h / ROWS) * SH - 0.8
        return <rect key={i} x={x} y={y} width={w} height={h} fill={TYPE_COLOR[el.type] ?? '#e5e0d8'} rx="1" />
      })}
      {elements.length === 0 && (
        <text x={SW/2} y={SH/2+3} textAnchor="middle" fontSize="7" fill="#c4c0bb">Blank</text>
      )}
      <rect width={SW} height={SH} fill="none" stroke="#e5e0d8" strokeWidth="0.5" />
    </svg>
  )
}

function LayoutsDrawer({ onClose }) {
  const { applyLayout } = useEditorStore()
  const [cat, setCat] = useState('Basic')
  const filtered = LAYOUTS.filter(l => l.category === cat)

  return (
    <Drawer open title="Layouts" onClose={onClose}>
      {/* Category tabs */}
      <div className="flex gap-1.5 px-4 pt-3 pb-1 overflow-x-auto flex-shrink-0 scrollbar-hide">
        {LAYOUT_CATEGORIES.map(c => (
          <button key={c} onClick={() => setCat(c)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold flex-shrink-0 transition-colors ${
              cat === c ? 'bg-amber-700 text-white' : 'bg-stone-100 text-stone-600'}`}>
            {c}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-3 p-4">
        {filtered.map(layout => (
          <button key={layout.id}
            onClick={() => { applyLayout(layout); onClose() }}
            className="flex flex-col items-center gap-1.5 group">
            <div className="w-full rounded-lg overflow-hidden border border-stone-200 group-active:border-amber-400 transition-colors aspect-[52/70]">
              <LayoutThumb elements={layout.elements} />
            </div>
            <span className="text-[10px] text-stone-500 text-center leading-tight">{layout.name}</span>
          </button>
        ))}
      </div>
    </Drawer>
  )
}

// ── Sticker picker ────────────────────────────────────────────────────────────
function StickerPickerDrawer({ onClose }) {
  const { addElement, updateElement } = useEditorStore()
  const pick = async (stickerId) => {
    onClose()
    const el = await addElement('sticker')
    if (el) updateElement(el.id, { data: { ...el.data, stickerId } })
  }
  return (
    <Drawer open title="Pick a Sticker" onClose={onClose}>
      <div className="grid grid-cols-4 gap-2 p-4">
        {STICKER_LIST.map(s => (
          <button key={s.id} onClick={() => pick(s.id)}
            className="py-3 rounded-xl border border-stone-200 bg-stone-50 text-xs font-medium text-stone-700 active:bg-amber-50 active:border-amber-300 transition-colors">
            {s.label}
          </button>
        ))}
      </div>
    </Drawer>
  )
}

// ── Photo library picker ──────────────────────────────────────────────────────
function PhotoLibraryDrawer({ onClose }) {
  const { notebook, addElement, updateElement } = useEditorStore()
  const { user } = useAuth()
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || !notebook) return
    fsLoadPhotos(user.uid, notebook.id).then(ps => { setPhotos(ps ?? []); setLoading(false) })
  }, [user, notebook])

  const pick = async (photo) => {
    onClose()
    const el = await addElement('image')
    if (el) updateElement(el.id, { data: { ...el.data, photoId: photo.id, storageUrl: photo.storageUrl, thumbnailUrl: photo.thumbnailUrl } })
  }

  return (
    <Drawer open title="Photo Library" onClose={onClose}>
      {loading ? (
        <div className="p-8 text-center text-stone-400 text-sm">Loading…</div>
      ) : photos.length === 0 ? (
        <div className="p-8 text-center text-stone-400 text-sm leading-relaxed">
          No photos in this journal yet.<br />Upload photos using camera or gallery first.
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-1 p-3">
          {photos.map(p => (
            <button key={p.id} onClick={() => pick(p)}
              className="aspect-square rounded-lg overflow-hidden border border-transparent active:border-amber-400 transition-colors">
              {p.thumbnailUrl
                ? <img src={p.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                : <div className="w-full h-full bg-stone-200" />}
            </button>
          ))}
        </div>
      )}
    </Drawer>
  )
}

// ── Add-element drawer ────────────────────────────────────────────────────────
function AddDrawer({ onClose }) {
  const { addElement } = useEditorStore()
  const { user } = useAuth()
  const { notebook, updateElement } = useEditorStore()
  const [sub, setSub] = useState(null) // 'layouts' | 'stickers' | 'library'
  const cameraRef = useRef(null)
  const galleryRef = useRef(null)

  const handlePhotoFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !user || !notebook) return
    e.target.value = ''
    onClose()
    const el = await addElement('image')
    if (!el) return
    const photo = await uploadPhoto(file, file.name, user.uid, notebook.id)
    await fsSavePhoto(user.uid, photo)
    updateElement(el.id, { data: { ...el.data, photoId: photo.id, storageUrl: photo.storageUrl, thumbnailUrl: photo.thumbnailUrl } })
  }

  if (sub === 'layouts') return <LayoutsDrawer onClose={onClose} />
  if (sub === 'stickers') return <StickerPickerDrawer onClose={onClose} />
  if (sub === 'library') return <PhotoLibraryDrawer onClose={onClose} />

  const items = [
    { icon: '📷', label: 'Camera', sub: 'Take a new photo', action: () => cameraRef.current?.click() },
    { icon: '🖼', label: 'Photo Library', sub: 'Reuse an uploaded photo', action: () => setSub('library') },
    { icon: '📂', label: 'Photo from Gallery', sub: 'Choose from your device', action: () => galleryRef.current?.click() },
    { icon: '⊞', label: 'Apply Layout', sub: 'Arrange elements from a template', action: () => setSub('layouts') },
    { icon: 'T', label: 'Text Block', sub: 'Add a text area', action: () => { addElement('text'); onClose() }, serif: true },
    { icon: '✦', label: 'Sticker', sub: 'Decorative graphic', action: () => setSub('stickers') },
    { icon: '🗺', label: 'Route Map', sub: 'Add a map element', action: () => { addElement('map'); onClose() } },
    { icon: '—', label: 'Divider', sub: 'Add a decorative line', action: () => { addElement('divider'); onClose() } },
    { icon: '✂', label: 'Keepsake Box', sub: 'Placeholder to tape/glue something', action: () => { addElement('keepsake'); onClose() } },
    { icon: '🌤️', label: 'Weather', sub: 'Historical weather for a date', action: () => { addElement('weather'); onClose() } },
  ]

  return (
    <Drawer open title="Add to Page" onClose={onClose}>
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoFile} />
      <input ref={galleryRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoFile} />
      <div className="p-4 space-y-2">
        {items.map(item => (
          <button key={item.label} onClick={item.action}
            className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl bg-stone-50 border border-stone-200 text-left hover:bg-amber-50 hover:border-amber-200 transition-colors active:scale-[0.98]">
            <span className={`text-2xl w-8 text-center flex-shrink-0 ${item.serif ? 'font-bold font-serif text-stone-700 text-xl' : ''}`}>
              {item.icon}
            </span>
            <div>
              <div className="font-medium text-stone-800 text-sm">{item.label}</div>
              <div className="text-xs text-stone-400 mt-0.5">{item.sub}</div>
            </div>
          </button>
        ))}
      </div>
    </Drawer>
  )
}

// ── Mobile pin location search ────────────────────────────────────────────────
function MobilePinSearch({ data, update }) {
  const [q, setQ] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const search = async () => {
    const query = q.trim()
    if (!query) return
    setBusy(true); setErr('')
    try {
      const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`)
      const d = await res.json()
      if (!d.results?.length) throw new Error(`"${query}" not found`)
      const { latitude, longitude, name, country } = d.results[0]
      update({ pinLat: latitude, pinLng: longitude, pinLabel: `${name}, ${country}` })
      setQ('')
    } catch(e) { setErr(e.message) }
    finally { setBusy(false) }
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input type="text" value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>e.key==='Enter'&&search()}
          placeholder="Search place…"
          className="flex-1 border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
        <button onClick={search} disabled={busy||!q}
          className="px-4 py-3 bg-amber-700 text-white rounded-xl text-sm font-semibold disabled:opacity-40 active:bg-amber-800">
          {busy?'…':'↵'}
        </button>
      </div>
      {err && <p className="text-xs text-red-500">{err}</p>}
      {data.pinLabel && <p className="text-xs text-stone-500">📍 {data.pinLabel}</p>}
    </div>
  )
}

// ── Mobile element inspector ──────────────────────────────────────────────────
function MobileInspectorDrawer({ element, onClose }) {
  const { updateElement, deleteElement, notebook } = useEditorStore()
  const { data } = element
  const update = patch => updateElement(element.id, { data: { ...data, ...patch } })
  const accent = notebook?.theme?.accentColor ?? '#c0813a'

  const handleDelete = () => { deleteElement(element.id); onClose() }

  return (
    <Drawer open title={element.type.charAt(0).toUpperCase() + element.type.slice(1)} onClose={onClose}>
      <div className="p-4 space-y-5">

        {element.type === 'image' && (<>
          <Sec label="Filter">
            <BtnGrid cols={4}>
              {[{id:'none',l:'None'},{id:'grayscale',l:'B&W'},{id:'sepia',l:'Sepia'},{id:'warm',l:'Warm'},
                {id:'cool',l:'Cool'},{id:'fade',l:'Fade'},{id:'dramatic',l:'Drama'}].map(f => (
                <Tog key={f.id} on={(data.filter??'none')===f.id} onClick={()=>update({filter:f.id})}>{f.l}</Tog>
              ))}
            </BtnGrid>
          </Sec>
          <Sec label="Shape">
            <BtnGrid cols={4}>
              {[{id:'none',l:'▭'},{id:'circle',l:'●'},{id:'diamond',l:'◆'},{id:'oval',l:'⬭'},
                {id:'ovalv',l:'⬯'},{id:'arch',l:'◑'},{id:'hexagon',l:'⬡'},{id:'star5',l:'★'}].map(s => (
                <Tog key={s.id} on={(data.clipShape??'none')===s.id} onClick={()=>update({clipShape:s.id})}>{s.l}</Tog>
              ))}
            </BtnGrid>
          </Sec>
          <Sec label="Border">
            <BtnGrid cols={3}>
              {[{id:'none',l:'None'},{id:'line',l:'Thin'},{id:'thick',l:'Thick'},
                {id:'double',l:'Double'},{id:'shadow',l:'Shadow'},{id:'dark',l:'Dark'}].map(b => (
                <Tog key={b.id} on={(data.borderStyle??'none')===b.id} onClick={()=>update({borderStyle:b.id})}>{b.l}</Tog>
              ))}
            </BtnGrid>
          </Sec>
          <Sec label={`Rotation — ${data.rotation??0}°`}>
            <input type="range" min="-12" max="12" step="0.5" value={data.rotation??0}
              onChange={e=>update({rotation:Number(e.target.value)})} className="w-full accent-amber-700 h-2" />
          </Sec>
          <Sec label="Caption">
            <input type="text" value={data.caption??''} onChange={e=>update({caption:e.target.value})}
              placeholder="Caption text…"
              className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
            {data.caption && (
              <div className="space-y-3 mt-2">
                <div className="flex gap-2">
                  {[['below','Below photo'],['overlay','Overlay']].map(([val,label])=>(
                    <button key={val} onClick={()=>update({captionStyle:val})}
                      className={`flex-1 py-2 text-sm rounded-xl border transition-colors ${(data.captionStyle??'below')===val?'bg-amber-700 text-white border-amber-700':'border-stone-200 text-stone-500'}`}>
                      {label}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-3">
                  <input type="color" value={data.captionColor??'#888888'} onChange={e=>update({captionColor:e.target.value})}
                    className="w-10 h-10 rounded-xl border border-stone-200 cursor-pointer p-0.5 flex-shrink-0" title="Caption color" />
                  <select value={data.captionFont??'Georgia'} onChange={e=>update({captionFont:e.target.value})}
                    className="flex-1 border border-stone-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none"
                    style={{fontFamily:data.captionFont??'Georgia'}}>
                    {[['Georgia','Georgia'],['Times New Roman','Times New Roman'],['Garamond','Garamond'],['Arial','Arial'],['Helvetica Neue','Helvetica Neue'],['Courier New','Courier New']].map(([v,l])=>(
                      <option key={v} value={v} style={{fontFamily:v}}>{l}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2">
                  {[['left','Left'],['center','Center'],['right','Right']].map(([val,label])=>(
                    <button key={val} onClick={()=>update({captionAlign:val})}
                      className={`flex-1 py-2 text-sm rounded-xl border transition-colors ${(data.captionAlign??'center')===val?'bg-amber-700 text-white border-amber-700':'border-stone-200 text-stone-500'}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </Sec>
        </>)}

        {element.type === 'text' && (<>
          <Sec label="Style">
            <BtnGrid cols={2}>
              {Object.entries(TEXT_STYLES).map(([id,s]) => (
                <Tog key={id} on={(data.textStyle??'body')===id}
                  onClick={()=>{ const p=applyTextStyle(id); update({textStyle:id,fontSize:p.fontSize,color:p.color}) }}>
                  {s.label}
                </Tog>
              ))}
            </BtnGrid>
          </Sec>
          <Sec label={`Font size — ${data.fontSize??15}pt`}>
            <input type="range" min="8" max="72" step="1" value={data.fontSize??15}
              onChange={e=>update({fontSize:Number(e.target.value)})} className="w-full accent-amber-700 h-2" />
          </Sec>
          <Sec label="Color">
            <div className="flex items-center gap-3">
              <input type="color" value={data.color??'#2c2c2c'} onChange={e=>update({color:e.target.value})}
                className="w-10 h-10 rounded-lg border border-stone-200 cursor-pointer p-1" />
              <code className="text-sm text-stone-500">{data.color??'#2c2c2c'}</code>
            </div>
          </Sec>
          <Sec label={`Rotation — ${data.rotation??0}°`}>
            <input type="range" min="-12" max="12" step="0.5" value={data.rotation??0}
              onChange={e=>update({rotation:Number(e.target.value)})} className="w-full accent-amber-700 h-2" />
          </Sec>
        </>)}

        {element.type === 'sticker' && (<>
          <Sec label="Sticker">
            <BtnGrid cols={3}>
              {STICKER_LIST.map(s => (
                <Tog key={s.id} on={(data.stickerId??'compass')===s.id} onClick={()=>update({stickerId:s.id})}>{s.label}</Tog>
              ))}
            </BtnGrid>
          </Sec>
          <Sec label="Color">
            <div className="flex items-center gap-3">
              <input type="color" value={data.color??'#c0813a'} onChange={e=>update({color:e.target.value})}
                className="w-10 h-10 rounded-lg border border-stone-200 cursor-pointer p-1" />
              <code className="text-sm text-stone-500">{data.color??'#c0813a'}</code>
            </div>
          </Sec>
          <Sec label={`Opacity — ${Math.round((data.opacity??1)*100)}%`}>
            <input type="range" min="0.1" max="1" step="0.05" value={data.opacity??1}
              onChange={e=>update({opacity:Number(e.target.value)})} className="w-full accent-amber-700 h-2" />
          </Sec>
          <Sec label={`Rotation — ${data.rotation??0}°`}>
            <input type="range" min="-180" max="180" step="1" value={data.rotation??0}
              onChange={e=>update({rotation:Number(e.target.value)})} className="w-full accent-amber-700 h-2" />
          </Sec>
        </>)}

        {element.type === 'divider' && (<>
          <Sec label="Style">
            <BtnGrid cols={2}>
              {[{id:'line',l:'— Thin'},{id:'thick',l:'— Thick'},{id:'double',l:'= Double'},
                {id:'dotted',l:'··· Dots'},{id:'ornate',l:'✦ Ornate'},{id:'wave',l:'~ Wave'}].map(s => (
                <Tog key={s.id} on={(data.style??'line')===s.id} onClick={()=>update({style:s.id})}>{s.l}</Tog>
              ))}
            </BtnGrid>
          </Sec>
          <Sec label="Color">
            <div className="flex items-center gap-3">
              <button onClick={()=>update({color:'accent'})}
                className={`w-10 h-10 rounded-lg border-2 flex-shrink-0 ${data.color==='accent'?'border-amber-500':'border-stone-200'}`}
                style={{backgroundColor:accent}} title="Accent color" />
              <input type="color" value={data.color==='accent'?accent:(data.color??accent)}
                onChange={e=>update({color:e.target.value})}
                className="w-10 h-10 rounded-lg border border-stone-200 cursor-pointer p-1 flex-shrink-0" />
              <span className="text-sm text-stone-400">Custom</span>
            </div>
          </Sec>
        </>)}

        {element.type === 'map' && (<>
          <Sec label="Mode">
            <div className="flex gap-2">
              {[['route','Route Journey'],['pin','Location Pin']].map(([val,label])=>(
                <button key={val} onClick={()=>update({mode:val})}
                  className={`flex-1 py-2.5 text-sm rounded-xl border transition-colors ${(data.mode??'route')===val?'bg-amber-700 text-white border-amber-700':'border-stone-200 text-stone-500'}`}>
                  {label}
                </button>
              ))}
            </div>
          </Sec>
          {(data.mode??'route')==='pin' ? (<>
            <Sec label="Location">
              <MobilePinSearch data={data} update={update} />
            </Sec>
            <Sec label={`Zoom — ${data.pinZoom??13}`}>
              <input type="range" min="5" max="17" step="1" value={data.pinZoom??13}
                onChange={e=>update({pinZoom:Number(e.target.value)})} className="w-full accent-amber-700 h-2" />
            </Sec>
          </>) : (<>
            <Sec label="Route color">
              <div className="flex items-center gap-3">
                <input type="color" value={data.routeColor??'#c0813a'} onChange={e=>update({routeColor:e.target.value})}
                  className="w-10 h-10 rounded-lg border border-stone-200 cursor-pointer p-1" />
                <code className="text-sm text-stone-500">{data.routeColor??'#c0813a'}</code>
              </div>
            </Sec>
          </>)}
          <Sec label="Map style">
            <BtnGrid cols={2}>
              {[['minimal','Minimal'],['voyager','Voyager'],['street','Street'],['satellite','Satellite'],['dark','Dark']].map(([val,label])=>(
                <Tog key={val} on={(data.tileStyle??'minimal')===val} onClick={()=>update({tileStyle:val})}>{label}</Tog>
              ))}
            </BtnGrid>
          </Sec>
        </>)}

        {element.type === 'keepsake' && (<>
          <Sec label="Label">
            <input type="text" value={data.label??''} onChange={e=>update({label:e.target.value})}
              placeholder="Ticket stub, receipt…"
              className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
          </Sec>
          <Sec label="Hint">
            <input type="text" value={data.hint??''} onChange={e=>update({hint:e.target.value})}
              placeholder="Tape or glue here…"
              className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
          </Sec>
          <Sec label="Style">
            <BtnGrid cols={3}>
              {[['dashed','Dashed'],['polaroid','Polaroid'],['pocket','Pocket']].map(([val,label])=>(
                <Tog key={val} on={(data.style??'dashed')===val} onClick={()=>update({style:val})}>{label}</Tog>
              ))}
            </BtnGrid>
          </Sec>
          <Sec label="Border color">
            <div className="flex items-center gap-3">
              <button onClick={()=>update({borderColor:'accent'})}
                className={`px-3 py-2 text-sm rounded-xl border-2 flex-shrink-0 ${data.borderColor==='accent'?'border-amber-500':'border-stone-200'}`}
                style={{backgroundColor:accent}}>Theme</button>
              <input type="color" value={data.borderColor==='accent'?accent:(data.borderColor??accent)}
                onChange={e=>update({borderColor:e.target.value})}
                className="w-10 h-10 rounded-lg border border-stone-200 cursor-pointer p-1" />
            </div>
          </Sec>
        </>)}

        {element.type === 'weather' && (<>
          {data.weatherData ? (<>
            <Sec label="Location">
              <div className="rounded-xl bg-stone-50 border border-stone-200 px-4 py-3">
                <p className="text-sm font-medium text-stone-700">{data.weatherData.locationName}</p>
                <p className="text-xs text-stone-400 mt-0.5">{data.weatherData.date}</p>
              </div>
            </Sec>
            <Sec label="Units">
              <div className="flex gap-2">
                {[['metric','°C Metric'],['imperial','°F Imperial']].map(([val,label])=>(
                  <button key={val} onClick={()=>update({units:val})}
                    className={`flex-1 py-2.5 text-sm rounded-xl border transition-colors ${(data.units??'metric')===val?'bg-amber-700 text-white border-amber-700':'border-stone-200 text-stone-500'}`}>
                    {label}
                  </button>
                ))}
              </div>
            </Sec>
            <button onClick={()=>update({weatherData:null})}
              className="w-full py-3 rounded-xl border border-stone-200 text-stone-500 text-sm active:bg-stone-50">
              Edit location / date
            </button>
          </>) : (
            <p className="text-sm text-stone-400 leading-relaxed text-center py-4">
              Tap the element on the canvas to enter a city and date.
            </p>
          )}
        </>)}

        <div className="pt-2 border-t border-stone-100">
          <button onClick={handleDelete}
            className="w-full py-3 rounded-xl text-red-600 border border-red-200 font-medium text-sm active:bg-red-50">
            Delete element
          </button>
        </div>
      </div>
    </Drawer>
  )
}

function Sec({ label, children }) {
  return (
    <div>
      <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">{label}</p>
      {children}
    </div>
  )
}
function BtnGrid({ cols, children }) {
  return <div className={`grid grid-cols-${cols} gap-1`}>{children}</div>
}
function Tog({ on, onClick, children }) {
  return (
    <button onClick={onClick}
      className={`py-2 text-xs rounded-lg border font-medium transition-colors ${on ? 'bg-amber-700 text-white border-amber-700' : 'border-stone-200 text-stone-600 bg-white active:bg-stone-50'}`}>
      {children}
    </button>
  )
}

// ── Bottom bar ────────────────────────────────────────────────────────────────
export default function MobileEditorBar({ onExportPdf, onShare, exporting }) {
  const [drawer, setDrawer] = useState(null)
  const { pages, currentPageId, selectedId, elements } = useEditorStore()
  const currentIdx = pages.findIndex(p => p.id === currentPageId)
  const selectedEl = elements.find(e => e.id === selectedId) ?? null

  return (
    <>
      {/* Floating element pill when something is selected */}
      {selectedEl && drawer !== 'inspect' && (
        <div className="fixed bottom-16 left-0 right-0 z-30 flex items-center justify-center pointer-events-none"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
          <div className="pointer-events-auto flex items-center gap-2 bg-white rounded-full shadow-xl border border-stone-200 px-3 py-2">
            <span className="text-xs text-stone-400 px-1 capitalize">{selectedEl.type}</span>
            <button onClick={() => setDrawer('inspect')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-700 text-white text-xs font-semibold active:bg-amber-800">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Style
            </button>
            <button onClick={() => useEditorStore.getState().deleteElement(selectedEl.id)}
              className="w-7 h-7 flex items-center justify-center rounded-full text-stone-400 hover:text-red-500 active:bg-stone-100">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
            <button onClick={() => useEditorStore.getState().deselect()}
              className="w-7 h-7 flex items-center justify-center rounded-full text-stone-300 active:bg-stone-100 text-lg leading-none">×</button>
          </div>
        </div>
      )}

      {/* Tab bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-stone-200 flex items-center"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <button onClick={() => setDrawer('pages')}
          className="flex-1 flex flex-col items-center gap-0.5 py-3 text-stone-600 active:bg-stone-50">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <rect x="4" y="3" width="6" height="8" rx="1" />
            <rect x="14" y="3" width="6" height="8" rx="1" />
            <rect x="4" y="14" width="6" height="7" rx="1" />
            <rect x="14" y="14" width="6" height="7" rx="1" />
          </svg>
          <span className="text-[10px] font-medium">Page {currentIdx + 1}/{pages.length}</span>
        </button>

        <button onClick={() => setDrawer('add')}
          className="flex-shrink-0 w-14 h-14 -mt-5 rounded-full bg-amber-700 text-white flex items-center justify-center shadow-lg border-4 border-white active:bg-amber-800">
          <span className="text-2xl leading-none font-light">+</span>
        </button>

        <button onClick={() => setDrawer('more')}
          className="flex-1 flex flex-col items-center gap-0.5 py-3 text-stone-600 active:bg-stone-50">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <circle cx="5" cy="12" r="1.5" fill="currentColor" stroke="none"/>
            <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/>
            <circle cx="19" cy="12" r="1.5" fill="currentColor" stroke="none"/>
          </svg>
          <span className="text-[10px] font-medium">More</span>
        </button>
      </div>

      {drawer === 'pages'   && <PagesDrawer   onClose={() => setDrawer(null)} />}
      {drawer === 'add'     && <AddDrawer     onClose={() => setDrawer(null)} />}
      {drawer === 'inspect' && selectedEl && <MobileInspectorDrawer element={selectedEl} onClose={() => setDrawer(null)} />}
      {drawer === 'more' && (
        <Drawer open title="More options" onClose={() => setDrawer(null)}>
          <div className="p-4 space-y-3">
            <button
              onClick={() => { onShare?.(); setDrawer(null) }}
              className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl bg-amber-50 border border-amber-100 active:bg-amber-100"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-700 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              </div>
              <div className="text-left">
                <div className="font-semibold text-stone-800">Share journal</div>
                <div className="text-xs text-stone-500">Publish a public read-only link</div>
              </div>
            </button>
            <button
              onClick={() => { onExportPdf?.(); setDrawer(null) }}
              disabled={exporting}
              className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl bg-stone-50 border border-stone-200 active:bg-stone-100 disabled:opacity-40"
            >
              <div className="w-10 h-10 rounded-xl bg-stone-600 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 16v-8m0 8l-3-3m3 3l3-3M3 15v3a2 2 0 002 2h14a2 2 0 002-2v-3" />
                </svg>
              </div>
              <div className="text-left">
                <div className="font-semibold text-stone-800">Export PDF</div>
                <div className="text-xs text-stone-500">{exporting ? 'Exporting…' : 'All pages with header & footer'}</div>
              </div>
            </button>
          </div>
        </Drawer>
      )}
    </>
  )
}
