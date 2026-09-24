import { db } from '../db'
import { generateThumbnail } from './thumbnail'
import { GDRIVE_CLIENT_ID } from './driveSync'

const DRIVE_READONLY_SCOPE = 'https://www.googleapis.com/auth/drive.readonly'

export async function getDriveReadToken() {
  if (!GDRIVE_CLIENT_ID) throw new Error('VITE_GDRIVE_CLIENT_ID not configured')
  if (!window.google?.accounts?.oauth2) {
    await new Promise((res, rej) => {
      const s = document.createElement('script')
      s.src = 'https://accounts.google.com/gsi/client'
      s.onload = res
      s.onerror = () => rej(new Error('Failed to load Google Identity Services'))
      document.head.appendChild(s)
    })
  }
  return new Promise((resolve, reject) => {
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: GDRIVE_CLIENT_ID,
      scope: DRIVE_READONLY_SCOPE,
      callback: (resp) =>
        resp.error
          ? reject(new Error(resp.error_description ?? resp.error))
          : resolve(resp.access_token),
    })
    client.requestAccessToken()
  })
}

export async function listDrivePhotos(token, pageToken = null) {
  const params = new URLSearchParams({
    q: "mimeType contains 'image/' and trashed = false",
    fields: 'nextPageToken,files(id,name,mimeType,thumbnailLink,createdTime)',
    orderBy: 'createdTime desc',
    pageSize: '60',
  })
  if (pageToken) params.set('pageToken', pageToken)

  const r = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!r.ok) {
    const body = await r.json().catch(() => ({}))
    throw new Error(body.error?.message ?? `Drive API ${r.status}`)
  }
  const data = await r.json()
  return { items: data.files ?? [], next: data.nextPageToken ?? null }
}

export async function importDrivePhoto(file, token, notebookId) {
  const existing = await db.photos
    .where('notebookId').equals(notebookId)
    .filter(p => p.driveFileId === file.id)
    .first()
  if (existing) return existing

  const r = await fetch(`https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!r.ok) throw new Error(`Download failed ${r.status}`)
  const blob = await r.blob()
  const thumbnailBlob = await generateThumbnail(blob, 400)

  const photo = {
    id: crypto.randomUUID(),
    notebookId,
    filename: file.name ?? 'photo.jpg',
    mimeType: blob.type || file.mimeType || 'image/jpeg',
    size: blob.size,
    blob,
    thumbnailBlob,
    uploadedAt: new Date().toISOString(),
    exif: { dateTaken: file.createdTime ?? null },
    driveFileId: file.id,
  }

  await db.photos.add(photo)
  return photo
}
