import {
  collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc,
  query, where, orderBy, writeBatch, serverTimestamp, runTransaction,
} from 'firebase/firestore'
import { firestoreDb } from './config'
import { isActivePhoto, groupPhotosByStatus, matchesPhotoReference, isPhotoBearingType, placementKey } from '../utils/photoLibrary'

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

// Photos are a reusable, owner-level library (see fsLoadAllPhotos below) — deleting a
// journal must never delete a photo document. Every other deletion behavior here is
// unchanged; mirror (journals/{id}) and public-share (public_notebooks/{id}) cleanup
// are a separate, pre-existing gap, intentionally not addressed by this fix.
export async function fsDeleteNotebook(uid, notebookId) {
  const batch = writeBatch(firestoreDb)

  const pages = await getDocs(query(userCol(uid, 'pages'), where('notebookId', '==', notebookId)))
  pages.docs.forEach(d => batch.delete(d.ref))

  const elements = await getDocs(query(userCol(uid, 'elements'), where('notebookId', '==', notebookId)))
  elements.docs.forEach(d => batch.delete(d.ref))

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

// ── Photos — owner-level reusable library (trash/restore MVP) ────────────────
//
// Photo documents already live at users/{uid}/photos/{id} — scoped by the uploading
// user's own uid, never by journal. `notebookId` on a photo doc is informational only
// (the journal it was originally uploaded from); it is never read by any access or
// visibility decision. A photo's lifecycle is governed only by its own `status` field.
//
// IMPORTANT — collaborator-upload limitation: fsLoadPhotos/fsSavePhoto are always
// called with the CURRENTLY AUTHENTICATED user's own uid (see every call site in
// Sidebar.jsx, MobileEditorBar.jsx, Inspector.jsx, ImageElement.jsx, CoverElement.jsx,
// CollageElement.jsx). A distinct collaborator account uploads into THEIR OWN
// users/{collaboratorUid}/photos — a completely separate collection this trash/
// restore system has no visibility into or effect on. This release governs only
// photos uploaded under the owner's own account.

// Re-exported for existing importers — the actual logic now lives in the Firebase-free
// utility module so it can be imported directly by both this file and plain Node tests.
export { isActivePhoto }

export async function fsLoadPhotos(uid, notebookId) {
  const snap = await getDocs(query(userCol(uid, 'photos'), where('notebookId', '==', notebookId)))
  return snap.docs.map(d => d.data())
    .filter(isActivePhoto)
    .sort((a, b) => (b.uploadedAt ?? '').localeCompare(a.uploadedAt ?? ''))
}

// Cross-journal browse — every active photo the owner has ever uploaded, regardless
// of which journal it was originally added from. No `where` filter: this is the one
// query that makes "reuse a photo across journals" possible at all.
export async function fsLoadAllPhotos(uid) {
  const snap = await getDocs(userCol(uid, 'photos'))
  return snap.docs.map(d => d.data())
    .filter(isActivePhoto)
    .sort((a, b) => (b.uploadedAt ?? '').localeCompare(a.uploadedAt ?? ''))
}

// ONE read of the owner's whole photos collection, split into {active, trashed} — the
// Photo Library page's only data source. Replaces the earlier version's two separate,
// simultaneous reads of the same collection (fsLoadAllPhotos plus a direct getDocs).
export async function fsLoadPhotoLibrary(uid) {
  const snap = await getDocs(userCol(uid, 'photos'))
  const all = snap.docs.map(d => d.data())
    .sort((a, b) => (b.uploadedAt ?? '').localeCompare(a.uploadedAt ?? ''))
  return groupPhotosByStatus(all)
}

// Every new upload is stamped with the fields this release's lifecycle depends on.
// Never touches an existing document — every call site generates a brand-new photoId.
export async function fsSavePhoto(uid, photo) {
  await setDoc(userDoc(uid, 'photos', photo.id), {
    ...photo,
    status: 'active',
    trashedAt: null,
    uploadedByUid: uid,
  })
}

// Trash/restore are the only lifecycle actions in this release — both fully reversible,
// neither deletes anything. Owner-only by the existing users/{uid}/** rule (no rule
// change needed).
export async function fsTrashPhoto(uid, photoId) {
  await updateDoc(userDoc(uid, 'photos', photoId), {
    status: 'trashed',
    trashedAt: new Date().toISOString(),
  })
}

export async function fsRestorePhoto(uid, photoId) {
  await updateDoc(userDoc(uid, 'photos', photoId), {
    status: 'active',
    trashedAt: null,
  })
}

// Read-only "where is this used" scan across every place a photo reference can
// independently exist. Informational only — returns a plain list of human-readable
// locations, never a boolean, and never deletes or modifies anything in any store it
// reads. There is no irreversible action in this release for it to gate.
//
// Canonical and mirror copies of the SAME logical placement (shared element id, per
// collab.js's pushElement) are deduplicated into one entry. A public-share snapshot is
// a genuinely separate placement (a disconnected deep copy) and is never deduplicated
// against the live canonical/mirror copy it was published from.
export async function fsCheckPhotoReferences(uid, photoId, storageUrl) {
  const notebooks = await fsLoadNotebooks(uid)
  const notebookById = new Map(notebooks.map(n => [n.id, n]))
  const locations = []
  const seenCanonicalOrMirror = new Set()

  // 1. Canonical owner elements.
  const canonicalSnap = await getDocs(userCol(uid, 'elements'))
  canonicalSnap.docs.forEach(d => {
    const el = d.data()
    if (isPhotoBearingType(el.type) && matchesPhotoReference(el.data, photoId, storageUrl)) {
      const key = placementKey(el.notebookId, el.pageId, el.id)
      if (!seenCanonicalOrMirror.has(key)) {
        seenCanonicalOrMirror.add(key)
        locations.push({
          type: 'element',
          notebookId: el.notebookId,
          notebookName: notebookById.get(el.notebookId)?.name ?? el.notebookId,
          pageId: el.pageId,
        })
      }
    }
  })

  // 2. Collaboration mirror elements — scanned independently (never assumed to agree
  // with canonical), one query per notebook the owner owns.
  for (const nb of notebooks) {
    const mirrorSnap = await getDocs(collection(firestoreDb, 'journals', nb.id, 'elements'))
    mirrorSnap.docs.forEach(d => {
      const el = d.data()
      if (isPhotoBearingType(el.type) && matchesPhotoReference(el.data, photoId, storageUrl)) {
        const key = placementKey(nb.id, el.pageId, el.id)
        if (!seenCanonicalOrMirror.has(key)) {
          seenCanonicalOrMirror.add(key)
          locations.push({ type: 'element', notebookId: nb.id, notebookName: nb.name, pageId: el.pageId })
        }
      }
    })
  }

  // 3. Notebook cover URLs — a plain URL string on the notebook doc, not a photoId
  // reference, so this is a storageUrl match, not a foreign-key lookup.
  notebooks.forEach(nb => {
    if (nb.coverPhotoUrl && nb.coverPhotoUrl === storageUrl) {
      locations.push({ type: 'cover', notebookId: nb.id, notebookName: nb.name })
    }
  })

  // 4. Published public-share snapshots — a disconnected deep copy, checked separately
  // from canonical/mirror on purpose (a stale published snapshot can still reference a
  // photo the live journal no longer does).
  for (const nb of notebooks.filter(n => n.isPublic)) {
    const snapshot = await fsLoadPublicNotebook(nb.id)
    if (!snapshot) continue
    if (snapshot.coverPhotoUrl && snapshot.coverPhotoUrl === storageUrl) {
      locations.push({ type: 'public-cover', notebookId: nb.id, notebookName: nb.name })
    }
    for (const page of (snapshot.pages ?? [])) {
      for (const el of (page.elements ?? [])) {
        if (isPhotoBearingType(el.type) && matchesPhotoReference(el.data, photoId, storageUrl)) {
          locations.push({ type: 'public-element', notebookId: nb.id, notebookName: nb.name, pageId: page.id })
        }
      }
    }
  }

  return locations
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
