export default function ExportModal({ current, total, done }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-72 text-center space-y-4">
        {done ? (
          <>
            <div className="text-4xl text-green-500">✓</div>
            <p className="text-sm font-semibold text-stone-700">PDF saved!</p>
          </>
        ) : (
          <>
            <p className="text-sm font-semibold text-stone-700">Exporting PDF…</p>
            <div className="w-full bg-stone-100 rounded-full h-1.5">
              <div
                className="bg-amber-600 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${total > 0 ? Math.round((current / total) * 100) : 0}%` }}
              />
            </div>
            <p className="text-xs text-stone-400">Page {current} of {total}</p>
          </>
        )}
      </div>
    </div>
  )
}
