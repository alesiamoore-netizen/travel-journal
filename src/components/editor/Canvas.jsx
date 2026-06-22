import { forwardRef, useCallback } from 'react'
import GridLayout, { getCompactor } from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import { useEditorStore } from '../../store/editorStore'
import TextElement from './elements/TextElement'
import ImageElement from './elements/ImageElement'
import MapElement from './elements/MapElement'
import PrintOverlay from './PrintOverlay'
import { getTextureStyle } from '../../utils/textures'

// No compaction + allow overlap (elements stay exactly where placed, can overlap freely)
const OVERLAP_COMPACTOR = getCompactor(null, true)

const Canvas = forwardRef(function Canvas({ canvasWidth, displayHeight, rowHeight, bleedPx, marginPx }, ref) {
  const { elements, selectedId, select, deselect, updateElementGrid, printOverlay, notebook } =
    useEditorStore()

  const layout = elements.map(e => ({
    i: e.id,
    x: e.grid.x,
    y: e.grid.y,
    w: e.grid.w,
    h: e.grid.h,
    minW: 1,
    minH: 1,
  }))

  const handleLayoutChange = useCallback(
    (newLayout) => {
      newLayout.forEach(item => {
        const el = elements.find(e => e.id === item.i)
        if (!el) return
        const g = { x: item.x, y: item.y, w: item.w, h: item.h }
        if (el.grid.x !== g.x || el.grid.y !== g.y || el.grid.w !== g.w || el.grid.h !== g.h) {
          updateElementGrid(el.id, g)
        }
      })
    },
    [elements, updateElementGrid],
  )

  return (
    <div
      ref={ref}
      className="relative shadow-xl flex-shrink-0"
      style={{
        width: canvasWidth,
        height: displayHeight,
        backgroundColor: notebook?.theme?.backgroundColor ?? '#ffffff',
        '--font-heading': notebook?.theme?.fontHeading ?? 'Georgia',
        '--font-body': notebook?.theme?.fontBody ?? 'system-ui',
        ...getTextureStyle(notebook?.theme?.backgroundTexture),
      }}
      onClick={() => deselect()}
    >
      <PrintOverlay
        visible={printOverlay}
        canvasWidth={canvasWidth}
        canvasHeight={displayHeight}
        bleedPx={bleedPx}
        marginPx={marginPx}
      />

      <GridLayout
        layout={layout}
        width={canvasWidth}
        gridConfig={{
          cols: 12,
          rowHeight,
          margin: [0, 0],
          containerPadding: [0, 0],
        }}
        compactor={OVERLAP_COMPACTOR}
        dragConfig={{
          enabled: true,
          handle: '.drag-handle',
        }}
        resizeConfig={{ enabled: true }}
        onLayoutChange={handleLayoutChange}
      >
        {elements.map(el => (
          <div
            key={el.id}
            className={`relative overflow-hidden group/el ${
              selectedId === el.id
                ? 'outline outline-2 outline-blue-500 outline-offset-[-2px] z-10'
                : 'outline outline-1 outline-transparent hover:outline-stone-300'
            }`}
            onClick={e => { e.stopPropagation(); select(el.id) }}
          >
            {/* Drag handle strip */}
            <div
              className={`drag-handle absolute top-0 left-0 right-0 h-5 z-20 flex items-center justify-center cursor-grab active:cursor-grabbing transition-opacity ${
                selectedId === el.id
                  ? 'opacity-100 bg-blue-500/10'
                  : 'opacity-0 group-hover/el:opacity-100 bg-stone-200/60'
              }`}
            >
              <div className="flex gap-0.5">
                {[0, 1, 2, 3, 4, 5].map(i => (
                  <span key={i} className="w-0.5 h-0.5 rounded-full bg-current opacity-50" />
                ))}
              </div>
            </div>

            {el.type === 'text'  && <TextElement  key={el.id} element={el} />}
            {el.type === 'image' && <ImageElement key={el.id} element={el} />}
            {el.type === 'map'   && <MapElement   key={el.id} element={el} />}
          </div>
        ))}
      </GridLayout>
    </div>
  )
})

export default Canvas
