# Asset provenance — christmas-ornaments.jpg

- **Original title**: "Christmas ornaments on tree"
- **Photographer**: Alisa Anton (alisaanton on Unsplash)
- **Wikimedia Commons page**: https://commons.wikimedia.org/wiki/File:Christmas_ornaments_on_tree_(Unsplash).jpg
- **Original file**: https://upload.wikimedia.org/wikipedia/commons/6/67/Christmas_ornaments_on_tree_%28Unsplash%29.jpg
- **Original Unsplash source**: https://unsplash.com/photos/tY3Lj9TYSak
- **License**: CC0 1.0 Universal (Public Domain Dedication) — explicitly stated on the Commons file page; no attribution legally required.
- **Description**: gold, silver, and white/copper ornaments, pinecones, silver jingle bells, and wooden star/tree cutouts nestled in evergreen branches; shot with a Canon EOS 5D Mark III, 47mm, f/4, ISO 125, photographed 2016-12-12.
- **Download date**: 2026-09-27
- **Original dimensions**: 5,760×3,840 (14.55 MB, JPEG)
- **Processing tool**: `sharp` (via `sharp-cli`)
- **Processing**: resized proportionally to **1200×800** — no crop needed, the source is already a 3:2 ratio matching the target exactly — compressed to JPEG **quality 68** (lower than other bundled theme photos, needed to hit the target size given this image's dense high-frequency detail from pine needles and ornament texture) — **218,613 bytes (~213.5 KB)**. No other edits.
- **Usage**: bundled locally in `public/theme-previews/` and served from the app's own origin — no runtime network request, no hotlinking. Used only as the Christmas theme's deterministic fallback preview photograph in `ThemeDetailModal.jsx` (cover previews, interior-page examples, layout thumbnails, and new-user preview behavior) when the journal being previewed has no suitable uploaded photo of its own; real journal photos always take priority when available. Never auto-inserted into any actual journal page — a real Christmas cover or photo element always starts as an intentional, empty user-photo placeholder until the user supplies their own photograph.
