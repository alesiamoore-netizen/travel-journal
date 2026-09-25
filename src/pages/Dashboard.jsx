import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useNotebookStore } from '../store/notebookStore'
import { useAuth } from '../context/AuthContext'
import NotebookCard from '../components/notebook/NotebookCard'
import CreateNotebookModal from '../components/notebook/CreateNotebookModal'

export default function Dashboard() {
  const { notebooks, loading, load } = useNotebookStore()
  const { user, signIn, signOut } = useAuth()
  const [showCreate, setShowCreate] = useState(false)
  const [searchQ, setSearchQ] = useState('')
  const navigate = useNavigate()

  const filtered = searchQ.trim()
    ? notebooks.filter(n => n.name.toLowerCase().includes(searchQ.toLowerCase()) || (n.description ?? '').toLowerCase().includes(searchQ.toLowerCase()))
    : notebooks

  useEffect(() => {
    if (user) load()
  }, [user])

  // Still checking auth state
  if (user === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f0ebe3' }}>
        <div className="text-stone-400 text-sm">Loading…</div>
      </div>
    )
  }

  // Not signed in
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-8" style={{ backgroundColor: '#f0ebe3' }}>
        <div className="text-center">
          <div className="text-7xl mb-6 select-none">📖</div>
          <h1 className="text-4xl font-bold text-stone-900 mb-3" style={{ fontFamily: 'Georgia, serif' }}>Travel Journal</h1>
          <p className="text-stone-500 max-w-sm leading-relaxed">
            Your private digital travel journal. Sign in with Google to access your journals from any device.
          </p>
        </div>
        <button
          onClick={signIn}
          className="flex items-center gap-3 bg-white border border-stone-300 rounded-xl px-6 py-3 text-stone-700 font-medium shadow-sm hover:shadow-md transition-shadow"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Sign in with Google
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-24 sm:pb-0" style={{ backgroundColor: '#f0ebe3' }}>
      {/* Header */}
      <header className="px-4 sm:px-8 py-4 sm:py-6 flex items-center justify-between sticky top-0 z-10" style={{ backgroundColor: '#f0ebe3', borderBottom: '1px solid #ddd5c8' }}>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight" style={{ fontFamily: 'Georgia, serif' }}>My Journals</h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
            {loading ? 'Loading…' : notebooks.length === 0 ? 'No journals yet' : searchQ && filtered.length !== notebooks.length ? `${filtered.length} of ${notebooks.length} journals` : `${notebooks.length} ${notebooks.length === 1 ? 'journal' : 'journals'}`}
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Search — desktop */}
          {notebooks.length > 0 && (
            <div className="hidden sm:flex items-center gap-1.5 border border-stone-300 rounded-lg px-2.5 py-1.5 bg-white/70">
              <svg className="w-3.5 h-3.5 text-stone-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7 7 0 103.65 3.65a7 7 0 0013 13z" />
              </svg>
              <input
                type="text"
                value={searchQ}
                onChange={e => setSearchQ(e.target.value)}
                placeholder="Search journals…"
                className="w-36 text-sm bg-transparent focus:outline-none text-stone-700 placeholder-stone-400"
              />
            </div>
          )}
          <div className="flex items-center gap-2">
            {user.photoURL && (
              <img src={user.photoURL} alt="" className="w-8 h-8 rounded-full border border-stone-200" referrerPolicy="no-referrer" />
            )}
            <span className="text-sm text-stone-600 hidden sm:block">{user.displayName ?? user.email}</span>
          </div>
          <Link
            to="/memories"
            className="text-stone-400 hover:text-stone-600 text-xs px-2 py-1 rounded transition-colors hidden sm:block"
          >
            Memories
          </Link>
          <Link
            to="/timeline"
            className="text-stone-400 hover:text-stone-600 text-xs px-2 py-1 rounded transition-colors hidden sm:block"
          >
            Timeline
          </Link>
          <button
            onClick={signOut}
            className="text-stone-400 hover:text-stone-600 text-xs px-2 py-1 rounded transition-colors"
          >
            Sign out
          </button>
          {/* Desktop: inline button */}
          <button
            onClick={() => setShowCreate(true)}
            className="hidden sm:block bg-amber-700 hover:bg-amber-800 active:bg-amber-900 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            + New Journal
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-8 py-6 sm:py-10">
        {loading && (
          <div className="text-center py-20 text-stone-400">Loading your journals…</div>
        )}

        {!loading && notebooks.length === 0 && (
          <div className="text-center py-24">
            <div className="text-6xl mb-6 select-none opacity-30">📖</div>
            <h2 className="text-xl sm:text-2xl font-semibold text-stone-700 mb-3" style={{ fontFamily: 'Georgia, serif' }}>No journals yet</h2>
            <p className="text-stone-500 mb-8 max-w-sm mx-auto leading-relaxed text-sm sm:text-base">
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

        {/* Mobile search bar */}
        {!loading && notebooks.length > 0 && (
          <div className="flex sm:hidden items-center gap-1.5 border border-stone-300 rounded-xl px-3 py-2.5 bg-white mb-4">
            <svg className="w-4 h-4 text-stone-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7 7 0 103.65 3.65a7 7 0 0013 13z" />
            </svg>
            <input
              type="text"
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
              placeholder="Search journals…"
              className="flex-1 text-sm bg-transparent focus:outline-none text-stone-700 placeholder-stone-400"
            />
          </div>
        )}

        {!loading && notebooks.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-8">
            {filtered.length > 0 ? filtered.map((notebook) => (
              <NotebookCard
                key={notebook.id}
                notebook={notebook}
                onOpen={() => navigate(`/journal/${notebook.id}`)}
              />
            )) : (
              <div className="col-span-full py-16 text-center text-stone-400 text-sm">
                No journals match "{searchQ}"
              </div>
            )}
          </div>
        )}
      </main>

      {/* Mobile FAB */}
      <button
        onClick={() => setShowCreate(true)}
        className="sm:hidden fixed bottom-6 right-6 w-14 h-14 bg-amber-700 text-white rounded-full shadow-xl flex items-center justify-center text-2xl font-light active:bg-amber-800 transition-colors z-20"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        +
      </button>

      {showCreate && (
        <CreateNotebookModal onClose={() => setShowCreate(false)} />
      )}
    </div>
  )
}
