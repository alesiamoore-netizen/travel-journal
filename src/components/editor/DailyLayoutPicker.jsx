import { useState } from 'react'
import { useEditorStore } from '../../store/editorStore'
import { DAILY_LAYOUTS } from '../../data/layouts'
import { localDateStr } from '../../utils/calendarGrid'

// Base (portrait) daily layout ids shown in the picker — the store resolves the correct
// -wide variant automatically based on notebook.pageSize when the layout is actually applied.
const BASE_DAILY_LAYOUTS = DAILY_LAYOUTS.filter(l => !l.id.endsWith('-wide'))

function layoutForPageSize(baseId, pageSize) {
  const id = pageSize === '11x8.5' ? `${baseId}-wide` : baseId
  return DAILY_LAYOUTS.find(l => l.id === id)
}

// mode: 'create' (the "+ Today's Entry" flow — picks a date + layout, calls addDailyEntry)
// or 'convert' (the "Daily Style" flow — picks a new layout for the current daily-entry
// page, calls convertDailyLayout, surfacing the lossy-content confirmation when needed).
export default function DailyLayoutPicker({ mode, pageId, onClose }) {
  const { notebook, addDailyEntry, convertDailyLayout } = useEditorStore()
  const [date, setDate] = useState(localDateStr())
  const [error, setError] = useState('')
  const [pendingLossy, setPendingLossy] = useState(null) // { baseId, willDrop }
  const [busy, setBusy] = useState(false)

  const applyCreate = async (baseId) => {
    setBusy(true); setError('')
    const layoutDef = layoutForPageSize(baseId, notebook.pageSize)
    const result = await addDailyEntry(date, layoutDef)
    setBusy(false)
    if (!result.ok) { setError(result.error); return }
    onClose()
  }

  const applyConvert = async (baseId, force = false) => {
    setBusy(true); setError('')
    const layoutDef = layoutForPageSize(baseId, notebook.pageSize)
    const result = await convertDailyLayout(pageId, layoutDef, { force })
    setBusy(false)
    if (result.lossy && !force) { setPendingLossy({ baseId, willDrop: result.willDrop }); return }
    if (!result.ok) { setError(result.error ?? 'Could not apply that style'); return }
    onClose()
  }

  const handlePick = (baseId) => (mode === 'create' ? applyCreate(baseId) : applyConvert(baseId))

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="px-5 pt-5 pb-3 border-b border-stone-100 flex-shrink-0">
          <h2 className="text-base font-bold text-stone-900">{mode === 'create' ? "Today's Entry" : 'Daily Style'}</h2>
          <p className="text-xs text-stone-500 mt-0.5">
            {mode === 'create' ? 'Pick a date and a style for the entry' : 'Switch this entry to a different style — your content carries over'}
          </p>
        </div>

        {mode === 'create' && (
          <div className="px-5 pt-3">
            <label className="block text-xs font-medium text-stone-600 mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        )}

        {error && <p className="px-5 pt-2 text-xs text-red-600">{error}</p>}

        {pendingLossy ? (
          <div className="p-5 space-y-3">
            <p className="text-sm text-stone-700">
              Switching styles will drop: <span className="font-semibold">{pendingLossy.willDrop.join(', ')}</span>. Continue?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPendingLossy(null)}
                className="flex-1 border border-stone-300 text-stone-700 py-2 rounded-lg text-sm font-medium hover:bg-stone-50"
              >
                Cancel
              </button>
              <button
                onClick={() => { const b = pendingLossy.baseId; setPendingLossy(null); applyConvert(b, true) }}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg text-sm font-medium"
              >
                Continue
              </button>
            </div>
          </div>
        ) : (
          <div className="p-3 grid grid-cols-2 gap-2 overflow-y-auto">
            {BASE_DAILY_LAYOUTS.map(l => (
              <button
                key={l.id}
                disabled={busy}
                onClick={() => handlePick(l.id)}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-stone-200 hover:border-amber-400 hover:bg-amber-50 transition-colors disabled:opacity-50"
              >
                <span className="text-2xl">{l.icon}</span>
                <span className="text-xs font-medium text-stone-700 text-center">{l.name}</span>
              </button>
            ))}
          </div>
        )}

        <div className="p-3 border-t border-stone-100">
          <button onClick={onClose} className="w-full py-2 text-sm text-stone-500 hover:text-stone-700">Close</button>
        </div>
      </div>
    </div>
  )
}
