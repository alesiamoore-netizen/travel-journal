import { useNavigate } from 'react-router-dom'
import { useEditorStore } from '../../store/editorStore'

export default function EditorTopBar({ onExportPdf, exporting, spreadView, onToggleSpread, onPreview }) {
  const navigate = useNavigate()
  const { notebook, printOverlay, togglePrintOverlay, undo, redo, _undoStack, _redoStack } = useEditorStore()
  const accent = notebook?.theme?.accentColor ?? '#c0813a'
  const canUndo = _undoStack?.length > 0
  const canRedo = _redoStack?.length > 0

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

      {/* Undo / Redo */}
      <div className="flex items-center gap-1">
        <button
          onClick={undo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
          className={`w-7 h-7 flex items-center justify-center rounded text-sm transition-colors ${canUndo ? 'text-stone-600 hover:bg-stone-100' : 'text-stone-300 cursor-not-allowed'}`}
        >
          ↩
        </button>
        <button
          onClick={redo}
          disabled={!canRedo}
          title="Redo (Ctrl+Shift+Z)"
          className={`w-7 h-7 flex items-center justify-center rounded text-sm transition-colors ${canRedo ? 'text-stone-600 hover:bg-stone-100' : 'text-stone-300 cursor-not-allowed'}`}
        >
          ↪
        </button>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <button
          onClick={onToggleSpread}
          className={`px-3 py-1 rounded text-xs font-medium border transition-colors ${
            spreadView
              ? 'bg-amber-700 text-white border-amber-700'
              : 'text-stone-600 border-stone-200 hover:bg-stone-50'
          }`}
          title="Toggle two-page spread view"
        >
          {spreadView ? '⧉ Spread' : '⧉ Spread'}
        </button>

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
          onClick={onPreview}
          className="px-3 py-1 rounded text-xs font-medium text-stone-600 border border-stone-200 hover:bg-stone-50 transition-colors"
          title="Preview page (no editor chrome)"
        >
          ◻ Preview
        </button>

        <button
          onClick={onExportPdf}
          disabled={exporting}
          className={`px-3 py-1 rounded text-xs font-medium border transition-colors ${
            exporting
              ? 'text-stone-300 border-stone-100 cursor-wait'
              : 'text-stone-600 border-stone-200 hover:bg-stone-50'
          }`}
        >
          {exporting ? 'Exporting…' : 'Export PDF'}
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
