import { create } from 'zustand'
import { db } from '../db'
import { extractExif, reverseGeocode } from '../utils/exif'
import { generateThumbnail } from '../utils/thumbnail'

export const useCaptureStore = create((set, get) => ({
  notebookId: null,
  photos: [],
  notes: [],
  uploading: false,
  progress: { current: 0, total: 0 },

  load: async (notebookId) => {
    const [photos, notes] = await Promise.all([
      db.photos.where('notebookId').equals(notebookId).reverse().sortBy('uploadedAt'),
      db.notes.where('notebookId').equals(notebookId).reverse().sortBy('createdAt'),
    ])
    set({ notebookId, photos, notes })
  },

  addPhotos: async (files) => {
    const { notebookId } = get()
    const fileArray = Array.from(files).filter(f => f.type.startsWith('image/'))
    if (!fileArray.length) return

    set({ uploading: true, progress: { current: 0, total: fileArray.length } })

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i]
      const [exif, thumbnailBlob] = await Promise.all([
        extractExif(file),
        generateThumbnail(file, 400),
      ])

      const photo = {
        id: crypto.randomUUID(),
        notebookId,
        filename: file.name,
        mimeType: file.type,
        size: file.size,
        blob: file,
        thumbnailBlob,
        uploadedAt: new Date().toISOString(),
        exif,
      }

      await db.photos.add(photo)
      set(s => ({
        photos: [photo, ...s.photos],
        progress: { ...s.progress, current: i + 1 },
      }))

      // Geocode asynchronously — don't block upload loop
      if (exif.lat && exif.lng) {
        reverseGeocode(exif.lat, exif.lng).then(locationName => {
          if (!locationName) return
          const updatedExif = { ...exif, locationName }
          db.photos.update(photo.id, { exif: updatedExif })
          set(s => ({
            photos: s.photos.map(p =>
              p.id === photo.id ? { ...p, exif: updatedExif } : p,
            ),
          }))
        })
      }
    }

    set({ uploading: false })
  },

  deletePhoto: async (id) => {
    await db.photos.delete(id)
    set(s => ({ photos: s.photos.filter(p => p.id !== id) }))
  },

  addNote: async (text) => {
    const { notebookId } = get()
    const note = {
      id: crypto.randomUUID(),
      notebookId,
      text: text.trim(),
      createdAt: new Date().toISOString(),
    }
    await db.notes.add(note)
    set(s => ({ notes: [note, ...s.notes] }))
    return note
  },

  deleteNote: async (id) => {
    await db.notes.delete(id)
    set(s => ({ notes: s.notes.filter(n => n.id !== id) }))
  },
}))
