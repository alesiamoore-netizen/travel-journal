// Pure, I/O-free document builders shared between notebookStore.js (journal creation) and
// editorStore.js (in-editor layout application) — factored out so both the atomic
// Photo-a-Day/Monthly-Spreads creation paths and the ordinary applyLayout path build element
// documents identically, instead of maintaining two copies of the same merge logic.
import { resolveThemedElements } from '../data/themes'
import { MONTHLY_LAYOUTS, PHOTO_A_DAY_COVER_LAYOUT, doc } from '../data/layouts'
import { MONTHLY_STYLES, monthTokensToOverrides } from '../data/monthlyThemes'

export function defaultData(type) {
  if (type === 'text') return {
    content: { type: 'doc', content: [{ type: 'paragraph' }] },
    fontFamily: 'Georgia',
    fontSize: 15,
    color: '#2c2c2c',
    columns: 1,
    textStyle: 'body',
    backgroundColor: 'transparent',
    rotation: 0,
  }
  if (type === 'image') return {
    photoId: null,
    storageUrl: null,
    thumbnailUrl: null,
    fit: 'cover',
    caption: '',
    captionStyle: 'below',
    captionColor: '#888888',
    captionFont: 'Georgia',
    captionAlign: 'center',
    borderStyle: 'none',
    filter: 'none',
    rotation: 0,
    shadow: 'none',
    clipShape: 'none',
    overlayText: '',
    overlayPosition: 'bottom-left',
  }
  if (type === 'sticker') return {
    stickerId: 'compass',
    color: '#c0813a',
    opacity: 1,
    rotation: 0,
  }
  if (type === 'map') return {
    tileStyle: 'minimal',
    showRoute: true,
    showPins: true,
    pinColor: '#c0813a',
    routeColor: '#c0813a',
    routeWeight: 2,
    mode: 'route',
    pinLat: null,
    pinLng: null,
    pinLabel: '',
    pinZoom: 13,
  }
  if (type === 'keepsake') return {
    label: 'Ticket stub',
    hint: 'Tape or glue here',
    style: 'dashed',
    borderColor: 'accent',
  }
  if (type === 'weather') return {
    location: '',
    date: '',
    units: 'metric',
    weatherData: null,
  }
  if (type === 'divider') return {
    style: 'line',
    color: 'accent',
    rotation: 0,
  }
  if (type === 'collage') return {
    photos: [],
    columns: 2,
    gap: 4,
    borderRadius: 4,
  }
  if (type === 'drawing') return {
    strokes: [],
    backgroundColor: 'transparent',
    strokeColor: '#2c2c2c',
    strokeWidth: 2,
  }
  if (type === 'voiceMemo') return {
    storageUrl: null,
    duration: 0,
    label: '',
  }
  if (type === 'cover') return {
    storageUrl: null,
    thumbnailUrl: null,
    photoId: null,
    title: '',
    subtitle: '',
    overlayColor: '#00000055',
    titleColor: '#ffffff',
    subtitleColor: '#ffffffcc',
    titleAlign: 'center',
    titleFont: 'Georgia, serif',
  }
  return {}
}

export function defaultGrid(type) {
  if (type === 'text')     return { x: 1, y: 1,  w: 10, h: 5  }
  if (type === 'map')      return { x: 0, y: 0,  w: 12, h: 10 }
  if (type === 'divider')  return { x: 1, y: 7,  w: 10, h: 1  }
  if (type === 'sticker')  return { x: 4, y: 4,  w: 4,  h: 4  }
  if (type === 'keepsake') return { x: 1, y: 2,  w: 10, h: 8  }
  if (type === 'weather')  return { x: 1, y: 1,  w: 10, h: 4  }
  if (type === 'collage')  return { x: 0, y: 0,  w: 12, h: 10 }
  if (type === 'drawing')  return { x: 1, y: 2,  w: 10, h: 8  }
  if (type === 'cover')    return { x: 0, y: 0,  w: 12, h: 16 }
  if (type === 'voiceMemo') return { x: 1, y: 6,  w: 10, h: 4  }
  return                           { x: 2, y: 2,  w: 8,  h: 8  }
}

// Turns a layout definition's raw `elements` into full saved-element docs for `pageId` —
// the exact merge logic applyLayout has always used (default data + inferred text style +
// the layout's own data), plus passing through `role` (Daily layouts) when present.
export function buildElementDocs(pageId, notebookId, layoutDef) {
  return layoutDef.elements.map(el => {
    let inferredData = {}
    if (el.type === 'text' && !el.data?.textStyle) {
      const { y, w, h } = el.grid
      if (h <= 2 && w >= 8) {
        inferredData = y === 0
          ? { textStyle: 'dateline', fontSize: 11, color: '#c0813a' }
          : { textStyle: 'caption', fontSize: 10, color: '#888888' }
      } else if (h <= 3 && w >= 8 && y === 0) {
        inferredData = { textStyle: 'heading', fontSize: 32, color: '#1a1a1a' }
      }
    }
    return {
      id: crypto.randomUUID(),
      pageId,
      notebookId,
      type: el.type,
      grid: { ...el.grid },
      data: { ...defaultData(el.type), ...inferredData, ...(el.data ?? {}) },
      ...(el.role ? { role: el.role } : {}),
      ...(el.themeManaged ? {
        sourceThemeId: el.sourceThemeId,
        sourceTemplateId: el.sourceTemplateId,
        themeManaged: true,
        themeTokenProvenance: el.themeTokenProvenance,
      } : {}),
    }
  })
}

function pickMonthlyLayout(baseId, wide) {
  const id = wide ? `${baseId}-wide` : baseId
  const def = MONTHLY_LAYOUTS.find(l => l.id === id)
  if (!def) throw new Error(`Unknown monthly layout id: ${id}`)
  return def
}

// Pure builder for one month's two-page spread — no I/O. Resolves the monthly layout's
// $token refs against that month's seasonal token set (the same resolveThemedElements
// mechanism Backpacking uses, given a small synthetic {id, tokens} object instead of a full
// THEMES entry), generates a single spreadId shared by both pages, and produces fully
// finalized page + element docs ready to write. `pageSize === '11x8.5'` selects the -wide
// (landscape) layout variant automatically.
export function buildMonthSpreadDocs(notebookId, monthIndex, year, { baseOrder, pageSize }) {
  const wide = pageSize === '11x8.5'
  const leftDef = pickMonthlyLayout('month-spread-left', wide)
  const rightDef = pickMonthlyLayout('month-spread-right', wide)
  const style = MONTHLY_STYLES[monthIndex]
  const syntheticTheme = { id: 'month-style', tokens: style.tokens }
  const overridePatch = monthTokensToOverrides(style.tokens)
  const spreadId = crypto.randomUUID()
  const monthKeyStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}`

  const leftPageId = crypto.randomUUID()
  const rightPageId = crypto.randomUUID()

  const leftResolved = resolveThemedElements(leftDef.elements, syntheticTheme, leftDef.id, 'standard')
  const rightResolved = resolveThemedElements(rightDef.elements, syntheticTheme, rightDef.id, 'standard')
  const leftElements = buildElementDocs(leftPageId, notebookId, { elements: leftResolved })
    // The layout's heading placeholder text is the literal word "Month" — substitute the
    // real month name (matching page.title, which PageHeader already shows) so the on-canvas
    // heading isn't left saying something generic.
    .map(el => el.data?.textStyle === 'heading' ? { ...el, data: { ...el.data, content: doc(style.label) } } : el)
  const rightElements = buildElementDocs(rightPageId, notebookId, { elements: rightResolved })

  const leftPage = {
    id: leftPageId, notebookId, order: baseOrder, title: style.label, location: '', date: '',
    pageKind: 'spread', spreadId, monthKey: monthKeyStr, spreadSide: 'left', themeOverrides: overridePatch,
  }
  const rightPage = {
    id: rightPageId, notebookId, order: baseOrder + 1, title: style.label, location: '', date: '',
    pageKind: 'spread', spreadId, monthKey: monthKeyStr, spreadSide: 'right', themeOverrides: overridePatch,
  }

  return { pages: [leftPage, rightPage], elements: [...leftElements, ...rightElements] }
}

// Pure builder for a Photo-a-Day journal's one initial page — a styled cover, not a blank
// canvas, built and committed atomically with the notebook doc (see fsCreatePhotoADayJournal)
// rather than left to the generic lazy-blank-page fallback.
export function buildPhotoADayCoverDocs(notebookId) {
  const pageId = crypto.randomUUID()
  const page = { id: pageId, notebookId, order: 0, title: '', location: '', date: '', themeOverrides: {} }
  const elements = buildElementDocs(pageId, notebookId, PHOTO_A_DAY_COVER_LAYOUT)
  return { page, elements }
}
