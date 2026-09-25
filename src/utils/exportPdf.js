import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { PAGE_SPECS } from './pageSpecs'

const EXPORT_SCALE = 4
const PRINT_DPI = 300
const BLEED_IN = 0.125
const HEADER_H = 0.40   // inches reserved for running header band
const FOOTER_H = 0.30   // inches reserved for running footer band

function hexToRgb(hex) {
  const c = (hex || '#888888').replace('#', '').padEnd(6, '0')
  return [parseInt(c.slice(0, 2), 16), parseInt(c.slice(2, 4), 16), parseInt(c.slice(4, 6), 16)]
}

function fmtDate(s) {
  if (!s) return ''
  try { return new Date(s + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }
  catch { return '' }
}

function drawCropMarks(pdf, pageW, pageH, bleedIn) {
  const M = 0.05   // gap between bleed edge and crop mark
  const L = 0.15   // length of each crop mark line
  pdf.setDrawColor(0, 0, 0)
  pdf.setLineWidth(0.004)
  // top-left
  pdf.line(bleedIn - M - L, bleedIn, bleedIn - M, bleedIn)
  pdf.line(bleedIn, bleedIn - M - L, bleedIn, bleedIn - M)
  // top-right
  pdf.line(pageW - bleedIn + M, bleedIn, pageW - bleedIn + M + L, bleedIn)
  pdf.line(pageW - bleedIn, bleedIn - M - L, pageW - bleedIn, bleedIn - M)
  // bottom-left
  pdf.line(bleedIn - M - L, pageH - bleedIn, bleedIn - M, pageH - bleedIn)
  pdf.line(bleedIn, pageH - bleedIn + M, bleedIn, pageH - bleedIn + M + L)
  // bottom-right
  pdf.line(pageW - bleedIn + M, pageH - bleedIn, pageW - bleedIn + M + L, pageH - bleedIn)
  pdf.line(pageW - bleedIn, pageH - bleedIn + M, pageW - bleedIn, pageH - bleedIn + M + L)
}

export async function exportNotebookPdf({ notebook, pages, getCanvasEl, switchPage, onProgress, printReady = false }) {
  const spec = PAGE_SPECS[notebook.pageSize] ?? PAGE_SPECS['8x10']
  const pageW = spec.widthIn + BLEED_IN * 2
  const pageH = spec.heightIn + BLEED_IN * 2
  const orientation = spec.widthIn > spec.heightIn ? 'l' : 'p'
  const accent = notebook?.theme?.accentColor ?? '#c0813a'
  const [ar, ag, ab] = hexToRgb(accent)

  const bodyY = HEADER_H
  const bodyH = pageH - HEADER_H - FOOTER_H

  // Faded accent for footer rule (blend with white at 35%)
  const fade = 0.35
  const fr = Math.round(ar * fade + 255 * (1 - fade))
  const fg = Math.round(ag * fade + 255 * (1 - fade))
  const fb = Math.round(ab * fade + 255 * (1 - fade))

  const pdf = new jsPDF({ orientation, unit: 'in', format: [pageW, pageH], compress: true })

  for (let i = 0; i < pages.length; i++) {
    onProgress?.(i + 1, pages.length)

    if (i > 0) {
      await switchPage(pages[i].id)
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 400))))
    }

    const el = getCanvasEl()
    if (!el) continue

    const targetPx = printReady ? spec.widthIn * PRINT_DPI : null
    const htmlCanvasScale = targetPx ? Math.max(2, targetPx / el.clientWidth) : EXPORT_SCALE

    const snapshot = await html2canvas(el, {
      scale: htmlCanvasScale,
      useCORS: true,
      logging: false,
      backgroundColor: notebook.theme?.backgroundColor ?? '#ffffff',
    })

    if (i > 0) pdf.addPage([pageW, pageH], orientation)

    if (printReady) {
      // Full-bleed: canvas fills entire page including bleed area
      pdf.addImage(snapshot.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, pageW, pageH)
      drawCropMarks(pdf, pageW, pageH, BLEED_IN)
    } else {
      // Canvas image fills the body zone (below header, above footer)
      pdf.addImage(snapshot.toDataURL('image/jpeg', 0.93), 'JPEG', 0, bodyY, pageW, bodyH)

      // ── Running header ────────────────────────────────────────────────
      const page = pages[i]
      const dateStr = fmtDate(page?.date)
      const locDate = [page?.location, dateStr].filter(Boolean).join(' · ')

      pdf.setFontSize(7)
      pdf.setTextColor(150, 150, 150)
      pdf.text(notebook.name ?? '', BLEED_IN + 0.06, BLEED_IN + 0.18)
      if (page?.title) {
        pdf.setFont(undefined, 'bold')
        pdf.text(page.title, pageW / 2, BLEED_IN + 0.18, { align: 'center' })
        pdf.setFont(undefined, 'normal')
      }
      if (locDate) pdf.text(locDate, pageW - BLEED_IN - 0.06, BLEED_IN + 0.18, { align: 'right' })

      pdf.setDrawColor(ar, ag, ab)
      pdf.setLineWidth(0.007)
      pdf.line(BLEED_IN, bodyY - 0.045, pageW - BLEED_IN, bodyY - 0.045)

      // ── Running footer ────────────────────────────────────────────────
      pdf.setDrawColor(fr, fg, fb)
      pdf.setLineWidth(0.004)
      pdf.line(BLEED_IN, pageH - FOOTER_H + 0.045, pageW - BLEED_IN, pageH - FOOTER_H + 0.045)

      pdf.setFontSize(7)
      pdf.setTextColor(150, 150, 150)
      pdf.text(String(i + 1), pageW / 2, pageH - BLEED_IN - 0.08, { align: 'center' })
    }
  }

  if (pages.length > 1) await switchPage(pages[0].id)

  const safe = (notebook.name ?? 'journal').replace(/[<>:"/\\|?*\r\n]/g, '-')
  pdf.save(printReady ? `${safe}-print-ready.pdf` : `${safe}.pdf`)
}
