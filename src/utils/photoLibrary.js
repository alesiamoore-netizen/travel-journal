// Pure, Firebase-free logic for the owner-only Photo Library MVP. No Firestore/Storage
// imports here on purpose — this is what makes the module importable directly by both
// the shipped app (via firestoreHelpers.js) and by plain Node tests, closing the gap
// where earlier tests could only re-implement this logic rather than import it.

// Legacy documents (uploaded before this release) have no `status` field at all.
// Treating anything other than the literal string 'trashed' as active means every
// existing photo remains fully visible with zero backfill, zero migration script, and
// zero write to any existing document.
export function isActivePhoto(photo) {
  return photo?.status !== 'trashed';
}

// Splits a flat list of photo documents into { active, trashed } in one pass.
export function groupPhotosByStatus(photos) {
  const active = [];
  const trashed = [];
  for (const photo of photos) {
    (isActivePhoto(photo) ? active : trashed).push(photo);
  }
  return { active, trashed };
}

// Only image/cover/collage elements can carry a photo reference at all. Callers MUST
// check this before calling matchesPhotoReference on an element's `data` — the
// storageUrl legacy fallback below matches by URL alone when photoId is absent, and a
// voiceMemo element also has a bare `data.storageUrl` (its own, unrelated audio URL).
// Without this guard, a voice memo could theoretically be mismatched as a photo
// reference; with it, a voice memo's data is never even considered.
export function isPhotoBearingType(type) {
  return type === 'image' || type === 'cover' || type === 'collage'
}

// Image/Cover elements store a singular photo reference; Collage elements store an
// array of the same shape under `data.photos`. Matches by `photoId` first; falls back
// to a `storageUrl` match only when the stored reference has no `photoId` at all (an
// older record predating that field) — never a generic storageUrl scan. Callers must
// pair this with isPhotoBearingType (above) to keep voice-memo elements excluded.
export function matchesPhotoReference(data, photoId, storageUrl) {
  if (!data) return false;
  if (Array.isArray(data.photos)) {
    return data.photos.some(p => matchesSingularPhotoRef(p, photoId, storageUrl));
  }
  return matchesSingularPhotoRef(data, photoId, storageUrl);
}

function matchesSingularPhotoRef(ref, photoId, storageUrl) {
  if (!ref) return false;
  if (ref.photoId != null) return ref.photoId === photoId;
  // Legacy fallback: only reached when this specific reference has no photoId at all.
  return !!storageUrl && ref.storageUrl === storageUrl;
}

// Canonical and mirror copies of the same logical element share the same id (per
// collab.js's pushElement, which writes journals/{notebookId}/elements/{element.id}
// using the source element's own id). A dedup key identifies one logical placement
// regardless of which store it was found in.
export function placementKey(notebookId, pageId, elementId) {
  return `${notebookId}:${pageId}:${elementId}`;
}
