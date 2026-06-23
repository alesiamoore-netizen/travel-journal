import { db } from '../db'
import { generateThumbnail } from './thumbnail'
import { GDRIVE_CLIENT_ID } from './driveSync'

const PHOTOS_SCOPE = 'https://www.googleapis.com/auth/photoslibrary.readonly'

export async function getPhotosToken() {
  if (!GDRIVE_CLIENT_ID) throw new Error('VITE_GDRIVE_CLIENT_ID not configured')
  // GIS may be loaded already (Drive sync); if not, wait for it
  if (!window.google?.accounts?.oauth2) {
    await new Promise((res, rej) => {
      const s = document.createElement('script')
      s.src = 'https://accounts.google.com/gsi/client'
      s.onload = res; s.onerror = () => rej(new Error('Failed to load GIS'))
      document.head.appendChild(s)
    })
  }
  return new Promise((resolve, reject) => {
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: GDRIVE_CLIENT_ID,
      scope: PHOTOS_SCOPE,
      callback: (resp) =>
        resp.error
          ? reject(new Error(resp.error_description ?? resp.error))
          : resolve(resp.access_token),
    })
    client.requestAccessToken()
  })
}

export async function listPhotos(token, pageToken = null) {
  const url = new URL('https://photoslibrary.googleapis.com/v1/mediaItems')
  url.searchParams.set('pageSize', '60')
  if (pageToken) url.searchParams.set('pageToken', pageToken)
  const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
  if (!r.ok) {
    const body = await r.json().catch(() => ({}))
    throw new Error(body.error?.message ?? `Photos API ${r.status}`)
  }
  const data = await r.json()
  const items = (data.mediaItems ?? []).filter(m => m.mimeType?.startsWith('image/'))
  return { items, next: data.nextPageToken ?? null }
}

export async function importGooglePhoto(mediaItem, notebookId) {
  // Deduplicate: if this Google Photo was already imported, reuse it
  const existing = await db.photos
    .where('notebookId').equals(notebookId)
    .filter(p => p.googlePhotosId === mediaItem.id)
    .first()
  if (existing) return existing

  // Download the photo (4096px max-width keeps quality high without fetching original)
  const r = await fetch(mediaItem.baseUrl + '=w4096')
  if (!r.ok) throw new Error(`Download failed ${r.status}`)
  const blob = await r.blob()

  const thumbnailBlob = await generateThumbnail(blob, 400)

  const meta = mediaItem.mediaMetadata ?? {}
  const photo = {
    id: crypto.randomUUID(),
    notebookId,
    filename: mediaItem.filename ?? 'photo.jpg',
    mimeType: blob.type || mediaItem.mimeType || 'image/jpeg',
    size: blob.size,
    blob,
    thumbnailBlob,
    uploadedAt: new Date().toISOString(),
    exif: { dateTaken: meta.creationTime ?? null },
    googlePhotosId: mediaItem.id,
  }

  await db.photos.add(photo)
  return photo
}
