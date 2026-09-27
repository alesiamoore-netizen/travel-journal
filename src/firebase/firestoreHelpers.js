import {
  collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc,
  query, where, orderBy, writeBatch, serverTimestamp, runTransaction,
} from 'firebase/firestore'
import { firestoreDb } from './config'

// ── Path helpers ──────────────────────────────────────────────────────────────

function userCol(uid, col) {
  return collection(firestoreDb, 'users', uid, col)
}
function userDoc(uid, col, id) {
  return doc(firestoreDb, 'users', uid, col, id)
}

// ── Notebooks ─────────────────────────────────────────────────────────────────

export async function fsLoadNotebooks(uid) {
  const snap = await getDocs(query(userCol(uid, 'notebooks'), orderBy('updatedAt', 'desc')))
  return snap.docs.map(d => d.data())
}

export async function fsSaveNotebook(uid, notebook) {
  await setDoc(userDoc(uid, 'notebooks', notebook.id), notebook)
}

export async function fsUpdateNotebook(uid, id, patch) {
  await updateDoc(userDoc(uid, 'notebooks', id), { ...patch, updatedAt: new Date().toISOString() })
}

export async function fsDeleteNotebook(uid, notebookId) {
  const batch = writeBatch(firestoreDb)

  const pages = await getDocs(query(userCol(uid, 'pages'), where('notebookId', '==', notebookId)))
  pages.docs.forEach(d => batch.delete(d.ref))

  const elements = await getDocs(query(userCol(uid, 'elements'), where('notebookId', '==', notebookId)))
  elements.docs.forEach(d => batch.delete(d.ref))

  const photos = await getDocs(query(userCol(uid, 'photos'), where('notebookId', '==', notebookId)))
  photos.docs.forEach(d => batch.delete(d.ref))

  batch.delete(userDoc(uid, 'notebooks', notebookId))
  await batch.commit()
}

// ── Pages ─────────────────────────────────────────────────────────────────────

export async function fsLoadPages(uid, notebookId) {
  const snap = await getDocs(query(userCol(uid, 'pages'), where('notebookId', '==', notebookId)))
  return snap.docs.map(d => d.data()).sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
}

export async function fsSavePage(uid, page) {
  await setDoc(userDoc(uid, 'pages', page.id), page)
}

export async function fsUpdatePage(uid, id, patch) {
  await updateDoc(userDoc(uid, 'pages', id), patch)
}

export async function fsDeletePage(uid, pageId) {
  const batch = writeBatch(firestoreDb)
  const elements = await getDocs(query(userCol(uid, 'elements'), where('pageId', '==', pageId)))
  elements.docs.forEach(d => batch.delete(d.ref))
  batch.delete(userDoc(uid, 'pages', pageId))
  await batch.commit()
}

// Deletes several pages (and all of their elements) in one atomic batch — used to delete a
// Monthly Spreads pair as a single unit, never one side independently.
export async function fsDeletePages(uid, pageIds) {
  const batch = writeBatch(firestoreDb)
  for (const pageId of pageIds) {
    const elements = await getDocs(query(userCol(uid, 'elements'), where('pageId', '==', pageId)))
    elements.docs.forEach(d => batch.delete(d.ref))
    batch.delete(userDoc(uid, 'pages', pageId))
  }
  await batch.commit()
}

export async function fsUpdatePageOrders(uid, pages) {
  const batch = writeBatch(firestoreDb)
  pages.forEach(p => batch.update(userDoc(uid, 'pages', p.id), { order: p.order }))
  await batch.commit()
}

// ── Elements ──────────────────────────────────────────────────────────────────

export async function fsLoadElements(uid, pageId) {
  const snap = await getDocs(query(userCol(uid, 'elements'), where('pageId', '==', pageId)))
  return snap.docs.map(d => d.data())
}

export async function fsSaveElement(uid, element) {
  await setDoc(userDoc(uid, 'elements', element.id), element)
}

export async function fsUpdateElement(uid, id, patch) {
  await updateDoc(userDoc(uid, 'elements', id), patch)
}

export async function fsDeleteElement(uid, id) {
  await deleteDoc(userDoc(uid, 'elements', id))
}

export async function fsReplacePageElements(uid, pageId, notebookId, elements) {
  const batch = writeBatch(firestoreDb)
  const existing = await getDocs(query(userCol(uid, 'elements'), where('pageId', '==', pageId)))
  existing.docs.forEach(d => batch.delete(d.ref))
  elements.forEach(el => batch.set(userDoc(uid, 'elements', el.id), el))
  await batch.commit()
}

export async function fsLoadNotebookElements(uid, notebookId) {
  const snap = await getDocs(query(userCol(uid, 'elements'), where('notebookId', '==', notebookId)))
  return snap.docs.map(d => d.data())
}

const FIRESTORE_BATCH_LIMIT = 500

// Commits `{id, patch}` element updates in chunks of <=500 (Firestore's per-batch op limit),
// sequentially, all-or-visibly-partial. Returns { succeededIds, failedAt, error } — failedAt is
// the id list of the batch that failed (if any); everything before it already committed. Each
// write is `updateDoc(ref, patch)` with the full resolved patch (never a delta), so retrying a
// failed/partial run is safe — re-applying the same target state is a no-op for anything that
// already succeeded.
export async function fsBatchUpdateElements(uid, updates) {
  const chunks = []
  for (let i = 0; i < updates.length; i += FIRESTORE_BATCH_LIMIT) {
    chunks.push(updates.slice(i, i + FIRESTORE_BATCH_LIMIT))
  }
  const succeededIds = []
  for (const chunk of chunks) {
    const batch = writeBatch(firestoreDb)
    chunk.forEach(({ id, patch }) => batch.update(userDoc(uid, 'elements', id), patch))
    try {
      await batch.commit()
      succeededIds.push(...chunk.map(c => c.id))
    } catch (error) {
      return { succeededIds, failedAt: chunk.map(c => c.id), error }
    }
  }
  return { succeededIds, failedAt: null, error: null }
}

// ── Atomic multi-document writes (Photo-a-Day / Monthly Spreads) ──────────────

// One writeBatch across any mix of new docs, patches, and deletes — either fully commits
// or writes nothing. Used everywhere this plan requires "notebook + pages + elements in one
// atomic operation" instead of sequential writes with a rollback fallback.
async function fsCommitBatch(uid, { sets = [], updates = [], deletes = [] }) {
  const batch = writeBatch(firestoreDb)
  sets.forEach(({ col, data }) => batch.set(userDoc(uid, col, data.id), data))
  updates.forEach(({ col, id, patch }) => batch.update(userDoc(uid, col, id), patch))
  deletes.forEach(({ col, id }) => batch.delete(userDoc(uid, col, id)))
  await batch.commit()
}

// Commits the notebook doc plus all 24 Monthly Spreads pages plus all their elements in one
// atomic batch (~100-125 ops for a full 12-month preset, well under Firestore's 500-op cap).
// Either the whole journal exists afterward, or none of it does — no rollback logic needed.
export async function fsCreateMonthlySpreadsJournal(uid, { notebook, pages, elements }) {
  await fsCommitBatch(uid, {
    sets: [
      { col: 'notebooks', data: notebook },
      ...pages.map(p => ({ col: 'pages', data: p })),
      ...elements.map(el => ({ col: 'elements', data: el })),
    ],
  })
}

// Commits the notebook doc plus its one cover page plus the cover's elements in one atomic
// batch — never the generic lazy-blank-page fallback, so the result is always either a
// complete Photo-a-Day journal with its styled cover, or no journal at all.
export async function fsCreatePhotoADayJournal(uid, { notebook, page, elements }) {
  await fsCommitBatch(uid, {
    sets: [
      { col: 'notebooks', data: notebook },
      { col: 'pages', data: page },
      ...elements.map(el => ({ col: 'elements', data: el })),
    ],
  })
}

// A spread's "Month Style" change: both pages' themeOverrides patch and every affected
// element's restyle patch, committed together in one atomic batch — page colors and element
// colors can never diverge from a partial failure.
export async function fsApplyMonthStyle(uid, { pageUpdates, elementUpdates }) {
  await fsCommitBatch(uid, {
    updates: [
      ...pageUpdates.map(({ id, patch }) => ({ col: 'pages', id, patch })),
      ...elementUpdates.map(({ id, patch }) => ({ col: 'elements', id, patch })),
    ],
  })
}

// Manual month-spread insertion into an existing trip journal: the 2 new pages + their
// elements, plus (when under the operation-count guard) the renumbered `order` for pages
// after the insertion point — all in one atomic batch.
export async function fsInsertMonthSpread(uid, { pages, elements, orderUpdates = [] }) {
  await fsCommitBatch(uid, {
    sets: [
      ...pages.map(p => ({ col: 'pages', data: p })),
      ...elements.map(el => ({ col: 'elements', data: el })),
    ],
    updates: orderUpdates.map(({ id, order }) => ({ col: 'pages', id, patch: { order } })),
  })
}

// Race-safe daily-entry creation: a Firestore transaction reading the deterministic page-id
// doc first. If it already exists, no write happens and the existing doc is returned — this
// is what makes two near-simultaneous "+Today's Entry" clicks (e.g. two collab clients)
// converge on one page instead of racing: the loser's transaction retries against the
// now-existing document and correctly resolves to "already exists." If absent, the page doc
// and every element doc are written together in the SAME transaction — there is no
// intermediate state where a blank page exists without its content.
export async function fsCreateDailyEntryIfAbsent(uid, dateStr, pageDoc, elementDocs) {
  return runTransaction(firestoreDb, async (tx) => {
    const ref = userDoc(uid, 'pages', pageDoc.id)
    const snap = await tx.get(ref)
    if (snap.exists()) return { created: false, page: snap.data() }
    tx.set(ref, pageDoc)
    for (const el of elementDocs) tx.set(userDoc(uid, 'elements', el.id), el)
    return { created: true, page: pageDoc }
  })
}

// ── Photos ────────────────────────────────────────────────────────────────────

export async function fsLoadPhotos(uid, notebookId) {
  const snap = await getDocs(query(userCol(uid, 'photos'), where('notebookId', '==', notebookId)))
  return snap.docs.map(d => d.data()).sort((a, b) => (b.uploadedAt ?? '').localeCompare(a.uploadedAt ?? ''))
}

export async function fsSavePhoto(uid, photo) {
  await setDoc(userDoc(uid, 'photos', photo.id), photo)
}

export async function fsGetFirstPageCover(uid, notebookId) {
  const pages = await fsLoadPages(uid, notebookId)
  for (const page of pages) {
    const elements = await fsLoadElements(uid, page.id)
    const coverEl = elements.find(e => (e.type === 'image' || e.type === 'cover') && e.data?.thumbnailUrl)
    if (coverEl) return coverEl.data.thumbnailUrl
  }
  return null
}

// ── Public share (public_notebooks collection) ─────────────────────────────

export async function fsPublishShare(uid, notebookId, sharePin = null) {
  const [notebooks, pages] = await Promise.all([
    fsLoadNotebooks(uid),
    fsLoadPages(uid, notebookId),
  ])
  const notebook = notebooks.find(n => n.id === notebookId)
  if (!notebook) throw new Error('Notebook not found')

  const pagesWithElements = await Promise.all(
    pages.map(async page => {
      const elements = await fsLoadElements(uid, page.id)
      return { ...page, elements }
    })
  )

  const snapshot = {
    id: notebookId,
    ownerId: uid,
    name: notebook.name,
    description: notebook.description ?? '',
    theme: notebook.theme,
    pageSize: notebook.pageSize,
    coverPhotoUrl: notebook.coverPhotoUrl ?? null,
    publishedAt: new Date().toISOString(),
    sharePin: sharePin || null,
    pages: pagesWithElements,
  }

  await setDoc(doc(firestoreDb, 'public_notebooks', notebookId), snapshot)
  await fsUpdateNotebook(uid, notebookId, { isPublic: true, sharePublishedAt: snapshot.publishedAt })
  return snapshot
}

export async function fsLoadPublicNotebook(notebookId) {
  const snap = await getDoc(doc(firestoreDb, 'public_notebooks', notebookId))
  return snap.exists() ? snap.data() : null
}

export async function fsUnpublishShare(uid, notebookId) {
  await deleteDoc(doc(firestoreDb, 'public_notebooks', notebookId))
  await fsUpdateNotebook(uid, notebookId, { isPublic: false, sharePublishedAt: null })
}
