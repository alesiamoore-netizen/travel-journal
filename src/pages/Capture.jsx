import { useParams, useNavigate } from 'react-router-dom'

export default function Capture() {
  const { id } = useParams()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col">
      <header className="bg-white border-b border-stone-200 px-4 py-3 flex items-center gap-3 shadow-sm">
        <button
          onClick={() => navigate(`/journal/${id}`)}
          className="text-stone-500 hover:text-stone-900 text-sm transition-colors"
        >
          ← Editor
        </button>
        <h1 className="text-base font-semibold text-stone-900">Quick Capture</h1>
      </header>

      <main className="flex-1 flex items-center justify-center">
        <div className="text-center text-stone-400">
          <div className="text-6xl mb-5 select-none">📷</div>
          <p className="text-lg font-semibold text-stone-600">Quick Capture</p>
          <p className="text-sm mt-2 text-stone-400">Coming in Phase 3</p>
          <p className="text-xs mt-4 text-stone-300 max-w-xs mx-auto">
            Upload photos, write notes, and drop location pins — all synced instantly.
          </p>
        </div>
      </main>
    </div>
  )
}
