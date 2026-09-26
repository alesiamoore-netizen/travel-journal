import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { firebaseStorage } from './config'

export async function uploadPhoto(blob, filename, uid, notebookId) {
  const { generateThumbnail, compressImage } = await import('../utils/thumbnail')
  const [thumbnailBlob, compressedBlob] = await Promise.all([
    generateThumbnail(blob, 400),
    compressImage(blob, 1600),
  ])

  const photoId = crypto.randomUUID()
  const origBlob = compressedBlob ?? blob
  const ext = 'jpg'

  const origRef = ref(firebaseStorage, `users/${uid}/photos/${photoId}.${ext}`)
  const thumbRef = ref(firebaseStorage, `users/${uid}/photos/${photoId}_thumb.jpg`)

  const [origSnap, thumbSnap] = await Promise.all([
    uploadBytes(origRef, origBlob, { contentType: 'image/jpeg' }),
    uploadBytes(thumbRef, thumbnailBlob, { contentType: 'image/jpeg' }),
  ])

  const [storageUrl, thumbnailUrl] = await Promise.all([
    getDownloadURL(origSnap.ref),
    getDownloadURL(thumbSnap.ref),
  ])

  return {
    id: photoId,
    notebookId,
    filename: filename || 'photo.jpg',
    mimeType: blob.type || 'image/jpeg',
    size: blob.size,
    storageUrl,
    thumbnailUrl,
    uploadedAt: new Date().toISOString(),
  }
}

export async function uploadAudio(blob, uid, notebookId, duration = 0) {
  const audioId = crypto.randomUUID()
  const ext = blob.type.includes('mp4') ? 'm4a' : 'webm'
  const audioRef = ref(firebaseStorage, `users/${uid}/audio/${audioId}.${ext}`)
  const snap = await uploadBytes(audioRef, blob, { contentType: blob.type || 'audio/webm' })
  const storageUrl = await getDownloadURL(snap.ref)
  return {
    id: audioId,
    notebookId,
    storageUrl,
    duration,
    uploadedAt: new Date().toISOString(),
  }
}
