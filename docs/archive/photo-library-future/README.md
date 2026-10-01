# Archived — not current architecture

The two documents in this folder describe a **larger, multi-collaborator Photo Library
architecture** (shared `journalAcls`/`journalAccess` membership, trusted callable
operations, upload leases, a proposed Firestore rules rewrite) that was designed and
validated against a local Firestore emulator, but **never implemented and never
deployed**.

The shipped Photo Library feature is a different, much smaller **owner-only MVP** — see
[`../photo-library-owner-mvp-plan.md`](../photo-library-owner-mvp-plan.md) for what is
actually live. The MVP requires **zero changes** to the real, deployed Firestore rules;
the architecture described here was explicitly set aside in favor of it.

**Do not treat anything in this folder as current production architecture.** It's kept
only as a reference for a possible future expansion into genuine multi-collaborator
permissions (the owner's son and mother gaining their own write/trash/delete rights,
rather than today's owner-only model). Before acting on anything here, re-validate it
against whatever the live rules and schema actually look like at that time — both may
have moved on since these documents were written.

- `photo-library-architecture-canonical.md` — the full canonical architecture (schema,
  trusted operations, rules design).
- `photo-library-list-query-diagnostic-and-proposal.md` — the Firestore list-query
  provability diagnostic and the corrected rules proposal that architecture depended on.
