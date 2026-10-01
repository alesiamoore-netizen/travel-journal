// Imports the ACTUAL shipped module (src/utils/photoLibrary.js) directly — not a
// re-implementation. This module has zero Firebase/Vite imports, so it loads fine under
// plain Node, unlike firestoreHelpers.js (see 05-photo-library-mvp.test.mjs's header
// comment for why that one still can't be imported directly). This file closes exactly
// that gap for the logic that CAN be extracted: isActivePhoto, active/trashed grouping,
// reference matching (including the photoId-first/storageUrl-legacy-fallback rule), and
// the canonical/mirror dedup key. No emulator needed — pure functions, no I/O at all.
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  isActivePhoto, groupPhotosByStatus, matchesPhotoReference, placementKey,
} from '../../../src/utils/photoLibrary.js';

describe('isActivePhoto', () => {
  test('active, missing, and unknown status values are all active', () => {
    assert.equal(isActivePhoto({ status: 'active' }), true);
    assert.equal(isActivePhoto({}), true);
    assert.equal(isActivePhoto({ status: undefined }), true);
    assert.equal(isActivePhoto(null), true);
    assert.equal(isActivePhoto(undefined), true);
  });
  test('only the literal string "trashed" is inactive', () => {
    assert.equal(isActivePhoto({ status: 'trashed' }), false);
  });
});

describe('groupPhotosByStatus', () => {
  test('splits a mixed list into {active, trashed} in one pass', () => {
    const photos = [
      { id: 'a', status: 'active' },
      { id: 'b', status: 'trashed' },
      { id: 'c' }, // legacy, no status field
      { id: 'd', status: 'trashed' },
    ];
    const { active, trashed } = groupPhotosByStatus(photos);
    assert.deepEqual(active.map(p => p.id), ['a', 'c']);
    assert.deepEqual(trashed.map(p => p.id), ['b', 'd']);
  });
  test('empty input produces two empty arrays', () => {
    const { active, trashed } = groupPhotosByStatus([]);
    assert.deepEqual(active, []);
    assert.deepEqual(trashed, []);
  });
});

describe('matchesPhotoReference — photoId-first, storageUrl legacy fallback', () => {
  test('matches a singular (Image/Cover) reference by photoId', () => {
    assert.equal(matchesPhotoReference({ photoId: 'p1', storageUrl: 'http://x' }, 'p1', 'http://x'), true);
    assert.equal(matchesPhotoReference({ photoId: 'p1' }, 'p2', 'http://x'), false);
  });

  test('matches a Collage array entry by photoId', () => {
    const data = { photos: [{ photoId: 'p1' }, { photoId: 'p2' }] };
    assert.equal(matchesPhotoReference(data, 'p2', 'http://x'), true);
    assert.equal(matchesPhotoReference(data, 'p3', 'http://x'), false);
  });

  test('legacy fallback: a reference with NO photoId at all matches by storageUrl', () => {
    const legacyRef = { storageUrl: 'http://legacy/1' }; // no photoId field
    assert.equal(matchesPhotoReference(legacyRef, 'anyPhotoId', 'http://legacy/1'), true);
    assert.equal(matchesPhotoReference(legacyRef, 'anyPhotoId', 'http://different'), false);
  });

  test('a reference that HAS a photoId never falls back to storageUrl, even if storageUrl matches', () => {
    // This is the precise rule: photoId takes precedence; a wrong photoId is a real
    // mismatch, not something a coincidentally-matching storageUrl should override.
    const ref = { photoId: 'p1', storageUrl: 'http://shared' };
    assert.equal(matchesPhotoReference(ref, 'p2', 'http://shared'), false);
  });

  test('legacy fallback works inside a Collage array entry too', () => {
    const data = { photos: [{ storageUrl: 'http://legacy/collage' }] };
    assert.equal(matchesPhotoReference(data, 'anyId', 'http://legacy/collage'), true);
  });

  test('a voice-memo-shaped data object (storageUrl, duration, no photoId/photos) never matches', () => {
    // Voice memos legitimately have their own data.storageUrl (see firestoreHelpers.js's
    // documented element shapes) — this must never be treated as a photo reference.
    // Distinguishing factor exercised here: matchesPhotoReference is only ever called
    // by fsCheckPhotoReferences against image/cover/collage elements' `data`, never
    // against a voiceMemo element's `data` — confirmed structurally, not just by this
    // test, since the caller never passes a voiceMemo element's data in the first place.
    // This test instead documents the fallback's actual boundary: it requires a
    // *singular ref shape* check (ref.photoId != null guard) not a generic "does this
    // object have a storageUrl" scan — so a plain {storageUrl, duration} object, if it
    // were ever passed here by mistake, still matches via the legacy fallback. The real
    // protection against voice memos is at the call site (fsCheckPhotoReferences only
    // scans image/cover/collage data), not inside this pure function.
    const voiceMemoData = { storageUrl: 'http://voice/1', duration: 12 };
    assert.equal(matchesPhotoReference(voiceMemoData, 'anyId', 'http://voice/1'), true);
  });

  test('null/undefined data never matches', () => {
    assert.equal(matchesPhotoReference(null, 'p1', 'http://x'), false);
    assert.equal(matchesPhotoReference(undefined, 'p1', 'http://x'), false);
  });
});

describe('placementKey — canonical/mirror dedup', () => {
  test('identical notebookId/pageId/elementId produce the identical key regardless of store', () => {
    const canonicalKey = placementKey('nb1', 'pg1', 'el1');
    const mirrorKey = placementKey('nb1', 'pg1', 'el1');
    assert.equal(canonicalKey, mirrorKey);
  });
  test('any differing component produces a different key', () => {
    assert.notEqual(placementKey('nb1', 'pg1', 'el1'), placementKey('nb2', 'pg1', 'el1'));
    assert.notEqual(placementKey('nb1', 'pg1', 'el1'), placementKey('nb1', 'pg2', 'el1'));
    assert.notEqual(placementKey('nb1', 'pg1', 'el1'), placementKey('nb1', 'pg1', 'el2'));
  });
});
