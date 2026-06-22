import { db } from '../db'

export async function buildRoute(notebookId) {
  const photos = await db.photos.where('notebookId').equals(notebookId).toArray()

  return photos
    .filter(p => p.exif?.lat != null && p.exif?.lng != null)
    .sort((a, b) => {
      const da = a.exif.dateTaken ?? a.uploadedAt
      const db2 = b.exif.dateTaken ?? b.uploadedAt
      return da < db2 ? -1 : da > db2 ? 1 : 0
    })
    .map(p => ({
      id: p.id,
      lat: p.exif.lat,
      lng: p.exif.lng,
      label: p.exif.locationName ?? null,
      date: p.exif.dateTaken ?? p.uploadedAt,
    }))
}
