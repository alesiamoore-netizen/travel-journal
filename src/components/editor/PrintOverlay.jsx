export default function PrintOverlay({ visible, canvasWidth, canvasHeight, bleedPx, marginPx }) {
  if (!visible) return null

  return (
    <div className="absolute inset-0 pointer-events-none z-30">
      <svg
        width={canvasWidth}
        height={canvasHeight}
        className="absolute inset-0 overflow-visible"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Bleed line */}
        <rect
          x={bleedPx} y={bleedPx}
          width={canvasWidth - bleedPx * 2}
          height={canvasHeight - bleedPx * 2}
          fill="none"
          stroke="rgba(239,68,68,0.7)"
          strokeWidth="1"
          strokeDasharray="5 4"
        />
        {/* Safe margin */}
        <rect
          x={marginPx} y={marginPx}
          width={canvasWidth - marginPx * 2}
          height={canvasHeight - marginPx * 2}
          fill="none"
          stroke="rgba(59,130,246,0.6)"
          strokeWidth="1"
          strokeDasharray="8 4"
        />
      </svg>

      <div className="absolute top-2 right-2 flex flex-col gap-1">
        <span className="bg-white/90 text-red-500 text-xs px-1.5 py-0.5 rounded shadow-sm">
          — bleed (0.125&quot;)
        </span>
        <span className="bg-white/90 text-blue-500 text-xs px-1.5 py-0.5 rounded shadow-sm">
          — safe margin (0.5&quot;)
        </span>
      </div>
    </div>
  )
}
