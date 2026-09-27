import { create } from 'zustand'
import {
  fsLoadNotebooks, fsSaveNotebook, fsUpdateNotebook, fsDeleteNotebook,
  fsLoadPages, fsSavePage, fsLoadElements, fsSaveElement,
  fsCreatePhotoADayJournal, fsCreateMonthlySpreadsJournal,
} from '../firebase/firestoreHelpers'
import { buildPhotoADayCoverDocs, buildMonthSpreadDocs } from '../utils/journalBuilders'

function baseNotebookFields(data) {
  const theme = data.theme
  return {
    id: crypto.randomUUID(),
    name: data.name,
    description: data.description || '',
    coverPhotoId: null,
    pageSize: data.pageSize || '8x10',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    theme: {
      backgroundStyle: 'solid',
      backgroundColor: theme?.backgroundColor ?? '#f5f0e8',
      backgroundTexture: theme?.backgroundTexture ?? null,
      fontHeading: theme?.fontHeading ?? 'Georgia',
      fontBody: theme?.fontBody ?? 'system-ui',
      accentColor: theme?.accentColor ?? data.accentColor ?? '#c0813a',
      accentColorSecondary: theme?.accentColorSecondary ?? '#4a7c59',
      themeId: theme?.id ?? null,
    },
    syncMeta: { provider: 'firestore', status: 'synced' },
  }
}

export const useNotebookStore = create((set, get) => ({
  notebooks: [],
  loading: false,
  uid: null,

  setUid: (uid) => set({ uid }),

  load: async () => {
    const { uid } = get()
    if (!uid) return
    set({ loading: true })
    const notebooks = await fsLoadNotebooks(uid)
    set({ notebooks, loading: false })
  },

  create: async (data) => {
    const { uid } = get()
    if (!uid) return null
    // journalKind 'trip' covers every existing/ordinary notebook; 'photo-a-day' and
    // 'monthly-spreads' notebooks are never created through this function — they're created
    // atomically (notebook+pages+elements in one Firestore batch) by
    // createPhotoADayJournal()/createMonthlySpreadsJournal() below.
    const notebook = { ...baseNotebookFields(data), journalKind: 'trip', photoDayMode: null, journalYear: null, spreadYear: null }
    await fsSaveNotebook(uid, notebook)
    set((state) => ({ notebooks: [notebook, ...state.notebooks] }))
    return notebook
  },

  // Atomic: notebook + one styled cover page + the cover's elements commit together in one
  // Firestore batch (fsCreatePhotoADayJournal) — never the generic lazy-blank-page fallback
  // followed by a separate "apply a cover" step. The observable result is always either a
  // complete journal with its cover, or no journal at all.
  createPhotoADayJournal: async (data) => {
    const { uid } = get()
    if (!uid) return null
    const photoDayMode = data.photoDayMode ?? 'year'
    const notebook = {
      ...baseNotebookFields(data),
      journalKind: 'photo-a-day',
      photoDayMode,
      journalYear: photoDayMode === 'year' ? (data.journalYear ?? new Date().getFullYear()) : null,
      spreadYear: null,
    }
    const { page, elements } = buildPhotoADayCoverDocs(notebook.id)
    try {
      await fsCreatePhotoADayJournal(uid, { notebook, page, elements })
    } catch (error) {
      // A rejected batch leaves no notebook/page/element docs (atomic) — return null rather
      // than let the rejection propagate uncaught into CreateNotebookModal's handleSubmit,
      // which would otherwise crash on notebook.id or leave "Creating…" stuck forever.
      console.error('createPhotoADayJournal failed:', error)
      return null
    }
    set((state) => ({ notebooks: [notebook, ...state.notebooks] }))
    return notebook
  },

  // Atomic: notebook + all 24 Monthly Spreads pages + all their elements commit together in
  // one Firestore batch (fsCreateMonthlySpreadsJournal) — no sequential per-month writes, no
  // rollback logic, since a batch either fully succeeds or writes nothing.
  createMonthlySpreadsJournal: async (data) => {
    const { uid } = get()
    if (!uid) return null
    const year = data.spreadYear ?? new Date().getFullYear()
    const notebook = {
      ...baseNotebookFields(data),
      journalKind: 'monthly-spreads',
      photoDayMode: null,
      journalYear: null,
      spreadYear: year,
    }
    const pages = []
    const elements = []
    for (let month = 0; month < 12; month++) {
      const built = buildMonthSpreadDocs(notebook.id, month, year, { baseOrder: month * 2, pageSize: notebook.pageSize })
      pages.push(...built.pages)
      elements.push(...built.elements)
    }
    try {
      await fsCreateMonthlySpreadsJournal(uid, { notebook, pages, elements })
    } catch (error) {
      console.error('createMonthlySpreadsJournal failed:', error)
      return null
    }
    set((state) => ({ notebooks: [notebook, ...state.notebooks] }))
    return notebook
  },

  delete: async (id) => {
    const { uid } = get()
    if (!uid) return
    await fsDeleteNotebook(uid, id)
    set((state) => ({ notebooks: state.notebooks.filter((n) => n.id !== id) }))
  },

  update: async (id, patch) => {
    const { uid } = get()
    if (!uid) return
    const updated = { ...patch, updatedAt: new Date().toISOString() }
    await fsUpdateNotebook(uid, id, updated)
    set((state) => ({
      notebooks: state.notebooks.map((n) => (n.id === id ? { ...n, ...updated } : n)),
    }))
  },

  duplicate: async (notebookId) => {
    const { uid } = get()
    if (!uid) return null
    const src = get().notebooks.find(n => n.id === notebookId)
    if (!src) return null

    const newId = crypto.randomUUID()
    const now = new Date().toISOString()
    const copy = { ...src, id: newId, name: `${src.name} (copy)`, createdAt: now, updatedAt: now, coverPhotoUrl: null, isPublic: false }
    await fsSaveNotebook(uid, copy)

    const pages = await fsLoadPages(uid, notebookId)
    for (const page of pages) {
      const newPageId = crypto.randomUUID()
      await fsSavePage(uid, { ...page, id: newPageId, notebookId: newId })
      const elements = await fsLoadElements(uid, page.id)
      for (const el of elements) {
        await fsSaveElement(uid, { ...el, id: crypto.randomUUID(), pageId: newPageId, notebookId: newId })
      }
    }

    set((state) => ({ notebooks: [copy, ...state.notebooks] }))
    return copy
  },
}))
