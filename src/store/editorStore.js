import { create } from 'zustand'
import { db } from '../db'
import { loadFont } from '../utils/fonts'
import {
  pushElement, deleteElement as fsDeleteEl,
  pushJournal, pushPage, deletePage as fsDeletePage,
  pushAllElements, subscribeToElements, fetchJournalFromFirestore,
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
    fit: 'cover',
    caption: '',
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
  }
  if (type === 'divider') return {
    style: 'line',
    color: 'accent',
    rotation: 0,
  }
  return {}
}

function defaultGrid(type) {
  if (type === 'text')    return { x: 1, y: 1,  w: 10, h: 5  }
  if (type === 'map')     return { x: 0, y: 0,  w: 12, h: 10 }
  if (type === 'divider') return { x: 1, y: 7,  w: 10, h: 1  }
  if (type === 'sticker') return { x: 4, y: 4,  w: 4,  h: 4  }
  return                          { x: 2, y: 2,  w: 8,  h: 8  }
}

function snapshot(elements) {
  return elements.map(e => ({ ...e, data: { ...e.data } }))
}

// Returns active Firestore notebook ID, or null when collab is off
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

  reset: () => set({
    notebook: null, pages: [], currentPageId: null,
    elements: [], selectedId: null, printOverlay: false,
    _undoStack: [], _redoStack: [], _cloudChangesAvailable: false,
  }),

  _saveUndo: () => {
    const { elements, _undoStack } = get()
    const snap = snapshot(elements)
    set({ _undoStack: [..._undoStack, snap].slice(-40), _redoStack: [] })
  },

  undo: async () => {
    const { _undoStack, _redoStack, elements, currentPageId } = get()
    if (!_undoStack.length) return
    const prev = _undoStack[_undoStack.length - 1]
    await db.pageElements.where('pageId').equals(currentPageId).delete()
    if (prev.length) await db.pageElements.bulkAdd(prev)
    set({
      elements: prev,
      _undoStack: _undoStack.slice(0, -1),
      _redoStack: [..._redoStack, snapshot(elements)].slice(-40),
      selectedId: null,
    })
  },

  redo: async () => {
    const { _undoStack, _redoStack, elements, currentPageId } = get()
    if (!_redoStack.length) return
    const next = _redoStack[_redoStack.length - 1]
    await db.pageElements.where('pageId').equals(currentPageId).delete()
    if (next.length) await db.pageElements.bulkAdd(next)
    set({
      elements: next,
      _redoStack: _redoStack.slice(0, -1),
      _undoStack: [..._undoStack, snapshot(elements)].slice(-40),
      selectedId: null,
    })
  },

  updateTheme: async (patch) => {
    const { notebook } = get()
    if (!notebook) return
    const newTheme = { ...notebook.theme, ...patch }
    const updatedAt = new Date().toISOString()
    await db.notebooks.update(notebook.id, { theme: newTheme, updatedAt })
    set(s => ({ notebook: { ...s.notebook, theme: newTheme, updatedAt } }))
    const cid = collabId()
    if (cid) pushJournal({ ...get().notebook }).catch(console.warn)
  },

  loadNotebook: async (notebookId) => {
    const notebook = await db.notebooks.get(notebookId)
    if (!notebook) return null
    let pages = await db.pages.where('notebookId').equals(notebookId).sortBy('order')
    if (pages.length === 0) {
      const page = { id: crypto.randomUUID(), notebookId, order: 0, themeOverrides: {} }
      await db.pages.add(page)
      pages = [page]
    }
    const elements = await db.pageElements.where('pageId').equals(pages[0].id).toArray()
    loadFont(notebook.theme?.fontHeading)
    loadFont(notebook.theme?.fontBody)
    set({ notebook, pages, currentPageId: pages[0].id, elements, selectedId: null, _undoStack: [], _redoStack: [] })
    return notebook
  },

  switchPage: async (pageId) => {
    const elements = await db.pageElements.where('pageId').equals(pageId).toArray()
    set({ currentPageId: pageId, elements, selectedId: null, _undoStack: [], _redoStack: [] })
  },

  addPage: async () => {
    const { notebook, pages } = get()
    const page = { id: crypto.randomUUID(), notebookId: notebook.id, order: pages.length, themeOverrides: {} }
    await db.pages.add(page)
    set({ pages: [...pages, page], currentPageId: page.id, elements: [], selectedId: null, _undoStack: [], _redoStack: [] })
    const cid = collabId()
    if (cid) pushPage(cid, page).catch(console.warn)
    return page
  },

  deletePage: async (pageId) => {
    const { pages, currentPageId } = get()
    if (pages.length <= 1) return
    await db.pageElements.where('pageId').equals(pageId).delete()
    await db.pages.delete(pageId)
    const remaining = pages.filter(p => p.id !== pageId)
    await Promise.all(remaining.map((p, i) => db.pages.update(p.id, { order: i })))
    set({ pages: remaining.map((p, i) => ({ ...p, order: i })) })
    if (currentPageId === pageId) {
      const elements = await db.pageElements.where('pageId').equals(remaining[0].id).toArray()
      set({ currentPageId: remaining[0].id, elements, selectedId: null })
    }
    const cid = collabId()
    if (cid) fsDeletePage(cid, pageId).catch(console.warn)
  },

  duplicatePage: async (pageId) => {
    const { pages, notebook } = get()
    const src = pages.find(p => p.id === pageId)
    if (!src) return
    const srcIdx = pages.findIndex(p => p.id === pageId)
    const srcElements = await db.pageElements.where('pageId').equals(pageId).toArray()
    const newPage = {
      id: crypto.randomUUID(),
      notebookId: notebook.id,
      order: srcIdx + 1,
      title: src.title ? `${src.title} (copy)` : '',
      location: src.location ?? '',
      date: src.date ?? '',
      themeOverrides: { ...(src.themeOverrides ?? {}) },
    }
    await db.pages.add(newPage)
    const newElements = srcElements.map(el => ({
      ...el,
      id: crypto.randomUUID(),
      pageId: newPage.id,
      data: { ...el.data },
    }))
    if (newElements.length > 0) await db.pageElements.bulkAdd(newElements)
    const inserted = [
      ...pages.slice(0, srcIdx + 1),
      newPage,
      ...pages.slice(srcIdx + 1),
    ].map((p, i) => ({ ...p, order: i }))
    await Promise.all(inserted.map(p => db.pages.update(p.id, { order: p.order })))
    set({ pages: inserted, currentPageId: newPage.id, elements: newElements, selectedId: null, _undoStack: [], _redoStack: [] })
    const cid = collabId()
    if (cid) {
      pushPage(cid, newPage).catch(console.warn)
      pushAllElements(cid, newElements).catch(console.warn)
    }
  },

  movePage: async (pageId, direction) => {
    const { pages } = get()
    const idx = pages.findIndex(p => p.id === pageId)
    const newIdx = idx + direction
    if (newIdx < 0 || newIdx >= pages.length) return
    const reordered = [...pages]
    ;[reordered[idx], reordered[newIdx]] = [reordered[newIdx], reordered[idx]]
    const withOrder = reordered.map((p, i) => ({ ...p, order: i }))
    await Promise.all(withOrder.map(p => db.pages.update(p.id, { order: p.order })))
    set({ pages: withOrder })
    const cid = collabId()
    if (cid) Promise.all(withOrder.map(p => pushPage(cid, p))).catch(console.warn)
  },

  addElement: async (type) => {
    get()._saveUndo()
    const { currentPageId, notebook } = get()
    const element = {
      id: crypto.randomUUID(),
      pageId: currentPageId,
      notebookId: notebook.id,
      type,
      grid: defaultGrid(type),
      data: defaultData(type),
    }
    await db.pageElements.add(element)
    set(s => ({ elements: [...s.elements, element], selectedId: element.id }))
    const cid = collabId()
    if (cid) pushElement(cid, element).catch(console.warn)
    return element
  },

  updateElement: async (id, patch) => {
    await db.pageElements.update(id, patch)
    set(s => ({ elements: s.elements.map(e => e.id === id ? { ...e, ...patch } : e) }))
    const cid = collabId()
    if (cid) {
      const el = get().elements.find(e => e.id === id)
      if (el) pushElement(cid, el).catch(console.warn)
    }
  },

  updateElementGrid: (id, grid) => {
    db.pageElements.update(id, { grid })
    set(s => ({ elements: s.elements.map(e => e.id === id ? { ...e, grid } : e) }))
    // Grid moves are very frequent; skip collab push (pushed on next data change)
  },

  deleteElement: async (id) => {
    get()._saveUndo()
    const cid = collabId()
    await db.pageElements.delete(id)
    if (cid) fsDeleteEl(cid, id).catch(console.warn)
    set(s => ({
      elements: s.elements.filter(e => e.id !== id),
      selectedId: s.selectedId === id ? null : s.selectedId,
    }))
  },

  applyLayout: async (layoutDef) => {
    get()._saveUndo()
    const { currentPageId, notebook } = get()
    await db.pageElements.where('pageId').equals(currentPageId).delete()
    if (layoutDef.elements.length === 0) {
      set({ elements: [], selectedId: null })
      return
    }
    const newElements = []
    for (const el of layoutDef.elements) {
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
      const element = {
        id: crypto.randomUUID(),
        pageId: currentPageId,
        notebookId: notebook.id,
        type: el.type,
        grid: { ...el.grid },
        data: { ...defaultData(el.type), ...inferredData, ...(el.data ?? {}) },
      }
      await db.pageElements.add(element)
      newElements.push(element)
    }
    set({ elements: newElements, selectedId: null })
    const cid = collabId()
    if (cid) pushAllElements(cid, newElements).catch(console.warn)
  },

  updatePage: async (pageId, patch) => {
    await db.pages.update(pageId, patch)
    set(s => ({ pages: s.pages.map(p => p.id === pageId ? { ...p, ...patch } : p) }))
    const cid = collabId()
    if (cid) {
      const page = get().pages.find(p => p.id === pageId)
      if (page) pushPage(cid, page).catch(console.warn)
    }
  },

  // ── Collab (Firebase) ─────────────────────────────────────────────────────

  enableCollab: async () => {
    const { notebook, pages, elements } = get()
    if (!notebook) return
    // Push current local state to Firestore
    await pushJournal(notebook)
    await Promise.all(pages.map(p => pushPage(notebook.id, p)))
    await pushAllElements(notebook.id, elements)
    // Subscribe — just flag when remote changes arrive (user manually refreshes)
    const unsub = subscribeToElements(notebook.id, () => {
      set({ _cloudChangesAvailable: true })
    })
    useCollabStore.getState().startSync(notebook.id, unsub)
    set({ _cloudChangesAvailable: false })
  },

  refreshFromCloud: async () => {
    const { notebook } = get()
    if (!notebook) return
    const data = await fetchJournalFromFirestore(notebook.id)
    if (!data) return

    // Upsert remote pages into Dexie
    const existingPages = await db.pages.where('notebookId').equals(notebook.id).toArray()
    const existingIds = new Set(existingPages.map(p => p.id))
    for (const rp of data.pages) {
      const pageRecord = { ...rp, notebookId: notebook.id, themeOverrides: {} }
      if (existingIds.has(rp.id)) {
        await db.pages.update(rp.id, { title: rp.title, location: rp.location, date: rp.date, order: rp.order })
      } else {
        await db.pages.add(pageRecord)
      }
    }

    // Replace elements for all remote pages
    const pageIds = data.pages.map(p => p.id)
    if (pageIds.length) {
      await db.pageElements.where('pageId').anyOf(pageIds).delete()
      const remoteEls = data.elements.map(el => ({ ...el, notebookId: notebook.id }))
      if (remoteEls.length) await db.pageElements.bulkAdd(remoteEls)
    }

    // Reload store state
    const freshPages = await db.pages.where('notebookId').equals(notebook.id).sortBy('order')
    const { currentPageId } = get()
    const targetId = currentPageId ?? freshPages[0]?.id
    const freshEls = targetId ? await db.pageElements.where('pageId').equals(targetId).toArray() : []
    set({ pages: freshPages, currentPageId: targetId ?? null, elements: freshEls, _cloudChangesAvailable: false })
  },

  disableCollab: () => useCollabStore.getState().stopSync(),

  select: (id) => set({ selectedId: id }),
  deselect: () => set({ selectedId: null }),
  togglePrintOverlay: () => set(s => ({ printOverlay: !s.printOverlay })),
}))
