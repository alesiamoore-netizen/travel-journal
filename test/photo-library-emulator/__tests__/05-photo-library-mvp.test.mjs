// Photo Library MVP (owner-only trash/restore) — behavior tests, run against the local
// Firestore emulator with the REAL, CURRENTLY DEPLOYED production rules loaded (verbatim
// copy at ../rules/firestore.current-production.rules, via ../fixtures/testEnvCurrentProd.mjs)
// — never real Firebase data. Each operation runs through an AUTHENTICATED client context,
// not an Admin-bypass — because every one of these operations is a real, signed-in CLIENT
// SDK call in the shipped app, and this plan's own claim ("current rules already permit
// everything this MVP needs, zero rule changes") is exactly what running through the
// real, live rules verifies, rather than assumes.
//
// WHY this file does not literally `import` src/firebase/firestoreHelpers.js:
// that module imports src/firebase/config.js, which reads `import.meta.env.VITE_*` —
// a Vite build-time substitution with no meaning under plain `node` (confirmed directly:
// `import.meta.env` is undefined under plain Node, so the first line of config.js throws
// a TypeError). Two real fixes were evaluated and rejected as disproportionate to a small
// MVP: Node's `--experimental-test-module-mocks` (confirmed, by direct testing, not to
// intercept a nested relative import the way needed here — an experimental, unstable
// API) and a custom source-rewriting ESM loader (real new infrastructure, not justified
// for this release).
//
// What IS imported directly, for real: src/utils/photoLibrary.js — the pure decision
// logic (isActivePhoto, groupPhotosByStatus, matchesPhotoReference, isPhotoBearingType,
// placementKey) has zero Firebase/Vite imports and loads fine under plain Node. Every
// function below that re-implements a firestoreHelpers.js export now re-implements only
// the Firestore I/O *wrapper* around that real, imported logic — not the logic itself.
// The residual, explicitly acknowledged gap is narrower than before: only the wiring
// (which query, which collection path) is re-implemented, not the decision logic (what
// counts as active, what counts as a match, what counts as a duplicate). See
// 06-photo-library-pure-logic.test.mjs for direct tests of the real module, and the
// verification report for this gap stated plainly.
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import {
  collection, doc, setDoc, updateDoc, getDoc, getDocs, query, where, writeBatch,
} from 'firebase/firestore';
import { getCurrentProdRulesTestEnv } from '../fixtures/testEnvCurrentProd.mjs';
import {
  isActivePhoto, groupPhotosByStatus, matchesPhotoReference, isPhotoBearingType, placementKey,
} from '../../../src/utils/photoLibrary.js';

let env;
before(async () => { env = await getCurrentProdRulesTestEnv(); });
after(async () => { await env.cleanup(); });

function dbFor(uid) { return env.authenticatedContext(uid).firestore(); }
function userCol(db, uid, col) { return collection(db, 'users', uid, col); }
function userDoc(db, uid, col, id) { return doc(db, 'users', uid, col, id); }

// ── Mirrors firestoreHelpers.js:231-234 (fsLoadPhotos) and the new fsLoadAllPhotos /
// fsSavePhoto / fsTrashPhoto / fsRestorePhoto / fsCheckPhotoReferences added to that
// file in this release — using the REAL imported isActivePhoto/matchesPhotoReference/
// isPhotoBearingType/placementKey throughout, so only the Firestore I/O wrapper is
// re-implemented here, not the decision logic. Each takes `db` explicitly (an
// authenticated client context) rather than a module-level singleton, since this test
// exercises real rules under a real identity. ──────────────────────────────────────

async function fsLoadPhotos(db, uid, notebookId) {
  const snap = await getDocs(query(userCol(db, uid, 'photos'), where('notebookId', '==', notebookId)));
  return snap.docs.map(d => d.data()).filter(isActivePhoto);
}

async function fsLoadAllPhotos(db, uid) {
  const snap = await getDocs(userCol(db, uid, 'photos'));
  return snap.docs.map(d => d.data()).filter(isActivePhoto);
}

async function fsLoadPhotoLibrary(db, uid) {
  const snap = await getDocs(userCol(db, uid, 'photos'));
  return groupPhotosByStatus(snap.docs.map(d => d.data()));
}

async function fsSavePhoto(db, uid, photo) {
  await setDoc(userDoc(db, uid, 'photos', photo.id), { ...photo, status: 'active', trashedAt: null, uploadedByUid: uid });
}

async function fsTrashPhoto(db, uid, photoId) {
  await updateDoc(userDoc(db, uid, 'photos', photoId), { status: 'trashed', trashedAt: new Date().toISOString() });
}

async function fsRestorePhoto(db, uid, photoId) {
  await updateDoc(userDoc(db, uid, 'photos', photoId), { status: 'active', trashedAt: null });
}

async function fsLoadNotebooks(db, uid) {
  const snap = await getDocs(userCol(db, uid, 'notebooks'));
  return snap.docs.map(d => d.data());
}

async function fsLoadPublicNotebook(db, notebookId) {
  const snap = await getDoc(doc(db, 'public_notebooks', notebookId));
  return snap.exists() ? snap.data() : null;
}

async function fsCheckPhotoReferences(db, uid, photoId, storageUrl) {
  const notebooks = await fsLoadNotebooks(db, uid);
  const notebookById = new Map(notebooks.map(n => [n.id, n]));
  const locations = [];
  const seen = new Set();

  const canonicalSnap = await getDocs(userCol(db, uid, 'elements'));
  canonicalSnap.docs.forEach(d => {
    const el = d.data();
    if (isPhotoBearingType(el.type) && matchesPhotoReference(el.data, photoId, storageUrl)) {
      const key = placementKey(el.notebookId, el.pageId, el.id);
      if (!seen.has(key)) {
        seen.add(key);
        locations.push({ type: 'element', notebookId: el.notebookId, notebookName: notebookById.get(el.notebookId)?.name ?? el.notebookId, pageId: el.pageId });
      }
    }
  });

  for (const nb of notebooks) {
    const mirrorSnap = await getDocs(collection(db, 'journals', nb.id, 'elements'));
    mirrorSnap.docs.forEach(d => {
      const el = d.data();
      if (isPhotoBearingType(el.type) && matchesPhotoReference(el.data, photoId, storageUrl)) {
        const key = placementKey(nb.id, el.pageId, el.id);
        if (!seen.has(key)) {
          seen.add(key);
          locations.push({ type: 'element', notebookId: nb.id, notebookName: nb.name, pageId: el.pageId });
        }
      }
    });
  }

  notebooks.forEach(nb => {
    if (nb.coverPhotoUrl && nb.coverPhotoUrl === storageUrl) {
      locations.push({ type: 'cover', notebookId: nb.id, notebookName: nb.name });
    }
  });

  for (const nb of notebooks.filter(n => n.isPublic)) {
    const snapshot = await fsLoadPublicNotebook(db, nb.id);
    if (!snapshot) continue;
    if (snapshot.coverPhotoUrl && snapshot.coverPhotoUrl === storageUrl) {
      locations.push({ type: 'public-cover', notebookId: nb.id, notebookName: nb.name });
    }
    for (const page of (snapshot.pages ?? [])) {
      for (const el of (page.elements ?? [])) {
        if (isPhotoBearingType(el.type) && matchesPhotoReference(el.data, photoId, storageUrl)) {
          locations.push({ type: 'public-element', notebookId: nb.id, notebookName: nb.name, pageId: page.id });
        }
      }
    }
  }
  return locations;
}

// ── Mirrors firestoreHelpers.js:31-45 (fsDeleteNotebook), post-fix: the `photos`
// cascade removed, every other line unchanged. ─────────────────────────────────────
async function fsDeleteNotebook(db, uid, notebookId) {
  const batch = writeBatch(db);
  const pages = await getDocs(query(userCol(db, uid, 'pages'), where('notebookId', '==', notebookId)));
  pages.docs.forEach(d => batch.delete(d.ref));
  const elements = await getDocs(query(userCol(db, uid, 'elements'), where('notebookId', '==', notebookId)));
  elements.docs.forEach(d => batch.delete(d.ref));
  batch.delete(userDoc(db, uid, 'notebooks', notebookId));
  await batch.commit();
}

const OWNER = 'owner1';

// Writes that need to bypass rules purely to seed cross-store state no single
// authenticated client could legitimately write directly in one step today (the
// mirror and public_notebooks docs are Admin/trusted-operation-written in the real app
// — see collab.js's pushJournal/pushElement and fsPublishShare). Seeding, not the
// behavior under test.
async function seedAdmin(fn) {
  await env.withSecurityRulesDisabled(async (ctx) => fn(ctx.firestore()));
}

describe('fsDeleteNotebook — photo documents survive; everything else behaves exactly as before', () => {
  before(() => env.clearFirestore());

  test('photos are NOT deleted when their journal is deleted (the core regression test)', async () => {
    const db = dbFor(OWNER);
    await setDoc(userDoc(db, OWNER, 'notebooks', 'nbA'), { id: 'nbA', name: 'Trip A' });
    await setDoc(userDoc(db, OWNER, 'pages', 'pgA'), { id: 'pgA', notebookId: 'nbA' });
    await setDoc(userDoc(db, OWNER, 'elements', 'elA'), { id: 'elA', notebookId: 'nbA', pageId: 'pgA', type: 'image', data: {} });
    await fsSavePhoto(db, OWNER, { id: 'phA', notebookId: 'nbA', storageUrl: 'http://x/a', thumbnailUrl: 'http://x/a_t' });

    await fsDeleteNotebook(db, OWNER, 'nbA');

    const photoSnap = await getDoc(userDoc(db, OWNER, 'photos', 'phA'));
    assert.equal(photoSnap.exists(), true, 'photo document must survive journal deletion');
    const pageSnap = await getDoc(userDoc(db, OWNER, 'pages', 'pgA'));
    assert.equal(pageSnap.exists(), false, 'pages must still be deleted');
    const elSnap = await getDoc(userDoc(db, OWNER, 'elements', 'elA'));
    assert.equal(elSnap.exists(), false, 'elements must still be deleted');
    const nbSnap = await getDoc(userDoc(db, OWNER, 'notebooks', 'nbA'));
    assert.equal(nbSnap.exists(), false, 'the notebook document must still be deleted');
  });

  test('mirror and public_notebooks are NOT touched by fsDeleteNotebook (unchanged, recorded as a separate future issue)', async () => {
    const db = dbFor(OWNER);
    await setDoc(userDoc(db, OWNER, 'notebooks', 'nbB'), { id: 'nbB', name: 'Trip B' });
    await seedAdmin(async (adb) => {
      await setDoc(doc(adb, 'journals', 'nbB'), { id: 'nbB', name: 'Trip B' });
      await setDoc(doc(adb, 'public_notebooks', 'nbB'), { id: 'nbB', name: 'Trip B', pages: [] });
    });

    await fsDeleteNotebook(db, OWNER, 'nbB');

    const mirrorSnap = await getDoc(doc(db, 'journals', 'nbB'));
    assert.equal(mirrorSnap.exists(), true, 'mirror doc must NOT be deleted by this release');
    const pubSnap = await getDoc(doc(db, 'public_notebooks', 'nbB'));
    assert.equal(pubSnap.exists(), true, 'public_notebooks doc must NOT be deleted by this release');
  });
});

describe('Legacy visibility — a photo with no status field is treated as active, zero migration', () => {
  before(() => env.clearFirestore());

  test('a document written with no status field at all is returned by fsLoadAllPhotos', async () => {
    const db = dbFor(OWNER);
    // Deliberately NOT using fsSavePhoto (which always stamps status:'active') — this
    // simulates a real pre-existing document from before this release shipped.
    await setDoc(userDoc(db, OWNER, 'photos', 'legacy1'), { id: 'legacy1', notebookId: 'nbC', storageUrl: 'http://x/l', thumbnailUrl: 'http://x/l_t' });
    const all = await fsLoadAllPhotos(db, OWNER);
    assert.ok(all.some(p => p.id === 'legacy1'), 'legacy photo with no status field must be visible');
  });

  test('isActivePhoto treats undefined status, and every non-"trashed" value, as active', () => {
    assert.equal(isActivePhoto({}), true);
    assert.equal(isActivePhoto({ status: undefined }), true);
    assert.equal(isActivePhoto({ status: 'active' }), true);
    assert.equal(isActivePhoto({ status: 'trashed' }), false);
  });
});

describe('New uploads — stamped fields', () => {
  before(() => env.clearFirestore());

  test('fsSavePhoto writes status:active, trashedAt:null, uploadedByUid', async () => {
    const db = dbFor(OWNER);
    await fsSavePhoto(db, OWNER, { id: 'new1', notebookId: 'nbD', storageUrl: 'http://x/n', thumbnailUrl: 'http://x/n_t' });
    const snap = await getDoc(userDoc(db, OWNER, 'photos', 'new1'));
    const data = snap.data();
    assert.equal(data.status, 'active');
    assert.equal(data.trashedAt, null);
    assert.equal(data.uploadedByUid, OWNER);
  });
});

describe('Trash / restore round-trip', () => {
  before(async () => {
    await env.clearFirestore();
    await fsSavePhoto(dbFor(OWNER), OWNER, { id: 'trp1', notebookId: 'nbE', storageUrl: 'http://x/r', thumbnailUrl: 'http://x/r_t' });
  });

  test('trashed photo disappears from fsLoadAllPhotos and fsLoadPhotos', async () => {
    const db = dbFor(OWNER);
    await fsTrashPhoto(db, OWNER, 'trp1');
    const all = await fsLoadAllPhotos(db, OWNER);
    assert.ok(!all.some(p => p.id === 'trp1'));
    const perJournal = await fsLoadPhotos(db, OWNER, 'nbE');
    assert.ok(!perJournal.some(p => p.id === 'trp1'));
  });

  test('the underlying document is NOT deleted by trash — status/trashedAt only', async () => {
    const snap = await getDoc(userDoc(dbFor(OWNER), OWNER, 'photos', 'trp1'));
    assert.equal(snap.exists(), true);
    assert.equal(snap.data().status, 'trashed');
    assert.ok(snap.data().trashedAt);
  });

  test('restore reverses visibility exactly', async () => {
    const db = dbFor(OWNER);
    await fsRestorePhoto(db, OWNER, 'trp1');
    const all = await fsLoadAllPhotos(db, OWNER);
    assert.ok(all.some(p => p.id === 'trp1'));
    const snap = await getDoc(userDoc(db, OWNER, 'photos', 'trp1'));
    assert.equal(snap.data().status, 'active');
    assert.equal(snap.data().trashedAt, null);
  });
});

describe('fsCheckPhotoReferences — four storage locations, read-only, deduplicated', () => {
  before(() => env.clearFirestore());

  test('detects a canonical element reference', async () => {
    const db = dbFor(OWNER);
    await setDoc(userDoc(db, OWNER, 'notebooks', 'nbF'), { id: 'nbF', name: 'Canonical Journal', isPublic: false });
    await setDoc(userDoc(db, OWNER, 'elements', 'elF'), { id: 'elF', notebookId: 'nbF', pageId: 'pgF', type: 'image', data: { photoId: 'phRef1' } });
    const locs = await fsCheckPhotoReferences(db, OWNER, 'phRef1', 'http://x/ref1');
    assert.ok(locs.some(l => l.type === 'element' && l.notebookId === 'nbF'));
  });

  test('detects a collage-array reference', async () => {
    const db = dbFor(OWNER);
    await setDoc(userDoc(db, OWNER, 'notebooks', 'nbG'), { id: 'nbG', name: 'Collage Journal', isPublic: false });
    await setDoc(userDoc(db, OWNER, 'elements', 'elG'), { id: 'elG', notebookId: 'nbG', pageId: 'pgG', type: 'collage', data: { photos: [{ photoId: 'phRef2' }] } });
    const locs = await fsCheckPhotoReferences(db, OWNER, 'phRef2', 'http://x/ref2');
    assert.ok(locs.some(l => l.type === 'element' && l.notebookId === 'nbG'));
  });

  test('detects a collaboration-mirror-only reference (not present in canonical)', async () => {
    const db = dbFor(OWNER);
    await setDoc(userDoc(db, OWNER, 'notebooks', 'nbH'), { id: 'nbH', name: 'Mirror Journal', isPublic: false });
    await seedAdmin((adb) => setDoc(doc(adb, 'journals', 'nbH', 'elements', 'mirEl'), { id: 'mirEl', pageId: 'pgH', type: 'image', data: { photoId: 'phRef3' } }));
    const locs = await fsCheckPhotoReferences(db, OWNER, 'phRef3', 'http://x/ref3');
    assert.ok(locs.some(l => l.type === 'element' && l.notebookId === 'nbH'));
  });

  test('detects a notebook cover URL match', async () => {
    const db = dbFor(OWNER);
    await setDoc(userDoc(db, OWNER, 'notebooks', 'nbI'), { id: 'nbI', name: 'Cover Journal', isPublic: false, coverPhotoUrl: 'http://x/ref4' });
    const locs = await fsCheckPhotoReferences(db, OWNER, 'phRef4', 'http://x/ref4');
    assert.ok(locs.some(l => l.type === 'cover' && l.notebookId === 'nbI'));
  });

  test('detects a published public-share element AND its cover, independently of canonical', async () => {
    const db = dbFor(OWNER);
    await setDoc(userDoc(db, OWNER, 'notebooks', 'nbJ'), { id: 'nbJ', name: 'Published Journal', isPublic: true, coverPhotoUrl: null });
    await seedAdmin((adb) => setDoc(doc(adb, 'public_notebooks', 'nbJ'), {
      id: 'nbJ', coverPhotoUrl: 'http://x/ref5cover',
      pages: [{ id: 'pgJ', elements: [{ id: 'elJ', type: 'image', data: { photoId: 'phRef5' } }] }],
    }));
    const elLocs = await fsCheckPhotoReferences(db, OWNER, 'phRef5', 'http://x/ref5');
    assert.ok(elLocs.some(l => l.type === 'public-element' && l.notebookId === 'nbJ'));
    const coverLocs = await fsCheckPhotoReferences(db, OWNER, 'phRef5cover', 'http://x/ref5cover');
    assert.ok(coverLocs.some(l => l.type === 'public-cover' && l.notebookId === 'nbJ'));
  });

  test('a photo in BOTH canonical and mirror copies of the SAME element is reported ONCE, not twice', async () => {
    const db = dbFor(OWNER);
    await setDoc(userDoc(db, OWNER, 'notebooks', 'nbK'), { id: 'nbK', name: 'Dedup Journal', isPublic: false });
    await setDoc(userDoc(db, OWNER, 'elements', 'elK'), { id: 'elK', notebookId: 'nbK', pageId: 'pgK', type: 'image', data: { photoId: 'phDedup' } });
    await seedAdmin((adb) => setDoc(doc(adb, 'journals', 'nbK', 'elements', 'elK'), { id: 'elK', pageId: 'pgK', type: 'image', data: { photoId: 'phDedup' } }));
    const locs = await fsCheckPhotoReferences(db, OWNER, 'phDedup', 'http://x/dedup');
    const matching = locs.filter(l => l.notebookId === 'nbK' && l.pageId === 'pgK');
    assert.equal(matching.length, 1, 'canonical+mirror copy of the same element must count once');
  });

  test('a genuinely unused photo returns an empty list', async () => {
    const locs = await fsCheckPhotoReferences(dbFor(OWNER), OWNER, 'phNeverUsed', 'http://x/never');
    assert.deepEqual(locs, []);
  });

  test('the scan performs zero writes — read-only, confirmed by re-reading every touched doc unchanged', async () => {
    const db = dbFor(OWNER);
    const beforeNotebook = (await getDoc(userDoc(db, OWNER, 'notebooks', 'nbF'))).data();
    await fsCheckPhotoReferences(db, OWNER, 'phRef1', 'http://x/ref1');
    const afterNotebook = (await getDoc(userDoc(db, OWNER, 'notebooks', 'nbF'))).data();
    assert.deepEqual(beforeNotebook, afterNotebook);
  });

  test('legacy fallback: a reference with no photoId at all is detected by storageUrl match', async () => {
    const db = dbFor(OWNER);
    await setDoc(userDoc(db, OWNER, 'notebooks', 'nbL'), { id: 'nbL', name: 'Legacy Journal', isPublic: false });
    // No photoId field at all — simulates an element written before photoId existed.
    await setDoc(userDoc(db, OWNER, 'elements', 'elL'), { id: 'elL', notebookId: 'nbL', pageId: 'pgL', type: 'image', data: { storageUrl: 'http://x/legacyref' } });
    const locs = await fsCheckPhotoReferences(db, OWNER, 'phLegacy', 'http://x/legacyref');
    assert.ok(locs.some(l => l.type === 'element' && l.notebookId === 'nbL'));
  });

  test('a voice-memo element with a coincidentally-matching storageUrl is NEVER reported (type guard)', async () => {
    const db = dbFor(OWNER);
    await setDoc(userDoc(db, OWNER, 'notebooks', 'nbM'), { id: 'nbM', name: 'Voice Memo Journal', isPublic: false });
    await setDoc(userDoc(db, OWNER, 'elements', 'elM'), { id: 'elM', notebookId: 'nbM', pageId: 'pgM', type: 'voiceMemo', data: { storageUrl: 'http://x/voiceclash', duration: 12 } });
    const locs = await fsCheckPhotoReferences(db, OWNER, 'phUnrelated', 'http://x/voiceclash');
    assert.equal(locs.filter(l => l.notebookId === 'nbM').length, 0, 'a voiceMemo element must never be reported as a photo reference, even on a storageUrl match');
  });
});

describe('fsLoadPhotoLibrary — one read, split into {active, trashed}', () => {
  before(() => env.clearFirestore());

  test('returns active and trashed photos correctly split, in one call', async () => {
    const db = dbFor(OWNER);
    await fsSavePhoto(db, OWNER, { id: 'libA', notebookId: 'nbN', storageUrl: 'http://x/la', thumbnailUrl: 'http://x/la_t' });
    await fsSavePhoto(db, OWNER, { id: 'libB', notebookId: 'nbN', storageUrl: 'http://x/lb', thumbnailUrl: 'http://x/lb_t' });
    await fsTrashPhoto(db, OWNER, 'libB');
    const { active, trashed } = await fsLoadPhotoLibrary(db, OWNER);
    assert.ok(active.some(p => p.id === 'libA'));
    assert.ok(!active.some(p => p.id === 'libB'));
    assert.ok(trashed.some(p => p.id === 'libB'));
  });
});

describe('fsLoadAllPhotos — cross-journal browse', () => {
  before(() => env.clearFirestore());

  test('returns active photos from multiple different journals for the owner', async () => {
    const db = dbFor(OWNER);
    await fsSavePhoto(db, OWNER, { id: 'crossA', notebookId: 'nbX', storageUrl: 'http://x/ca', thumbnailUrl: 'http://x/ca_t' });
    await fsSavePhoto(db, OWNER, { id: 'crossB', notebookId: 'nbY', storageUrl: 'http://x/cb', thumbnailUrl: 'http://x/cb_t' });
    const all = await fsLoadAllPhotos(db, OWNER);
    const ids = all.map(p => p.id);
    assert.ok(ids.includes('crossA') && ids.includes('crossB'));
  });
});

describe('Collaborator-upload limitation — structural confirmation', () => {
  before(() => env.clearFirestore());

  test('a photo saved under a different uid is invisible to the owner\'s fsLoadAllPhotos', async () => {
    const collaboratorDb = dbFor('collaborator1');
    await fsSavePhoto(collaboratorDb, 'collaborator1', { id: 'collabPhoto', notebookId: 'nbZ', storageUrl: 'http://x/cp', thumbnailUrl: 'http://x/cp_t' });
    const ownerPhotos = await fsLoadAllPhotos(dbFor(OWNER), OWNER);
    assert.ok(!ownerPhotos.some(p => p.id === 'collabPhoto'), 'owner must not see a distinct collaborator uid\'s own uploads');
  });
});
