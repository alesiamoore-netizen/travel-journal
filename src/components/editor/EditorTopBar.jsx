import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useEditorStore } from '../../store/editorStore'

export default function EditorTopBar({ onExportPdf, onExportPrintPdf, onShare, onStats, onExportHtml, onExportIcal, onAiDraft, exporting, spreadView, onToggleSpread, onPreview, isMobile = false }) {
  const navigate = useNavigate()
  const { notebook, printOverlay, togglePrintOverlay, undo, redo, _undoStack, _redoStack, _saving, _lastSavedAt } = useEditorStore()
  const accent = notebook?.theme?.accentColor ?? '#c0813a'
  const canUndo = _undoStack?.length > 0
  const canRedo = _redoStack?.length > 0
  const [showSaved, setShowSaved] = useState(false)

  useEffect(() => {
    if (_saving === 0 && _lastSavedAt) {
      setShowSaved(true)
      const t = setTimeout(() => setShowSaved(false), 3000)
      return () => clearTimeout(t)
    }
  }, [_saving, _lastSavedAt])

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
        <span className="text-xs text-stone-400 w-16 text-right flex-shrink-0">
          {_saving > 0 ? 'Saving…' : showSaved ? 'Saved ✓' : ''}
        </span>

        {!isMobile && (
          <>
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
              title="Export PDF with header, footer, and page numbers"
            >
              {exporting ? 'Exporting…' : 'Export PDF'}
            </button>

            <button
              onClick={onExportPrintPdf}
              disabled={exporting}
              className={`px-3 py-1 rounded text-xs font-medium border transition-colors ${
                exporting
                  ? 'text-stone-300 border-stone-100 cursor-wait'
                  : 'text-stone-600 border-stone-200 hover:bg-stone-50'
              }`}
              title="Print-ready PDF: full bleed with crop marks, no header/footer"
            >
              {exporting ? '…' : 'Print PDF'}
            </button>

            <button
              onClick={onShare}
              className="px-3 py-1 rounded text-xs font-medium text-stone-600 border border-stone-200 hover:bg-stone-50 transition-colors"
              title="Publish a shareable public link"
            >
              Share
            </button>

            <button
              onClick={onStats}
              className="px-3 py-1 rounded text-xs font-medium text-stone-600 border border-stone-200 hover:bg-stone-50 transition-colors"
              title="Journal statistics"
            >
              Stats
            </button>

            <button
              onClick={onExportHtml}
              className="px-3 py-1 rounded text-xs font-medium text-stone-600 border border-stone-200 hover:bg-stone-50 transition-colors"
              title="Export as standalone HTML file"
            >
              HTML
            </button>

            <button
              onClick={onExportIcal}
              className="px-3 py-1 rounded text-xs font-medium text-stone-600 border border-stone-200 hover:bg-stone-50 transition-colors"
              title="Export trip dates as calendar (.ics)"
            >
              Cal
            </button>

            <button
              onClick={onAiDraft}
              className="px-3 py-1 rounded text-xs font-medium text-amber-700 border border-amber-200 hover:bg-amber-50 transition-colors"
              title="Draft journal entry with AI"
            >
              ✦ AI
            </button>

            <button
              onClick={() => notebook && navigate(`/journal/${notebook.id}/capture`)}
              className="px-3 py-1 rounded text-xs font-medium text-stone-600 border border-stone-200 hover:bg-stone-50 transition-colors"
            >
              📷 Capture
            </button>
          </>
        )}
      </div>
    </header>
  )
}
