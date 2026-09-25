import {
  collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc,
  query, where, orderBy, writeBatch, serverTimestamp,
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
  const snap = await getDocs(query(userCol(uid, 'pages'), where('notebookId', '==', notebookId), orderBy('order')))
  return snap.docs.map(d => d.data())
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

// ── Photos ────────────────────────────────────────────────────────────────────

export async function fsLoadPhotos(uid, notebookId) {
  const snap = await getDocs(query(userCol(uid, 'photos'), where('notebookId', '==', notebookId), orderBy('uploadedAt', 'desc')))
  return snap.docs.map(d => d.data())
}

export async function fsSavePhoto(uid, photo) {
  await setDoc(userDoc(uid, 'photos', photo.id), photo)
}

export async function fsGetFirstPageCover(uid, notebookId) {
  const pages = await fsLoadPages(uid, notebookId)
  if (!pages.length) return null
  const elements = await fsLoadElements(uid, pages[0].id)
  const imgEl = elements.find(e => e.type === 'image' && e.data?.thumbnailUrl)
  return imgEl?.data?.thumbnailUrl ?? null
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
