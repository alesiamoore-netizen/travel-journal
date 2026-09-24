import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useEditorStore } from '../store/editorStore'
import { getCanvasMetrics } from '../utils/pageSpecs'
import { exportNotebookPdf } from '../utils/exportPdf'
import { db } from '../db/index'
import EditorTopBar from '../components/editor/EditorTopBar'
import Sidebar from '../components/editor/Sidebar'
import Canvas from '../components/editor/Canvas'
import Inspector from '../components/editor/Inspector'
import ExportModal from '../components/editor/ExportModal'
import PreviewModal from '../components/editor/PreviewModal'
import PageHeader, { PageFooter } from '../components/editor/PageHeader'

const CANVAS_WIDTH = 680

export default function Editor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { loadNotebook, reset, notebook, pages, currentPageId, switchPage, printOverlay, togglePrintOverlay, undo, redo, selectedId, deleteElement } =
    useEditorStore()
  const [ready, setReady] = useState(false)
  const [exportState, setExportState] = useState(null)
  const [showPreview, setShowPreview] = useState(false)
  const [spreadView, setSpreadView] = useState(false)
  const [adjacentElements, setAdjacentElements] = useState([])
  const [pageVisible, setPageVisible] = useState(true)
  const canvasRef = useRef(null)

  useEffect(() => {
    loadNotebook(id).then(nb => {
      if (!nb) { navigate('/'); return }
      setReady(true)
    })
    return () => reset()
  }, [id])

  // Load adjacent page for spread view
  useEffect(() => {
    if (!spreadView || !ready) { setAdjacentElements([]); return }
    const idx = pages.findIndex(p => p.id === currentPageId)
    const adjIdx = idx > 0 ? idx - 1 : (pages.length > 1 ? 1 : -1)
    if (adjIdx < 0 || adjIdx >= pages.length || adjIdx === idx) { setAdjacentElements([]); return }
    db.pageElements.where('pageId').equals(pages[adjIdx].id).toArray().then(setAdjacentElements)
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

  const handleExportPdf = async () => {
    if (!notebook || !canvasRef.current) return

    const hadPrintOverlay = printOverlay
    if (hadPrintOverlay) togglePrintOverlay()

    setExportState({ current: 0, total: pages.length })
    try {
      await exportNotebookPdf({
        notebook,
        pages,
        getCanvasEl: () => canvasRef.current,
        switchPage,
        onProgress: (current, total) => setExportState({ current, total }),
      })
      setExportState('done')
      setTimeout(() => setExportState(null), 2000)
    } catch (err) {
      console.error('PDF export failed:', err)
      setExportState(null)
    }

    if (hadPrintOverlay) togglePrintOverlay()
  }

  if (!ready || !notebook) {
    return (
      <div className="h-screen bg-stone-200 flex items-center justify-center text-stone-400 text-sm">
        Loading…
      </div>
    )
  }

  const metrics = getCanvasMetrics(notebook.pageSize, CANVAS_WIDTH)
  const spreadCanvasWidth = Math.floor(CANVAS_WIDTH * 0.72)
  const currentPage = pages.find(p => p.id === currentPageId)
  const currentPageIdx = pages.findIndex(p => p.id === currentPageId)

  const spreadMetrics = getCanvasMetrics(notebook.pageSize, spreadCanvasWidth)

  const adjIdx = currentPageIdx > 0 ? currentPageIdx - 1 : (pages.length > 1 ? 1 : -1)
  const adjPage = adjIdx >= 0 ? pages[adjIdx] : null

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <EditorTopBar
        onExportPdf={handleExportPdf}
        exporting={exportState !== null}
        spreadView={spreadView}
        onToggleSpread={() => setSpreadView(v => !v)}
        onPreview={() => setShowPreview(true)}
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-auto flex items-start justify-center p-8" style={{ backgroundColor: '#d4cfc8' }}>
          <div style={{
            opacity: pageVisible ? 1 : 0,
            transform: pageVisible ? 'translateY(0) scale(1)' : 'translateY(5px) scale(0.995)',
            transition: pageVisible ? 'opacity 0.15s ease, transform 0.15s ease' : 'none',
          }}>
          {spreadView ? (
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
        <Inspector />
      </div>

      {showPreview && <PreviewModal onClose={() => setShowPreview(false)} />}

      {exportState !== null && (
        <ExportModal
          current={exportState === 'done' ? pages.length : exportState.current}
          total={pages.length}
          done={exportState === 'done'}
        />
      )}
    </div>
  )
}
