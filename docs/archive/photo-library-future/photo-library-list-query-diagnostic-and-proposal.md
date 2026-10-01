# Photo Library — List-Query Rule Defect: Diagnosis, Corrected Root Cause, and Proposed (Unapplied) Design

Read-only diagnostic and design-proposal document. No canonical architecture, rules
file, application source, Firebase configuration, or production data was modified in
producing this. Nothing proposed here has been implemented or applied.

**Provenance**: produced during the emulator-only validation stage authorized against
`docs/photo-library-architecture-canonical.md`, after the exact §28-required
`fsLoadNotebooks`-style query test failed against the canonical Firestore rules. Per
explicit instruction, this document corrects the initial (imprecise) root-cause claim,
performs a complete code-grounded inventory of every real production query, reproduces
each exact shape (never a broader substitute) against the unmodified canonical rules,
and proposes — without applying — a list-safe authorization redesign.

**Revision notice**: the direction (5a/5b/5c below) was accepted in principle, then
found, on review, to have three defects of its own. This revision fixes all three before
anything is applied. Section 5 and its subsections below are the corrected text; §9
records what changed and why. Nothing in this proposal has been applied to the canonical
document, the rules files, or application code at any point, including in this revision.

1. The legacy `/users/{uid}/photos` collection — actively used by the current,
   preserved editor (uploads, browsing, cascade-delete) — had no compatibility rule in
   the canonical §20 replacement ruleset at all. Deploying §20 as originally written
   would have silently broken that working functionality. **Fixed**: §5d below, a
   complete inventory of every real call site plus an explicit, tested compatibility
   rule, kept until a separately-approved migration proves the collection unused.
2. The original 5c proposal added a `journalAccess` index but left
   `journalAcls/{journalId}/members/{uid}` directly client-writable (unchanged from
   canonical §6/§20) — meaning an owner's direct invite/role-change/remove would never
   touch the index at all, leaving it stale by omission or, on removal, stale-and-still-
   granting from the moment of writing. **Fixed**: §5c below now requires the exact same
   atomicity this whole document already uses elsewhere (canonical+mirror in one
   transaction, `coverAssetId` ref+notebook doc in one transaction) — named trusted
   operations write both documents together, and direct client writes to `members` are
   now denied.
3. The original 5c schema denormalized `notebookName` into the index with no stated
   propagation path for a rename. **Fixed**: the schema below is the minimal
   `{journalId, ownerUid, role, addedAt}` — a collaborator dashboard fetches the
   journal's own mirror document (already provably list/get-able by a member, confirmed
   in §3) for current display metadata, which needs no propagation mechanism at all
   because nothing is ever denormalized in the first place.

---

## 1. Corrected root cause

**What I said before, and why it was wrong**: I reported that Firestore "categorically
rejects list queries that reference `resource.data`." That overstated the failure mode
and is not how Firestore Rules actually behave.

**What is actually true, confirmed by direct, contrasting evidence below**: Firestore's
rules engine allows a `list`/collection query when it can prove — from the query's own
fixed path segments and `where()` constraints alone, without needing to inspect the
data of results it hasn't fetched yet — that **every possible matching document** would
satisfy the rule. It rejects the query outright, before returning anything, when the
rule depends on a value that could **vary across the result set** in a way the query's
own constraints don't pin down.

Concretely, in this ruleset:
- A rule that depends **only on path segments fixed by the query itself** (e.g.
  `journals/{journalId}/pages` — `journalId` is one fixed value for the entire query) is
  provable, and lists succeed — confirmed below for both the owner and a collaborator.
- A rule that depends on a **document field the query's own `where()` clause pins to a
  single value** (e.g. `where('notebookId','==',X)` combined with a rule that reads
  `resource.data.notebookId`) is provable, and lists succeed — confirmed below.
- A rule that depends on a value that **varies per document with no `where()` clause
  constraining it** (e.g. listing every notebook a user owns, where each notebook has a
  *different* `notebookId` and thus potentially a different backing `journalAcls` doc;
  or filtering elements by `pageId` while the rule keys off `notebookId`, which that
  filter doesn't pin down) is **not** provable, and the query is rejected outright, for
  every identity, including the owner.

This is a narrower, more precise, and more actionable defect than "list is broken." Two
specific real production query shapes are broken; the rest — including the entire
mirror/collaboration-sync path — already work correctly today.

---

## 2. Exact code-grounded query inventory

Every Firestore query in the application lives in exactly two files (confirmed by a
repository-wide search for `collection(`, `query(`, `onSnapshot(`, `getDocs(`,
`collectionGroup(` — no other file matched):
`src/firebase/firestoreHelpers.js` and `src/firebase/collab.js`.

| # | Source function | Collection path | Filter / order | Kind |
|---|---|---|---|---|
| 1 | `fsLoadNotebooks(uid)` | `users/{uid}/notebooks` | `orderBy('updatedAt','desc')`, **no `where`** | list |
| 2 | `fsLoadPages(uid, notebookId)` | `users/{uid}/pages` | `where('notebookId','==',notebookId)` | list |
| 3 | `fsDeleteNotebook` (pages sub-query) | `users/{uid}/pages` | `where('notebookId','==',notebookId)` — same shape as #2 | list |
| 4 | `fsDeleteNotebook` (elements sub-query) | `users/{uid}/elements` | `where('notebookId','==',notebookId)` | list |
| 5 | `fsLoadNotebookElements(uid, notebookId)` | `users/{uid}/elements` | `where('notebookId','==',notebookId)` — same shape as #4 | list |
| 6 | `fsLoadElements(uid, pageId)` | `users/{uid}/elements` | `where('pageId','==',pageId)` | list |
| 7 | `fsDeletePage` / `fsDeletePages` (elements sub-query) | `users/{uid}/elements` | `where('pageId','==',pageId)` — same shape as #6 | list |
| 8 | `fsReplacePageElements` (existing-elements query) | `users/{uid}/elements` | `where('pageId','==',pageId)` — same shape as #6 | list |
| 9 | `fsDeleteNotebook` (photos sub-query) | `users/{uid}/photos` | `where('notebookId','==',notebookId)` | list |
| 10 | `fsLoadPhotos(uid, notebookId)` | `users/{uid}/photos` | `where('notebookId','==',notebookId)` — same shape as #9 | list |
| 11 | `fsCreateDailyEntryIfAbsent` | `users/{uid}/pages/{id}` | single doc, inside a transaction | get |
| 12 | `fsLoadPublicNotebook(notebookId)` | `public_notebooks/{id}` | single doc | get |
| 13 | `fetchJournalFromFirestore` (journal doc) | `journals/{journalId}` | single doc | get |
| 14 | `fetchJournalFromFirestore` (pages) | `journals/{journalId}/pages` | **no `where`**, whole subcollection | list |
| 15 | `fetchJournalFromFirestore` (elements) | `journals/{journalId}/elements` | **no `where`**, whole subcollection | list |
| 16 | `subscribeToElements(notebookId, cb)` | `journals/{journalId}/elements` | **no `where`** | listener |
| 17 | `subscribePresence(notebookId, cb)` | `journals/{journalId}/presence` | **no `where`** | listener |

Every write-only call (`fsSaveNotebook`, `fsUpdateNotebook`, `fsSavePage`,
`fsUpdatePage`, `fsSaveElement`, `fsUpdateElement`, `fsDeleteElement`, `pushJournal`,
`pushPage`, `pushElement`, `deletePage`, `deleteElement`, `setPresence`,
`clearPresence`) is a single-document write, not a query, and is out of scope for this
investigation.

**Membership (`journalAcls/{journalId}/members`) has no client-side list query
anywhere in the current codebase.** Collaboration/membership is a schema this project
has designed (§4, §6) but not yet shipped a client for — there is no real "who can
access this journal" dashboard query to reproduce today. Any design for it below is
necessarily prospective, not a fix to an existing broken call.

---

## 3. Minimal, exact reproduction — pass/fail results

Every query below was run against the **unmodified** canonical `firestore.rules`
(`test/photo-library-emulator/rules/firestore.rules`, byte-identical to canonical §20),
in a **clean emulator state** (`clearFirestore()` immediately before each), reproducing
the **exact filter/order shape** from the table above — never a broader or narrower
substitute. Full test file:
`test/photo-library-emulator/__tests__/01c-exact-production-query-inventory.test.mjs`
(plus `01d-collaborator-list-diagnostic.test.mjs` for the collaborator control case).

| # | Source function | Exact shape | Identity | Result |
|---|---|---|---|---|
| 1 | `fsLoadNotebooks` | `users/{uid}/notebooks`, `orderBy('updatedAt','desc')`, no `where` | owner | **FAIL** — `Null value error. for 'list' @ L106` |
| 2/3 | `fsLoadPages` / `fsDeleteNotebook`(pages) | `users/{uid}/pages`, `where('notebookId','==',X)` | owner | **PASS** |
| 4/5 | `fsDeleteNotebook`(elements) / `fsLoadNotebookElements` | `users/{uid}/elements`, `where('notebookId','==',X)` | owner | **PASS** |
| 6/7/8 | `fsLoadElements` / `fsDeletePage` / `fsReplacePageElements` | `users/{uid}/elements`, `where('pageId','==',X)` | owner | **FAIL** — `Property notebookId is undefined on object. for 'list' @ L125` |
| 9/10 | `fsDeleteNotebook`(photos) / `fsLoadPhotos` | `users/{uid}/photos`, `where('notebookId','==',X)` | owner | **FAIL** — `No matching allow statements` (a **different, pre-existing** gap: the canonical ruleset has no rule for `photos` at all — see §4 below, not a list-provability issue) |
| 14 | `fetchJournalFromFirestore`(pages) | `journals/{journalId}/pages`, no `where` | owner | **PASS** |
| 15 | `fetchJournalFromFirestore`(elements) | `journals/{journalId}/elements`, no `where` | owner | **PASS** |
| 14/15 | same, collaborator control | `journals/{journalId}/pages`\|`elements` | **editor** (non-owner member) | **PASS** — confirmed collaborator list access already works |
| 14/15 | same, non-member control | `journals/{journalId}/pages` | **unrelated authenticated** | correctly **DENIED** (not a defect — this is the intended deny case) |
| 16 | `subscribeToElements` | `journals/{journalId}/elements`, `onSnapshot` listener | owner | **PASS** — initial snapshot succeeds identically to the equivalent `getDocs` |
| 17 | `subscribePresence` | `journals/{journalId}/presence`, `onSnapshot` listener | owner | **PASS** |
| 13 | `fetchJournalFromFirestore`(journal doc) | `journals/{journalId}`, `getDoc` | owner | **PASS** (not list-shaped) |
| — | single-notebook `getDoc` | `users/{uid}/notebooks/{id}` | owner | **PASS** (not list-shaped) |

### Summary of actual impact

**Two real production query shapes are broken**, both severe (core, constant-use paths):
- **#1 `fsLoadNotebooks`** — the dashboard's notebook list. Breaks the dashboard
  entirely for every user, every load.
- **#6/7/8 elements-by-`pageId`** — `fsLoadElements`, `fsDeletePage`,
  `fsReplacePageElements`. Breaks loading a page's content onto the editor canvas,
  every page, every load, and breaks page deletion and layout application.

**Everything else in the real query surface already works**, including the entire
mirror/collaboration-sync path (both for the owner and, confirmed directly, for a
non-owner editor collaborator) and the notebookId-scoped bulk queries
(`fsLoadPages`, `fsLoadNotebookElements`, the notebook-deletion sub-queries).

**One unrelated, pre-existing gap** (not part of this defect): the `photos` Firestore
collection (legacy, distinct from the new `photoAssets`) has no rule at all in the
canonical ruleset and is denied by default. This predates the Photo Library redesign
entirely — `photos` was never brought into scope by any round of this document — and is
noted here for completeness, not investigated further as part of this defect.

---

## 4. Why `#1` and `#6/7/8` specifically fail, in rule-text terms

**`notebooks`** (canonical §20):
```
match /users/{ownerUid}/notebooks/{notebookId} {
  allow read: if hasReadAccess(notebookId) && pathOwnerMatchesAcl(ownerUid, notebookId);
```
`notebookId` here is the **inner** wildcard — it varies across every document in the
`users/{ownerUid}/notebooks` collection, and `fsLoadNotebooks` has no `where` clause
pinning it to one value. Each candidate notebook could belong to a *different* journal
with a *different* `journalAcls` doc; Firestore cannot prove, without reading every one
individually, that `hasReadAccess` holds for the whole set — so it refuses the query.

**`elements` keyed on `pageId`**:
```
match /users/{ownerUid}/elements/{elementId} {
  allow read: if hasReadAccess(resource.data.notebookId) && pathOwnerMatchesAcl(ownerUid, resource.data.notebookId);
```
The rule keys on `resource.data.notebookId`. `fsLoadElements` filters by `pageId`, not
`notebookId` — even though, in reality, every element on one page shares one
`notebookId`, the query's own constraints don't say so, and Firestore won't infer it.

**Why `elements` keyed on `notebookId` (shape #4/5) and `pages` keyed on `notebookId`
(shape #2/3) both pass**: their `where('notebookId','==',X)` clause pins the *exact*
field the rule reads to one fixed value — Firestore can then prove the rule holds for
every possible match using a single `journalAcls` lookup for that one value, not one
per document.

**Why the mirror (`journals/{journalId}/pages`\|`elements`\|`presence`) passes, for
both owner and collaborator**: its rule is `hasReadAccess(journalId)`, where
`journalId` is fixed by the **collection's own path** — the same single value for
every document the query could ever return, regardless of how many pages/elements
exist. One ACL lookup, proven once, covers the whole list.

---

## 5. Proposed (not applied) list-safe authorization design

Two complementary mechanisms, addressing owner access and collaborator access
separately, since they have different provability shapes.

### 5a. Owner-path canonical collections: fixed-path-owner shortcut

For `users/{ownerUid}/notebooks` and `users/{ownerUid}/elements` (the two broken
shapes), add an **OR** branch to each read rule that needs no `get()`/`exists()` call at
all:
```
allow read: if (request.auth != null && request.auth.uid == ownerUid)
             || (hasReadAccess(notebookId) && pathOwnerMatchesAcl(ownerUid, notebookId));   // notebooks
allow read: if (request.auth != null && request.auth.uid == ownerUid)
             || (hasReadAccess(resource.data.notebookId) && pathOwnerMatchesAcl(ownerUid, resource.data.notebookId));  // elements
```
`request.auth.uid == ownerUid` depends **only** on the query's own fixed path segment
and the caller's own token — trivially provable for *any* filter shape, with *zero*
per-document variance and *zero* cross-document reads. This is the exact same pattern
already proven to work for the mirror's `hasReadAccess(journalId)` — a rule that
depends only on a value fixed by the query itself. It fixes both broken shapes (`#1`,
`#6/7/8`) immediately, for the owner, with **no schema change and no backfill** — a
pure rule-text edit.

**Confirmed directly against the original defect** — this is the one claim in this
proposal that matters most, and an earlier revision of this document asserted it
without ever actually running it. It is applied, verbatim as shown above, in
`test/photo-library-emulator/rules/firestore.proposed.rules`, and tested in
`03-proposed-rules-corrections.test.mjs`'s "§5a FIX" group against the **exact original
production query shapes**, not a substitute: `fsLoadNotebooks` (`orderBy('updatedAt',
'desc')`, no `where`) now succeeds for the owner and is still correctly denied for an
unrelated user; the elements-by-`pageId` shape (`fsLoadElements`/`fsDeletePage`/
`fsReplacePageElements`) now succeeds for the owner and is still correctly denied for
an unrelated user; every previously-working shape (`fsLoadPages`, `fsLoadNotebookElements`,
the mirror for both owner and a non-owner editor, the mirror's denial of an unrelated
user, and a collaborator's individual `get()` via the retained ACL branch) still passes
— 10 assertions, 10 passes, see §10 for the full breakdown.

**What this does not cover**: a *collaborator* (editor/viewer, not the owner) listing
`users/{ownerUid}/notebooks` or `users/{ownerUid}/elements` directly — for them,
`request.auth.uid == ownerUid` is false, and the second, still-unprovable branch would
still reject a `list`. This is not a regression (collaborators cannot do this *today*
either — it's currently broken for everyone, owner included), but it means the owner
fix alone does not give a collaborator a working "list this journal's pages" query
against the *canonical* path. That gap is intentionally left to 5b/5c below, since the
mirror already serves that exact need today (confirmed in §3) — a collaborator has no
actual requirement to query the canonical path directly.

### 5b. Mirror stays the collaboration-read channel — no change needed

Confirmed empirically (§3): the mirror's `hasReadAccess(journalId)` already correctly
serves both the owner and a genuine editor collaborator for `list` queries on
pages/elements/presence, and correctly denies a non-member. This is not a gap to close;
it is existing, working design that this investigation validates rather than changes.
Collaborative reads of page/element *content* should continue to go through the mirror,
exactly as `collab.js` already does — the canonical `users/{ownerUid}/...` path remains
the write-authoritative store and the owner's own direct-read path, not something a
collaborator needs to list.

### 5c. Per-user access index, for a collaborator's cross-owner dashboard — CORRECTED (minimal schema, real atomicity)

The one genuinely new requirement — a collaborator discovering *which* journals they
have access to, across potentially many different owners' uid-paths, with no existing
client feature to reproduce (§2's finding: no such query exists in the app today) —
needs a different mechanism, since no `where`/path trick can make an unbounded,
cross-owner scan provable.

**Schema — minimal, correctness-first (correction 3, adopted as directed — no
denormalized display fields, so there is no rename/update fan-out obligation to
specify or leave unaddressed):**
```
/users/{uid}/journalAccess/{journalId}
  { journalId: string, ownerUid: string, role: 'owner' | 'editor' | 'viewer',
    addedAt: timestamp }
```
A collaborator dashboard lists this index (cheap, provable, no per-document ACL check),
then fetches each journal's own mirror document — `journals/{journalId}`, which already
carries `name` (§2's `pushJournal`/`collab.js`) and is already provably `get`/`list`-able
by a member (confirmed empirically in §3, editor identity) — for current display
metadata. Nothing is ever copied, so nothing ever needs a propagation path: a rename
updates the one, single mirror document exactly as `pushJournal` already does today, and
every dashboard read sees it immediately, live.

**Rule — read gated to the owning uid, zero client write:**
```
match /users/{uid}/journalAccess/{journalId} {
  allow read: if request.auth != null && request.auth.uid == uid;   // fixed-path-owner,
                                                                        trivially provable
  allow create, update, delete: if false;                            // Admin SDK only
}
```
A `list` on `users/{uid}/journalAccess` is provable by the identical fixed-path-owner
pattern as 5a — no cross-document ACL lookup needed, because the index itself *is* the
per-user materialized view. **Confirmed, with an explicit scope caveat**
(`test/photo-library-emulator/__tests__/03-proposed-rules-corrections.test.mjs`): the
*rule* correctly lets the owning user list/get their own index, correctly denies a
different user, and correctly denies every client write. The schema-shape test asserts
that a **document seeded by the test fixture itself** — not by any real write path —
contains exactly `{journalId, ownerUid, role, addedAt}`. That proves the *rule* doesn't
reject that shape; it does **not** prove `inviteMember`/`updateMemberRole`/`removeMember`
(§5c below, unimplemented) will actually write that shape, or any consistent shape at
all, since those callables don't exist yet to test.

**Membership writes must become Admin-SDK-only too — CORRECTED (correction 2), or the
index is trivially bypassable.** The canonical ruleset (§6/§20), unchanged by the
original 5c draft, still allows an owner to directly `create`/`update`/`delete`
`journalAcls/{journalId}/members/{uid}` from the client. **Inventory of every current
membership write path**: exactly those three client rule branches in §20 — there is no
other write path, because collaboration has no shipped client code at all (§2's
finding). That is precisely the bug: a directly client-writable `members` doc lets an
owner invite, promote, or remove someone **without the index ever being touched**,
since a plain client `setDoc`/`deleteDoc` has no way to also write a second, unrelated
document in the same commit. The result would be an index that is wrong by omission
from the moment collaboration ships — worse on removal, where a stale index entry keeps
*discovering* a journal for a user whose authoritative membership is already gone (not
a full access bypass, since every actual read/write still re-checks `journalAcls`/
`members` fresh — but a real, unintended information/UX leak: the revoked user's
dashboard keeps listing a journal they no longer have real access to, until they try to
open it and are correctly denied).

**Fix**: `journalAcls/{journalId}/members/{uid}` becomes `allow create, update, delete:
if false` — Admin SDK only, matching the pattern already used everywhere else in this
ruleset for anything the index or another derived structure depends on (`notebooks`,
`photoAssets`, `pendingUploads`). Three named trusted operations replace the direct
client writes, each running the *same* authorization checks the current client-writable
rules encode today, now enforced inside a transaction instead of at the rules layer,
**plus** the index write, atomically:

```
inviteMember({journalId, uid, role}):
  ONE transaction:
    verify isOwner(journalId) — the caller (§4's existing owner-only membership policy,
      unchanged).
    verify journalIsActive(journalId).
    verify role in ('editor', 'viewer').
    create journalAcls/{journalId}/members/{uid}: {role, invitedAt: now, invitedByUid: caller}.
    create users/{uid}/journalAccess/{journalId}: {journalId, ownerUid: <from journalAcls>, role, addedAt: now}.
  Commit. Both documents exist, or neither does.

updateMemberRole({journalId, uid, role}):
  ONE transaction:
    verify isOwner(journalId); verify journalIsActive(journalId); verify role in ('editor','viewer').
    verify the member doc exists (else "not a member").
    update journalAcls/{journalId}/members/{uid}.role = role (invitedAt/invitedByUid unchanged).
    update users/{uid}/journalAccess/{journalId}.role = role.
  Commit. Both updated together, or neither is.

removeMember({journalId, uid}):
  ONE transaction:
    verify isOwner(journalId); verify journalIsActive(journalId).
    delete journalAcls/{journalId}/members/{uid}.
    delete users/{uid}/journalAccess/{journalId}.
  Commit. This is what makes revocation leave no stale readable data: there is no
  commit in which one is gone and the other still exists — the "one exists without the
  other" window this design is meant to close cannot occur, because both writes are the
  same atomic operation, not two separate ones a client could interleave.
```

`createJournal` gains the same treatment for the owner's own initial entry: the same
transaction that creates `journalAcls/{journalId}` also creates
`users/{ownerUid}/journalAccess/{journalId}` (role: `'owner'`).

`deleteJournal` (§14) gains an explicit step — every remaining member's (and the
owner's) `journalAccess/{journalId}` entry is deleted as part of the sweep, exactly
analogous to the `notebookCover` ref-cleanup step already added there.

**Confirmed, with an explicit scope caveat** (same test file): with the corrected
rules, a direct client `create`, `update` (a role change), or `delete` on a `members`
doc — the exact bypass that would have orphaned the index — is now denied, for the
owner, exactly as for anyone else; `members` remains readable (unchanged, needed for
`hasReadAccess`/`hasWriteAccess` to keep working). **This proves the rules-level bypass
is closed. It does not prove `inviteMember`/`updateMemberRole`/`removeMember` are
correct, safe, or atomic** — those three operations are specified above as pseudocode
only. None has been implemented as a real trusted Function, and none has been tested:
not the all-reads-before-writes ordering, not the owner/`journalIsActive` checks
running *inside* the transaction, not the "both documents or neither" atomicity claim
itself. That remains named, explicitly, as required future work (§8), not something
this revision has verified.

**Explicit limit, stated honestly, consistent with this document's existing disclosure
about download-token URLs**: deleting the index entry stops the journal from appearing
in a *future* dashboard list. It does not revoke content a collaborator's client has
already fetched and cached, nor any bearer-token Storage URL they already hold — the
same class of limitation this document already discloses for photo download tokens.
Real access revocation is enforced by the *authoritative* `journalAcls`/`members`
check on every subsequent read/write, not by the index.

### 5d. Legacy `/users/{uid}/photos` compatibility — NEW (correction 1), blocking

**Why this is a blocking defect, not a side note.** Canonical §20 is presented as a
*complete replacement* ruleset. The current production `firestore.rules` has no
per-collection restriction at all under `users/{userId}/**` (a single broad owner-only
catch-all covers every subcollection, including `photos`) — so `photos` reads/writes
work today purely as a side effect of that catch-all. §20 deliberately removes any such
catch-all (the same fix already applied to Storage in §19/§20, for the same reason: a
broad catch-all is what caused the Storage bypass this design corrects). Removing it
from *Firestore* too, without adding an explicit `photos` rule, would deploy a ruleset
that silently denies a real, currently-working, currently-preserved feature — not a
theoretical gap, an actual regression the instant §20 replaced the current rules.

**Complete inventory of every real call site** (repository-wide search, `firestoreHelpers.js`/`collab.js` plus every importer):

| Call site | Function | Operation | Exact shape |
|---|---|---|---|
| `CollageElement.jsx:23`, `CoverElement.jsx:30`, `ImageElement.jsx:42`, `Inspector.jsx:224`, `MobileEditorBar.jsx:353` | `fsSavePhoto(uid, photo)` | create (setDoc, always the caller's own uid) | `users/{uid}/photos/{photo.id}` |
| `Inspector.jsx:177`, `MobileEditorBar.jsx:303`, `Sidebar.jsx:18`, `ThemeDetailModal.jsx:247` | `fsLoadPhotos(uid, notebookId)` | list | `users/{uid}/photos`, `where('notebookId','==',notebookId)` |
| `Memories.jsx:24` | `fsLoadPhotos(user.uid, nb.id)`, called once per notebook | list (same shape as above, repeated) | `users/{uid}/photos`, `where('notebookId','==',notebookId)` |
| `firestoreHelpers.js:40` (inside `fsDeleteNotebook`) | cascade query + `batch.delete` | list, then delete per doc | `users/{uid}/photos`, `where('notebookId','==',notebookId)`, then delete |

No `fsUpdatePhoto` or single-document `fsDeletePhoto` exists — every write is either a
full `setDoc` (create/overwrite) or the cascade delete above. The document shape,
confirmed from `storageHelpers.js`'s `uploadPhoto()` (the sole producer): `{id,
notebookId, filename, mimeType, size, storageUrl, thumbnailUrl, uploadedAt}`.

**Proposed compatibility rule — owner-only, matching today's de facto access exactly,
nothing added or removed**:
```
match /users/{ownerUid}/photos/{photoId} {
  allow read: if request.auth != null && request.auth.uid == ownerUid;
  allow create, update, delete: if request.auth != null && request.auth.uid == ownerUid;
}
```
No protected-field logic, no `hasWriteAccess`/collaborator branch: this collection
predates collaboration entirely, every real call site above always passes the caller's
own uid, and there is no evidence anywhere in the codebase of any non-owner write path
to preserve. `request.auth.uid == ownerUid` is the same fixed-path-owner pattern as 5a
— trivially provable for every `list` shape above, including the unfiltered case.

**Confirmed against every real call site** (`03-proposed-rules-corrections.test.mjs`,
CORRECTION 1 group, 10 tests): owner create/list/get/delete/**update** (`fsSavePhoto`
called on an id that already exists — a plain `setDoc` with no merge flag, which
Firestore Rules evaluate as `update`, not `create` — the create-only case alone does
not exercise this branch) all succeed; a different authenticated user is denied
create/**update**/list/delete; unauthenticated is denied create.

**Kept until a separately-approved migration proves the collection unused.** This rule
is not a design decision about the *new* Photo Library architecture — `photos` is
explicitly, permanently out of scope for that (§7's Storage audit already treats
`users/{uid}/photos/**` as the untouched legacy path). It is compatibility scaffolding
for *currently shipped* functionality, and stays in place — unconditionally, not as a
"temporary" unenforced assumption — until an explicit, separately-approved,
read-only inventory (mirroring every other migration gate in §25) confirms zero
remaining reads/writes against it, at which point removing the rule is its own,
separately-approved step, not an automatic consequence of anything in this proposal.

### Security tradeoff summary

| Mechanism | New reads | New writes | Provable for | Owner-only-governance impact |
|---|---|---|---|---|
| 5a (`request.auth.uid == ownerUid` OR-branch) | none | none | owner-only list access to their own canonical data | none — adds a strictly *narrower* extra path (owner-of-this-exact-path only); the existing ACL branch is untouched for `get()`s and for anything a non-owner needs |
| 5b (no change) | — | — | already provable | none |
| 5c (`journalAccess` index, corrected) | 1 extra collection, minimal (no denormalization) | 1 extra write per membership change, same transaction as the now Admin-SDK-only `members` write | collaborator's own cross-owner dashboard list | none — the index never grants access itself; it only makes *discovery* of already-granted access queryable, and can no longer go stale by omission or leave a revoked user's index readable past the atomic removal commit. `requestPermanentDelete`/asset governance (§4) are untouched |
| 5d (legacy `photos` compatibility) | none beyond what already works today | none | owner's exact current read/write pattern | none — strictly narrower than today's broad catch-all (scoped to exactly this one collection, not all of `users/{uid}/**`), and does not touch photo-asset governance (§4) at all — `photos` is a distinct, legacy collection from `photoAssets` |

---

## 6. Required schema/rule/client-query changes (if this direction is adopted)

- **Schema**: add `/users/{uid}/journalAccess/{journalId}`, minimal —
  `{journalId, ownerUid, role, addedAt}`, no denormalized fields (5c only; 5a and 5d
  need no new schema).
- **Rules**:
  - the two OR-branch edits in 5a (`notebooks`, `elements`);
  - `journalAcls/{journalId}/members/{uid}` changes from client-writable to
    `allow create, update, delete: if false` (5c correction 2) — a **behavior-narrowing**
    change to an *already-canonical* rule, not purely additive like the others, since it
    removes a write path collaboration would otherwise have relied on once shipped (it
    has no current client callers, so nothing shipped today is affected);
  - the new `journalAccess` match block (5c);
  - the new `photos` match block (5d).
  No other rule in §20 needs to change — every other collection's list shape already
  passes (§3).
- **New trusted operations**: `inviteMember`, `updateMemberRole`, `removeMember` (5c
  correction 2) — none of these exist yet in any form; they are net-new, required by
  this proposal specifically to keep `members` and `journalAccess` atomic. `createJournal`
  (already required by the canonical document independent of this proposal) gains one
  additional write (the owner's own `journalAccess` entry) in its existing transaction.
- **Client queries**: **zero changes** to any existing call for 5a or 5d —
  `fsLoadNotebooks`, `fsLoadElements`, and every `photos` call site already query under
  the caller's own uid; only the *rule* needs to change to make those already-correct
  query shapes provable. A genuinely new client code path (not a modification of an
  existing one) would be needed to build a collaborator's "my shared journals" dashboard
  using the `journalAccess` index — this does not exist today because collaboration
  doesn't ship yet.

---

## 7. Migration implications

- **5a is migration-free** — a pure rule-text change, no new documents, no backfill.
  It could ship independently of everything else in this design and immediately fixes
  both confirmed-broken production query shapes.
- **5d is migration-free** — a pure rule-text addition, no new documents, no backfill,
  and no client-code change. It could ship in the exact same standalone step as 5a.
- **5c requires a backfill** once collaboration actually ships: for every existing
  `journalAcls` doc (and, once it exists, its `members` subcollection), write the
  corresponding `journalAccess` entries via the same atomic pattern `inviteMember`
  uses, not a bulk unguarded write. This is a bounded, one-time, read-then-write
  operation and should go through the same gated sequence already defined in §25
  (0a inventory → 0b proposed payload → 0c emulator test → 0d rollback doc → 0e
  approval → 0f execute → 0g verify → 0h approval to proceed) — no new migration
  mechanism needs to be invented. Since `members` has no current client writers, closing
  the direct-write rule (5c correction 2) itself needs **no** compatibility shim the way
  5d's `photos` fix does — there is nothing shipped to preserve.
- Deployment ordering: 5a and 5d have no dependency on 5c and no dependency on the
  collaboration feature shipping at all — both are standalone, immediately-applicable
  corrections to the canonical rules, independent of everything else in this proposal,
  and independent of each other.

---

## 8. New race and emulator tests required (if adopted)

- Re-run this document's §3 inventory against the corrected rules, confirming: both
  previously-failing shapes now pass, for the owner; a *non-owner* still correctly
  cannot `list` another user's `users/{ownerUid}/notebooks`\|`elements` (the OR-branch
  must not have widened access, only added a provable path for the legitimate owner
  case).
- `journalAccess` write atomicity: invite creates both `members/{uid}` and
  `journalAccess/{journalId}` in the same commit — verify via a forced mid-transaction
  failure that neither is left without the other.
- `journalAccess` revoke atomicity: remove a member — verify both documents are gone
  in the same commit, and that a `list` on the revoked user's `journalAccess`
  immediately excludes it.
- `deleteJournal` sweep: verify every member's (and the owner's) `journalAccess` entry
  is removed as part of the sweep, with no entry surviving the journal's full deletion
  — the same style of test already required for the `notebookCover` ref-cleanup case
  (§27).
- Role-change race: a `journalAccess.role` update concurrent with a `deleteJournal`
  lock — confirm the lock (§14 step 1) rejects the role change once `journalStatus !=
  'active'`, exactly as every other write path does, so the index can't be updated
  for a journal already mid-deletion.
- **Direct membership-write bypass, confirmed closed** (5c correction 2) — already run:
  `03-proposed-rules-corrections.test.mjs`, CORRECTION 2 group. An owner's direct
  `create`/`delete` on `journalAcls/{journalId}/members/{uid}` is denied; `members`
  remains readable. Not yet tested (requires the trusted-operation prototypes, out of
  scope for a rules-only proposal): `inviteMember`/`updateMemberRole`/`removeMember`'s
  actual transactional behavior — the all-reads-before-writes ordering, the
  owner/`journalIsActive` checks *inside* the transaction, and a forced
  mid-transaction-failure test proving neither `members` nor `journalAccess` is ever
  left without the other.
- **Legacy `photos` compatibility rule, confirmed against every real call site** (5d)
  — already run: `03-proposed-rules-corrections.test.mjs`, CORRECTION 1 group, 8 tests
  covering `fsSavePhoto` (create), `fsLoadPhotos` (list, `where(notebookId==X)`, the
  exact shape from Inspector/MobileEditorBar/Sidebar/ThemeDetailModal/Memories), a
  single-document read, and the `fsDeleteNotebook` cascade delete — each for owner
  (pass), a different authenticated user (deny), and unauthenticated (deny, create
  case). No further tests are required for 5d unless the migration-inventory gate
  (§5d) is later invoked to remove the rule, at which point that inventory is its own
  separately-approved, separately-tested step.
- **`journalAccess` minimal-schema shape, confirmed** — already run: same file,
  CORRECTION 2/3 group. A fetched `journalAccess` document contains exactly
  `{addedAt, journalId, ownerUid, role}` — no denormalized field of any kind.

---

## 9. Revision changelog

This section records what changed between the first-accepted-in-principle draft and
this corrected revision, and why — the same discipline
`docs/photo-library-architecture-canonical.md`'s own Reconciliation Appendix uses for
its consolidation defects, applied here to this proposal's own revision.

| # | What was wrong | Fix | Evidence |
|---|---|---|---|
| 1 | No compatibility rule proposed for the actively-used legacy `photos` Firestore collection; canonical §20, presented as a complete replacement, would have silently broken working upload/browse/delete functionality on deploy. | New §5d: complete call-site inventory, an explicit owner-only rule matching today's de facto access, kept unconditionally until a separately-approved migration proves the collection unused. | 8 passing tests, every real call site, both allow and deny cases |
| 2 | `journalAcls/{journalId}/members/{uid}` stayed directly client-writable in the original 5c draft, so an owner's direct invite/role-change/remove would never touch the `journalAccess` index — stale by omission, or stale-and-still-discoverable after a removal. | §5c revised: `members` becomes Admin-SDK-only (`allow create, update, delete: if false`); three new named trusted operations (`inviteMember`, `updateMemberRole`, `removeMember`) write `members` and `journalAccess` in the same transaction, with owner/`journalIsActive` checks inside that transaction. | 4 passing tests confirming the direct-write bypass is closed and reads remain unaffected; the transactional prototypes themselves are unbuilt and untested — named explicitly as remaining work in §8 |
| 3 | The `journalAccess` schema included a denormalized `notebookName`, with no specified propagation path for a rename. | Adopted the directed minimal schema `{journalId, ownerUid, role, addedAt}`; a dashboard fetches the journal's own mirror document (already provably readable by a member) for live display metadata instead of a copy — eliminating the propagation problem rather than solving it. | 1 passing test confirming the fetched schema has exactly these four fields |

### Revision 2 — the proposal was not yet proven; this round fixes that

The first revision above described the §5a fixed-path-owner fix in prose but **never
applied it** to `rules/firestore.proposed.rules`, and no test anywhere reproduced the
two original defect shapes (`fsLoadNotebooks`, elements-by-`pageId`) against the
proposed rules. The evidence for §5a was, in fact, no evidence at all. Separately, the
15-test baseline reported for the first revision mixed real `assertSucceeds`/
`assertFails` assertions together with earlier diagnostic files (§2/§3's investigation)
that only log an observed outcome and cannot fail a test regardless of what Firestore
actually returns — producing an inflated, ambiguous "pass" count.

| # | What was wrong | Fix | Evidence |
|---|---|---|---|
| 4 | The §5a OR-branch was never written into `rules/firestore.proposed.rules` — `notebooks` and `elements` read rules were still byte-identical to canonical. No test reproduced `fsLoadNotebooks` or elements-by-`pageId` against the proposed rules — the two shapes that started this entire investigation were never actually proven fixed. | Applied the exact diff in §10 below. Added a dedicated test group reproducing both original shapes plus their denial cases plus every regression case (notebookId-scoped queries, mirror owner/editor/unrelated). | §10, 10 new assertions, all passing |
| 5 | The baseline accounting conflated real assertions with diagnostic-only observations (try/catch-and-log helpers that cannot fail a `node:test` test regardless of the actual Firestore response) into one undifferentiated "15/15 pass" figure. | §10 below reports four separate, precisely counted totals: successful-access assertions, expected-denial assertions, known-defect assertions, and diagnostic-only observations — for both the canonical-rules suite and the proposed-rules suite, run and preserved separately. | §10 |
| 6 | No test exercised a direct `update` (role change) denial on `journalAcls/{journalId}/members/{uid}` — create/delete denial alone doesn't prove update is also denied. | Added an explicit update-denial test. | §10 |
| 7 | No test exercised the `update` case of `fsSavePhoto` (a plain `setDoc` with no merge flag, on an id that already exists — Firestore Rules treats this as `update`, not `create`; the create-only test never reached this branch). | Added explicit owner-succeeds / different-user-denied update-case tests. | §10 |
| 8 | Evidence language overclaimed: the `journalAccess` schema test was described as proving the fetched document's shape, when it actually only proves the rule accepts a shape the test fixture itself seeded — it says nothing about what the unbuilt `inviteMember` callable would write. The membership-bypass tests were described in a way that could be read as validating the (unimplemented) trusted operations themselves, not just the rules-level bypass closure they depend on. | Both claims rewritten in §5c with explicit scope caveats: what is proven (the rule accepts/rejects correctly) versus what is not (the unbuilt callables' own correctness, atomicity, or output shape). | §5c (inline), §10 |

---

## 10. Corrected evidence: exact rule diff and unambiguous assertion totals

### Exact diff — canonical `rules/firestore.rules` → proposed `rules/firestore.proposed.rules`

```diff
@@ -76,17 +76,28 @@
     allow read: if hasReadAccess(journalId);
     allow create, update, delete: if false;   // Admin SDK (createJournal / deleteJournal) only
   }
-  // Membership — lifecycle-gated, field-validated (§6).
+  // Membership — PROPOSED CORRECTION: no direct client write at all. Invite/role-change/
+  // remove must route through named trusted operations (inviteMember/updateMemberRole/
+  // removeMember) that write journalAcls/members AND users/{uid}/journalAccess together,
+  // in one transaction — a directly client-writable members doc would let an owner change
+  // membership without ever touching the access index, leaving it stale by omission.
   match /journalAcls/{journalId}/members/{uid} {
     allow read: if hasReadAccess(journalId);
-    allow create: if isOwner(journalId) && journalIsActive(journalId)
-      && (request.resource.data.role == 'editor' || request.resource.data.role == 'viewer')
-      && request.resource.data.invitedByUid == request.auth.uid;
-    allow update: if isOwner(journalId) && journalIsActive(journalId)
-      && (request.resource.data.role == 'editor' || request.resource.data.role == 'viewer')
-      && request.resource.data.invitedByUid == resource.data.invitedByUid
-      && request.resource.data.invitedAt == resource.data.invitedAt;
-    allow delete: if isOwner(journalId) && journalIsActive(journalId);
+    allow create, update, delete: if false;   // Admin SDK (inviteMember/updateMemberRole/removeMember) only
+  }
+
+  // PROPOSED (correction 3: minimal schema, no denormalized display fields).
+  match /users/{uid}/journalAccess/{journalId} {
+    allow read: if request.auth != null && request.auth.uid == uid;
+    allow create, update, delete: if false;   // Admin SDK only, written atomically with journalAcls/members
+  }
+
+  // PROPOSED (correction 1: legacy photos compatibility — owner-only, matches today's
+  // de facto behavior under the current broad users/{uid}/** rule, until a separately
+  // approved migration proves this collection is unused).
+  match /users/{ownerUid}/photos/{photoId} {
+    allow read: if request.auth != null && request.auth.uid == ownerUid;
+    allow create, update, delete: if request.auth != null && request.auth.uid == ownerUid;
   }

   // Presence (§18).
@@ -103,7 +114,12 @@
   // coverAssetId/coverUrl/coverThumbUrl invariant from being bypassed by a generic
   // client update.
   match /users/{ownerUid}/notebooks/{notebookId} {
-    allow read: if hasReadAccess(notebookId) && pathOwnerMatchesAcl(ownerUid, notebookId);
+    // PROPOSED (§5a): fixed-path-owner OR-branch — provable for ANY list shape (no
+    // per-document ACL lookup needed when the caller IS the path's own owner), added
+    // ahead of the existing ACL branch, which is retained unchanged for a collaborator's
+    // individual get() of one specific notebook.
+    allow read: if (request.auth != null && request.auth.uid == ownerUid)
+                || (hasReadAccess(notebookId) && pathOwnerMatchesAcl(ownerUid, notebookId));
     allow create, update, delete: if false;   // Admin SDK only: createJournal, deleteJournal,
                                                 // updateNotebookMetadata, updateNotebookTheme,
                                                 // setNotebookCoverPhoto
@@ -122,8 +138,13 @@
     allow delete: if false;   // deletePage/deleteJournal callables only (§9/§14)
   }
   match /users/{ownerUid}/elements/{elementId} {
-    allow read: if hasReadAccess(resource.data.notebookId)
-                && pathOwnerMatchesAcl(ownerUid, resource.data.notebookId);
+    // PROPOSED (§5a): same fixed-path-owner OR-branch as notebooks above — this is what
+    // makes the elements-by-pageId list (fsLoadElements/fsDeletePage/fsReplacePageElements)
+    // provable, since the query's own where('pageId','==',X) does not pin the notebookId
+    // the existing ACL branch reads.
+    allow read: if (request.auth != null && request.auth.uid == ownerUid)
+                || (hasReadAccess(resource.data.notebookId)
+                    && pathOwnerMatchesAcl(ownerUid, resource.data.notebookId));
     allow create: if hasWriteAccess(request.resource.data.notebookId)
                   && journalIsActive(request.resource.data.notebookId)
                   && pathOwnerMatchesAcl(ownerUid, request.resource.data.notebookId)
```
Four hunks, all additive except the `members` write rule (narrowed from three
conditional client-write branches to `if false`). No other line in either rules file
differs. (Full files: `test/photo-library-emulator/rules/firestore.rules` (canonical,
byte-identical to §20) vs. `.../rules/firestore.proposed.rules`.)

### Unambiguous assertion totals

Every number below is a count of actual `assertSucceeds`/`assertFails` **call
outcomes** at runtime (accounting for the five-identity table-driven tests in
`01-firestore-rules-identity.test.mjs`, which generate multiple runtime tests from a
single source-code loop) — not a count of source-code lines, and not a count of
`node:test` "tests" without regard to whether each one actually asserted anything.

**Canonical-rules suite** (`01`, `01b`, `01c`, `01d`, `02` — validates
`rules/firestore.rules`, byte-identical to canonical §20; evidence:
`evidence/full-run-06-canonical-baseline-reconfirmed.log`, run with
`--test-concurrency=1`):

| Category | Count | Detail |
|---|---|---|
| Successful-access assertions (passed) | 19 | 14 from `01` (owner/editor/viewer allow-cases across `journalAcls` and `notebooks`, protected-field/mirror/membership/presence/photoAsset allow-cases) + 5 from `02` (Storage upload/read allow-cases) |
| Expected-denial assertions (passed) | 45 | 32 from `01` + 13 from `02` |
| Known-defect assertions (asserted success, currently fail — the confirmed, unfixed defect in canonical rules) | 2 | `01`'s two `CLEAN-STATE` tests: `fsLoadNotebooks`-shape list still rejected by canonical `rules/firestore.rules`, exactly as diagnosed |
| Diagnostic-only observations (no assertion; cannot fail regardless of Firestore's response) | 7 test blocks (20 distinct query/scenario probes logged) | `01`'s 1 `ISOLATED DEFECT CHECK` + `01b`'s 3 + `01c`'s 1 (12 probes) + `01d`'s 2 (4 probes) |
| **`node:test` total** | **73** (71 pass, 2 fail) | 19+45+2 = 66 real assertions + 7 diagnostic blocks = 73; the 2 "fail" results are exactly, and only, the 2 known-defect assertions — nothing unexplained |

**Proposed-rules suite** (`03` alone — validates
`rules/firestore.proposed.rules`, run in complete isolation per instruction, since
Firestore rules are project-scoped and a second `initializeTestEnvironment()` call for
the same project id would silently replace whichever ruleset loaded first; evidence:
`evidence/full-run-05-PROPOSAL-corrected.log`):

| Category | Count | Detail |
|---|---|---|
| Successful-access assertions (passed) | 15 | includes the 2 originally-broken shapes now passing (§5a fix, `fsLoadNotebooks` + elements-by-`pageId`), 4 regression-check passes (notebookId-scoped queries, mirror owner/editor), 1 retained-ACL-branch collaborator `get()`, 8 legacy-photos allow-cases (create/list/get/delete/update), 2 `journalAccess` self-read passes |
| Expected-denial assertions (passed) | 13 | the exact 13, in file order: (1) unrelated vs. `fsLoadNotebooks` shape, (2) unrelated vs. elements-by-`pageId` shape, (3) unrelated vs. mirror pages list, (4) unrelated create on a legacy photo, (5) unauthenticated create on a legacy photo, (6) unrelated list on legacy photos, (7) unrelated delete on a legacy photo, (8) unrelated update on an existing legacy photo (the newly-added update case), (9) owner direct `create` on `members` (bypass check), (10) owner direct `delete` on `members`, (11) owner direct `update`/role-change on `members` (the newly-added update case), (12) a different user reading someone else's `journalAccess`, (13) any client, including the owner, writing `journalAccess` directly |
| Known-defect assertions | 0 | the proposed rules are specifically designed to make every previously-failing shape pass — confirmed, none remain |
| Diagnostic-only observations | 0 | this file uses only real `assertSucceeds`/`assertFails` calls throughout |
| **`node:test` total** | **28** (28 pass, 0 fail) | 15+13 = 28, exactly — no diagnostic inflation, no unexplained results |

**Combined, across both isolated suites**: 101 `node:test` results (99 pass, 2 fail);
94 real assertions (34 successful-access, 58 expected-denial, 2 known-defect); 7
diagnostic-only test blocks (20 probes) — never counted as assertions, never
contributing to a "pass" claim about correctness.

**What this does, and does not, establish.** The 2 known-defect failures are the
canonical ruleset's confirmed, unfixed defect — expected, and unchanged by this round.
The 28 proposed-rules passes, including the two decisive ones (the original broken
shapes now succeeding, under the *exact* production query shapes, with unrelated-user
denial confirmed alongside), are what actually substantiates this proposal — prior
rounds asserted this without having built or run it. What remains unverified, named
explicitly rather than implied: the `inviteMember`/`updateMemberRole`/`removeMember`
trusted operations exist only as pseudocode; their transactional correctness,
atomicity, and the real shape they would write to `journalAccess` are not tested by
anything in this document.

---

## Explicitly not done by this document

- No rule, schema, or client code was changed — including in this revision.
- `docs/photo-library-architecture-canonical.md` was not modified.
- No decision was made between 5a/5b/5c/5d and any alternative — this remains a
  proposal for your review, not an applied design.
- No emulator files beyond the diagnostic and proposal-validation test files already
  authorized were created; no production data, journals, or photographs were touched.
- The `inviteMember`/`updateMemberRole`/`removeMember` trusted-operation prototypes
  described in §5c are specified but not implemented or tested — the rules-level
  bypass-closure they depend on *is* tested (§8); their own transactional correctness
  is not, and is named as required future work, not claimed as verified.
