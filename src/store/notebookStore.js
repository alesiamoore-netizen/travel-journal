import { create } from 'zustand'
import { db } from '../db'

export const useNotebookStore = create((set) => ({
  notebooks: [],
  loading: false,

  load: async () => {
    set({ loading: true })
    const notebooks = await db.notebooks.orderBy('updatedAt').reverse().toArray()
    set({ notebooks, loading: false })
  },

  create: async (data) => {
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
      syncMeta: {
        provider: 'none',
        remoteFolderId: null,
        lastSynced: null,
        status: 'offline',
      },
    }
    await db.notebooks.add(notebook)
    set((state) => ({ notebooks: [notebook, ...state.notebooks] }))
    return notebook
  },

  delete: async (id) => {
    await db.transaction('rw', [db.notebooks, db.pages, db.pageElements, db.photos], async () => {
      const pageIds = await db.pages.where('notebookId').equals(id).primaryKeys()
      await db.pageElements.where('notebookId').equals(id).delete()
      await db.pages.bulkDelete(pageIds)
      await db.photos.where('notebookId').equals(id).delete()
      await db.notebooks.delete(id)
    })
    set((state) => ({ notebooks: state.notebooks.filter((n) => n.id !== id) }))
  },

  update: async (id, patch) => {
    const updated = { ...patch, updatedAt: new Date().toISOString() }
    await db.notebooks.update(id, updated)
    set((state) => ({
      notebooks: state.notebooks.map((n) => (n.id === id ? { ...n, ...updated } : n)),
    }))
  },
}))
