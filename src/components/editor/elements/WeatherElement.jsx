import { useState } from 'react'
import { useEditorStore } from '../../../store/editorStore'

const WMO = {
  0:  { icon: '☀️', desc: 'Clear sky' },
  1:  { icon: '🌤️', desc: 'Mainly clear' },
  2:  { icon: '⛅', desc: 'Partly cloudy' },
  3:  { icon: '☁️', desc: 'Overcast' },
  45: { icon: '🌫️', desc: 'Fog' },
  48: { icon: '🌫️', desc: 'Icy fog' },
  51: { icon: '🌦️', desc: 'Light drizzle' },
  53: { icon: '🌧️', desc: 'Drizzle' },
  55: { icon: '🌧️', desc: 'Heavy drizzle' },
  61: { icon: '🌧️', desc: 'Light rain' },
  63: { icon: '🌧️', desc: 'Moderate rain' },
  65: { icon: '🌧️', desc: 'Heavy rain' },
  71: { icon: '🌨️', desc: 'Light snow' },
  73: { icon: '🌨️', desc: 'Moderate snow' },
  75: { icon: '❄️', desc: 'Heavy snow' },
  77: { icon: '🌨️', desc: 'Snow grains' },
  80: { icon: '🌦️', desc: 'Light showers' },
  81: { icon: '🌧️', desc: 'Showers' },
  82: { icon: '⛈️', desc: 'Heavy showers' },
  85: { icon: '🌨️', desc: 'Snow showers' },
  86: { icon: '❄️', desc: 'Heavy snow showers' },
  95: { icon: '⛈️', desc: 'Thunderstorm' },
  96: { icon: '⛈️', desc: 'Thunderstorm + hail' },
  99: { icon: '⛈️', desc: 'Heavy thunderstorm' },
}

function wmoLookup(code) {
  const keys = Object.keys(WMO).map(Number).sort((a, b) => a - b)
  const match = [...keys].reverse().find(k => k <= code)
  return WMO[match] ?? { icon: '🌡️', desc: 'Unknown' }
}

export default function WeatherElement({ element }) {
  const { data } = element
  const { updateElement, notebook } = useEditorStore()
  const accent = notebook?.theme?.accentColor ?? '#c0813a'

  const [locInput, setLocInput] = useState(data.location || '')
  const [dateInput, setDateInput] = useState(data.date || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const update = patch => updateElement(element.id, { data: { ...data, ...patch } })

  const fetchWeather = async () => {
    const loc = locInput.trim()
    const date = dateInput.trim()
    if (!loc || !date) return
    setLoading(true)
    setError('')
    try {
      const geoRes = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(loc)}&count=1&language=en&format=json`
      )
      const geoData = await geoRes.json()
      if (!geoData.results?.length) throw new Error(`"${loc}" not found`)
      const { latitude, longitude, name, country } = geoData.results[0]

      const wxRes = await fetch(
        `https://archive-api.open-meteo.com/v1/archive?latitude=${latitude}&longitude=${longitude}&start_date=${date}&end_date=${date}&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto`
      )
      const wxData = await wxRes.json()
      if (!wxData.daily?.weathercode?.length) throw new Error('No weather data for that date')

      update({
        location: loc,
        date,
        weatherData: {
          locationName: `${name}, ${country}`,
          lat: latitude,
          lng: longitude,
          date,
          maxTemp: wxData.daily.temperature_2m_max[0],
          minTemp: wxData.daily.temperature_2m_min[0],
          code: wxData.daily.weathercode[0],
        },
      })
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  if (data.weatherData) {
    const { locationName, maxTemp, minTemp, code, date } = data.weatherData
    const { icon, desc } = wmoLookup(code)
    const imperial = data.units === 'imperial'
    const toF = c => Math.round(c * 9 / 5 + 32)
    const hi = imperial ? `${toF(maxTemp)}°F` : `${Math.round(maxTemp)}°C`
    const lo = imperial ? `${toF(minTemp)}°F` : `${Math.round(minTemp)}°C`
    const dateStr = new Date(date + 'T12:00:00').toLocaleDateString('en-US', {
      weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
    })

    return (
      <div
        className="h-full w-full flex items-center gap-3 px-4 py-3 overflow-hidden"
        style={{ backgroundColor: `${accent}0d` }}
      >
        <div className="text-4xl flex-shrink-0 leading-none">{icon}</div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold truncate" style={{ color: accent }}>{locationName}</p>
          <p className="text-[10px] text-stone-400 mb-1">{dateStr}</p>
          <p className="font-bold leading-none" style={{ fontSize: '1.1rem', color: '#1a1a1a' }}>
            {hi} <span className="font-normal text-stone-400" style={{ fontSize: '0.85rem' }}>/ {lo}</span>
          </p>
          <p className="text-xs text-stone-500 mt-0.5">{desc}</p>
        </div>
      </div>
    )
  }

  return (
    <div
      className="h-full w-full flex flex-col items-center justify-center gap-2 p-3"
      style={{ border: `1px dashed ${accent}40` }}
    >
      <p className="text-[10px] font-medium uppercase tracking-wide text-stone-400">Weather</p>
      <input
        type="text"
        value={locInput}
        onChange={e => setLocInput(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && fetchWeather()}
        placeholder="City or place…"
        className="w-full border border-stone-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-amber-400"
        onClick={e => e.stopPropagation()}
      />
      <input
        type="date"
        value={dateInput}
        onChange={e => setDateInput(e.target.value)}
        className="w-full border border-stone-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-amber-400"
        onClick={e => e.stopPropagation()}
      />
      <button
        onClick={e => { e.stopPropagation(); fetchWeather() }}
        disabled={loading || !locInput || !dateInput}
        className="w-full py-1.5 text-xs font-semibold rounded text-white disabled:opacity-40 transition-colors"
        style={{ backgroundColor: accent }}
      >
        {loading ? 'Fetching…' : 'Get Weather'}
      </button>
      {error && <p className="text-[9px] text-red-500 text-center leading-snug">{error}</p>}
    </div>
  )
}
