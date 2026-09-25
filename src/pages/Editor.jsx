import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useEditorStore } from '../store/editorStore'
import { useAuth } from '../context/AuthContext'
import { getCanvasMetrics } from '../utils/pageSpecs'
import { exportNotebookPdf } from '../utils/exportPdf'
import { exportNotebookHtml } from '../utils/exportHtml'
import { exportNotebookIcal } from '../utils/exportIcal'
import { fsLoadElements, fsPublishShare, fsUnpublishShare } from '../firebase/firestoreHelpers'
import { useMobile, useMobileCanvasWidth } from '../hooks/useMobile'
import EditorTopBar from '../components/editor/EditorTopBar'
import Sidebar from '../components/editor/Sidebar'
import Canvas from '../components/editor/Canvas'
import Inspector from '../components/editor/Inspector'
import MobileEditorBar from '../components/editor/MobileEditorBar'
import ExportModal from '../components/editor/ExportModal'
import PreviewModal from '../components/editor/PreviewModal'
import StatsModal from '../components/editor/StatsModal'
import AiDraftModal from '../components/editor/AiDraftModal'
import PageHeader, { PageFooter } from '../components/editor/PageHeader'

export default function Editor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const isMobile = useMobile()
  const canvasWidth = useMobileCanvasWidth()
  const { loadNotebook, reset, notebook, pages, elements, currentPageId, switchPage, printOverlay, togglePrintOverlay, undo, redo, selectedId, deleteElement } =
    useEditorStore()
  const [ready, setReady] = useState(false)
  const [exportState, setExportState] = useState(null)
  const [showPreview, setShowPreview] = useState(false)
  const [spreadView, setSpreadView] = useState(false)
  const [adjacentElements, setAdjacentElements] = useState([])
  const [pageVisible, setPageVisible] = useState(true)
  const [shareModal, setShareModal] = useState(false)
  const [sharePublishing, setSharePublishing] = useState(false)
  const [sharePin, setSharePin] = useState('')
  const [showStats, setShowStats] = useState(false)
  const [showAiModal, setShowAiModal] = useState(false)
  const [isOffline, setIsOffline] = useState(!navigator.onLine)
  const canvasRef = useRef(null)

  useEffect(() => {
    const goOnline = () => setIsOffline(false)
    const goOffline = () => setIsOffline(true)
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    return () => { window.removeEventListener('online', goOnline); window.removeEventListener('offline', goOffline) }
  }, [])

  useEffect(() => {
    if (!user) { navigate('/'); return }
    loadNotebook(user.uid, id).then(nb => {
      if (!nb) { navigate('/'); return }
      setReady(true)
    })
    return () => reset()
  }, [id, user])

  // Load adjacent page for spread view
  useEffect(() => {
    if (!spreadView || !ready) { setAdjacentElements([]); return }
    const idx = pages.findIndex(p => p.id === currentPageId)
    const adjIdx = idx > 0 ? idx - 1 : (pages.length > 1 ? 1 : -1)
    if (adjIdx < 0 || adjIdx >= pages.length || adjIdx === idx) { setAdjacentElements([]); return }
    if (user) fsLoadElements(user.uid, pages[adjIdx].id).then(setAdjacentElements)
  }, [spreadView, currentPageId, pages, ready])

  // Page flip animation — suppressed during PDF export
  useEffect(() => {
    if (!ready || exportState !== null) return
    setPageVisible(false)
    const t = setTimeout(() => setPageVisible(true), 90)
    return () => clearTimeout(t)
  }, [currentPageId])

  // Keyboard shortcuts: Ctrl+Z undo, Ctrl+Shift+Z / Ctrl+Y redo, Delete/Backspace delete selected element
  useEffect(() => {
    const handleKey = (e) => {
      const mod = e.ctrlKey || e.metaKey
      if (mod && !e.shiftKey && e.key === 'z') { e.preventDefault(); undo(); return }
      if (mod && e.shiftKey && e.key === 'z') { e.preventDefault(); redo(); return }
      if (mod && e.key === 'y') { e.preventDefault(); redo(); return }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        const tag = document.activeElement?.tagName
        if (tag !== 'INPUT' && tag !== 'TEXTAREA' && !document.activeElement?.isContentEditable) {
          e.preventDefault()
          deleteElement(selectedId)
        }
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [undo, redo, selectedId, deleteElement])

  const runExport = async (printReady = false) => {
    if (!notebook || !canvasRef.current) return
    const hadPrintOverlay = printOverlay
    if (hadPrintOverlay) togglePrintOverlay()
    setExportState({ current: 0, total: pages.length })
    try {
      await exportNotebookPdf({
        notebook, pages,
        getCanvasEl: () => canvasRef.current,
        switchPage,
        onProgress: (current, total) => setExportState({ current, total }),
        printReady,
      })
      setExportState('done')
      setTimeout(() => setExportState(null), 2000)
    } catch (err) {
      console.error('PDF export failed:', err)
      setExportState(null)
    }
    if (hadPrintOverlay) togglePrintOverlay()
  }

  const handleExportPdf = () => runExport(false)
  const handleExportPrintPdf = () => runExport(true)

  const handleExportHtml = async () => {
    if (!notebook) return
    await exportNotebookHtml({ notebook, pages, elements })
  }

  const handleExportIcal = () => {
    if (!notebook) return
    const ok = exportNotebookIcal({ notebook, pages })
    if (!ok) alert('No pages have dates set. Add dates to your journal pages first.')
  }

  const handleShare = () => setShareModal(true)

  const handlePublishShare = async () => {
    if (!user || !notebook) return
    setSharePublishing(true)
    try {
      await fsPublishShare(user.uid, notebook.id, sharePin.trim() || null)
      // reflect isPublic in local store notebook
      useEditorStore.setState(s => ({
        notebook: s.notebook ? { ...s.notebook, isPublic: true } : s.notebook,
      }))
    } catch (err) {
      console.error('Share publish failed:', err)
    } finally {
      setSharePublishing(false)
    }
  }

  const handleUnpublishShare = async () => {
    if (!user || !notebook) return
    setSharePublishing(true)
    try {
      await fsUnpublishShare(user.uid, notebook.id)
      useEditorStore.setState(s => ({
        notebook: s.notebook ? { ...s.notebook, isPublic: false } : s.notebook,
      }))
    } catch (err) {
      console.error('Unpublish failed:', err)
    } finally {
      setSharePublishing(false)
    }
  }

  if (!ready || !notebook) {
    return (
      <div className="h-screen bg-stone-200 flex items-center justify-center text-stone-400 text-sm">
        Loading…
      </div>
    )
  }

  const metrics = getCanvasMetrics(notebook.pageSize, canvasWidth)
  const spreadCanvasWidth = Math.floor(canvasWidth * 0.72)
  const currentPage = pages.find(p => p.id === currentPageId)
  const currentPageIdx = pages.findIndex(p => p.id === currentPageId)

  const spreadMetrics = getCanvasMetrics(notebook.pageSize, spreadCanvasWidth)

  const adjIdx = currentPageIdx > 0 ? currentPageIdx - 1 : (pages.length > 1 ? 1 : -1)
  const adjPage = adjIdx >= 0 ? pages[adjIdx] : null

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <EditorTopBar
        onExportPdf={handleExportPdf}
        onExportPrintPdf={handleExportPrintPdf}
        onShare={handleShare}
        onStats={() => setShowStats(true)}
        onExportHtml={handleExportHtml}
        onExportIcal={handleExportIcal}
        onAiDraft={() => setShowAiModal(true)}
        exporting={exportState !== null}
        spreadView={spreadView}
        onToggleSpread={() => setSpreadView(v => !v)}
        onPreview={() => setShowPreview(true)}
        isMobile={isMobile}
      />
      {isOffline && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs text-amber-800 flex items-center gap-2 flex-shrink-0">
          <span>⚡</span>
          <span>You're offline — changes are saved locally and will sync when you reconnect.</span>
        </div>
      )}
      <div className="flex flex-1 overflow-hidden">
        {!isMobile && <Sidebar />}
        <main
          className="flex-1 overflow-auto flex items-start justify-center"
          style={{
            backgroundColor: '#d4cfc8',
            padding: isMobile ? '12px 8px 0 8px' : '32px',
            paddingBottom: isMobile ? '80px' : '32px',
          }}
        >
          <div style={{
            opacity: pageVisible ? 1 : 0,
            transform: pageVisible ? 'translateY(0) scale(1)' : 'translateY(5px) scale(0.995)',
            transition: pageVisible ? 'opacity 0.15s ease, transform 0.15s ease' : 'none',
          }}>
          {!isMobile && spreadView ? (
            <div className="flex items-start gap-0" style={{ filter: 'drop-shadow(0 8px 32px rgba(0,0,0,0.22))' }}>
              {/* Left page (adjacent, read-only) */}
              <div className="flex flex-col flex-shrink-0">
                <PageHeader notebook={notebook} page={adjPage} pageNumber={adjIdx + 1} canvasWidth={spreadMetrics.displayWidth} />
                {adjacentElements !== undefined && pages.length > 1 ? (
                  <Canvas
                    elements={adjacentElements}
                    readOnly
                    canvasWidth={spreadMetrics.displayWidth}
                    displayHeight={spreadMetrics.displayHeight}
                    rowHeight={spreadMetrics.rowHeight}
                    bleedPx={spreadMetrics.bleedPx}
                    marginPx={spreadMetrics.marginPx}
                  />
                ) : (
                  <div
                    style={{
                      width: spreadMetrics.displayWidth,
                      height: spreadMetrics.displayHeight,
                      backgroundColor: notebook.theme?.backgroundColor ?? '#f5f0e8',
                    }}
                  />
                )}
                <PageFooter notebook={notebook} pageNumber={adjIdx + 1} canvasWidth={spreadMetrics.displayWidth} />
              </div>
              {/* Gutter / spine */}
              <div className="w-3 self-stretch flex-shrink-0" style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.12), rgba(0,0,0,0.04), rgba(0,0,0,0.14))' }} />
              {/* Right page (current, editable) */}
              <div className="flex flex-col flex-shrink-0">
                <PageHeader notebook={notebook} page={currentPage} pageNumber={currentPageIdx + 1} canvasWidth={spreadMetrics.displayWidth} />
                <Canvas
                  ref={canvasRef}
                  canvasWidth={spreadMetrics.displayWidth}
                  displayHeight={spreadMetrics.displayHeight}
                  rowHeight={spreadMetrics.rowHeight}
                  bleedPx={spreadMetrics.bleedPx}
                  marginPx={spreadMetrics.marginPx}
                />
                <PageFooter notebook={notebook} pageNumber={currentPageIdx + 1} canvasWidth={spreadMetrics.displayWidth} />
              </div>
            </div>
          ) : (
            <div className="flex flex-col flex-shrink-0" style={{ filter: 'drop-shadow(0 8px 32px rgba(0,0,0,0.22))' }}>
              <PageHeader notebook={notebook} page={currentPage} pageNumber={currentPageIdx + 1} canvasWidth={metrics.displayWidth} />
              <Canvas
                ref={canvasRef}
                canvasWidth={metrics.displayWidth}
                displayHeight={metrics.displayHeight}
                rowHeight={metrics.rowHeight}
                bleedPx={metrics.bleedPx}
                marginPx={metrics.marginPx}
              />
              <PageFooter notebook={notebook} pageNumber={currentPageIdx + 1} canvasWidth={metrics.displayWidth} />
            </div>
          )}
          </div>
        </main>
        {!isMobile && <Inspector />}
      </div>

      {isMobile && (
        <MobileEditorBar onExportPdf={handleExportPdf} onShare={handleShare} exporting={exportState !== null} />
      )}

      {showPreview && <PreviewModal onClose={() => setShowPreview(false)} />}
      {showStats && <StatsModal onClose={() => setShowStats(false)} />}
      {showAiModal && <AiDraftModal onClose={() => setShowAiModal(false)} />}

      {exportState !== null && (
        <ExportModal
          current={exportState === 'done' ? pages.length : exportState.current}
          total={pages.length}
          done={exportState === 'done'}
        />
      )}

      {shareModal && notebook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <h2 className="text-base font-bold text-stone-900">Share journal</h2>
            {/* Optional PIN field (shared between both states) */}
            <div>
              <label className="block text-xs text-stone-400 mb-1.5 font-medium uppercase tracking-wide">
                Access PIN <span className="normal-case font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={sharePin}
                onChange={e => setSharePin(e.target.value.replace(/\D/g, '').slice(0, 8))}
                placeholder="Leave blank for open access"
                className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
              <p className="text-xs text-stone-400 mt-1">Viewers must enter this PIN to see the journal.</p>
            </div>

            {notebook.isPublic ? (
              <>
                <p className="text-sm text-stone-500 leading-relaxed">
                  This journal is publicly shared. Anyone with the link can view it.
                </p>
                <div className="flex items-center gap-2 bg-stone-50 border border-stone-200 rounded-lg px-3 py-2">
                  <span className="flex-1 text-xs text-stone-600 truncate font-mono">
                    {window.location.origin}/share/{notebook.id}
                  </span>
                  <button
                    onClick={() => navigator.clipboard?.writeText(`${window.location.origin}/share/${notebook.id}`)}
                    className="text-xs text-amber-700 hover:text-amber-900 font-medium flex-shrink-0"
                  >
                    Copy
                  </button>
                </div>
                <p className="text-xs text-stone-400">
                  Re-publish after edits or PIN changes to update the public version.
                </p>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={handlePublishShare}
                    disabled={sharePublishing}
                    className="flex-1 py-2 text-sm font-medium bg-amber-700 text-white rounded-lg hover:bg-amber-800 disabled:opacity-50 transition-colors"
                  >
                    {sharePublishing ? 'Publishing…' : 'Re-publish'}
                  </button>
                  <button
                    onClick={handleUnpublishShare}
                    disabled={sharePublishing}
                    className="py-2 px-3 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors"
                  >
                    Unpublish
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-stone-500 leading-relaxed">
                  Publish a read-only copy of this journal anyone can view via a link.
                </p>
                <button
                  onClick={handlePublishShare}
                  disabled={sharePublishing}
                  className="w-full py-2.5 text-sm font-semibold bg-amber-700 text-white rounded-lg hover:bg-amber-800 disabled:opacity-50 transition-colors"
                >
                  {sharePublishing ? 'Publishing…' : 'Publish & get link'}
                </button>
              </>
            )}
            <button
              onClick={() => setShareModal(false)}
              className="w-full py-2 text-sm text-stone-500 hover:text-stone-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
