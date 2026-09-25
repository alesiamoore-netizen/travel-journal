import { useEffect } from 'react'
import { MapContainer, TileLayer, Polyline, CircleMarker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

export const TILE_STYLES = {
  minimal: {
    label: 'Minimal',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://carto.com">CartoDB</a> &copy; <a href="https://openstreetmap.org">OSM</a>',
  },
  voyager: {
    label: 'Voyager',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://carto.com">CartoDB</a> &copy; <a href="https://openstreetmap.org">OSM</a>',
  },
  street: {
    label: 'Street',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>',
  },
  satellite: {
    label: 'Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; <a href="https://www.esri.com">Esri</a>',
    subdomains: '',
    maxZoom: 18,
  },
  dark: {
    label: 'Dark',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://carto.com">CartoDB</a> &copy; <a href="https://openstreetmap.org">OSM</a>',
  },
}

function MapFitter({ routePoints }) {
  const map = useMap()
  useEffect(() => {
    if (routePoints.length === 0) return
    if (routePoints.length === 1) {
      map.setView([routePoints[0].lat, routePoints[0].lng], 12)
      return
    }
    const bounds = L.latLngBounds(routePoints.map(p => [p.lat, p.lng]))
    map.fitBounds(bounds, { padding: [24, 24] })
  }, [routePoints, map])
  return null
}

function PinFitter({ lat, lng, zoom }) {
  const map = useMap()
  useEffect(() => {
    if (lat != null && lng != null) map.setView([lat, lng], zoom ?? 13)
  }, [lat, lng, zoom, map])
  return null
}

function MapInvalidator() {
  const map = useMap()
  useEffect(() => {
    // Leaflet needs a size invalidation when mounted inside flex/grid containers
    const t = setTimeout(() => map.invalidateSize(), 60)
    return () => clearTimeout(t)
  }, [map])
  return null
}

function ItineraryFitter({ stops }) {
  const map = useMap()
  useEffect(() => {
    if (!stops.length) return
    if (stops.length === 1) { map.setView([stops[0].lat, stops[0].lng], 10); return }
    const bounds = L.latLngBounds(stops.map(s => [s.lat, s.lng]))
    map.fitBounds(bounds, { padding: [24, 24] })
  }, [stops, map])
  return null
}

export default function RouteMap({
  routePoints = [],
  tileStyle = 'minimal',
  pinColor = '#c0813a',
  routeColor = '#c0813a',
  routeWeight = 2,
  showRoute = true,
  showPins = true,
  scrollWheelZoom = false,
  singlePin = false,
  singlePinLat = null,
  singlePinLng = null,
  singlePinLabel = '',
  singlePinZoom = 13,
  itinerary = false,
  stops = [],
}) {
  const tile = TILE_STYLES[tileStyle] ?? TILE_STYLES.minimal
  const latlngs = routePoints.map(p => [p.lat, p.lng])
  const stopLatlngs = stops.map(s => [s.lat, s.lng])

  return (
    <MapContainer
      center={[20, 0]}
      zoom={2}
      style={{ height: '100%', width: '100%' }}
      scrollWheelZoom={scrollWheelZoom}
    >
      {itinerary
        ? <ItineraryFitter stops={stops} />
        : singlePin
          ? <PinFitter lat={singlePinLat} lng={singlePinLng} zoom={singlePinZoom} />
          : <MapFitter routePoints={routePoints} />
      }
      <MapInvalidator />
      <TileLayer
        url={tile.url}
        attribution={tile.attribution}
        subdomains={tile.subdomains ?? 'abc'}
        maxZoom={tile.maxZoom ?? 19}
      />
      {/* Itinerary mode: numbered stops + connecting line */}
      {itinerary && stopLatlngs.length >= 2 && (
        <Polyline positions={stopLatlngs} color={routeColor} weight={routeWeight + 1} opacity={0.65} dashArray="4 6" />
      )}
      {itinerary && stops.map((stop, i) => (
        <CircleMarker key={stop.id} center={[stop.lat, stop.lng]} radius={9} color="#fff" fillColor={pinColor} fillOpacity={1} weight={2}>
          <Popup><p style={{ fontWeight: 600, margin: 0, fontSize: 13 }}>{i + 1}. {stop.label}</p></Popup>
        </CircleMarker>
      ))}
      {/* Route mode */}
      {!itinerary && !singlePin && showRoute && latlngs.length >= 2 && (
        <Polyline positions={latlngs} color={routeColor} weight={routeWeight} opacity={0.75} dashArray="5 8" />
      )}
      {!itinerary && !singlePin && showPins && routePoints.map((pt, i) => (
        <CircleMarker
          key={pt.id}
          center={[pt.lat, pt.lng]}
          radius={i === 0 || i === routePoints.length - 1 ? 8 : 6}
          color="#fff"
          fillColor={pinColor}
          fillOpacity={1}
          weight={2}
        >
          <Popup>
            <div style={{ minWidth: 120 }}>
              <p style={{ fontWeight: 600, margin: '0 0 2px', fontSize: 13 }}>{pt.label ?? 'Location'}</p>
              <p style={{ color: '#78716c', margin: 0, fontSize: 11 }}>
                {new Date(pt.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
              </p>
            </div>
          </Popup>
        </CircleMarker>
      ))}
      {/* Single pin mode */}
      {!itinerary && singlePin && singlePinLat != null && singlePinLng != null && (
        <CircleMarker center={[singlePinLat, singlePinLng]} radius={10} color="#fff" fillColor={pinColor} fillOpacity={1} weight={2.5}>
          {singlePinLabel && <Popup><p style={{ fontWeight: 600, margin: 0, fontSize: 13 }}>{singlePinLabel}</p></Popup>}
        </CircleMarker>
      )}
    </MapContainer>
  )
}
