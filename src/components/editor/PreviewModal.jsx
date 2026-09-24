import { useEffect, useState } from 'react'
import { useEditorStore } from '../../store/editorStore'
import Canvas from './Canvas'
import PageHeader, { PageFooter } from './PageHeader'
import { getCanvasMetrics } from '../../utils/pageSpecs'

export default function PreviewModal({ onClose }) {
  const { notebook, pages, currentPageId, elements } = useEditorStore()
  const [canvasWidth, setCanvasWidth] = useState(520)

  useEffect(() => {
    const compute = () => {
      const [pw, ph] = (notebook?.pageSize ?? '8x10').split('x').map(Number)
      const maxH = window.innerHeight * 0.84
      const maxW = window.innerWidth * 0.88
      const fromH = Math.floor(maxH * pw / ph)
      setCanvasWidth(Math.min(fromH, maxW))
    }
    compute()
    window.addEventListener('resize', compute)
    return () => window.removeEventListener('resize', compute)
  }, [notebook?.pageSize])

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const currentPage = pages.find(p => p.id === currentPageId)
  const currentPageIdx = pages.findIndex(p => p.id === currentPageId)
  const metrics = getCanvasMetrics(notebook?.pageSize, canvasWidth)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.78)' }}
      onClick={onClose}
    >
      <div
        className="flex flex-col flex-shrink-0"
        style={{ filter: 'drop-shadow(0 12px 40px rgba(0,0,0,0.5))' }}
        onClick={e => e.stopPropagation()}
      >
        <PageHeader
          notebook={notebook}
          page={currentPage}
          pageNumber={currentPageIdx + 1}
          canvasWidth={canvasWidth}
        />
        <Canvas
          elements={elements}
          readOnly
          canvasWidth={canvasWidth}
          displayHeight={metrics.displayHeight}
          rowHeight={metrics.rowHeight}
          bleedPx={metrics.bleedPx}
          marginPx={metrics.marginPx}
        />
        <PageFooter
          notebook={notebook}
          pageNumber={currentPageIdx + 1}
          canvasWidth={canvasWidth}
        />
      </div>

      <button
        onClick={onClose}
        className="absolute top-4 right-5 text-white/60 hover:text-white text-2xl w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
        title="Close preview (Esc)"
      >
        ×
      </button>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/40 text-xs">
        Page {currentPageIdx + 1} of {pages.length} · Press Esc to close
      </div>
    </div>
  )
}
