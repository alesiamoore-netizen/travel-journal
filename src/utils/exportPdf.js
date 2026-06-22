import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { PAGE_SPECS } from './pageSpecs'

const EXPORT_SCALE = 4   // 72 dpi base × 4 = 288 dpi effective
const BLEED_IN = 0.125   // matches pageSpecs bleed

export async function exportNotebookPdf({ notebook, pages, getCanvasEl, switchPage, onProgress }) {
  const spec = PAGE_SPECS[notebook.pageSize] ?? PAGE_SPECS['8x10']
  const pageW = spec.widthIn + BLEED_IN * 2
  const pageH = spec.heightIn + BLEED_IN * 2
  const orientation = spec.widthIn > spec.heightIn ? 'l' : 'p'

  const pdf = new jsPDF({ orientation, unit: 'in', format: [pageW, pageH], compress: true })

  for (let i = 0; i < pages.length; i++) {
    onProgress?.(i + 1, pages.length)

    if (i > 0) {
      await switchPage(pages[i].id)
      // Two animation frames + buffer for React render and image decode
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 400))))
    }

    const el = getCanvasEl()
    if (!el) continue

    const snapshot = await html2canvas(el, {
      scale: EXPORT_SCALE,
      useCORS: true,
      logging: false,
      backgroundColor: notebook.theme?.backgroundColor ?? '#ffffff',
    })

    if (i > 0) pdf.addPage([pageW, pageH], orientation)
    pdf.addImage(snapshot.toDataURL('image/jpeg', 0.93), 'JPEG', 0, 0, pageW, pageH)
  }

  if (pages.length > 1) {
    await switchPage(pages[0].id)
  }

  const safe = (notebook.name ?? 'journal').replace(/[<>:"/\\|?*\r\n]/g, '-')
  pdf.save(`${safe}.pdf`)
}
