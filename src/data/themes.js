export const THEME_CATEGORIES = ['Occasion', 'Mood']

// `stickers`: curated subset of STICKER_LIST ids, shown first when this theme is active.
// `templates`: suggested page-template ids (from layouts.js TEMPLATE_CATEGORIES entries) — legacy,
// unused by the UI (kept for potential future use, not wired to anything currently).
//
// `tokens` (optional — only Backpacking has one in this pass): a theme's semantic color palette.
// `covers`/`layouts` (optional, Backpacking only): theme-coordinated content, same {id,name,icon,
// group,elements} shape as a layouts.js entry, but element `data` fields may reference a token by
// name with a `$` prefix (e.g. `'$heading'`) instead of a literal hex — resolved once, at apply
// time, by `resolveThemedElements()` below. Elements may also carry `minDecorationLevel:
// 'standard'|'rich'` (absent = always included at any level).
//
// `assets` (optional, reserved for a future art pass — nothing reads this yet):
//   { coverArtwork: [], backgroundTextures: [], mapOverlays: [], cornerDecorations: [],
//     stickerSetId: null, dividerSetId: null }

// ─── Backpacking content authoring ──────────────────────────────────────

function doc(text) {
  return { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text }] }] }
}

const H = 'Merriweather'
const B = 'Nunito'

function BACKPACKING_COVERS() {
  return [
    {
      id: 'cover-trailhead', name: 'Trailhead', icon: '🏕️', group: 'Covers',
      elements: [
        { type: 'cover', grid: { x: 0, y: 0, w: 12, h: 16 }, data: {
          title: '', subtitle: '', titleAlign: 'center', titleFont: `${H}, serif`,
          overlayColor: '#1a2e1a66', titleColor: '$paper', subtitleColor: '$paper',
        } },
        { type: 'sticker', grid: { x: 1, y: 1, w: 3, h: 3 }, data: { stickerId: 'compass', color: '$paper', rotation: -10, opacity: 0.9 } },
        { type: 'divider', grid: { x: 2, y: 13, w: 8, h: 1 }, data: { style: 'ornate', color: '$accentSecondary' }, minDecorationLevel: 'standard' },
        { type: 'sticker', grid: { x: 8, y: 2, w: 2, h: 2 }, data: { stickerId: 'arrow', color: '$paper', rotation: 20, opacity: 0.85 }, minDecorationLevel: 'rich' },
      ],
    },
    {
      id: 'cover-basecamp', name: 'Basecamp', icon: '⛺', group: 'Covers',
      elements: [
        { type: 'cover', grid: { x: 0, y: 0, w: 12, h: 16 }, data: {
          title: '', subtitle: '', titleAlign: 'left', titleFont: `${H}, serif`,
          overlayColor: '#2d4a3277', titleColor: '$paper', subtitleColor: '$paper',
        } },
        { type: 'divider', grid: { x: 0, y: 8, w: 12, h: 1 }, data: { style: 'wave', color: '$paper' }, minDecorationLevel: 'standard' },
        { type: 'sticker', grid: { x: 9, y: 1, w: 2, h: 2 }, data: { stickerId: 'pin', color: '$paper', rotation: 8, opacity: 0.9 }, minDecorationLevel: 'rich' },
      ],
    },
    {
      id: 'cover-summit', name: 'Summit', icon: '🏔️', group: 'Covers',
      elements: [
        { type: 'cover', grid: { x: 0, y: 0, w: 12, h: 16 }, data: {
          title: '', subtitle: '', titleAlign: 'center', titleFont: `${H}, serif`,
          overlayColor: '#1a2e1a55', titleColor: '$paper', subtitleColor: '$paper',
        } },
        { type: 'sticker', grid: { x: 5, y: 2, w: 2, h: 2 }, data: { stickerId: 'star', color: '$paper', rotation: 0, opacity: 0.9 }, minDecorationLevel: 'standard' },
        { type: 'divider', grid: { x: 2, y: 13, w: 8, h: 1 }, data: { style: 'ornate', color: '$accentSecondary' }, minDecorationLevel: 'rich' },
      ],
    },
  ]
}

function BACKPACKING_LAYOUTS() {
  return [
    // ─── PHOTO ───────────────────────────────────────────────
    {
      id: 'bp-hero-photo', name: 'Hero Photo', icon: '🏞️', group: 'Photo',
      elements: [
        { type: 'image', grid: { x: 0, y: 0, w: 12, h: 11 }, data: { fit: 'cover' } },
        { type: 'text', grid: { x: 0, y: 11, w: 12, h: 2 }, data: { textStyle: 'heading', content: doc('Trail Name'), fontFamily: H, fontSize: 28, color: '$heading' } },
        { type: 'text', grid: { x: 0, y: 13, w: 12, h: 1 }, data: { textStyle: 'dateline', content: doc('Location · Date'), fontFamily: B, fontSize: 11, color: '$accentSecondary' } },
        { type: 'sticker', grid: { x: 9, y: 0, w: 3, h: 3 }, data: { stickerId: 'compass', color: '$paper', rotation: -12, opacity: 0.9 }, minDecorationLevel: 'standard' },
        { type: 'divider', grid: { x: 1, y: 14, w: 10, h: 1 }, data: { style: 'line', color: '$border' }, minDecorationLevel: 'rich' },
      ],
    },
    {
      id: 'bp-four-collage', name: 'Trail Snapshots', icon: '🖼️', group: 'Photo',
      elements: [
        { type: 'text', grid: { x: 0, y: 0, w: 12, h: 2 }, data: { textStyle: 'heading', content: doc('Trail Snapshots'), fontFamily: H, fontSize: 26, color: '$heading' } },
        { type: 'collage', grid: { x: 0, y: 2, w: 12, h: 12 }, data: { columns: 2, gap: 6, borderRadius: 4 } },
        { type: 'text', grid: { x: 1, y: 14, w: 10, h: 2 }, data: { textStyle: 'caption', content: doc('A few moments from the day…'), fontFamily: B, fontSize: 10, color: '$muted' } },
      ],
    },
    {
      id: 'bp-sunrise-sunset', name: 'Sunrise / Sunset', icon: '🌄', group: 'Photo',
      elements: [
        { type: 'image', grid: { x: 0, y: 0, w: 12, h: 10 }, data: { fit: 'cover' } },
        { type: 'weather', grid: { x: 0, y: 10, w: 5, h: 4 }, data: {} },
        { type: 'text', grid: { x: 5, y: 10, w: 7, h: 4 }, data: { textStyle: 'body', content: doc('Colors in the sky, how it felt to watch…'), fontFamily: B, fontSize: 12, color: '$body' } },
        { type: 'sticker', grid: { x: 0, y: 8, w: 3, h: 3 }, data: { stickerId: 'sun', color: '$accentSecondary', rotation: -15, opacity: 0.85 }, minDecorationLevel: 'standard' },
        { type: 'divider', grid: { x: 0, y: 14, w: 12, h: 1 }, data: { style: 'wave', color: '$border' }, minDecorationLevel: 'rich' },
      ],
    },

    // ─── WRITING ─────────────────────────────────────────────
    {
      id: 'bp-photo-writing', name: 'Photo + Story', icon: '📓', group: 'Writing',
      elements: [
        { type: 'image', grid: { x: 0, y: 0, w: 6, h: 16 }, data: { fit: 'cover', rotation: -1 } },
        { type: 'text', grid: { x: 7, y: 0, w: 5, h: 2 }, data: { textStyle: 'heading', content: doc('Day on the Trail'), fontFamily: H, fontSize: 22, color: '$heading' } },
        { type: 'text', grid: { x: 7, y: 2, w: 5, h: 12 }, data: { textStyle: 'body', content: doc('What the trail looked like, how it felt, who we met…'), fontFamily: B, fontSize: 13, color: '$body' } },
        { type: 'sticker', grid: { x: 7, y: 14, w: 2, h: 2 }, data: { stickerId: 'arrow', color: '$accent', rotation: 15, opacity: 0.9 }, minDecorationLevel: 'standard' },
      ],
    },
    {
      id: 'bp-field-notes', name: 'Daily Field Notes', icon: '📝', group: 'Writing',
      elements: [
        { type: 'text', grid: { x: 0, y: 0, w: 12, h: 1 }, data: { textStyle: 'dateline', content: doc('Day 3 · Mile 24'), fontFamily: B, fontSize: 11, color: '$accentSecondary' } },
        { type: 'text', grid: { x: 0, y: 1, w: 12, h: 2 }, data: { textStyle: 'heading', content: doc('Field Notes'), fontFamily: H, fontSize: 26, color: '$heading' } },
        { type: 'divider', grid: { x: 0, y: 3, w: 12, h: 1 }, data: { style: 'dotted', color: '$border' }, minDecorationLevel: 'standard' },
        { type: 'text', grid: { x: 0, y: 4, w: 12, h: 12 }, data: { textStyle: 'body', content: doc('Weather, trail conditions, wildlife spotted…'), fontFamily: B, fontSize: 14, color: '$body' } },
      ],
    },
    {
      id: 'bp-text-focused', name: 'Trail Journal', icon: '✍️', group: 'Writing',
      elements: [
        { type: 'text', grid: { x: 1, y: 0, w: 10, h: 2 }, data: { textStyle: 'heading', content: doc('Trail Journal'), fontFamily: H, fontSize: 30, color: '$heading' } },
        { type: 'text', grid: { x: 1, y: 2, w: 10, h: 1 }, data: { textStyle: 'dateline', content: doc('Location · Date'), fontFamily: B, fontSize: 11, color: '$accentSecondary' } },
        { type: 'text', grid: { x: 1, y: 3, w: 10, h: 13 }, data: { textStyle: 'body', content: doc('Just write…'), fontFamily: B, fontSize: 15, color: '$body' } },
      ],
    },

    // ─── MAP & ITINERARY ─────────────────────────────────────
    {
      id: 'bp-route-map', name: 'The Route', icon: '🗺️', group: 'Map & Itinerary',
      elements: [
        { type: 'text', grid: { x: 0, y: 0, w: 12, h: 2 }, data: { textStyle: 'heading', content: doc('The Route'), fontFamily: H, fontSize: 26, color: '$heading' } },
        { type: 'map', grid: { x: 0, y: 2, w: 12, h: 8 }, data: { tileStyle: 'voyager', mode: 'route', showRoute: true, showPins: true, routeColor: '$mapRoute', pinColor: '$accentSecondary' } },
        { type: 'sticker', grid: { x: 9, y: 2, w: 3, h: 3 }, data: { stickerId: 'compass', color: '$paper', rotation: -8, opacity: 0.9 }, minDecorationLevel: 'standard' },
        { type: 'text', grid: { x: 0, y: 10, w: 12, h: 6 }, data: { textStyle: 'body', content: doc('Distance · Elevation gain · Terrain notes…'), fontFamily: B, fontSize: 13, color: '$body' } },
      ],
    },
    {
      id: 'bp-timeline', name: 'Trip Itinerary', icon: '🧭', group: 'Map & Itinerary',
      elements: [
        { type: 'text', grid: { x: 0, y: 0, w: 12, h: 2 }, data: { textStyle: 'heading', content: doc('Trip Itinerary'), fontFamily: H, fontSize: 26, color: '$heading' } },
        { type: 'text', grid: { x: 0, y: 2, w: 12, h: 1 }, data: { textStyle: 'dateline', content: doc('Day 1'), fontFamily: B, fontSize: 11, color: '$accentSecondary' } },
        { type: 'text', grid: { x: 1, y: 3, w: 11, h: 3 }, data: { textStyle: 'body', content: doc('Trailhead to first camp…'), fontFamily: B, fontSize: 12, color: '$body' } },
        { type: 'divider', grid: { x: 0, y: 6, w: 12, h: 1 }, data: { style: 'line', color: '$border' }, minDecorationLevel: 'standard' },
        { type: 'text', grid: { x: 0, y: 7, w: 12, h: 1 }, data: { textStyle: 'dateline', content: doc('Day 2'), fontFamily: B, fontSize: 11, color: '$accentSecondary' } },
        { type: 'text', grid: { x: 1, y: 8, w: 11, h: 3 }, data: { textStyle: 'body', content: doc('The long ridge climb…'), fontFamily: B, fontSize: 12, color: '$body' } },
        { type: 'divider', grid: { x: 0, y: 11, w: 12, h: 1 }, data: { style: 'line', color: '$border' }, minDecorationLevel: 'standard' },
        { type: 'text', grid: { x: 0, y: 12, w: 12, h: 1 }, data: { textStyle: 'dateline', content: doc('Day 3'), fontFamily: B, fontSize: 11, color: '$accentSecondary' } },
        { type: 'text', grid: { x: 1, y: 13, w: 11, h: 3 }, data: { textStyle: 'body', content: doc('Down to the trailhead…'), fontFamily: B, fontSize: 12, color: '$body' } },
      ],
    },

    // ─── KEEPSAKE ────────────────────────────────────────────
    {
      id: 'bp-keepsake', name: 'Trail Mementos', icon: '🎫', group: 'Keepsake',
      elements: [
        { type: 'text', grid: { x: 0, y: 0, w: 12, h: 2 }, data: { textStyle: 'heading', content: doc('Trail Mementos'), fontFamily: H, fontSize: 26, color: '$heading' } },
        { type: 'keepsake', grid: { x: 0, y: 2, w: 6, h: 6 }, data: { label: 'Trail map / permit', hint: 'Tape or glue here', style: 'dashed', borderColor: '$keepsakeBorder' } },
        { type: 'keepsake', grid: { x: 6, y: 2, w: 6, h: 6 }, data: { label: 'Ticket / pass', hint: 'Tape or glue here', style: 'pocket', borderColor: '$keepsakeBorder' } },
        { type: 'text', grid: { x: 0, y: 8, w: 12, h: 7 }, data: { textStyle: 'body', content: doc('Stories behind the stuff…'), fontFamily: B, fontSize: 13, color: '$body' } },
        { type: 'sticker', grid: { x: 5, y: 1, w: 4, h: 2 }, data: { stickerId: 'tape', color: '$accentSecondary', rotation: -3, opacity: 0.9 }, minDecorationLevel: 'rich' },
      ],
    },

    // ─── OPENING & DIVIDERS ──────────────────────────────────
    {
      id: 'bp-chapter-divider', name: 'Chapter Divider', icon: '🪵', group: 'Opening & Dividers',
      elements: [
        { type: 'divider', grid: { x: 2, y: 5, w: 8, h: 1 }, data: { style: 'ornate', color: '$accent' }, minDecorationLevel: 'standard' },
        { type: 'text', grid: { x: 1, y: 6, w: 10, h: 4 }, data: { textStyle: 'heading', content: doc('Chapter Name'), fontFamily: H, fontSize: 36, color: '$heading' } },
        { type: 'text', grid: { x: 2, y: 10, w: 8, h: 2 }, data: { textStyle: 'dateline', content: doc('Location · Date'), fontFamily: B, fontSize: 11, color: '$accentSecondary' } },
        { type: 'divider', grid: { x: 2, y: 12, w: 8, h: 1 }, data: { style: 'ornate', color: '$accent' }, minDecorationLevel: 'standard' },
        { type: 'sticker', grid: { x: 5, y: 2, w: 2, h: 2 }, data: { stickerId: 'compass', color: '$accent', rotation: 0, opacity: 0.85 }, minDecorationLevel: 'rich' },
      ],
    },
  ]
}

// ─── Road Trip content authoring ────────────────────────────────────────

// Photo treatment / `$photoFrame` token: ImageElement's own `borderStyle` field has no color
// parameter (its 5 variants are hardcoded white/black), and CollageElement has no color-facing
// field at all — neither is a compatible primitive for a token-driven border/frame color, and
// per the architecture no new renderer field is invented to force one. `captionColor` is the
// one real, already-supported, literal-hex-driven field ImageElement has, so `$photoFrame` is
// applied there (with `captionStyle: 'overlay'`, rendered directly on the photo) on the image
// elements below — a genuine, restyle-compatible, theme-managed photo-adjacent color, using an
// existing primitive rather than a border color that doesn't exist yet.

const RH = 'Montserrat'
const RB = 'Nunito'

function ROAD_TRIP_COVERS() {
  return [
    {
      id: 'rt-cover-open-road', name: 'Open Road', icon: '🛣️', group: 'Covers',
      elements: [
        { type: 'cover', grid: { x: 0, y: 0, w: 12, h: 16 }, data: {
          title: '', subtitle: '', titleAlign: 'center', titleFont: `${RH}, sans-serif`,
          overlayColor: '#1e3a5f66', titleColor: '$paper', subtitleColor: '$paper',
        } },
        { type: 'divider', grid: { x: 2, y: 13, w: 8, h: 1 }, data: { style: 'thick', color: '$accentSecondary' }, minDecorationLevel: 'standard' },
        { type: 'sticker', grid: { x: 8, y: 1, w: 3, h: 3 }, data: { stickerId: 'arrow', color: '$paper', rotation: 30, opacity: 0.9 }, minDecorationLevel: 'rich' },
      ],
    },
    {
      id: 'rt-cover-mile-zero', name: 'Mile Zero', icon: '📍', group: 'Covers',
      elements: [
        { type: 'cover', grid: { x: 0, y: 0, w: 12, h: 16 }, data: {
          title: '', subtitle: '', titleAlign: 'left', titleFont: `${RH}, sans-serif`,
          overlayColor: '#33302a70', titleColor: '$paper', subtitleColor: '$paper',
        } },
        { type: 'divider', grid: { x: 0, y: 8, w: 12, h: 1 }, data: { style: 'dotted', color: '$paper' }, minDecorationLevel: 'standard' },
        { type: 'sticker', grid: { x: 9, y: 1, w: 2, h: 2 }, data: { stickerId: 'mileage', color: '$paper', rotation: 0, opacity: 0.9 }, minDecorationLevel: 'rich' },
      ],
    },
    {
      id: 'rt-cover-state-line', name: 'State Line', icon: '🚧', group: 'Covers',
      elements: [
        { type: 'cover', grid: { x: 0, y: 0, w: 12, h: 16 }, data: {
          title: '', subtitle: '', titleAlign: 'center', titleFont: `${RH}, sans-serif`,
          overlayColor: '#1e5f4560', titleColor: '$paper', subtitleColor: '$paper',
        } },
        { type: 'sticker', grid: { x: 5, y: 2, w: 2, h: 2 }, data: { stickerId: 'roadsign', color: '$paper', rotation: 0, opacity: 0.95 }, minDecorationLevel: 'standard' },
        { type: 'divider', grid: { x: 2, y: 13, w: 8, h: 1 }, data: { style: 'thick', color: '$accentSecondary' }, minDecorationLevel: 'rich' },
      ],
    },
  ]
}

function ROAD_TRIP_LAYOUTS() {
  return [
    // ─── PHOTO ───────────────────────────────────────────────
    {
      id: 'rt-hero-road', name: 'Hero Road Photograph', icon: '🛣️', group: 'Photo',
      elements: [
        { type: 'image', grid: { x: 0, y: 0, w: 12, h: 11 }, data: { fit: 'cover', caption: 'Somewhere along the highway', captionStyle: 'overlay', captionColor: '$photoFrame' } },
        { type: 'text', grid: { x: 0, y: 11, w: 12, h: 2 }, data: { textStyle: 'heading', content: doc('The Open Road'), fontFamily: RH, fontSize: 28, color: '$heading' } },
        { type: 'text', grid: { x: 0, y: 13, w: 12, h: 1 }, data: { textStyle: 'dateline', content: doc('Route · Date'), fontFamily: RB, fontSize: 11, color: '$accentSecondary' } },
        { type: 'sticker', grid: { x: 9, y: 0, w: 3, h: 3 }, data: { stickerId: 'arrow', color: '$paper', rotation: 25, opacity: 0.9 }, minDecorationLevel: 'standard' },
        { type: 'divider', grid: { x: 1, y: 14, w: 10, h: 1 }, data: { style: 'dotted', color: '$border' }, minDecorationLevel: 'rich' },
      ],
    },
    {
      id: 'rt-roadside-attraction', name: 'Roadside Attraction', icon: '🎡', group: 'Photo',
      elements: [
        { type: 'image', grid: { x: 0, y: 0, w: 12, h: 9 }, data: { fit: 'cover', caption: 'Worth the detour', captionStyle: 'overlay', captionColor: '$photoFrame' } },
        { type: 'text', grid: { x: 0, y: 9, w: 12, h: 2 }, data: { textStyle: 'heading', content: doc("World's Biggest…"), fontFamily: RH, fontSize: 24, color: '$heading' } },
        { type: 'text', grid: { x: 0, y: 11, w: 12, h: 5 }, data: { textStyle: 'body', content: doc('Why we stopped, what it was like…'), fontFamily: RB, fontSize: 13, color: '$body' } },
        { type: 'sticker', grid: { x: 0, y: 7, w: 3, h: 3 }, data: { stickerId: 'roadsign', color: '$accentSecondary', rotation: -10, opacity: 0.9 }, minDecorationLevel: 'standard' },
        { type: 'divider', grid: { x: 0, y: 14, w: 12, h: 1 }, data: { style: 'dotted', color: '$border' }, minDecorationLevel: 'rich' },
      ],
    },
    {
      id: 'rt-four-collage', name: 'Four-Photo Collage', icon: '🖼️', group: 'Photo',
      elements: [
        { type: 'text', grid: { x: 0, y: 0, w: 12, h: 2 }, data: { textStyle: 'heading', content: doc('Along the Way'), fontFamily: RH, fontSize: 26, color: '$heading' } },
        { type: 'collage', grid: { x: 0, y: 2, w: 12, h: 12 }, data: { columns: 2, gap: 6, borderRadius: 4 } },
        { type: 'text', grid: { x: 1, y: 14, w: 10, h: 2 }, data: { textStyle: 'caption', content: doc('A few snapshots from the road…'), fontFamily: RB, fontSize: 10, color: '$muted' } },
      ],
    },

    // ─── WRITING ─────────────────────────────────────────────
    {
      id: 'rt-photo-writing', name: 'Photo + Story', icon: '📓', group: 'Writing',
      elements: [
        { type: 'image', grid: { x: 0, y: 0, w: 6, h: 16 }, data: { fit: 'cover', rotation: -1, caption: 'Mile after mile', captionStyle: 'overlay', captionColor: '$photoFrame' } },
        { type: 'text', grid: { x: 7, y: 0, w: 5, h: 2 }, data: { textStyle: 'heading', content: doc('On the Road'), fontFamily: RH, fontSize: 22, color: '$heading' } },
        { type: 'text', grid: { x: 7, y: 2, w: 5, h: 12 }, data: { textStyle: 'body', content: doc('What the highway looked like, who we talked to, where we stopped…'), fontFamily: RB, fontSize: 13, color: '$body' } },
        { type: 'sticker', grid: { x: 7, y: 14, w: 2, h: 2 }, data: { stickerId: 'arrow', color: '$accent', rotation: 15, opacity: 0.9 }, minDecorationLevel: 'standard' },
      ],
    },
    {
      id: 'rt-driving-log', name: 'Daily Driving Log', icon: '📒', group: 'Writing',
      elements: [
        { type: 'text', grid: { x: 0, y: 0, w: 12, h: 1 }, data: { textStyle: 'dateline', content: doc('Day 3 · 214 miles'), fontFamily: RB, fontSize: 11, color: '$accentSecondary' } },
        { type: 'text', grid: { x: 0, y: 1, w: 12, h: 2 }, data: { textStyle: 'heading', content: doc('Driving Log'), fontFamily: RH, fontSize: 26, color: '$heading' } },
        { type: 'divider', grid: { x: 0, y: 3, w: 12, h: 1 }, data: { style: 'dotted', color: '$border' }, minDecorationLevel: 'standard' },
        { type: 'text', grid: { x: 0, y: 4, w: 12, h: 12 }, data: { textStyle: 'body', content: doc('Roads taken, weather, playlist, what we saw out the window…'), fontFamily: RB, fontSize: 14, color: '$body' } },
      ],
    },
    {
      id: 'rt-stops-highlights', name: 'Stops & Highlights', icon: '📍', group: 'Writing',
      elements: [
        { type: 'text', grid: { x: 0, y: 0, w: 12, h: 2 }, data: { textStyle: 'heading', content: doc('Stops & Highlights'), fontFamily: RH, fontSize: 26, color: '$heading' } },
        { type: 'text', grid: { x: 0, y: 2, w: 12, h: 1 }, data: { textStyle: 'dateline', content: doc('Stop 1'), fontFamily: RB, fontSize: 11, color: '$accentSecondary' } },
        { type: 'text', grid: { x: 1, y: 3, w: 11, h: 3 }, data: { textStyle: 'body', content: doc('The first gas-station donut of the trip…'), fontFamily: RB, fontSize: 12, color: '$body' } },
        { type: 'divider', grid: { x: 0, y: 6, w: 12, h: 1 }, data: { style: 'line', color: '$border' }, minDecorationLevel: 'standard' },
        { type: 'text', grid: { x: 0, y: 7, w: 12, h: 1 }, data: { textStyle: 'dateline', content: doc('Stop 2'), fontFamily: RB, fontSize: 11, color: '$accentSecondary' } },
        { type: 'text', grid: { x: 1, y: 8, w: 11, h: 3 }, data: { textStyle: 'body', content: doc('A scenic overlook worth the detour…'), fontFamily: RB, fontSize: 12, color: '$body' } },
        { type: 'divider', grid: { x: 0, y: 11, w: 12, h: 1 }, data: { style: 'line', color: '$border' }, minDecorationLevel: 'standard' },
        { type: 'text', grid: { x: 0, y: 12, w: 12, h: 1 }, data: { textStyle: 'dateline', content: doc('Stop 3'), fontFamily: RB, fontSize: 11, color: '$accentSecondary' } },
        { type: 'text', grid: { x: 1, y: 13, w: 11, h: 3 }, data: { textStyle: 'body', content: doc('Where we finally stopped for the night…'), fontFamily: RB, fontSize: 12, color: '$body' } },
      ],
    },

    // ─── MAP & ITINERARY ─────────────────────────────────────
    {
      id: 'rt-route-map', name: 'The Route', icon: '🗺️', group: 'Map & Itinerary',
      elements: [
        { type: 'text', grid: { x: 0, y: 0, w: 12, h: 2 }, data: { textStyle: 'heading', content: doc('The Route'), fontFamily: RH, fontSize: 26, color: '$heading' } },
        { type: 'map', grid: { x: 0, y: 2, w: 12, h: 8 }, data: { tileStyle: 'voyager', mode: 'route', showRoute: true, showPins: true, routeColor: '$mapRoute', pinColor: '$accentSecondary' } },
        { type: 'sticker', grid: { x: 9, y: 2, w: 3, h: 3 }, data: { stickerId: 'roadsign', color: '$paper', rotation: -8, opacity: 0.9 }, minDecorationLevel: 'standard' },
        { type: 'text', grid: { x: 0, y: 10, w: 12, h: 6 }, data: { textStyle: 'body', content: doc('Miles driven · States crossed · Road trip notes…'), fontFamily: RB, fontSize: 13, color: '$body' } },
      ],
    },
    {
      id: 'rt-itinerary', name: 'Road Trip Itinerary', icon: '🧭', group: 'Map & Itinerary',
      elements: [
        { type: 'text', grid: { x: 0, y: 0, w: 12, h: 2 }, data: { textStyle: 'heading', content: doc('Road Trip Itinerary'), fontFamily: RH, fontSize: 26, color: '$heading' } },
        { type: 'text', grid: { x: 0, y: 2, w: 12, h: 1 }, data: { textStyle: 'dateline', content: doc('Day 1'), fontFamily: RB, fontSize: 11, color: '$accentSecondary' } },
        { type: 'text', grid: { x: 1, y: 3, w: 11, h: 3 }, data: { textStyle: 'body', content: doc('Home to the first overnight stop…'), fontFamily: RB, fontSize: 12, color: '$body' } },
        { type: 'divider', grid: { x: 0, y: 6, w: 12, h: 1 }, data: { style: 'line', color: '$border' }, minDecorationLevel: 'standard' },
        { type: 'text', grid: { x: 0, y: 7, w: 12, h: 1 }, data: { textStyle: 'dateline', content: doc('Day 2'), fontFamily: RB, fontSize: 11, color: '$accentSecondary' } },
        { type: 'text', grid: { x: 1, y: 8, w: 11, h: 3 }, data: { textStyle: 'body', content: doc('Crossing the state line, the long middle stretch…'), fontFamily: RB, fontSize: 12, color: '$body' } },
        { type: 'divider', grid: { x: 0, y: 11, w: 12, h: 1 }, data: { style: 'line', color: '$border' }, minDecorationLevel: 'standard' },
        { type: 'text', grid: { x: 0, y: 12, w: 12, h: 1 }, data: { textStyle: 'dateline', content: doc('Day 3'), fontFamily: RB, fontSize: 11, color: '$accentSecondary' } },
        { type: 'text', grid: { x: 1, y: 13, w: 11, h: 3 }, data: { textStyle: 'body', content: doc('The final push to the destination…'), fontFamily: RB, fontSize: 12, color: '$body' } },
      ],
    },

    // ─── KEEPSAKE ────────────────────────────────────────────
    {
      id: 'rt-keepsake-postcard', name: 'Postcards & Keepsakes', icon: '🎫', group: 'Keepsake',
      elements: [
        { type: 'text', grid: { x: 0, y: 0, w: 12, h: 2 }, data: { textStyle: 'heading', content: doc('Postcards & Keepsakes'), fontFamily: RH, fontSize: 26, color: '$heading' } },
        { type: 'keepsake', grid: { x: 0, y: 2, w: 6, h: 6 }, data: { label: 'Postcard', hint: 'Tape or glue here', style: 'pocket', borderColor: '$keepsakeBorder' } },
        { type: 'keepsake', grid: { x: 6, y: 2, w: 6, h: 6 }, data: { label: 'Gas receipt / ticket stub', hint: 'Tape or glue here', style: 'dashed', borderColor: '$keepsakeBorder' } },
        { type: 'text', grid: { x: 0, y: 8, w: 12, h: 7 }, data: { textStyle: 'body', content: doc('Stories behind the souvenirs…'), fontFamily: RB, fontSize: 13, color: '$body' } },
        { type: 'sticker', grid: { x: 5, y: 1, w: 4, h: 2 }, data: { stickerId: 'mileage', color: '$accentSecondary', rotation: -3, opacity: 0.9 }, minDecorationLevel: 'rich' },
      ],
    },

    // ─── OPENING & DIVIDERS ──────────────────────────────────
    {
      id: 'rt-trip-opening', name: 'Trip-Opening Spread', icon: '🚗', group: 'Opening & Dividers',
      elements: [
        { type: 'divider', grid: { x: 2, y: 5, w: 8, h: 1 }, data: { style: 'thick', color: '$accent' }, minDecorationLevel: 'standard' },
        { type: 'text', grid: { x: 1, y: 6, w: 10, h: 4 }, data: { textStyle: 'heading', content: doc('The Road Trip Begins'), fontFamily: RH, fontSize: 34, color: '$heading' } },
        { type: 'text', grid: { x: 2, y: 10, w: 8, h: 2 }, data: { textStyle: 'dateline', content: doc('Route · Dates'), fontFamily: RB, fontSize: 11, color: '$accentSecondary' } },
        { type: 'divider', grid: { x: 2, y: 12, w: 8, h: 1 }, data: { style: 'thick', color: '$accent' }, minDecorationLevel: 'standard' },
        { type: 'sticker', grid: { x: 5, y: 2, w: 2, h: 2 }, data: { stickerId: 'roadsign', color: '$accent', rotation: 0, opacity: 0.85 }, minDecorationLevel: 'rich' },
      ],
    },
    {
      id: 'rt-state-divider', name: 'State / Chapter Divider', icon: '🚦', group: 'Opening & Dividers',
      elements: [
        { type: 'text', grid: { x: 1, y: 5, w: 10, h: 4 }, data: { textStyle: 'heading', content: doc('State Name'), fontFamily: RH, fontSize: 40, color: '$heading' } },
        { type: 'divider', grid: { x: 2, y: 9, w: 8, h: 1 }, data: { style: 'thick', color: '$accentSecondary' } },
        { type: 'text', grid: { x: 2, y: 10, w: 8, h: 2 }, data: { textStyle: 'dateline', content: doc('Entering · Mile marker'), fontFamily: RB, fontSize: 11, color: '$muted' } },
        { type: 'sticker', grid: { x: 5, y: 1, w: 2, h: 2 }, data: { stickerId: 'roadsign', color: '$accent', rotation: 0, opacity: 0.9 }, minDecorationLevel: 'rich' },
      ],
    },
    {
      id: 'rt-trip-closing', name: 'Miles Traveled', icon: '🏁', group: 'Opening & Dividers',
      elements: [
        { type: 'text', grid: { x: 0, y: 1, w: 12, h: 2 }, data: { textStyle: 'heading', content: doc('Miles Traveled'), fontFamily: RH, fontSize: 30, color: '$heading' } },
        { type: 'text', grid: { x: 0, y: 3, w: 12, h: 3 }, data: { textStyle: 'body', content: doc('1,842 miles · 6 states · 9 days'), fontFamily: RB, fontSize: 18, color: '$accentSecondary' } },
        { type: 'divider', grid: { x: 2, y: 7, w: 8, h: 1 }, data: { style: 'thick', color: '$accent' }, minDecorationLevel: 'standard' },
        { type: 'text', grid: { x: 1, y: 8, w: 10, h: 6 }, data: { textStyle: 'body', content: doc('What we’ll remember most about this trip…'), fontFamily: RB, fontSize: 14, color: '$body' } },
        { type: 'sticker', grid: { x: 5, y: 14, w: 2, h: 2 }, data: { stickerId: 'star', color: '$accentSecondary', rotation: 0, opacity: 0.9 }, minDecorationLevel: 'rich' },
      ],
    },
  ]
}

// ─── City Break content authoring ───────────────────────────────────────

// Photo treatment / `$photoFrame` token: same closed gap as Road Trip — ImageElement's
// `borderStyle` has no color parameter and CollageElement has no color-facing field at all, so
// `captionColor` (the one real, already-supported literal-hex field) is themed via `$photoFrame`
// on 3 authored image layouts below, with `captionStyle: 'overlay'`. No new renderer field.

const CH = 'Montserrat'
const CB = 'Montserrat'

function CITY_BREAK_COVERS() {
  return [
    {
      id: 'cb-cover-skyline', name: 'Skyline', icon: '🏙️', group: 'Covers',
      elements: [
        { type: 'cover', grid: { x: 0, y: 0, w: 12, h: 16 }, data: {
          title: '', subtitle: '', titleAlign: 'center', titleFont: `${CH}, sans-serif`,
          overlayColor: '#1e3a5f70', titleColor: '$paper', subtitleColor: '$paper',
        } },
        { type: 'divider', grid: { x: 2, y: 13, w: 8, h: 1 }, data: { style: 'thick', color: '$accentSecondary' }, minDecorationLevel: 'standard' },
        { type: 'sticker', grid: { x: 8, y: 1, w: 3, h: 3 }, data: { stickerId: 'skyline', color: '$paper', rotation: 0, opacity: 0.9 }, minDecorationLevel: 'rich' },
      ],
    },
    {
      id: 'cb-cover-street-grid', name: 'Street Grid', icon: '🗺️', group: 'Covers',
      elements: [
        { type: 'cover', grid: { x: 0, y: 0, w: 12, h: 16 }, data: {
          title: '', subtitle: '', titleAlign: 'left', titleFont: `${CH}, sans-serif`,
          overlayColor: '#2b2b2b6b', titleColor: '$paper', subtitleColor: '$paper',
        } },
        { type: 'divider', grid: { x: 0, y: 8, w: 12, h: 1 }, data: { style: 'dotted', color: '$paper' }, minDecorationLevel: 'standard' },
        { type: 'sticker', grid: { x: 9, y: 1, w: 2, h: 2 }, data: { stickerId: 'taxi', color: '$paper', rotation: 0, opacity: 0.9 }, minDecorationLevel: 'rich' },
      ],
    },
    {
      id: 'cb-cover-city-lights', name: 'City Lights', icon: '🌃', group: 'Covers',
      elements: [
        { type: 'cover', grid: { x: 0, y: 0, w: 12, h: 16 }, data: {
          title: '', subtitle: '', titleAlign: 'center', titleFont: `${CH}, sans-serif`,
          overlayColor: '#1e2a3875', titleColor: '$paper', subtitleColor: '$paper',
        } },
        { type: 'sticker', grid: { x: 5, y: 2, w: 2, h: 2 }, data: { stickerId: 'skyline', color: '$accentSecondary', rotation: 0, opacity: 0.95 }, minDecorationLevel: 'standard' },
        { type: 'divider', grid: { x: 2, y: 13, w: 8, h: 1 }, data: { style: 'thick', color: '$accentSecondary' }, minDecorationLevel: 'rich' },
      ],
    },
  ]
}

function CITY_BREAK_LAYOUTS() {
  return [
    // ─── PHOTO ───────────────────────────────────────────────
    {
      id: 'cb-hero-architecture', name: 'Hero Architecture Photograph', icon: '🏛️', group: 'Photo',
      elements: [
        { type: 'image', grid: { x: 0, y: 0, w: 12, h: 11 }, data: { fit: 'cover', caption: 'Looking up', captionStyle: 'overlay', captionColor: '$photoFrame' } },
        { type: 'text', grid: { x: 0, y: 11, w: 12, h: 2 }, data: { textStyle: 'heading', content: doc('The Architecture'), fontFamily: CH, fontSize: 28, color: '$heading' } },
        { type: 'text', grid: { x: 0, y: 13, w: 12, h: 1 }, data: { textStyle: 'dateline', content: doc('Neighborhood · Date'), fontFamily: CB, fontSize: 11, color: '$accentSecondary' } },
        { type: 'sticker', grid: { x: 9, y: 0, w: 3, h: 3 }, data: { stickerId: 'skyline', color: '$paper', rotation: 0, opacity: 0.9 }, minDecorationLevel: 'standard' },
        { type: 'divider', grid: { x: 1, y: 14, w: 10, h: 1 }, data: { style: 'line', color: '$border' }, minDecorationLevel: 'rich' },
      ],
    },
    {
      id: 'cb-streets-collage', name: 'Streets & Architectural Details', icon: '🖼️', group: 'Photo',
      elements: [
        { type: 'text', grid: { x: 0, y: 0, w: 12, h: 2 }, data: { textStyle: 'heading', content: doc('Streets & Details'), fontFamily: CH, fontSize: 26, color: '$heading' } },
        { type: 'collage', grid: { x: 0, y: 2, w: 12, h: 12 }, data: { columns: 2, gap: 6, borderRadius: 2 } },
        { type: 'text', grid: { x: 1, y: 14, w: 10, h: 2 }, data: { textStyle: 'caption', content: doc('Doorways, signs, and everything in between…'), fontFamily: CB, fontSize: 10, color: '$muted' } },
      ],
    },
    {
      id: 'cb-cafe', name: 'Café & Food', icon: '☕', group: 'Photo',
      elements: [
        { type: 'image', grid: { x: 0, y: 0, w: 12, h: 9 }, data: { fit: 'cover', caption: 'Table for one', captionStyle: 'overlay', captionColor: '$photoFrame' } },
        { type: 'text', grid: { x: 0, y: 9, w: 12, h: 2 }, data: { textStyle: 'heading', content: doc('Café Notes'), fontFamily: CH, fontSize: 24, color: '$heading' } },
        { type: 'text', grid: { x: 0, y: 11, w: 12, h: 5 }, data: { textStyle: 'body', content: doc('What we ordered, what it cost, whether we’d go back…'), fontFamily: CB, fontSize: 13, color: '$body' } },
        { type: 'sticker', grid: { x: 0, y: 7, w: 3, h: 3 }, data: { stickerId: 'ticket', color: '$accentSecondary', rotation: -8, opacity: 0.9 }, minDecorationLevel: 'standard' },
        { type: 'divider', grid: { x: 0, y: 14, w: 12, h: 1 }, data: { style: 'line', color: '$border' }, minDecorationLevel: 'rich' },
      ],
    },
    {
      id: 'cb-night-city', name: 'Night in the City', icon: '🌃', group: 'Photo',
      elements: [
        { type: 'image', grid: { x: 0, y: 0, w: 12, h: 10 }, data: { fit: 'cover' } },
        { type: 'text', grid: { x: 0, y: 10, w: 12, h: 2 }, data: { textStyle: 'heading', content: doc('After Dark'), fontFamily: CH, fontSize: 26, color: '$heading' } },
        { type: 'text', grid: { x: 0, y: 12, w: 12, h: 4 }, data: { textStyle: 'body', content: doc('The city at night — lights, sounds, where we ended up…'), fontFamily: CB, fontSize: 13, color: '$body' } },
        { type: 'sticker', grid: { x: 0, y: 8, w: 3, h: 3 }, data: { stickerId: 'skyline', color: '$accentSecondary', rotation: 0, opacity: 0.9 }, minDecorationLevel: 'standard' },
        { type: 'divider', grid: { x: 0, y: 14, w: 12, h: 1 }, data: { style: 'dotted', color: '$border' }, minDecorationLevel: 'rich' },
      ],
    },

    // ─── WRITING ─────────────────────────────────────────────
    {
      id: 'cb-photo-writing', name: 'Photo + Story', icon: '📓', group: 'Writing',
      elements: [
        { type: 'image', grid: { x: 0, y: 0, w: 6, h: 16 }, data: { fit: 'cover', rotation: -1, caption: 'A city block', captionStyle: 'overlay', captionColor: '$photoFrame' } },
        { type: 'text', grid: { x: 7, y: 0, w: 5, h: 2 }, data: { textStyle: 'heading', content: doc('City Notes'), fontFamily: CH, fontSize: 22, color: '$heading' } },
        { type: 'text', grid: { x: 7, y: 2, w: 5, h: 12 }, data: { textStyle: 'body', content: doc('What the streets felt like, who we met, what we noticed…'), fontFamily: CB, fontSize: 13, color: '$body' } },
        { type: 'sticker', grid: { x: 7, y: 14, w: 2, h: 2 }, data: { stickerId: 'camera', color: '$accent', rotation: 10, opacity: 0.9 }, minDecorationLevel: 'standard' },
      ],
    },

    // ─── MAP & ITINERARY ─────────────────────────────────────
    {
      id: 'cb-neighborhood-map', name: 'Neighborhood Map', icon: '🗺️', group: 'Map & Itinerary',
      elements: [
        { type: 'text', grid: { x: 0, y: 0, w: 12, h: 2 }, data: { textStyle: 'heading', content: doc('The Neighborhood'), fontFamily: CH, fontSize: 26, color: '$heading' } },
        { type: 'map', grid: { x: 0, y: 2, w: 12, h: 8 }, data: { tileStyle: 'minimal', mode: 'pin', showPins: true, pinColor: '$accentSecondary' } },
        { type: 'sticker', grid: { x: 9, y: 2, w: 3, h: 3 }, data: { stickerId: 'pin', color: '$paper', rotation: 0, opacity: 0.9 }, minDecorationLevel: 'standard' },
        { type: 'text', grid: { x: 0, y: 10, w: 12, h: 6 }, data: { textStyle: 'body', content: doc('The blocks we walked, the corners we kept returning to…'), fontFamily: CB, fontSize: 13, color: '$body' } },
      ],
    },
    {
      id: 'cb-itinerary', name: 'Day-by-Day Itinerary', icon: '🧭', group: 'Map & Itinerary',
      elements: [
        { type: 'text', grid: { x: 0, y: 0, w: 12, h: 2 }, data: { textStyle: 'heading', content: doc('City Itinerary'), fontFamily: CH, fontSize: 26, color: '$heading' } },
        { type: 'text', grid: { x: 0, y: 2, w: 12, h: 1 }, data: { textStyle: 'dateline', content: doc('Day 1'), fontFamily: CB, fontSize: 11, color: '$accentSecondary' } },
        { type: 'text', grid: { x: 1, y: 3, w: 11, h: 3 }, data: { textStyle: 'body', content: doc('Arrival, first impressions, an easy walk…'), fontFamily: CB, fontSize: 12, color: '$body' } },
        { type: 'divider', grid: { x: 0, y: 6, w: 12, h: 1 }, data: { style: 'line', color: '$border' }, minDecorationLevel: 'standard' },
        { type: 'text', grid: { x: 0, y: 7, w: 12, h: 1 }, data: { textStyle: 'dateline', content: doc('Day 2'), fontFamily: CB, fontSize: 11, color: '$accentSecondary' } },
        { type: 'text', grid: { x: 1, y: 8, w: 11, h: 3 }, data: { textStyle: 'body', content: doc('Museums, markets, the neighborhood everyone recommended…'), fontFamily: CB, fontSize: 12, color: '$body' } },
        { type: 'divider', grid: { x: 0, y: 11, w: 12, h: 1 }, data: { style: 'line', color: '$border' }, minDecorationLevel: 'standard' },
        { type: 'text', grid: { x: 0, y: 12, w: 12, h: 1 }, data: { textStyle: 'dateline', content: doc('Day 3'), fontFamily: CB, fontSize: 11, color: '$accentSecondary' } },
        { type: 'text', grid: { x: 1, y: 13, w: 11, h: 3 }, data: { textStyle: 'body', content: doc('One last walk before heading home…'), fontFamily: CB, fontSize: 12, color: '$body' } },
      ],
    },
    {
      id: 'cb-transit', name: 'Transit & Walking Routes', icon: '🚇', group: 'Map & Itinerary',
      elements: [
        { type: 'text', grid: { x: 0, y: 0, w: 12, h: 2 }, data: { textStyle: 'heading', content: doc('Getting Around'), fontFamily: CH, fontSize: 26, color: '$heading' } },
        { type: 'divider', grid: { x: 0, y: 2, w: 12, h: 1 }, data: { style: 'dotted', color: '$accentSecondary' }, minDecorationLevel: 'standard' },
        { type: 'text', grid: { x: 0, y: 3, w: 12, h: 5 }, data: { textStyle: 'body', content: doc('Metro lines, day passes, the walk that turned out to be faster…'), fontFamily: CB, fontSize: 13, color: '$body' } },
        { type: 'sticker', grid: { x: 9, y: 9, w: 3, h: 3 }, data: { stickerId: 'taxi', color: '$accent', rotation: 0, opacity: 0.9 }, minDecorationLevel: 'rich' },
        { type: 'text', grid: { x: 0, y: 13, w: 12, h: 2 }, data: { textStyle: 'caption', content: doc('Tickets and passes below'), fontFamily: CB, fontSize: 10, color: '$muted' } },
      ],
    },

    // ─── KEEPSAKE ────────────────────────────────────────────
    {
      id: 'cb-museum-keepsake', name: 'Museum & Ticket Keepsakes', icon: '🎫', group: 'Keepsake',
      elements: [
        { type: 'text', grid: { x: 0, y: 0, w: 12, h: 2 }, data: { textStyle: 'heading', content: doc('Museum & Tickets'), fontFamily: CH, fontSize: 26, color: '$heading' } },
        { type: 'keepsake', grid: { x: 0, y: 2, w: 6, h: 6 }, data: { label: 'Museum ticket', hint: 'Tape or glue here', style: 'pocket', borderColor: '$keepsakeBorder' } },
        { type: 'keepsake', grid: { x: 6, y: 2, w: 6, h: 6 }, data: { label: 'Metro pass', hint: 'Tape or glue here', style: 'dashed', borderColor: '$keepsakeBorder' } },
        { type: 'text', grid: { x: 0, y: 8, w: 12, h: 7 }, data: { textStyle: 'body', content: doc('What we saw, what stuck with us…'), fontFamily: CB, fontSize: 13, color: '$body' } },
        { type: 'sticker', grid: { x: 5, y: 1, w: 4, h: 2 }, data: { stickerId: 'stamp', color: '$accentSecondary', rotation: -3, opacity: 0.9 }, minDecorationLevel: 'rich' },
      ],
    },

    // ─── OPENING & DIVIDERS ──────────────────────────────────
    {
      id: 'cb-city-opening', name: 'City-Opening Spread', icon: '🏙️', group: 'Opening & Dividers',
      elements: [
        { type: 'divider', grid: { x: 2, y: 5, w: 8, h: 1 }, data: { style: 'thick', color: '$accent' }, minDecorationLevel: 'standard' },
        { type: 'text', grid: { x: 1, y: 6, w: 10, h: 4 }, data: { textStyle: 'heading', content: doc('The City'), fontFamily: CH, fontSize: 34, color: '$heading' } },
        { type: 'text', grid: { x: 2, y: 10, w: 8, h: 2 }, data: { textStyle: 'dateline', content: doc('City · Dates'), fontFamily: CB, fontSize: 11, color: '$accentSecondary' } },
        { type: 'divider', grid: { x: 2, y: 12, w: 8, h: 1 }, data: { style: 'thick', color: '$accent' }, minDecorationLevel: 'standard' },
        { type: 'sticker', grid: { x: 5, y: 2, w: 2, h: 2 }, data: { stickerId: 'skyline', color: '$accent', rotation: 0, opacity: 0.85 }, minDecorationLevel: 'rich' },
      ],
    },
    {
      id: 'cb-neighborhood-divider', name: 'Neighborhood Divider', icon: '🏘️', group: 'Opening & Dividers',
      elements: [
        { type: 'text', grid: { x: 1, y: 5, w: 10, h: 4 }, data: { textStyle: 'heading', content: doc('Neighborhood Name'), fontFamily: CH, fontSize: 38, color: '$heading' } },
        { type: 'divider', grid: { x: 2, y: 9, w: 8, h: 1 }, data: { style: 'thick', color: '$accentSecondary' } },
        { type: 'text', grid: { x: 2, y: 10, w: 8, h: 2 }, data: { textStyle: 'dateline', content: doc('Exploring · Date'), fontFamily: CB, fontSize: 11, color: '$muted' } },
        { type: 'sticker', grid: { x: 5, y: 1, w: 2, h: 2 }, data: { stickerId: 'pin', color: '$accent', rotation: 0, opacity: 0.9 }, minDecorationLevel: 'rich' },
      ],
    },
    {
      id: 'cb-postcard-closing', name: 'Postcard & City Reflections', icon: '💌', group: 'Opening & Dividers',
      elements: [
        { type: 'text', grid: { x: 0, y: 1, w: 12, h: 2 }, data: { textStyle: 'heading', content: doc('Wish You Were Here'), fontFamily: CH, fontSize: 30, color: '$heading' } },
        { type: 'keepsake', grid: { x: 1, y: 3, w: 10, h: 5 }, data: { label: 'Postcard', hint: 'Tape or glue here', style: 'pocket', borderColor: '$keepsakeBorder' }, minDecorationLevel: 'standard' },
        { type: 'divider', grid: { x: 2, y: 9, w: 8, h: 1 }, data: { style: 'thick', color: '$accent' }, minDecorationLevel: 'standard' },
        { type: 'text', grid: { x: 1, y: 10, w: 10, h: 5 }, data: { textStyle: 'body', content: doc('What we’ll remember about this city…'), fontFamily: CB, fontSize: 14, color: '$body' } },
        { type: 'sticker', grid: { x: 5, y: 14, w: 2, h: 2 }, data: { stickerId: 'stamp', color: '$accentSecondary', rotation: 0, opacity: 0.9 }, minDecorationLevel: 'rich' },
      ],
    },
  ]
}

// ─── Beach Vacation content authoring ───────────────────────────────────

// Photo treatment / `$photoFrame` token: same closed gap as Road Trip and City Break —
// `captionColor` themed via `$photoFrame` on 3 authored image layouts. No new renderer field.

const BH = 'Raleway'
const BB = 'Nunito'

function BEACH_COVERS() {
  return [
    {
      id: 'bv-cover-shoreline', name: 'Shoreline', icon: '🏖️', group: 'Covers',
      elements: [
        { type: 'cover', grid: { x: 0, y: 0, w: 12, h: 16 }, data: {
          title: '', subtitle: '', titleAlign: 'center', titleFont: `${BH}, sans-serif`,
          overlayColor: '#0ea5e960', titleColor: '$paper', subtitleColor: '$paper',
        } },
        { type: 'divider', grid: { x: 2, y: 13, w: 8, h: 1 }, data: { style: 'wave', color: '$accentSecondary' }, minDecorationLevel: 'standard' },
        { type: 'sticker', grid: { x: 8, y: 1, w: 3, h: 3 }, data: { stickerId: 'palmtree', color: '$paper', rotation: 0, opacity: 0.9 }, minDecorationLevel: 'rich' },
      ],
    },
    {
      id: 'bv-cover-palm-grove', name: 'Palm Grove', icon: '🌴', group: 'Covers',
      elements: [
        { type: 'cover', grid: { x: 0, y: 0, w: 12, h: 16 }, data: {
          title: '', subtitle: '', titleAlign: 'left', titleFont: `${BH}, sans-serif`,
          overlayColor: '#2a9d7865', titleColor: '$paper', subtitleColor: '$paper',
        } },
        { type: 'divider', grid: { x: 0, y: 8, w: 12, h: 1 }, data: { style: 'dotted', color: '$paper' }, minDecorationLevel: 'standard' },
        { type: 'sticker', grid: { x: 9, y: 1, w: 2, h: 2 }, data: { stickerId: 'umbrella', color: '$paper', rotation: 0, opacity: 0.9 }, minDecorationLevel: 'rich' },
      ],
    },
    {
      id: 'bv-cover-sunset-horizon', name: 'Sunset Horizon', icon: '🌅', group: 'Covers',
      elements: [
        { type: 'cover', grid: { x: 0, y: 0, w: 12, h: 16 }, data: {
          title: '', subtitle: '', titleAlign: 'center', titleFont: `${BH}, sans-serif`,
          overlayColor: '#ee6c4d55', titleColor: '$paper', subtitleColor: '$paper',
        } },
        { type: 'sticker', grid: { x: 5, y: 2, w: 2, h: 2 }, data: { stickerId: 'sun', color: '$accentSecondary', rotation: 0, opacity: 0.95 }, minDecorationLevel: 'standard' },
        { type: 'divider', grid: { x: 2, y: 13, w: 8, h: 1 }, data: { style: 'wave', color: '$accentSecondary' }, minDecorationLevel: 'rich' },
      ],
    },
  ]
}

function BEACH_LAYOUTS() {
  return [
    // ─── PHOTO ───────────────────────────────────────────────
    {
      id: 'bv-hero-beach', name: 'Hero Beach Photograph', icon: '🏖️', group: 'Photo',
      elements: [
        { type: 'image', grid: { x: 0, y: 0, w: 12, h: 11 }, data: { fit: 'cover', caption: 'Toes in the sand', captionStyle: 'overlay', captionColor: '$photoFrame' } },
        { type: 'text', grid: { x: 0, y: 11, w: 12, h: 2 }, data: { textStyle: 'heading', content: doc('The Beach'), fontFamily: BH, fontSize: 28, color: '$heading' } },
        { type: 'text', grid: { x: 0, y: 13, w: 12, h: 1 }, data: { textStyle: 'dateline', content: doc('Beach · Date'), fontFamily: BB, fontSize: 11, color: '$accentSecondary' } },
        { type: 'sticker', grid: { x: 9, y: 0, w: 3, h: 3 }, data: { stickerId: 'sun', color: '$paper', rotation: 0, opacity: 0.9 }, minDecorationLevel: 'standard' },
        { type: 'divider', grid: { x: 1, y: 14, w: 10, h: 1 }, data: { style: 'wave', color: '$border' }, minDecorationLevel: 'rich' },
      ],
    },
    {
      id: 'bv-sand-shells-collage', name: 'Sand & Shells', icon: '🖼️', group: 'Photo',
      elements: [
        { type: 'text', grid: { x: 0, y: 0, w: 12, h: 2 }, data: { textStyle: 'heading', content: doc('Sand & Shells'), fontFamily: BH, fontSize: 26, color: '$heading' } },
        { type: 'collage', grid: { x: 0, y: 2, w: 12, h: 12 }, data: { columns: 2, gap: 6, borderRadius: 6 } },
        { type: 'text', grid: { x: 1, y: 14, w: 10, h: 2 }, data: { textStyle: 'caption', content: doc('What washed up, what we kept…'), fontFamily: BB, fontSize: 10, color: '$muted' } },
      ],
    },
    {
      id: 'bv-beachside-cafe', name: 'Beachside Café', icon: '🍹', group: 'Photo',
      elements: [
        { type: 'image', grid: { x: 0, y: 0, w: 12, h: 9 }, data: { fit: 'cover', caption: 'Drink with an umbrella', captionStyle: 'overlay', captionColor: '$photoFrame' } },
        { type: 'text', grid: { x: 0, y: 9, w: 12, h: 2 }, data: { textStyle: 'heading', content: doc('Beachside Café'), fontFamily: BH, fontSize: 24, color: '$heading' } },
        { type: 'text', grid: { x: 0, y: 11, w: 12, h: 5 }, data: { textStyle: 'body', content: doc('What we ordered, the view, whether we’d go back…'), fontFamily: BB, fontSize: 13, color: '$body' } },
        { type: 'sticker', grid: { x: 0, y: 7, w: 3, h: 3 }, data: { stickerId: 'umbrella', color: '$accentSecondary', rotation: -8, opacity: 0.9 }, minDecorationLevel: 'standard' },
        { type: 'divider', grid: { x: 0, y: 14, w: 12, h: 1 }, data: { style: 'wave', color: '$border' }, minDecorationLevel: 'rich' },
      ],
    },
    {
      id: 'bv-sunset', name: 'Sunset', icon: '🌅', group: 'Photo',
      elements: [
        { type: 'image', grid: { x: 0, y: 0, w: 12, h: 10 }, data: { fit: 'cover' } },
        { type: 'text', grid: { x: 0, y: 10, w: 12, h: 2 }, data: { textStyle: 'heading', content: doc('Golden Hour'), fontFamily: BH, fontSize: 26, color: '$heading' } },
        { type: 'text', grid: { x: 0, y: 12, w: 12, h: 4 }, data: { textStyle: 'body', content: doc('The sky, the colors, where we sat to watch it…'), fontFamily: BB, fontSize: 13, color: '$body' } },
        { type: 'sticker', grid: { x: 0, y: 8, w: 3, h: 3 }, data: { stickerId: 'sun', color: '$accentSecondary', rotation: 0, opacity: 0.9 }, minDecorationLevel: 'standard' },
        { type: 'divider', grid: { x: 0, y: 14, w: 12, h: 1 }, data: { style: 'wave', color: '$border' }, minDecorationLevel: 'rich' },
      ],
    },

    // ─── WRITING ─────────────────────────────────────────────
    {
      id: 'bv-photo-writing', name: 'Photo + Story', icon: '📓', group: 'Writing',
      elements: [
        { type: 'image', grid: { x: 0, y: 0, w: 6, h: 16 }, data: { fit: 'cover', rotation: -1, caption: 'A slower kind of day', captionStyle: 'overlay', captionColor: '$photoFrame' } },
        { type: 'text', grid: { x: 7, y: 0, w: 5, h: 2 }, data: { textStyle: 'heading', content: doc('Beach Notes'), fontFamily: BH, fontSize: 22, color: '$heading' } },
        { type: 'text', grid: { x: 7, y: 2, w: 5, h: 12 }, data: { textStyle: 'body', content: doc('The sound of the waves, who we met, how slow the day felt…'), fontFamily: BB, fontSize: 13, color: '$body' } },
        { type: 'sticker', grid: { x: 7, y: 14, w: 2, h: 2 }, data: { stickerId: 'wave', color: '$accent', rotation: 10, opacity: 0.9 }, minDecorationLevel: 'standard' },
      ],
    },

    // ─── MAP & ITINERARY ─────────────────────────────────────
    {
      id: 'bv-coastal-map', name: 'The Coast', icon: '🗺️', group: 'Map & Itinerary',
      elements: [
        { type: 'text', grid: { x: 0, y: 0, w: 12, h: 2 }, data: { textStyle: 'heading', content: doc('The Coast'), fontFamily: BH, fontSize: 26, color: '$heading' } },
        { type: 'map', grid: { x: 0, y: 2, w: 12, h: 8 }, data: { tileStyle: 'minimal', mode: 'route', showRoute: true, showPins: true, routeColor: '$mapRoute', pinColor: '$accentSecondary' } },
        { type: 'sticker', grid: { x: 9, y: 2, w: 3, h: 3 }, data: { stickerId: 'pin', color: '$paper', rotation: 0, opacity: 0.9 }, minDecorationLevel: 'standard' },
        { type: 'text', grid: { x: 0, y: 10, w: 12, h: 6 }, data: { textStyle: 'body', content: doc('The stretch of coast we covered, our favorite spot…'), fontFamily: BB, fontSize: 13, color: '$body' } },
      ],
    },
    {
      id: 'bv-itinerary', name: 'Day-by-Day Itinerary', icon: '🧭', group: 'Map & Itinerary',
      elements: [
        { type: 'text', grid: { x: 0, y: 0, w: 12, h: 2 }, data: { textStyle: 'heading', content: doc('Beach Days'), fontFamily: BH, fontSize: 26, color: '$heading' } },
        { type: 'text', grid: { x: 0, y: 2, w: 12, h: 1 }, data: { textStyle: 'dateline', content: doc('Day 1'), fontFamily: BB, fontSize: 11, color: '$accentSecondary' } },
        { type: 'text', grid: { x: 1, y: 3, w: 11, h: 3 }, data: { textStyle: 'body', content: doc('Arrival, first swim, settling in…'), fontFamily: BB, fontSize: 12, color: '$body' } },
        { type: 'divider', grid: { x: 0, y: 6, w: 12, h: 1 }, data: { style: 'line', color: '$border' }, minDecorationLevel: 'standard' },
        { type: 'text', grid: { x: 0, y: 7, w: 12, h: 1 }, data: { textStyle: 'dateline', content: doc('Day 2'), fontFamily: BB, fontSize: 11, color: '$accentSecondary' } },
        { type: 'text', grid: { x: 1, y: 8, w: 11, h: 3 }, data: { textStyle: 'body', content: doc('Snorkeling, a long lunch, doing nothing…'), fontFamily: BB, fontSize: 12, color: '$body' } },
        { type: 'divider', grid: { x: 0, y: 11, w: 12, h: 1 }, data: { style: 'line', color: '$border' }, minDecorationLevel: 'standard' },
        { type: 'text', grid: { x: 0, y: 12, w: 12, h: 1 }, data: { textStyle: 'dateline', content: doc('Day 3'), fontFamily: BB, fontSize: 11, color: '$accentSecondary' } },
        { type: 'text', grid: { x: 1, y: 13, w: 11, h: 3 }, data: { textStyle: 'body', content: doc('One last sunrise walk before leaving…'), fontFamily: BB, fontSize: 12, color: '$body' } },
      ],
    },
    {
      id: 'bv-boat-routes', name: 'Boat & Ferry Routes', icon: '⛴️', group: 'Map & Itinerary',
      elements: [
        { type: 'text', grid: { x: 0, y: 0, w: 12, h: 2 }, data: { textStyle: 'heading', content: doc('Getting on the Water'), fontFamily: BH, fontSize: 26, color: '$heading' } },
        { type: 'divider', grid: { x: 0, y: 2, w: 12, h: 1 }, data: { style: 'wave', color: '$accentSecondary' }, minDecorationLevel: 'standard' },
        { type: 'text', grid: { x: 0, y: 3, w: 12, h: 5 }, data: { textStyle: 'body', content: doc('Ferry times, the island we almost missed, the boat that rocked more than expected…'), fontFamily: BB, fontSize: 13, color: '$body' } },
        { type: 'sticker', grid: { x: 9, y: 9, w: 3, h: 3 }, data: { stickerId: 'wave', color: '$accent', rotation: 0, opacity: 0.9 }, minDecorationLevel: 'rich' },
        { type: 'text', grid: { x: 0, y: 13, w: 12, h: 2 }, data: { textStyle: 'caption', content: doc('Tickets below'), fontFamily: BB, fontSize: 10, color: '$muted' } },
      ],
    },

    // ─── KEEPSAKE ────────────────────────────────────────────
    {
      id: 'bv-excursion-keepsake', name: 'Snorkel & Excursion Keepsakes', icon: '🎫', group: 'Keepsake',
      elements: [
        { type: 'text', grid: { x: 0, y: 0, w: 12, h: 2 }, data: { textStyle: 'heading', content: doc('Excursions'), fontFamily: BH, fontSize: 26, color: '$heading' } },
        { type: 'keepsake', grid: { x: 0, y: 2, w: 6, h: 6 }, data: { label: 'Snorkel trip ticket', hint: 'Tape or glue here', style: 'pocket', borderColor: '$keepsakeBorder' } },
        { type: 'keepsake', grid: { x: 6, y: 2, w: 6, h: 6 }, data: { label: 'Ferry pass', hint: 'Tape or glue here', style: 'dashed', borderColor: '$keepsakeBorder' } },
        { type: 'text', grid: { x: 0, y: 8, w: 12, h: 7 }, data: { textStyle: 'body', content: doc('What we saw underwater, what we’d do again…'), fontFamily: BB, fontSize: 13, color: '$body' } },
        { type: 'sticker', grid: { x: 5, y: 1, w: 4, h: 2 }, data: { stickerId: 'star', color: '$accentSecondary', rotation: -3, opacity: 0.9 }, minDecorationLevel: 'rich' },
      ],
    },

    // ─── OPENING & DIVIDERS ──────────────────────────────────
    {
      id: 'bv-trip-opening', name: 'Trip-Opening Spread', icon: '🏖️', group: 'Opening & Dividers',
      elements: [
        { type: 'divider', grid: { x: 2, y: 5, w: 8, h: 1 }, data: { style: 'wave', color: '$accent' }, minDecorationLevel: 'standard' },
        { type: 'text', grid: { x: 1, y: 6, w: 10, h: 4 }, data: { textStyle: 'heading', content: doc('Beach Vacation'), fontFamily: BH, fontSize: 34, color: '$heading' } },
        { type: 'text', grid: { x: 2, y: 10, w: 8, h: 2 }, data: { textStyle: 'dateline', content: doc('Beach · Dates'), fontFamily: BB, fontSize: 11, color: '$accentSecondary' } },
        { type: 'divider', grid: { x: 2, y: 12, w: 8, h: 1 }, data: { style: 'wave', color: '$accent' }, minDecorationLevel: 'standard' },
        { type: 'sticker', grid: { x: 5, y: 2, w: 2, h: 2 }, data: { stickerId: 'palmtree', color: '$accent', rotation: 0, opacity: 0.85 }, minDecorationLevel: 'rich' },
      ],
    },
    {
      id: 'bv-cove-divider', name: 'Cove Divider', icon: '🏝️', group: 'Opening & Dividers',
      elements: [
        { type: 'text', grid: { x: 1, y: 5, w: 10, h: 4 }, data: { textStyle: 'heading', content: doc('Cove Name'), fontFamily: BH, fontSize: 38, color: '$heading' } },
        { type: 'divider', grid: { x: 2, y: 9, w: 8, h: 1 }, data: { style: 'wave', color: '$accentSecondary' } },
        { type: 'text', grid: { x: 2, y: 10, w: 8, h: 2 }, data: { textStyle: 'dateline', content: doc('Exploring · Date'), fontFamily: BB, fontSize: 11, color: '$muted' } },
        { type: 'sticker', grid: { x: 5, y: 1, w: 2, h: 2 }, data: { stickerId: 'umbrella', color: '$accent', rotation: 0, opacity: 0.9 }, minDecorationLevel: 'rich' },
      ],
    },
    {
      id: 'bv-postcard-closing', name: 'Postcard & Reflections', icon: '💌', group: 'Opening & Dividers',
      elements: [
        { type: 'text', grid: { x: 0, y: 1, w: 12, h: 2 }, data: { textStyle: 'heading', content: doc('Wish You Were Here'), fontFamily: BH, fontSize: 30, color: '$heading' } },
        { type: 'keepsake', grid: { x: 1, y: 3, w: 10, h: 5 }, data: { label: 'Postcard', hint: 'Tape or glue here', style: 'pocket', borderColor: '$keepsakeBorder' }, minDecorationLevel: 'standard' },
        { type: 'divider', grid: { x: 2, y: 9, w: 8, h: 1 }, data: { style: 'wave', color: '$accent' }, minDecorationLevel: 'standard' },
        { type: 'text', grid: { x: 1, y: 10, w: 10, h: 5 }, data: { textStyle: 'body', content: doc('What we’ll remember about this trip…'), fontFamily: BB, fontSize: 14, color: '$body' } },
        { type: 'sticker', grid: { x: 5, y: 14, w: 2, h: 2 }, data: { stickerId: 'star', color: '$accentSecondary', rotation: 0, opacity: 0.9 }, minDecorationLevel: 'rich' },
      ],
    },
  ]
}

// ─── Winter Getaway content authoring ───────────────────────────────────

// Photo treatment / `$photoFrame` token: same closed gap as the prior three themes —
// `captionColor` themed via `$photoFrame` on authored image layouts. No new renderer field.

const WH = 'Raleway'
const WB = 'Nunito'

function WINTER_COVERS() {
  return [
    {
      id: 'wg-cover-snowbound', name: 'Snowbound', icon: '❄️', group: 'Covers',
      elements: [
        { type: 'cover', grid: { x: 0, y: 0, w: 12, h: 16 }, data: {
          title: '', subtitle: '', titleAlign: 'center', titleFont: `${WH}, sans-serif`,
          overlayColor: '#0b1e3d65', titleColor: '$paper', subtitleColor: '$paper',
        } },
        { type: 'divider', grid: { x: 2, y: 13, w: 8, h: 1 }, data: { style: 'double', color: '$accentSecondary' }, minDecorationLevel: 'standard' },
        { type: 'sticker', grid: { x: 8, y: 1, w: 3, h: 3 }, data: { stickerId: 'snowflake', color: '$paper', rotation: 0, opacity: 0.9 }, minDecorationLevel: 'rich' },
      ],
    },
    {
      id: 'wg-cover-alpine-lodge', name: 'Alpine Lodge', icon: '🏔️', group: 'Covers',
      elements: [
        { type: 'cover', grid: { x: 0, y: 0, w: 12, h: 16 }, data: {
          title: '', subtitle: '', titleAlign: 'left', titleFont: `${WH}, sans-serif`,
          overlayColor: '#8a6a4f60', titleColor: '$paper', subtitleColor: '$paper',
        } },
        { type: 'divider', grid: { x: 0, y: 8, w: 12, h: 1 }, data: { style: 'dotted', color: '$paper' }, minDecorationLevel: 'standard' },
        { type: 'sticker', grid: { x: 9, y: 1, w: 2, h: 2 }, data: { stickerId: 'mountain', color: '$paper', rotation: 0, opacity: 0.9 }, minDecorationLevel: 'rich' },
      ],
    },
    {
      id: 'wg-cover-northern-lights', name: 'Northern Lights', icon: '🌌', group: 'Covers',
      elements: [
        { type: 'cover', grid: { x: 0, y: 0, w: 12, h: 16 }, data: {
          title: '', subtitle: '', titleAlign: 'center', titleFont: `${WH}, sans-serif`,
          overlayColor: '#2f6b4f55', titleColor: '$paper', subtitleColor: '$paper',
        } },
        { type: 'sticker', grid: { x: 5, y: 2, w: 2, h: 2 }, data: { stickerId: 'star', color: '$accentSecondary', rotation: 0, opacity: 0.95 }, minDecorationLevel: 'standard' },
        { type: 'divider', grid: { x: 2, y: 13, w: 8, h: 1 }, data: { style: 'double', color: '$accentSecondary' }, minDecorationLevel: 'rich' },
      ],
    },
  ]
}

function WINTER_LAYOUTS() {
  return [
    // ─── PHOTO ───────────────────────────────────────────────
    {
      id: 'wg-hero-snowy', name: 'Hero Snowy Landscape', icon: '🏔️', group: 'Photo',
      elements: [
        { type: 'image', grid: { x: 0, y: 0, w: 12, h: 11 }, data: { fit: 'cover', caption: 'Fresh snow', captionStyle: 'overlay', captionColor: '$photoFrame' } },
        { type: 'text', grid: { x: 0, y: 11, w: 12, h: 2 }, data: { textStyle: 'heading', content: doc('The Mountains'), fontFamily: WH, fontSize: 28, color: '$heading' } },
        { type: 'text', grid: { x: 0, y: 13, w: 12, h: 1 }, data: { textStyle: 'dateline', content: doc('Resort · Date'), fontFamily: WB, fontSize: 11, color: '$accentSecondary' } },
        { type: 'sticker', grid: { x: 9, y: 0, w: 3, h: 3 }, data: { stickerId: 'snowflake', color: '$paper', rotation: 0, opacity: 0.9 }, minDecorationLevel: 'standard' },
        { type: 'divider', grid: { x: 1, y: 14, w: 10, h: 1 }, data: { style: 'dotted', color: '$border' }, minDecorationLevel: 'rich' },
      ],
    },
    {
      id: 'wg-activity', name: 'On the Slopes', icon: '⛷️', group: 'Photo',
      elements: [
        { type: 'image', grid: { x: 0, y: 0, w: 12, h: 9 }, data: { fit: 'cover', caption: 'One more run', captionStyle: 'overlay', captionColor: '$photoFrame' } },
        { type: 'text', grid: { x: 0, y: 9, w: 12, h: 2 }, data: { textStyle: 'heading', content: doc('The Slopes'), fontFamily: WH, fontSize: 24, color: '$heading' } },
        { type: 'text', grid: { x: 0, y: 11, w: 12, h: 5 }, data: { textStyle: 'body', content: doc('Which runs, how the snow was, who wiped out…'), fontFamily: WB, fontSize: 13, color: '$body' } },
        { type: 'sticker', grid: { x: 0, y: 7, w: 3, h: 3 }, data: { stickerId: 'mountain', color: '$accentSecondary', rotation: -8, opacity: 0.9 }, minDecorationLevel: 'standard' },
        { type: 'divider', grid: { x: 0, y: 14, w: 12, h: 1 }, data: { style: 'dotted', color: '$border' }, minDecorationLevel: 'rich' },
      ],
    },
    {
      id: 'wg-cabin', name: 'Cozy Lodge', icon: '🛖', group: 'Photo',
      elements: [
        { type: 'image', grid: { x: 0, y: 0, w: 12, h: 10 }, data: { fit: 'cover' } },
        { type: 'text', grid: { x: 0, y: 10, w: 12, h: 2 }, data: { textStyle: 'heading', content: doc('Fireside'), fontFamily: WH, fontSize: 26, color: '$heading' } },
        { type: 'text', grid: { x: 0, y: 12, w: 12, h: 4 }, data: { textStyle: 'body', content: doc('Hot cocoa, wool socks, the fire crackling…'), fontFamily: WB, fontSize: 13, color: '$body' } },
        { type: 'sticker', grid: { x: 0, y: 8, w: 3, h: 3 }, data: { stickerId: 'star', color: '$accentSecondary', rotation: 0, opacity: 0.9 }, minDecorationLevel: 'standard' },
        { type: 'divider', grid: { x: 0, y: 14, w: 12, h: 1 }, data: { style: 'double', color: '$border' }, minDecorationLevel: 'rich' },
      ],
    },
    {
      id: 'wg-winter-collage', name: 'Four-Photo Winter Collage', icon: '🖼️', group: 'Photo',
      elements: [
        { type: 'text', grid: { x: 0, y: 0, w: 12, h: 2 }, data: { textStyle: 'heading', content: doc('Snow Days'), fontFamily: WH, fontSize: 26, color: '$heading' } },
        { type: 'collage', grid: { x: 0, y: 2, w: 12, h: 12 }, data: { columns: 2, gap: 6, borderRadius: 4 } },
        { type: 'text', grid: { x: 1, y: 14, w: 10, h: 2 }, data: { textStyle: 'caption', content: doc('A few moments from the snow…'), fontFamily: WB, fontSize: 10, color: '$muted' } },
      ],
    },

    // ─── WRITING ─────────────────────────────────────────────
    {
      id: 'wg-field-notes-weather', name: 'Winter Field Notes', icon: '🌡️', group: 'Writing',
      elements: [
        { type: 'text', grid: { x: 0, y: 0, w: 12, h: 1 }, data: { textStyle: 'dateline', content: doc('Day 2 · On the mountain'), fontFamily: WB, fontSize: 11, color: '$accentSecondary' } },
        { type: 'text', grid: { x: 0, y: 1, w: 12, h: 2 }, data: { textStyle: 'heading', content: doc('Field Notes'), fontFamily: WH, fontSize: 26, color: '$heading' } },
        { type: 'weather', grid: { x: 0, y: 3, w: 12, h: 4 }, data: {} },
        { type: 'divider', grid: { x: 0, y: 7, w: 12, h: 1 }, data: { style: 'dotted', color: '$border' }, minDecorationLevel: 'standard' },
        { type: 'text', grid: { x: 0, y: 8, w: 12, h: 8 }, data: { textStyle: 'body', content: doc('Temperature, snowfall, how the day felt…'), fontFamily: WB, fontSize: 14, color: '$body' } },
      ],
    },
    {
      id: 'wg-photo-writing', name: 'Photo + Story', icon: '📓', group: 'Writing',
      elements: [
        { type: 'image', grid: { x: 0, y: 0, w: 6, h: 16 }, data: { fit: 'cover', rotation: -1, caption: 'Snowed in', captionStyle: 'overlay', captionColor: '$photoFrame' } },
        { type: 'text', grid: { x: 7, y: 0, w: 5, h: 2 }, data: { textStyle: 'heading', content: doc('Winter Notes'), fontFamily: WH, fontSize: 22, color: '$heading' } },
        { type: 'text', grid: { x: 7, y: 2, w: 5, h: 12 }, data: { textStyle: 'body', content: doc('The cold, the quiet, how the snow changed everything…'), fontFamily: WB, fontSize: 13, color: '$body' } },
        { type: 'sticker', grid: { x: 7, y: 14, w: 2, h: 2 }, data: { stickerId: 'snowflake', color: '$accent', rotation: 10, opacity: 0.9 }, minDecorationLevel: 'standard' },
      ],
    },

    // ─── MAP & ITINERARY ─────────────────────────────────────
    {
      id: 'wg-mountain-map', name: 'The Resort', icon: '🗺️', group: 'Map & Itinerary',
      elements: [
        { type: 'text', grid: { x: 0, y: 0, w: 12, h: 2 }, data: { textStyle: 'heading', content: doc('The Resort'), fontFamily: WH, fontSize: 26, color: '$heading' } },
        { type: 'map', grid: { x: 0, y: 2, w: 12, h: 8 }, data: { tileStyle: 'minimal', mode: 'pin', showPins: true, pinColor: '$accentSecondary' } },
        { type: 'sticker', grid: { x: 9, y: 2, w: 3, h: 3 }, data: { stickerId: 'mountain', color: '$paper', rotation: 0, opacity: 0.9 }, minDecorationLevel: 'standard' },
        { type: 'text', grid: { x: 0, y: 10, w: 12, h: 6 }, data: { textStyle: 'body', content: doc('Trails run, elevation, our favorite lodge stop…'), fontFamily: WB, fontSize: 13, color: '$body' } },
      ],
    },
    {
      id: 'wg-itinerary', name: 'Winter Itinerary', icon: '🧭', group: 'Map & Itinerary',
      elements: [
        { type: 'text', grid: { x: 0, y: 0, w: 12, h: 2 }, data: { textStyle: 'heading', content: doc('Winter Itinerary'), fontFamily: WH, fontSize: 26, color: '$heading' } },
        { type: 'text', grid: { x: 0, y: 2, w: 12, h: 1 }, data: { textStyle: 'dateline', content: doc('Day 1'), fontFamily: WB, fontSize: 11, color: '$accentSecondary' } },
        { type: 'text', grid: { x: 1, y: 3, w: 11, h: 3 }, data: { textStyle: 'body', content: doc('Arrival, gear rental, first look at the mountain…'), fontFamily: WB, fontSize: 12, color: '$body' } },
        { type: 'divider', grid: { x: 0, y: 6, w: 12, h: 1 }, data: { style: 'line', color: '$border' }, minDecorationLevel: 'standard' },
        { type: 'text', grid: { x: 0, y: 7, w: 12, h: 1 }, data: { textStyle: 'dateline', content: doc('Day 2'), fontFamily: WB, fontSize: 11, color: '$accentSecondary' } },
        { type: 'text', grid: { x: 1, y: 8, w: 11, h: 3 }, data: { textStyle: 'body', content: doc('Full day on the slopes, hot cocoa break…'), fontFamily: WB, fontSize: 12, color: '$body' } },
        { type: 'divider', grid: { x: 0, y: 11, w: 12, h: 1 }, data: { style: 'line', color: '$border' }, minDecorationLevel: 'standard' },
        { type: 'text', grid: { x: 0, y: 12, w: 12, h: 1 }, data: { textStyle: 'dateline', content: doc('Day 3'), fontFamily: WB, fontSize: 11, color: '$accentSecondary' } },
        { type: 'text', grid: { x: 1, y: 13, w: 11, h: 3 }, data: { textStyle: 'body', content: doc('One last morning on the mountain before heading home…'), fontFamily: WB, fontSize: 12, color: '$body' } },
      ],
    },

    // ─── KEEPSAKE ────────────────────────────────────────────
    {
      id: 'wg-lift-pass-keepsake', name: 'Lift Pass & Keepsakes', icon: '🎫', group: 'Keepsake',
      elements: [
        { type: 'text', grid: { x: 0, y: 0, w: 12, h: 2 }, data: { textStyle: 'heading', content: doc('Lift Passes'), fontFamily: WH, fontSize: 26, color: '$heading' } },
        { type: 'keepsake', grid: { x: 0, y: 2, w: 6, h: 6 }, data: { label: 'Lift pass', hint: 'Tape or glue here', style: 'pocket', borderColor: '$keepsakeBorder' } },
        { type: 'keepsake', grid: { x: 6, y: 2, w: 6, h: 6 }, data: { label: 'Rental receipt', hint: 'Tape or glue here', style: 'dashed', borderColor: '$keepsakeBorder' } },
        { type: 'text', grid: { x: 0, y: 8, w: 12, h: 7 }, data: { textStyle: 'body', content: doc('Best runs, worst falls, what we’d bring next time…'), fontFamily: WB, fontSize: 13, color: '$body' } },
        { type: 'sticker', grid: { x: 5, y: 1, w: 4, h: 2 }, data: { stickerId: 'snowflake', color: '$accentSecondary', rotation: -3, opacity: 0.9 }, minDecorationLevel: 'rich' },
      ],
    },

    // ─── OPENING & DIVIDERS ──────────────────────────────────
    {
      id: 'wg-trip-opening', name: 'Winter-Trip Opening Spread', icon: '❄️', group: 'Opening & Dividers',
      elements: [
        { type: 'divider', grid: { x: 2, y: 5, w: 8, h: 1 }, data: { style: 'double', color: '$accent' }, minDecorationLevel: 'standard' },
        { type: 'text', grid: { x: 1, y: 6, w: 10, h: 4 }, data: { textStyle: 'heading', content: doc('Winter Getaway'), fontFamily: WH, fontSize: 34, color: '$heading' } },
        { type: 'text', grid: { x: 2, y: 10, w: 8, h: 2 }, data: { textStyle: 'dateline', content: doc('Mountain · Dates'), fontFamily: WB, fontSize: 11, color: '$accentSecondary' } },
        { type: 'divider', grid: { x: 2, y: 12, w: 8, h: 1 }, data: { style: 'double', color: '$accent' }, minDecorationLevel: 'standard' },
        { type: 'sticker', grid: { x: 5, y: 2, w: 2, h: 2 }, data: { stickerId: 'snowflake', color: '$accent', rotation: 0, opacity: 0.85 }, minDecorationLevel: 'rich' },
      ],
    },
    {
      id: 'wg-mountain-divider', name: 'Mountain Divider', icon: '🏔️', group: 'Opening & Dividers',
      elements: [
        { type: 'text', grid: { x: 1, y: 5, w: 10, h: 4 }, data: { textStyle: 'heading', content: doc('Mountain Name'), fontFamily: WH, fontSize: 38, color: '$heading' } },
        { type: 'divider', grid: { x: 2, y: 9, w: 8, h: 1 }, data: { style: 'double', color: '$accentSecondary' } },
        { type: 'text', grid: { x: 2, y: 10, w: 8, h: 2 }, data: { textStyle: 'dateline', content: doc('Exploring · Date'), fontFamily: WB, fontSize: 11, color: '$muted' } },
        { type: 'sticker', grid: { x: 5, y: 1, w: 2, h: 2 }, data: { stickerId: 'mountain', color: '$accent', rotation: 0, opacity: 0.9 }, minDecorationLevel: 'rich' },
      ],
    },
    {
      id: 'wg-fireside-closing', name: 'Fireside Reflections', icon: '🔥', group: 'Opening & Dividers',
      elements: [
        { type: 'text', grid: { x: 0, y: 1, w: 12, h: 2 }, data: { textStyle: 'heading', content: doc('Fireside Reflections'), fontFamily: WH, fontSize: 30, color: '$heading' } },
        { type: 'keepsake', grid: { x: 1, y: 3, w: 10, h: 5 }, data: { label: 'Postcard', hint: 'Tape or glue here', style: 'pocket', borderColor: '$keepsakeBorder' }, minDecorationLevel: 'standard' },
        { type: 'divider', grid: { x: 2, y: 9, w: 8, h: 1 }, data: { style: 'double', color: '$accent' }, minDecorationLevel: 'standard' },
        { type: 'text', grid: { x: 1, y: 10, w: 10, h: 5 }, data: { textStyle: 'body', content: doc('What we’ll remember about this winter…'), fontFamily: WB, fontSize: 14, color: '$body' } },
        { type: 'sticker', grid: { x: 5, y: 14, w: 2, h: 2 }, data: { stickerId: 'star', color: '$accentSecondary', rotation: 0, opacity: 0.9 }, minDecorationLevel: 'rich' },
      ],
    },
  ]
}

export const THEMES = [
  // ─── OCCASION ──────────────────────────────────────────────
  {
    id: 'christmas', label: 'Christmas', category: 'Occasion', icon: '🎄',
    accentColor: '#b91c1c', accentColorSecondary: '#15803d',
    backgroundColor: '#fdf6ec', backgroundTexture: 'linen',
    fontHeading: 'Merriweather', fontBody: 'Lora',
    stickers: ['wreath', 'star', 'banner', 'heart', 'frame'],
    templates: ['gratitude', 'day', 'hotel'],
  },
  {
    id: 'beach-vacation', label: 'Beach Vacation', category: 'Occasion', icon: '🏖️',
    // Fourth reference theme, after Backpacking, Road Trip, and City Break.
    accentColor: '#0ea5e9', accentColorSecondary: '#f59e0b',
    backgroundColor: '#fdf6e3', backgroundTexture: 'wave',
    fontHeading: 'Raleway', fontBody: 'Nunito',
    stickers: ['palmtree', 'umbrella', 'sun', 'wave', 'star', 'pin', 'camera'],
    templates: ['beach', 'sunset', 'hotel'],
    tokens: {
      paper: '#fdf6e3',
      surface: '#f3e9d2',
      heading: '#0c4a6e',
      body: '#4a3728',
      muted: '#a89684',
      accent: '#0ea5e9',
      accentSecondary: '#f59e0b',
      coral: '#ee6c4d',
      palmGreen: '#2a9d78',
      border: '#5eb1bf',
      mapRoute: '#5eb1bf',
      photoFrame: '#fdf6e3',
      keepsakeBorder: '#0c4a6e',
    },
    covers: BEACH_COVERS(),
    layouts: BEACH_LAYOUTS(),
  },
  {
    id: 'road-trip', label: 'Road Trip', category: 'Occasion', icon: '🚗',
    // Second reference theme, after Backpacking — tokens/covers/layouts authored below.
    accentColor: '#1e5f45', accentColorSecondary: '#d9622b',
    backgroundColor: '#f6f1e4', backgroundTexture: 'roadline',
    fontHeading: 'Montserrat', fontBody: 'Nunito',
    stickers: ['roadsign', 'mileage', 'arrow', 'pin', 'camera'],
    templates: ['transit', 'hike', 'city-walk'],
    tokens: {
      paper: '#f6f1e4',
      surface: '#e9e1cd',
      heading: '#1e3a5f',
      body: '#33302a',
      muted: '#7a7266',
      accent: '#1e5f45',
      accentSecondary: '#d9622b',
      mustard: '#c98a1f',
      fadedRed: '#a83232',
      border: '#c98a1f',
      mapRoute: '#1e5f45',
      photoFrame: '#f6f1e4',
      keepsakeBorder: '#4a4a4a',
    },
    covers: ROAD_TRIP_COVERS(),
    layouts: ROAD_TRIP_LAYOUTS(),
  },
  {
    id: 'city-break', label: 'City Break', category: 'Occasion', icon: '🏙️',
    // Third reference theme, after Backpacking and Road Trip — tokens/covers/layouts below.
    accentColor: '#1e3a5f', accentColorSecondary: '#e8a317',
    backgroundColor: '#f5f2ea', backgroundTexture: 'blueprint',
    fontHeading: 'Montserrat', fontBody: 'Montserrat',
    stickers: ['skyline', 'taxi', 'camera', 'pin', 'ticket', 'frame', 'stamp'],
    templates: ['city-walk', 'landmark', 'museum', 'cafe'],
    tokens: {
      paper: '#f5f2ea',
      surface: '#e8e3d8',
      heading: '#1e3a5f',
      body: '#33332f',
      muted: '#8a8680',
      accent: '#1e3a5f',
      accentSecondary: '#e8a317',
      brickRed: '#a8402c',
      tealMuted: '#4a7a78',
      border: '#b8b2a0',
      mapRoute: '#4a7a78',
      photoFrame: '#f5f2ea',
      keepsakeBorder: '#2b2b2b',
    },
    covers: CITY_BREAK_COVERS(),
    layouts: CITY_BREAK_LAYOUTS(),
  },
  {
    id: 'backpacking', label: 'Backpacking', category: 'Occasion', icon: '🎒',
    // Reference theme — the only one with tokens/covers/layouts authored so far.
    accentColor: '#3a5a40', accentColorSecondary: '#c1440e',
    backgroundColor: '#f5f0e4', backgroundTexture: 'grain',
    fontHeading: 'Merriweather', fontBody: 'Nunito',
    stickers: ['compass', 'arrow', 'wave', 'pin', 'plane'],
    templates: ['hike', 'sunset', 'market'],
    tokens: {
      paper: '#f5f0e4',
      surface: '#ece4d3',
      heading: '#2d4a32',
      body: '#3a3630',
      muted: '#7a7266',
      accent: '#3a5a40',
      accentSecondary: '#c1440e',
      border: '#c9973e',
      mapRoute: '#3a5a40',
      photoFrame: '#f5f0e4',
      keepsakeBorder: '#4a5568',
    },
    covers: BACKPACKING_COVERS(),
    layouts: BACKPACKING_LAYOUTS(),
  },
  {
    id: 'winter-getaway', label: 'Winter Getaway', category: 'Occasion', icon: '❄️',
    // Fifth reference theme, after Backpacking, Road Trip, City Break, and Beach Vacation.
    accentColor: '#3b82f6', accentColorSecondary: '#d4a017',
    backgroundColor: '#f7f9fc', backgroundTexture: 'snowfall',
    fontHeading: 'Raleway', fontBody: 'Nunito',
    stickers: ['snowflake', 'mountain', 'star', 'frame', 'pin', 'camera'],
    templates: ['hotel', 'sunset', 'freewrite'],
    tokens: {
      paper: '#f7f9fc',
      surface: '#e7eef5',
      heading: '#0b1e3d',
      body: '#33404d',
      muted: '#8a97a3',
      accent: '#3b82f6',
      accentSecondary: '#d4a017',
      cranberry: '#b3253d',
      cabinBrown: '#8a6a4f',
      border: '#8a6a4f',
      mapRoute: '#2f6b4f',
      photoFrame: '#f7f9fc',
      keepsakeBorder: '#0b1e3d',
    },
    covers: WINTER_COVERS(),
    layouts: WINTER_LAYOUTS(),
  },

  // ─── MOOD ──────────────────────────────────────────────────
  {
    id: 'classic', label: 'Classic', category: 'Mood', icon: '📖',
    accentColor: '#c0813a', accentColorSecondary: '#4a7c59',
    backgroundColor: '#f5f0e8', backgroundTexture: null,
    fontHeading: 'Playfair Display', fontBody: 'Lora',
    stickers: ['compass', 'camera', 'stamp', 'polaroid', 'pin'],
    templates: ['day', 'restaurant', 'hike'],
  },
  {
    id: 'minimal', label: 'Minimal', category: 'Mood', icon: '◻️',
    accentColor: '#1a1a1a', accentColorSecondary: '#555555',
    backgroundColor: '#ffffff', backgroundTexture: null,
    fontHeading: 'Raleway', fontBody: 'Nunito',
    stickers: ['pin', 'arrow', 'frame', 'camera', 'star'],
    templates: ['freewrite', 'view-from-room', 'day'],
  },
  {
    id: 'vintage', label: 'Vintage', category: 'Mood', icon: '🗝️',
    accentColor: '#8b6914', accentColorSecondary: '#5c4033',
    backgroundColor: '#f7edd6', backgroundTexture: 'linen',
    fontHeading: 'EB Garamond', fontBody: 'EB Garamond',
    stickers: ['stamp', 'ticket', 'polaroid', 'tape', 'compass'],
    templates: ['flight', 'hotel', 'museum'],
  },
  {
    id: 'modern', label: 'Modern', category: 'Mood', icon: '⬛',
    accentColor: '#2563eb', accentColorSecondary: '#7c3aed',
    backgroundColor: '#f8fafc', backgroundTexture: 'dots',
    fontHeading: 'Montserrat', fontBody: 'Montserrat',
    stickers: ['arrow', 'frame', 'pin', 'camera', 'star'],
    templates: ['city-walk', 'landmark', 'cafe'],
  },
  {
    id: 'nature', label: 'Nature', category: 'Mood', icon: '🌿',
    accentColor: '#16a34a', accentColorSecondary: '#166534',
    backgroundColor: '#f0fdf4', backgroundTexture: 'grid',
    fontHeading: 'Merriweather', fontBody: 'Nunito',
    stickers: ['compass', 'wave', 'sun', 'arrow', 'pin'],
    templates: ['hike', 'sunset', 'beach'],
  },
  {
    id: 'noir', label: 'Noir', category: 'Mood', icon: '🌙',
    accentColor: '#a78bfa', accentColorSecondary: '#60a5fa',
    backgroundColor: '#18181b', backgroundTexture: null,
    fontHeading: 'Raleway', fontBody: 'Nunito',
    stickers: ['camera', 'frame', 'star', 'pin', 'stamp'],
    templates: ['city-walk', 'landmark', 'freewrite'],
  },
  {
    id: 'coastal', label: 'Coastal', category: 'Mood', icon: '🌊',
    accentColor: '#0ea5e9', accentColorSecondary: '#0284c7',
    backgroundColor: '#fefce8', backgroundTexture: null,
    fontHeading: 'Raleway', fontBody: 'Nunito',
    stickers: ['wave', 'sun', 'star', 'pin', 'camera'],
    templates: ['beach', 'sunset', 'market'],
  },
  {
    id: 'alpine', label: 'Alpine', category: 'Mood', icon: '⛰️',
    accentColor: '#15803d', accentColorSecondary: '#166534',
    backgroundColor: '#fefdf8', backgroundTexture: 'linen',
    fontHeading: 'Merriweather', fontBody: 'Lora',
    stickers: ['compass', 'arrow', 'frame', 'pin', 'star'],
    templates: ['hike', 'hotel', 'sunset'],
  },
  {
    id: 'tropical', label: 'Tropical', category: 'Mood', icon: '🌴',
    accentColor: '#f97316', accentColorSecondary: '#0d9488',
    backgroundColor: '#fff7ed', backgroundTexture: null,
    fontHeading: 'Dancing Script', fontBody: 'Nunito',
    stickers: ['sun', 'wave', 'star', 'heart', 'pin'],
    templates: ['beach', 'sunset', 'market'],
  },
  {
    id: 'desert', label: 'Desert', category: 'Mood', icon: '🏜️',
    accentColor: '#c2410c', accentColorSecondary: '#92400e',
    backgroundColor: '#fef3c7', backgroundTexture: 'lines',
    fontHeading: 'EB Garamond', fontBody: 'EB Garamond',
    stickers: ['compass', 'arrow', 'sun', 'pin', 'tape'],
    templates: ['transit', 'hike', 'market'],
  },
  {
    id: 'nordic', label: 'Nordic', category: 'Mood', icon: '🧊',
    accentColor: '#3b82f6', accentColorSecondary: '#6366f1',
    backgroundColor: '#f0f4ff', backgroundTexture: 'dots',
    fontHeading: 'Montserrat', fontBody: 'Montserrat',
    stickers: ['star', 'frame', 'compass', 'pin', 'camera'],
    templates: ['hotel', 'sunset', 'freewrite'],
  },
]

// ─── Sticker ordering ──────────────────────────────────────────────────────

export function orderStickersForTheme(themeId, stickerList) {
  const theme = THEMES.find(t => t.id === themeId)
  const curated = theme?.stickers ?? []
  if (!curated.length) return stickerList
  const curatedSet = new Set(curated)
  return [
    ...curated.map(id => stickerList.find(s => s.id === id)).filter(Boolean),
    ...stickerList.filter(s => !curatedSet.has(s.id)),
  ]
}

// ─── Path helpers (dependency-free get/set by dot-path) ────────────────────

export function getByPath(obj, path) {
  return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj)
}

export function setByPath(obj, path, value) {
  const keys = path.split('.')
  let cur = obj
  for (let i = 0; i < keys.length - 1; i++) {
    if (cur[keys[i]] == null || typeof cur[keys[i]] !== 'object') cur[keys[i]] = {}
    cur = cur[keys[i]]
  }
  cur[keys[keys.length - 1]] = value
}

// ─── Decoration levels ───────────────────────────────────────────────────

const LEVEL_RANK = { minimal: 0, standard: 1, rich: 2 }

// Resolves a theme layout/cover's raw `elements` (with `$token` color refs and optional
// `minDecorationLevel`) into real, literal-valued elements ready to save — filtering by
// decoration level and recording per-field provenance (`themeTokenProvenance`) for the
// restyle engine. Element renderers only ever see the resolved literals in `data`.
export function resolveThemedElements(rawElements, theme, layoutId, decorationLevel = 'standard') {
  const rank = LEVEL_RANK[decorationLevel] ?? LEVEL_RANK.standard
  return rawElements
    .filter(el => rank >= (LEVEL_RANK[el.minDecorationLevel] ?? LEVEL_RANK.minimal))
    .map(el => {
      const data = JSON.parse(JSON.stringify(el.data ?? {}))
      const themeTokenProvenance = {}

      function walk(node, prefix) {
        for (const key of Object.keys(node)) {
          const val = node[key]
          const path = prefix ? `${prefix}.${key}` : key
          if (typeof val === 'string' && val.startsWith('$')) {
            const token = val.slice(1)
            const resolved = theme.tokens?.[token]
            if (resolved) {
              node[key] = resolved
              themeTokenProvenance[`data.${path}`] = { token, sourceThemeId: theme.id, appliedValue: resolved }
            }
          } else if (val && typeof val === 'object' && !Array.isArray(val)) {
            walk(val, path)
          }
        }
      }
      walk(data, '')

      const hasProvenance = Object.keys(themeTokenProvenance).length > 0
      return {
        type: el.type,
        grid: { ...el.grid },
        data,
        ...(hasProvenance ? {
          sourceThemeId: theme.id,
          sourceTemplateId: layoutId,
          themeManaged: true,
          themeTokenProvenance,
        } : {}),
      }
    })
}

// ─── Restyle engine (pure — no Firestore here) ──────────────────────────

// Given one saved element and a target theme, returns null if the element isn't
// theme-managed, {unsupported: true} if the target theme has no usable token system,
// or a full restyle result: which fields were restyled/preserved/unsupported, and the
// element's new `data`/`themeTokenProvenance`/`sourceThemeId` if anything changed.
export function computeElementRestyle(element, targetTheme) {
  if (!element.themeManaged || !element.themeTokenProvenance) return null
  if (!targetTheme?.tokens) return { unsupported: true }

  const newData = JSON.parse(JSON.stringify(element.data ?? {}))
  const newProvenance = { ...element.themeTokenProvenance }
  const restyledPaths = []
  const preservedPaths = []
  const unsupportedPaths = []
  let anyChanged = false

  for (const [path, prov] of Object.entries(element.themeTokenProvenance)) {
    const dataPath = path.startsWith('data.') ? path.slice(5) : path
    const current = getByPath(newData, dataPath)
    if (current !== prov.appliedValue) {
      preservedPaths.push(path)
      continue
    }
    const targetValue = targetTheme.tokens[prov.token]
    if (targetValue == null) {
      unsupportedPaths.push(path)
      continue
    }
    setByPath(newData, dataPath, targetValue)
    newProvenance[path] = { token: prov.token, sourceThemeId: targetTheme.id, appliedValue: targetValue }
    restyledPaths.push(path)
    anyChanged = true
  }

  return {
    changed: anyChanged,
    data: newData,
    themeTokenProvenance: newProvenance,
    sourceThemeId: anyChanged ? targetTheme.id : element.sourceThemeId,
    restyledPaths, preservedPaths, unsupportedPaths,
  }
}

