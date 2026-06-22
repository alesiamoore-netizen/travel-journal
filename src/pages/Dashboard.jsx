import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNotebookStore } from '../store/notebookStore'
import NotebookCard from '../components/notebook/NotebookCard'
import CreateNotebookModal from '../components/notebook/CreateNotebookModal'

export default function Dashboard() {
  const { notebooks, loading, load } = useNotebookStore()
  const [showCreate, setShowCreate] = useState(false)
  const navigate = useNavigate()

  useEffect(() => { load() }, [])

  return (
    <div className="min-h-screen bg-stone-100">
      <header className="bg-white border-b border-stone-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight">My Travel Journals</h1>
          <p className="text-sm text-stone-500 mt-0.5">
            {notebooks.length} {notebooks.length === 1 ? 'journal' : 'journals'}
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-amber-700 hover:bg-amber-800 active:bg-amber-900 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
        >
          + New Journal
        </button>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {loading && (
          <div className="text-center py-20 text-stone-400">Loading…</div>
        )}

        {!loading && notebooks.length === 0 && (
          <div className="text-center py-24">
            <div className="text-7xl mb-5 select-none">✈️</div>
            <h2 className="text-xl font-semibold text-stone-700 mb-2">No journals yet</h2>
            <p className="text-stone-500 mb-8 max-w-xs mx-auto">
              Create your first travel journal to start building your scrapbook.
            </p>
            <button
              onClick={() => setShowCreate(true)}
              className="bg-amber-700 hover:bg-amber-800 text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-sm"
            >
              Create your first journal
            </button>
          </div>
        )}

        {!loading && notebooks.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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

      {showCreate && (
        <CreateNotebookModal onClose={() => setShowCreate(false)} />
      )}
    </div>
  )
}
