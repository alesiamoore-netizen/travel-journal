import { useState } from 'react'
import { useEditorStore } from '../../store/editorStore'
import { MONTHLY_STYLES } from '../../data/monthlyThemes'

// One control acting on a whole spreadId — both pages of the pair always move together.
// No page-specific divergence is offered here, by design (v1 doesn't support it).
export default function MonthStyleModal({ spreadId, onClose }) {
  const { notebook, setMonthStyle } = useEditorStore()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const apply = async (monthTokensOrNull) => {
    setBusy(true); setError('')
    const result = await setMonthStyle(spreadId, monthTokensOrNull)
    setBusy(false)
    if (!result.ok) { setError(result.error ?? 'Could not update the month style'); return }
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="px-5 pt-5 pb-3 border-b border-stone-100 flex-shrink-0">
          <h2 className="text-base font-bold text-stone-900">Month Style</h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Base theme: <span className="font-medium">{notebook?.theme?.themeId ?? 'Custom'}</span> — pick a seasonal style for this spread, or reset to the base theme.
          </p>
        </div>

        {error && <p className="px-5 pt-2 text-xs text-red-600">{error}</p>}

        <div className="p-3 grid grid-cols-3 gap-2 overflow-y-auto">
          {MONTHLY_STYLES.map((style, i) => (
            <button
              key={style.label}
              disabled={busy}
              onClick={() => apply(style.tokens)}
              className="flex flex-col items-center gap-1 p-2 rounded-xl border border-stone-200 hover:border-amber-400 transition-colors disabled:opacity-50"
            >
              <span className="w-6 h-6 rounded-full border border-stone-300" style={{ backgroundColor: style.tokens.accent }} />
              <span className="text-[10px] font-medium text-stone-700">{style.label}</span>
            </button>
          ))}
        </div>

        <div className="p-3 border-t border-stone-100 flex gap-2">
          <button
            disabled={busy}
            onClick={() => apply(null)}
            className="flex-1 border border-stone-300 text-stone-700 py-2 rounded-lg text-sm font-medium hover:bg-stone-50 disabled:opacity-50"
          >
            Reset to journal theme
          </button>
          <button onClick={onClose} className="flex-1 py-2 text-sm text-stone-500 hover:text-stone-700">Close</button>
        </div>
      </div>
    </div>
  )
}
