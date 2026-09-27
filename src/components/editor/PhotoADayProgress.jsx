import { useState } from 'react'
import { useEditorStore } from '../../store/editorStore'
import { daysInMonth, startDow, fmtMonth, localDateStr, groupPagesByYearMonth } from '../../utils/calendarGrid'

function isLeapYear(y) {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0
}
function daysInYear(y) {
  return isLeapYear(y) ? 366 : 365
}

// Photo-a-Day's progress/calendar view — works against the already-loaded `pages` in
// editorStore (no new Firestore query, unlike Timeline.jsx which loads across every
// notebook). One-Year mode shows a whole-journal fraction; Ongoing mode shows a lifetime
// counter instead, since there's no fixed denominator to complete.
export default function PhotoADayProgress({ onClose }) {
  const { notebook, pages, switchPage, addDailyEntry } = useEditorStore()
  const dailyPages = pages.filter(p => p.pageKind === 'daily-entry')
  const isOngoing = notebook.photoDayMode === 'ongoing'

  const today = localDateStr()
  const [ym, setYm] = useState(isOngoing ? today.slice(0, 7) : `${notebook.journalYear}-${today.slice(5, 7)}`)
  const [year] = ym.split('-').map(Number)

  const byDate = {}
  for (const p of dailyPages) byDate[p.date] = p

  const totalDays = daysInMonth(ym)
  const startDay = startDow(ym)
  const filledThisMonth = Array.from({ length: totalDays }).filter((_, i) => {
    const d = `${ym}-${String(i + 1).padStart(2, '0')}`
    return !!byDate[d]
  }).length

  const yearsPresent = isOngoing ? [...new Set(dailyPages.map(p => p.date.slice(0, 4)))].sort() : [String(notebook.journalYear)]

  const shiftMonth = (delta) => {
    const [y, m] = ym.split('-').map(Number)
    const d = new Date(y, m - 1 + delta, 1)
    setYm(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }

  const goToDay = async (dateStr) => {
    const existing = byDate[dateStr]
    if (existing) { await switchPage(existing.id); onClose(); return }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="px-5 pt-5 pb-3 border-b border-stone-100 flex-shrink-0">
          <h2 className="text-base font-bold text-stone-900">Progress</h2>
          {isOngoing ? (
            <p className="text-xs text-stone-500 mt-0.5">
              {dailyPages.length} {dailyPages.length === 1 ? 'entry' : 'entries'} across {yearsPresent.length} {yearsPresent.length === 1 ? 'year' : 'years'}
            </p>
          ) : (
            <p className="text-xs text-stone-500 mt-0.5">
              {dailyPages.length} of {daysInYear(notebook.journalYear)} days this year
            </p>
          )}
        </div>

        <div className="px-5 pt-3 flex items-center justify-between flex-shrink-0">
          <button onClick={() => shiftMonth(-1)} className="w-7 h-7 flex items-center justify-center rounded-lg text-stone-400 hover:bg-stone-100">‹</button>
          <span className="text-sm font-semibold text-stone-800">{fmtMonth(ym)}</span>
          <button onClick={() => shiftMonth(1)} className="w-7 h-7 flex items-center justify-center rounded-lg text-stone-400 hover:bg-stone-100">›</button>
        </div>
        <p className="px-5 pt-1 text-xs text-stone-400">{filledThisMonth} of {totalDays} days</p>

        <div className="p-4">
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
              <div key={d} className="text-[10px] text-stone-400 font-medium">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: startDay }).map((_, i) => <div key={`e${i}`} />)}
            {Array.from({ length: totalDays }).map((_, i) => {
              const day = i + 1
              const dateStr = `${ym}-${String(day).padStart(2, '0')}`
              const filled = !!byDate[dateStr]
              const isToday = dateStr === today
              return (
                <button
                  key={day}
                  onClick={() => goToDay(dateStr)}
                  className={`aspect-square rounded-lg flex items-center justify-center text-xs font-medium transition-colors ${
                    filled ? 'bg-amber-600 text-white' : isToday ? 'ring-1 ring-amber-400 text-stone-500' : 'text-stone-400 bg-stone-50'
                  }`}
                >
                  {day}
                </button>
              )
            })}
          </div>
        </div>

        {isOngoing && yearsPresent.length > 1 && (
          <div className="px-5 pb-2 flex gap-1.5 flex-wrap flex-shrink-0">
            {yearsPresent.map(y => (
              <button key={y} onClick={() => setYm(`${y}-01`)}
                className="px-2.5 py-1 text-xs rounded-full bg-stone-100 text-stone-600 hover:bg-stone-200">
                {y}
              </button>
            ))}
          </div>
        )}

        <div className="p-3 border-t border-stone-100 flex-shrink-0">
          <button onClick={onClose} className="w-full py-2 text-sm text-stone-500 hover:text-stone-700">Close</button>
        </div>
      </div>
    </div>
  )
}
