import { useState } from 'react'
import { useEditorStore } from '../../store/editorStore'
import { MONTHLY_STYLES } from '../../data/monthlyThemes'

const currentYear = new Date().getFullYear()

// Trip journals only (never photo-a-day or monthly-spreads — see decision 7). Uses the
// identical buildMonthSpreadDocs path the dedicated preset uses.
export default function InsertMonthSpreadModal({ onClose }) {
  const { insertMonthSpread } = useEditorStore()
  const [monthIndex, setMonthIndex] = useState(new Date().getMonth())
  const [year, setYear] = useState(currentYear)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const handleInsert = async () => {
    setBusy(true); setError('')
    const result = await insertMonthSpread(monthIndex, year)
    setBusy(false)
    if (!result.ok) { setError(result.error ?? 'Could not insert the spread'); return }
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-5 space-y-4" onClick={e => e.stopPropagation()}>
        <div>
          <h2 className="text-base font-bold text-stone-900">Insert Month Spread</h2>
          <p className="text-xs text-stone-500 mt-0.5">A coordinated two-page spread, inserted after the current page.</p>
        </div>

        {error && <p className="text-xs text-red-600">{error}</p>}

        <div className="flex gap-2">
          <div className="flex-1">
            <label className="block text-xs font-medium text-stone-600 mb-1">Month</label>
            <select
              value={monthIndex}
              onChange={e => setMonthIndex(Number(e.target.value))}
              className="w-full border border-stone-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              {MONTHLY_STYLES.map((s, i) => <option key={s.label} value={i}>{s.label}</option>)}
            </select>
          </div>
          <div className="w-24">
            <label className="block text-xs font-medium text-stone-600 mb-1">Year</label>
            <input
              type="number"
              value={year}
              onChange={e => setYear(Number(e.target.value) || currentYear)}
              className="w-full border border-stone-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <button
            onClick={onClose}
            className="flex-1 border border-stone-300 text-stone-700 py-2 rounded-lg text-sm font-medium hover:bg-stone-50"
          >
            Cancel
          </button>
          <button
            disabled={busy}
            onClick={handleInsert}
            className="flex-1 bg-amber-700 hover:bg-amber-800 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-medium"
          >
            {busy ? 'Inserting…' : 'Insert'}
          </button>
        </div>
      </div>
    </div>
  )
}
