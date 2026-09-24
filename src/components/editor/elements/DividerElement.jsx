import { useEditorStore } from '../../../store/editorStore'

export default function DividerElement({ element }) {
  const { notebook } = useEditorStore()
  const accent = notebook?.theme?.accentColor ?? '#c0813a'
  const raw = element.data.color ?? 'accent'
  const color = raw === 'accent' ? accent : raw
  const style = element.data.style ?? 'line'

  return (
    <div className="h-full w-full flex items-center px-2">
      {style === 'line' && (
        <div style={{ width: '100%', height: '1px', backgroundColor: color }} />
      )}
      {style === 'thick' && (
        <div style={{ width: '100%', height: '3px', backgroundColor: color }} />
      )}
      {style === 'double' && (
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '3px' }}>
          <div style={{ height: '1px', backgroundColor: color }} />
          <div style={{ height: '1px', backgroundColor: color }} />
        </div>
      )}
      {style === 'dotted' && (
        <div style={{ width: '100%', borderTop: `2px dotted ${color}` }} />
      )}
      {style === 'ornate' && (
        <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: color }} />
          <span style={{ color, fontSize: '10px', lineHeight: 1, flexShrink: 0 }}>✦</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: color }} />
        </div>
      )}
      {style === 'wave' && (
        <svg style={{ width: '100%', height: '8px', overflow: 'visible' }} viewBox="0 0 200 8" preserveAspectRatio="none">
          <path
            d="M0,4 Q25,0 50,4 Q75,8 100,4 Q125,0 150,4 Q175,8 200,4"
            fill="none"
            stroke={color}
            strokeWidth="1.5"
          />
        </svg>
      )}
    </div>
  )
}
