import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useEditorStore } from '../store/editorStore'
import { getCanvasMetrics } from '../utils/pageSpecs'
import EditorTopBar from '../components/editor/EditorTopBar'
import Sidebar from '../components/editor/Sidebar'
import Canvas from '../components/editor/Canvas'
import Inspector from '../components/editor/Inspector'

const CANVAS_WIDTH = 720

export default function Editor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { loadNotebook, reset, notebook } = useEditorStore()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    loadNotebook(id).then(nb => {
      if (!nb) { navigate('/'); return }
      setReady(true)
    })
    return () => reset()
  }, [id])

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
      <EditorTopBar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-auto bg-stone-300 flex items-start justify-center p-10">
          <Canvas
            canvasWidth={metrics.displayWidth}
            displayHeight={metrics.displayHeight}
            rowHeight={metrics.rowHeight}
            bleedPx={metrics.bleedPx}
            marginPx={metrics.marginPx}
          />
        </main>
        <Inspector />
      </div>
    </div>
  )
}
