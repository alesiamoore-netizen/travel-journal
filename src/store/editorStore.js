import { create } from 'zustand'
import { db } from '../db'
import { loadFont } from '../utils/fonts'

function defaultData(type) {
  if (type === 'text') return {
    content: { type: 'doc', content: [{ type: 'paragraph' }] },
    fontFamily: 'Georgia',
    fontSize: 16,
    color: '#2c2c2c',
    columns: 1,
  }
  if (type === 'image') return {
    photoId: null,
    fit: 'cover',
    caption: '',
    borderStyle: 'none',
    filter: 'none',
  }
  if (type === 'map') return {
    tileStyle: 'minimal',
    showRoute: true,
    showPins: true,
    pinColor: '#c0813a',
    routeColor: '#c0813a',
    routeWeight: 2,
  }
  return {}
}

export const useEditorStore = create((set, get) => ({
  notebook: null,
  pages: [],
  currentPageId: null,
  elements: [],
  selectedId: null,
  printOverlay: false,

  reset: () => set({
    notebook: null, pages: [], currentPageId: null,
    elements: [], selectedId: null, printOverlay: false,
  }),

  updateTheme: async (patch) => {
    const { notebook } = get()
    if (!notebook) return
    const newTheme = { ...notebook.theme, ...patch }
    const updatedAt = new Date().toISOString()
    await db.notebooks.update(notebook.id, { theme: newTheme, updatedAt })
    set(s => ({ notebook: { ...s.notebook, theme: newTheme, updatedAt } }))
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
    // Pre-load theme fonts
    loadFont(notebook.theme?.fontHeading)
    loadFont(notebook.theme?.fontBody)
    set({ notebook, pages, currentPageId: pages[0].id, elements, selectedId: null })
    return notebook
  },

  switchPage: async (pageId) => {
    const elements = await db.pageElements.where('pageId').equals(pageId).toArray()
    set({ currentPageId: pageId, elements, selectedId: null })
  },

  addPage: async () => {
    const { notebook, pages } = get()
    const page = { id: crypto.randomUUID(), notebookId: notebook.id, order: pages.length, themeOverrides: {} }
    await db.pages.add(page)
    set({ pages: [...pages, page], currentPageId: page.id, elements: [], selectedId: null })
    return page
  },

  deletePage: async (pageId) => {
    const { pages, currentPageId } = get()
    if (pages.length <= 1) return
    await db.pageElements.where('pageId').equals(pageId).delete()
    await db.pages.delete(pageId)
    const remaining = pages.filter(p => p.id !== pageId)
    set({ pages: remaining })
    if (currentPageId === pageId) {
      const elements = await db.pageElements.where('pageId').equals(remaining[0].id).toArray()
      set({ currentPageId: remaining[0].id, elements, selectedId: null })
    }
  },

  addElement: async (type) => {
    const { currentPageId, notebook } = get()
    const element = {
      id: crypto.randomUUID(),
      pageId: currentPageId,
      notebookId: notebook.id,
      type,
      grid: type === 'text' ? { x: 1, y: 1, w: 10, h: 5 }
          : type === 'map'  ? { x: 0, y: 0, w: 12, h: 10 }
          : { x: 2, y: 2, w: 8, h: 8 },
      data: defaultData(type),
    }
    await db.pageElements.add(element)
    set(s => ({ elements: [...s.elements, element], selectedId: element.id }))
    return element
  },

  updateElement: async (id, patch) => {
    await db.pageElements.update(id, patch)
    set(s => ({ elements: s.elements.map(e => e.id === id ? { ...e, ...patch } : e) }))
  },

  updateElementGrid: (id, grid) => {
    db.pageElements.update(id, { grid })
    set(s => ({ elements: s.elements.map(e => e.id === id ? { ...e, grid } : e) }))
  },

  deleteElement: async (id) => {
    await db.pageElements.delete(id)
    set(s => ({
      elements: s.elements.filter(e => e.id !== id),
      selectedId: s.selectedId === id ? null : s.selectedId,
    }))
  },

  select: (id) => set({ selectedId: id }),
  deselect: () => set({ selectedId: null }),
  togglePrintOverlay: () => set(s => ({ printOverlay: !s.printOverlay })),
}))
