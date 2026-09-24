import { forwardRef, useCallback } from 'react'
import GridLayout, { getCompactor } from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import { useEditorStore } from '../../store/editorStore'
import TextElement from './elements/TextElement'
import ImageElement from './elements/ImageElement'
import MapElement from './elements/MapElement'
import DividerElement from './elements/DividerElement'
import StickerElement from './elements/StickerElement'
import PrintOverlay from './PrintOverlay'
import { getTextureStyle } from '../../utils/textures'

// No compaction + allow overlap (elements stay exactly where placed, can overlap freely)
const OVERLAP_COMPACTOR = getCompactor(null, true)

const Canvas = forwardRef(function Canvas({ canvasWidth, displayHeight, rowHeight, bleedPx, marginPx, elements: elementsProp, readOnly }, ref) {
  const store = useEditorStore()
  const elements = elementsProp ?? store.elements
  const { selectedId, select, deselect, updateElementGrid, printOverlay, notebook } = store

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
      className="relative shadow-xl flex-shrink-0 overflow-hidden"
      style={{
        width: canvasWidth,
        height: displayHeight,
        backgroundColor: notebook?.theme?.backgroundColor ?? '#ffffff',
        '--font-heading': notebook?.theme?.fontHeading ?? 'Georgia',
        '--font-body': notebook?.theme?.fontBody ?? 'system-ui',
        ...getTextureStyle(notebook?.theme?.backgroundTexture),
      }}
      onClick={() => !readOnly && deselect()}
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
          enabled: !readOnly,
          handle: '.drag-handle',
        }}
        resizeConfig={{ enabled: !readOnly }}
        onLayoutChange={handleLayoutChange}
      >
        {elements.map(el => {
          const rotation = el.data?.rotation ?? 0
          const hasRotation = rotation !== 0
          const shadow = el.data?.shadow
          const dropShadow = shadow === 'soft'
            ? 'drop-shadow(0 4px 14px rgba(0,0,0,0.22))'
            : shadow === 'hard'
              ? 'drop-shadow(0 8px 28px rgba(0,0,0,0.42))'
              : undefined
          const combinedStyle = {
            ...(hasRotation ? { transform: `rotate(${rotation}deg)` } : {}),
            ...(dropShadow ? { filter: dropShadow } : {}),
            ...(hasRotation && selectedId === el.id ? { zIndex: 10 } : {}),
          }
          return (
            <div
              key={el.id}
              className={`relative group/el ${hasRotation ? 'overflow-visible' : 'overflow-hidden'} ${
                !readOnly && selectedId === el.id
                  ? 'outline outline-2 outline-amber-500 outline-offset-[-2px] z-10'
                  : !readOnly ? 'outline outline-1 outline-transparent hover:outline-amber-300/60' : ''
              }`}
              style={Object.keys(combinedStyle).length ? combinedStyle : undefined}
              onClick={e => { e.stopPropagation(); if (!readOnly) select(el.id) }}
            >
              {/* Drag handle strip */}
              <div
                className={`drag-handle absolute top-0 left-0 right-0 h-4 z-20 flex items-center justify-center cursor-grab active:cursor-grabbing transition-opacity ${
                  readOnly ? 'hidden' : selectedId === el.id
                    ? 'opacity-100 bg-amber-500/10'
                    : 'opacity-0 group-hover/el:opacity-100 bg-amber-400/10'
                }`}
              >
                <div className="flex gap-0.5">
                  {[0, 1, 2, 3, 4, 5].map(i => (
                    <span key={i} className="w-0.5 h-0.5 rounded-full bg-current opacity-50" />
                  ))}
                </div>
              </div>

              {el.type === 'text'    && <TextElement    key={el.id} element={el} />}
              {el.type === 'image'   && <ImageElement   key={el.id} element={el} />}
              {el.type === 'map'     && <MapElement     key={el.id} element={el} />}
              {el.type === 'divider' && <DividerElement key={el.id} element={el} />}
              {el.type === 'sticker' && <StickerElement key={el.id} element={el} />}
            </div>
          )
        })}
      </GridLayout>
    </div>
  )
})

export default Canvas
