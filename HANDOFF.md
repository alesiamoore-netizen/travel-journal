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

## Design decisions this session reversed — don't redo these
The user pushed back hard on two things; both are settled, don't re-litigate:
1. **Templates and layouts are the same concept.** "Templates are supped up layouts" — there is one "Layouts" button/picker, not a separate template gallery. A `PagePrompts.jsx` blank-page popup was built, then deleted entirely after user feedback that it re-introduced a redundant second concept.
2. **Picking a theme must only change colors/fonts/texture — nothing else.** An earlier version made picking a theme also change which page-layout suggestions appeared, which the user found surprising and unwanted ("I expect to apply a Christmas theme, not ask me about all, day, food, nature..."). Theme selection and layout/content selection must stay fully decoupled UI actions, even though (per the in-progress work below) a theme's *own* coordinated layouts are a planned exception — those are reached through the same single Layouts picker, not through the theme picker.

## In progress — journal theme system, phase 2 (NOT implemented yet, only planned)
The 17-theme system above is considered too shallow — it only recolors backgrounds/fonts, doesn't touch actual page content, stickers, or covers. The user (working from a detailed ChatGPT-authored spec) asked for a much more complete theme system, using **Backpacking** as the reference theme before extending the pattern to the other 16. Nothing below is built yet — this is the live plan, twice revised after detailed feedback, sitting in `C:\Users\ICrea\.claude\plans\delightful-skipping-ocean.md` on the machine this was written on (may not exist on a different machine — ask the user to re-paste their feedback if the plan file isn't available, or reconstruct from this section).

**Verified-in-code findings** (don't re-derive these, they're already confirmed):
- `theme.stickers` and `theme.templates` fields exist in `themes.js` but are **dead** — zero call sites for `theme.stickers` anywhere, and `getThemeStickerOrder()` (themes.js) is defined but never called.
- `theme.templates` (where it does nothing) only ever pointed at generic amber-colored layout ids — reconnecting it wouldn't give a real per-theme look, which is why the plan calls for genuinely new `theme.layouts`/`theme.covers` content instead.
- Page backgrounds/fonts are already 100% consistent across all pages (`Canvas.jsx` reads `notebook.theme` live every render) — the "inconsistent page" complaint is at the *element* level: `layouts.js` entries hardcode literal colors unrelated to any theme.
- `themeOverrides: {}` written onto every page doc is fully dead (written in 5 places, read in 0).
- Theme-switching UI (`ThemePanel.jsx`) only renders inside `Inspector.jsx`, which is itself gated `{!isMobile && <Inspector />}` in `Editor.jsx` — **there is currently no theme-switching UI on mobile at all.**
- A hypothesis (**unconfirmed** — lost the authenticated browser session before it could be verified empirically): a "gray Page 2" the user saw on a live Backpacking-themed journal is very likely `CoverElement.jsx`'s empty-state placeholder (`bg-stone-200`, full-page-sized, theme-unaware) on a Cover Block that never got a photo uploaded — not a background/font bug. Needs confirming with the user (does Page 2 show a "🌅 Click to add cover photo" prompt?) before treating it as solved.

**Architecture decided in the plan** (revise if the user pushes back further, but this is the current direction):
- Theme gets `covers: [...]` (3 entries) and `layouts: [...]` (10 entries, matching a specific named list: hero photo, photo+writing, 4-photo collage, route map+narrative, daily field-notes, timeline/itinerary, keepsake arrangement, text-focused entry, chapter divider, sunrise/sunset) — same `{id,name,icon,elements}` shape as everything in `layouts.js`, injected as an extra category into the existing Layouts picker only when that theme is active. One picker, not a parallel gallery.
- **Semantic design tokens**, not baked literal colors, so switching themes later can actually restyle theme-authored content: tokens like `heading`, `body`, `muted`, `accent`, `mapRoute`, `photoFrame`, etc., resolved to literal hex at apply-time (element renderers stay simple, unchanged, always receive literal values — only the apply-time step is new).
- **Provenance metadata** on theme-generated elements (`sourceThemeId`, `sourceTemplateId`, `themeManaged: true`, a `styleTokens` map) so a future "restyle to new theme" action can find theme-managed elements and safely skip ones the user has manually customized (heuristic: compare current value against what the *old* theme's token would have resolved to — if it still matches, it's safe to overwrite; if it differs, the user changed it, leave it alone).
- Three **genuinely different** decoration levels (minimal/standard/rich) were requested — the plan as it stands only has minimal (strips stickers/dividers) vs. standard=rich (identical). This was called out explicitly as not acceptable ("don't expose standard and rich if they behave identically") — needs either real 3-tier content or exposing only 2 honest levels. **Not resolved yet.**
- Rich, non-empty previews in a new theme detail view — real palette/font samples, cover/layout thumbnails re-colored with the *actual* theme's palette (not generic amber), no external stock photos or image-generation API (explicitly ruled out for this pass) — hand-authored SVG "representative" mockups instead, pulling from the journal's own uploaded photos when available.
- A new, clearly-visible "🎨 Theme" button (separate from "Layouts") on both desktop and mobile, since discoverability of tucked-away controls has been a repeated, explicit complaint this session (see below).

**Not yet resolved / still open** when this doc was written:
- The 3-tier decoration level content gap above.
- Confirming the gray-Page-2 hypothesis.
- Full backward-compat test matrix across existing journals with various/no themeId (asked for explicitly, not yet executed since implementation hasn't started).
- The reference implementation itself — none of the theme-phase-2 code exists yet, only the plan.

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
