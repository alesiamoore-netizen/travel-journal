# Photo Library — Owner-Only MVP Plan (Revision 3: narrowed for implementation)

Concise, implementation-focused. Supersedes nothing — the full collaborative
architecture (`photo-library-architecture-canonical.md`) and the list-query/legacy-photo
findings (`photo-library-list-query-diagnostic-and-proposal.md`) are preserved,
unmerged, for if/when this app ever needs real multi-user Photo Library governance or
physical deletion. This release is **owner-only trash/restore management**; permanent
physical deletion (Storage objects and Firestore photo documents) is explicitly
deferred to a later, separately-approved release.

**Explicit collaborator-upload limitation — stated precisely, not glossed over.**
Confirmed by direct code inspection (`Sidebar.jsx:18`, `MobileEditorBar.jsx:303,353`):
every existing photo upload and every existing photo-picker read is scoped by
`fsLoadPhotos(user.uid, notebookId)` / `fsSavePhoto(user.uid, ...)` — **the currently
authenticated user's own uid**, not an "owner of this journal" concept. Today, if a
distinct collaborator account (not the owner's own login) ever uploads a photo into a
shared journal, that photo is written to `users/{collaboratorUid}/photos`, a
completely separate collection the owner's Photo Library cannot see, trash, or
otherwise govern. **This MVP governs only photos uploaded under the owner's own
account.** It does **not** give the owner control over a distinct collaborator's
uploads, and this document makes no claim that it does. Before any collaborator is
invited to upload photos under their own account, a separately-approved follow-up must
either route collaborator uploads into an owner-controlled library or otherwise
establish real owner governance over them through a trusted operation — not assumed
or retrofitted as a side effect of this release.

---

## 1. Inspection findings (code-grounded, unchanged from Revision 1)

**Photo doc/Storage shapes — already exist, already correct for reuse.**
- Storage: `users/{uid}/photos/{photoId}.jpg` + `users/{uid}/photos/{photoId}_thumb.jpg`
  (`storageHelpers.js:15-16`).
- Firestore: `users/{uid}/photos/{photoId}` (`firestoreHelpers.js:236-238`), shape
  `{id, notebookId, filename, mimeType, size, storageUrl, thumbnailUrl, uploadedAt}`.
- **Both are scoped by `uid` only.** `notebookId` is a plain field used for `where()`
  filtering, never part of either path.

**Every photo-reference shape** — confirmed exhaustive by direct source inspection:
- `ImageElement`/`CoverElement` — `data.photoId` / `data.storageUrl` / `data.thumbnailUrl`.
- `CollageElement` — `data.photos[]`, each entry the same 3-field shape.
- `notebook.coverPhotoUrl` — a **plain URL string on the notebook doc** (`editorStore.js:105`),
  **not** a `photoId` reference — matched by `storageUrl`, not a foreign key.
- `public_notebooks/{id}` — `fsPublishShare` embeds a **full, disconnected deep copy**
  of every page's elements plus `coverPhotoUrl`.

**What journal deletion actually does today** — `fsDeleteNotebook`
(`firestoreHelpers.js:31-45`), one batch:
```
delete users/{uid}/pages     where notebookId == X
delete users/{uid}/elements  where notebookId == X
delete users/{uid}/photos    where notebookId == X   ← the cascade this MVP removes
delete users/{uid}/notebooks/{X}
```
Does **not** touch `journals/{id}` (collab mirror) or `public_notebooks/{id}` — a real,
pre-existing orphaning gap, recorded as its own separate follow-up issue (§4), not
touched by this MVP's change to `fsDeleteNotebook`. Storage objects are never deleted
anywhere in the codebase today (zero `deleteObject` calls found) — moot for this
release, since this release deletes no Storage objects either.

**Uploads are already user-level, not journal-level** — no path/collection migration
needed.

**Current production rules already permit everything this MVP needs**, for the owner,
with zero rule changes — the `users/{uid}/**` wildcard is a fixed-path-owner check,
already proven provable for `list` queries. An unfiltered "all my photos" query and a
plain `updateDoc` on the owner's own photo doc are already permitted today.

---

## 2. Trash/restore semantics — the actual release behavior

**Trash hides a photo from *future* selection only. It never affects anything already
placed. Stated precisely, per what's actually true in code, not a broader claim:**
- **The owner's own library view and the owner's own pickers** (per-journal picker and
  the new cross-journal browse view, §3) **hide trashed owner photos.** Both read
  `users/{ownerUid}/photos` — confirmed by direct inspection (`Sidebar.jsx:18`,
  `MobileEditorBar.jsx:303`, which call `fsLoadPhotos(user.uid, notebookId)` using the
  currently authenticated user's own uid) — so when the owner herself is using the
  picker, `user.uid === ownerUid` and the filter applies.
- **Already-placed references continue rendering unchanged**, everywhere — page
  elements, notebook covers, public shares. Nothing reads `status` at render time;
  only picker/library *listing* surfaces filter by it.
- **Collaborator picker/upload behavior is unchanged and explicitly out of scope.** A
  distinct collaborator account's picker call (same component, same `fsLoadPhotos(user.uid,
  ...)`) reads `users/{collaboratorUid}/photos` — their own collection, never the
  owner's — so trashing an owner photo has **no effect whatsoever** on what a
  collaborator sees, and this release does not change that. See the collaborator-upload
  limitation above.
- Restore is instant and owner-only, reversing the library/picker visibility exactly.

**No physical deletion in this release.** `fsPermanentlyDeletePhoto` and any
`deleteObject` work are removed from scope entirely (per your correction). The
"where used" reference scan (§3) is kept, but only as **helpful information shown to
the owner** ("this photo is used in 3 places") — it authorizes nothing, because there
is no irreversible action left in this release for it to gate.

**Legacy documents with no `status` field are treated as `'active'` — exact rule,
stated precisely so there's no ambiguity about what "no migration" means**:
```js
const isActive = (photo) => photo.status !== 'trashed'
```
Every existing photo document today has no `status` field at all; `undefined !==
'trashed'` is `true`, so every legacy photo is treated as active and remains fully
visible and selectable with **zero backfill, zero migration script, zero write to any
existing document**. Filtering is done **client-side** after fetching (`photos.filter(isActive)`),
never as a Firestore `where('status', '==', 'active')` query — that query would
silently exclude every legacy document, since Firestore's equality filter does not
match documents missing the field. This is the one correctness-critical implementation
detail in this whole plan; it's called out explicitly so it isn't lost in
implementation.

**New uploads** write `status: 'active'`, `trashedAt: null`, `uploadedByUid: uid` from
day one (a 3-line addition to `fsSavePhoto`'s caller or to the photo object itself at
creation) — so the field becomes universally present going forward without ever having
touched an old document.

---

## 3. Smallest safe changes

**Data model** — additive fields only, on the existing `photos` doc, no new collection:
```
status: 'active' | 'trashed'      (new; legacy docs treated as 'active' via the
                                    isActive() predicate above, never backfilled)
trashedAt: timestamp | null       (new)
uploadedByUid: string             (new — future-proofing; == uid today, always)
notebookId                        (existing field, kept — "source/origin journal,
                                    informational display only")
```

**New functions** (`firestoreHelpers.js`):
- `fsLoadAllPhotos(uid)` — unfiltered `getDocs(userCol(uid,'photos'))` — cross-journal
  browse, owner-only surface. Filter to `isActive` client-side.
- `fsTrashPhoto(uid, photoId)` / `fsRestorePhoto(uid, photoId)` — set/clear
  `status`/`trashedAt`. Plain `updateDoc`.
- `fsCheckPhotoReferences(uid, photoId, storageUrl)` — informational scan, four storage
  locations (per your correction — not merely field *shapes*, every place a copy of a
  reference can independently exist):
  1. **Canonical owner elements** (`users/{uid}/elements`, unfiltered, in-memory scan
     for `data.photoId === photoId` or `data.photos?.some(p => p.photoId === photoId)`).
  2. **Collaboration mirror elements** (`journals/{notebookId}/elements`, one per
     notebook the owner owns, same field check) — scanned independently, not assumed
     to always agree with canonical, since the mirror can be momentarily ahead or
     behind during live collaboration.
  3. **Notebook cover URLs** (`users/{uid}/notebooks`, `coverPhotoUrl === storageUrl`).
  4. **Public notebook snapshots and their cover URLs** (`public_notebooks/{id}` for
     each notebook the owner has published — embedded elements checked the same way as
     canonical, plus the snapshot's own `coverPhotoUrl`).
  **Deduplication**: canonical and mirror elements share the same `id` (per
  `collab.js`'s `pushElement`, which writes `journals/{notebookId}/elements/{element.id}`
  using the source element's own id) — the scan keys its results by `(notebookId,
  pageId, elementId)` and records each logical placement **once**, regardless of
  whether it was found in the canonical copy, the mirror copy, or both, so the owner
  sees "used on Page 3 of *Summer Trip*," never a duplicated "used in 2 places" for one
  real placement.
  Returns a plain list of human-readable locations — never a boolean, never anything
  that blocks or permits an action. **Read-only, unconditionally**: this scan inspects
  canonical elements, mirror elements, notebook covers, and public snapshots, and must
  never delete or modify any of them — it is a report, not a mutation, under any
  circumstance.

**One existing-function fix, and only this fix**: `fsDeleteNotebook` — remove the
3-line `photos` cascade delete. Every other line of that function, and every other
current deletion behavior, is preserved exactly as it is today — including the fact
that it does not touch `journals/{id}` or `public_notebooks/{id}` (§4).

**UI** — one owner-only "Photo Library" panel (grid of active photos, Trash action per
photo, a separate "Trashed" view with Restore, and the reference list shown as
information, not a gate) gated on `uid === owner`, same pattern as every existing
owner-only control. The owner's own use of the existing per-journal picker and the new
cross-journal browse view both filter out trashed photos via `isActive` (§2) — neither
changes anything about how a distinct collaborator account's picker behaves.

---

## 4. Journal deletion, the mirror, and public shares — recorded as a separate follow-up, not changed here

**The gap, confirmed real, left exactly as-is in this release**: deleting a journal
today removes only the canonical `users/{uid}/{pages,elements,notebooks}` tree. It
leaves `journals/{id}` (collab mirror) and, if published, `public_notebooks/{id}`
orphaned — a collaborator's client could still fetch a mirror for a deleted journal,
and a public share link keeps working after the owner believes she deleted it.

**Per your explicit instruction, this MVP does not touch this.** Deleting the mirror
and the public snapshot is a separate, genuinely destructive, multi-step operation
with its own partial-failure, concurrency, and batch-size questions (exactly the class
of problem the full canonical architecture's `deleteJournal` sequence exists to solve
carefully) — bundling it into this reversible trash/restore release would reintroduce
the irreversible-action risk this MVP is specifically structured to avoid. It is
recorded here as a **known, separate, pre-existing issue for its own future
follow-up**, not designed or scheduled by this document. `fsDeleteNotebook` changes in
exactly one way in this release (above): the `photos` cascade is removed, and nothing
else about its behavior changes.

---

## 5. What's reused unchanged

Upload flow, the `photos` collection and its per-journal query, all three element
types' rendering, `fsGetFirstPageCover`, `fsPublishShare`/`fsUnpublishShare`, every
current Firestore/Storage rule (zero edits), and the entire existing collaboration/
mirror system — both its write behavior and its (unchanged, per §4) deletion
behavior. The only change to any existing function anywhere in this release is the
one line removed from `fsDeleteNotebook` (§3).

## 6. Explicitly not built this release

`journalAccess` index, membership callables, collaborator dashboard,
`photoAssets`/`pendingUploads`/upload leases/reapers, `photoAssetRefs`, any Admin-SDK
trusted callable, any new Firestore/Storage rule, any physical deletion of a Storage
object or Firestore photo document, **and any change to mirror (`journals/{id}`) or
public-share (`public_notebooks/{id}`) deletion behavior (§4)**. If a future release
needs real photo deletion or mirror/public-share lifecycle cleanup, the reference scan
built here, and the gap recorded in §4, become that release's starting point — not
this one's.

## 7. Concurrency — stated honestly, not claimed absent

Collaboration write races are a real, pre-existing property of this app (the full
canonical architecture document exists largely to reason about them for a genuine
multi-writer Photo Library) — this MVP does not make that go away and does not claim
to. What it does do: every new action in this release (trash, restore, the reference
scan) is **reversible and non-destructive**, so even a genuine race — e.g. a
collaborator placing a photo into a new element at the moment the owner trashes it —
has no bad outcome: the placement still renders (trash never affects existing
placements, §2), the owner can restore the photo any time, and no data is lost or
corrupted either way. This release is safe under concurrency specifically *because* it
defers the one action (physical deletion) that would make a race actually dangerous —
not because concurrency isn't real.

## 8. Minimal tests required — emulator or mocks only, never real Firebase data

Per your explicit instruction: every test below runs against the local Firebase
Emulator Suite (reusing the guard/harness already built and verified in
`test/photo-library-emulator/`) or a pure in-memory mock — **never** against the
existing dev/production Firebase project or any real journal/photo.

- `fsDeleteNotebook`: photos survive (the core regression test); every other current
  deletion behavior is unchanged — explicitly including a regression check that
  `journals/{id}` and `public_notebooks/{id}` are **not** touched (§4 records that gap
  as a separate, future issue; this test exists to prove this release didn't
  accidentally touch it either way).
- `isActive()`/legacy-visibility: a photo document with no `status` field is treated
  as active by every picker and the library view; a client-side filter (not a
  Firestore query) is what's actually exercised.
- Trash/restore round-trip: trashed photo disappears from both pickers and the
  cross-journal browse view; existing placements on pages/covers/public shares are
  unaffected and still render; restore reverses visibility exactly.
- `fsCheckPhotoReferences`: one test per each of the four storage locations (canonical
  element, mirror element, notebook cover, public-share snapshot + its cover),
  confirming detection; one test confirming a genuinely unused photo returns empty;
  one test confirming a photo placed in both canonical and mirror copies of the same
  element is reported **once**, not twice.
- Owner-only UI gating: a non-owner cannot see or invoke any Photo Library action —
  component-level, no rule test needed (no rule changed).

## 9. Realistic focused-work estimate (narrowed further — no mirror/public-share changes)

- Data model + `isActive()` predicate + new upload fields: ~0.25 day
- `fsLoadAllPhotos`/`fsTrashPhoto`/`fsRestorePhoto`: ~0.25 day
- `fsCheckPhotoReferences` (four locations, read-only, dedup): ~0.5 day
- `fsDeleteNotebook` one-line fix: negligible
- Owner-only Photo Library UI (active/trashed views, trash/restore, reference display)
  + owner-picker filtering: ~1 day
- Tests (emulator/mocks only): ~0.5–1 day

**Total: roughly 2.5–3 focused days** — smaller again than Revision 2, with the
mirror/public-share handling removed entirely from this release's scope (§4).

## 10. Known limitations (non-blocking, post-implementation)

- **Offline/cold-cache empty state**: Firestore's client-side offline persistence cache
  means that during a complete backend outage with no warm local cache, the Photo
  Library's initial load can resolve as an empty "No photos yet" success state instead
  of surfacing an immediate visible error — the query falls back to an empty local cache
  rather than rejecting. This was observed directly during local fault-injection testing
  and is standard Firestore SDK offline-first behavior, not a defect in this feature's
  own error-handling code (which was separately verified, via a scoped Firestore rules
  denial, to correctly show an error message with a working Retry when a read is
  genuinely rejected — e.g. permission-denied). Non-blocking for this release; redesigning
  offline-state handling is out of scope here.
