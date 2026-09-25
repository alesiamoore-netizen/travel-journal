import { useEffect, useState } from 'react'
import { useEditorStore } from '../../../store/editorStore'
import { buildRoute } from '../../../utils/route'
import RouteMap from '../../map/RouteMap'

export default function MapElement({ element }) {
  const notebook = useEditorStore(s => s.notebook)
  const [routePoints, setRoutePoints] = useState([])
  const [loading, setLoading] = useState(true)
  const { data } = element
  const isPinMode = data.mode === 'pin'
  const isItinerary = data.mode === 'itinerary'
  const stops = data.stops ?? []

  useEffect(() => {
    if (isPinMode || isItinerary) { setLoading(false); return }
    if (!notebook?.id) return
    setLoading(true)
    buildRoute(notebook.id).then(pts => {
      setRoutePoints(pts)
      setLoading(false)
    })
  }, [notebook?.id, isPinMode, isItinerary])

  if (loading) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-stone-100">
        <p className="text-xs text-stone-400">Loading map…</p>
      </div>
    )
  }

  if (isItinerary && stops.length === 0) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-stone-50 gap-2">
        <span className="text-3xl">📍</span>
        <p className="text-xs text-stone-400 text-center px-4 leading-relaxed">
          Add stops in the inspector to build your itinerary map.
        </p>
      </div>
    )
  }

  if (isPinMode && data.pinLat == null) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-stone-50 gap-2">
        <span className="text-3xl">📍</span>
        <p className="text-xs text-stone-400 text-center px-4 leading-relaxed">
          Search for a location in the inspector to pin it on the map.
        </p>
      </div>
    )
  }

  if (!isPinMode && !isItinerary && routePoints.length === 0) {
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
        pinColor={data.pinColor ?? '#c0813a'}
        routeColor={data.routeColor ?? '#c0813a'}
        routeWeight={data.routeWeight ?? 2}
        showRoute={data.showRoute}
        showPins={data.showPins}
        singlePin={isPinMode}
        singlePinLat={data.pinLat}
        singlePinLng={data.pinLng}
        singlePinLabel={data.pinLabel}
        singlePinZoom={data.pinZoom ?? 13}
        itinerary={isItinerary}
        stops={stops}
      />
    </div>
  )
}
