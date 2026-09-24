import { createContext, useContext, useEffect, useState } from 'react'
import { onUserChanged, signInWithGoogle, signOut } from '../firebase/auth'
import { useNotebookStore } from '../store/notebookStore'
import { useEditorStore } from '../store/editorStore'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined) // undefined = still loading
  const setNotebookUid = useNotebookStore(s => s.setUid)
  const setEditorUid = useEditorStore(s => s.setUid)

  useEffect(() => {
    const unsub = onUserChanged(u => {
      setUser(u)
      setNotebookUid(u?.uid ?? null)
      setEditorUid(u?.uid ?? null)
    })
    return unsub
  }, [])

  return (
    <AuthContext.Provider value={{ user, signIn: signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
