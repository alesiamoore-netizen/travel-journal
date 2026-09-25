export function exportNotebookIcal({ notebook, pages }) {
  const datedPages = pages.filter(p => p.date)
  if (!datedPages.length) return false

  const escape = s => (s ?? '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')

  const events = datedPages.map(p => {
    const dt = p.date.replace(/-/g, '')
    const summary = escape([p.title, p.location].filter(Boolean).join(' — ') || `${notebook.name} page`)
    return [
      'BEGIN:VEVENT',
      `UID:${p.id}@traveljournal`,
      `DTSTART;VALUE=DATE:${dt}`,
      `DTEND;VALUE=DATE:${dt}`,
      `SUMMARY:${summary}`,
      `DESCRIPTION:${escape(notebook.name ?? '')}`,
      'END:VEVENT',
    ].join('\r\n')
  })

  const cal = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Travel Journal//EN',
    'CALSCALE:GREGORIAN',
    `X-WR-CALNAME:${escape(notebook.name ?? 'Travel Journal')}`,
    ...events,
    'END:VCALENDAR',
  ].join('\r\n')

  const blob = new Blob([cal], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${(notebook.name ?? 'journal').replace(/[<>:"/\\|?*\r\n]/g, '-')}.ics`
  document.body.appendChild(a)
  a.click()
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url) }, 100)
  return true
}
