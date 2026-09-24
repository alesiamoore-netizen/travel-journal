import { useState, useEffect } from 'react'
import { useEditorStore } from '../../store/editorStore'
import { db } from '../../db'
import LayoutPicker from './LayoutPicker'

function PhotoLibrary({ notebookId, onUse }) {
  const [photos, setPhotos] = useState([])
  const [thumbUrls, setThumbUrls] = useState({})

  useEffect(() => {
    db.photos.where('notebookId').equals(notebookId).reverse().sortBy('uploadedAt').then(setPhotos)
  }, [notebookId])

  useEffect(() => {
    const urls = {}
    photos.forEach(p => { if (p.thumbnailBlob) urls[p.id] = URL.createObjectURL(p.thumbnailBlob) })
    setThumbUrls(urls)
    return () => Object.values(urls).forEach(URL.revokeObjectURL)
  }, [photos])

  if (!photos.length) return (
    <div className="p-3 text-center text-xs text-stone-400 leading-relaxed">
      No photos yet.<br/>Upload photos to image blocks to build your library.
    </div>
  )

  return (
    <div className="grid grid-cols-3 gap-1 p-2">
      {photos.map(p => (
        <button
          key={p.id}
          onClick={() => onUse(p.id)}
          className="aspect-square rounded overflow-hidden border border-transparent hover:border-amber-400 transition-colors"
          title={p.filename}
        >
          {thumbUrls[p.id]
            ? <img src={thumbUrls[p.id]} alt="" className="w-full h-full object-cover" />
            : <div className="w-full h-full bg-stone-200" />}
        </button>
      ))}
    </div>
  )
}

// SVG thumbnail for a page given its elements
function PageThumb({ elements, accent }) {
  const W = 40, H = 56
  const COLS = 12, ROWS = 16

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} className="flex-shrink-0">
      <rect width={W} height={H} fill="white" />
      {elements.map(el => {
        const x = (el.grid.x / COLS) * W
        const y = (el.grid.y / ROWS) * H
        const w = (el.grid.w / COLS) * W
        const h = (el.grid.h / ROWS) * H
        if (el.type === 'image') {
          return <rect key={el.id} x={x} y={y} width={w} height={h} fill={`${accent}55`} rx="1" />
        }
        if (el.type === 'map') {
          return (
            <g key={el.id}>
              <rect x={x} y={y} width={w} height={h} fill="#a8c5a022" rx="1" />
              <rect x={x} y={y} width={w} height={h} fill="none" stroke="#a8c5a0" strokeWidth="0.5" rx="1" />
            </g>
          )
        }
        // text: render as horizontal lines
        const lineH = 1.8, lineGap = 3.2, lines = Math.max(1, Math.floor(h / lineGap))
        return (
          <g key={el.id}>
            {Array.from({ length: lines }).map((_, i) => (
              <rect key={i} x={x + 1} y={y + i * lineGap + 1} width={w - 2} height={lineH} fill="#c0c0c0" rx="0.5" />
            ))}
          </g>
        )
      })}
      <rect width={W} height={H} fill="none" stroke="#e5e0d8" strokeWidth="0.5" />
    </svg>
  )
}

export default function Sidebar() {
  const { pages, currentPageId, notebook, switchPage, addPage, deletePage, movePage, duplicatePage, addElement, elements, selectedId, updateElement } = useEditorStore()
  const [showLayouts, setShowLayouts] = useState(false)
  const [pageElements, setPageElements] = useState({})
  const [sideTab, setSideTab] = useState('pages') // 'pages' | 'photos'
  const accent = notebook?.theme?.accentColor ?? '#c0813a'

  const handlePhotoUse = (photoId) => {
    const selected = elements.find(e => e.id === selectedId && e.type === 'image')
    if (selected) {
      updateElement(selected.id, { data: { ...selected.data, photoId } })
    } else {
      addElement('image').then(el => {
        if (el) updateElement(el.id, { data: { ...el.data, photoId } })
      })
    }
  }

  // Load elements for all pages to show thumbnails
  useEffect(() => {
    if (!pages.length) return
    const missing = pages.filter(p => !(p.id in pageElements))
    if (!missing.length) return
    Promise.all(
      missing.map(p => db.pageElements.where('pageId').equals(p.id).toArray().then(els => ({ id: p.id, els })))
    ).then(results => {
      setPageElements(prev => {
        const next = { ...prev }
        results.forEach(r => { next[r.id] = r.els })
        return next
      })
    })
  }, [pages])

  // Refresh current page thumbnail when switching pages
  useEffect(() => {
    if (!currentPageId) return
    db.pageElements.where('pageId').equals(currentPageId).toArray().then(els => {
      setPageElements(prev => ({ ...prev, [currentPageId]: els }))
    })
  }, [currentPageId])

  return (
    <aside className="w-48 bg-white border-r border-stone-200 flex flex-col flex-shrink-0 overflow-hidden">
      {showLayouts && <LayoutPicker onClose={() => setShowLayouts(false)} />}

      {/* Layouts button */}
      <div className="p-2 border-b border-stone-100 flex-shrink-0">
        <button
          onClick={() => setShowLayouts(true)}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-amber-700 text-white hover:bg-amber-800 transition-colors text-xs font-semibold tracking-wide"
        >
          <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="currentColor">
            <rect x="1" y="1" width="6" height="6" rx="1"/>
            <rect x="9" y="1" width="6" height="6" rx="1"/>
            <rect x="1" y="9" width="6" height="6" rx="1"/>
            <rect x="9" y="9" width="6" height="6" rx="1"/>
          </svg>
          Layouts
        </button>
      </div>

      {/* Pages / Photos tab toggle */}
      <div className="flex border-b border-stone-100 flex-shrink-0">
        <button
          onClick={() => setSideTab('pages')}
          className={`flex-1 py-2 text-xs font-semibold transition-colors ${sideTab === 'pages' ? 'text-amber-800 border-b-2 border-amber-700' : 'text-stone-500 hover:text-stone-700'}`}
        >
          Pages
        </button>
        <button
          onClick={() => setSideTab('photos')}
          className={`flex-1 py-2 text-xs font-semibold transition-colors ${sideTab === 'photos' ? 'text-amber-800 border-b-2 border-amber-700' : 'text-stone-500 hover:text-stone-700'}`}
        >
          Photos
        </button>
        {sideTab === 'pages' && (
          <button
            onClick={addPage}
            className="w-8 h-8 flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-100 text-lg leading-none flex-shrink-0"
            title="Add page"
          >
            +
          </button>
        )}
      </div>

      {/* Photos library */}
      {sideTab === 'photos' && notebook && (
        <div className="flex-1 overflow-y-auto min-h-0">
          <p className="text-[10px] text-stone-400 px-3 pt-2 pb-1">
            {selectedId ? 'Click to use in selected image' : 'Click to add to page'}
          </p>
          <PhotoLibrary notebookId={notebook.id} onUse={handlePhotoUse} />
        </div>
      )}

      {/* Page list */}
      {sideTab === 'pages' && <div className="flex-1 overflow-y-auto py-2 space-y-1 px-2 min-h-0">
        {pages.map((page, i) => {
          const isActive = currentPageId === page.id
          const els = pageElements[page.id] ?? []
          return (
            <div
              key={page.id}
              className={`group relative flex items-center gap-2.5 px-2 py-2 rounded-lg cursor-pointer transition-colors ${
                isActive ? 'bg-amber-50 ring-1 ring-amber-200' : 'hover:bg-stone-50'
              }`}
              onClick={() => switchPage(page.id)}
            >
              {/* Page number badge */}
              <div
                className={`absolute top-1.5 left-3.5 w-4 h-4 rounded-sm flex items-center justify-center text-[9px] font-bold z-10 ${
                  isActive ? 'bg-amber-600 text-white' : 'bg-stone-300/80 text-stone-600'
                }`}
              >
                {i + 1}
              </div>
              {/* Thumbnail */}
              <div className={`rounded overflow-hidden shadow-sm flex-shrink-0 border ${isActive ? 'border-amber-300' : 'border-stone-200'}`}>
                <PageThumb elements={els} accent={accent} />
              </div>
              {/* Title */}
              <div className="flex-1 min-w-0">
                <div className={`text-xs font-medium truncate ${isActive ? 'text-amber-800' : 'text-stone-700'}`}>
                  {page.title || `Page ${i + 1}`}
                </div>
                {page.location && (
                  <div className="text-[10px] text-stone-400 truncate mt-0.5">{page.location}</div>
                )}
              </div>
              <div className="opacity-0 group-hover:opacity-100 flex flex-col gap-px flex-shrink-0 transition-opacity">
                <button
                  className="w-4 h-3.5 flex items-center justify-center text-stone-300 hover:text-stone-600 text-[10px] leading-none"
                  onClick={e => { e.stopPropagation(); movePage(page.id, -1) }}
                  title="Move up"
                >▲</button>
                <button
                  className="w-4 h-3.5 flex items-center justify-center text-stone-300 hover:text-stone-600 text-[10px] leading-none"
                  onClick={e => { e.stopPropagation(); movePage(page.id, 1) }}
                  title="Move down"
                >▼</button>
                <button
                  className="w-4 h-3.5 flex items-center justify-center text-stone-300 hover:text-amber-600 text-[10px] leading-none"
                  onClick={e => { e.stopPropagation(); duplicatePage(page.id) }}
                  title="Duplicate page"
                >⎘</button>
                {pages.length > 1 && (
                  <button
                    className="w-4 h-3.5 flex items-center justify-center text-stone-300 hover:text-red-500 text-base leading-none"
                    onClick={e => { e.stopPropagation(); deletePage(page.id) }}
                    title="Delete page"
                  >×</button>
                )}
              </div>
            </div>
          )
        })}
      </div>}

      {/* Element palette — only on pages tab */}
      {sideTab === 'pages' && (
        <div className="border-t border-stone-100 flex-shrink-0">
          <div className="px-3 py-2 text-xs font-semibold text-stone-500 uppercase tracking-wide">
            Add Element
          </div>
          <div className="px-2 pb-3 space-y-1">
            <button
              onClick={() => addElement('text')}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-stone-700 hover:bg-amber-50 hover:text-amber-800 border border-stone-200 hover:border-amber-200 transition-colors"
            >
              <span className="text-sm font-bold font-serif">T</span>
              <span className="text-xs font-medium">Text Block</span>
            </button>
            <button
              onClick={() => addElement('image')}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-stone-700 hover:bg-amber-50 hover:text-amber-800 border border-stone-200 hover:border-amber-200 transition-colors"
            >
              <span className="text-sm">🖼</span>
              <span className="text-xs font-medium">Image</span>
            </button>
            <button
              onClick={() => addElement('map')}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-stone-700 hover:bg-amber-50 hover:text-amber-800 border border-stone-200 hover:border-amber-200 transition-colors"
            >
              <span className="text-sm">🗺</span>
              <span className="text-xs font-medium">Route Map</span>
            </button>
            <button
              onClick={() => addElement('divider')}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-stone-700 hover:bg-amber-50 hover:text-amber-800 border border-stone-200 hover:border-amber-200 transition-colors"
            >
              <span className="text-sm font-bold text-stone-400">—</span>
              <span className="text-xs font-medium">Divider</span>
            </button>
            <button
              onClick={() => addElement('sticker')}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-stone-700 hover:bg-amber-50 hover:text-amber-800 border border-stone-200 hover:border-amber-200 transition-colors"
            >
              <span className="text-sm">✦</span>
              <span className="text-xs font-medium">Sticker</span>
            </button>
          </div>
        </div>
      )}
    </aside>
  )
}
