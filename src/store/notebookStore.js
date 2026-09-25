import { create } from 'zustand'
import {
  fsLoadNotebooks, fsSaveNotebook, fsUpdateNotebook, fsDeleteNotebook,
  fsLoadPages, fsSavePage, fsLoadElements, fsSaveElement,
} from '../firebase/firestoreHelpers'

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
    const notebook = {
      id: crypto.randomUUID(),
      name: data.name,
      description: data.description || '',
      coverPhotoId: null,
      pageSize: data.pageSize || '8x10',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      theme: {
        backgroundStyle: 'solid',
        backgroundColor: '#f5f0e8',
        backgroundTexture: null,
        fontHeading: 'Georgia',
        fontBody: 'system-ui',
        accentColor: data.accentColor || '#c0813a',
        accentColorSecondary: '#4a7c59',
      },
      syncMeta: { provider: 'firestore', status: 'synced' },
    }
    await fsSaveNotebook(uid, notebook)
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
