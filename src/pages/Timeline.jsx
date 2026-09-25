import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNotebookStore } from '../store/notebookStore'
import { useAuth } from '../context/AuthContext'
import { fsLoadPages } from '../firebase/firestoreHelpers'

function monthKey(d) {
  return d.slice(0, 7) // 'YYYY-MM'
}
function fmtMonth(ym) {
  const [y, m] = ym.split('-')
  return new Date(+y, +m - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}
function daysInMonth(ym) {
  const [y, m] = ym.split('-').map(Number)
  return new Date(y, m, 0).getDate()
}
function startDow(ym) {
  const [y, m] = ym.split('-').map(Number)
  return new Date(y, m - 1, 1).getDay()
}

export default function Timeline() {
  const { notebooks } = useNotebookStore()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [allPages, setAllPages] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || !notebooks.length) { setLoading(false); return }
    Promise.all(
      notebooks.map(nb =>
        fsLoadPages(user.uid, nb.id).then(pages =>
          pages.map(p => ({ ...p, notebookId: nb.id, notebookName: nb.name, notebookAccent: nb.theme?.accentColor ?? '#c0813a' }))
        )
      )
    ).then(results => {
      setAllPages(results.flat().filter(p => p.date))
    }).finally(() => setLoading(false))
  }, [user, notebooks])

  // Group by month, then by date
  const { months, byDate } = useMemo(() => {
    const byDate = {}
    for (const p of allPages) {
      if (!byDate[p.date]) byDate[p.date] = []
      byDate[p.date].push(p)
    }
    const monthSet = new Set(allPages.map(p => monthKey(p.date)))
    const months = [...monthSet].sort()
    return { months, byDate }
  }, [allPages])

  return (
    <div className="min-h-screen pb-16" style={{ backgroundColor: '#f0ebe3' }}>
      <header className="px-4 sm:px-8 py-4 sm:py-6 flex items-center gap-4 sticky top-0 z-10 border-b border-stone-200" style={{ backgroundColor: '#f0ebe3' }}>
        <button onClick={() => navigate('/')} className="text-stone-500 hover:text-stone-800 text-sm transition-colors">← Journals</button>
        <div className="w-px h-4 bg-stone-300" />
        <h1 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight" style={{ fontFamily: 'Georgia, serif' }}>Trip Timeline</h1>
        {allPages.length > 0 && <span className="text-sm text-stone-400 ml-1">{allPages.length} entries</span>}
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-8 py-8">
        {loading && <div className="text-center py-20 text-stone-400 text-sm">Loading…</div>}

        {!loading && months.length === 0 && (
          <div className="text-center py-24">
            <div className="text-6xl mb-6 opacity-30 select-none">🗓️</div>
            <h2 className="text-xl font-semibold text-stone-700 mb-2" style={{ fontFamily: 'Georgia, serif' }}>No dated pages yet</h2>
            <p className="text-stone-400 text-sm">Add dates to your journal pages and they'll show up here.</p>
          </div>
        )}

        <div className="space-y-8">
          {months.map(ym => {
            const totalDays = daysInMonth(ym)
            const startDay = startDow(ym)
            return (
              <div key={ym} className="bg-white rounded-2xl shadow-sm p-5">
                <h2 className="text-sm font-bold text-stone-500 uppercase tracking-widest mb-4">{fmtMonth(ym)}</h2>
                <div className="grid grid-cols-7 gap-1 text-center mb-1">
                  {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
                    <div key={d} className="text-[10px] text-stone-400 font-medium">{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: startDay }).map((_, i) => <div key={`e${i}`} />)}
                  {Array.from({ length: totalDays }).map((_, i) => {
                    const day = i + 1
                    const dateStr = `${ym}-${String(day).padStart(2, '0')}`
                    const entries = byDate[dateStr] ?? []
                    return (
                      <div
                        key={day}
                        className={`relative aspect-square rounded-lg flex flex-col items-center justify-center gap-0.5 text-xs font-medium transition-colors ${
                          entries.length > 0
                            ? 'cursor-pointer hover:scale-105 transition-transform'
                            : 'text-stone-400'
                        }`}
                        style={entries.length > 0 ? { backgroundColor: entries[0].notebookAccent + '22', color: entries[0].notebookAccent } : undefined}
                        title={entries.map(e => [e.notebookName, e.title, e.location].filter(Boolean).join(' · ')).join('\n')}
                      >
                        <span>{day}</span>
                        {entries.length > 0 && (
                          <div className="flex gap-0.5 flex-wrap justify-center">
                            {entries.slice(0, 3).map(e => (
                              <button
                                key={e.id}
                                onClick={() => navigate(`/journal/${e.notebookId}`)}
                                className="w-1.5 h-1.5 rounded-full"
                                style={{ backgroundColor: e.notebookAccent }}
                                title={[e.notebookName, e.title].filter(Boolean).join(' — ')}
                              />
                            ))}
                            {entries.length > 3 && <span className="text-[8px] leading-none">+{entries.length - 3}</span>}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </main>
    </div>
  )
}
