import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNotebookStore } from '../store/notebookStore'
import NotebookCard from '../components/notebook/NotebookCard'
import CreateNotebookModal from '../components/notebook/CreateNotebookModal'
import SyncPanel from '../components/SyncPanel'
import { useSyncStore } from '../store/syncStore'
import { useCollabStore } from '../store/collabStore'
import { firebaseEnabled, fetchJournalFromFirestore } from '../firebase/collab'
import { db } from '../db'

export default function Dashboard() {
  const { notebooks, loading, load } = useNotebookStore()
  const [showCreate, setShowCreate] = useState(false)
  const [showSync, setShowSync] = useState(false)
  const [joinId, setJoinId] = useState('')
  const [joinState, setJoinState] = useState('idle') // 'idle' | 'loading' | 'error' | 'done'
  const { lastSynced } = useSyncStore()
  const { enabled: collabEnabled, user: collabUser, signIn: collabSignIn, init: collabInit } = useCollabStore()
  const navigate = useNavigate()

  useEffect(() => { load() }, [])
  useEffect(() => {
    if (!collabEnabled) return
    const unsub = collabInit()
    return () => { if (typeof unsub === 'function') unsub() }
  }, [])

  const handleJoinJournal = async () => {
    const id = joinId.trim()
    if (!id) return
    setJoinState('loading')
    try {
      const data = await fetchJournalFromFirestore(id)
      if (!data) throw new Error('not found')
      // Create notebook locally
      const existing = await db.notebooks.get(id)
      if (!existing) {
        await db.notebooks.add({
          id,
          name: data.journal.name ?? 'Shared Journal',
          theme: data.journal.theme ?? {},
          pageSize: data.journal.pageSize ?? '8x10',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
      }
      // Create pages
      for (const rp of data.pages) {
        const exists = await db.pages.get(rp.id)
        if (!exists) await db.pages.add({ ...rp, notebookId: id, themeOverrides: {} })
        else await db.pages.update(rp.id, { title: rp.title, location: rp.location, date: rp.date, order: rp.order })
      }
      // Insert elements
      const pageIds = data.pages.map(p => p.id)
      if (pageIds.length) {
        await db.pageElements.where('pageId').anyOf(pageIds).delete()
        const els = data.elements.map(el => ({ ...el, notebookId: id }))
        if (els.length) await db.pageElements.bulkAdd(els)
      }
      setJoinState('done')
      setJoinId('')
      await load()
    } catch {
      setJoinState('error')
      setTimeout(() => setJoinState('idle'), 3000)
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f0ebe3' }}>
      <header className="px-8 py-6 flex items-center justify-between sticky top-0 z-10" style={{ backgroundColor: '#f0ebe3', borderBottom: '1px solid #ddd5c8' }}>
        <div>
          <h1 className="text-3xl font-bold text-stone-900 tracking-tight" style={{ fontFamily: 'Georgia, serif' }}>My Travel Journals</h1>
          <p className="text-sm text-stone-500 mt-1">
            {notebooks.length === 0 ? 'No journals yet' : `${notebooks.length} ${notebooks.length === 1 ? 'journal' : 'journals'}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {collabEnabled && (
            collabUser ? (
              <div className="flex items-center gap-1.5">
                <img src={collabUser.photoURL} alt="" className="w-6 h-6 rounded-full" referrerPolicy="no-referrer" />
                <span className="text-xs text-stone-500 hidden sm:block">{collabUser.displayName ?? collabUser.email}</span>
              </div>
            ) : (
              <button
                onClick={collabSignIn}
                className="text-stone-500 hover:text-stone-700 px-3 py-2 rounded-lg text-sm font-medium border border-stone-200 hover:bg-stone-50 transition-colors"
                title="Sign in to enable co-authoring"
              >
                Sign in
              </button>
            )
          )}
          <button
            onClick={() => setShowSync(true)}
            className="text-stone-500 hover:text-stone-700 px-3 py-2 rounded-lg text-sm font-medium border border-stone-200 hover:bg-stone-50 transition-colors flex items-center gap-1.5"
            title={lastSynced ? `Last synced ${new Date(lastSynced).toLocaleString()}` : 'Sync to Google Drive'}
          >
            ☁ {lastSynced ? 'Synced' : 'Sync'}
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="bg-amber-700 hover:bg-amber-800 active:bg-amber-900 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            + New Journal
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-8 py-10">
        {loading && (
          <div className="text-center py-20 text-stone-400">Loading…</div>
        )}

        {!loading && notebooks.length === 0 && (
          <div className="text-center py-32">
            <div className="text-6xl mb-6 select-none opacity-30">📖</div>
            <h2 className="text-2xl font-semibold text-stone-700 mb-3" style={{ fontFamily: 'Georgia, serif' }}>No journals yet</h2>
            <p className="text-stone-500 mb-8 max-w-sm mx-auto leading-relaxed">
              Create your first travel journal to start building a beautiful, book-style scrapbook.
            </p>
            <button
              onClick={() => setShowCreate(true)}
              className="bg-amber-700 hover:bg-amber-800 text-white px-8 py-3 rounded-lg font-medium transition-colors shadow-sm"
            >
              Create your first journal
            </button>
          </div>
        )}

        {!loading && notebooks.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
            {notebooks.map((notebook) => (
              <NotebookCard
                key={notebook.id}
                notebook={notebook}
                onOpen={() => navigate(`/journal/${notebook.id}`)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Join shared journal (Firebase collab) */}
      {collabEnabled && collabUser && (
        <div className="max-w-6xl mx-auto px-8 pb-10">
          <div className="border-t border-stone-200 pt-6 flex items-center gap-3">
            <span className="text-sm text-stone-500 flex-shrink-0">Join shared journal:</span>
            <input
              type="text"
              value={joinId}
              onChange={e => setJoinId(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleJoinJournal()}
              placeholder="Paste 8-character share code…"
              className="flex-1 max-w-xs border border-stone-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <button
              onClick={handleJoinJournal}
              disabled={joinState === 'loading' || !joinId.trim()}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                joinState === 'error' ? 'bg-red-600 text-white' :
                joinState === 'done' ? 'bg-green-600 text-white' :
                'bg-amber-700 text-white hover:bg-amber-800 disabled:opacity-40'
              }`}
            >
              {joinState === 'loading' ? 'Loading…' : joinState === 'error' ? 'Not found' : joinState === 'done' ? '✓ Joined!' : 'Join'}
            </button>
          </div>
        </div>
      )}

      {showCreate && (
        <CreateNotebookModal onClose={() => setShowCreate(false)} />
      )}

      {showSync && (
        <SyncPanel onClose={() => setShowSync(false)} />
      )}
    </div>
  )
}
