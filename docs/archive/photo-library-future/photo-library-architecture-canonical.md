# Photo Library Architecture — Canonical (Consolidated)

Design-only document. No application source, Firebase rules, Functions, Storage,
Firestore data, journals, or photographs are modified by the existence of this file.

**Provenance**: this document was assembled read-only from the local session transcript
that produced it, per explicit instruction, after discovering that
`docs/photo-library-architecture-v6-missing-sections.md` (preserved unchanged — see
below) contains only targeted corrections layered on top of earlier, never-saved chat
responses, and is not by itself self-contained. This document reconciles three sources:

1. **"v6 (self-contained)"** — an earlier full design rewrite, delivered only as a chat
   response, never saved to a file.
2. **"v7-Corrected"** — a later, more complete full rewrite (also delivered only as a
   chat response, never saved to a file) that explicitly superseded v6 and an
   intermediate draft of the missing-sections file. This is the most complete
   *self-contained* base found anywhere in the history.
3. **`docs/photo-library-architecture-v6-missing-sections.md`** — the file actually on
   disk today, containing the *latest* round of corrections (14 further defects found
   after v7-Corrected: invalid rules syntax, document-identity immutability, a
   viewer-role read bug, ungated membership writes, a missing `updateNotebook`
   specification, missing presence rules, the notebook-cover reference type and its
   propagation, a publish math error, non-authoritative write-count bounding, ambiguous
   stale-invocation results, an honest PIN disclosure, and null-safe auth checks).

Where these sources conflict, the latest correction (source 3, and specific fixes found
only in source 2's transcript text) wins. Every such decision, every section's exact
provenance, and every unresolved gap is listed in the **Reconciliation Appendix** at the
end of this document — read that section before relying on any specific clause here if
its origin matters to you.

**The `docs/photo-library-architecture-v6-missing-sections.md` file itself is left
completely unmodified by this consolidation**, per explicit instruction. This document
does not supersede it as the record of *what was corrected and why*; it supersedes it
only as *the place to read the complete, current design in one place*.

---

## 1. Code-grounded write-path audit

*(Source: v6, Section 0 — not revisited by any later round; carried forward unchanged.)*

Every call site in the current codebase that writes an element's `data` field was
re-read, rather than assumed:

| File : line | Pattern | Spreads full current `data`? | Could drop an unknown field? |
|---|---|---|---|
| `Inspector.jsx` (13 sites: 38, 214, 518, 836, 900, 976, 1050, 1103, 1150, 1201, 1243) | `updateElement(id, { data: { ...data, ...patch } })` | Yes | No |
| `MobileEditorBar.jsx:278,309,354,439` | same spread pattern | Yes | No |
| `CollageElement.jsx:31,42` | `{ data: { ...data, photos: newPhotos } }` | Yes | No |
| `CoverElement.jsx:31` | `{ data: { ...data, storageUrl, thumbnailUrl, photoId } }` | Yes | No |
| `ImageElement.jsx:64` | `{ data: { ...data, photoId, storageUrl, thumbnailUrl } }` | Yes | No |
| `DrawingElement.jsx:50` | `{ data: { ...data, strokes } }` | Yes | No |
| `TextElement.jsx:21` | `{ data: { ...element.data, content } }` | Yes | No |
| `VoiceMemoElement.jsx:57,92` | `{ data: { ...data, storageUrl, duration } }` | Yes | No |
| `WeatherElement.jsx:47` | same spread pattern | Yes | No |
| `Sidebar.jsx:129,132` | `{ data: { ...selected.data / el.data, ...photoData } }` | Yes | No |
| `AiDraftModal.jsx:102,105,108` | `{ data: { ...targetTextEl.data, content } }` | Yes | No |
| `editorStore.js:376 updateElementGrid` | `fsUpdateElement(uid, id, { grid })` | N/A — never touches `data` | No |
| `editorStore.js:301,355 (fsSaveElement)` | full-document `setDoc` for **brand-new** elements only | N/A — creation, not edit | No |
| `notebookStore.js:155` (page duplication) | `fsSaveElement(uid, {...el, id:newId, ...})` — full-fidelity copy of an **existing** element | Yes (whole object) | No |
| `collab.js pushElement` (mirror write) | explicit field whitelist including `data: stripBlobs(element.data)`; `stripBlobs` only strips Blob/File/ArrayBuffer, passes every other key through unchanged | Yes | No |

**Finding**: every write path that edits an existing element's `data` map spreads the
complete current object first — there is no narrow-patch path that could silently drop
an unrecognized field. But `ImageElement.jsx:64`, `CoverElement.jsx:31`,
`CollageElement.jsx:31/42`, and the two upload sites in `MobileEditorBar.jsx` are
**today's only working upload/replace/remove mechanism**, and they write exactly the
fields a protection rule must lock down. A protection rule deployed alone, without a
simultaneous client cutover to server-mediated writes, would break the only upload
mechanism that currently exists. The rule and the cutover ship together (§25 deployment
ordering), for every element shape — legacy and new alike.

---

## 2. Complete schemas

*(Source: v7-Corrected §1, as the fullest base; role enum corrected per the missing-sections
file's §1; presence schema and `notebookCover` fields added from the missing-sections
file's §1/§5B; `refDocId` formula corrected per the transcript fix described in §17 below,
which never made it into the file on disk.)*

```
/journalAcls/{journalId}
  {
    ownerUid: string,                 // immutable after creation; set only by createJournal
    journalStatus: 'active' | 'deleting' | 'deleted',
    createdAt: timestamp,
    deletedAt: timestamp | null,
    sweepStartedAt: timestamp | null,      // observability only, never read by a safety check
    lastSweepAttemptAt: timestamp | null,  // observability only
  }
  // No publishLock / job-lock field of any kind — the multi-transaction publish-job
  // design is removed (§15). A single-transaction publish/unpublish only ever needs
  // journalStatus and per-asset status, both re-verified inside its own transaction.

/journalAcls/{journalId}/members/{uid}
  { role: 'editor' | 'viewer',      // CORRECTED — 'owner' is never a valid value here;
                                        ownership is exclusively journalAcls.ownerUid,
                                        never duplicated into a member entry
    invitedAt: timestamp,             // immutable after creation
    invitedByUid: string }            // immutable after creation

/journals/{journalId}/presence/{uid}
  { uid: string, displayName: string, photoURL: string, currentPageId: string,
    updatedAt: timestamp }
  — NEW: referenced (and swept on journal deletion) since early rounds, but had no
    matching rule until the missing-sections round — see §18.

/users/{ownerUid}/notebooks/{notebookId}
  — canonical notebook metadata (title, theme, pageSize, etc.); ownerUid/journalStatus
    cached here for dashboard display only, never read by any rule/Function decision.
  — `notebookId` on this and every page/element document always equals the journalAcls
    doc id; every canonical rule verifies the PATH segment {ownerUid} equals
    journalAcls/{notebookId}.ownerUid (§19/§20).
  — coverAssetId: string | null       // NEW (§11) — authoritative, an asset in the
                                          owner's own library
  — coverUrl: string | null           // NEW — DERIVED CACHE, refreshed only by
                                          setNotebookCoverPhoto
  — coverThumbUrl: string | null      // NEW — DERIVED CACHE, same
  — coverPhotoUrl: string | null      // LEGACY — untouched, unmigrated; read only as a
                                          fallback when coverAssetId is null (§11)

/users/{ownerUid}/pages/{pageId}
  { id, notebookId, order, title, location, date, pageKind, spreadId, monthKey,
    spreadSide, themeOverrides }   — unchanged shape from today
  — `id` must equal the document's own Firestore id; `notebookId` immutable after
    creation (§5).

/users/{ownerUid}/elements/{elementId}
  { id, notebookId, pageId, type, grid, data, role, themeManaged, sourceThemeId,
    sourceTemplateId, themeTokenProvenance }
  — `id` must equal the document's own id; `notebookId` and `pageId` immutable after
    creation; `type` immutable after creation (§5) — no legitimate feature ever changes
    an element's type in place; a content-type change is always delete+recreate.

/users/{ownerUid}/photoAssets/{assetId}
  {
    assetId: string,
    ownerUid: string,                 // integrity-checked cache; the path segment is the trust source
    uploadedByUid: string,            // audit only — never grants deletion rights
    storage: {
      fullPath: string,                // "users/{ownerUid}/photoAssets/{assetId}/original"
      thumbPath: string,               // "users/{ownerUid}/photoAssets/{assetId}/thumb"
      fullUrl: string, thumbUrl: string,
      fullDeleted: boolean, thumbDeleted: boolean,
      storageAttempted: boolean,       // set true BEFORE the first Storage delete call ever made
    },
    filename: string,                  // sanitized, display-only, never used to build a path
    verifiedFull:  { mimeType: string, size: number },  // Storage's DECLARED metadata for
                                                          // the original — declared, not
                                                          // proven real image bytes (§7)
    verifiedThumb: { mimeType: string, size: number },  // same, for the thumbnail — kept
                                                          // SEPARATE since the two objects
                                                          // can legitimately differ
    declaredMimeType: string, declaredSize: number,      // the client's original CLAIM, audit only
    width: number | null, height: number | null,         // client hint, explicitly unverified
    uploadedAt: timestamp,
    status: 'active' | 'trashed' | 'deleting' | 'delete_failed',
    failureReason: 'storage_error' | 'reference_anomaly_after_storage_attempt' | null,
    trashedAt: timestamp | null, trashedByUid: string | null,
    lastBlockedReferences: [{refType, notebookId, elementId, slotKey}] | null,
                                        // refType now includes 'notebookCover' (§11/§12) —
                                        // shown to the owner so a block reads "in use as
                                        // this journal's cover," not "1 reference"
    deletionPolicy: 'owner_only',
    sourceNotebookId: string | null, sourceNotebookName: string | null,  // audit/display only
  }

/users/{ownerUid}/photoAssetRefs/{assetId}/refs/{refDocId}
  { refType: 'element' | 'publicShare' | 'notebookCover',   // third value NEW, §11
    notebookId, elementId?, pageId?, slotKey?, createdAt }
  — refDocId encoding: see §17 for the corrected, collision-free formula.

/users/{ownerUid}/pendingUploads/{uploadId}
  {
    uploadId, ownerUid, requestedByUid, notebookId,
    filename: string,                  // sanitized at write time
    declaredMimeType: string, declaredSize: number, width: number | null, height: number | null,
    storage: { fullPath: string, thumbPath: string },   // server-issued, extension-less
    status: 'pending' | 'finalizing' | 'finalized' | 'expiring' | 'expired' | 'failed',
    leaseOwner: string | null,          // the current attempt's exclusive claim token
    leaseExpiresAt: timestamp | null,
    createdAt: timestamp, expiresAt: timestamp,        // createdAt + 1 hour
    verifiedFull: { mimeType, size } | null,
    verifiedThumb: { mimeType, size } | null,
    missingObjects: ['full' | 'thumb'] | null,
    validationError: string | null,
    finalizedAt: timestamp | null,      // set exactly when status becomes 'finalized'
    failedAt: timestamp | null,         // set exactly when status becomes 'failed'
    expiredAt: timestamp | null,        // set exactly when status becomes 'expired'
    // Precise per-status timestamps — cleanup (§7.4) queries the exact field matching
    // each terminal status, never a vague "the relevant timestamp."
  }

/journals/{journalId}/pages/{pageId}, /journals/{journalId}/elements/{elementId}
  — mirror, identical shape to canonical, NEVER independently authoritative, NEVER read by
    any deletion-verification or ACL check — display-relay only. Subject to the SAME
    protected-field, ownership, and document-identity rules as canonical (§20) — no
    second, divergence-prone copy of the field-list logic.

/public_notebooks/{notebookId}
  { id, ownerUid, name, description, theme, pageSize, coverPhotoUrl, publishedAt,
    sharePin, pages: [{...page, elements: [...]}] }
  — client write denied unconditionally (§20). Subject to a hard size/asset-count cap
    enforced at publish time (§15) — no journal larger than the cap can be published.

/config/photoLibrary
  { enabled: boolean }   // default false; read-only for clients, write denied unconditionally
```

---

## 3. Access-control helpers (read vs. write vs. owner)

*(Source: `docs/photo-library-architecture-v6-missing-sections.md` §2 — final, and the
only version of these helpers that is syntactically valid Firestore Rules and correctly
restores `viewer` read access. This REPLACES v7-Corrected's single `hasEditorAccess`
helper, which conflated read and write and silently denied `viewer` members all read
access — a real bug in every earlier round.)*

```js
function aclExists(journalId) {
  return exists(/databases/$(database)/documents/journalAcls/$(journalId));
}
function aclDoc(journalId) {
  return get(/databases/$(database)/documents/journalAcls/$(journalId)).data;
}
function memberExists(journalId, uid) {
  return exists(/databases/$(database)/documents/journalAcls/$(journalId)/members/$(uid));
}
function memberRole(journalId, uid) {
  return get(/databases/$(database)/documents/journalAcls/$(journalId)/members/$(uid)).data.role;
}
function hasReadAccess(journalId) {
  return request.auth != null && aclExists(journalId) &&
    (request.auth.uid == aclDoc(journalId).ownerUid ||
     (memberExists(journalId, request.auth.uid) &&
      (memberRole(journalId, request.auth.uid) == 'editor' ||
       memberRole(journalId, request.auth.uid) == 'viewer')));
}
function hasWriteAccess(journalId) {
  return request.auth != null && aclExists(journalId) &&
    (request.auth.uid == aclDoc(journalId).ownerUid ||
     (memberExists(journalId, request.auth.uid) &&
      memberRole(journalId, request.auth.uid) == 'editor'));
}
function isOwner(journalId) {
  return request.auth != null && aclExists(journalId) && request.auth.uid == aclDoc(journalId).ownerUid;
}
function journalIsActive(journalId) {
  return aclExists(journalId) && aclDoc(journalId).journalStatus == 'active';
}
function pathOwnerMatchesAcl(ownerUid, journalId) {
  return aclExists(journalId) && aclDoc(journalId).ownerUid == ownerUid;
}
```

`hasReadAccess` (owner ∨ editor ∨ viewer) is used for every `allow read` rule.
`hasWriteAccess` (owner ∨ editor only) is used for every `allow create`/`update` rule
that is *not* itself gated further by §4's asset-governance policy. `pathOwnerMatchesAcl`
additionally guards every canonical-path rule so a permitted editor cannot write
canonical data under the wrong user's path.

---

## 4. Collaborator permissions vs. asset governance (the gate)

*(Source: missing-sections file §2B — final policy. This supersedes both v6 §8's blanket
"every photo operation is owner-only, editors get zero capability" and v7-Corrected's
implicit use of `hasEditorAccess` for general page/element writes without a
photo-specific carve-out. The gate must be a property of the authorization check itself,
never inferred from "no collaborators currently exist.")*

**Asset GOVERNANCE — owner-only, unconditionally, no exception, in every release:**
- Trash an asset, restore a trashed asset, permanently delete an asset (`requestPermanentDelete`)

**Initial release — owner-only, encoded as `isOwner(journalId)`, not `hasWriteAccess`, in
each callable's own authorization check:**
- `beginUpload`/`finalizeUpload`
- `attachPhoto`/`replacePhoto`/`detachPhoto`/`reorderCollageSlots`
- `setNotebookCoverPhoto` (§11)
- `deleteElement`/`deletePage`/`duplicatePage`/`duplicateElement`/`replacePageElements`
  **only when the operation actually involves a photo reference** — i.e., when §9's
  computed `refWrites > 0` for the element(s)/page involved. The *base* operation
  (deleting or duplicating an element/page with no photo content — text, dividers,
  stickers, voice memos, etc.) remains `hasWriteAccess` (owner ∨ editor), unrestricted by
  this gate.

**Future, post-gate policy — named as the target, not built or enabled now**: once the
standing second-user collaboration test has passed and been separately, explicitly
approved, every `isOwner(journalId)` check listed above is swapped for
`hasWriteAccess(journalId)` — an explicit, auditable change at that time, never a silent
unlock that falls out of collaborators simply starting to exist.

**Removing a photo reference never deletes the underlying asset**: `detachPhoto` and
every deletion callable above only ever remove `photoAssetRefs` entries and clear element
fields; none of them touch `photoAssets/{assetId}` itself or its Storage objects. Only
`requestPermanentDelete` — always owner-only — ever does that.

**One deliberately unresolved exception**: `photoAssets` collection READ (library
browsing) remains **owner-only** — it has no `journalId` in its path to scope a role
check against, and the correct cross-journal scoping question remains open.

**Ordinary (non-photo) page/element reads, creates, updates, and deletes** use
`hasReadAccess`/`hasWriteAccess` exactly as any other collaborative document would —
editors have real, working capability for everything that isn't photo-governance, from
the initial release onward. This is the one substantive expansion beyond v6/v7-Corrected:
those earlier rounds described *every* photo-related operation as flatly owner-only
without distinguishing "touches a photo reference" from "touches this page/element at
all"; this section's conditional-escalation model is the final, more precise policy.

---

## 5. Document identity and parent-relationship immutability

*(Source: missing-sections file §3 — new relative to v7-Corrected, which stated
`notebookId`/`pageId`/`type` immutability as schema commentary but did not yet have
dedicated rule-helper functions for it.)*

```js
function idMatchesPathId(doc, pathId) {
  return doc.id == pathId;
}
function notebookIdUnchanged() {
  return resource.data.notebookId == request.resource.data.notebookId;
}
function pageIdUnchanged() {
  return resource.data.pageId == request.resource.data.pageId;
}
function elementTypeImmutable() {
  return resource.data.type == request.resource.data.type;
}
```

Every `create` rule requires `idMatchesPathId(request.resource.data, <the path's own id
segment>)`; every `update` rule on pages requires `notebookIdUnchanged()`; every `update`
rule on elements requires `notebookIdUnchanged() && pageIdUnchanged() &&
elementTypeImmutable()`.

**The mirror gets the identical set of protections, not a narrower one** — CORRECTED: an
earlier draft of this consolidation stated the mirror's invariant as only
`request.resource.data.notebookId == journalId`, and §20's rule block, as first merged,
did not actually enforce the rest. That was a real gap between this section's claim and
the rules actually written — closed here. The mirror's full, enforced set (§20):
- **create** (page or element): `idMatchesPathId(request.resource.data, <the path's own
  id segment>)` — the mirror document's own `id` field must equal the path id, exactly as
  canonical — **and** `request.resource.data.notebookId == journalId` (the mirror path's
  own `{journalId}` segment).
- **update** (page): `resource.data.notebookId == journalId &&
  request.resource.data.notebookId == journalId` — both the existing and the proposed
  document must belong to the path's own journalId, and it cannot change out from under
  it (this is the mirror's equivalent of canonical's `notebookIdUnchanged()`, expressed
  against the path segment rather than against a second field, since the mirror's
  "notebookId" and "journalId" are the same value by construction).
- **update** (element): the same `notebookId == journalId` check on both sides, **plus**
  `pageIdUnchanged()` and `elementTypeImmutable()` — identical to canonical's element
  update rule in substance, just evaluated against the mirror path's own documents.

**Limit, stated honestly**: rules on one store cannot cheaply cross-check the *other*
store's copy of the same document without an extra `get()` per write. The actual
guarantee that canonical and mirror never diverge comes from the callables writing both
in the same transaction (§9/§14); these per-store immutability rules are a second,
independent layer against a *direct client write* pushing either store individually into
an inconsistent state.

---

## 6. Membership writes: lifecycle-gated and field-validated

*(Source: missing-sections file §4 — final. This REPLACES v7-Corrected's
`allow write: if isOwner(journalId)`, which had no lifecycle check and no field
validation at all.)*

```js
match /journalAcls/{journalId}/members/{uid} {
  allow read: if hasReadAccess(journalId);
  allow create: if isOwner(journalId) && journalIsActive(journalId)
    && (request.resource.data.role == 'editor' || request.resource.data.role == 'viewer')
    && request.resource.data.invitedByUid == request.auth.uid;
  allow update: if isOwner(journalId) && journalIsActive(journalId)
    && (request.resource.data.role == 'editor' || request.resource.data.role == 'viewer')
    && request.resource.data.invitedByUid == resource.data.invitedByUid
    && request.resource.data.invitedAt == resource.data.invitedAt;
  allow delete: if isOwner(journalId) && journalIsActive(journalId);
}
```

`journalIsActive` is required for every membership write — an owner can no longer
invite/remove/change a role while the journal is `deleting`, closing a race against the
deletion sweep's own membership cleanup. `role` is constrained to the two real member
roles. `invitedByUid`/`invitedAt` are writable once at creation, then immutable.

---

## 7. Upload lifecycle: begin, finalize, cleanup

*(Source: v7-Corrected §2.2/§2.4, the most complete version found anywhere — not
revisited by the missing-sections round. Owner-gating in step 1 below is `isOwner`, per
§4's gate, rather than the plain "owner-only, this release" phrasing v7-Corrected used
before that gate was formalized as its own section.)*

### 7.1 One recovery owner per state

There are exactly two recovery *functions*, each the sole authority over one state, each
reachable from more than one *trigger*:
- **`resolveFinalizingSession(sessionRef, {isClientTriggered})`** — the only code allowed
  to move a session out of `finalizing`. Triggered by a client's `finalizeUpload({uploadId})`
  call, or by the scheduled reaper sweeping a lease-expired `finalizing` session.
  **CORRECTED (this round) — takes the exact session document reference, never a bare
  `uploadId`**; see §7.2 for how each trigger obtains that reference.
- **`resolveExpiringSession(sessionRef)`** — the only code allowed to move a session out of
  `expiring`. Triggered only by the scheduled cleanup sweep (§7.3 responsibilities A and
  C). **CORRECTED (this round) — takes the exact session document reference, never a bare
  `uploadId`**, exactly like `resolveFinalizingSession` above; see §7.3 for how it's
  obtained (a `collectionGroup('pendingUploads')` query in every case, since this function
  is only ever reached from a scheduled sweep with no per-user scoping context).

### 7.2 Complete flow

**Honesty note**: `getMetadata()` returns the *declared* `contentType` an uploader
supplied — metadata about the object, not proof of its real byte content. This design
validates declared metadata and actual object size; it does not verify the true image
format. Accepted, owner-only limitation, stated explicitly (byte-level format
verification, e.g. server-side decode/re-encode, is a real available alternative,
explicitly not chosen for this release).

```
beginUpload({notebookId, filename, declaredMimeType, declaredSize, width, height}):
  ONE transaction:
    1. read journalAcls/{notebookId}; verify it exists; verify isOwner(notebookId)
       (§4's gate); verify journalStatus == 'active'.
    2. verify declaredMimeType in ['image/jpeg','image/png','image/webp']; verify
       declaredSize <= 20 MiB. (Cheap up-front checks; re-verified against reality later.)
    3. generate uploadId; sanitize filename (strip '/', '..', control characters, truncate
       ~200 chars).
    4. create the session at the EXPLICIT, fully-qualified path
       users/{ownerUid}/pendingUploads/{uploadId} (never an unqualified "pendingUploads/
       {uploadId}" — sessions live under their owning user, exactly like every other
       per-owner collection in this design): ownerUid=<the notebook's ownerUid, from
       journalAcls>, requestedByUid=caller, notebookId,
       storage.fullPath="users/{ownerUid}/photoAssets/{uploadId}/original",
       storage.thumbPath="users/{ownerUid}/photoAssets/{uploadId}/thumb", status='pending',
       createdAt=now, expiresAt=now+1h, leaseOwner=null, leaseExpiresAt=null,
       verifiedFull=null, verifiedThumb=null, missingObjects=null, validationError=null,
       finalizedAt=null, failedAt=null, expiredAt=null.
  Commit. Return {uploadId, fullPath, thumbPath, expiresAt}.

Client uploads bytes directly to Storage at exactly those two paths. Storage rule (§20)
enforces, independently: a matching pendingUploads doc exists, status=='pending',
not expired, caller==requestedByUid, fileName is exactly 'original' or 'thumb',
contentType in the allow-list, size within the per-file limit. This is the first of two
independent checks against DECLARED metadata — the second happens at finalization.

**CORRECTED — explicit, race-safe session-path resolution.** Upload sessions live at
`/users/{ownerUid}/pendingUploads/{uploadId}` — a per-owner subcollection, not a global
one. The version of this section first merged into this document referred to sessions
only as `pendingUploads/{uploadId}` throughout, and both `finalizeUpload` and
`resolveFinalizingSession` passed around a bare `uploadId` with no owner segment at
all — which, if taken literally, would require resolving the session via an unscoped
search rather than a direct document read, and would let the same `uploadId` string be
ambiguous across owners. Corrected below: the session is always addressed by its exact
document reference, obtained differently depending on which trigger is resolving it, and
never by a bare `uploadId` alone from this point onward.

```
finalizeUpload({uploadId}) — CLIENT-TRIGGERED PATH.
  **CORRECTED — authentication is checked BEFORE `request.auth.uid` is ever read.** The
  version of this callable first merged into this document constructed `sessionRef` using
  `request.auth.uid` before anything had established that `request.auth` exists at all —
  an unauthenticated call would then fail while dereferencing a missing identity (a
  null-reference fault), not with the intended "unauthenticated" error. Corrected order,
  as the literal first two steps of the callable, before any other work:
    0. if request.auth == null: throw "unauthenticated." — return here, immediately, for
       any unauthenticated call. Nothing below this line ever runs without a confirmed
       `request.auth`.
    1. Only now, with `request.auth` confirmed non-null, construct the exact session
       reference:
         sessionRef = /users/{request.auth.uid}/pendingUploads/{uploadId}
       — never a global or collection-group lookup by `uploadId` alone. This is sound
       because finalize is owner-only in this release (§4): the caller's own uid is the
       ONLY ownerUid this call could ever be legitimately acting as. If no document exists
       at that exact path — including the case where `uploadId` genuinely belongs to a
       different owner — the read in step 1 below (§7.2's transaction step) simply finds
       nothing, and the flow fails closed as "session not found." A mismatched
       uploadId/ownerUid pair can never be discovered, searched for, or acted on across
       users, because the path itself is constructed from the caller's own identity, after
       that identity is confirmed to exist, before any lookup happens.
  → resolveFinalizingSession(sessionRef, {isClientTriggered: true})

  **`isClientTriggered` is internal trusted routing state, never client input.** This
  applies to `resolveFinalizingSession`'s two triggers specifically (it has no bearing on
  `resolveExpiringSession` below, which has only ONE trigger — the scheduled sweep — and
  so takes no such flag at all: §7.1). `{isClientTriggered: true|false}` is a literal
  hardcoded by the calling wrapper itself — `true` in the callable wrapper that backs
  `finalizeUpload` (an HTTPS-callable Function invoked by an end user), `false` in the
  scheduled-worker wrapper that backs the reaper (§7.3 responsibility B, a Cloud
  Scheduler-invoked Function with no end-user request at all). It is never read from
  `request.data`, never accepted as a parameter the client can supply, and never derived
  from anything the client sends — a client cannot claim to be "internal" by passing a
  flag, because the flag does not exist on the client-facing surface in the first place;
  it is chosen by
  which trusted server entry point is running, not by any value in the request.

resolveFinalizingSession(sessionRef, {isClientTriggered}):
  // sessionRef = the exact document reference at users/{ownerUid}/pendingUploads/{uploadId}.
  // For the client-triggered path, constructed above from request.auth.uid before this
  // function is ever called. For the scheduled-reaper path, this is the literal
  // DocumentReference returned by the reaper's own collection-group query (§7.3
  // responsibility B) — the reaper never reconstructs or guesses a path; it uses the
  // reference the query itself already returned, owner segment included.

  1. **ONE transaction — authorization AND claim TOGETHER — CORRECTED.** The version of
     this function first merged into this document ran authorization as a separate,
     read-only step before a second, separate claim transaction — leaving a real gap
     between the authorization read and the claim where a concurrent invocation could act
     in between, and where even the idempotent "already finalized" response was returned
     BEFORE any authorization check had run at all. Both problems are closed by making
     authorization and claim one atomic unit: all reads below happen before any write, as
     Firestore transactions require, and NOTHING — not even an idempotent status read —
     is returned to the caller until authorization has passed.

     READS (fresh, inside this transaction):
       read sessionRef.
       read journalAcls/{session.notebookId} (once the session read above reveals notebookId).

     CHECKS:
       - the document at sessionRef exists, and its recorded `ownerUid` field equals
         sessionRef's own `{ownerUid}` path segment (path-owner integrity — the stored
         field must agree with the path it actually lives at) — else throw "session not
         found."
       - **Storage-path shape integrity — CORRECTED, previously missing.** Path-owner
         integrity above proves `session.ownerUid` agrees with the path this document
         lives at; it does NOT prove the separate `storage.fullPath`/`storage.thumbPath`
         string fields this function is about to hand to the Admin SDK in step 2 actually
         point into that same owner's Storage tree. Those are independent fields with no
         structural link to `ownerUid` enforced anywhere upstream, and nothing before this
         point has ever cross-checked them. Required, defined once here and reused
         verbatim by `resolveExpiringSession` (§7.3 A) and terminal cleanup (§7.3 C) —
         every site in this document that is about to read Storage metadata or delete a
         Storage object based on a `pendingUploads` session's stored path fields:
           ```
           function storagePathsMatchExpected(session, sessionRef) {
             let expectedFull  = 'users/' + sessionRef.ownerUidSegment + '/photoAssets/'
                                  + sessionRef.uploadIdSegment + '/original';
             let expectedThumb = 'users/' + sessionRef.ownerUidSegment + '/photoAssets/'
                                  + sessionRef.uploadIdSegment + '/thumb';
             return session.storage.fullPath == expectedFull
                 && session.storage.thumbPath == expectedThumb;
           }
           ```
         (`sessionRef.ownerUidSegment`/`.uploadIdSegment` denote the literal path segments
         of `sessionRef` itself — `users/{ownerUidSegment}/pendingUploads/{uploadIdSegment}`
         — not values re-read from the document body.) If `storagePathsMatchExpected`
         returns false: throw "session storage paths inconsistent," do NOT proceed to step
         2, perform NO Storage operation of any kind, and flag the document for manual
         review — this is a data-integrity fault that should never occur in an uncorrupted
         deployment (every legitimate session's paths are set once, by `beginUpload`
         itself, to exactly this deterministic shape, and are never client-writable
         afterward per §20's rules), so its presence indicates the record itself needs
         investigation, not that this function should guess or fall back to any other path.
       - session.notebookId resolves to a journalAcls document that actually exists (the
         journal/session relationship is valid) — else throw "session inconsistent."
       - **if isClientTriggered** (finalizeUpload's path):
           - request.auth != null (authenticated caller) — else throw "unauthenticated."
           - request.auth.uid == sessionRef's own `{ownerUid}` path segment — else throw
             "session not found." (Structurally, this can only ever fail if something
             upstream mis-constructed sessionRef, since the client path above always
             builds it FROM request.auth.uid — kept here as a defense-in-depth
             restatement, not the primary mechanism.)
           - request.auth.uid == session.requestedByUid — else throw "not authorized for
             this session."
           - request.auth.uid == journalAcls(session.notebookId).ownerUid — initial
             release, per §4's gate: finalize is owner-only, mirroring beginUpload's own
             isOwner check — else throw "not authorized for this session."
       - **if NOT isClientTriggered** (the scheduled reaper, §7.3 responsibility B): the
         two checks above (path-owner integrity, journal/session relationship validity)
         still apply in full — the ONLY check omitted for this path is client identity
         (`request.auth`), since there is no client request to authenticate; the reaper
         is a distinct, trusted, autonomous invocation that never impersonates a client
         and needs no `request.auth` check to be trusted. Path-owner and journal/session
         consistency are data-integrity checks, not client-authorization checks, and are
         never skipped for either trigger.

     Only once every applicable check above passes does the claim below run, IN THE SAME
     TRANSACTION:
       - status=='finalized' → return the already-created asset's id (idempotent). This
         response is now itself gated behind every check above — an unauthorized caller
         can no longer learn even this idempotent result without first being authorized.
       - status in ('failed','expired') → throw "session no longer valid."
       - status=='finalizing' && leaseExpiresAt > now → throw "in progress, retry shortly."
       - status=='finalizing' && leaseExpiresAt <= now → STEAL: new leaseOwner=<this
         invocation's attempt id>, leaseExpiresAt=now+2min.
       - status=='pending':
           - expiresAt <= now (checked fresh, this instant) → throw "session expired." Do
             not claim.
           - else → claim: status='finalizing', leaseOwner=<this attempt id>,
             leaseExpiresAt=now+2min.
     Commit.
     Record <this attempt id> as `myLease` for use in every subsequent step below; every
     subsequent read and write in this flow (steps 2-4) addresses the session by this same
     `sessionRef`, never by a bare `uploadId`.

  2. (lease held, outside the transaction) Admin SDK getMetadata() on BOTH
     `sessionRef`'s storage.fullPath and storage.thumbPath, independently.

  3. Transaction — resolve. Re-reads `sessionRef` fresh and verifies `status=='finalizing'
     && leaseOwner==myLease` before writing anything.

     **Grounded stale-invocation result — supersedes v7-Corrected's "abort silently,
     return without error" (see §21 for why that was rejected):** if this ownership check
     fails (a newer invocation has since stolen the lease and already resolved the
     session), this invocation does NOT merely abort — it re-reads `sessionRef`'s current,
     authoritative state one more time and returns a result grounded in that live state:
       if current status == 'finalized': return { status:'finalized', assetId: <recorded id> }
       if current status == 'finalizing' (a still-valid lease held by someone else):
         return { status:'in_progress' }
       if current status == 'failed':  return { status:'failed', reason: validationError or missingObjects }
       if current status == 'expired': return { status:'expired' }
     No code path returns a bare "success" without an assetId, and none fabricates or
     guesses an assetId this invocation didn't itself verify.

     Given the ownership check passes:
     - Object not found for one or both → set sessionRef.status='failed', failedAt=now,
       missingObjects=[whichever]. Stop. (Any object that DID upload is left for cleanup,
       §7.3, to remove.)
     - Both found → verifiedFull={mimeType, size} and verifiedThumb={mimeType, size} from
       step 2's independent reads:
         - either mimeType not in the allow-list → status='failed', failedAt=now,
           validationError='invalid content type'. Stop.
         - either size exceeds its own limit (20 MiB full / 500 KiB thumb) → status='failed',
           failedAt=now, validationError='size exceeds limit'. Stop.
         - otherwise → create users/{ownerUid}/photoAssets/{uploadId} (same ownerUid as
           sessionRef's own path segment): ownerUid, uploadedByUid=session.requestedByUid,
           storage.{fullPath,thumbPath,fullUrl,thumbUrl} (fullUrl/thumbUrl via
           getDownloadURL, this same server call), storage.fullDeleted=false,
           storage.thumbDeleted=false, storage.storageAttempted=false, filename,
           declaredMimeType, declaredSize (audit only), verifiedFull, verifiedThumb, width,
           height (unverified hints), uploadedAt=now, status='active', deletionPolicy='owner_only',
           sourceNotebookId=session.notebookId, sourceNotebookName=<looked up>;
           set sessionRef.status='finalized', finalizedAt=now, verifiedFull, verifiedThumb.
           (Asset creation and session finalization remain in the SAME transaction — no
           crash window exists between them.)
     Commit.
  4. Return the new assetId (or the grounded failure/in-progress result) to the caller.
```

### 7.3 Cleanup — three responsibilities, terminal handling

```
A) Sweep pending-and-expired sessions, AND recover a crashed `expiring` claim.
   **CORRECTED — the known bare-`uploadId` defect in `resolveExpiringSession` is fixed
   here, before this document is used for emulator validation.** This responsibility
   operates on the same nested per-owner schema as §7.2 (`users/{ownerUid}/pendingUploads/
   {uploadId}`), and the version of this function first merged into this document had the
   identical defect `resolveFinalizingSession` was already corrected for: a bare
   `uploadId`, no owner segment, no way to resolve the actual document without an unscoped
   search.

   **A second, previously-missing query is also required here — this is a distinct defect
   from the bare-`uploadId` one, not the same fix twice.** `resolveExpiringSession`'s own
   step 1 (below) moves a claimed session from `pending` to `expiring` as its very first
   write. If the worker crashes after that claim commits but before step 2's Storage
   deletes finish, the document's status is now `expiring`, not `pending` — it no longer
   matches a query that only ever looks for `status=='pending'`. A version of this
   responsibility that ran only that one query, and merely asserted the crashed session
   "will be rediscovered by that same query shape," was asserting something false: that
   query shape can never again match a document once its status has left `pending`. Fixed
   by running BOTH queries, every sweep, unconditionally:
     query (collection group) pendingUploads where status=='pending'  AND expiresAt      <= now
     query (collection group) pendingUploads where status=='expiring' AND leaseExpiresAt <= now
   — the first query finds sessions that have never been claimed; the second finds
   sessions whose claim was made but never completed (any worker crash, timeout, or
   deployment restart between the claim and step 3's terminal write). Each result, from
   either query, is a `QueryDocumentSnapshot` whose own `.ref` already carries the full
   path, owner segment included.
   for each resulting docSnapshot, from either query: resolveExpiringSession(docSnapshot.ref)
   — passing that literal reference straight through, never a bare `uploadId` extracted
   back out of it.

   **Idempotency, stated explicitly — this is what makes running two queries every sweep,
   and any overlap between them or between concurrent scheduler runs, safe rather than a
   new race to reason about.** A single document can never match both queries in the same
   sweep (its `status` can only equal one value at a time), so the two queries never
   double-submit the same document within one sweep. Across sweeps, or between two
   concurrent scheduler invocations, the SAME document can legitimately be returned more
   than once — this is fine by construction: `resolveExpiringSession`'s own claim (step 1
   below) is itself a transaction gated on the document's CURRENT status and lease, so a
   second, redundant invocation for a session another invocation already claimed, expired,
   or is mid-claiming simply finds a status/lease that no longer matches what it expected
   and skips or no-ops — never double-deletes, never double-writes, never errors. Running
   this responsibility's two queries redundantly, or running two overlapping scheduler
   instances, produces at most wasted reads, never incorrect state.

resolveExpiringSession(sessionRef):
  // sessionRef = the exact document reference at users/{ownerUid}/pendingUploads/{uploadId},
  // as returned by responsibility A's pending-query (first claim) or its expiring-query
  // (recovering a crashed claim) — never a bare uploadId, never reconstructed or guessed.
  1. Transaction — claim:
     read sessionRef.
     - **Path-owner integrity, verified explicitly before anything below acts on this
       session's Storage paths**: the document at sessionRef exists, and its recorded
       `ownerUid` field equals sessionRef's own `{ownerUid}` path segment — else throw/skip
       "session inconsistent," and do NOT proceed to step 2. This scheduled sweep has no
       client identity to check (there is no `request.auth` at all in this trigger), so
       this integrity check is what stands in place of §7.2's client-authorization checks
       here.
     - **Storage-path shape integrity — CORRECTED, previously missing (see the shared
       `storagePathsMatchExpected` check defined in full in §7.2, reused verbatim here):
       the document's OWN `ownerUid` matching its path segment does not by itself prove
       the `storage.fullPath`/`storage.thumbPath` STRING VALUES it carries actually point
       into that same owner's Storage tree** — those are separate fields, and nothing
       upstream of this read has ever cross-checked them against the deterministic path
       shape a legitimate session is supposed to have. Required, before step 2 is ever
       reached: `storagePathsMatchExpected(session, sessionRef)` — else throw/skip
       "session storage paths inconsistent," do NOT proceed to step 2, and flag the
       document for manual review (§7.2 documents the exact check and this failure mode
       once, for all three call sites).
     - status=='pending' && expiresAt<=now → status='expiring', leaseOwner=<this run's
       attempt id>, leaseExpiresAt=now+2min. Commit.
     - status=='expiring' && leaseExpiresAt<=now → STEAL: new leaseOwner/leaseExpiresAt. Commit.
     - any other status → skip (this is the idempotency guarantee described above in
       action: a redundant or overlapping invocation for a session already resolved,
       claimed by someone else with a still-valid lease, or in any other state this step
       doesn't recognize as actionable, simply does nothing).
     Record `myLease`.
  2. (lease held) Delete `sessionRef`'s own storage.fullPath and storage.thumbPath — the
     EXACT strings already validated by step 1's `storagePathsMatchExpected` check, read
     from the document at `sessionRef`, never reconstructed — not-found on either is
     success (this is what makes step 1's crash-recovery query safe to re-run: a session
     whose objects were already deleted before a crash simply finds them already gone on
     the retry).
  3. Transaction: re-read `sessionRef` fresh; re-verify status=='expiring' &&
     leaseOwner==myLease (same stale-invocation guard as resolveFinalizingSession, and the
     same grounded-result principle from §7.2 applies if it fails); if it still holds, set
     `sessionRef`.status='expired', expiredAt=now.

B) Reap stuck 'finalizing' leases (autonomous, no client retry required):
   **CORRECTED — passes the exact document reference, never a bare `uploadId`.** Since
   sessions live per-owner at `users/{ownerUid}/pendingUploads/{uploadId}` (§7.2), a
   scheduled function with no per-user scoping context can only find them via a
   `collectionGroup('pendingUploads')` query, which Firestore returns as
   `QueryDocumentSnapshot`s whose own `.ref` already carries the full path, owner segment
   included:
     query (collection group) pendingUploads where status=='finalizing' AND
     leaseExpiresAt <= now — each result's `.ref` IS the exact sessionRef, never
     reconstructed or guessed.
   for each resulting docSnapshot:
     call resolveFinalizingSession(docSnapshot.ref, {isClientTriggered: false}) —
     passing that literal reference straight through. Per §7.2 step 1, this path still
     runs the path-owner-integrity and journal/session-relationship checks in full; it
     only omits the `request.auth`/client-identity checks, since this is a distinct,
     trusted, autonomous internal invocation, not a client request, and does not
     impersonate any client identity. It needs no other client-supplied data, since
     beginUpload already captured everything the session needs.

C) Sweep terminal sessions older than a 24-hour retention window, using the PRECISE
   per-status timestamp fields. **CORRECTED — same collection-group-reference pattern as
   A and B**, since this responsibility also acts on Storage paths read from the session
   document and must know exactly whose paths they are:
     query (collection group) pendingUploads where status=='failed'  AND failedAt  <= now - 24h
     query (collection group) pendingUploads where status=='expired' AND expiredAt <= now - 24h
   for each resulting docSnapshot (from either query):
     - **Path-owner integrity, verified explicitly before this responsibility acts on any
       Storage path**: docSnapshot's recorded `ownerUid` field must equal
       docSnapshot.ref's own `{ownerUid}` path segment — else skip this document (leave it
       for manual review rather than deleting a Storage object derived from an
       inconsistent record; this responsibility runs no transaction of its own, so this
       check is this step's entire integrity guarantee, evaluated fresh against each
       result before anything below it runs).
     - **Storage-path shape integrity — CORRECTED, previously missing.** The same
       `storagePathsMatchExpected(session, sessionRef)` check defined in full in §7.2,
       reused verbatim here: docSnapshot's `ownerUid` matching its own path segment does
       not by itself prove `storage.fullPath`/`storage.thumbPath` point into that same
       owner's tree. If this check fails: skip this document entirely — perform NO Storage
       operation on it, do NOT delete the session document either — and flag it for manual
       review, exactly as §7.2/§7.3-A do. This is the third and last of the three call
       sites named in that check's definition.
     - delete any Storage object(s) still present at docSnapshot's own
       storage.fullPath/storage.thumbPath — the EXACT strings just validated above, read
       from the document itself, never reconstructed from a bare `uploadId` (idempotent —
       not-found is fine; this is what guarantees a one-file-uploaded/one-file-missing
       terminal session's lone orphan is never left behind indefinitely).
     - delete the document at `docSnapshot.ref` itself — the exact reference the query
       returned, never a path rebuilt from `uploadId` alone.
```

**Guarantees**: no active asset may point to a missing object (asset creation is gated on
step 2's fresh existence+metadata checks). No failed session may leave an untracked
Storage object indefinitely (responsibility C, bounded to 24h). No stale invocation may
overwrite a newer invocation's already-correct outcome, and none ever returns an
ungrounded bare success (§7.2's corrected stale-invocation handling).

### 7.4 Required Firestore collection-group indexes

**NEW — previously undocumented.** Every scheduled query in §7.3 combines an equality
filter on `status` with a range/inequality filter on a timestamp field
(`expiresAt`/`leaseExpiresAt`/`failedAt`/`expiredAt`), run as a `collectionGroup` query
across every `users/*/pendingUploads` subcollection. Firestore requires a composite index
for exactly this shape of query, and — critically — a **collection-group-scoped** index
specifically, not the single-collection index Firestore may create automatically for
simple per-document queries. None of this document's earlier rounds named these indexes
explicitly; they are required before the scheduled cleanup Functions can run correctly at
all, in either the emulator or production.

**Exact `firestore.indexes.json` entries required**, covering every query in §7.3:

```json
{
  "indexes": [
    {
      "collectionGroup": "pendingUploads",
      "queryScope": "COLLECTION_GROUP",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "expiresAt", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "pendingUploads",
      "queryScope": "COLLECTION_GROUP",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "leaseExpiresAt", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "pendingUploads",
      "queryScope": "COLLECTION_GROUP",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "failedAt", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "pendingUploads",
      "queryScope": "COLLECTION_GROUP",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "expiredAt", "order": "ASCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}
```

Mapped explicitly to the query each one serves:
| Index (`status` + …) | Serves |
|---|---|
| `expiresAt` | §7.3 A's first query: `status=='pending' && expiresAt<=now` |
| `leaseExpiresAt` | §7.3 A's second query: `status=='expiring' && leaseExpiresAt<=now` (crash recovery), **and** §7.3 B's query: `status=='finalizing' && leaseExpiresAt<=now` — both filter on the same field pair, so this one index serves both queries |
| `failedAt` | §7.3 C's first query: `status=='failed' && failedAt<=now-24h` |
| `expiredAt` | §7.3 C's second query: `status=='expired' && expiredAt<=now-24h` |

**Emulator success does not prove production index readiness, stated explicitly.** The
Firebase Emulator Suite's Firestore emulator does not enforce or require index *build*
time the way production Firestore does — a composite index that would take real time to
build and become `READY` on production data behaves effectively instantly in the
emulator, and the emulator may not even require the index to be declared for a query to
succeed in every version. A passing emulator test for any of §7.3's queries is evidence
the query *shape* and the surrounding logic are correct; it is **not** evidence that the
corresponding production index exists, is building, or has finished building — those are
facts about production infrastructure state that only production (or a genuinely separate
disposable project with real index-build behavior) can establish.

**Deployment gate, added to §25**: the four indexes above must be deployed
(`firebase deploy --only firestore:indexes` or equivalent) and their build status
explicitly confirmed `READY` — not merely "deployment command exited zero," since index
builds are asynchronous and a newly-submitted index can remain `CREATING` for a period
proportional to existing data volume — **before** the scheduled cleanup Functions
(§7.3's three responsibilities) are deployed or enabled. This is its own named deployment
approval gate, distinct from and prior to the six-step Hosting/Functions/Rules sequence
already in §25, because a cleanup Function that starts running against a not-yet-`READY`
index does not merely run slowly — its collection-group queries fail outright until the
index finishes building, which would leave `pending`/`expiring`/`finalizing`/`failed`/
`expired` sessions unswept for however long that takes, with no error surfaced to any
end user (nothing about upload or finalize depends on this index; only the background
sweep does).

---

## 8. Element write protection — type-aware protected-field rule

*(Source: v7-Corrected §3, the only place this type-aware logic was ever fully written
out. **Mechanically corrected here** to replace its `if (...) { return ...; }` statements
with pure short-circuit/ternary expressions — the document's own globally-stated rule,
applied consistently by the missing-sections round to every OTHER helper function, but
never actually re-applied to this specific one on disk. This is a syntax-only fix with no
logic change; flagged explicitly in the Reconciliation Appendix as inferred rather than
copied verbatim from any single source.)*

**The bug this corrects (from v7-Corrected, still valid)**: an unconditional protected-key
rule would have silently broken `VoiceMemoElement.jsx`, which legitimately writes
`data.storageUrl`/`data.duration` directly as part of normal voice-memo recording and
removal — confirmed in §1's code audit. Protection must be type-aware.

```js
function isPhotoBearingType(t) {
  return t == 'image' || t == 'cover' || t == 'collage';
}

function hasProperDataMap(doc) {
  return ('data' in doc) && (doc.data is map);
}

function elementTypeImmutable() {
  // Restated from §5: no legitimate feature ever changes an element's type in place.
  // Always checked, independent of the photo-field check below — this also closes an
  // evasion where a client could try to smuggle a photo-field change through by
  // relabeling an `image` element as `voiceMemo` in the same write.
  return resource.data.type == request.resource.data.type;
}

function protectedPhotoKeysTouched() {
  return !hasProperDataMap(resource.data) || !hasProperDataMap(request.resource.data) ||
    (isPhotoBearingType(resource.data.type) &&
     resource.data.data.diff(request.resource.data.data).affectedKeys()
       .hasAny(['assetId', 'assetIds', 'photos', 'storageUrl', 'thumbnailUrl', 'photoId']));
}
```

A malformed/missing `data` map on either side is treated conservatively as "touched" —
never a bypass. A non-photo-bearing type (text, divider, sticker, voiceMemo, weather,
drawing, keepsake, route map, ...) is never restricted by this function at all; its own
legitimate fields remain freely client-editable exactly as today. An array field
(`photos`, the collage slot list) is compared as a whole value by Firestore's map
`diff()` — changing any single slot, adding a slot, or removing a slot all register as
`photos` having changed, catching every slot-level mutation through this one check.

**Creation-time protection** (the corresponding gap at `create` time — nothing
legitimately needs a photo field pre-populated at element creation, for any type; every
real flow creates the element empty and sets these fields via a later, callable-mediated
update):

```js
function photoFieldsEmpty(data) {
  return (!('assetId' in data) || data.assetId == null)
      && (!('assetIds' in data) || data.assetIds == [])
      && (!('photos' in data) || data.photos == [])
      && (!('photoId' in data) || data.photoId == null)
      && (!('storageUrl' in data) || data.storageUrl == null)
      && (!('thumbnailUrl' in data) || data.thumbnailUrl == null);
}
function safeCreateDataCheck(newDoc) {
  return !('data' in newDoc) ||
    (newDoc.data is map && photoFieldsEmpty(newDoc.data));
}
```
*(`safeCreateDataCheck`'s ternary-free rewrite: no `data` field at all is fine; a `data`
field that is not a map is denied outright — `newDoc.data is map` is false, so the second
disjunct is false, and since `'data' in newDoc` is true the first disjunct is also false,
so the whole expression is false, i.e. denied; a proper map is checked against
`photoFieldsEmpty`. This reproduces the original `if`-based logic exactly, in valid
syntax.)*

The trusted callables (`attachPhoto`/`replacePhoto`/`detachPhoto`/the finalize path) run
via the Admin SDK, which bypasses Firestore Security Rules entirely — this function only
ever evaluates client-originated requests.

---

## 9. Element/page deletion, duplication, and layout conversion — server-mediated, bounded

*(Source: MERGED. The reference-cleanup mechanics — which refs to delete/create for each
operation — are v7-Corrected §4, the only place they were fully specified. The bounding/
gate logic wrapping those mechanics is the missing-sections file's §10 — final, and a
genuine correction of v7-Corrected's non-authoritative "dynamic batch sizing, computed
once, assumed small enough in practice" approach. Direct client `delete` on elements and
pages is denied unconditionally in the rules — Admin SDK callables only, for every
element regardless of type, per v7-Corrected §4's simpler unconditional design, never
re-litigated since.)*

```
MAX_TX_WRITES = 480                       // shared safety margin, used consistently throughout
MAX_TX_REQUEST_BYTES = 8 * 1024 * 1024    // headroom under Firestore's ~10 MiB per-transaction limit
```

**Governing principle**: an optional, fast pre-flight read may run first, purely to give
the caller a friendly early rejection. But the transaction itself, once started,
independently re-reads the current source data, recomputes the exact write count and
byte size, and rechecks every referenced asset's status — all reads before any write, as
Firestore transactions require — and aborts if anything now exceeds the limit, never
trusting the pre-flight's numbers as authoritative. A concurrent edit between pre-flight
and transaction, or Firestore's own optimistic-concurrency conflict detection, simply
fails and retries the transaction against the new, current snapshot.

```
deleteElement({elementId}):
  1. Verify hasWriteAccess(the element's notebookId) && journalIsActive(...).
  2. ONE transaction — AUTHORITATIVE:
     a. Re-read the element fresh.
     b. Recompute totalWrites = 1 (canonical) + 1 (mirror, if applicable)
                              + K (ref writes — one per slot for a collage, 0 or 1 otherwise),
        and totalBytes similarly.
     c. If totalWrites > MAX_TX_WRITES OR totalBytes > MAX_TX_REQUEST_BYTES: abort and
        reject — "this element has K photo slots, requiring M operations, exceeding the
        Z-operation limit for a single deletion in this release; remove collage slots
        individually via detachPhoto first, then retry" — a real, always-available escape
        hatch, since a single-slot detach is always small.
     d. If K > 0 (the element carries any photo reference): additionally require
        isOwner(notebookId) — §4's gate. A delete of a non-photo element proceeds under
        hasWriteAccess alone.
     e. Enumerate and delete every one of the element's photoAssetRefs entries, then
        delete the element doc (canonical and mirror).
  Commit.

duplicateElement({elementId}):
  Identical structure to deleteElement's bound (steps a-d above), with duplicateAsset
  status re-verified fresh (status=='active') before committing, then:
  create the new element doc with the SAME data (including any assetId/photos), AND, in
  the same transaction, create a NEW photoAssetRefs entry for the new
  (assetId, newElementId, slotKey) tuple — the original element's own ref is untouched;
  both now correctly exist independently. This is the only way to duplicate a
  photo-bearing element at all, since direct client creation already requires photo
  fields to be empty (§8) — duplication of real photo content is structurally impossible
  except through this callable.

duplicatePage({pageId}) / replacePageElements({pageId, newLayoutElements}):
  1. Verify hasWriteAccess(the page's notebookId) && journalIsActive(...).
  2. (optional, fast) Pre-flight, reads only, for an early friendly rejection.
  3. ONE transaction — AUTHORITATIVE:
     a. Re-read the page and its complete current element set fresh, inside the transaction.
     b. Recompute:
          pageWrites    = 1 (new canonical page) + 1 (new mirror page, if applicable)
                           — duplicatePage only; replacePageElements has no new page write
          elementWrites = N (new canonical elements) + N (new mirror elements, if applicable)
                           [duplicatePage], or (old deletes + new creates) [replacePageElements]
          refWrites     = sum over each affected element of (0 non-photo, 1 image/cover,
                           K for a K-slot collage) — for replacePageElements, both the old
                           side's ref-deletes and the new side's ref-creates count
          totalWrites   = pageWrites + elementWrites + refWrites
          totalBytes    = sum of serialized byte size of every document this transaction
                           would write
     c. If totalWrites > MAX_TX_WRITES OR totalBytes > MAX_TX_REQUEST_BYTES: abort — reject
        with the freshly computed numbers, not the pre-flight's.
     d. If refWrites > 0: additionally require isOwner(notebookId) — §4's gate. An
        operation touching no photo content proceeds under hasWriteAccess alone.
     e. Recheck every referenced asset's status=='active' fresh, inside this same
        transaction. Any failure aborts the whole transaction.
     f. Perform every write (for replacePageElements: delete old elements' refs, delete
        old elements, create new elements, create new elements' refs, as applicable).
  Commit.

deletePage({pageId}):
  1. Verify hasWriteAccess(the page's notebookId) && journalIsActive(...).
  2. (optional, fast) Pre-flight, reads only, for an early friendly rejection.
  3. ONE transaction — AUTHORITATIVE:
     a. Re-read the page and its complete current element set fresh.
     b. Recompute totalWrites = 1 (page) + 1 (mirror page, if applicable)
                              + N (element deletes) + N (mirror element deletes, if applicable)
                              + R (ref-deletes, summed per element, fresh).
     c. If R > 0 (any element on the page carries a photo reference): additionally require
        isOwner(the page's notebookId) — §4's gate. Deleting a page with no photo content
        proceeds under hasWriteAccess alone.
     d. If totalWrites > MAX_TX_WRITES: abort — "this page has N elements requiring M
        operations, exceeding the Z-operation limit for a single deletion in this
        release; delete individual elements first via deleteElement to reduce the page
        below the limit, then delete the page."
        **Escape-hatch chain**: if the reason the page is over the limit is that ONE of
        its elements is itself an oversized collage (over the limit on its own, per
        deleteElement's bound above), the message names that specific element and
        instructs: remove that collage's slots individually via detachPhoto first
        (shrinking that one element below its own limit), then deleteElement it, then
        retry deletePage — every step in this chain is itself always small and safe, so
        the chain always terminates.
     e. Otherwise: delete every element's refs, delete every element (canonical and
        mirror), delete the page (canonical and mirror).
  Commit.
```

No chunking, no multi-batch window, at any point in this chain — every step is a single,
authoritative, atomic transaction; the only way forward from an oversized page/element is
a sequence of always-small, always-safe single-element operations the caller explicitly
performs.

**Feature-by-feature migration table** *(source: v7-Corrected §4, unrevisited, carried
forward unchanged)*:

| Existing feature | Current mechanism | New mechanism | User-visible change |
|---|---|---|---|
| Upload a new photo (image/cover) | direct `updateElement` write | `beginUpload`+`finalizeUpload`+`attachPhoto` | None — server-mediated underneath |
| Replace a photo | direct `updateElement` write | `replacePhoto` | None |
| Remove a photo from a page | direct `updateElement` write | `detachPhoto` | None |
| Collage: add/remove/reorder a slot | direct `updateElement` | `attachPhoto`/`detachPhoto` with `slotId`, or `reorderCollageSlots` | None |
| Delete an element | direct Firestore `delete` | `deleteElement` | None (ref cleanup now correct) |
| Delete a page | direct Firestore `delete` (cascades) | `deletePage` | None |
| Duplicate a page/element | `fsSaveElement` full copy | `duplicatePage`/`duplicateElement` | None visually; previously under-counted references — now correct |
| Apply/convert a layout | `fsReplacePageElements` | `replacePageElements` | None |
| Change a cover photo | direct `updateElement` (CoverElement.jsx) | `attachPhoto`/`replacePhoto` | None |
| Voice memo record/remove, sticker/text/drawing/weather/keepsake edits | direct `updateElement` | **unchanged** — none of these types are photo-bearing (§8) | None |

---

## 10. Notebook metadata operations

*(Source: missing-sections file §5. v7-Corrected §9 already denied direct client writes
to the notebooks document (`allow create, update, delete: if false`) but did not name or
specify the replacement operations — this section closes that gap with the code-grounded
inventory.)*

| Existing write | Current call | New trusted operation |
|---|---|---|
| Title / description edit | `fsUpdateNotebook(uid, id, {name, description})` | `updateNotebookMetadata({notebookId, name?, description?})` |
| Theme change, preserve-only | `updateTheme(patch)` → `fsUpdateNotebook` | `updateNotebookTheme({notebookId, themePatch})` |
| Theme change with restyle | `changeJournalTheme` → `restyleDryRun` + `commitRestyle` + `updateTheme` | same restyle machinery, wrapped: the element-restyle batch never touches photo fields, so it's unaffected by §8's rule; only the notebook-level theme write needs the new gate, via `updateNotebookTheme` |
| Cover photo | `setCoverPhoto(url)` → `fsUpdateNotebook` | `setNotebookCoverPhoto({notebookId, assetId})` — reference-tracked, §11 |
| Page size / journal-kind / Photo-a-Day settings | creation-time only | unchanged — no later-edit path exists to preserve |
| `isPublic` / `sharePublishedAt` | via `fsPublishShare`/`fsUnpublishShare` | written inside `publishShare`/`unpublishShare` themselves (§15), same transaction |
| Dashboard thumbnail/cover display | `fsGetFirstPageCover` — read-only | unaffected |
| Collaboration metadata on the notebook doc | none observed | unaffected |

`updateNotebookMetadata`, `updateNotebookTheme`, `setNotebookCoverPhoto` are added to the
deployment function list (§25). Both `updateNotebookMetadata` and `updateNotebookTheme`
use `hasWriteAccess(notebookId) && journalIsActive(notebookId)` — ordinary collaborative
metadata edits, not gated by §4's photo-governance policy. `setNotebookCoverPhoto` is
gated per §11 below.

---

## 11. Notebook cover photo reference tracking

*(Source: missing-sections file §5B — final. Supersedes any earlier "arbitrary
client-supplied cover URL" design implied by v7-Corrected's `setCoverPhoto`/`coverPhotoUrl`
carry-over.)*

```
/users/{ownerUid}/notebooks/{notebookId} gains (see §2 for full schema):
  coverAssetId: string | null, coverUrl: string | null, coverThumbUrl: string | null

photoAssetRefs/{assetId}/refs/{refDocId}.refType gains a third value: 'notebookCover'
  (alongside 'element' and 'publicShare'), using the identical hash-of-hashes id scheme
  defined in §17: refDocId(assetId, notebookId, 'notebookCover').

setNotebookCoverPhoto({notebookId, assetId}):
  1. Verify isOwner(notebookId) && journalIsActive(notebookId) — owner-only in the
     initial release, per §4's gate (cover selection is one of the explicitly listed
     initially-owner-only operations).
  2. ONE transaction:
       if assetId is non-null: verify photoAssets/{assetId}.status=='active' fresh.
       if the notebook currently has a coverAssetId set: delete that OLD
         (oldCoverAssetId, notebookId, 'notebookCover') ref doc.
       if assetId is non-null: create the NEW (assetId, notebookId, 'notebookCover') ref doc.
       set notebooks/{notebookId}.coverAssetId = assetId (or null to clear),
         coverUrl/coverThumbUrl = the asset's storage.fullUrl/thumbUrl (or null).
     Commit.
```

The notebook document never stores an independently-authoritative URL again —
`coverUrl`/`coverThumbUrl` are display-only caches, refreshed exclusively by this one
trusted operation. An arbitrary client-supplied URL not backed by a real `active` asset
is never accepted.

**Legacy `coverPhotoUrl` — display fallback required, not silent loss**: left entirely
untouched and unmigrated. The display logic must read `coverAssetId` first and, only
when it is absent, fall back to the legacy `coverPhotoUrl` field — never simply stop
showing a cover. A notebook with a legacy `coverPhotoUrl` and no `coverAssetId` continues
displaying its existing cover indefinitely, until an owner explicitly sets a new cover
through `setNotebookCoverPhoto`.

**Required read-only inventory before any deprecation decision** (not performed by this
document; requires separate approval, like every other inventory step in this project):
enumerate every existing notebook document and report which have a non-null
`coverPhotoUrl`. *(For the `test` journal specifically: no notebook-level
`coverPhotoUrl` was observed being set anywhere in this project's history — the one
bundled photo there lives on a page element, not a notebook cover field — so this case is
not expected to apply to it, but the inventory step above is what would actually confirm
that.)*

---

## 12. Propagating `notebookCover` through every dependent operation

*(Source: missing-sections file §5C — final, unmodified.)*

- **`requestPermanentDelete`** (§13): its reference-emptiness query is already
  `refType`-agnostic, so a `notebookCover` ref already blocks deletion structurally, with
  no code change to the query itself. What *is* required: the `lastBlockedReferences`
  diagnostic must include each blocking ref's `refType`, so an owner sees "blocked: in
  use as this journal's cover," not an undifferentiated "blocked: 1 reference."

- **`deleteJournal`** (§14): gains an explicit step, inserted immediately before the step
  that deletes the canonical `notebooks/{notebookId}` document: if
  `notebooks/{notebookId}.coverAssetId` is set, delete the corresponding
  `(coverAssetId, notebookId, 'notebookCover')` ref doc first. This was not implied by
  the existing sweep, which only ever walked element-derived refs.

- **`publishShare`** (§15): when computing `newAssetIds`, the computation now also
  includes `coverAssetId` whenever it is set and the published snapshot's own
  `coverPhotoUrl` field is derived from it. One asset can legitimately carry two
  simultaneous refs of different types — `notebookCover` and `publicShare` — each
  independently created and removed by its own operation. An asset is "in use" if *any*
  ref exists for it, regardless of type or count.

- **`unpublishShare`**: already removes every `publicShare`-type ref for the notebookId
  it is unpublishing — this automatically removes the cover's `publicShare` ref too, with
  no separate step needed. It never touches the same asset's `notebookCover` ref, which
  is governed exclusively by `setNotebookCoverPhoto` — unpublishing does not, and must
  not, affect cover selection.

- **Clearing or replacing the cover removes only the old `notebookCover` ref, never the
  asset**: already true by construction in §11's transaction.

- **Write-count formulas** (§9): a `notebookCover` ref-create or ref-delete is exactly
  one more operation of the same kind already counted generically as `R`/`refWrites` in
  every formula — no formula changes.

- **Test-matrix requirement**: every test scenario exercising "an asset with a blocking
  reference" must include at least one case where that reference is specifically a
  `notebookCover` — not only `element`/`publicShare` cases (§27/§28).

---

## 13. Asset permanent-deletion — retry-safe state machine

*(Source: v6 §4 — not revisited by any later round except for §12's `refType`-labeled
diagnostic requirement, applied here.)*

**The distinction, made explicit**: whether an unlock-to-`trashed` is safe depends
entirely on whether *any* Storage deletion has ever been attempted for this asset, not on
whether the *current* verification pass happens to be the first one chronologically.

```
requestPermanentDelete(assetId):
  1. Transaction: verify ownerUid==caller; verify status=='trashed'; set status='deleting'.
     (Only reachable once per lock — a second concurrent call sees status already
     changed and fails cleanly.)

  2. Query photoAssetRefs/{assetId}/refs.
     - Empty → proceed to step 3.
     - Non-empty:
         if storage.storageAttempted == false   (— no Storage delete call has EVER been
                                                     made for this asset; a clean
                                                     pre-attempt verification —)
           → Transaction: status='trashed', lastBlockedReferences=[...with refType, §12].
             Return blocked, SAFE.
         else  (— a Storage delete was attempted at some earlier point; a reference now
                  existing is an anomaly —)
           → Transaction: status='delete_failed',
             failureReason='reference_anomaly_after_storage_attempt',
             lastBlockedReferences=[...with refType]. Return blocked-and-LOCKED.
             **Never returns to 'trashed' or 'active' automatically from here.**

  3. Transaction: set storage.storageAttempted=true.  ← recorded BEFORE the first Storage
     call, precisely so any later verification pass can distinguish "nothing attempted
     yet" from "something was attempted" even if that attempt itself later fails.
  4. Delete Storage original — not-found ⇒ success. Transaction: storage.fullDeleted=true.
  5. Delete Storage thumb — not-found ⇒ success. Transaction: storage.thumbDeleted=true.
  6. Both true → delete photoAssets/{assetId} doc. Done.
     Either threw a real error → status='delete_failed', failureReason='storage_error',
     record which derivative(s) remain. Stop.

  Retry (from delete_failed, any failureReason): re-run step 2 fresh — which, because
  storage.storageAttempted is already true, will correctly refuse to auto-unlock even
  if it somehow finds a reference again — then resume at whichever of steps 4/5 still
  has its *Deleted flag false.

  The ONLY paths out of delete_failed are: (a) a retry that completes deletion (step 6),
  or (b) a distinct, explicit, audited manual-recovery workflow that independently
  re-verifies via direct Storage existence checks that BOTH objects genuinely still
  exist in full before permitting a deliberate "cancel deletion" transition back to
  trashed — never an automatic fallback, and not built as part of this release.
```

**State-transition table**:

| From | To | Condition | Automatic? |
|---|---|---|---|
| `trashed` | `deleting` | owner requests delete | yes (the lock) |
| `deleting` | `trashed` | refs found **and** `storageAttempted==false` | yes — the only safe auto-unlock |
| `deleting` | `delete_failed` (`reference_anomaly...`) | refs found **and** `storageAttempted==true` | yes, but **locked**, not an unlock |
| `deleting` | `delete_failed` (`storage_error`) | a Storage call threw | yes, locked |
| `deleting` | *(doc removed)* | both derivatives confirmed deleted, zero refs | yes |
| `delete_failed` | `deleting`-equivalent retry | explicit retry call | yes, resumes only remaining Storage ops |
| `delete_failed` | `trashed`/`active` | — | **never automatic**, only the manual-recovery workflow |

---

## 14. Journal deletion — complete sequence and retry terminal cases

*(Source: MERGED. The numbered sequence is v7-Corrected §5 — the most complete version,
correcting v6's sequence with dynamic batch sizing and the previously-missing notebook-doc
deletion step. The cover-ref cleanup step is inserted per §12. The retry terminal-case
table is the missing-sections file §9 — final, and more complete than v7-Corrected's
single "retry, resume from step 3" paragraph.)*

```
deleteJournal(notebookId):

  1. Transaction (the lock, multi-document, atomic with the dashboard cache):
       read journalAcls/{notebookId}. Verify caller==ownerUid. Verify journalStatus=='active'.
       set journalAcls.journalStatus='deleting'.
       set users/{ownerUid}/notebooks/{notebookId}.journalStatus='deleting' (cached copy,
         SAME transaction).
     Commit.

  2. From this point, every write path checks journalStatus=='active' and rejects otherwise.

  3. If the notebook is currently published: call unpublishShare(notebookId) (§15).

  4. Sweep loop, dynamic batch sizing: iterate elements for notebookId==X one at a time
     (or in small pages), and for each, count 1 (the element delete) plus however many
     photoAssetRefs entries it has (0 for non-photo elements, 1 for image/cover, N for an
     N-slot collage). Add the element's operations to the current batch; once the running
     total would exceed 480 (safety margin under Firestore's 500-op limit), commit the
     batch as-is and start a new one with this element as its first member. Continue until
     no elements remain, then do the same dynamic accumulation for pages.

     **CORRECTED — a single oversized element, handled without ever getting stuck.** The
     dynamic-batching rule above ("start a new batch with this element as its first
     member") silently assumed every individual element's own operation count already
     fits within one batch. It does not: a single collage can carry enough slots that its
     OWN ref-deletes alone exceed 480, and no batch — new or otherwise — can ever hold it.
     Left unhandled, the sweep would loop forever trying to place an element that never
     fits, with the journal already locked in `deleting` and no client-facing escape hatch
     available (`detachPhoto`/`deleteElement` both require `journalIsActive`, which is
     false for the whole duration of this sweep). **Chosen fix (of the two considered):
     while still inside this locked sweep, handle that one oversized element with its own
     bounded, idempotent sub-loop, rather than requiring a global product-level cap on
     collage size** (a static cap would need its own legacy-data inventory gate and
     constrains authoring generally, for a case only deletion actually needs to solve):
       - When the running per-element count check finds a SINGLE element whose own ref
         count alone exceeds 480 (i.e., it cannot fit in any batch by itself, not just the
         current one): switch to a dedicated sub-loop for that one element only, before
         resuming the outer sweep.
       - Sub-loop: query up to 480 of that element's remaining `photoAssetRefs` entries;
         delete them as one batch; commit; re-query "what remains for this element" — this
         re-query is itself the progress state, identically to the outer sweep's
         no-cursor-needed proof below. Repeat until a fresh query returns zero remaining
         refs for that element.
       - Only once that fresh query confirms zero refs remain does the element itself get
         deleted (canonical and mirror, a trivially small operation) — never before, so an
         element is never removed while it might still have live, un-swept references.
       - The outer sweep then resumes with the next element, exactly as if this one had
         been an ordinary, correctly-sized element all along.
     **Termination guarantee, and why the journal can never become permanently
     undeletable**: the lock set in step 1 already prevents any new photo reference from
     being created for this journal (every reference-creating operation requires
     `journalIsActive`, which is false throughout); no OTHER concurrent process is
     removing this specific journal's refs either, since deletion is the only process
     touching them once locked. The oversized element's ref count is therefore strictly
     monotonically decreasing across sub-loop iterations and reaches zero in a bounded
     number of chunk-commits (`⌈K/480⌉` for a K-slot collage) — regardless of how large K
     is, or how many crashes force a retry of the sub-loop itself (a retry simply re-runs
     the identical "query remaining, delete a chunk" step, which is idempotent). A journal
     is therefore never permanently stuck by an oversized element once its lifecycle lock
     has been set — the worst case is a longer sweep, never a stall.

     No-cursor-needed proof (outer sweep): the lock in step 1 prevents new creation from
     this point on, so the live "what remains" query at any invocation — first attempt or
     crash-retry — always reflects true current progress; no persisted cursor is required
     for correctness.

  5. Final re-query: confirm a fresh query for elements/pages/refs under this notebookId
     genuinely returns zero.

  6. Delete the mirror: journals/{notebookId} and its pages/elements/presence subcollections.

  7. Delete journalAcls/{notebookId}/members/{uid} for every member doc.

  8. **If `notebooks/{notebookId}.coverAssetId` is set** (§12): delete the corresponding
     `(coverAssetId, notebookId, 'notebookCover')` ref doc.

  9. Delete users/{ownerUid}/notebooks/{notebookId} — the canonical notebook document
     itself.

  10. Transaction: set journalAcls/{notebookId}.journalStatus='deleted', deletedAt=now
      (tombstone — root doc still present, still able to re-authorize a retry).

  11. Delete journalAcls/{notebookId} itself — the final operation.
```

**Retry terminal-case table** (complete):

| Retry finds | Action |
|---|---|
| `journalStatus == 'active'` (no deletion was ever started) | Not a retry — a fresh call; proceeds through the normal lock-then-sweep sequence. |
| `journalStatus == 'deleting'` | Resume from step 3 — the still-present `journalAcls` doc authorizes the resuming caller as the legitimate owner; no re-locking needed. |
| `journalStatus == 'deleted'`, `journalAcls` doc still present (tombstone) | Defensive re-verification: re-run the "confirm zero pages/elements/mirror/membership/notebook remain" check once more, then delete the tombstone doc. Recoverable, never an error. |
| `journalAcls` doc does not exist at all | Already fully, completely deleted. Report success — a no-op, not an error. |
| Two authorized retries invoked concurrently, both finding `'deleting'` | Both proceed with their own sweep passes concurrently — safe, not merely tolerated: every delete in the sweep is idempotent, so two overlapping sweeps converge to the same fully-deleted end state with no corruption, at most redundant harmless work. |

---

## 15. Publish, republish, unpublish

*(Source: MERGED. The simplified single-cap design (replacing the earlier locked
multi-transaction publish-job machinery) is v7-Corrected §6 — adopted per the reviewer's
explicit preference for a simple hard cap over an incomplete distributed job. The cap
value and the in-transaction snapshot-size recheck are corrected per the missing-sections
file §8 — final. The `coverAssetId` inclusion is §12.)*

**Why the job design was removed** (v7-Corrected's own reasoning, unrevisited): the
locked, multi-transaction publish-job machinery had three unresolved problems even after
correction — `deleteJournal` never checked or resolved its lock; a crashed job could hold
its lock forever with no reaper; and the job document's own arrays, plus the final
commit's snapshot write, were themselves unbounded and could exceed Firestore's
document-size limit regardless of asset count. Rather than patching all three, this
design adopts a hard cap and a flat rejection above it — no job, no lock, no distributed
state.

```
MAX_PUBLISH_ASSETS = 200          // CORRECTED from v7-Corrected's 300 — see the worst-case
                                      arithmetic below
MAX_SNAPSHOT_BYTES = 900 * 1024   // headroom under Firestore's 1 MiB document limit

publishShare(notebookId, sharePin):
  1. (cheap pre-check, not authoritative) verify caller==ownerUid; read canonical content;
     compute newAssetIds (including coverAssetId, §12, when the published snapshot's
     coverPhotoUrl is derived from it) and a serialized-size estimate of the resulting
     snapshot.
     If newAssetIds.length > MAX_PUBLISH_ASSETS OR the estimated size > MAX_SNAPSHOT_BYTES:
       reject immediately, naming the actual count/size and the limit — no transaction is
       even attempted for an over-cap request.
  2. ONE transaction — every authoritative check happens HERE, freshly. **CORRECTED: the
     first consolidation of this document stated (§16) that this transaction computes and
     enforces `toAdd + toRemove + 1 <= MAX_TX_WRITES`, but the algorithm as actually
     written here never contained that check — it only re-verified per-asset `active`
     status and the snapshot-size bound. The five checks below are now all explicit, all
     inside the transaction, all computed fresh, and all ordered so that every read
     completes before any write is issued (Firestore's own requirement for transactions,
     and the only way the checks below can be trusted as pre-write gates rather than
     advisory notes):**

     READS (all of the following, in order, before any write):
       a. re-read journalAcls(notebookId); verify journalStatus=='active'.
       b. re-verify caller==journalAcls(notebookId).ownerUid.
       c. re-read canonical content fresh and recompute newAssetIds (including
          coverAssetId per §12) — guards against content having changed between step 1's
          estimate and this transaction.
       d. oldAssetIds = query existing photoAssetRefs where refType=='publicShare' &&
          notebookId==X (also fresh, not trusted from step 1).
       e. compute toAdd = newAssetIds−oldAssetIds; toRemove = oldAssetIds−newAssetIds;
          unchanged = newAssetIds ∩ oldAssetIds.
       f. for every assetId in (toAdd ∪ unchanged): read photoAssets/{assetId} fresh.

     CHECKS (all of the following must pass; ANY failure aborts the WHOLE transaction —
     nothing changes, the old snapshot/refs remain exactly as they were):
       1. **`newAssetIds.length <= MAX_PUBLISH_ASSETS`, rechecked HERE against the fresh
          count from read (c)** — not trusted from step 1's pre-check alone, since content
          can grow between the estimate and this transaction.
       2. **the serialized snapshot size, recomputed HERE from the fresh content in read
          (c), is `<= MAX_SNAPSHOT_BYTES`** — if content changed such that fresh content
          now exceeds the limit, the transaction aborts with a clear "exceeds size limit"
          outcome, rather than either committing an oversized write or failing with an
          opaque Firestore document-size error.
       3. **`toAdd.length + toRemove.length + 1 <= MAX_TX_WRITES`, computed HERE from the
          fresh sets in read (e)** — the actual write-count guard this transaction
          performs, not merely the inductive argument in §16 (which proves the bound
          *should* hold given every publish obeys the same cap, but is not itself a
          runtime check; this is the runtime check that makes the guarantee real
          regardless of how any given `oldAssetIds` set came to exist — including the
          untreated pre-existing-share case named in §16).
       4. every assetId read in (f) has `status=='active'`.

     WRITES (only once every read above has completed and every check above has passed):
       overwrite public_notebooks/{notebookId} with the new snapshot; delete toRemove's
       ref docs; create toAdd's ref docs; unchanged refs left untouched entirely.
     Commit. Return success.

unpublishShare(notebookId):
  1. Verify caller==ownerUid.
  2. ONE transaction: re-verify ownership fresh; delete public_notebooks/{notebookId} and
     every one of its publicShare-type ref docs together (never the same asset's
     notebookCover ref, per §12).
  Commit. Since publishing is capped at MAX_PUBLISH_ASSETS <= 200, this always fits
  comfortably within one transaction's operation limit — no locked multi-batch teardown
  needed.
```

**Worst-case write-count arithmetic, computed explicitly (missing-sections file §8)**:
every publish (including whichever one produced the "old" reference set) is subject to
this same cap, so `oldAssetIds.length <= 200` always holds by induction. Worst case is a
complete swap: `toAdd <= 200` and `toRemove <= 200`, so `toAdd + toRemove <= 400`. Adding
the one snapshot write: `400 + 1 = 401`, comfortably under the 480-operation safety
margin used throughout §9. *(This closes v7-Corrected's math error: its 300-asset cap did
not bound `toAdd + toRemove` — a full-swap republish at 300 removed + 300 added is 600
ref-writes, exceeding Firestore's ~500-operation transaction limit even before the
snapshot write.)*

A journal that legitimately exceeds `MAX_PUBLISH_ASSETS` or `MAX_SNAPSHOT_BYTES` simply
cannot be published as a public share in this release — a clear, explained limitation,
not a silent failure or a half-built distributed system.

---

## 16. Pre-existing public shares: required inventory before relying on the cap induction

*(Source: missing-sections file §8B — final, unmodified.)*

**The gap**: §15's claim that "the old reference set is always ≤ 200" is proven only *by
induction over publishes that happened under this cap* — it says nothing about
`public_notebooks` documents that already exist today, published by the *current*
application, which has no cap, no `photoAssetRefs` concept, and no way to have created
authoritative reference records retroactively. For any such pre-existing snapshot, a
republish under the new system would compute `oldAssetIds` from a query that returns
**empty** — not because the old snapshot has zero photos, but because no authoritative
record of its photos was ever created.

**Required, read-only, pre-cutover inventory** (not performed by this document — a
required gate before this system's machinery is relied upon for any journal ever
published under the *current* app):
1. Enumerate every existing `public_notebooks` document.
2. For each: count its distinct referenced photos (legacy-shaped, by scanning embedded
   `pages[].elements[]` for `photoId`/`storageUrl`).
3. Measure each snapshot's serialized byte size.
4. Confirm every reference found is legacy-shaped.
5. **Proposed treatment (named, not executed, not approved)**: require an explicit
   re-publish of each existing share once the new system is live, rather than an
   automated retroactive backfill.
6. **None of steps 1–5 is performed without separate approval.**

**Publish's write-count check is a computed guard, not just a cap-compliance
assumption**: independent of the induction argument, `publishShare`'s transaction (§15)
already computes the actual `toAdd + toRemove + 1` value from a *fresh* query at call
time — it does not trust the 200-asset cap alone as proof of safety. Even in the
untreated pre-existing-share edge case (where `oldAssetIds` might be wrongly computed as
empty), the transaction's own arithmetic still correctly bounds *that specific call's*
write count — the gap this section closes is about *correctness of the resulting
reference set*, not about exceeding Firestore's operation limit.

---

## 17. Reference identifiers — unambiguous, collision-free encoding

*(Source: a corrected-hash message found only in the raw session transcript
(`msg index 19088` in the source conversation) — this fix was applied to an intermediate
draft of the missing-sections file but was **not** carried into the file's final state on
disk, which only references "the identical hash-of-hashes id scheme already defined"
without ever defining it. This is one of the two concrete gaps this consolidation closes
— see the Reconciliation Appendix.)*

```js
function componentDigest(s) { return sha256(s); }   // fixed-length output (32 bytes / 64
                                                        hex chars), regardless of input

refDocId(assetId, elementId, slotKey) =
  base64url( sha256( componentDigest(assetId) ++ componentDigest(elementId) ++ componentDigest(slotKey) ) )

refDocId(assetId, notebookId, 'publicShare') =
  base64url( sha256( componentDigest(assetId) ++ componentDigest(notebookId) ++ componentDigest('publicShare') ) )

refDocId(assetId, notebookId, 'notebookCover') =
  base64url( sha256( componentDigest(assetId) ++ componentDigest(notebookId) ++ componentDigest('notebookCover') ) )
```

This is a single SHA-256 digest **of the concatenation of the three inner digests** — the
outer hash's 32-byte output is used in full, un-truncated, and depends on all 96 bytes of
its input.

**The bug this fixes, stated precisely**: an earlier design took the first 64 base64
characters of the raw concatenation of three digests (96 bytes ≈ 128 base64 characters).
That retained all of `sha256(assetId)`, roughly half of `sha256(elementId)`, and **none**
of `sha256(slotKey)` — every distinct `slotKey` for the same `(assetId, elementId)` pair
collided onto the identical id. Hashing the concatenation once more, and using the full
un-truncated output, fixes this: every component contributes to every bit of the final
id. Hashing each component separately first (rather than joining with a delimiter like
`'|'`) also independently eliminates delimiter ambiguity — no input component's content
can cause two different tuples to collapse to the same concatenated output, since each
component occupies a fixed-width slot regardless of what characters it contains.

This is deterministic (same tuple ⇒ same id, required for idempotency checks) and
requires no assumption about what characters any component can or cannot contain.
Reconciliation scenarios (same asset in multiple slots, reordering, removing/replacing
one occurrence, deleting the whole element, republishing) are each a distinct `slotKey`
or `(assetId, notebookId, refType)` tuple, independently addressable via this hash, with
no cross-contamination between slots, ref types, or publish generations.

---

## 18. Presence rules

*(Source: missing-sections file §6 — final. Genuinely missing from every earlier round;
`journals/{journalId}/presence/{uid}` was referenced and swept on journal deletion but had
no matching rule anywhere before this, meaning presence read/write would have been
silently denied by Firestore's default-deny the moment any of the earlier rulesets
deployed.)*

```js
match /journals/{journalId}/presence/{uid} {
  allow read: if hasReadAccess(journalId);
  allow write: if hasReadAccess(journalId) && journalIsActive(journalId)
               && request.auth != null && request.auth.uid == uid
               && request.resource.data.uid == uid;
  allow delete: if request.auth != null && request.auth.uid == uid;
}
```

A user may only ever write or delete their *own* presence document (`uid` must match both
the path segment and the document's own `uid` field), and only while they have at least
read access to the journal. Delete is intentionally **not** gated on `journalIsActive` —
clearing your own presence is always safe, including during `deleting`. Presence is
structurally separate from pages/elements/notebooks — it cannot modify authoritative
journal content by construction.

---

## 19. Storage path audit

*(Source: MERGED. The rule design (an exclusive `photoAssets` match with no broader
wildcard also matching it) is v7-Corrected §9 Storage section — already correctly
structured, not revisited since. The code-grounded evidence table is the missing-sections
file §7 — final, offered as corroborating evidence for the same design, not a change to
it.)*

**Exact evidence, not assertion**: `storageHelpers.js` (~54 lines, read in full) contains
exactly two exported functions — `uploadPhoto` and `uploadAudio` — nothing else. A
repository-wide search for every Storage-SDK write/read pattern (`uploadBytes`,
`uploadString`, `ref(firebaseStorage`, `getDownloadURL`) returned matches in exactly one
file: `storageHelpers.js`. A separate search for `deleteObject` across the entire `src`
tree returned **zero matches anywhere** — the current app never deletes a Storage object,
through any code path.

| Path | Operation | Code evidence | Rule |
|---|---|---|---|
| `users/{uid}/photos/{id}.jpg`, `_thumb.jpg` | create | `uploadPhoto()`, the only writer | `match /users/{userId}/photos/{allPaths=**}`, owner-only, unchanged |
| `users/{uid}/audio/{id}.{ext}` | create | `uploadAudio()`, the only writer | `match /users/{userId}/audio/{allPaths=**}`, owner-only, unchanged |
| `users/{uid}/photoAssets/{uploadId}/{original,thumb}` | create only, via a pendingUpload session | new in this design | dedicated strict rule, §20 |
| any Storage **delete**, anywhere | — | zero matches for `deleteObject` in the entire codebase | `photoAssets`: `allow delete: if false` (Admin SDK only); `photos`/`audio`: delete remains bundled into the unchanged broad owner-write grant |
| any Storage **read** via the SDK (not a bearer URL) | — | not observed anywhere — every photo/audio display uses the stored bearer-token `storageUrl`, bypassing Storage rules by design | explicit owner-only `allow read` retained on every path as defense-in-depth |

**This table is the complete result of static code inspection, offered as evidence, not
proof of runtime behavior.** The broad `users/{userId}/{allPaths=**}` catch-all should be
removed (already replaced below by three explicit matches: `photoAssets/**`,
`photos/**`, `audio/**`) only after the emulator validation report (§29/§14 of the
missing-sections file) confirms these explicit paths collectively permit every operation
the deployed app actually performs.

---

## 20. Complete Firestore and Storage rules

*(Source: FULLY MERGED — v7-Corrected §9 as the structural base, with every
missing-sections-file correction applied: §3's `hasReadAccess`/`hasWriteAccess`/`isOwner`
replacing `hasEditorAccess` throughout; §5's document-identity functions applied to every
create/update rule; §6's lifecycle-gated membership rule; §18's presence rule added;
§13's null-safe `request.auth != null` added to the three Firestore rules that lacked it;
§8/§11's notebook fields and `setNotebookCoverPhoto`-mediated update path.)*

**CORRECTED — two separate, self-contained rules files.** The first consolidation of
this document presented the Firestore and Storage rule text as two comment-delimited
fragments inside one code block, with no `rules_version`, no `service` declaration, and
the Firestore helper functions floating outside any `match /databases/{database}/documents`
scope — since several of them reference `$(database)`, which is only bound *inside* that
match block, that placement would not actually compile. Below are the complete, literal
contents of two separate files, each valid as its own deployable unit. This is still not
a claim that either has been compiled — the emulator run remains the actual proof gate
(§28) — but the source here is no longer a fragment requiring reconstruction before it
could even be tried.

### `firestore.rules` — complete file

```js
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    // --- Access-control helpers (§3) — placed HERE, inside the {database} scope,
    // because every one of them dereferences $(database) via exists()/get(); none of
    // them would resolve if defined outside this match block. ---
    function aclExists(journalId) {
      return exists(/databases/$(database)/documents/journalAcls/$(journalId));
    }
    function aclDoc(journalId) {
      return get(/databases/$(database)/documents/journalAcls/$(journalId)).data;
    }
    function memberExists(journalId, uid) {
      return exists(/databases/$(database)/documents/journalAcls/$(journalId)/members/$(uid));
    }
    function memberRole(journalId, uid) {
      return get(/databases/$(database)/documents/journalAcls/$(journalId)/members/$(uid)).data.role;
    }
    function hasReadAccess(journalId) {
      return request.auth != null && aclExists(journalId) &&
        (request.auth.uid == aclDoc(journalId).ownerUid ||
         (memberExists(journalId, request.auth.uid) &&
          (memberRole(journalId, request.auth.uid) == 'editor' ||
           memberRole(journalId, request.auth.uid) == 'viewer')));
    }
    function hasWriteAccess(journalId) {
      return request.auth != null && aclExists(journalId) &&
        (request.auth.uid == aclDoc(journalId).ownerUid ||
         (memberExists(journalId, request.auth.uid) &&
          memberRole(journalId, request.auth.uid) == 'editor'));
    }
    function isOwner(journalId) {
      return request.auth != null && aclExists(journalId) && request.auth.uid == aclDoc(journalId).ownerUid;
    }
    function journalIsActive(journalId) {
      return aclExists(journalId) && aclDoc(journalId).journalStatus == 'active';
    }
    function pathOwnerMatchesAcl(ownerUid, journalId) {
      return aclExists(journalId) && aclDoc(journalId).ownerUid == ownerUid;
    }

    // --- Document identity (§5) — no $(database) dependency, but kept in the same
    // scope as everything else for a single, easy-to-audit helper block. ---
    function idMatchesPathId(doc, pathId) { return doc.id == pathId; }
    function notebookIdUnchanged() { return resource.data.notebookId == request.resource.data.notebookId; }
    function pageIdUnchanged() { return resource.data.pageId == request.resource.data.pageId; }
    function elementTypeImmutable() { return resource.data.type == request.resource.data.type; }

    // --- Protected-field rule (§8) ---
    function hasProperDataMap(doc) { return ('data' in doc) && (doc.data is map); }
    function isPhotoBearingType(t) { return t == 'image' || t == 'cover' || t == 'collage'; }
    function protectedPhotoKeysTouched() {
      return !hasProperDataMap(resource.data) || !hasProperDataMap(request.resource.data) ||
        (isPhotoBearingType(resource.data.type) &&
         resource.data.data.diff(request.resource.data.data).affectedKeys()
           .hasAny(['assetId', 'assetIds', 'photos', 'storageUrl', 'thumbnailUrl', 'photoId']));
    }
    function photoFieldsEmpty(data) {
      return (!('assetId' in data) || data.assetId == null)
          && (!('assetIds' in data) || data.assetIds == [])
          && (!('photos' in data) || data.photos == [])
          && (!('photoId' in data) || data.photoId == null)
          && (!('storageUrl' in data) || data.storageUrl == null)
          && (!('thumbnailUrl' in data) || data.thumbnailUrl == null);
    }
    function safeCreateDataCheck(newDoc) {
      return !('data' in newDoc) || (newDoc.data is map && photoFieldsEmpty(newDoc.data));
    }

  // ── ACL root: no client write at all. A journal is created/deleted only via trusted
  // callables (createJournal/deleteJournal) — this prevents an authenticated user from
  // squatting on an arbitrary unused journal id by writing this document directly.
  match /journalAcls/{journalId} {
    allow read: if hasReadAccess(journalId);
    allow create, update, delete: if false;   // Admin SDK (createJournal / deleteJournal) only
  }
  // Membership — lifecycle-gated, field-validated (§6).
  match /journalAcls/{journalId}/members/{uid} {
    allow read: if hasReadAccess(journalId);
    allow create: if isOwner(journalId) && journalIsActive(journalId)
      && (request.resource.data.role == 'editor' || request.resource.data.role == 'viewer')
      && request.resource.data.invitedByUid == request.auth.uid;
    allow update: if isOwner(journalId) && journalIsActive(journalId)
      && (request.resource.data.role == 'editor' || request.resource.data.role == 'viewer')
      && request.resource.data.invitedByUid == resource.data.invitedByUid
      && request.resource.data.invitedAt == resource.data.invitedAt;
    allow delete: if isOwner(journalId) && journalIsActive(journalId);
  }

  // Presence (§18).
  match /journals/{journalId}/presence/{uid} {
    allow read: if hasReadAccess(journalId);
    allow write: if hasReadAccess(journalId) && journalIsActive(journalId)
                 && request.auth != null && request.auth.uid == uid
                 && request.resource.data.uid == uid;
    allow delete: if request.auth != null && request.auth.uid == uid;
  }

  // Canonical notebook: no direct client write. Metadata changes route through the
  // named trusted operations (§10/§11) exclusively — this also protects §11's
  // coverAssetId/coverUrl/coverThumbUrl invariant from being bypassed by a generic
  // client update.
  match /users/{ownerUid}/notebooks/{notebookId} {
    allow read: if hasReadAccess(notebookId) && pathOwnerMatchesAcl(ownerUid, notebookId);
    allow create, update, delete: if false;   // Admin SDK only: createJournal, deleteJournal,
                                                // updateNotebookMetadata, updateNotebookTheme,
                                                // setNotebookCoverPhoto
  }
  match /users/{ownerUid}/pages/{pageId} {
    allow read: if hasReadAccess(resource.data.notebookId)
                && pathOwnerMatchesAcl(ownerUid, resource.data.notebookId);
    allow create: if hasWriteAccess(request.resource.data.notebookId)
                  && journalIsActive(request.resource.data.notebookId)
                  && pathOwnerMatchesAcl(ownerUid, request.resource.data.notebookId)
                  && idMatchesPathId(request.resource.data, pageId);
    allow update: if hasWriteAccess(resource.data.notebookId)
                  && journalIsActive(resource.data.notebookId)
                  && pathOwnerMatchesAcl(ownerUid, resource.data.notebookId)
                  && notebookIdUnchanged();
    allow delete: if false;   // deletePage/deleteJournal callables only (§9/§14)
  }
  match /users/{ownerUid}/elements/{elementId} {
    allow read: if hasReadAccess(resource.data.notebookId)
                && pathOwnerMatchesAcl(ownerUid, resource.data.notebookId);
    allow create: if hasWriteAccess(request.resource.data.notebookId)
                  && journalIsActive(request.resource.data.notebookId)
                  && pathOwnerMatchesAcl(ownerUid, request.resource.data.notebookId)
                  && idMatchesPathId(request.resource.data, elementId)
                  && safeCreateDataCheck(request.resource.data);
    allow update: if hasWriteAccess(resource.data.notebookId)
                  && journalIsActive(resource.data.notebookId)
                  && pathOwnerMatchesAcl(ownerUid, resource.data.notebookId)
                  && notebookIdUnchanged() && pageIdUnchanged() && elementTypeImmutable()
                  && !protectedPhotoKeysTouched();
    allow delete: if false;   // deleteElement/deletePage/deleteJournal callables only (§9/§14)
  }

  // Mirror — CORRECTED to actually carry the identical identity protections §5
  // describes, not a narrower subset. Every create verifies the document's own `id`
  // matches its path id (idMatchesPathId) in addition to belonging to this path's
  // journalId; every update verifies BOTH the existing and the proposed document belong
  // to this path's journalId (the mirror's equivalent of notebookIdUnchanged(), since the
  // mirror's notebookId IS the journalId by construction) and, for elements, that pageId
  // and type are also unchanged — matching canonical's element update rule exactly.
  match /journals/{journalId}/elements/{elementId} {
    allow read: if hasReadAccess(journalId);
    allow create: if hasWriteAccess(journalId) && journalIsActive(journalId)
                  && idMatchesPathId(request.resource.data, elementId)
                  && request.resource.data.notebookId == journalId
                  && safeCreateDataCheck(request.resource.data);
    allow update: if hasWriteAccess(journalId) && journalIsActive(journalId)
                  && resource.data.notebookId == journalId
                  && request.resource.data.notebookId == journalId
                  && pageIdUnchanged() && elementTypeImmutable()
                  && !protectedPhotoKeysTouched();
    allow delete: if false;
  }
  match /journals/{journalId}/pages/{pageId} {
    allow read: if hasReadAccess(journalId);
    allow create: if hasWriteAccess(journalId) && journalIsActive(journalId)
                  && idMatchesPathId(request.resource.data, pageId)
                  && request.resource.data.notebookId == journalId;
    allow update: if hasWriteAccess(journalId) && journalIsActive(journalId)
                  && resource.data.notebookId == journalId
                  && request.resource.data.notebookId == journalId;
    allow delete: if false;
  }
  match /journals/{journalId} {
    allow read: if hasReadAccess(journalId);
    allow write: if false;   // ownerUid/journalStatus mirrored here for display only, via Admin SDK
  }

  // Photo Library core — null-safe (§13's fix applied to all three below).
  match /users/{ownerUid}/photoAssets/{assetId} {
    allow read: if request.auth != null && request.auth.uid == ownerUid;    // owner-only library, §4
    allow create, update, delete: if false;          // Admin SDK (trusted callables) only
  }
  match /users/{ownerUid}/photoAssetRefs/{assetId}/refs/{refId} {
    allow read: if request.auth != null && request.auth.uid == ownerUid;
    allow write: if false;                           // no client write, ever
  }
  match /users/{ownerUid}/pendingUploads/{uploadId} {
    allow read: if request.auth != null && request.auth.uid == ownerUid;
    allow create, update, delete: if false;          // clients only call beginUpload/finalizeUpload
  }
  match /public_notebooks/{notebookId} {
    allow read: if true;
    allow write: if false;                           // Admin SDK (publishShare/unpublishShare) only
  }
    match /config/photoLibrary {
      allow read: if request.auth != null;
      allow write: if false;
    }
  }
}
```

*(Whitespace/indentation carries no semantic meaning in Firestore Rules — only the
brace structure does. The body above is complete and correctly nested: every `match`
block from `journalAcls` through `config/photoLibrary` sits inside `match
/databases/{database}/documents { ... }`, which sits inside `service cloud.firestore {
... }`.)*

### `storage.rules` — complete file

```js
rules_version = '2';

service firebase.storage {

  // --- Helper functions, at the SERVICE level — valid scope for Storage Rules, and the
  // conventional placement since neither function depends on any Storage path variable
  // (bucket/path segments), only on a Firestore cross-service read. ---
  function pendingSession(ownerUid, uploadId) {
    return firestore.get(/databases/(default)/documents/users/$(ownerUid)/pendingUploads/$(uploadId)).data;
  }
  function pendingSessionExists(ownerUid, uploadId) {
    return firestore.exists(/databases/(default)/documents/users/$(ownerUid)/pendingUploads/$(uploadId));
  }

  match /b/{bucket}/o {

    // Exclusive match for the new photo-asset path — nothing broader below is also
    // allowed to match it (this is what closes the catch-all bypass, §19).
    match /users/{ownerUid}/photoAssets/{uploadId}/{fileName} {
      allow write: if request.auth != null
        && fileName in ['original', 'thumb']
        && pendingSessionExists(ownerUid, uploadId)
        && pendingSession(ownerUid, uploadId).status == 'pending'
        && pendingSession(ownerUid, uploadId).requestedByUid == request.auth.uid
        && pendingSession(ownerUid, uploadId).expiresAt > request.time
        && request.resource.contentType in ['image/jpeg', 'image/png', 'image/webp']
        && request.resource.size <= (fileName == 'thumb' ? 500 * 1024 : 20 * 1024 * 1024);
        // Declared contentType only — not proof of real image bytes (§7.2).
      allow read: if request.auth != null && request.auth.uid == ownerUid
                  && fileName in ['original', 'thumb'];
      allow delete: if false;    // Admin SDK (permanent-delete / cleanup) only
    }

    // Legacy photo path — unchanged, still owner-only, still exists for the one real
    // legacy photo until its separately-approved migration; not touched by this design.
    match /users/{userId}/photos/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    // Audio (voice memos) — unaffected by this design.
    match /users/{userId}/audio/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    // No {allPaths=**} catch-all under users/{uid}/ — that catch-all is exactly what
    // caused the bypass §19 corrects, and is removed entirely, not narrowed.
  }
}
```

Both files above are presented as complete, literal file contents — everything needed to
attempt a deploy or an emulator load is here; nothing is left implied or requires
reconstruction from fragments. **Compilation is still unproven by this document — §28's
emulator run is the actual gate.**

---

## 21. Stale upload-invocation results

*(Source: missing-sections file §11 — final. This EXPLICITLY REJECTS v7-Corrected §2.2's
"abort silently, return without error" behavior for a lease-lost invocation — already
applied above in §7.2/§7.3; restated here as its own section since it's a named,
standalone correction the validation report must specifically test.)*

**The gap this closes**: a prior design had a stale (lease-lost) invocation of
`resolveFinalizingSession` abort silently and return without error — a caller receiving
no error and no asset id has no way to distinguish "nothing happened yet, retry" from
"something else already succeeded, here's what."

**Fix, applied in §7.2/§7.3**: a stale invocation, upon discovering it has lost the lease,
does not merely abort — it re-reads the session's current, authoritative state one more
time and returns a result grounded in that live state, never in what this particular
invocation did or didn't do. No code path returns a bare "success" without an `assetId`,
and none fabricates or guesses an `assetId` this specific invocation didn't verify.

---

## 22. Public-share PIN — documented honestly

*(Source: missing-sections file §12 — final, unmodified. Explicitly NOT redesigned per
separate, later user instruction: PIN redesign is deferred to a future project.)*

`public_notebooks` is readable by anyone (`allow read: if true`), and `sharePin` lives
inside that same publicly-readable document, alongside the full page content it's
nominally meant to gate. **Stated plainly: as currently designed, `sharePin` provides no
real access control.** Anyone who can read the document at all (everyone, by the rule
above) can read the PIN and the content it supposedly protects in the same request.

This is a **pre-existing characteristic of the current application's sharing feature**,
not something newly introduced by the photo-library design.

**If real PIN-gated access control is wanted**, the available fix is a genuinely
different serving architecture: store the actual page content in a *non*-publicly-readable
document, served only through a server-side endpoint that validates a submitted PIN
against a never-publicly-exposed stored hash. **This is not built or decided here** — it
is named as an available option, left as an explicit open question, not silently
perpetuated or silently fixed.

---

## 23. Null-safe authentication checks

*(Source: missing-sections file §13 — final; applied in §20's rule text above.)*

Every rule that reads `request.auth.uid` now first checks `request.auth != null` in the
same expression — for clarity and predictable denial, not because the prior form was
proven exploitable (Firestore Rules generally treat an evaluation error as a deny), but
because relying on that implicit behavior is not trusted here. This specifically applies
to the three Firestore rules that lacked it before this correction: `photoAssets`,
`photoAssetRefs`, `pendingUploads`. The Storage-side equivalents already had this check
correctly.

---

## 24. The existing `test` journal photo — explicit, standalone statement

*(Source: v6 §10 — not revisited by any later round; still true, since nothing in this
design has been implemented.)*

- **Rendering**: unaffected by anything in this design, at every stage — reads were never
  gated, only writes. `<img src={data.storageUrl}>` continues to work exactly as it does
  today, indefinitely.
- **Writing**: this specific element is deliberately never the target of any
  attach/replace/detach action during any rollout stage — no one is editing it. It
  therefore remains in its original `photoId`/`storageUrl`/`thumbnailUrl` shape, at its
  original Storage location, throughout.
- **No stage of this design copies, moves, deletes, detaches, or converts it.** The only
  thing that would ever change it is a separately-approved, explicit copy-forward
  migration — not scheduled, proposed for execution, or triggered by anything in this
  document.

---

## 25. Rollout gates and deployment ordering

*(Source: MERGED. The gate table is v6 §11, updated to remove references to the
now-removed multi-transaction publish job. The six-step deployment sequence is
"Correction 2" from an earlier chat-only resend, not superseded by any later round except
for its function list, which is v7-Corrected's corrected list plus the three new
notebook-operation callables from §10.)*

### Rollout gates

**CORRECTED ordering (the version of this table shipped in the first consolidation put
0d — "backfill executed" — before 0f — "explicit approval" — which would have let a
live-data write happen before its own approval gate. No live-data operation may ever
precede its explicit approval; the corrected order below moves execution after approval,
and splits "approval for this stage" from "approval to proceed to the next stage" so each
is its own named checkpoint.)**

| Gate | Required before proceeding |
|---|---|
| **0a** | Read-only inventory of every existing `notebooks`/`journals` doc (exact count, exact ids, exact current field shapes) — presented for review before any backfill is written. |
| **0b** | Exact proposed backfill payload — presented for review, not executed. |
| **0c** | Rules and backfill logic tested against the Firebase Emulator Suite with both an owner identity and a distinct second identity — results reported. |
| **0d** | Documented rollback procedure for the backfill presented. |
| **0e** | Separate, explicit approval for THIS stage — required before the backfill (0f) is executed. No live-data write happens before this gate. |
| **0f** | Backfill executed — only now, after 0e's approval. |
| **0g** | Post-backfill verification report presented (every existing doc re-queried, confirming the exact expected fields landed and nothing else changed). |
| **0h** | Separate, explicit approval to proceed to the next deployment stage (A, below). |
| **A** | New collections/rules/callables deployed (after 0h) — additive, nothing reads/writes them yet. |
| **A2** (NEW, §7.4) | The four Firestore collection-group indexes required by the scheduled cleanup queries (§7.4) are deployed AND their build status is explicitly confirmed `READY` — not merely "deploy command exited zero." Required specifically before the scheduled cleanup Functions (§7.3's three responsibilities) are deployed or enabled; no other function in Step 1's list depends on these indexes. Emulator test success (§28) does not satisfy this gate — index build/readiness is a production-infrastructure fact the emulator does not model. |
| **B** | Combined element-protection-rule-and-client-cutover deploy (§1) — the release that makes upload/replace/detach go through the new callables for both legacy and new element shapes simultaneously. Requires its own emulator/second-identity test pass before deploy. |
| **C** | Real usage begins; feature flag governs UI availability only, never a write-path fallback. |
| **D** (separate approval) | Genuine second-user collaboration test — a real distinct Firebase identity exercising deployed rules end-to-end — before any collaborator relaxation from `isOwner` to `hasWriteAccess` (§4) is even considered. |
| **E** (separate approval) | Migration of the one real `test` photo — copy-forward, old data untouched throughout, exactly as specified in §24. |

### Deployment ordering (six steps, across separate Hosting/Functions/Rules artifacts)

```
Step 1 — Deploy new Cloud Functions: createJournal, beginUpload, finalizeUpload
  (resolveFinalizingSession), attachPhoto, replacePhoto, detachPhoto,
  reorderCollageSlots, deleteElement, deletePage, duplicatePage, duplicateElement,
  replacePageElements, requestPermanentDelete, publishShare, unpublishShare,
  deleteJournal, updateNotebookMetadata, updateNotebookTheme, setNotebookCoverPhoto —
  **AND, separately, the scheduled cleanup function (resolveExpiringSession +
  lease-reap + terminal sweep), gated behind A2 above**: this one function is deployed
  and enabled ONLY once §7.4's four collection-group indexes are confirmed `READY`, not
  merely alongside the rest of this list — its collection-group queries fail outright
  against a not-yet-built index, and every other function in this list is independent of
  that index state.
  (No publishJobs/job-reaper functions — removed per §15's simplification.)
  These are entirely NEW functions; nothing currently calls them.
  FAILURE: a bad deploy simply doesn't create the function. Fix and redeploy. Zero
    user-facing impact either way.

Step 2 — Deploy new client to Hosting. The OLD direct-write upload code (today's
  ImageElement/CoverElement/CollageElement/MobileEditorBar/Inspector/Sidebar photo-upload
  logic) is REMOVED and replaced unconditionally by logic that checks
  /config/photoLibrary.enabled: if true, call the new callables; if false, render
  "Photo uploads are temporarily unavailable." No third branch, no fallback to the old
  direct-write mechanism — it no longer exists in this build's code. Since
  /config/photoLibrary.enabled is still false at this point, from the instant this
  release goes live, EVERY client that has loaded it is unable to perform any photo-field
  write, old-shaped or new-shaped — this is what creates the safe quiet window, not a
  separate maintenance-mode toggle.
  FAILURE: Hosting releases are atomic — a failed build never becomes active; the
    previous release keeps serving unchanged. `firebase hosting:rollback` restores the
    previous version instantly if a later problem is found; since no rules have changed
    yet, this is entirely safe.

Step 3 — Verify: new client loads correctly and shows the "temporarily unavailable"
  message where upload used to be; the app is otherwise fully functional; each new
  Function is independently invokable via a direct test call against disposable data.

Step 4 — Deploy the protected-field Firestore rules (§20) and the Storage rules for the
  new photoAssets path. Impact at this instant: zero for anyone already on the Step 2
  client. For anyone still on a genuinely old, unrefreshed tab: their next upload attempt
  now receives a clean rules-level permission-denied error instead of succeeding — no
  corruption, since the write is rejected before it commits anything.
  FAILURE: Firebase validates rules syntax before activation — an invalid ruleset is
    rejected outright and the previous ruleset remains active. If rules deploy
    syntactically but Step 5 finds a logic problem, redeploy the prior ruleset version.
    Because /config/photoLibrary.enabled is still false, this rollback has zero
    data-safety consequence.

Step 5 — Verify: run the acceptance/concurrency test suite (including the required
  genuine-second-identity collaboration check and every race scenario in §27/§28) against
  the live rules and Functions, using disposable test data only. If ANY problem is found:
  do not proceed — the app remains in "uploads unavailable," degraded but stable, for as
  long as needed to fix and re-verify.

Step 6 — Only once Step 5 is fully green: set /config/photoLibrary.enabled = true. The
  new callable-backed photo UI becomes visible and functional. This is the only step that
  restores upload capability, and it returns exclusively through the new, rule-protected
  mechanism — there is no old path left to fall back to if this is later turned back off.
  FAILURE: a single boolean document write; if it fails, simply retry it.

Rollback availability summary: every step through Step 6 can be reverted with zero data
risk, because no real new-format (or newly-migrated legacy-format) photo data exists
until Step 6 actually takes effect. Once real usage begins after Step 6, client-code
rollback remains always safe — existing assets keep rendering under any client version,
since reads were never gated. Rolling back the RULES after real post-Step-6 usage exists
is the one action that stops being safe — from that point on, problems are fixed forward,
not rolled back at the rules layer.
```

---

## 26. Threat/race table

*(Source: v6, updated to remove the now-obsolete multi-transaction publish-job entries
(§15's simplification) and to reflect §9's authoritative in-transaction bounding.)*

| Mutation | Locks/checks | Cannot overlap with | Resolved by |
|---|---|---|---|
| `attachPhoto`/`replacePhoto`/`detachPhoto` | `isOwner` (§4); asset `active` (attach/replace); journal `active`; protected-key rule | asset not `active`; journal `deleting` | precondition + rule |
| `resolveFinalizingSession` claim | session `pending` (fresh `expiresAt` check) or lease-expired `finalizing`; ownership re-verified before every write (§7.2) | `resolveExpiringSession` claiming the same `pending` session | transaction serialization |
| `resolveExpiringSession` claim | session `pending`+expired, or lease-expired `expiring`; ownership re-verified before every write | `resolveFinalizingSession` claiming the same `pending` session | transaction serialization |
| `requestPermanentDelete` lock | `status=='trashed'`; owner-only | second concurrent lock attempt | transaction serialization |
| `requestPermanentDelete` verify (pre-attempt) | refs empty; `storageAttempted==false` | any op creating a new ref (blocked — not `active`) | asset status gate |
| `requestPermanentDelete` verify (post-attempt, retry) | refs empty; if non-empty, LOCKS, never unlocks | same, but outcome differs per §13's fix | `storageAttempted` flag distinguishes checkpoints |
| `publishShare`/republish | every referenced asset (incl. `coverAssetId`, §12) `active`, fresh, in-tx; snapshot size re-checked in-tx (§15) | asset transitioning to `deleting` mid-transaction | transaction serialization |
| `unpublishShare` | owner-only; snapshot+refs removed together | none directly — always safe | atomicity |
| `deleteJournal` lock | `journalStatus=='active'`; owner-only; atomic with dashboard cache | second concurrent lock attempt | transaction serialization |
| `deleteJournal` sweep | re-queries live state each pass | every content/membership/share write (reject once `deleting`) | journal lock |
| `deleteElement`/`deletePage`/`duplicatePage`/`duplicateElement`/`replacePageElements` | authoritative in-transaction recheck of write count, byte size, and asset status (§9); `isOwner` gate whenever `refWrites/K/R > 0` | a concurrent edit changing the source between pre-flight and transaction | Firestore transaction retry against fresh state |
| `setNotebookCoverPhoto` | `isOwner`; asset `active` fresh, in-tx; old+new ref swap atomic (§11) | asset transitioning to `deleting` mid-transaction | transaction serialization |
| mirror-only direct write attempt | rejected by the mirror's identical protected-key and identity rules | — | rules |
| **`resolveExpiringSession` crashes mid-flight, between its `pending→expiring` claim and its terminal `expired` write (NEW, §7.3 A)** | responsibility A's SECOND query (`status=='expiring' && leaseExpiresAt<=now`) rediscovers the exact session once its lease expires; the claim step's own transaction gates re-acquisition on the stale lease, and step 2's Storage deletes are idempotent (not-found = success) | a second, concurrent sweep also rediscovering the same lease-expired session | transaction serialization on the claim (only one invocation's STEAL succeeds); idempotent Storage deletes make even a rare double-claim harmless |
| any of `resolveFinalizingSession`/`resolveExpiringSession`/terminal cleanup vs. a Storage path that fails shape validation (NEW, §7.2/§7.3) | `storagePathsMatchExpected` checked before ANY Admin SDK Storage read or delete | — (this is a fail-closed data-integrity gate, not a concurrency race) | the check itself: no Storage operation is ever attempted against an unvalidated path |

---

## 27. Test matrix — forced orderings

*(Source: v6, updated: multi-tx-publish-specific rows removed per §15; a `notebookCover`
row and a bounding-recheck row added per §12/§9.)*

| Pair | Ordering 1 | Ordering 2 | Both safe |
|---|---|---|---|
| attach vs. delete-lock | attach commits first → delete's later verification sees the ref, blocks (pre-attempt path, unlocks to `trashed`) | lock commits first → attach's active-check fails | ✓ |
| replace vs. delete-lock | same shape on the new target asset | same | ✓ |
| collage slot attach vs. delete | per-slotKey, same shape | same | ✓ |
| `resolveFinalizingSession` vs. `resolveExpiringSession` claim | finalize wins `pending` → asset created after real metadata verification | cleanup wins `pending` → files deleted, session `expired`; finalize sees non-pending, fails cleanly | ✓ |
| stale finalize invocation after lease is stolen | invocation re-reads live session state and returns a grounded result (§21) | — | ✓ — closes the ambiguous bare-success gap |
| publish (ref-create) vs. delete-lock | publish commits first → ref created → delete's verification (post-attempt-aware) blocks/locks correctly | lock commits first → publish's active-check fails, no ref created | ✓ |
| republish vs. delete-lock (unchanged asset) | republish commits first → ref untouched → delete sees it, blocks | lock commits first → republish's active-check on that asset fails, whole republish aborts | ✓ |
| unpublish vs. delete-lock | unpublish commits first → ref gone | lock commits first → unpublish still succeeds | ✓ |
| delete's checkpoint-1 vs. checkpoint-2 | first-ever verification, refs found, `storageAttempted==false` → safe unlock to `trashed` | retry after a Storage attempt, refs found, `storageAttempted==true` → LOCKS, never unlocks | ✓ |
| one-file-only finalize | full present, thumb missing → `status='failed'`; cleanup later sweeps the orphaned full file | thumb present, full missing → symmetric | ✓ |
| deleteJournal-lock vs. attach/publish on that journal | lock first → all rejected | content-op first (journal still briefly active) → succeeds, then lock commits, sweep captures the larger content set | ✓ |
| mirror-only direct write attempt | rejected by the mirror's identical protected-key rule | — | ✓ |
| **`deletePage`/`deleteElement` pre-flight vs. transaction (new)** | pre-flight estimates under the limit, but a concurrent edit adds content before the transaction starts → transaction's own authoritative recheck (§9) catches it and aborts | pre-flight estimates over the limit → friendly early rejection, no transaction even opened | ✓ — proves §9's authoritative-recheck fix is real, not cosmetic |
| **notebookCover as a blocking reference (new, §12)** | an asset set as a notebook's cover, with no other reference → `requestPermanentDelete` finds one ref, `refType=='notebookCover'`, blocks with a diagnostic naming it as the cover, not an undifferentiated count | asset has both a `notebookCover` ref and a `publicShare` ref simultaneously → still just "blocked," diagnostic lists both | ✓ |
| **`resolveExpiringSession` crash/recovery — the exact required sequence (NEW, §7.3 A)**: (1) `resolveExpiringSession` claims a `pending` session, writing `status='expiring'`; (2) simulate a worker failure BEFORE step 2's Storage deletion runs (kill the invocation between the claim commit and the delete calls); (3) advance server/emulator time past `leaseExpiresAt`; (4) run responsibility A's sweep again | the session no longer matches the `pending` query (status is now `expiring`), but DOES match the second, lease-expiry query → the sweep reacquires the EXACT same `sessionRef` via `docSnapshot.ref`, STEALs the lease, and resumes | (5) step 2 deletes both Storage objects — confirm this succeeds even though nothing was deleted on the first, crashed attempt; (6) step 3 records `status='expired'`; (7) after the 24h retention window (or a simulated fast-forward of it in tests), responsibility C's terminal sweep finds the now-`expired` session and removes the `pendingUploads` document itself | ✓ — this is the specific scenario that proves responsibility A's second query is real recovery, not just a claim it "should" work |
| **Storage-path shape validation — cross-owner and malformed paths (NEW, §7.2/§7.3)**: a `pendingUploads` document (constructed directly in test fixtures, bypassing `beginUpload`, to simulate a corrupted or tampered record) whose `storage.fullPath`/`storage.thumbPath` point at a DIFFERENT owner's tree, or are malformed/arbitrary strings | `storagePathsMatchExpected` returns false in `resolveFinalizingSession` (§7.2), `resolveExpiringSession` (§7.3 A), and terminal cleanup (§7.3 C) alike | the function throws/skips "session storage paths inconsistent," performs NO `getMetadata()`/delete call against either the claimed path OR the actual expected path, and the record is left for manual review rather than silently corrected or silently ignored | ✓ — proves the fail-closed behavior holds at all three call sites, not just documented in prose |

---

## 28. Required pre-deployment validation report

*(Source: missing-sections file §14 — final, unmodified. This document is not itself
sufficient for implementation approval.)*

The next artifact — produced separately, only when requested — must be a read-only,
test-only validation report demonstrating, not asserting:

1. **Firestore Rules compile successfully** — the rule text in §20 actually parses and
   deploys against the Firebase Emulator Suite without syntax errors.
2. **Storage Rules compile successfully** — same, for the Storage rule text in §20.
3. **Emulator tests pass for five distinct identities** on every relevant rule: the
   owner, an `editor` member, a `viewer` member, an authenticated-but-unrelated user, and
   an unauthenticated request — each tested against both an expected-allow and an
   expected-deny case per operation.
4. **Existing notebook list/dashboard queries are tested exactly as the application
   issues them** — not just single-document `get()` checks. A collection query can be
   rejected outright if its rule cannot be satisfied for the query shape, independent of
   whether individual matching documents would otherwise be readable. The real
   `fsLoadNotebooks`-style query (a full collection query with `orderBy('updatedAt',
   'desc')`, scoped by the caller's own uid) must be run against the emulator and
   confirmed to succeed.
5. **Every row of §9's feature-migration table** and **§10's notebook-operations table**
   has a tested permitted result for a legitimate caller and a tested denied result for
   an illegitimate one.
6. **No production Firebase data is used for any of these tests** — emulator-only or a
   genuinely separate disposable test project.
7. **No source implementation, commit, push, deployment, or journal/photo modification
   occurs as part of producing this report** — and none occurs afterward either, without
   a further, separate, explicit approval beyond the report itself.

---

## Reconciliation Appendix

### Sources used, and what each contributed

| Source | What it is | What was taken from it |
|---|---|---|
| **v6 ("self-contained")** | An early full design rewrite, delivered only as a chat response in the prior session (never saved to a file) | §1 (code audit), §13 (permanent-deletion state machine, unrevisited since), §24 (test-journal statement), §25's gate table, §26/§27 (threat table / test matrix, as the structural base) |
| **v7-Corrected** ("supersedes the v6 missing-sections document") | A later, more complete full rewrite, also delivered only as a chat response (never saved to a file); explicitly superseded v6 and an early, shorter draft of the missing-sections file | §2 (schemas, before the v8-era field/role additions), §7 (upload lifecycle, entirely — never revisited by any later round), §8 (protected-field rule, before a syntax-only fix), §9 (deletion/duplication ref-cleanup mechanics, before §-10-equivalent bounding was added), §14 (journal-deletion sequence, before the retry-table and cover-ref step were added), §15 (publish/unpublish design, before the cap fix), §17 (the refDocId hash fix — found only in this source's underlying transcript text, and never copied into the file on disk), §19/§20 (Storage rule structure), §25 (function list, before three notebook-operation callables were added) |
| **`docs/photo-library-architecture-v6-missing-sections.md`** (preserved unchanged) | The file on disk; the latest, most-corrected round, but a *delta* against v7-Corrected, not a self-contained document on its own | §3 (access helpers), §4 (the ownership gate), §5 (document identity), §6 (membership), §10/§11/§12 (notebook operations, cover tracking, propagation), §15's cap fix, §16, §18 (presence), §21 (stale-invocation grounding), §22 (PIN honesty), §23 (null-safe checks), §28 (validation report spec) |

### Corrections applied, later-over-earlier (non-exhaustive list of the substantive ones)

- `hasEditorAccess` (v7-Corrected, conflated read/write, silently denied `viewer` reads)
  → replaced everywhere by `hasReadAccess`/`hasWriteAccess`/`isOwner` (missing-sections
  file §2/§3 above).
- `refDocId(...).slice(0, 64)` (v6 and v7-Corrected both had this truncating,
  collision-prone formula) → replaced by the full-output, hash-of-hashes formula (§17).
- `MAX_PUBLISH_ASSETS = 300`/`MAX_SINGLE_TX_PUBLISH_ASSETS = 400` (v7-Corrected) →
  `MAX_PUBLISH_ASSETS = 200` with explicit worst-case arithmetic (§15).
- A stale upload-finalization invocation "aborts silently, returns without error"
  (v7-Corrected §2.2) → grounded-in-live-state return values, never a bare success (§21).
- "Every photo operation is owner-only, editors get zero capability" (v6 §8, and
  implicitly v7-Corrected's undifferentiated treatment) → the conditional-escalation gate
  of §4: editors get real `hasWriteAccess` capability for non-photo operations; only
  photo-governing operations (and photo-touching delete/duplicate) stay owner-gated.
- Non-authoritative "dynamic batch sizing... small enough in practice" bounding for
  deletion/duplication (v7-Corrected §4/§5) → the fully authoritative in-transaction
  recheck with named limits and a real escape hatch (§9).
- `if (...) { return ...; }` statements in rule-helper functions (present in v7-Corrected's
  §3 protected-field logic) → mechanically rewritten to short-circuit/ternary form (§8),
  consistent with the missing-sections file's own globally-stated syntax rule, which had
  already been applied to every *other* helper function but not this one.

### Gaps this consolidation closes that existed nowhere as a single readable document before

1. **The `refDocId` hash-of-hashes formula** (§17) was applied to an intermediate draft of
   the missing-sections file in the prior session, confirmed via that session's tool-call
   history, but the final file on disk today only references it by name ("the identical
   hash-of-hashes id scheme already defined") without ever defining it. This consolidation
   is the only place the actual formula now exists in a saved file.
2. **The type-aware protected-field functions** (`isPhotoBearingType`,
   `protectedPhotoKeysTouched`, `safeCreateDataCheck`, `photoFieldsEmpty`) exist in full
   only in v7-Corrected's chat-only text (§8 above) and were never saved to any file
   in either their original or syntax-corrected form. The syntax correction applied in §8
   (removing `if` statements) is this document's own mechanical inference, not copied
   verbatim from any source — flagged explicitly rather than silently applied.
3. **v7-Corrected itself** — the fullest self-contained rewrite found — existed only as
   chat output and was never saved as a file in the prior session, despite explicitly
   superseding an earlier, shorter draft that *was* saved. This consolidation is the
   first time its content has been persisted to disk.

### Consolidation defects found in review, and their resolutions

The first pass of this consolidation introduced several of its own merge defects — not
disagreements between sources, but errors made in the act of merging them. Four review
passes together found fourteen; thirteen required a content fix, the fourteenth is this
appendix entry itself. Each is recorded here with its resolution so no substantive
algorithm or rule is left with two disagreeing versions anywhere in this document:

1. **Rollout-gate ordering executed a live-data write before its own approval gate.**
   The original §25 table sequenced 0d (execute the backfill) before 0f (obtain
   approval) — a direct violation of "no live-data operation may precede its explicit
   approval," an invariant this whole project has held since its first design round.
   **Resolution**: §25's gate table now reads inventory (0a) → proposed payload (0b) →
   emulator tests (0c) → documented rollback (0d) → **explicit approval (0e)** → backfill
   executed (0f) → post-backfill verification (0g) → separate approval to proceed to the
   next stage (0h). Execution now strictly follows its approval gate, and "approval for
   this stage" is a distinct checkpoint from "approval to advance to the next stage."

2. **`finalizeUpload` had no caller-authorization check of its own.** §7.2's
   `resolveFinalizingSession` claimed and read session state before verifying anything
   about its OWN caller — `beginUpload` verified the owner, but nothing verified that the
   party invoking `finalizeUpload` was authorized at all. Any authenticated user who
   learned or guessed an `uploadId` could have invoked it. **Resolution**: §7.2 gained an
   explicit step 0, evaluated before any claim or state read, requiring: an authenticated
   caller; the caller matches the session's own `requestedByUid`; the caller matches the
   owning journal's `ownerUid` (owner-only in the initial release, per §4's gate); the
   session's recorded owner matches its own path segment; and the session's `notebookId`
   resolves to a real journal. The scheduled reaper (§7.3 responsibility B) is a distinct,
   trusted, autonomous invocation and explicitly skips this client-identity check, since
   it never impersonates a client.

3. **§5 claimed mirror documents get the same identity protections as canonical; §20's
   rule block did not actually enforce them.** The mirror's `create` rules never checked
   `idMatchesPathId`; its `update` rules only checked the *proposed* document's
   `notebookId` against the path, never the *existing* document's; and the element
   `update` rule never checked `pageIdUnchanged()`. The prose overstated what the rules
   actually did. **Resolution**: §5's prose now itemizes the mirror's exact enforced set,
   and §20's mirror `match` blocks were rewritten to add `idMatchesPathId` on create, a
   both-sides `notebookId == journalId` check on update, and `pageIdUnchanged()` on the
   element update rule — the mirror's protections now match canonical's in substance,
   and the prose no longer claims anything the rule block doesn't do.

4. **§16 claimed the publish transaction enforces `toAdd + toRemove + 1 <= MAX_TX_WRITES`;
   §15's actual algorithm never computed or checked that value.** §15's transaction, as
   first merged, re-verified per-asset `active` status and the snapshot-size bound, but
   never actually computed `toAdd.length + toRemove.length + 1` or compared it to any
   limit — it relied entirely on §16's *inductive* argument, which proves the bound
   *should* hold given every publish obeys the cap, but is not itself a runtime check.
   **Resolution**: §15's transaction now explicitly separates its reads (fresh
   `journalStatus`, ownership, canonical content, `oldAssetIds`, and every candidate
   asset) from its checks (fresh `newAssetIds.length <= MAX_PUBLISH_ASSETS`, fresh
   snapshot-size bound, **fresh `toAdd.length + toRemove.length + 1 <= MAX_TX_WRITES`**,
   and per-asset `active` status) from its writes — all reads before any check, all
   checks before any write, matching the transactional discipline used everywhere else in
   this document (§9).

5. **Journal-deletion's dynamic batching had no answer for a single oversized collage.**
   §14's sweep loop said to "start a new batch" with an element that wouldn't fit in the
   current one — but a single collage whose own ref-deletes exceed 480 doesn't fit in
   ANY batch, and the client-facing escape hatch used elsewhere (`detachPhoto` first,
   then `deleteElement`) is unavailable during a locked `deleting` sweep, since both
   require `journalIsActive`. Left as written, the sweep could loop indefinitely trying
   to place an element that never fits. **Resolution**: §14 now specifies a dedicated,
   bounded, idempotent sub-loop for exactly this case — while still inside the lock,
   delete that one element's refs in chunks of ≤480 until a fresh query confirms zero
   remain, only then delete the element itself, then resume the outer sweep. Chosen over
   a global collage-slot cap (which would need its own legacy-data inventory gate and
   constrains authoring generally for a case only deletion needs to solve) specifically
   because the lock already guarantees the oversized element's ref count is monotonically
   decreasing and nothing else can add to it — the sub-loop is guaranteed to terminate,
   and a journal can never become permanently undeletable once its lock is set.

6. **§20's "complete rules" were fragments, not deployable files.** The rule text had no
   `rules_version`, no `service` declaration for either Firestore or Storage, and several
   Firestore helper functions that dereference `$(database)` were written outside any
   `match /databases/{database}/documents` scope — where `database` is not bound and
   those functions could not resolve. **Resolution**: §20 now presents two separate,
   complete files — `firestore.rules` (`rules_version`, `service cloud.firestore`,
   `match /databases/{database}/documents`, with every database-dependent helper moved
   inside that match block) and `storage.rules` (`rules_version`, `service
   firebase.storage`, helper functions at the service level, `match /b/{bucket}/o`). This
   does not claim either compiles — the emulator run (§28) remains the actual proof gate
   — but the source is now complete rather than requiring reconstruction.

7. **`finalizeUpload`/`resolveFinalizingSession` addressed sessions by a bare `uploadId`,
   not the actual per-owner document path.** Upload sessions live at
   `users/{ownerUid}/pendingUploads/{uploadId}` (§7.2's own schema, §2) — a per-owner
   subcollection — but the algorithm text for `finalizeUpload` and
   `resolveFinalizingSession`, and the scheduled reaper's call into it (§7.3 responsibility
   B), referred only to `pendingUploads/{uploadId}` and passed a bare `uploadId`
   throughout, with no owner segment. Taken literally this would require an unscoped
   lookup to resolve a session at all, and would leave the identical `uploadId` string
   ambiguous across different owners. Compounding this, authorization (added in fix #2
   above) and the lease claim were still two separate steps/transactions, leaving a gap
   between them, and the idempotent "already finalized" response could be returned before
   authorization ran. **Resolution**: `finalizeUpload` now constructs the exact reference
   `sessionRef = /users/{request.auth.uid}/pendingUploads/{uploadId}` itself, from the
   caller's own identity, before ever calling `resolveFinalizingSession` — never a global
   or cross-owner search. `resolveFinalizingSession` now takes `(sessionRef,
   {isClientTriggered})` instead of a bare `uploadId`, and folds authorization and the
   lease claim into ONE transaction: path-owner integrity and journal/session-relationship
   checks always run; the client-identity checks (`request.auth`, `requestedByUid`,
   journal-owner match) run only when `isClientTriggered` is true, and are the *only*
   checks omitted for the scheduled reaper's trusted, autonomous invocation. The reaper
   itself now passes the literal `DocumentReference` returned by its own
   `collectionGroup('pendingUploads')` query — never a reconstructed path — directly into
   `resolveFinalizingSession`. Every subsequent read and write in the flow (metadata
   lookup, the resolve transaction, the created asset's path) now addresses the session via
   that same `sessionRef`. *(This round flagged, but deliberately deferred, the identical
   bare-`uploadId` pattern in `resolveExpiringSession` — closed by item 10 below.)*

9. **`finalizeUpload` dereferenced `request.auth.uid` before confirming `request.auth`
   exists.** The version of this callable produced by the previous round's fix (item 7)
   constructed `sessionRef = /users/{request.auth.uid}/pendingUploads/{uploadId}` as its
   first action — but nothing before that line had established that `request.auth` was
   non-null. An unauthenticated call would then fail while dereferencing a missing
   identity (a null-reference fault deep in path construction), not with the intended,
   clean "unauthenticated" error the rest of this design relies on for predictable denial
   (§23's stated philosophy, applied inconsistently here until now). **Resolution**: §7.2's
   `finalizeUpload` now performs `if request.auth == null: throw "unauthenticated"` as its
   literal first step, before `request.auth.uid` is read anywhere and before `sessionRef`
   is constructed at all. Only once that check passes does path construction happen. The
   same section also now states explicitly that `{isClientTriggered}` is internal routing
   state hardcoded by whichever trusted server wrapper is invoking
   `resolveFinalizingSession` (the callable wrapper for a real client call, the
   scheduled-worker wrapper for the reaper) — never a value read from client request data,
   and never something a client could set to claim trusted status.

10. **`resolveExpiringSession` still had the bare-`uploadId` defect item 7 flagged but
    deferred.** It operates on the identical nested per-owner schema as
    `resolveFinalizingSession` and was left with the same defect after the previous
    round: a bare `uploadId` with no owner segment, and §7.3 responsibilities A and C both
    read/deleted Storage paths and documents via unqualified `pendingUploads` queries with
    no stated mechanism for resolving the owner-scoped path at all. **Resolution**:
    `resolveExpiringSession` now takes `(sessionRef)` — its only trigger is the scheduled
    sweep, so unlike `resolveFinalizingSession` it needs no `isClientTriggered` flag at
    all. Responsibility A now runs a `collectionGroup('pendingUploads')` query and passes
    each result's literal `docSnapshot.ref` straight into `resolveExpiringSession` — every
    claim, the Storage-path deletes, the stale-lease recheck, and the terminal
    `status='expired'` write all address that same `sessionRef`, never a bare `uploadId`.
    `resolveExpiringSession`'s claim transaction now also explicitly verifies path-owner
    integrity (the document's recorded `ownerUid` equals its own path's `{ownerUid}`
    segment) before step 2 ever touches a Storage path derived from it — the scheduled
    sweep has no client identity to check, so this integrity check is what stands in its
    place. Responsibility C — which never opens its own transaction — now runs the same
    collection-group query shape for both the `failed` and `expired` terminal sweeps,
    verifies the identical path-owner integrity check per result before acting (skipping,
    rather than acting on, any inconsistent record), and deletes both the Storage objects
    and the session document itself via that result's own `docSnapshot.ref` — never a path
    rebuilt from `uploadId` alone. No bare `resolveExpiringSession(uploadId)` call or
    signature remains anywhere in this document.

11. **Responsibility A could not recover a crashed `expiring` claim — a real, distinct gap
    from item 10's bare-`uploadId` fix, not the same defect twice.** `resolveExpiringSession`'s
    own first write moves a claimed session from `pending` to `expiring`. The version of
    responsibility A produced by item 10's fix ran only ONE query
    (`status=='pending' && expiresAt<=now`), and asserted a lease-expired `expiring`
    session would be "rediscovered by that same query shape on a later sweep" — a false
    claim: once a document's status leaves `pending`, it can never again match a
    `status=='pending'` query, so a worker that crashed after the claim but before step 2's
    Storage deletes would leave that session permanently unrecoverable by this
    responsibility. **Resolution**: responsibility A now runs a SECOND, permanent query
    every sweep — `status=='expiring' && leaseExpiresAt<=now` — specifically to recover
    exactly this case, alongside the original `pending` query. Both queries pass their
    results' literal `docSnapshot.ref` into `resolveExpiringSession(sessionRef)`, identically
    to item 10's fix. Idempotency across both queries, and across any overlap with a second
    concurrent scheduler run, is now stated explicitly: a single document can never match
    both queries in one sweep (status is single-valued), and `resolveExpiringSession`'s own
    claim transaction is gated on the document's *current* status/lease, so a redundant
    invocation for an already-resolved or already-claimed-by-someone-else session simply
    no-ops rather than double-acting. A dedicated race-table row (§26) and a full
    seven-step required emulator test (§27: claim → simulated crash before Storage
    deletion → advance past lease expiry → reacquire via the exact `sessionRef` → idempotent
    Storage deletes → `expired` write → eventual terminal cleanup) now name this scenario
    specifically, so it is asserted as tested, not merely asserted as handled.

12. **Path-owner integrity proved the session's OWNER matched its path, but never that the
    session's OWN `storage.fullPath`/`storage.thumbPath` fields actually pointed into that
    owner's Storage tree.** These are separate, independently-stored string fields with no
    structural link to `ownerUid` enforced anywhere upstream of their use — every version
    of `resolveFinalizingSession`, `resolveExpiringSession`, and terminal cleanup through
    item 10's fix read and acted on these fields (via Admin SDK `getMetadata()`/delete
    calls) on the strength of path-owner integrity alone, which does not actually prove
    the claim. A corrupted, mis-migrated, or (in a future code change) mis-constructed
    record could in principle carry a `storage.fullPath` pointing at a different owner's
    objects, and nothing before this fix would have caught it before an Admin SDK call
    acted on it. **Resolution**: a new, single, shared check —
    `storagePathsMatchExpected(session, sessionRef)`, defined once in §7.2 and reused
    verbatim at all three call sites (`resolveFinalizingSession` §7.2, `resolveExpiringSession`
    §7.3 A, terminal cleanup §7.3 C) — reconstructs the deterministic expected path shape
    (`users/{ownerUidSegment}/photoAssets/{uploadIdSegment}/original`|`/thumb`, derived from
    `sessionRef`'s own path segments, never re-read from the document body) and requires the
    session's stored paths to equal it exactly, before ANY Admin SDK Storage read or delete
    is attempted at any of the three sites. A failure fails closed: no Storage operation of
    any kind, the record is flagged for manual review, and (for `resolveFinalizingSession`
    and `resolveExpiringSession`) the surrounding claim is never made at all. New
    emulator/pure-logic test cases (§27) cover both a cross-owner path and a malformed path,
    at all three call sites.

13. **The scheduled cleanup queries' required Firestore indexes were never documented.**
    Every query in §7.3 (now four, after item 11's fix) combines an equality filter on
    `status` with a range filter on a timestamp field, run as a `collectionGroup` query —
    Firestore requires an explicit composite index for this shape, scoped
    `COLLECTION_GROUP` specifically, and no earlier round of this document named it.
    **Resolution**: new §7.4 gives the exact `firestore.indexes.json` contents for all four
    required indexes (`status`+`expiresAt`, `status`+`leaseExpiresAt` — serving both
    responsibility A's crash-recovery query and responsibility B's reaper query,
    `status`+`failedAt`, `status`+`expiredAt`), states explicitly that emulator test success
    does not prove production index readiness (the emulator does not model index build
    time), and adds a new, named deployment gate — **A2** in §25's rollout-gate table —
    requiring these indexes to be deployed AND confirmed `READY` specifically before the
    scheduled cleanup Function is deployed or enabled, distinct from and prior to the rest
    of Step 1's function list, which has no such dependency.

14. **This appendix entry** — replacing the prior "no unresolved contradictions" framing
   for the *source*-reconciliation question with this explicit, separate record of the
   *merge*-defect findings above, so the two kinds of issue (disagreement between
   sources, vs. an error introduced while merging them) aren't conflated under one
   heading. Every substantive algorithm and rule named in this document — the upload
   lifecycle (including both session-resolver functions, every one of their triggers, the
   Storage-path shape check, and the required indexes), the deletion/duplication bounding,
   the journal-deletion sequence, the publish transaction, and the complete rules text —
   now has exactly one current version in this document; none of the thirteen fixes above
   left a second, superseded copy of the corrected
   logic anywhere else in the file.

### Unresolved contradictions requiring your judgment (source-reconciliation only)

- **None found that need a decision.** Every apparent conflict between the three
  *sources* (v6, v7-Corrected, the missing-sections file) traced to a genuine later
  correction (documented above) rather than an irreconcilable disagreement. The one point
  that looked contradictory at first read — the missing-sections file's §5 saying "the
  prior rules denied all direct notebook-metadata writes," which seemed inconsistent with
  an earlier round's generic `allow update: if hasEditorAccess(...)` notebook rule —
  resolved cleanly once v7-Corrected was located: by that point the notebook rule already
  read `allow update: if false`, so §5's premise was accurate relative to its actual
  predecessor, just not relative to the even-earlier v6 draft this consolidation also had
  to account for. (This is distinct from the six review-found *merge* defects recorded
  above, which were errors introduced while consolidating, not conflicts between sources.)

### Explicitly not done by this document

- No emulator files, rules files, Functions, fixtures, or tests were created.
- No package was installed beyond what was already approved and installed earlier in
  this session (`firebase-tools`, `@firebase/rules-unit-testing`, `firebase-admin`, as
  devDependencies — unrelated to this consolidation step, not touched further here).
- No commit, push, deploy, or production Firebase access occurred.
- No journal, notebook, page, element, or photograph — including the `test` journal and
  its photo — was read, modified, or migrated.
- `docs/photo-library-architecture-v6-missing-sections.md` was read but not modified.
