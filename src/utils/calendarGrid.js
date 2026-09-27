// Pure calendar-grid helpers, extracted from Timeline.jsx so Photo-a-Day and Monthly
// Spreads can reuse the same month-grid math instead of duplicating it.

export function monthKey(d) {
  return d.slice(0, 7) // 'YYYY-MM'
}

export function fmtMonth(ym) {
  const [y, m] = ym.split('-')
  return new Date(+y, +m - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

export function daysInMonth(ym) {
  const [y, m] = ym.split('-').map(Number)
  return new Date(y, m, 0).getDate()
}

export function startDow(ym) {
  const [y, m] = ym.split('-').map(Number)
  return new Date(y, m - 1, 1).getDay()
}

// Local calendar date as 'YYYY-MM-DD' — never toISOString(), which converts to UTC and
// can land on the wrong calendar day near midnight in timezones west of UTC.
export function localDateStr(d = new Date()) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// Groups pages by year, then by month — used by Photo-a-Day's Ongoing mode page list
// and progress view. Pages without a `date` are ignored.
export function groupPagesByYearMonth(pages) {
  const byYear = {}
  for (const p of pages) {
    if (!p.date) continue
    const year = p.date.slice(0, 4)
    const ym = monthKey(p.date)
    if (!byYear[year]) byYear[year] = {}
    if (!byYear[year][ym]) byYear[year][ym] = []
    byYear[year][ym].push(p)
  }
  return byYear
}
