import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged,
} from 'firebase/auth'
import {
  doc, collection, setDoc, deleteDoc, onSnapshot, serverTimestamp, writeBatch, getDoc, getDocs,
} from 'firebase/firestore'
import { firebaseAuth, firestoreDb, firebaseEnabled } from './config'

export { firebaseEnabled }

// ── Auth ──────────────────────────────────────────────────────────────────────

export async function signInWithGoogle() {
  if (!firebaseEnabled) return null
  const result = await signInWithPopup(firebaseAuth, new GoogleAuthProvider())
  return result.user
}

export async function signOut() {
  if (!firebaseEnabled) return
  await fbSignOut(firebaseAuth)
}

export function onAuthChange(cb) {
  if (!firebaseEnabled) { cb(null); return () => {} }
  return onAuthStateChanged(firebaseAuth, cb)
}

// ── Helpers ───────────────────────────────────────────────────────────────────

// Strip Blob/File/ArrayBuffer values — Firestore can't serialize them
function stripBlobs(obj) {
  if (!obj || typeof obj !== 'object') return obj
  const out = {}
  for (const [k, v] of Object.entries(obj)) {
    if (v instanceof Blob || v instanceof File || v instanceof ArrayBuffer) continue
    out[k] = v
  }
  return out
}

// ── Journal metadata ──────────────────────────────────────────────────────────

export async function pushJournal(notebook) {
  if (!firebaseEnabled || !firestoreDb) return
  await setDoc(doc(firestoreDb, 'journals', notebook.id), {
    name: notebook.name ?? '',
    theme: notebook.theme ?? {},
    pageSize: notebook.pageSize ?? '8x10',
    updatedAt: serverTimestamp(),
  }, { merge: true })
}

// ── Pages ─────────────────────────────────────────────────────────────────────

export async function pushPage(notebookId, page) {
  if (!firebaseEnabled || !firestoreDb) return
  await setDoc(
    doc(firestoreDb, 'journals', notebookId, 'pages', page.id),
    {
      id: page.id,
      title: page.title ?? '',
      location: page.location ?? '',
      date: page.date ?? '',
      order: page.order ?? 0,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )
}

export async function deletePage(notebookId, pageId) {
  if (!firebaseEnabled || !firestoreDb) return
  await deleteDoc(doc(firestoreDb, 'journals', notebookId, 'pages', pageId))
}

// ── Elements ──────────────────────────────────────────────────────────────────

export async function pushElement(notebookId, element) {
  if (!firebaseEnabled || !firestoreDb) return
  await setDoc(
    doc(firestoreDb, 'journals', notebookId, 'elements', element.id),
    {
      id: element.id,
      pageId: element.pageId,
      type: element.type,
      grid: element.grid,
      data: stripBlobs(element.data),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )
}

export async function deleteElement(notebookId, elementId) {
  if (!firebaseEnabled || !firestoreDb) return
  await deleteDoc(doc(firestoreDb, 'journals', notebookId, 'elements', elementId))
}

export async function pushAllElements(notebookId, elements) {
  if (!firebaseEnabled || !firestoreDb || !elements.length) return
  const batch = writeBatch(firestoreDb)
  for (const el of elements) {
    batch.set(
      doc(firestoreDb, 'journals', notebookId, 'elements', el.id),
      {
        id: el.id,
        pageId: el.pageId,
        type: el.type,
        grid: el.grid,
        data: stripBlobs(el.data),
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    )
  }
  await batch.commit()
}

// ── Subscriptions ─────────────────────────────────────────────────────────────

export function subscribeToElements(notebookId, onUpdate) {
  if (!firebaseEnabled || !firestoreDb) return () => {}
  return onSnapshot(
    collection(firestoreDb, 'journals', notebookId, 'elements'),
    snapshot => {
      const elements = []
      snapshot.forEach(d => elements.push(d.data()))
      onUpdate(elements)
    },
    err => console.warn('[collab] Firestore listen error:', err),
  )
}

// ── Presence (real-time cursor / page awareness) ──────────────────────────────

export async function setPresence(notebookId, user, pageId) {
  if (!firebaseEnabled || !firestoreDb || !user?.uid) return
  await setDoc(
    doc(firestoreDb, 'journals', notebookId, 'presence', user.uid),
    {
      uid: user.uid,
      displayName: user.displayName ?? '',
      photoURL: user.photoURL ?? '',
      currentPageId: pageId,
      updatedAt: serverTimestamp(),
    },
  )
}

export async function clearPresence(notebookId, uid) {
  if (!firebaseEnabled || !firestoreDb || !uid) return
  await deleteDoc(doc(firestoreDb, 'journals', notebookId, 'presence', uid))
}

export function subscribePresence(notebookId, onUpdate) {
  if (!firebaseEnabled || !firestoreDb) return () => {}
  return onSnapshot(
    collection(firestoreDb, 'journals', notebookId, 'presence'),
    snapshot => {
      const map = {}
      snapshot.forEach(d => { map[d.id] = d.data() })
      onUpdate(map)
    },
    err => console.warn('[presence] Firestore listen error:', err),
  )
}

// ── Join a shared journal (initial pull from Firestore) ───────────────────────

export async function fetchJournalFromFirestore(notebookId) {
  if (!firebaseEnabled || !firestoreDb) return null
  const jDoc = await getDoc(doc(firestoreDb, 'journals', notebookId))
  if (!jDoc.exists()) return null
  const journal = jDoc.data()
  const pageSnap = await getDocs(collection(firestoreDb, 'journals', notebookId, 'pages'))
  const elSnap = await getDocs(collection(firestoreDb, 'journals', notebookId, 'elements'))
  const pages = []
  pageSnap.forEach(d => pages.push(d.data()))
  const elements = []
  elSnap.forEach(d => elements.push(d.data()))
  return { journal, pages: pages.sort((a, b) => a.order - b.order), elements }
}
