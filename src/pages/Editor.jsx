import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useEditorStore } from '../store/editorStore'
import { getCanvasMetrics } from '../utils/pageSpecs'
import { exportNotebookPdf } from '../utils/exportPdf'
import EditorTopBar from '../components/editor/EditorTopBar'
import Sidebar from '../components/editor/Sidebar'
import Canvas from '../components/editor/Canvas'
import Inspector from '../components/editor/Inspector'
import ExportModal from '../components/editor/ExportModal'

const CANVAS_WIDTH = 720

export default function Editor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { loadNotebook, reset, notebook, pages, switchPage, printOverlay, togglePrintOverlay } =
    useEditorStore()
  const [ready, setReady] = useState(false)
  const [exportState, setExportState] = useState(null) // null | { current, total } | 'done'
  const canvasRef = useRef(null)

  useEffect(() => {
    loadNotebook(id).then(nb => {
      if (!nb) { navigate('/'); return }
      setReady(true)
    })
    return () => reset()
  }, [id])

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

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <EditorTopBar onExportPdf={handleExportPdf} exporting={exportState !== null} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-auto bg-stone-300 flex items-start justify-center p-10">
          <Canvas
            ref={canvasRef}
            canvasWidth={metrics.displayWidth}
            displayHeight={metrics.displayHeight}
            rowHeight={metrics.rowHeight}
            bleedPx={metrics.bleedPx}
            marginPx={metrics.marginPx}
          />
        </main>
        <Inspector />
      </div>

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
