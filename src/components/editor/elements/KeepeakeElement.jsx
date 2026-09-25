import { useEditorStore } from '../../../store/editorStore'

export default function KeepeakeElement({ element }) {
  const { data } = element
  const accent = useEditorStore(s => s.notebook?.theme?.accentColor ?? '#c0813a')
  const borderColor = data.borderColor === 'accent' ? accent : (data.borderColor ?? accent)

  if (data.style === 'polaroid') {
    return (
      <div className="h-full w-full flex flex-col bg-white overflow-hidden" style={{ padding: '6% 6% 14% 6%', boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}>
        <div className="flex-1 w-full" style={{ backgroundColor: `${borderColor}12`, border: `1px dashed ${borderColor}40` }} />
        <div className="text-center mt-1" style={{ fontSize: '0.6rem', color: `${borderColor}90`, fontStyle: 'italic' }}>
          {data.label || 'Photo here'}
        </div>
      </div>
    )
  }

  if (data.style === 'pocket') {
    return (
      <div
        className="h-full w-full flex flex-col items-center justify-between overflow-hidden"
        style={{ border: `2px solid ${borderColor}50`, borderRadius: 4, padding: '8% 10%' }}
      >
        <div className="w-full flex justify-center opacity-30" style={{ color: borderColor }}>
          <svg viewBox="0 0 40 24" width="40" height="24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="1" y="1" width="38" height="22" rx="3" />
            <polyline points="1,5 20,14 39,5" />
          </svg>
        </div>
        <div className="text-center" style={{ color: `${borderColor}80`, fontSize: '0.65rem', fontStyle: 'italic' }}>
          {data.label || 'Insert here'}
        </div>
        {data.hint && (
          <div className="text-center" style={{ color: `${borderColor}50`, fontSize: '0.55rem' }}>
            {data.hint}
          </div>
        )}
      </div>
    )
  }

  // Default: dashed
  return (
    <div
      className="h-full w-full flex flex-col items-center justify-center gap-1 overflow-hidden"
      style={{ border: `2px dashed ${borderColor}50`, borderRadius: 4 }}
    >
      <span style={{ fontSize: '1.4rem', opacity: 0.25, color: borderColor }}>✂</span>
      <p
        className="text-center px-4 leading-snug italic"
        style={{ color: `${borderColor}70`, fontSize: '0.7rem' }}
      >
        {data.label || 'Keepsake here'}
      </p>
      {data.hint && (
        <p className="text-center px-4" style={{ color: `${borderColor}45`, fontSize: '0.58rem' }}>
          {data.hint}
        </p>
      )}
    </div>
  )
}
