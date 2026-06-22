import Dexie from 'dexie'

export const db = new Dexie('TravelJournal')

db.version(1).stores({
  notebooks:    'id, name, createdAt, updatedAt',
  pages:        'id, notebookId, order',
  pageElements: 'id, pageId, notebookId, type',
  photos:       'id, notebookId, filename, uploadedAt',
})

// v2: adds quick-capture notes
db.version(2).stores({
  notes: 'id, notebookId, createdAt',
})
