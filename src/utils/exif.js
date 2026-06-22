import * as exifr from 'exifr'

export async function extractExif(file) {
  try {
    const data = await exifr.parse(file, { gps: true, tiff: true, exif: true })
    if (!data) return emptyExif()
    return {
      dateTaken:   data.DateTimeOriginal?.toISOString?.() ?? null,
      lat:         data.latitude  ?? null,
      lng:         data.longitude ?? null,
      altitude:    data.GPSAltitude ?? null,
      cameraModel: data.Model ?? null,
      locationName: null,
    }
  } catch {
    return emptyExif()
  }
}

function emptyExif() {
  return { dateTaken: null, lat: null, lng: null, altitude: null, cameraModel: null, locationName: null }
}

export async function reverseGeocode(lat, lng) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=en`
    const res = await fetch(url, { headers: { 'User-Agent': 'TravelJournalApp/1.0' } })
    if (!res.ok) return null
    const data = await res.json()
    const parts = (data.display_name ?? '').split(',')
    if (parts.length >= 2) {
      return `${parts[0].trim()}, ${parts[parts.length - 1].trim()}`
    }
    return data.display_name ?? null
  } catch {
    return null
  }
}
