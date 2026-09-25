import { create } from 'zustand'
import { loadFont } from '../utils/fonts'
import {
  fsLoadNotebooks, fsLoadPages, fsLoadElements, fsSavePage, fsUpdatePage, fsDeletePage,
  fsSaveElement, fsUpdateElement, fsDeleteElement, fsReplacePageElements,
  fsUpdatePageOrders, fsUpdateNotebook,
} from '../firebase/firestoreHelpers'
import {
  pushElement, deleteElement as fsCollabDeleteEl,
  pushJournal, pushPage, deletePage as fsCollabDeletePage,
  pushAllElements, subscribeToElements, fetchJournalFromFirestore,
  setPresence, clearPresence,
} from '../firebase/collab'
import { useCollabStore } from './collabStore'

function defaultData(type) {
  if (type === 'text') return {
    content: { type: 'doc', content: [{ type: 'paragraph' }] },
    fontFamily: 'Georgia',
    fontSize: 15,
    color: '#2c2c2c',
    columns: 1,
    textStyle: 'body',
    backgroundColor: 'transparent',
    rotation: 0,
  }
  if (type === 'image') return {
    photoId: null,
    storageUrl: null,
    thumbnailUrl: null,
    fit: 'cover',
    caption: '',
    captionStyle: 'below',
    captionColor: '#888888',
    captionFont: 'Georgia',
    captionAlign: 'center',
    borderStyle: 'none',
    filter: 'none',
    rotation: 0,
    shadow: 'none',
    clipShape: 'none',
    overlayText: '',
    overlayPosition: 'bottom-left',
  }
  if (type === 'sticker') return {
    stickerId: 'compass',
    color: '#c0813a',
    opacity: 1,
    rotation: 0,
  }
  if (type === 'map') return {
    tileStyle: 'minimal',
    showRoute: true,
    showPins: true,
    pinColor: '#c0813a',
    routeColor: '#c0813a',
    routeWeight: 2,
    mode: 'route',
    pinLat: null,
    pinLng: null,
    pinLabel: '',
    pinZoom: 13,
  }
  if (type === 'keepsake') return {
    label: 'Ticket stub',
    hint: 'Tape or glue here',
    style: 'dashed',
    borderColor: 'accent',
  }
  if (type === 'weather') return {
    location: '',
    date: '',
    units: 'metric',
    weatherData: null,
  }
  if (type === 'divider') return {
    style: 'line',
    color: 'accent',
    rotation: 0,
  }
  if (type === 'collage') return {
    photos: [],
    columns: 2,
    gap: 4,
    borderRadius: 4,
  }
  if (type === 'drawing') return {
    strokes: [],
    backgroundColor: 'transparent',
    strokeColor: '#2c2c2c',
    strokeWidth: 2,
  }
  if (type === 'cover') return {
    storageUrl: null,
    thumbnailUrl: null,
    photoId: null,
    title: '',
    subtitle: '',
    overlayColor: '#00000055',
    titleColor: '#ffffff',
    subtitleColor: '#ffffffcc',
    titleAlign: 'center',
    titleFont: 'Georgia, serif',
  }
  return {}
}

function defaultGrid(type) {
  if (type === 'text')     return { x: 1, y: 1,  w: 10, h: 5  }
  if (type === 'map')      return { x: 0, y: 0,  w: 12, h: 10 }
  if (type === 'divider')  return { x: 1, y: 7,  w: 10, h: 1  }
  if (type === 'sticker')  return { x: 4, y: 4,  w: 4,  h: 4  }
  if (type === 'keepsake') return { x: 1, y: 2,  w: 10, h: 8  }
  if (type === 'weather')  return { x: 1, y: 1,  w: 10, h: 4  }
  if (type === 'collage')  return { x: 0, y: 0,  w: 12, h: 10 }
  if (type === 'drawing')  return { x: 1, y: 2,  w: 10, h: 8  }
  if (type === 'cover')    return { x: 0, y: 0,  w: 12, h: 16 }
  return                           { x: 2, y: 2,  w: 8,  h: 8  }
}

function snapshot(elements) {
  return elements.map(e => ({ ...e, data: { ...e.data } }))
}

function collabId() {
  const { active, journalId } = useCollabStore.getState()
  return active ? journalId : null
}

export const useEditorStore = create((set, get) => ({
  notebook: null,
  pages: [],
  currentPageId: null,
  elements: [],
  selectedId: null,
  printOverlay: false,
  _undoStack: [],
  _redoStack: [],
  _cloudChangesAvailable: false,
  _saving: 0,
  _lastSavedAt: null,
  uid: null,
  _presenceUser: null,

  _track: (promise) => {
    set(s => ({ _saving: s._saving + 1 }))
    return promise.finally(() => set(s => ({ _saving: Math.max(0, s._saving - 1), _lastSavedAt: Date.now() })))
  },

  setUid: (uid) => set({ uid }),

  setPresenceUser: (user) => set({ _presenceUser: user ? { uid: user.uid, displayName: user.displayName ?? '', photoURL: user.photoURL ?? '' } : null }),

  reset: () => {
    const { notebook, uid } = get()
    if (notebook?.id && uid) clearPresence(notebook.id, uid).catch(console.warn)
    set({
      notebook: null, pages: [], currentPageId: null,
      elements: [], selectedId: null, printOverlay: false,
      _undoStack: [], _redoStack: [], _cloudChangesAvailable: false,
    })
  },

  _saveUndo: () => {
    const { elements, _undoStack } = get()
    const snap = snapshot(elements)
    set({ _undoStack: [..._undoStack, snap].slice(-40), _redoStack: [] })
  },

  undo: async () => {
    const { uid, _undoStack, _redoStack, elements, currentPageId, notebook } = get()
    if (!_undoStack.length || !uid) return
    const prev = _undoStack[_undoStack.length - 1]
    await fsReplacePageElements(uid, currentPageId, notebook.id, prev)
    set({
      elements: prev,
      _undoStack: _undoStack.slice(0, -1),
      _redoStack: [..._redoStack, snapshot(elements)].slice(-40),
      selectedId: null,
    })
  },

  redo: async () => {
    const { uid, _undoStack, _redoStack, elements, currentPageId, notebook } = get()
    if (!_redoStack.length || !uid) return
    const next = _redoStack[_redoStack.length - 1]
    await fsReplacePageElements(uid, currentPageId, notebook.id, next)
    set({
      elements: next,
      _redoStack: _redoStack.slice(0, -1),
      _undoStack: [..._undoStack, snapshot(elements)].slice(-40),
      selectedId: null,
    })
  },

  setCoverPhoto: async (url) => {
    const { uid, notebook } = get()
    if (!uid || !notebook) return
    await fsUpdateNotebook(uid, notebook.id, { coverPhotoUrl: url })
    set(s => ({ notebook: s.notebook ? { ...s.notebook, coverPhotoUrl: url } : s.notebook }))
  },

  updateTheme: async (patch) => {
    const { uid, notebook } = get()
    if (!notebook || !uid) return
    const newTheme = { ...notebook.theme, ...patch }
    const updatedAt = new Date().toISOString()
    await fsUpdateNotebook(uid, notebook.id, { theme: newTheme, updatedAt })
    set(s => ({ notebook: { ...s.notebook, theme: newTheme, updatedAt } }))
    const cid = collabId()
    if (cid) pushJournal({ ...get().notebook }).catch(console.warn)
  },

  loadNotebook: async (uid, notebookId) => {
    const all = await fsLoadNotebooks(uid)
    const notebook = all.find(n => n.id === notebookId)
    if (!notebook) return null

    let pages = await fsLoadPages(uid, notebookId)
    if (pages.length === 0) {
      const page = { id: crypto.randomUUID(), notebookId, order: 0, title: '', location: '', date: '', themeOverrides: {} }
      await fsSavePage(uid, page)
      pages = [page]
    }
    const elements = await fsLoadElements(uid, pages[0].id)
    loadFont(notebook.theme?.fontHeading)
    loadFont(notebook.theme?.fontBody)
    set({ uid, notebook, pages, currentPageId: pages[0].id, elements, selectedId: null, _undoStack: [], _redoStack: [] })
    const pu = get()._presenceUser
    if (pu) setPresence(notebook.id, pu, pages[0].id).catch(console.warn)
    return notebook
  },

  switchPage: async (pageId) => {
    const { uid, notebook, _presenceUser } = get()
    if (!uid) return
    const elements = await fsLoadElements(uid, pageId)
    set({ currentPageId: pageId, elements, selectedId: null, _undoStack: [], _redoStack: [] })
    if (_presenceUser && notebook?.id) setPresence(notebook.id, _presenceUser, pageId).catch(console.warn)
  },

  addPage: async () => {
    const { uid, notebook, pages } = get()
    if (!uid) return
    const page = { id: crypto.randomUUID(), notebookId: notebook.id, order: pages.length, title: '', location: '', date: '', themeOverrides: {} }
    await fsSavePage(uid, page)
    set({ pages: [...pages, page], currentPageId: page.id, elements: [], selectedId: null, _undoStack: [], _redoStack: [] })
    const cid = collabId()
    if (cid) pushPage(cid, page).catch(console.warn)
    return page
  },

  insertPageAfter: async (afterPageId) => {
    const { uid, notebook, pages } = get()
    if (!uid) return
    const afterIdx = pages.findIndex(p => p.id === afterPageId)
    const insertIdx = afterIdx < 0 ? pages.length : afterIdx + 1
    const newPage = { id: crypto.randomUUID(), notebookId: notebook.id, order: insertIdx, title: '', location: '', date: '', themeOverrides: {} }
    await fsSavePage(uid, newPage)
    const inserted = [
      ...pages.slice(0, insertIdx),
      newPage,
      ...pages.slice(insertIdx),
    ].map((p, i) => ({ ...p, order: i }))
    await fsUpdatePageOrders(uid, inserted)
    set({ pages: inserted, currentPageId: newPage.id, elements: [], selectedId: null, _undoStack: [], _redoStack: [] })
    const cid = collabId()
    if (cid) pushPage(cid, newPage).catch(console.warn)
    return newPage
  },

  deletePage: async (pageId) => {
    const { uid, pages, currentPageId } = get()
    if (!uid || pages.length <= 1) return
    await fsDeletePage(uid, pageId)
    const remaining = pages.filter(p => p.id !== pageId).map((p, i) => ({ ...p, order: i }))
    await fsUpdatePageOrders(uid, remaining)
    set({ pages: remaining })
    if (currentPageId === pageId) {
      const elements = await fsLoadElements(uid, remaining[0].id)
      set({ currentPageId: remaining[0].id, elements, selectedId: null })
    }
    const cid = collabId()
    if (cid) fsCollabDeletePage(cid, pageId).catch(console.warn)
  },

  duplicatePage: async (pageId) => {
    const { uid, pages, notebook } = get()
    if (!uid) return
    const src = pages.find(p => p.id === pageId)
    if (!src) return
    const srcIdx = pages.findIndex(p => p.id === pageId)
    const srcElements = await fsLoadElements(uid, pageId)
    const newPage = {
      id: crypto.randomUUID(),
      notebookId: notebook.id,
      order: srcIdx + 1,
      title: src.title ? `${src.title} (copy)` : '',
      location: src.location ?? '',
      date: src.date ?? '',
      themeOverrides: { ...(src.themeOverrides ?? {}) },
    }
    await fsSavePage(uid, newPage)
    const newElements = srcElements.map(el => ({
      ...el,
      id: crypto.randomUUID(),
      pageId: newPage.id,
      data: { ...el.data },
    }))
    await Promise.all(newElements.map(el => fsSaveElement(uid, el)))
    const inserted = [
      ...pages.slice(0, srcIdx + 1),
      newPage,
      ...pages.slice(srcIdx + 1),
    ].map((p, i) => ({ ...p, order: i }))
    await fsUpdatePageOrders(uid, inserted)
    set({ pages: inserted, currentPageId: newPage.id, elements: newElements, selectedId: null, _undoStack: [], _redoStack: [] })
  },

  movePage: async (pageId, direction) => {
    const { uid, pages } = get()
    if (!uid) return
    const idx = pages.findIndex(p => p.id === pageId)
    const newIdx = idx + direction
    if (newIdx < 0 || newIdx >= pages.length) return
    const reordered = [...pages]
    ;[reordered[idx], reordered[newIdx]] = [reordered[newIdx], reordered[idx]]
    const withOrder = reordered.map((p, i) => ({ ...p, order: i }))
    await fsUpdatePageOrders(uid, withOrder)
    set({ pages: withOrder })
  },

  reorderPages: async (newOrder) => {
    const { uid } = get()
    if (!uid) return
    const withOrder = newOrder.map((p, i) => ({ ...p, order: i }))
    await fsUpdatePageOrders(uid, withOrder)
    set({ pages: withOrder })
  },

  addElement: async (type) => {
    const { uid, currentPageId, notebook } = get()
    if (!uid) return null
    get()._saveUndo()
    const element = {
      id: crypto.randomUUID(),
      pageId: currentPageId,
      notebookId: notebook.id,
      type,
      grid: defaultGrid(type),
      data: defaultData(type),
    }
    await get()._track(fsSaveElement(uid, element))
    set(s => ({ elements: [...s.elements, element], selectedId: element.id }))
    const cid = collabId()
    if (cid) pushElement(cid, element).catch(console.warn)
    return element
  },

  updateElement: async (id, patch) => {
    const { uid } = get()
    if (!uid) return
    await get()._track(fsUpdateElement(uid, id, patch))
    set(s => ({ elements: s.elements.map(e => e.id === id ? { ...e, ...patch } : e) }))
    const cid = collabId()
    if (cid) {
      const el = get().elements.find(e => e.id === id)
      if (el) pushElement(cid, el).catch(console.warn)
    }
  },

  updateElementGrid: (id, grid) => {
    const { uid } = get()
    if (uid) fsUpdateElement(uid, id, { grid }).catch(console.warn)
    set(s => ({ elements: s.elements.map(e => e.id === id ? { ...e, grid } : e) }))
  },

  deleteElement: async (id) => {
    const { uid } = get()
    if (!uid) return
    get()._saveUndo()
    await get()._track(fsDeleteElement(uid, id))
    const cid = collabId()
    if (cid) fsCollabDeleteEl(cid, id).catch(console.warn)
    set(s => ({
      elements: s.elements.filter(e => e.id !== id),
      selectedId: s.selectedId === id ? null : s.selectedId,
    }))
  },

  applyLayout: async (layoutDef) => {
    const { uid, currentPageId, notebook } = get()
    if (!uid) return
    get()._saveUndo()
    if (layoutDef.elements.length === 0) {
      await fsReplacePageElements(uid, currentPageId, notebook.id, [])
      set({ elements: [], selectedId: null })
      return
    }
    const newElements = layoutDef.elements.map(el => {
      let inferredData = {}
      if (el.type === 'text' && !el.data?.textStyle) {
        const { y, w, h } = el.grid
        if (h <= 2 && w >= 8) {
          inferredData = y === 0
            ? { textStyle: 'dateline', fontSize: 11, color: '#c0813a' }
            : { textStyle: 'caption', fontSize: 10, color: '#888888' }
        } else if (h <= 3 && w >= 8 && y === 0) {
          inferredData = { textStyle: 'heading', fontSize: 32, color: '#1a1a1a' }
        }
      }
      return {
        id: crypto.randomUUID(),
        pageId: currentPageId,
        notebookId: notebook.id,
        type: el.type,
        grid: { ...el.grid },
        data: { ...defaultData(el.type), ...inferredData, ...(el.data ?? {}) },
      }
    })
    await fsReplacePageElements(uid, currentPageId, notebook.id, newElements)
    set({ elements: newElements, selectedId: null })
    const cid = collabId()
    if (cid) pushAllElements(cid, newElements).catch(console.warn)
  },

  updatePage: async (pageId, patch) => {
    const { uid } = get()
    if (!uid) return
    await get()._track(fsUpdatePage(uid, pageId, patch))
    set(s => ({ pages: s.pages.map(p => p.id === pageId ? { ...p, ...patch } : p) }))
    const cid = collabId()
    if (cid) {
      const page = get().pages.find(p => p.id === pageId)
      if (page) pushPage(cid, page).catch(console.warn)
    }
  },

  // ── Collab ────────────────────────────────────────────────────────────────

  enableCollab: async () => {
    const { notebook, pages, elements } = get()
    if (!notebook) return
    await pushJournal(notebook)
    await Promise.all(pages.map(p => pushPage(notebook.id, p)))
    await pushAllElements(notebook.id, elements)
    const unsub = subscribeToElements(notebook.id, () => {
      set({ _cloudChangesAvailable: true })
    })
    useCollabStore.getState().startSync(notebook.id, unsub)
    set({ _cloudChangesAvailable: false })
  },

  refreshFromCloud: async () => {
    const { uid, notebook } = get()
    if (!notebook || !uid) return
    const data = await fetchJournalFromFirestore(notebook.id)
    if (!data) return
    for (const rp of data.pages) {
      await fsSavePage(uid, { ...rp, notebookId: notebook.id, themeOverrides: {} })
    }
    const pageIds = data.pages.map(p => p.id)
    for (const pid of pageIds) {
      const remoteEls = data.elements.filter(e => e.pageId === pid)
      await fsReplacePageElements(uid, pid, notebook.id, remoteEls.map(el => ({ ...el, notebookId: notebook.id })))
    }
    const freshPages = await fsLoadPages(uid, notebook.id)
    const { currentPageId } = get()
    const targetId = currentPageId ?? freshPages[0]?.id
    const freshEls = targetId ? await fsLoadElements(uid, targetId) : []
    set({ pages: freshPages, currentPageId: targetId ?? null, elements: freshEls, _cloudChangesAvailable: false })
  },

  disableCollab: () => useCollabStore.getState().stopSync(),

  select: (id) => set({ selectedId: id }),
  deselect: () => set({ selectedId: null }),
  togglePrintOverlay: () => set(s => ({ printOverlay: !s.printOverlay })),
}))
