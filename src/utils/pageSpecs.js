export const PAGE_SPECS = {
  '8x10':   { widthIn: 8,   heightIn: 10,  cols: 12, rows: 16 },
  '8.5x11': { widthIn: 8.5, heightIn: 11,  cols: 12, rows: 16 },
  '11x8.5': { widthIn: 11,  heightIn: 8.5, cols: 12, rows: 10 },
}

const BLEED_IN = 0.125
const SAFE_MARGIN_IN = 0.5

export function getCanvasMetrics(pageSize, displayWidth) {
  const spec = PAGE_SPECS[pageSize] ?? PAGE_SPECS['8x10']
  const aspectRatio = spec.heightIn / spec.widthIn
  const displayHeight = Math.round(displayWidth * aspectRatio)
  const rowHeight = Math.round(displayHeight / spec.rows)
  const bleedPx = (BLEED_IN / spec.widthIn) * displayWidth
  const marginPx = (SAFE_MARGIN_IN / spec.widthIn) * displayWidth
  return { spec, displayWidth, displayHeight, rowHeight, bleedPx, marginPx }
}
