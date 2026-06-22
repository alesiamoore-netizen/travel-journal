import { useEditorStore } from '../../store/editorStore'

export default function Sidebar() {
  const { pages, currentPageId, switchPage, addPage, deletePage, addElement } = useEditorStore()

  return (
    <aside className="w-44 bg-white border-r border-stone-200 flex flex-col flex-shrink-0 overflow-hidden">
      {/* Pages header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-stone-100">
        <span className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Pages</span>
        <button
          onClick={addPage}
          className="w-5 h-5 rounded text-stone-400 hover:text-stone-700 hover:bg-stone-100 flex items-center justify-center text-lg leading-none"
          title="Add page"
        >
          +
        </button>
      </div>

      {/* Page list */}
      <div className="flex-1 overflow-y-auto py-2 space-y-0.5 px-2 min-h-0">
        {pages.map((page, i) => (
          <div
            key={page.id}
            className={`group relative flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors ${
              currentPageId === page.id
                ? 'bg-amber-50 text-amber-800'
                : 'text-stone-600 hover:bg-stone-50'
            }`}
            onClick={() => switchPage(page.id)}
          >
            <div
              className={`w-6 h-8 rounded border flex items-center justify-center flex-shrink-0 text-xs font-mono ${
                currentPageId === page.id
                  ? 'border-amber-300 bg-amber-100 text-amber-700'
                  : 'border-stone-200 bg-stone-50 text-stone-400'
              }`}
            >
              {i + 1}
            </div>
            <span className="text-xs truncate flex-1">Page {i + 1}</span>
            {pages.length > 1 && (
              <button
                className="opacity-0 group-hover:opacity-100 w-4 h-4 flex items-center justify-center text-stone-300 hover:text-red-500 transition-all text-base leading-none"
                onClick={e => { e.stopPropagation(); deletePage(page.id) }}
                title="Delete page"
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Element palette */}
      <div className="border-t border-stone-100 flex-shrink-0">
        <div className="px-3 py-2 text-xs font-semibold text-stone-500 uppercase tracking-wide">
          Add Element
        </div>
        <div className="px-2 pb-3 space-y-1">
          <button
            onClick={() => addElement('text')}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-stone-700 hover:bg-amber-50 hover:text-amber-800 border border-stone-200 hover:border-amber-200 transition-colors"
          >
            <span className="text-sm font-bold font-serif">T</span>
            <span className="text-xs font-medium">Text Block</span>
          </button>
          <button
            onClick={() => addElement('image')}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-stone-700 hover:bg-amber-50 hover:text-amber-800 border border-stone-200 hover:border-amber-200 transition-colors"
          >
            <span className="text-sm">🖼</span>
            <span className="text-xs font-medium">Image</span>
          </button>
          <button
            onClick={() => addElement('map')}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-stone-700 hover:bg-amber-50 hover:text-amber-800 border border-stone-200 hover:border-amber-200 transition-colors"
          >
            <span className="text-sm">🗺</span>
            <span className="text-xs font-medium">Route Map</span>
          </button>
        </div>
      </div>
    </aside>
  )
}
