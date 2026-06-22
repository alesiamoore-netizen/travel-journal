import { db } from '../db'

export const GDRIVE_CLIENT_ID = import.meta.env.VITE_GDRIVE_CLIENT_ID ?? ''
const SCOPES = 'https://www.googleapis.com/auth/drive.file'
const BACKUP_FILENAME = 'travel-journal-backup.json'

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

async function findBackupFile(token) {
  const url = new URL('https://www.googleapis.com/drive/v3/files')
  url.searchParams.set('q', `name='${BACKUP_FILENAME}' and trashed=false`)
  url.searchParams.set('fields', 'files(id,name,modifiedTime)')
  const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
  if (!r.ok) throw new Error(`Drive API ${r.status}`)
  const data = await r.json()
  return data.files?.[0] ?? null
}

async function multipartUpload(token, method, path, metadata, jsonBody) {
  const boundary = 'tj_boundary_' + Date.now()
  const metaPart = `--${boundary}\r\nContent-Type: application/json\r\n\r\n${JSON.stringify(metadata)}\r\n`
  const filePart = `--${boundary}\r\nContent-Type: application/json\r\n\r\n${jsonBody}\r\n--${boundary}--`
  const body = metaPart + filePart
  const r = await fetch(`https://www.googleapis.com/upload/drive/v3${path}?uploadType=multipart`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body,
  })
  if (!r.ok) throw new Error(`Upload failed ${r.status}`)
  return r.json()
}

export async function exportToJson() {
  const [notebooks, pages, pageElements] = await Promise.all([
    db.notebooks.toArray(),
    db.pages.toArray(),
    db.pageElements.toArray(),
  ])
  return JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), notebooks, pages, pageElements })
}

export async function importFromJson(json) {
  const data = JSON.parse(json)
  if (!data.version) throw new Error('Invalid backup file')
  await db.transaction('rw', [db.notebooks, db.pages, db.pageElements], async () => {
    await db.notebooks.clear()
    await db.pages.clear()
    await db.pageElements.clear()
    if (data.notebooks?.length) await db.notebooks.bulkAdd(data.notebooks)
    if (data.pages?.length) await db.pages.bulkAdd(data.pages)
    if (data.pageElements?.length) await db.pageElements.bulkAdd(data.pageElements)
  })
}

export async function backupToDrive(token) {
  const json = await exportToJson()
  const existing = await findBackupFile(token)
  if (existing) {
    await multipartUpload(token, 'PATCH', `/files/${existing.id}`, { name: BACKUP_FILENAME }, json)
  } else {
    await multipartUpload(token, 'POST', '/files', { name: BACKUP_FILENAME, mimeType: 'application/json' }, json)
  }
}

export async function restoreFromDrive(token) {
  const file = await findBackupFile(token)
  if (!file) throw new Error('No backup found in Google Drive')
  const r = await fetch(`https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!r.ok) throw new Error('Download failed')
  await importFromJson(await r.text())
  return file.modifiedTime
}
