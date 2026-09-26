# Travel Journal — Session Handoff

**Read this first if you're a fresh Claude Code session picking this project up on a different machine.** Claude Code conversations don't sync across machines/accounts — this file is how context actually travels. It's updated as of 2026-09-26.

## What this is
A PWA travel journal app — book-style scrapbook with pages, photo uploads, maps, and AI writing help. Deployed at https://travel-journal-35449.web.app

## Tech stack
- React 18 + Vite 5 + Tailwind CSS
- Firebase: Auth (Google sign-in), Firestore (data), Storage (photos)
- Firebase project: `travel-journal-35449`
- Zustand state management
- TipTap rich text editor
- Leaflet maps
- react-grid-layout canvas
- PWA via vite-plugin-pwa (`registerType: 'autoUpdate'`) — **important gotcha below**

## To run locally
```
npm install
npm run dev
```
Then open http://localhost:5173. You'll also need a `.env.local` with the Firebase web config (it's gitignored, never in GitHub — get the values from Firebase console → Project settings → General → Your apps → Config, or ask whoever has them):
```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=travel-journal-35449.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=travel-journal-35449
VITE_FIREBASE_STORAGE_BUCKET=travel-journal-35449.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=1084574545408
VITE_FIREBASE_APP_ID=1:1084574545408:web:87d727eac5ae4988bd0ae5
```
Without it, the app loads but "Sign in with Google" silently does nothing (Firebase never initializes) — this exact symptom cost a lot of back-and-forth once already, don't repeat it.

## To deploy
```
npm run build
npx firebase-tools deploy --only hosting --project travel-journal-35449
```
(`firebase-tools` isn't installed globally on a fresh machine — `npx firebase-tools login` first, which needs the user to complete Google sign-in themselves in a browser; Claude cannot do that step.)

**PWA caching gotcha**: this app is a service-worker-cached PWA. After every deploy, the *published* site needs a hard refresh (`Ctrl+Shift+R`, sometimes twice) to actually load the new build — otherwise you'll be looking at stale cached JS and think the deploy didn't work. Burned real time on this already; check it first before assuming a deploy failed.

## Features built (this session, batches 3-5 — see git log for batches 1-2)
- **Voice memo element**: record/playback via `MediaRecorder`, uploads to Firebase Storage (`src/components/editor/elements/VoiceMemoElement.jsx`)
- **AI writing assistant** (`AiDraftModal.jsx`): 4 modes — Draft / Polish / Continue / Tone — reachable from both desktop toolbar and mobile "More" drawer (previously desktop-only, a real gap that got fixed)
- **AI photo captioning**: vision-based caption button on image elements, shared `src/utils/anthropic.js` helper (also used by the writing assistant)
- **Layout library**: expanded from 4 to 16 themed page layouts, merged into the single "Layouts" picker (`src/data/layouts.js`) alongside the original 7 structural categories — there is deliberately only **one** layout/template picker now, always reachable, not a separate blank-page popup (that popup, `PagePrompts.jsx`, was built and then explicitly removed per user feedback — see "Design decisions this session reversed" below)
- **Journal theme system, phase 1** (`src/data/themes.js`, `ThemePanel.jsx`, `CreateNotebookModal.jsx`): 17 themes (6 Occasion + 11 Mood), each with accent/secondary colors, background color, texture, heading/body fonts. Picked at journal creation and changeable later in the editor's right panel. **This is intentionally minimal and is mid-revision — see "In progress" below, do not consider this feature done.**
- Dashboard cover thumbnails now also pick up Cover Block photos and fall through to later pages, not just page-1 plain images (`fsGetFirstPageCover` in `firestoreHelpers.js`)
- Removed `orderBy` from two Firestore queries (`fsLoadPages`, `fsLoadPhotos`) — they needed a composite index that was never provisioned, causing journals to hang forever on "Loading…". Sorting moved client-side instead, which needs no index at all. **If you ever see a journal stuck on "Loading…" with a "requires an index" console error, it's almost certainly a stale deployed build, not a new index problem — redeploy + hard refresh first.**
- Bigger touch targets for drag/resize on mobile (`Canvas.jsx`, `index.css`)
- Fixed a page-switch flicker where the neutral editor "desk mat" background briefly showed through instead of the theme's actual page color (`Editor.jsx` page-flip transition was animating `opacity` to 0, not just a transform)

## Design decisions this session reversed — don't redo these
The user pushed back hard on two things; both are settled, don't re-litigate:
1. **Templates and layouts are the same concept.** "Templates are supped up layouts" — there is one "Layouts" button/picker, not a separate template gallery. A `PagePrompts.jsx` blank-page popup was built, then deleted entirely after user feedback that it re-introduced a redundant second concept.
2. **Picking a theme must only change colors/fonts/texture — nothing else.** An earlier version made picking a theme also change which page-layout suggestions appeared, which the user found surprising and unwanted ("I expect to apply a Christmas theme, not ask me about all, day, food, nature..."). Theme selection and layout/content selection must stay fully decoupled UI actions, even though (per the in-progress work below) a theme's *own* coordinated layouts are a planned exception — those are reached through the same single Layouts picker, not through the theme picker.

## Journal theme system, phase 2 — SHIPPED (Backpacking reference theme)
The original 17-theme system only recolored backgrounds/fonts. Following a detailed, multi-round ChatGPT-authored spec (four plan revisions, each addressing specific architectural gaps the user pushed back on), Backpacking is now a fully coordinated reference theme, with the same pattern ready to extend to the other 16 in a later pass. Commit `49d529e`.

**What's actually built**:
- `src/data/themes.js`: Backpacking has a `tokens` map (semantic palette: `heading`/`body`/`muted`/`accent`/`accentSecondary`/`border`/`mapRoute`/`photoFrame`/`keepsakeBorder`/`paper`/`surface`), 3 `covers` + 10 `layouts` (grouped: Covers / Photo / Writing / Map & Itinerary / Keepsake / Opening & Dividers — the exact 10 named types from the spec: hero photo, photo+writing, 4-photo collage, route map+narrative, daily field notes, itinerary timeline, keepsake arrangement, text-focused entry, chapter divider, sunrise/sunset). Element `data` fields reference tokens as `'$tokenName'` strings, resolved to literal hex **once, at apply time** by `resolveThemedElements()` — element renderers are completely unchanged, they only ever see literals.
- **Durable field-level provenance**: each resolved field gets `themeTokenProvenance[path] = {token, sourceThemeId, appliedValue}` — the *exact value written*, not just the token name. This is what makes the restyle engine safe against a theme's palette changing in a future release: comparisons are always against the stored `appliedValue`, never a fresh re-lookup. Verified directly (see below).
- **Restyle engine** (`editorStore.js`: `restyleDryRun`, `commitRestyle`, `changeJournalTheme`; pure logic in `themes.js`: `computeElementRestyle`): dry-run computes the full change set with no writes; matching fields restyle, hand-edited fields are preserved; gated off entirely for target themes with no `tokens` (everything except Backpacking, currently); commits via `fsBatchUpdateElements` (`firestoreHelpers.js`) chunked to Firestore's 500-op batch limit, idempotent (every write is the full target state, never a delta), and the notebook-level theme (background/fonts/texture) only updates *after* all restyle batches confirm success — a partial failure can never hide behind an already-changed background.
- Two accurately-named choices in the new Theme UI: **"Change journal theme, preserve existing element styling"** (explicitly discloses that background/fonts/texture change immediately) and **"Change journal theme and restyle compatible elements"** (only offered when the target theme has `tokens`).
- Curated stickers actually reach all 3 picker sites now (`Inspector.jsx`, and 2 sites in `MobileEditorBar.jsx`) via `orderStickersForTheme` — previously dead data.
- Layout pickers (`LayoutPicker.jsx` desktop, `LayoutsDrawer` in `MobileEditorBar.jsx`) inject a themed category (e.g. "🎒 Backpacking") with grouped subsections when the active theme has `covers`/`layouts` — same single picker, not a parallel gallery, per the earlier "templates are supped up layouts" decision.
- New `ThemeDetailModal.jsx`: gallery → per-theme detail (palette swatches, font sample, 3-tier decoration-level toggle that visibly filters the preview thumbnails, grouped cover/layout previews using the journal's own uploaded photos when available or a bundled flat-illustration SVG fallback otherwise — never external/licensed images) → Apply. Entry point: new "🎨 Theme" button (`Sidebar.jsx` desktop, `MobileEditorBar.jsx` "More" drawer mobile — closing the prior mobile gap where `ThemePanel` had no render path at all). `ThemePanel.jsx` (existing quick-apply panel) keeps working, plus a 👁 preview icon per card into the same modal.
- Fixed a real pre-existing bug in passing: `'grain'` texture was referenced by the Desert theme but `getTextureStyle()` had no case for it (silent no-op). Implemented it, plus added `'topo'` (concentric-ring contour approximation). Both are pure CSS, no new assets.

**Verified so far** (direct module-level testing in the running dev server — not yet a human click-through):
- Token resolution + decoration-level filtering: `resolveThemedElements` at `minimal` returns 3 elements for `bp-hero-photo`, `rich` returns 5, with correct literal colors and full provenance recorded.
- Restyle engine: an untouched field restyles correctly and updates its provenance to the new theme; a hand-edited field is correctly preserved and untouched; a target theme with no `tokens` correctly returns `{unsupported: true}` rather than restyling.
- **The specific durability guarantee that was the whole point of field-level provenance**: confirmed the comparison is against the stored `appliedValue`, never a fresh `THEMES` lookup — so a future edit to Backpacking's own palette cannot misclassify an already-themed element as manually customized.
- Dev server survives a full restart + hard reload cleanly, no console errors, on the actual current code (caught and fixed one real bug this way — a temporal-dead-zone ordering issue in `themes.js` that `npm run build` did *not* catch but the dev server's stricter module evaluation did; moral: always verify in the running app, not just via build).

**Not yet done**:
- A human hasn't clicked through the actual UI yet (Theme modal, grouped Layouts category, the two-choice restyle flow, decoration-level preview) — only the underlying logic has been verified directly. Do this before assuming it's fully working.
- Not yet redeployed to the published Firebase app — this shipped to git and localhost only. Deploy + hard-refresh-past-service-worker before it's live.
- The other 16 themes still don't have `tokens`/`covers`/`layouts` — only Backpacking does. Extending the pattern is explicitly a later pass, not part of this one.
- PDF export of themed content hasn't been explicitly re-verified (it should just work — `exportPdf.js` screenshots the live rendered Canvas via `html2canvas`, no separate code path — but "should" isn't "confirmed").

## A pattern to watch for: discoverability complaints
Multiple times this session, a UI control the user needed was technically present but easy to miss: the desktop "Layouts" button (missed once), the "Mood" tab in the theme gallery (missed twice), the mobile path to Apply Layout (a hint pointed at the wrong control for mobile). Take this seriously when placing any new control — prefer a standing, visible button over a tab/toggle buried in a panel, especially anything theme- or layout-related.

## GitHub
https://github.com/alesiamoore-netizen/travel-journal

## Firebase notes
- Firestore offline persistence enabled (multi-tab)
- Storage rules allow authenticated users to read/write their own files
- `public_notebooks` collection for shared journals
- `journals/{id}/presence/{uid}` for real-time presence
- No Firestore composite indexes are needed by the app currently (both queries that used to need one were rewritten to sort client-side instead) — don't add one to solve a "requires an index" error without first checking whether the deployed build is just stale
