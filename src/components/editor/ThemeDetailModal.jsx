import { useEffect, useState } from 'react'
import { useEditorStore } from '../../store/editorStore'
import { useAuth } from '../../context/AuthContext'
import { THEMES, THEME_CATEGORIES, resolveThemedElements } from '../../data/themes'
import { loadFont } from '../../utils/fonts'
import { fsLoadPhotos } from '../../firebase/firestoreHelpers'
import DividerElement from './elements/DividerElement'
import KeepeakeElement from './elements/KeepeakeElement'
import StickerElement from './elements/StickerElement'

const COLS = 12, ROWS = 16, SW = 60, SH = 80, GAP = 0.8
const DECORATION_LEVELS = ['minimal', 'standard', 'rich']
// Bundled, self-contained representative photo per theme (served locally, no runtime network
// request) — used as the preview fallback only when the journal being previewed has no
// uploaded photos of its own. See the adjacent .PROVENANCE.md for source/license/creator.
const THEME_FALLBACK_PHOTOS = {
  backpacking: '/theme-previews/backpacking-trail.jpg',
  'road-trip': '/theme-previews/road-trip-highway.jpg',
  'city-break': '/theme-previews/city-break-street.jpg',
  'beach-vacation': '/theme-previews/beach-vacation-shore.jpg',
  'winter-getaway': '/theme-previews/winter-getaway-valloire.jpg',
}
// Real element renderers (DividerElement, KeepeakeElement, StickerElement) are pure/read-only
// and safe to reuse directly for a genuine preview — they only fall back to the *live* notebook
// theme when data.color/borderColor is the literal string 'accent', which resolved themed
// elements never produce (resolveThemedElements always bakes in a real hex). TextElement mounts
// a live *editable* TipTap instance (wrong for a static preview) and ImageElement/CoverElement
// have real upload click-handlers wired to whatever journal happens to be open (risky to reuse
// inside a modal that may not even have a notebook yet) — both get purpose-built read-only
// stand-ins below instead.

function extractPlainText(node) {
  if (!node) return ''
  if (node.type === 'text') return node.text ?? ''
  return (node.content ?? []).map(extractPlainText).join('')
}

const CLIP_PATHS = {
  circle: 'circle(50% at 50% 50%)',
  diamond: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
  oval: 'ellipse(50% 38% at 50% 50%)',
  arch: 'ellipse(50% 55% at 50% 55%)',
  hexagon: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
}

// Real photo (from the journal, if any) or a bundled illustration fallback — never a flat block.
function MockPhoto({ data, photo, Illustration, accent }) {
  const clip = CLIP_PATHS[data.clipShape]
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ clipPath: clip, borderRadius: clip ? undefined : 2 }}>
      {photo ? (
        <img src={photo} alt="" className="w-full h-full object-cover" />
      ) : (
        <Illustration color={accent} />
      )}
    </div>
  )
}

// Read-only text — real extracted copy, real theme typography, no live editor instance.
function MockText({ data, scale }) {
  return (
    <div
      className="absolute inset-0 overflow-hidden px-1"
      style={{
        fontFamily: data.fontFamily,
        fontSize: Math.max((data.fontSize ?? 14) * scale, 6),
        color: data.color,
        textAlign: data.textStyle === 'dateline' || data.textStyle === 'caption' ? 'left' : undefined,
        lineHeight: 1.3,
        letterSpacing: data.textStyle === 'dateline' ? '0.06em' : undefined,
        textTransform: data.textStyle === 'dateline' ? 'uppercase' : undefined,
        fontWeight: data.textStyle === 'heading' ? 700 : 400,
      }}
    >
      {extractPlainText(data.content)}
    </div>
  )
}

// Stylized static map mockup (not live Leaflet — no real coordinates exist yet on an
// unapplied theme layout, and mounting several live tile-fetching maps in a modal isn't worth
// the weight). Themed route line + pins over a soft terrain tint.
function MockMap({ data, theme }) {
  const route = data.routeColor ?? theme.accentColor
  const pin = data.pinColor ?? theme.accentColorSecondary
  return (
    <div className="absolute inset-0 overflow-hidden rounded" style={{ backgroundColor: `${route}22` }}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
        <path d="M8 80 Q 30 40 50 55 T 92 20" fill="none" stroke={route} strokeWidth="2.5" strokeDasharray="4 3" strokeLinecap="round" opacity="0.85" />
        <circle cx="8" cy="80" r="3.5" fill={pin} stroke="white" strokeWidth="1" />
        <circle cx="92" cy="20" r="3.5" fill={pin} stroke="white" strokeWidth="1" />
      </svg>
    </div>
  )
}

// One full, genuinely populated page mockup — real photos/illustration, real readable text,
// real divider/sticker/keepsake rendering, a styled map. Percentage-positioned like the real
// Canvas, at a fixed pixel width so font sizing scales predictably.
function PageMockup({ item, theme, photos, level, seed = 0 }) {
  const FRAME_W = 300
  const REFERENCE_W = 680 // matches the app's default (non-mobile) canvas width
  const scale = FRAME_W / REFERENCE_W
  const Illustration = FALLBACK_ILLUSTRATIONS[seed % FALLBACK_ILLUSTRATIONS.length]
  const photo = photos?.[seed % Math.max(photos?.length ?? 0, 1)]
  const resolved = resolveThemedElements(item.elements, theme, item.id, level)

  return (
    <div className="flex-shrink-0" style={{ width: FRAME_W }}>
      <div
        className="relative w-full rounded-md overflow-hidden border border-stone-200 shadow-sm"
        style={{ aspectRatio: '10 / 16', backgroundColor: theme.backgroundColor }}
      >
        {resolved.map((el, i) => {
          const style = {
            left: `${(el.grid.x / COLS) * 100}%`,
            top: `${(el.grid.y / ROWS) * 100}%`,
            width: `${(el.grid.w / COLS) * 100}%`,
            height: `${(el.grid.h / ROWS) * 100}%`,
          }
          let content = null
          if (el.type === 'image' || el.type === 'cover') content = <MockPhoto data={el.data} photo={photo} Illustration={Illustration} accent={theme.accentColor} />
          else if (el.type === 'text') content = <MockText data={el.data} scale={scale} />
          else if (el.type === 'map') content = <MockMap data={el.data} theme={theme} />
          else if (el.type === 'divider') content = <DividerElement element={el} />
          else if (el.type === 'keepsake') content = <KeepeakeElement element={el} />
          else if (el.type === 'sticker') content = <StickerElement element={el} />
          else content = <div className="absolute inset-0 rounded" style={{ backgroundColor: `${theme.accentColor}22` }} />
          return (
            <div key={i} className="absolute" style={style}>
              {content}
            </div>
          )
        })}
      </div>
      <p className="text-xs text-stone-600 text-center mt-1.5 font-medium">{item.icon} {item.name}</p>
    </div>
  )
}

// Small bundled flat-illustration placeholders — used only in previews, only when the
// journal has no real photos yet. Never written into real content.
function MountainIllustration({ color }) {
  return (
    <svg viewBox="0 0 100 60" preserveAspectRatio="xMidYMid slice" className="w-full h-full">
      <rect width="100" height="60" fill={`${color}22`} />
      <polygon points="0,60 25,20 40,38 55,12 75,40 100,25 100,60" fill={`${color}55`} />
      <polygon points="55,12 62,24 48,24" fill={`${color}88`} />
      <circle cx="82" cy="14" r="7" fill={`${color}44`} />
    </svg>
  )
}
function TrailIllustration({ color }) {
  return (
    <svg viewBox="0 0 100 60" preserveAspectRatio="xMidYMid slice" className="w-full h-full">
      <rect width="100" height="60" fill={`${color}1a`} />
      <path d="M0 50 Q 25 20 45 40 T 100 15" fill="none" stroke={color} strokeWidth="2.5" strokeDasharray="1 6" strokeLinecap="round" opacity="0.6" />
      <circle cx="0" cy="50" r="3" fill={color} opacity="0.6" />
      <circle cx="100" cy="15" r="3" fill={color} opacity="0.6" />
    </svg>
  )
}
const FALLBACK_ILLUSTRATIONS = [MountainIllustration, TrailIllustration]

// Themed mini-thumbnail — same rect/line technique as LayoutPicker's generic one, but colored
// with *this* theme's own palette, and substitutes a real uploaded photo (or a bundled
// illustration fallback) for image/cover blocks instead of a flat rect.
function ThemedThumb({ elements, theme, photos, seed = 0 }) {
  const Illustration = FALLBACK_ILLUSTRATIONS[seed % FALLBACK_ILLUSTRATIONS.length]
  const photo = photos?.[seed % Math.max(photos?.length ?? 0, 1)]
  return (
    <svg viewBox={`0 0 ${SW} ${SH}`} className="w-full h-full">
      <rect width={SW} height={SH} fill={theme.backgroundColor ?? '#faf9f5'} />
      {elements.map((el, i) => {
        const x = (el.grid.x / COLS) * SW + GAP / 2
        const y = (el.grid.y / ROWS) * SH + GAP / 2
        const w = Math.max((el.grid.w / COLS) * SW - GAP, 0)
        const h = Math.max((el.grid.h / ROWS) * SH - GAP, 0)
        const key = `${el.type}-${i}`

        if (el.type === 'image' || el.type === 'cover') {
          if (photo) {
            return <image key={key} href={photo} x={x} y={y} width={w} height={h} preserveAspectRatio="xMidYMid slice" />
          }
          return (
            <g key={key} clipPath={undefined}>
              <foreignObject x={x} y={y} width={w} height={h}>
                <div style={{ width: '100%', height: '100%' }}><Illustration color={theme.accentColor} /></div>
              </foreignObject>
            </g>
          )
        }
        if (el.type === 'text') {
          const lines = Math.min(Math.floor(h / 5), 6)
          return (
            <g key={key}>
              {Array.from({ length: lines }, (_, j) => (
                <line key={j} x1={x + 1} y1={y + 3 + j * 5} x2={j % 3 === 2 ? x + w * 0.5 : x + w - 1} y2={y + 3 + j * 5}
                  stroke={theme.accentColorSecondary ?? '#999'} strokeWidth="1.1" strokeLinecap="round" opacity={j === 0 ? 0.8 : 0.35} />
              ))}
            </g>
          )
        }
        if (el.type === 'map') {
          return (
            <g key={key}>
              <rect x={x} y={y} width={w} height={h} fill={`${theme.accentColor}33`} />
              <polyline points={`${x + 3},${y + h * 0.7} ${x + w * 0.4},${y + h * 0.4} ${x + w - 3},${y + h * 0.25}`}
                fill="none" stroke={theme.accentColor} strokeWidth="1.4" strokeLinecap="round" opacity="0.8" />
            </g>
          )
        }
        if (el.type === 'divider') {
          return <line key={key} x1={x} y1={y + h / 2} x2={x + w} y2={y + h / 2} stroke={theme.accentColorSecondary} strokeWidth="1" opacity="0.7" />
        }
        if (el.type === 'sticker') {
          return <circle key={key} cx={x + w / 2} cy={y + h / 2} r={Math.min(w, h) / 2.5} fill={theme.accentColorSecondary} opacity="0.55" />
        }
        return <rect key={key} x={x} y={y} width={w} height={h} fill={`${theme.accentColor}30`} rx="1" />
      })}
    </svg>
  )
}

function Swatch({ color, label }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="w-8 h-8 rounded-full border border-black/10" style={{ backgroundColor: color }} />
      <span className="text-[9px] text-stone-400">{label}</span>
    </div>
  )
}

function ThemeDetail({ theme, onClose, onApplied, onSelect }) {
  const { notebook, uid, applyLayout, changeJournalTheme, restyleDryRun } = useEditorStore()
  const { user } = useAuth()
  const hasContent = !!(theme.covers?.length || theme.layouts?.length)
  const [level, setLevel] = useState('standard')
  const [photos, setPhotos] = useState([])
  const [stage, setStage] = useState('detail') // 'detail' | 'dryrun' | 'applying' | 'done' | 'error'
  const [dryRun, setDryRun] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (user && notebook) fsLoadPhotos(user.uid, notebook.id).then(ps => setPhotos((ps ?? []).slice(0, 3).map(p => p.thumbnailUrl).filter(Boolean)))
  }, [user, notebook])

  // Real journal photos always take priority; only when there are none does the preview fall
  // back to this theme's bundled representative photo (if it has one yet) — and only after
  // that, to the illustrated placeholder, inside MockPhoto itself.
  const effectivePhotos = photos.length ? photos : (THEME_FALLBACK_PHOTOS[theme.id] ? [THEME_FALLBACK_PHOTOS[theme.id]] : [])

  const groups = hasContent
    ? Object.entries([...(theme.covers ?? []), ...(theme.layouts ?? [])].reduce((acc, item) => {
        const g = item.group ?? 'Layouts'
        ;(acc[g] ??= []).push(item)
        return acc
      }, {}))
    : []

  // Showcase examples for the big, genuinely-populated preview — chosen so that, between them,
  // they demonstrate every treatment (photo, text, map, keepsake, divider, sticker), not just
  // whichever three happen to come first. Falls back to the first few layouts if a theme
  // doesn't have these specific groups/element types yet.
  const showcase = hasContent ? (() => {
    const all = [...(theme.layouts ?? [])]
    const hasVisibleDivider = (i) => i.elements.some(e => e.type === 'divider' && (e.minDecorationLevel ?? 'minimal') !== 'rich')
    const pick = (pred) => all.find(pred)
    const picks = [
      pick(i => i.group === 'Writing' && i.elements.some(e => e.type === 'image')) ?? pick(i => i.group === 'Writing'),
      pick(i => i.group === 'Map & Itinerary' && i.elements.some(e => e.type === 'map')) ?? pick(i => i.group === 'Map & Itinerary'),
      pick(i => i.group === 'Keepsake'),
      pick(hasVisibleDivider),
    ].filter(Boolean)
    for (const item of all) {
      if (picks.length >= 4) break
      if (!picks.includes(item)) picks.push(item)
    }
    return picks.slice(0, 4)
  })() : []

  const applyPreserveOnly = async () => {
    setStage('applying')
    await changeJournalTheme(theme, { restyle: false })
    setStage('done')
    onApplied?.()
  }

  const startRestyle = async () => {
    setStage('applying')
    const plan = await restyleDryRun(theme.id)
    setDryRun(plan)
    setStage('dryrun')
  }

  const confirmRestyle = async () => {
    setStage('applying')
    const result = await changeJournalTheme(theme, { restyle: true, dryRun })
    if (!result.ok) {
      setErrorMsg(`Some elements couldn't be restyled (${result.succeededIds?.length ?? 0} succeeded before the error). Your journal's base theme was not changed — safe to try again.`)
      setStage('error')
      return
    }
    setStage('done')
    onApplied?.()
  }

  return (
    <div className="p-5 space-y-5 overflow-y-auto">
      <div className="flex items-center gap-2">
        <button onClick={onClose} className="text-stone-400 hover:text-stone-700 text-sm">← Back</button>
      </div>

      <div>
        <h3 className="text-lg font-bold text-stone-900">{theme.icon} {theme.label}</h3>
        <div className="flex gap-4 mt-3">
          <Swatch color={theme.accentColor} label="Accent" />
          <Swatch color={theme.accentColorSecondary} label="Secondary" />
          <Swatch color={theme.backgroundColor} label="Background" />
          {theme.tokens && <Swatch color={theme.tokens.border} label="Border" />}
        </div>
        <div className="mt-3 rounded-lg border border-stone-200 p-3" style={{ backgroundColor: theme.backgroundColor }}>
          <p className="font-bold" style={{ fontFamily: theme.fontHeading, color: theme.accentColor }}>Page Heading</p>
          <p className="text-sm mt-0.5" style={{ fontFamily: theme.fontBody, color: theme.tokens?.body ?? theme.accentColor }}>Body text appears here in this theme's fonts.</p>
        </div>
      </div>

      {hasContent && (
        <>
          <div>
            <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">Decoration level</p>
            <div className="flex gap-1.5">
              {DECORATION_LEVELS.map(l => (
                <button key={l} onClick={() => setLevel(l)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-full capitalize transition-colors ${
                    level === l ? 'text-white' : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                  }`}
                  style={level === l ? { backgroundColor: theme.accentColor } : undefined}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">Interior page examples</p>
            <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
              {showcase.map((item, i) => (
                <PageMockup key={item.id} item={item} theme={theme} photos={effectivePhotos} level={level} seed={i} />
              ))}
            </div>
          </div>

          {groups.map(([group, items], gi) => (
            <div key={group}>
              <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-2">{group}</p>
              <div className="grid grid-cols-4 gap-3">
                {items.map((item, ii) => {
                  const resolved = resolveThemedElements(item.elements, theme, item.id, level)
                  return (
                    <button
                      key={item.id}
                      onClick={onSelect ? undefined : () => { applyLayout({ elements: resolveThemedElements(item.elements, theme, item.id, level).map(e => ({ ...e })) }); onClose() }}
                      className={`flex flex-col items-center gap-1.5 group ${onSelect ? 'cursor-default' : ''}`}
                      title={onSelect ? item.name : `Apply "${item.name}" to the current page`}
                    >
                      <div className="w-full aspect-[3/4] rounded-lg overflow-hidden border-2 border-stone-200 group-hover:shadow-md transition-shadow" style={{ borderColor: undefined }}>
                        <ThemedThumb elements={resolved} theme={theme} photos={effectivePhotos} seed={gi * 4 + ii} />
                      </div>
                      <span className="text-[10px] text-stone-600 text-center leading-tight">{item.icon} {item.name}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </>
      )}

      <div className="pt-3 border-t border-stone-100 space-y-2">
        {onSelect ? (
          <button onClick={() => onSelect(theme)}
            className="w-full py-2.5 text-sm font-semibold text-white rounded-lg transition-colors"
            style={{ backgroundColor: theme.accentColor }}
          >
            Select This Theme
          </button>
        ) : stage === 'detail' && (
          <>
            <button onClick={applyPreserveOnly}
              className="w-full py-2.5 text-sm font-semibold text-white rounded-lg transition-colors"
              style={{ backgroundColor: theme.accentColor }}
            >
              Change journal theme, preserve existing element styling
            </button>
            <p className="text-[10px] text-stone-400 text-center">Changes background, fonts, and texture on every page immediately. Element colors (headings, borders, etc.) are left as they are.</p>
            {theme.tokens ? (
              <button onClick={startRestyle}
                className="w-full py-2 text-sm font-medium border border-stone-200 rounded-lg text-stone-600 hover:bg-stone-50 transition-colors"
              >
                Change journal theme and restyle compatible elements
              </button>
            ) : (
              <p className="text-[10px] text-stone-400 text-center leading-relaxed">This theme hasn't been upgraded to support element restyling yet — the button above changes colors, fonts, and texture only.</p>
            )}
          </>
        )}

        {stage === 'dryrun' && dryRun && (
          <div className="space-y-2">
            <div className="text-xs text-stone-600 bg-stone-50 rounded-lg p-3 leading-relaxed">
              This will restyle <strong>{dryRun.restyledFieldCount}</strong> field{dryRun.restyledFieldCount === 1 ? '' : 's'} across <strong>{dryRun.elementCount}</strong> element{dryRun.elementCount === 1 ? '' : 's'} on <strong>{dryRun.pageCount}</strong> page{dryRun.pageCount === 1 ? '' : 's'}.
              {dryRun.preservedFieldCount > 0 && <> <strong>{dryRun.preservedFieldCount}</strong> field{dryRun.preservedFieldCount === 1 ? '' : 's'} you customized by hand will be left alone.</>}
              {dryRun.unsupportedFieldCount > 0 && <> <strong>{dryRun.unsupportedFieldCount}</strong> field{dryRun.unsupportedFieldCount === 1 ? '' : 's'} can't be restyled to this theme and will be skipped.</>}
              {dryRun.elementCount === 0 && <> No theme-managed elements found to restyle — this journal has nothing from a token-enabled theme yet.</>}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setStage('detail')} className="flex-1 py-2 text-sm border border-stone-200 rounded-lg text-stone-600 hover:bg-stone-50">Cancel</button>
              <button onClick={confirmRestyle} className="flex-1 py-2 text-sm font-semibold text-white rounded-lg" style={{ backgroundColor: theme.accentColor }}>Confirm Restyle</button>
            </div>
          </div>
        )}

        {stage === 'applying' && <p className="text-center text-sm text-stone-400 py-2">Applying…</p>}
        {stage === 'done' && <p className="text-center text-sm text-emerald-700 py-2">✓ Theme applied</p>}
        {stage === 'error' && (
          <div className="space-y-2">
            <p className="text-xs text-red-600 bg-red-50 rounded-lg p-3 leading-relaxed">{errorMsg}</p>
            <button onClick={confirmRestyle} className="w-full py-2 text-sm font-semibold text-white rounded-lg" style={{ backgroundColor: theme.accentColor }}>Retry</button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ThemeDetailModal({ onClose, initialThemeId, onSelect }) {
  const [category, setCategory] = useState('Occasion')
  const [selected, setSelected] = useState(THEMES.find(t => t.id === initialThemeId) ?? null)

  useEffect(() => {
    if (selected) { loadFont(selected.fontHeading); loadFont(selected.fontBody) }
  }, [selected])

  const filtered = THEMES.filter(t => t.category === category)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4" onClick={onClose}>
      <div className={`bg-white rounded-2xl shadow-2xl w-full ${selected ? 'max-w-3xl' : 'max-w-lg'} max-h-[88vh] flex flex-col transition-all`} onClick={e => e.stopPropagation()}>
        <div className="px-5 pt-5 pb-3 border-b border-stone-100 flex items-center justify-between flex-shrink-0">
          <h2 className="text-base font-bold text-stone-900">{selected ? 'Theme Preview' : 'Explore Journal Themes'}</h2>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-700 text-xl w-7 h-7 flex items-center justify-center rounded hover:bg-stone-100">✕</button>
        </div>

        {selected ? (
          <ThemeDetail
            theme={selected}
            onClose={() => setSelected(null)}
            onApplied={() => setTimeout(onClose, 700)}
            onSelect={onSelect ? (t) => { onSelect(t); onClose() } : undefined}
          />
        ) : (
          <div className="p-5 overflow-y-auto space-y-3">
            <div className="flex gap-1.5">
              {THEME_CATEGORIES.map(c => (
                <button key={c} onClick={() => setCategory(c)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-colors ${
                    category === c ? 'bg-amber-700 text-white' : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-3">
              {filtered.map(t => (
                <button
                  key={t.id}
                  onClick={() => setSelected(t)}
                  className="relative rounded-lg overflow-hidden border-2 border-stone-200 hover:border-stone-400 transition-colors text-left"
                  style={{ backgroundColor: t.backgroundColor }}
                >
                  <div className="px-2.5 pt-2.5 pb-2">
                    <p className="text-xs font-bold leading-tight" style={{ fontFamily: t.fontHeading, color: t.accentColor }}>{t.icon} {t.label}</p>
                    <p className="text-[9px] leading-snug opacity-60 mt-0.5" style={{ fontFamily: t.fontBody, color: t.accentColor }}>Aa Bb</p>
                    {t.covers?.length ? <p className="text-[8px] mt-1 opacity-50" style={{ color: t.accentColor }}>{t.covers.length + t.layouts.length} coordinated layouts</p> : null}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
