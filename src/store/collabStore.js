import { create } from 'zustand'
import { firebaseEnabled, onAuthChange, signInWithGoogle, signOut } from '../firebase/collab'

export const useCollabStore = create((set, get) => ({
  enabled: firebaseEnabled,
  user: null,
  ready: !firebaseEnabled,  // immediately ready when Firebase is not configured

  // Per-journal collab state
  journalId: null,
  active: false,            // live sync is running
  _unsubscribe: null,       // Firestore onSnapshot cleanup

  // Initialize auth listener — call once at app startup
  init() {
    if (!firebaseEnabled) return
    const unsub = onAuthChange(user => set({ user, ready: true }))
    return unsub
  },

  async signIn() {
    try { await signInWithGoogle() }
    catch (e) { console.error('[collab] sign-in error', e) }
  },

  async signOut() {
    const { _unsubscribe } = get()
    if (_unsubscribe) { _unsubscribe(); }
    await signOut()
    set({ user: null, active: false, _unsubscribe: null, journalId: null })
  },

  startSync(journalId, unsubscribe) {
    const { _unsubscribe } = get()
    if (_unsubscribe) _unsubscribe()
    set({ active: true, journalId, _unsubscribe: unsubscribe })
  },

  stopSync() {
    const { _unsubscribe } = get()
    if (_unsubscribe) _unsubscribe()
    set({ active: false, _unsubscribe: null, journalId: null })
  },
}))
