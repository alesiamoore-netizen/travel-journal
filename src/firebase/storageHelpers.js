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
