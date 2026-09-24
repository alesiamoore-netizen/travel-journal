import { GoogleAuthProvider, signInWithPopup, signOut as fbSignOut, onAuthStateChanged } from 'firebase/auth'
import { firebaseAuth } from './config'

export function getCurrentUser() {
  return firebaseAuth?.currentUser ?? null
}

export function onUserChanged(callback) {
  if (!firebaseAuth) { callback(null); return () => {} }
  return onAuthStateChanged(firebaseAuth, callback)
}

export async function signInWithGoogle() {
  if (!firebaseAuth) return null
  const provider = new GoogleAuthProvider()
  const result = await signInWithPopup(firebaseAuth, provider)
  return result.user
}

export async function signOut() {
  if (!firebaseAuth) return
  await fbSignOut(firebaseAuth)
}
