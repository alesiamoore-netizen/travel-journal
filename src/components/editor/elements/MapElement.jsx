import { useEffect, useState } from 'react'
import { useEditorStore } from '../../../store/editorStore'
import { buildRoute } from '../../../utils/route'
import RouteMap from '../../map/RouteMap'

export default function MapElement({ element }) {
  const notebook = useEditorStore(s => s.notebook)
  const [routePoints, setRoutePoints] = useState([])
  const [loading, setLoading] = useState(true)
  const { data } = element

  useEffect(() => {
    if (!notebook?.id) return
    setLoading(true)
    buildRoute(notebook.id).then(pts => {
      setRoutePoints(pts)
      setLoading(false)
    })
  }, [notebook?.id])

  if (loading) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-stone-100">
        <p className="text-xs text-stone-400">Loading map…</p>
      </div>
    )
  }

  if (routePoints.length === 0) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-stone-50 gap-2">
        <span className="text-3xl">🗺</span>
        <p className="text-xs text-stone-400 text-center px-4 leading-relaxed">
          Upload photos with GPS data to build your route map.
        </p>
      </div>
    )
  }

  return (
    <div className="absolute inset-0">
      <RouteMap
        routePoints={routePoints}
        tileStyle={data.tileStyle}
        pinColor={data.pinColor}
        routeColor={data.routeColor}
        routeWeight={data.routeWeight}
        showRoute={data.showRoute}
        showPins={data.showPins}
      />
    </div>
  )
}
