import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { fsLoadPublicNotebook } from '../firebase/firestoreHelpers'
import { loadFont } from '../utils/fonts'

// Converts TipTap JSON to plain HTML string
function tiptapToHtml(doc) {
  if (!doc?.content) return ''
  return doc.content.map(renderNode).join('')
}
function renderNode(node) {
  const inner = node.content ? node.content.map(renderNode).join('') : ''
  switch (node.type) {
    case 'paragraph': return `<p>${inner || '<br/>'}</p>`
    case 'heading': return `<h${node.attrs?.level ?? 2}>${inner}</h${node.attrs?.level ?? 2}>`
    case 'bulletList': return `<ul>${inner}</ul>`
    case 'orderedList': return `<ol>${inner}</ol>`
    case 'listItem': return `<li>${inner}</li>`
    case 'blockquote': return `<blockquote>${inner}</blockquote>`
    case 'horizontalRule': return '<hr/>'
    case 'hardBreak': return '<br/>'
    case 'text': {
      let t = (node.text ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      if (!node.marks) return t
      for (const m of node.marks) {
        if (m.type === 'bold') t = `<strong>${t}</strong>`
        else if (m.type === 'italic') t = `<em>${t}</em>`
        else if (m.type === 'underline') t = `<u>${t}</u>`
        else if (m.type === 'strike') t = `<s>${t}</s>`
        else if (m.type === 'link') t = `<a href="${m.attrs?.href ?? '#'}" target="_blank" rel="noopener noreferrer">${t}</a>`
        else if (m.type === 'textStyle' && m.attrs?.color) t = `<span style="color:${m.attrs.color}">${t}</span>`
      }
      return t
    }
    default: return inner
  }
}

function fmtDate(s) {
  if (!s) return ''
  try { return new Date(s + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) }
  catch { return s }
}

function ImageBlock({ el }) {
  const d = el.data ?? {}
  if (!d.storageUrl && !d.thumbnailUrl) return null
  const src = d.storageUrl ?? d.thumbnailUrl
  const shapes = {
    circle: 'clip-path: circle(50%)',
    oval: 'clip-path: ellipse(50% 35% at 50% 50%)',
    ovalv: 'clip-path: ellipse(35% 50% at 50% 50%)',
  }
  const shapeStyle = shapes[d.clipShape] ? `;${shapes[d.clipShape]}` : ''
  const filters = {
    warm:      'saturate(1.3) sepia(0.18)',
    cool:      'saturate(0.85) hue-rotate(15deg)',
    grayscale: 'grayscale(1)',
    sepia:     'sepia(0.7)',
    fade:      'opacity(0.72) saturate(0.8)',
    dramatic:  'contrast(1.3) saturate(1.4)',
  }
  const filterStyle = filters[d.filter] ?? ''
  return (
    <div className="my-4" style={{ transform: d.rotation ? `rotate(${d.rotation}deg)` : undefined }}>
      <img
        src={src}
        alt={d.caption ?? ''}
        className="w-full rounded"
        style={{
          objectFit: d.fit ?? 'cover',
          filter: filterStyle || undefined,
          clipPath: shapes[d.clipShape] ? shapes[d.clipShape].replace('clip-path: ','') : undefined,
        }}
        loading="lazy"
      />
      {d.caption && (
        <p className="text-sm italic mt-1 text-center opacity-60"
          style={{ color: d.captionColor ?? '#888', fontFamily: d.captionFont ?? 'Georgia', textAlign: d.captionAlign ?? 'center' }}>
          {d.caption}
        </p>
      )}
    </div>
  )
}

function TextBlock({ el, theme }) {
  const d = el.data ?? {}
  const html = typeof d.content === 'object' ? tiptapToHtml(d.content) : (d.content ?? '')
  return (
    <div
      className="my-4 leading-relaxed"
      style={{ fontFamily: d.fontFamily || theme?.fontBody || 'system-ui', fontSize: d.fontSize ? `${d.fontSize * 0.75}px` : '14px', color: d.color || '#333' }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

function WeatherBlock({ el }) {
  const d = el.data?.weatherData
  if (!d) return null
  const wmo = {
    0:'☀️ Clear',1:'🌤️ Mostly clear',2:'⛅ Partly cloudy',3:'☁️ Overcast',
    45:'🌫️ Fog',48:'🌫️ Icy fog',
    51:'🌦️ Light drizzle',53:'🌦️ Drizzle',55:'🌦️ Heavy drizzle',
    61:'🌧️ Light rain',63:'🌧️ Rain',65:'🌧️ Heavy rain',
    71:'❄️ Light snow',73:'❄️ Snow',75:'❄️ Heavy snow',
    80:'🌦️ Showers',81:'🌦️ Showers',82:'⛈️ Heavy showers',
    95:'⛈️ Thunderstorm',96:'⛈️ Thunder + hail',99:'⛈️ Heavy thunder',
  }
  const icon = wmo[d.code] ?? '🌡️'
  const unit = el.data.units === 'imperial' ? '°F' : '°C'
  return (
    <div className="my-4 p-3 rounded-xl border border-stone-200 bg-stone-50 text-sm">
      <div className="text-lg">{icon.split(' ')[0]}</div>
      <div className="font-medium">{d.locationName}</div>
      <div className="text-xs text-stone-400">{fmtDate(d.date)}</div>
      <div className="mt-1">{d.maxTemp}{unit} / {d.minTemp}{unit}</div>
    </div>
  )
}

function PageSection({ page, theme, index }) {
  const imageEls = (page.elements ?? []).filter(e => e.type === 'image' && (e.data?.storageUrl || e.data?.thumbnailUrl))
  const textEls  = (page.elements ?? []).filter(e => e.type === 'text')
  const weatherEl = (page.elements ?? []).find(e => e.type === 'weather' && e.data?.weatherData)

  const sortedEls = [...(page.elements ?? [])].sort((a, b) => {
    const ay = a.grid?.y ?? 0; const by = b.grid?.y ?? 0
    return ay - by || (a.grid?.x ?? 0) - (b.grid?.x ?? 0)
  })

  return (
    <article className="mb-16">
      {/* Page header */}
      <div className="mb-6 pb-4 border-b" style={{ borderColor: `${theme?.accentColor ?? '#c0813a'}40` }}>
        <div className="text-xs font-semibold uppercase tracking-widest mb-1 opacity-50"
          style={{ color: theme?.accentColor ?? '#c0813a' }}>
          Page {index + 1}
        </div>
        {page.title && (
          <h2 className="text-2xl font-bold leading-tight"
            style={{ fontFamily: theme?.fontHeading ?? 'Georgia', color: theme?.accentColor ?? '#c0813a' }}>
            {page.title}
          </h2>
        )}
        {(page.location || page.date) && (
          <p className="text-sm mt-1 opacity-50">
            {[page.location, fmtDate(page.date)].filter(Boolean).join(' · ')}
          </p>
        )}
      </div>

      {/* Elements in grid order */}
      {sortedEls.map(el => {
        if (el.type === 'image') return <ImageBlock key={el.id} el={el} />
        if (el.type === 'text') return <TextBlock key={el.id} el={el} theme={theme} />
        if (el.type === 'weather') return <WeatherBlock key={el.id} el={el} />
        return null
      })}
    </article>
  )
}

export default function ShareView() {
  const { id } = useParams()
  const [journal, setJournal] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pinInput, setPinInput] = useState('')
  const [pinUnlocked, setPinUnlocked] = useState(false)
  const [pinError, setPinError] = useState(false)

  useEffect(() => {
    fsLoadPublicNotebook(id)
      .then(data => {
        if (!data) { setError('This journal is not publicly shared or the link is invalid.'); return }
        if (data.theme?.fontHeading) loadFont(data.theme.fontHeading)
        if (data.theme?.fontBody) loadFont(data.theme.fontBody)
        setJournal(data)
      })
      .catch(() => setError('Failed to load this journal. Please try again.'))
      .finally(() => setLoading(false))
  }, [id])

  // PIN gate
  if (!loading && journal?.sharePin && !pinUnlocked) {
    const accent = journal.theme?.accentColor ?? '#c0813a'
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 gap-6" style={{ backgroundColor: journal.theme?.backgroundColor ?? '#fdf8f3' }}>
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${accent}20` }}>
          <svg className="w-6 h-6" style={{ color: accent }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <div className="text-center">
          <h2 className="text-lg font-bold text-stone-800" style={{ fontFamily: journal.theme?.fontHeading ?? 'Georgia' }}>
            {journal.name}
          </h2>
          <p className="text-sm text-stone-500 mt-1">Enter the access PIN to view this journal.</p>
        </div>
        <div className="w-full max-w-xs space-y-3">
          <input
            autoFocus
            type="password"
            inputMode="numeric"
            value={pinInput}
            onChange={e => { setPinInput(e.target.value); setPinError(false) }}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                if (pinInput === journal.sharePin) { setPinUnlocked(true) }
                else { setPinError(true); setPinInput('') }
              }
            }}
            placeholder="Enter PIN…"
            className={`w-full border rounded-xl px-4 py-3 text-center text-lg tracking-widest focus:outline-none focus:ring-2 ${pinError ? 'border-red-300 focus:ring-red-200' : 'border-stone-200 focus:ring-amber-300'}`}
          />
          {pinError && <p className="text-xs text-red-500 text-center">Incorrect PIN. Try again.</p>}
          <button
            onClick={() => {
              if (pinInput === journal.sharePin) { setPinUnlocked(true) }
              else { setPinError(true); setPinInput('') }
            }}
            className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-colors"
            style={{ backgroundColor: accent }}
          >
            Unlock
          </button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <p className="text-stone-400 text-sm">Loading journal…</p>
      </div>
    )
  }

  if (error || !journal) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-stone-50 px-4">
        <p className="text-stone-500 text-center max-w-sm">{error ?? 'Journal not found.'}</p>
        <Link to="/" className="text-sm text-amber-700 hover:underline">← Back to Travel Journal</Link>
      </div>
    )
  }

  const accent = journal.theme?.accentColor ?? '#c0813a'

  return (
    <div className="min-h-screen" style={{ backgroundColor: journal.theme?.backgroundColor ?? '#fdf8f3' }}>
      {/* Journal header / cover */}
      <header className="relative overflow-hidden" style={{ minHeight: 280, backgroundColor: accent }}>
        {journal.coverPhotoUrl && (
          <img src={journal.coverPhotoUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40" />
        )}
        <div className="relative px-6 py-12 max-w-2xl mx-auto">
          <div className="w-12 h-0.5 mb-6" style={{ backgroundColor: 'rgba(255,255,255,0.6)' }} />
          <h1
            className="text-4xl font-bold text-white leading-tight"
            style={{ fontFamily: journal.theme?.fontHeading ?? 'Georgia', textShadow: '0 2px 12px rgba(0,0,0,0.3)' }}
          >
            {journal.name}
          </h1>
          {journal.description && (
            <p className="mt-3 text-white/70 text-lg leading-relaxed" style={{ fontFamily: journal.theme?.fontBody ?? 'system-ui' }}>
              {journal.description}
            </p>
          )}
          <p className="mt-6 text-white/50 text-xs tracking-widest uppercase">
            {journal.pages?.length ?? 0} page{journal.pages?.length !== 1 ? 's' : ''}
          </p>
        </div>
      </header>

      {/* Pages */}
      <main className="max-w-2xl mx-auto px-6 py-12">
        {/* Table of contents — only when 3+ titled pages */}
        {(() => {
          const titled = (journal.pages ?? []).filter(p => p.title)
          if (titled.length < 3) return null
          return (
            <nav className="mb-12 p-5 rounded-2xl border" style={{ borderColor: `${accent}30`, backgroundColor: `${accent}08` }}>
              <p className="text-xs font-bold uppercase tracking-widest mb-3 opacity-50" style={{ color: accent }}>Contents</p>
              <ol className="space-y-1.5">
                {(journal.pages ?? []).map((page, i) => page.title ? (
                  <li key={page.id}>
                    <a
                      href={`#page-${page.id}`}
                      className="flex items-baseline gap-2.5 text-sm hover:opacity-80 transition-opacity"
                      style={{ color: accent }}
                    >
                      <span className="text-xs opacity-40 font-mono w-5 text-right flex-shrink-0">{i + 1}</span>
                      <span className="font-medium">{page.title}</span>
                      {page.location && <span className="text-xs opacity-50 truncate">{page.location}</span>}
                    </a>
                  </li>
                ) : null)}
              </ol>
            </nav>
          )
        })()}

        {(journal.pages ?? []).map((page, i) => (
          <div key={page.id} id={`page-${page.id}`}>
            <PageSection page={page} theme={journal.theme} index={i} />
          </div>
        ))}
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-200 py-6 text-center text-xs text-stone-400">
        <p>Made with <span style={{ color: accent }}>Travel Journal</span></p>
      </footer>
    </div>
  )
}
