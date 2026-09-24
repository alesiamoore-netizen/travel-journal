import { useEditorStore } from '../../../store/editorStore'

export const STICKER_LIST = [
  { id: 'compass',  label: 'Compass'  },
  { id: 'camera',   label: 'Camera'   },
  { id: 'pin',      label: 'Pin'      },
  { id: 'stamp',    label: 'Stamp'    },
  { id: 'sun',      label: 'Sun'      },
  { id: 'star',     label: 'Star'     },
  { id: 'plane',    label: 'Plane'    },
  { id: 'tape',     label: 'Tape'     },
  { id: 'polaroid', label: 'Polaroid' },
  { id: 'heart',    label: 'Heart'    },
  { id: 'wreath',   label: 'Wreath'   },
  { id: 'banner',   label: 'Banner'   },
  { id: 'frame',    label: 'Frame'    },
  { id: 'arrow',    label: 'Arrow'    },
  { id: 'wave',     label: 'Wave'     },
  { id: 'ticket',   label: 'Ticket'   },
]

function StickerSVG({ id, color }) {
  const c = color || '#c0813a'
  switch (id) {
    case 'compass': return (
      <svg viewBox="0 0 100 100" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="44" fill="none" stroke={c} strokeWidth="2"/>
        <circle cx="50" cy="50" r="36" fill="none" stroke={c} strokeWidth="0.6" strokeDasharray="2 4"/>
        <polygon points="50,8 54,46 50,42 46,46" fill={c}/>
        <polygon points="50,92 46,54 50,58 54,54" fill={c} fillOpacity="0.45"/>
        <polygon points="8,50 46,46 42,50 46,54" fill={c} fillOpacity="0.45"/>
        <polygon points="92,50 54,54 58,50 54,46" fill={c}/>
        <circle cx="50" cy="50" r="4" fill={c}/>
        <text x="50" y="24" textAnchor="middle" fontSize="10" fontFamily="Georgia,serif" fill={c} fontWeight="bold">N</text>
        <text x="50" y="84" textAnchor="middle" fontSize="8" fontFamily="Georgia,serif" fill={c} fillOpacity="0.5">S</text>
        <text x="82" y="54" textAnchor="middle" fontSize="8" fontFamily="Georgia,serif" fill={c}>E</text>
        <text x="18" y="54" textAnchor="middle" fontSize="8" fontFamily="Georgia,serif" fill={c} fillOpacity="0.5">W</text>
      </svg>
    )
    case 'camera': return (
      <svg viewBox="0 0 100 80" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <rect x="5" y="18" width="90" height="57" rx="6" fill="none" stroke={c} strokeWidth="2.5"/>
        <circle cx="50" cy="46" r="18" fill="none" stroke={c} strokeWidth="2.5"/>
        <circle cx="50" cy="46" r="9" fill={c} fillOpacity="0.18"/>
        <circle cx="50" cy="46" r="4" fill={c}/>
        <rect x="28" y="10" width="22" height="11" rx="3" fill="none" stroke={c} strokeWidth="2"/>
        <circle cx="79" cy="28" r="5" fill="none" stroke={c} strokeWidth="1.5"/>
        <circle cx="79" cy="28" r="2" fill={c}/>
        <rect x="10" y="55" width="15" height="4" rx="2" fill={c} fillOpacity="0.3"/>
      </svg>
    )
    case 'pin': return (
      <svg viewBox="0 0 60 85" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <path d="M30 5 C14 5 5 17 5 30 C5 50 30 80 30 80 C30 80 55 50 55 30 C55 17 46 5 30 5Z" fill={c} fillOpacity="0.15" stroke={c} strokeWidth="2.5"/>
        <circle cx="30" cy="30" r="11" fill={c} fillOpacity="0.28"/>
        <circle cx="30" cy="30" r="5" fill={c}/>
      </svg>
    )
    case 'stamp': return (
      <svg viewBox="0 0 100 100" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="44" fill="none" stroke={c} strokeWidth="3" strokeDasharray="4.5 3"/>
        <circle cx="50" cy="50" r="36" fill="none" stroke={c} strokeWidth="1"/>
        <text x="50" y="46" textAnchor="middle" fontSize="12" fontFamily="Georgia,serif" fill={c} fontWeight="bold" letterSpacing="3">TRAVEL</text>
        <text x="50" y="60" textAnchor="middle" fontSize="8" fontFamily="Georgia,serif" fill={c} fillOpacity="0.65" letterSpacing="2">MEMORIES</text>
        <line x1="22" y1="50" x2="30" y2="50" stroke={c} strokeWidth="1"/>
        <line x1="70" y1="50" x2="78" y2="50" stroke={c} strokeWidth="1"/>
      </svg>
    )
    case 'sun': return (
      <svg viewBox="0 0 100 100" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="16" fill={c}/>
        {[0,30,60,90,120,150,180,210,240,270,300,330].map(a => {
          const r = a * Math.PI / 180
          const x1 = 50 + 22 * Math.cos(r), y1 = 50 + 22 * Math.sin(r)
          const x2 = 50 + (a % 90 === 0 ? 44 : 36) * Math.cos(r)
          const y2 = 50 + (a % 90 === 0 ? 44 : 36) * Math.sin(r)
          return <line key={a} x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth={a % 90 === 0 ? 2.5 : 1.5} strokeLinecap="round"/>
        })}
      </svg>
    )
    case 'star': return (
      <svg viewBox="0 0 100 100" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <polygon points="50,5 62,38 97,38 70,59 80,92 50,72 20,92 30,59 3,38 38,38" fill={c} fillOpacity="0.2" stroke={c} strokeWidth="2" strokeLinejoin="round"/>
        <polygon points="50,18 58,42 84,42 63,56 70,80 50,66 30,80 37,56 16,42 42,42" fill={c} fillOpacity="0.35"/>
        <polygon points="50,28 56,46 74,46 60,57 65,75 50,64 35,75 40,57 26,46 44,46" fill={c}/>
      </svg>
    )
    case 'plane': return (
      <svg viewBox="0 0 100 100" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <path d="M88 18 L10 50 L36 56 L42 82 L58 64 L74 70 Z" fill={c} fillOpacity="0.14" stroke={c} strokeWidth="2" strokeLinejoin="round"/>
        <path d="M88 18 L52 34 L62 52 Z" fill={c} fillOpacity="0.35"/>
        <path d="M88 18 L60 50 L55 66 L42 82" fill="none" stroke={c} strokeWidth="1" strokeDasharray="3 3" strokeOpacity="0.4"/>
      </svg>
    )
    case 'tape': return (
      <svg viewBox="0 0 200 50" className="w-full h-full" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="50" fill={c} fillOpacity="0.38"/>
        <rect x="0" y="5" width="200" height="2" fill={c} fillOpacity="0.18"/>
        <rect x="0" y="43" width="200" height="2" fill={c} fillOpacity="0.18"/>
        {Array.from({length: 13}).map((_,i) => (
          <line key={i} x1={8+i*15} y1="7" x2={8+i*15} y2="43" stroke={c} strokeWidth="0.5" strokeOpacity="0.15"/>
        ))}
      </svg>
    )
    case 'polaroid': return (
      <svg viewBox="0 0 100 120" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <rect x="4" y="4" width="92" height="112" rx="3" fill="white" stroke={c} strokeWidth="2"/>
        <rect x="11" y="11" width="78" height="72" rx="2" fill={c} fillOpacity="0.07" stroke={c} strokeWidth="1"/>
        <rect x="18" y="92" width="64" height="8" rx="1.5" fill={c} fillOpacity="0.18"/>
        <rect x="28" y="105" width="44" height="5" rx="1" fill={c} fillOpacity="0.1"/>
      </svg>
    )
    case 'heart': return (
      <svg viewBox="0 0 100 90" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <path d="M50 82 C50 82 8 52 8 28 C8 15 18 6 30 6 C38 6 46 11 50 19 C54 11 62 6 70 6 C82 6 92 15 92 28 C92 52 50 82 50 82Z" fill={c} fillOpacity="0.18" stroke={c} strokeWidth="2.5"/>
        <path d="M50 72 C50 72 16 48 16 30 C16 20 23 14 32 14 C40 14 46 20 50 27 C54 20 60 14 68 14 C77 14 84 20 84 30 C84 48 50 72 50 72Z" fill={c} fillOpacity="0.45"/>
      </svg>
    )
    case 'wreath': return (
      <svg viewBox="0 0 100 100" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        {[0,30,60,90,120,150,180,210,240,270,300,330].map(a => {
          const r = a * Math.PI / 180
          const cx = 50 + 38 * Math.cos(r), cy = 50 + 38 * Math.sin(r)
          const rx = 10, ry = 5
          return <ellipse key={a} cx={cx} cy={cy} rx={rx} ry={ry} fill={c} fillOpacity="0.35" stroke={c} strokeWidth="0.5" transform={`rotate(${a + 90},${cx},${cy})`}/>
        })}
        {[15,45,75,105,135,165,195,225,255,285,315,345].map(a => {
          const r = a * Math.PI / 180
          const cx = 50 + 30 * Math.cos(r), cy = 50 + 30 * Math.sin(r)
          return <circle key={a} cx={cx} cy={cy} r="3" fill={c} fillOpacity="0.5"/>
        })}
        <circle cx="50" cy="50" r="18" fill="none" stroke={c} strokeWidth="0.8" strokeOpacity="0.3"/>
      </svg>
    )
    case 'banner': return (
      <svg viewBox="0 0 200 70" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <path d="M0 10 L10 0 L190 0 L200 10 L190 35 L200 60 L190 70 L10 70 L0 60 L10 35 Z" fill={c} fillOpacity="0.18" stroke={c} strokeWidth="1.5"/>
        <path d="M8 12 L12 6 L188 6 L192 12 L184 35 L192 58 L188 64 L12 64 L8 58 L16 35 Z" fill="none" stroke={c} strokeWidth="0.6" strokeOpacity="0.4"/>
        <text x="100" y="40" textAnchor="middle" fontSize="18" fontFamily="Georgia,serif" fill={c} fontWeight="bold" letterSpacing="4">JOURNEY</text>
      </svg>
    )
    case 'frame': return (
      <svg viewBox="0 0 100 100" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <rect x="4" y="4" width="92" height="92" fill="none" stroke={c} strokeWidth="1.5"/>
        <rect x="9" y="9" width="82" height="82" fill="none" stroke={c} strokeWidth="0.6" strokeOpacity="0.5"/>
        {/* Corner flourishes */}
        {[[4,4,1],[96,4,-1],[4,96,1],[96,96,-1]].map(([cx,cy,sx],i) => (
          <g key={i} transform={`translate(${cx},${cy}) scale(${sx},${i < 2 ? 1 : -1})`}>
            <path d="M0 0 Q12 0 12 12" fill="none" stroke={c} strokeWidth="2"/>
            <path d="M0 5 Q5 5 5 0" fill="none" stroke={c} strokeWidth="1.5"/>
            <circle cx="14" cy="14" r="2" fill={c} fillOpacity="0.6"/>
          </g>
        ))}
      </svg>
    )
    case 'arrow': return (
      <svg viewBox="0 0 120 60" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 30 L85 30" stroke={c} strokeWidth="2" strokeLinecap="round"/>
        <path d="M70 12 L100 30 L70 48" fill="none" stroke={c} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"/>
        <path d="M4 22 L4 38" stroke={c} strokeWidth="2" strokeLinecap="round"/>
        <text x="42" y="22" textAnchor="middle" fontSize="9" fontFamily="Georgia,serif" fill={c} fillOpacity="0.65" letterSpacing="2">THIS WAY</text>
      </svg>
    )
    case 'wave': return (
      <svg viewBox="0 0 200 50" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <path d="M0 25 C25 5 50 5 75 25 S125 45 150 25 S175 5 200 25" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"/>
        <path d="M0 32 C25 12 50 12 75 32 S125 52 150 32 S175 12 200 32" fill="none" stroke={c} strokeWidth="1" strokeOpacity="0.4" strokeLinecap="round"/>
      </svg>
    )
    case 'ticket': return (
      <svg viewBox="0 0 160 80" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 8 L120 8 Q128 8 130 16 A12 12 0 0 1 130 24 Q128 32 120 32 L120 48 Q128 48 130 56 A12 12 0 0 1 130 64 Q128 72 120 72 L8 72 Z" fill={c} fillOpacity="0.15" stroke={c} strokeWidth="1.5"/>
        <path d="M130 16 L152 16 L152 64 L130 64" fill={c} fillOpacity="0.08" stroke={c} strokeWidth="1.5" strokeDasharray="0"/>
        <line x1="130" y1="32" x2="130" y2="48" stroke={c} strokeWidth="1.5" strokeDasharray="3 2"/>
        <text x="64" y="38" textAnchor="middle" fontSize="11" fontFamily="Georgia,serif" fill={c} fontWeight="bold" letterSpacing="2">ADMIT ONE</text>
        <text x="64" y="52" textAnchor="middle" fontSize="7" fontFamily="Georgia,serif" fill={c} fillOpacity="0.55" letterSpacing="1">TRAVEL MEMORIES</text>
        <text x="141" y="42" textAnchor="middle" fontSize="8" fontFamily="Georgia,serif" fill={c} fillOpacity="0.5" transform="rotate(-90,141,42)">✦ ✦ ✦</text>
      </svg>
    )
    default: return <svg viewBox="0 0 100 100" className="w-full h-full"><circle cx="50" cy="50" r="40" fill={c} fillOpacity="0.3"/></svg>
  }
}

export default function StickerElement({ element }) {
  const { data } = element
  const rotation = data.rotation ?? 0

  return (
    <div
      className="w-full h-full flex items-center justify-center select-none"
      style={{
        opacity: data.opacity ?? 1,
        transform: rotation ? `rotate(${rotation}deg)` : undefined,
        pointerEvents: 'none',
      }}
    >
      <StickerSVG id={data.stickerId ?? 'compass'} color={data.color ?? '#c0813a'} />
    </div>
  )
}
