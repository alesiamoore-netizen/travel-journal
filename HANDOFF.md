# Travel Journal — Session Handoff

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

## To run locally
```
npm install
npm run dev
```
Then open http://localhost:5173

## To deploy
```
npm run build
firebase deploy
```

## Features built (batches 1–4)
- Page editor with 12 element types: text, image, map, divider, sticker, keepsake, weather, collage, drawing, cover, shape (+ more)
- Firebase Firestore sync + offline support
- Photo upload with compression (1600px, 500KB), thumbnail generation
- PDF export (regular + print-ready with bleed/crop marks)
- Standalone HTML export (base64-inlined, self-contained)
- iCalendar (.ics) export
- Google Photos picker
- Shared public journals with optional PIN
- Collaborative editing (join by journal ID)
- Real-time presence (avatar dots on page thumbnails)
- Auto-save indicator (Saving…/Saved ✓)
- Location autocomplete (Open-Meteo geocoding)
- Drag-to-reorder pages
- Multi-stop itinerary map with geocoded stops
- Trip timeline/calendar view (/timeline route)
- Cover page designer (full-bleed photo + text overlay)
- Freehand drawing element (SVG, % coordinates)
- Multi-photo collage element
- Page quick-start prompts (Day/Restaurant/Hike/Transit templates)
- Journal stats modal (date range, cities, photos, word count)
- AI writing assist (Anthropic API, key stored in localStorage)
- 16 layout templates
- Page spread view
- Print preview mode
- Undo/redo
- Memories page (/memories)

## What's next (suggested)
1. Mobile editing — canvas + inspector on phone
2. Better dashboard thumbnails — pull cover/first image as notebook card
3. Page templates gallery — richer than the 4 quick-start prompts
4. Voice memo element
5. AI photo captioning

## GitHub
https://github.com/alesiamoore-netizen/travel-journal

## Firebase notes
- Firestore offline persistence enabled (multi-tab)
- Storage rules allow authenticated users to read/write their own files
- `public_notebooks` collection for shared journals
- `journals/{id}/presence/{uid}` for real-time presence
