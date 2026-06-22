import { db } from '../db'

export const GDRIVE_CLIENT_ID = import.meta.env.VITE_GDRIVE_CLIENT_ID ?? ''
const SCOPES = 'https://www.googleapis.com/auth/drive.file'
const FOLDER_NAME = 'Travel Journal Backup'
const MANIFEST_NAME = 'manifest.json'

// ── Auth ──────────────────────────────────────────────────────────────────────

function loadGIS() {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.oauth2) { resolve(); return }
    const s = document.createElement('script')
    s.src = 'https://accounts.google.com/gsi/client'
    s.onload = resolve
    s.onerror = () => reject(new Error('Failed to load Google Identity Services'))
    document.head.appendChild(s)
  })
}

export async function getAccessToken() {
  if (!GDRIVE_CLIENT_ID) throw new Error('VITE_GDRIVE_CLIENT_ID not configured')
  await loadGIS()
  return new Promise((resolve, reject) => {
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: GDRIVE_CLIENT_ID,
      scope: SCOPES,
      callback: (resp) => resp.error ? reject(new Error(resp.error)) : resolve(resp.access_token),
    })
    client.requestAccessToken()
  })
}

// ── Drive helpers ─────────────────────────────────────────────────────────────

async function driveGet(token, path, params = {}) {
  const url = new URL(`https://www.googleapis.com/drive/v3${path}`)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
  if (!r.ok) throw new Error(`Drive GET ${r.status}`)
  return r.json()
}

async function uploadFile(token, { parentId, fileId, name, mimeType, body }) {
  // body: Blob | string
  const blob = body instanceof Blob ? body : new Blob([body], { type: mimeType })
  const boundary = 'tj_' + Math.random().toString(36).slice(2)
  const meta = fileId
    ? JSON.stringify({ name })
    : JSON.stringify({ name, mimeType, parents: parentId ? [parentId] : [] })

  const encoder = new TextEncoder()
  const head = encoder.encode(
    `--${boundary}\r\nContent-Type: application/json\r\n\r\n${meta}\r\n` +
    `--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n`
  )
  const tail = encoder.encode(`\r\n--${boundary}--`)
  const fileBytes = await blob.arrayBuffer()
  const combined = new Uint8Array(head.byteLength + fileBytes.byteLength + tail.byteLength)
  combined.set(new Uint8Array(head), 0)
  combined.set(new Uint8Array(fileBytes), head.byteLength)
  combined.set(new Uint8Array(tail), head.byteLength + fileBytes.byteLength)

  const method = fileId ? 'PATCH' : 'POST'
  const urlPath = fileId
    ? `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart&fields=id,name`
    : `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name`

  const r = await fetch(urlPath, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body: combined,
  })
  if (!r.ok) throw new Error(`Upload failed ${r.status}`)
  return r.json()
}

async function getOrCreateFolder(token) {
  const existing = await driveGet(token, '/files', {
    q: `name='${FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: 'files(id)',
  })
  if (existing.files?.length) return existing.files[0].id

  const r = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: FOLDER_NAME, mimeType: 'application/vnd.google-apps.folder' }),
  })
  if (!r.ok) throw new Error('Failed to create backup folder')
  const f = await r.json()
  return f.id
}

async function listFolderFiles(token, folderId) {
  let files = []
  let pageToken = null
  do {
    const params = {
      q: `'${folderId}' in parents and trashed=false`,
      fields: 'nextPageToken, files(id,name)',
      pageSize: 1000,
    }
    if (pageToken) params.pageToken = pageToken
    const res = await driveGet(token, '/files', params)
    files = files.concat(res.files ?? [])
    pageToken = res.nextPageToken
  } while (pageToken)
  return files
}

async function downloadAsText(token, fileId) {
  const r = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!r.ok) throw new Error(`Download failed ${r.status}`)
  return r.text()
}

async function downloadAsBlob(token, fileId, mimeType) {
  const r = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!r.ok) throw new Error(`Download failed ${r.status}`)
  const buf = await r.arrayBuffer()
  return new Blob([buf], { type: mimeType ?? 'image/jpeg' })
}

// ── Thumbnail helpers ─────────────────────────────────────────────────────────

async function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result.split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

function base64ToBlob(b64, mimeType) {
  const bytes = atob(b64)
  const arr = new Uint8Array(bytes.length)
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i)
  return new Blob([arr], { type: mimeType ?? 'image/jpeg' })
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function backupToDrive(token, onProgress) {
  onProgress?.('Creating backup folder…', 0, 0)
  const folderId = await getOrCreateFolder(token)

  // Fetch all data
  const [notebooks, pages, pageElements, notes, photos] = await Promise.all([
    db.notebooks.toArray(),
    db.pages.toArray(),
    db.pageElements.toArray(),
    db.notes.toArray(),
    db.photos.toArray(),
  ])

  // List existing Drive files for differential photo upload
  onProgress?.('Checking existing backup…', 0, photos.length)
  const existing = await listFolderFiles(token, folderId)
  const existingMap = Object.fromEntries(existing.map(f => [f.name, f.id]))

  // Build manifest: structure + thumbnail base64 (thumbnails are small; full photos uploaded separately)
  onProgress?.('Building manifest…', 0, photos.length)
  const photoMeta = await Promise.all(photos.map(async (p) => ({
    id: p.id,
    notebookId: p.notebookId,
    filename: p.filename,
    mimeType: p.mimeType,
    size: p.size,
    uploadedAt: p.uploadedAt,
    exif: p.exif,
    thumbnailB64: p.thumbnailBlob ? await blobToBase64(p.thumbnailBlob) : null,
  })))

  const manifest = {
    version: 2,
    exportedAt: new Date().toISOString(),
    notebooks, pages, pageElements, notes,
    photos: photoMeta,
  }

  // Upload / update manifest
  const manifestId = existingMap[MANIFEST_NAME]
  await uploadFile(token, {
    fileId: manifestId,
    parentId: folderId,
    name: MANIFEST_NAME,
    mimeType: 'application/json',
    body: JSON.stringify(manifest),
  })

  // Upload photo blobs — skip ones already in Drive (differential sync)
  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i]
    const fileName = `photo-${photo.id}`
    onProgress?.(`Uploading photo ${i + 1} of ${photos.length}…`, i + 1, photos.length)

    if (!existingMap[fileName] && photo.blob) {
      await uploadFile(token, {
        parentId: folderId,
        name: fileName,
        mimeType: photo.mimeType ?? 'image/jpeg',
        body: photo.blob,
      })
    }
  }

  return manifest.exportedAt
}

export async function restoreFromDrive(token, onProgress) {
  onProgress?.('Finding backup folder…', 0, 0)

  const res = await driveGet(token, '/files', {
    q: `name='${FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: 'files(id)',
  })
  if (!res.files?.length) throw new Error('No backup found in Google Drive')
  const folderId = res.files[0].id

  // List all files in folder
  onProgress?.('Reading backup contents…', 0, 0)
  const files = await listFolderFiles(token, folderId)
  const fileMap = Object.fromEntries(files.map(f => [f.name, f.id]))

  if (!fileMap[MANIFEST_NAME]) throw new Error('Backup folder exists but manifest is missing')

  // Download manifest
  onProgress?.('Downloading journal data…', 0, 0)
  const json = await downloadAsText(token, fileMap[MANIFEST_NAME])
  const data = JSON.parse(json)
  if (!data.version) throw new Error('Invalid backup file')

  // Download photos
  const photoRecords = []
  const total = data.photos?.length ?? 0
  for (let i = 0; i < total; i++) {
    const pm = data.photos[i]
    onProgress?.(`Downloading photo ${i + 1} of ${total}…`, i + 1, total)

    const driveFileId = fileMap[`photo-${pm.id}`]
    const blob = driveFileId
      ? await downloadAsBlob(token, driveFileId, pm.mimeType)
      : null

    const thumbnailBlob = pm.thumbnailB64
      ? base64ToBlob(pm.thumbnailB64, 'image/jpeg')
      : null

    photoRecords.push({
      id: pm.id,
      notebookId: pm.notebookId,
      filename: pm.filename,
      mimeType: pm.mimeType,
      size: pm.size,
      uploadedAt: pm.uploadedAt,
      exif: pm.exif,
      blob,
      thumbnailBlob,
    })
  }

  // Restore everything
  onProgress?.('Restoring data…', total, total)
  await db.transaction('rw', [db.notebooks, db.pages, db.pageElements, db.notes, db.photos], async () => {
    await db.notebooks.clear()
    await db.pages.clear()
    await db.pageElements.clear()
    await db.notes.clear()
    await db.photos.clear()
    if (data.notebooks?.length) await db.notebooks.bulkAdd(data.notebooks)
    if (data.pages?.length) await db.pages.bulkAdd(data.pages)
    if (data.pageElements?.length) await db.pageElements.bulkAdd(data.pageElements)
    if (data.notes?.length) await db.notes.bulkAdd(data.notes)
    if (photoRecords.length) await db.photos.bulkAdd(photoRecords)
  })

  return data.exportedAt
}
