import { useMemo } from 'react'
import { useEditorStore } from '../../store/editorStore'

function extractText(node) {
  if (!node) return ''
  if (node.type === 'text') return node.text ?? ''
  return (node.content ?? []).map(extractText).join(' ')
}

function fmtDate(s) {
  if (!s) return ''
  try { return new Date(s + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }
  catch { return s }
}

export default function StatsModal({ onClose }) {
  const { notebook, pages, elements } = useEditorStore()

  const stats = useMemo(() => {
    const dates = pages.map(p => p.date).filter(Boolean).sort()
    const dateRange = dates.length === 0 ? null
      : dates.length === 1 ? fmtDate(dates[0])
      : `${fmtDate(dates[0])} – ${fmtDate(dates[dates.length - 1])}`

    const cities = [...new Set(pages.map(p => p.location).filter(Boolean))]

    const photoCount = elements.filter(e => e.type === 'image' && e.data?.storageUrl).length

    const wordCount = elements
      .filter(e => e.type === 'text' && e.data?.content)
      .reduce((sum, e) => {
        const text = extractText(e.data.content)
        const words = text.trim().split(/\s+/).filter(Boolean).length
        return sum + words
      }, 0)

    return { dateRange, cities, photoCount, wordCount, pageCount: pages.length }
  }, [pages, elements])

  const accent = notebook?.theme?.accentColor ?? '#c0813a'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
        <h2 className="text-base font-bold text-stone-900 mb-5" style={{ fontFamily: 'Georgia, serif' }}>
          Journal stats
        </h2>

        <div className="space-y-4">
          <StatRow label="Pages" value={stats.pageCount} accent={accent} />
          <StatRow label="Photos" value={stats.photoCount} accent={accent} />
          <StatRow label="Words" value={stats.wordCount.toLocaleString()} accent={accent} />
          {stats.dateRange && <StatRow label="Dates" value={stats.dateRange} accent={accent} />}
          {stats.cities.length > 0 && (
            <div>
              <span className="text-xs text-stone-400 uppercase tracking-wide">Places</span>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {stats.cities.map(city => (
                  <span key={city} className="text-xs px-2 py-0.5 rounded-full bg-stone-100 text-stone-700">
                    {city}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full py-2 text-sm text-stone-500 hover:text-stone-700 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  )
}

function StatRow({ label, value, accent }) {
  return (
    <div className="flex items-baseline justify-between">
      <span className="text-xs text-stone-400 uppercase tracking-wide">{label}</span>
      <span className="text-lg font-semibold" style={{ color: accent }}>{value}</span>
    </div>
  )
}
