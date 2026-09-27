import { create } from 'zustand'
import { loadFont } from '../utils/fonts'
import {
  fsLoadNotebooks, fsLoadPages, fsLoadElements, fsSavePage, fsUpdatePage, fsDeletePage, fsDeletePages,
  fsSaveElement, fsUpdateElement, fsDeleteElement, fsReplacePageElements,
  fsUpdatePageOrders, fsUpdateNotebook, fsLoadNotebookElements, fsBatchUpdateElements,
  fsApplyMonthStyle, fsInsertMonthSpread, fsCreateDailyEntryIfAbsent,
} from '../firebase/firestoreHelpers'
import {
  pushElement, deleteElement as fsCollabDeleteEl,
  pushJournal, pushPage, deletePage as fsCollabDeletePage,
  pushAllElements, subscribeToElements, fetchJournalFromFirestore,
  setPresence, clearPresence,
} from '../firebase/collab'
import { useCollabStore } from './collabStore'
import { THEMES, resolveThemedElements, computeElementRestyle } from '../data/themes'
import { defaultData, defaultGrid, buildElementDocs, buildMonthSpreadDocs } from '../utils/journalBuilders'
import { monthTokensToOverrides, baseTokensFromTheme } from '../data/monthlyThemes'

// Real calendar validation (rejects rollovers like Feb 30, accepts Feb 29 only in real leap
// years) — not string prefix-matching against a year.
export function isValidCalendarDate(dateStr) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr)
  if (!m) return false
  const [, y, mo, d] = m.map(Number)
  const dt = new Date(y, mo - 1, d)
  return dt.getFullYear() === y && dt.getMonth() === mo - 1 && dt.getDate() === d
}

function snapshot(elements) {
  return elements.map(e => ({ ...e, data: { ...e.data } }))
}

function collabId() {
  const { active, journalId } = useCollabStore.getState()
  return active ? journalId : null
}

export const useEditorStore = create((set, get) => ({
  notebook: null,
  pages: [],
  currentPageId: null,
  elements: [],
  selectedId: null,
  printOverlay: false,
  _undoStack: [],
  _redoStack: [],
  _cloudChangesAvailable: false,
  _saving: 0,
  _lastSavedAt: null,
  uid: null,
  _presenceUser: null,

  _track: (promise) => {
    set(s => ({ _saving: s._saving + 1 }))
    return promise.finally(() => set(s => ({ _saving: Math.max(0, s._saving - 1), _lastSavedAt: Date.now() })))
  },

  setUid: (uid) => set({ uid }),

  setPresenceUser: (user) => set({ _presenceUser: user ? { uid: user.uid, displayName: user.displayName ?? '', photoURL: user.photoURL ?? '' } : null }),

  reset: () => {
    const { notebook, uid } = get()
    if (notebook?.id && uid) clearPresence(notebook.id, uid).catch(console.warn)
    set({
      notebook: null, pages: [], currentPageId: null,
      elements: [], selectedId: null, printOverlay: false,
      _undoStack: [], _redoStack: [], _cloudChangesAvailable: false,
    })
  },

  _saveUndo: () => {
    const { elements, _undoStack } = get()
    const snap = snapshot(elements)
    set({ _undoStack: [..._undoStack, snap].slice(-40), _redoStack: [] })
  },

  undo: async () => {
    const { uid, _undoStack, _redoStack, elements, currentPageId, notebook } = get()
    if (!_undoStack.length || !uid) return
    const prev = _undoStack[_undoStack.length - 1]
    await fsReplacePageElements(uid, currentPageId, notebook.id, prev)
    set({
      elements: prev,
      _undoStack: _undoStack.slice(0, -1),
      _redoStack: [..._redoStack, snapshot(elements)].slice(-40),
      selectedId: null,
    })
  },

  redo: async () => {
    const { uid, _undoStack, _redoStack, elements, currentPageId, notebook } = get()
    if (!_redoStack.length || !uid) return
    const next = _redoStack[_redoStack.length - 1]
    await fsReplacePageElements(uid, currentPageId, notebook.id, next)
    set({
      elements: next,
      _redoStack: _redoStack.slice(0, -1),
      _undoStack: [..._undoStack, snapshot(elements)].slice(-40),
      selectedId: null,
    })
  },

  setCoverPhoto: async (url) => {
    const { uid, notebook } = get()
    if (!uid || !notebook) return
    await fsUpdateNotebook(uid, notebook.id, { coverPhotoUrl: url })
    set(s => ({ notebook: s.notebook ? { ...s.notebook, coverPhotoUrl: url } : s.notebook }))
  },

  updateTheme: async (patch) => {
    const { uid, notebook } = get()
    if (!notebook || !uid) return
    const newTheme = { ...notebook.theme, ...patch }
    const updatedAt = new Date().toISOString()
    await fsUpdateNotebook(uid, notebook.id, { theme: newTheme, updatedAt })
    set(s => ({ notebook: { ...s.notebook, theme: newTheme, updatedAt } }))
    const cid = collabId()
    if (cid) pushJournal({ ...get().notebook }).catch(console.warn)
  },

  // ── Theme restyle (see plan: field-level applied-value provenance, batched writes) ────────

  // Read-only: computes exactly what a restyle-to-`targetThemeId` would do, without writing
  // anything. `supported: false` means the target theme has no `tokens` map yet — restyle isn't
  // offered for it at all, only the base color/font change is available.
  restyleDryRun: async (targetThemeId) => {
    const { uid, notebook } = get()
    if (!uid || !notebook) return null
    const targetTheme = THEMES.find(t => t.id === targetThemeId)
    if (!targetTheme?.tokens) {
      return { targetTheme, supported: false, plannedUpdates: [], elementCount: 0, pageCount: 0, restyledFieldCount: 0, preservedFieldCount: 0, unsupportedFieldCount: 0, bySourceTheme: {} }
    }
    const allElements = await fsLoadNotebookElements(uid, notebook.id)
    const themeManaged = allElements.filter(e => e.themeManaged)

    let restyledFieldCount = 0, preservedFieldCount = 0, unsupportedFieldCount = 0
    const bySourceTheme = {}
    const plannedUpdates = []
    const touchedPageIds = new Set()

    for (const el of themeManaged) {
      const result = computeElementRestyle(el, targetTheme)
      if (!result || result.unsupported) continue
      preservedFieldCount += result.preservedPaths.length
      unsupportedFieldCount += result.unsupportedPaths.length
      if (result.changed) {
        restyledFieldCount += result.restyledPaths.length
        plannedUpdates.push({ id: el.id, patch: { data: result.data, themeTokenProvenance: result.themeTokenProvenance, sourceThemeId: result.sourceThemeId } })
        touchedPageIds.add(el.pageId)
        const src = el.sourceThemeId ?? 'unknown'
        bySourceTheme[src] = (bySourceTheme[src] ?? 0) + 1
      }
    }

    return {
      targetTheme, supported: true, plannedUpdates,
      elementCount: plannedUpdates.length,
      pageCount: touchedPageIds.size,
      restyledFieldCount, preservedFieldCount, unsupportedFieldCount,
      bySourceTheme,
    }
  },

  // Commits a dry run's `plannedUpdates` via batched writes. Safe to call again on the same
  // dry-run result if a previous attempt partially failed — every write is the full target
  // state, not a delta, so re-applying an already-succeeded element is a no-op.
  commitRestyle: async (dryRunResult) => {
    const { uid, currentPageId } = get()
    if (!uid || !dryRunResult?.plannedUpdates?.length) return { ok: true, succeededIds: [], failedAt: null, error: null }
    const result = await fsBatchUpdateElements(uid, dryRunResult.plannedUpdates)
    const touchedCurrentPage = dryRunResult.plannedUpdates.some(u => get().elements.some(e => e.id === u.id))
    if (touchedCurrentPage) {
      const fresh = await fsLoadElements(uid, currentPageId)
      set({ elements: fresh })
    }
    return { ok: !result.error, ...result }
  },

  // Orchestrates the two theme-change choices offered in the UI. `restyle: true` also restyles
  // theme-managed elements — write order matters: element-restyle batches must fully succeed
  // *before* the notebook-level theme (background/fonts/texture) is updated, so a partial
  // element-restyle failure is never hidden behind an already-changed background.
  changeJournalTheme: async (targetTheme, { restyle = false, dryRun = null } = {}) => {
    if (restyle) {
      const plan = dryRun ?? await get().restyleDryRun(targetTheme.id)
      if (plan?.plannedUpdates?.length) {
        const result = await get().commitRestyle(plan)
        if (result.error) return { ok: false, stage: 'restyle', ...result }
      }
    }
    await get().updateTheme({
      themeId: targetTheme.id,
      accentColor: targetTheme.accentColor,
      accentColorSecondary: targetTheme.accentColorSecondary,
      backgroundColor: targetTheme.backgroundColor,
      backgroundTexture: targetTheme.backgroundTexture,
      fontHeading: targetTheme.fontHeading,
      fontBody: targetTheme.fontBody,
    })
    return { ok: true }
  },

  loadNotebook: async (uid, notebookId) => {
    const all = await fsLoadNotebooks(uid)
    const notebook = all.find(n => n.id === notebookId)
    if (!notebook) return null

    let pages = await fsLoadPages(uid, notebookId)
    if (pages.length === 0) {
      const page = { id: crypto.randomUUID(), notebookId, order: 0, title: '', location: '', date: '', themeOverrides: {} }
      await fsSavePage(uid, page)
      pages = [page]
    }
    const elements = await fsLoadElements(uid, pages[0].id)
    loadFont(notebook.theme?.fontHeading)
    loadFont(notebook.theme?.fontBody)
    set({ uid, notebook, pages, currentPageId: pages[0].id, elements, selectedId: null, _undoStack: [], _redoStack: [] })
    const pu = get()._presenceUser
    if (pu) setPresence(notebook.id, pu, pages[0].id).catch(console.warn)
    return notebook
  },

  switchPage: async (pageId) => {
    const { uid, notebook, _presenceUser } = get()
    if (!uid) return
    const elements = await fsLoadElements(uid, pageId)
    set({ currentPageId: pageId, elements, selectedId: null, _undoStack: [], _redoStack: [] })
    if (_presenceUser && notebook?.id) setPresence(notebook.id, _presenceUser, pageId).catch(console.warn)
  },

  addPage: async () => {
    const { uid, notebook, pages } = get()
    if (!uid) return
    const page = { id: crypto.randomUUID(), notebookId: notebook.id, order: pages.length, title: '', location: '', date: '', themeOverrides: {} }
    await fsSavePage(uid, page)
    set({ pages: [...pages, page], currentPageId: page.id, elements: [], selectedId: null, _undoStack: [], _redoStack: [] })
    const cid = collabId()
    if (cid) pushPage(cid, page).catch(console.warn)
    return page
  },

  insertPageAfter: async (afterPageId) => {
    const { uid, notebook, pages } = get()
    if (!uid) return
    const afterIdx = pages.findIndex(p => p.id === afterPageId)
    const insertIdx = afterIdx < 0 ? pages.length : afterIdx + 1
    const newPage = { id: crypto.randomUUID(), notebookId: notebook.id, order: insertIdx, title: '', location: '', date: '', themeOverrides: {} }
    await fsSavePage(uid, newPage)
    const inserted = [
      ...pages.slice(0, insertIdx),
      newPage,
      ...pages.slice(insertIdx),
    ].map((p, i) => ({ ...p, order: i }))
    await fsUpdatePageOrders(uid, inserted)
    set({ pages: inserted, currentPageId: newPage.id, elements: [], selectedId: null, _undoStack: [], _redoStack: [] })
    const cid = collabId()
    if (cid) pushPage(cid, newPage).catch(console.warn)
    return newPage
  },

  deletePage: async (pageId) => {
    const { uid, pages, currentPageId } = get()
    if (!uid || pages.length <= 1) return
    await fsDeletePage(uid, pageId)
    const remaining = pages.filter(p => p.id !== pageId).map((p, i) => ({ ...p, order: i }))
    await fsUpdatePageOrders(uid, remaining)
    set({ pages: remaining })
    if (currentPageId === pageId) {
      const elements = await fsLoadElements(uid, remaining[0].id)
      set({ currentPageId: remaining[0].id, elements, selectedId: null })
    }
    const cid = collabId()
    if (cid) fsCollabDeletePage(cid, pageId).catch(console.warn)
  },

  duplicatePage: async (pageId) => {
    const { uid, pages, notebook } = get()
    if (!uid) return
    const src = pages.find(p => p.id === pageId)
    if (!src) return
    const srcIdx = pages.findIndex(p => p.id === pageId)
    const srcElements = await fsLoadElements(uid, pageId)
    const newPage = {
      id: crypto.randomUUID(),
      notebookId: notebook.id,
      order: srcIdx + 1,
      title: src.title ? `${src.title} (copy)` : '',
      location: src.location ?? '',
      date: src.date ?? '',
      themeOverrides: { ...(src.themeOverrides ?? {}) },
    }
    await fsSavePage(uid, newPage)
    const newElements = srcElements.map(el => ({
      ...el,
      id: crypto.randomUUID(),
      pageId: newPage.id,
      data: { ...el.data },
    }))
    await Promise.all(newElements.map(el => fsSaveElement(uid, el)))
    const inserted = [
      ...pages.slice(0, srcIdx + 1),
      newPage,
      ...pages.slice(srcIdx + 1),
    ].map((p, i) => ({ ...p, order: i }))
    await fsUpdatePageOrders(uid, inserted)
    set({ pages: inserted, currentPageId: newPage.id, elements: newElements, selectedId: null, _undoStack: [], _redoStack: [] })
  },

  movePage: async (pageId, direction) => {
    const { uid, pages } = get()
    if (!uid) return
    const idx = pages.findIndex(p => p.id === pageId)
    const newIdx = idx + direction
    if (newIdx < 0 || newIdx >= pages.length) return
    const reordered = [...pages]
    ;[reordered[idx], reordered[newIdx]] = [reordered[newIdx], reordered[idx]]
    const withOrder = reordered.map((p, i) => ({ ...p, order: i }))
    await fsUpdatePageOrders(uid, withOrder)
    set({ pages: withOrder })
  },

  reorderPages: async (newOrder) => {
    const { uid } = get()
    if (!uid) return
    const withOrder = newOrder.map((p, i) => ({ ...p, order: i }))
    await fsUpdatePageOrders(uid, withOrder)
    set({ pages: withOrder })
  },

  addElement: async (type) => {
    const { uid, currentPageId, notebook } = get()
    if (!uid) return null
    get()._saveUndo()
    const data = defaultData(type)
    // New stickers/maps should pick up the journal's active theme colors instead of the
    // hardcoded defaults — only on creation, never overwriting a color the user later
    // chooses themselves.
    if (type === 'sticker' && notebook?.theme?.accentColor) {
      data.color = notebook.theme.accentColor
    }
    if (type === 'map' && notebook?.theme?.accentColor) {
      data.routeColor = notebook.theme.tokens?.mapRoute ?? notebook.theme.accentColor
      data.pinColor = notebook.theme.accentColorSecondary ?? notebook.theme.accentColor
    }
    const element = {
      id: crypto.randomUUID(),
      pageId: currentPageId,
      notebookId: notebook.id,
      type,
      grid: defaultGrid(type),
      data,
    }
    await get()._track(fsSaveElement(uid, element))
    set(s => ({ elements: [...s.elements, element], selectedId: element.id }))
    const cid = collabId()
    if (cid) pushElement(cid, element).catch(console.warn)
    return element
  },

  updateElement: async (id, patch) => {
    const { uid } = get()
    if (!uid) return
    await get()._track(fsUpdateElement(uid, id, patch))
    set(s => ({ elements: s.elements.map(e => e.id === id ? { ...e, ...patch } : e) }))
    const cid = collabId()
    if (cid) {
      const el = get().elements.find(e => e.id === id)
      if (el) pushElement(cid, el).catch(console.warn)
    }
  },

  updateElementGrid: (id, grid) => {
    const { uid } = get()
    if (uid) fsUpdateElement(uid, id, { grid }).catch(console.warn)
    set(s => ({ elements: s.elements.map(e => e.id === id ? { ...e, grid } : e) }))
  },

  deleteElement: async (id) => {
    const { uid } = get()
    if (!uid) return
    get()._saveUndo()
    await get()._track(fsDeleteElement(uid, id))
    const cid = collabId()
    if (cid) fsCollabDeleteEl(cid, id).catch(console.warn)
    set(s => ({
      elements: s.elements.filter(e => e.id !== id),
      selectedId: s.selectedId === id ? null : s.selectedId,
    }))
  },

  applyLayout: async (layoutDef) => {
    const { uid, currentPageId, notebook } = get()
    if (!uid) return
    get()._saveUndo()
    if (layoutDef.elements.length === 0) {
      await fsReplacePageElements(uid, currentPageId, notebook.id, [])
      set({ elements: [], selectedId: null })
      return
    }
    const newElements = buildElementDocs(currentPageId, notebook.id, layoutDef)
    await fsReplacePageElements(uid, currentPageId, notebook.id, newElements)
    set({ elements: newElements, selectedId: null })
    const cid = collabId()
    if (cid) pushAllElements(cid, newElements).catch(console.warn)
  },

  // Resolves a theme's cover/layout definition ($token refs -> literal colors, decoration-level
  // filtering, provenance stamping) then applies it exactly like any other layout.
  applyThemedLayout: async (layoutDef, theme, decorationLevel = 'standard') => {
    const resolved = resolveThemedElements(layoutDef.elements, theme, layoutDef.id, decorationLevel)
    return get().applyLayout({ elements: resolved })
  },

  // ── Monthly Spreads: styling (atomic) + manual insertion (bounded) ─────────────────────

  // Changes a spread's seasonal style: computes the FULL two-page change set (both pages'
  // themeOverrides + every affected element's restyle patch) before writing anything, then
  // commits it all in one Firestore batch — page colors and element colors can never diverge
  // from a partial failure. `monthTokensOrNull === null` resets to the notebook's own base
  // theme (never a bare unresolved null) via baseTokensFromTheme, which always produces a
  // complete 4-key token set since every theme has these fields.
  setMonthStyle: async (spreadId, monthTokensOrNull) => {
    const { uid, pages, notebook } = get()
    if (!uid || !notebook) return { ok: false, error: 'Not signed in' }
    // Same rigor as Editor.jsx's resolveSpreadPairing — exactly one 'left' and one 'right',
    // not merely two pages sharing the id (which would also pass a bare length===2 check on a
    // corrupt two-lefts/zero-rights spread).
    const spreadPages = pages.filter(p => p.spreadId === spreadId)
    const leftCount = spreadPages.filter(p => p.spreadSide === 'left').length
    const rightCount = spreadPages.filter(p => p.spreadSide === 'right').length
    if (!(spreadPages.length === 2 && leftCount === 1 && rightCount === 1)) {
      return { ok: false, error: 'Spread integrity error' }
    }

    const tokens = monthTokensOrNull ?? baseTokensFromTheme(notebook.theme)
    const overridePatch = monthTokensOrNull ? monthTokensToOverrides(tokens) : {}
    const syntheticTheme = { id: 'month-style', tokens }

    const elementUpdates = []
    for (const page of spreadPages) {
      const pageElements = await fsLoadElements(uid, page.id)
      for (const el of pageElements.filter(e => e.themeManaged)) {
        const result = computeElementRestyle(el, syntheticTheme)
        if (result?.changed) {
          elementUpdates.push({ id: el.id, patch: { data: result.data, themeTokenProvenance: result.themeTokenProvenance, sourceThemeId: result.sourceThemeId } })
        }
      }
    }

    try {
      await fsApplyMonthStyle(uid, {
        pageUpdates: spreadPages.map(p => ({ id: p.id, patch: { themeOverrides: overridePatch } })),
        elementUpdates,
      })
    } catch (error) {
      // A rejected batch leaves neither page nor element writes applied (atomic) — surface
      // gracefully instead of an unhandled rejection with a stuck "busy" UI state.
      return { ok: false, error: error?.message ?? 'Could not update the month style' }
    }

    set(s => ({
      pages: s.pages.map(p => p.spreadId === spreadId ? { ...p, themeOverrides: overridePatch } : p),
      elements: s.elements.map(e => {
        const upd = elementUpdates.find(u => u.id === e.id)
        return upd ? { ...e, ...upd.patch } : e
      }),
    }))
    const cid = collabId()
    if (cid) {
      get().pages.filter(p => p.spreadId === spreadId).forEach(p => pushPage(cid, p).catch(console.warn))
      elementUpdates.forEach(u => {
        const el = get().elements.find(e => e.id === u.id)
        if (el) pushElement(cid, el).catch(console.warn)
      })
    }
    return { ok: true }
  },

  // Manual month-spread insertion — trip journals only (never photo-a-day or monthly-spreads,
  // see decision 7). Uses the identical buildMonthSpreadDocs builder the dedicated preset uses.
  // Checks the total operation count BEFORE building the write — a large existing journal
  // falls back to appending the spread at the end (zero renumbering) instead of ever
  // discovering Firestore's 500-op batch limit mid-write.
  insertMonthSpread: async (monthIndex, year) => {
    const { uid, pages, notebook, currentPageId } = get()
    if (!uid || !notebook) return { ok: false, error: 'Not signed in' }
    // Matches the UI gating in LayoutPicker.jsx/MobileEditorBar.jsx exactly: a pre-existing
    // journal with no journalKind field at all is an ordinary trip journal, not a rejection —
    // only an explicit 'photo-a-day'/'monthly-spreads' should be blocked here.
    if ((notebook.journalKind ?? 'trip') !== 'trip') return { ok: false, error: 'Manual spread insertion is only available in trip journals' }

    const { pages: spreadPages, elements: spreadElements } = buildMonthSpreadDocs(
      notebook.id, monthIndex, year, { baseOrder: 0, pageSize: notebook.pageSize }
    )

    const afterIdx = pages.findIndex(p => p.id === currentPageId)
    const insertIdx = afterIdx < 0 ? pages.length : afterIdx + 1
    const pagesAfter = pages.slice(insertIdx)
    const opCount = 2 + spreadElements.length + pagesAfter.length

    let finalPages, orderUpdates, appendedAtEnd
    if (opCount <= 400) {
      const withSpread = [...pages.slice(0, insertIdx), spreadPages[0], spreadPages[1], ...pagesAfter]
        .map((p, i) => ({ ...p, order: i }))
      finalPages = withSpread
      spreadPages[0].order = withSpread.find(p => p.id === spreadPages[0].id).order
      spreadPages[1].order = withSpread.find(p => p.id === spreadPages[1].id).order
      orderUpdates = withSpread
        .filter(p => p.id !== spreadPages[0].id && p.id !== spreadPages[1].id)
        .map(p => ({ id: p.id, order: p.order }))
      appendedAtEnd = false
    } else {
      const maxOrder = Math.max(0, ...pages.map(p => p.order ?? 0))
      spreadPages[0].order = maxOrder + 1
      spreadPages[1].order = maxOrder + 2
      finalPages = [...pages, spreadPages[0], spreadPages[1]]
      orderUpdates = []
      appendedAtEnd = true
    }

    try {
      await fsInsertMonthSpread(uid, { pages: spreadPages, elements: spreadElements, orderUpdates })
    } catch (error) {
      // A rejected batch leaves no new pages/elements and no order changes applied (atomic).
      return { ok: false, error: error?.message ?? 'Could not insert the spread' }
    }
    set({ pages: finalPages.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)) })
    const cid = collabId()
    if (cid) {
      spreadPages.forEach(p => pushPage(cid, p).catch(console.warn))
      pushAllElements(cid, spreadElements).catch(console.warn)
    }
    return { ok: true, appendedAtEnd, spreadId: spreadPages[0].spreadId }
  },

  // ── Photo-a-Day: daily entries ──────────────────────────────────────────────────────────

  // Race-safe: fsCreateDailyEntryIfAbsent's Firestore transaction is what actually prevents
  // duplicates (see firestoreHelpers.js) — this action just builds the candidate page+elements
  // and reflects whatever the transaction says actually won (its own choice, or another
  // client's, if one raced it). Strict date validation, and One-Year mode's year restriction,
  // are checked before any write.
  addDailyEntry: async (dateStr, layoutDef) => {
    const { uid, notebook } = get()
    if (!uid || !notebook) return { ok: false, error: 'Not signed in' }
    if (!isValidCalendarDate(dateStr)) return { ok: false, error: 'Invalid date' }
    if (notebook.photoDayMode === 'year' && Number(dateStr.slice(0, 4)) !== notebook.journalYear) {
      return { ok: false, error: `Date must be within ${notebook.journalYear}` }
    }
    const pageId = `page-daily-${notebook.id}-${dateStr}`
    const order = Number(dateStr.replaceAll('-', ''))
    const pageDoc = { id: pageId, notebookId: notebook.id, date: dateStr, pageKind: 'daily-entry', order, title: '', location: '', themeOverrides: {} }
    const elementDocs = layoutDef ? buildElementDocs(pageId, notebook.id, layoutDef) : []

    let created, page
    try {
      ;({ created, page } = await fsCreateDailyEntryIfAbsent(uid, dateStr, pageDoc, elementDocs))
    } catch (error) {
      // A rejected transaction leaves no page/element documents (Firestore transactions are
      // all-or-nothing) — surface this as a graceful result instead of an unhandled rejection,
      // which would otherwise leave the calling UI's "busy" state stuck with no explanation.
      return { ok: false, error: error?.message ?? 'Could not create the entry' }
    }

    set(s => {
      const exists = s.pages.some(p => p.id === page.id)
      const nextPages = exists ? s.pages : [...s.pages, page].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      return { pages: nextPages }
    })
    await get().switchPage(page.id)

    if (created) {
      const cid = collabId()
      if (cid) {
        pushPage(cid, page).catch(console.warn)
        pushAllElements(cid, elementDocs).catch(console.warn)
      }
    }
    return { ok: true, created, page }
  },

  // Deletes a daily entry (and its elements), then returns to the journal's cover page — a
  // fixed, always-present target, never a "nearest date" computation. Guarded to only ever
  // act on pageKind:'daily-entry' pages, so it structurally cannot delete the cover. No order
  // renumbering happens here (daily-entry order is date-derived, never renumbered — §6).
  deleteDailyEntry: async (pageId) => {
    const { uid, pages, currentPageId } = get()
    if (!uid) return { ok: false }
    const page = pages.find(p => p.id === pageId)
    if (!page || page.pageKind !== 'daily-entry') return { ok: false, error: 'Not a daily entry' }
    await fsDeletePage(uid, pageId)
    const remaining = pages.filter(p => p.id !== pageId)
    set({ pages: remaining })
    if (currentPageId === pageId) {
      const coverPage = remaining.find(p => p.pageKind !== 'daily-entry') ?? remaining[0]
      if (coverPage) await get().switchPage(coverPage.id)
    }
    const cid = collabId()
    if (cid) fsCollabDeletePage(cid, pageId).catch(console.warn)
    return { ok: true }
  },

  // Deletes an entire Monthly Spreads month pair (both pages + all their elements) as one
  // atomic operation — never one side independently, which would strand the other page as an
  // unpaired spread. Navigates to the nearest remaining spread's left page, or the journal's
  // first remaining page if none are left. Order is otherwise untouched (Monthly Spreads pages
  // are never renumbered — deleting a pair simply removes two entries from the list).
  deleteMonthSpread: async (spreadId) => {
    const { uid, pages, currentPageId } = get()
    if (!uid) return { ok: false }
    // Same rigor as resolveSpreadPairing/setMonthStyle — exactly one 'left' and one 'right',
    // not merely "some pages share this id." Refuses (deletes nothing) on a malformed pair,
    // rather than deleting whatever happens to match and potentially leaving a stray page
    // behind, or deleting a single unpaired page under the "whole pair" label.
    const spreadPages = pages.filter(p => p.spreadId === spreadId)
    const leftCount = spreadPages.filter(p => p.spreadSide === 'left').length
    const rightCount = spreadPages.filter(p => p.spreadSide === 'right').length
    if (!(spreadPages.length === 2 && leftCount === 1 && rightCount === 1)) {
      return { ok: false, error: 'This spread is missing its partner page or has duplicate/corrupt metadata — nothing was deleted.' }
    }
    const pageIds = spreadPages.map(p => p.id)

    try {
      await fsDeletePages(uid, pageIds)
    } catch (error) {
      // fsDeletePages is one atomic batch — a rejection leaves both pages (and their
      // elements) fully intact, never one side deleted and the other not.
      return { ok: false, error: error?.message ?? 'Could not delete the month spread' }
    }
    const remaining = pages.filter(p => !pageIds.includes(p.id))
    set({ pages: remaining })

    if (pageIds.includes(currentPageId)) {
      const next = remaining.find(p => p.spreadSide === 'left') ?? remaining[0]
      if (next) await get().switchPage(next.id)
    }
    const cid = collabId()
    if (cid) pageIds.forEach(id => fsCollabDeletePage(cid, id).catch(console.warn))
    return { ok: true }
  },

  // Content-preserving conversion between the 4 daily-entry layout variants — never the
  // destructive applyLayout replace. Same-role elements carry over their FULL data + any
  // provenance fields, only grid/role coming from the new layout def. photo<->photos is the
  // one genuinely lossy direction (and any role with real content and no destination role in
  // the new layout follows the same rule): returns {lossy:true, willDrop} instead of writing
  // anything unless `force:true` is passed.
  convertDailyLayout: async (pageId, newLayoutDef, { force = false } = {}) => {
    const { uid, notebook, elements, currentPageId } = get()
    if (!uid || !notebook) return { ok: false, error: 'Not signed in' }
    const isCurrent = pageId === currentPageId
    const oldElements = isCurrent ? elements : await fsLoadElements(uid, pageId)
    const byRole = {}
    for (const el of oldElements) if (el.role) byRole[el.role] = el

    function extractPlainText(docNode) {
      if (!docNode?.content) return ''
      let out = ''
      const walk = (node) => {
        if (node.text) out += node.text
        if (node.content) node.content.forEach(walk)
      }
      docNode.content.forEach(walk)
      return out
    }
    const hasContent = (el) => {
      if (!el) return false
      if (el.type === 'text') return extractPlainText(el.data?.content).trim().length > 0
      return true
    }

    const newRoles = new Set(newLayoutDef.elements.map(el => el.role).filter(Boolean))
    const willDrop = []
    for (const [role, el] of Object.entries(byRole)) {
      if (role === 'photo' || role === 'photos') continue
      if (!newRoles.has(role) && hasContent(el)) willDrop.push(role)
    }

    const oldPhotoCount = byRole.photo?.data?.photoId ? 1 : (byRole.photos?.data?.photos ?? []).length
    const targetHasPhoto = newRoles.has('photo')
    const targetHasPhotos = newRoles.has('photos')
    let droppedPhotoCount = 0
    if (oldPhotoCount > 0) {
      if (targetHasPhoto && !targetHasPhotos) droppedPhotoCount = Math.max(0, oldPhotoCount - 1)
      else if (!targetHasPhoto && !targetHasPhotos) droppedPhotoCount = oldPhotoCount
    }
    if (droppedPhotoCount > 0) willDrop.push(`${droppedPhotoCount} photo${droppedPhotoCount > 1 ? 's' : ''}`)

    if (willDrop.length && !force) return { ok: false, lossy: true, willDrop }

    const newElements = newLayoutDef.elements.map(newEl => {
      const built = buildElementDocs(pageId, notebook.id, { elements: [newEl] })[0]
      const old = newEl.role ? byRole[newEl.role] : null
      if (old) {
        return {
          ...built,
          data: { ...old.data },
          ...(old.themeManaged ? {
            themeManaged: true, sourceThemeId: old.sourceThemeId,
            sourceTemplateId: old.sourceTemplateId, themeTokenProvenance: old.themeTokenProvenance,
          } : {}),
        }
      }
      if (newEl.role === 'photos' && byRole.photo?.data?.photoId) {
        return { ...built, data: { ...built.data, photos: [{ photoId: byRole.photo.data.photoId, thumbnailUrl: byRole.photo.data.thumbnailUrl, storageUrl: byRole.photo.data.storageUrl }] } }
      }
      if (newEl.role === 'photo' && byRole.photos?.data?.photos?.[0]) {
        const p = byRole.photos.data.photos[0]
        return { ...built, data: { ...built.data, photoId: p.photoId, thumbnailUrl: p.thumbnailUrl, storageUrl: p.storageUrl } }
      }
      return built
    })

    await fsReplacePageElements(uid, pageId, notebook.id, newElements)
    if (isCurrent) set({ elements: newElements })
    const cid = collabId()
    if (cid) pushAllElements(cid, newElements).catch(console.warn)
    return { ok: true, lossy: false }
  },

  updatePage: async (pageId, patch) => {
    const { uid } = get()
    if (!uid) return
    await get()._track(fsUpdatePage(uid, pageId, patch))
    set(s => ({ pages: s.pages.map(p => p.id === pageId ? { ...p, ...patch } : p) }))
    const cid = collabId()
    if (cid) {
      const page = get().pages.find(p => p.id === pageId)
      if (page) pushPage(cid, page).catch(console.warn)
    }
  },

  // ── Collab ────────────────────────────────────────────────────────────────

  enableCollab: async () => {
    const { notebook, pages, elements } = get()
    if (!notebook) return
    await pushJournal(notebook)
    await Promise.all(pages.map(p => pushPage(notebook.id, p)))
    await pushAllElements(notebook.id, elements)
    const unsub = subscribeToElements(notebook.id, () => {
      set({ _cloudChangesAvailable: true })
    })
    useCollabStore.getState().startSync(notebook.id, unsub)
    set({ _cloudChangesAvailable: false })
  },

  refreshFromCloud: async () => {
    const { uid, notebook } = get()
    if (!notebook || !uid) return
    const data = await fetchJournalFromFirestore(notebook.id)
    if (!data) return
    for (const rp of data.pages) {
      await fsSavePage(uid, { ...rp, notebookId: notebook.id, themeOverrides: rp.themeOverrides ?? {} })
    }
    const pageIds = data.pages.map(p => p.id)
    for (const pid of pageIds) {
      const remoteEls = data.elements.filter(e => e.pageId === pid)
      await fsReplacePageElements(uid, pid, notebook.id, remoteEls.map(el => ({ ...el, notebookId: notebook.id })))
    }
    const freshPages = await fsLoadPages(uid, notebook.id)
    const { currentPageId } = get()
    const targetId = currentPageId ?? freshPages[0]?.id
    const freshEls = targetId ? await fsLoadElements(uid, targetId) : []
    set({ pages: freshPages, currentPageId: targetId ?? null, elements: freshEls, _cloudChangesAvailable: false })
  },

  disableCollab: () => useCollabStore.getState().stopSync(),

  select: (id) => set({ selectedId: id }),
  deselect: () => set({ selectedId: null }),
  togglePrintOverlay: () => set(s => ({ printOverlay: !s.printOverlay })),
}))
