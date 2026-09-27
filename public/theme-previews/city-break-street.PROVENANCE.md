# Asset provenance — city-break-street.jpg

- **Original title**: "Quaint City Streets"
- **Photographer**: Eduardo Arcos (@earcos on Unsplash)
- **Wikimedia Commons page**: https://commons.wikimedia.org/wiki/File:Quaint_City_Streets_(Unsplash).jpg
- **Original file**: https://upload.wikimedia.org/wikipedia/commons/4/46/Quaint_City_Streets_%28Unsplash%29.jpg
- **Original Unsplash source**: https://unsplash.com/photos/ZttxRsLAl7I
- **License**: CC0 1.0 Universal (Public Domain Dedication) — explicitly stated on the Commons file page; no attribution legally required.
- **Description**: a narrow cobblestone street with historic European architecture — lamp post, shopfronts, decorative pavement pattern — in Aveiro, Portugal; shot with a Sony Alpha 7 II (ILCE-7M2), 35mm, f/5, ISO 500, dated 2015-06-23.
- **Download date**: 2026-09-27
- **Original dimensions**: 3000×2000 (~3.09 MB, JPEG)
- **Processing**: resized to 1200×800 (exact 3:2 aspect match to the original — no cropping applied, full frame preserved) and compressed to JPEG quality 72 via `sharp` (through `sharp-cli`), ~184 KB. Quality was set lower than Backpacking/Road Trip's q78–82 because this photo's fine cobblestone/architectural detail compresses less efficiently at the same quality setting; 72 was chosen to land in the same ~150–200 KB target range. No other edits.
- **Usage**: bundled locally in `public/theme-previews/` and served from the app's own origin — no runtime network request, no hotlinking. Used only as the City Break theme's deterministic fallback preview photograph in `ThemeDetailModal.jsx` (cover previews, interior-page examples, layout thumbnails, and new-user preview behavior) when the journal being previewed has no suitable uploaded photo of its own; real journal photos always take priority when available. Never auto-inserted into any actual journal page — a real City Break cover or photo element always starts as an intentional, empty user-photo placeholder until the user supplies their own photograph.
