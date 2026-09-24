export default function PageHeader({ notebook, page, pageNumber, canvasWidth }) {
  const accent = notebook?.theme?.accentColor ?? '#c0813a'
  const font = notebook?.theme?.fontHeading ?? 'Georgia, serif'

  const dateStr = page?.date
    ? new Date(page.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : ''

  return (
    <div style={{ width: canvasWidth }}>
      {/* Running header */}
      <div
        className="flex items-baseline justify-between px-5 pt-2.5 pb-2"
        style={{ borderBottom: `1.5px solid ${accent}` }}
      >
        <span
          className="text-[10px] uppercase tracking-[0.18em] text-stone-400 truncate max-w-[30%]"
          style={{ fontFamily: font }}
        >
          {notebook?.name ?? ''}
        </span>
        <span
          className="text-sm font-semibold text-stone-700 truncate max-w-[40%] text-center"
          style={{ fontFamily: font }}
        >
          {page?.title ?? ''}
        </span>
        <span className="text-[10px] tracking-wide text-stone-400 truncate max-w-[30%] text-right">
          {page?.location ? `${page.location}${dateStr ? ' · ' : ''}${dateStr}` : dateStr}
        </span>
      </div>
    </div>
  )
}

export function PageFooter({ notebook, pageNumber, canvasWidth }) {
  const accent = notebook?.theme?.accentColor ?? '#c0813a'
  const font = notebook?.theme?.fontHeading ?? 'Georgia, serif'

  return (
    <div style={{ width: canvasWidth }}>
      <div
        className="flex items-center justify-center px-5 py-1.5"
        style={{ borderTop: `1px solid ${accent}50` }}
      >
        <span
          className="text-[10px] tracking-widest text-stone-400"
          style={{ fontFamily: font }}
        >
          {pageNumber}
        </span>
      </div>
    </div>
  )
}
