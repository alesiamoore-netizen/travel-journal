import Dexie from 'dexie'

export const db = new Dexie('TravelJournal')

db.version(1).stores({
  notebooks:    'id, name, createdAt, updatedAt',
  pages:        'id, notebookId, order',
  pageElements: 'id, pageId, notebookId, type',
  photos:       'id, notebookId, filename, uploadedAt',
})
