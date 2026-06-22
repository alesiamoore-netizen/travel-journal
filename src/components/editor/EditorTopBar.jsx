import { useNavigate } from 'react-router-dom'
import { useEditorStore } from '../../store/editorStore'

export default function EditorTopBar() {
  const navigate = useNavigate()
  const { notebook, printOverlay, togglePrintOverlay } = useEditorStore()
  const accent = notebook?.theme?.accentColor ?? '#c0813a'

  return (
    <header className="h-11 bg-white border-b border-stone-200 flex items-center gap-3 px-4 flex-shrink-0">
      <button
        onClick={() => navigate('/')}
        className="text-stone-500 hover:text-stone-900 text-sm transition-colors"
      >
        ← Journals
      </button>
      <div className="w-px h-4 bg-stone-200" />
      <h1 className="text-sm font-semibold text-stone-900 truncate max-w-xs">
        {notebook?.name ?? '…'}
      </h1>
      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: accent }} />

      <div className="ml-auto flex items-center gap-2">
        <button
          onClick={togglePrintOverlay}
          className={`px-3 py-1 rounded text-xs font-medium border transition-colors ${
            printOverlay
              ? 'bg-amber-700 text-white border-amber-700'
              : 'text-stone-600 border-stone-200 hover:bg-stone-50'
          }`}
        >
          {printOverlay ? '✕ Hide guides' : '⊞ Print guides'}
        </button>

        <button
          disabled
          className="px-3 py-1 rounded text-xs font-medium text-stone-300 border border-stone-100 cursor-not-allowed"
          title="Coming in Phase 6"
        >
          Export PDF
        </button>

        <button
          onClick={() => notebook && navigate(`/journal/${notebook.id}/capture`)}
          className="px-3 py-1 rounded text-xs font-medium text-stone-600 border border-stone-200 hover:bg-stone-50 transition-colors"
        >
          📷 Capture
        </button>
      </div>
    </header>
  )
}
