export const THEME_CATEGORIES = ['Occasion', 'Mood']

// `stickers`: curated subset of STICKER_LIST ids, shown first when this theme is active.
// `templates`: suggested page-template ids (from layouts.js TEMPLATE_CATEGORIES entries),
// surfaced first when this theme is active.
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
    accentColor: '#0ea5e9', accentColorSecondary: '#f59e0b',
    backgroundColor: '#fefce8', backgroundTexture: null,
    fontHeading: 'Raleway', fontBody: 'Nunito',
    stickers: ['sun', 'wave', 'star', 'pin', 'camera'],
    templates: ['beach', 'sunset', 'hotel'],
  },
  {
    id: 'road-trip', label: 'Road Trip', category: 'Occasion', icon: '🚗',
    accentColor: '#c2410c', accentColorSecondary: '#4a5568',
    backgroundColor: '#f7f3ea', backgroundTexture: 'lines',
    fontHeading: 'Montserrat', fontBody: 'Nunito',
    stickers: ['arrow', 'compass', 'pin', 'camera', 'ticket'],
    templates: ['transit', 'hike', 'city-walk'],
  },
  {
    id: 'city-break', label: 'City Break', category: 'Occasion', icon: '🏙️',
    accentColor: '#1e3a5f', accentColorSecondary: '#9d4f6a',
    backgroundColor: '#f8fafc', backgroundTexture: 'grid',
    fontHeading: 'Montserrat', fontBody: 'Montserrat',
    stickers: ['camera', 'pin', 'ticket', 'frame', 'stamp'],
    templates: ['city-walk', 'landmark', 'museum', 'cafe'],
  },
  {
    id: 'backpacking', label: 'Backpacking', category: 'Occasion', icon: '🎒',
    accentColor: '#16a34a', accentColorSecondary: '#92400e',
    backgroundColor: '#f0fdf4', backgroundTexture: null,
    fontHeading: 'Merriweather', fontBody: 'Nunito',
    stickers: ['compass', 'arrow', 'wave', 'pin', 'plane'],
    templates: ['hike', 'sunset', 'market'],
  },
  {
    id: 'winter-getaway', label: 'Winter Getaway', category: 'Occasion', icon: '❄️',
    accentColor: '#3b82f6', accentColorSecondary: '#6366f1',
    backgroundColor: '#f0f4ff', backgroundTexture: 'dots',
    fontHeading: 'Raleway', fontBody: 'Nunito',
    stickers: ['star', 'frame', 'pin', 'camera', 'wreath'],
    templates: ['hotel', 'sunset', 'freewrite'],
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

export function getThemeStickerOrder(theme) {
  const curated = theme?.stickers ?? []
  return (allStickers) => [
    ...curated.map(id => allStickers.find(s => s.id === id)).filter(Boolean),
    ...allStickers.filter(s => !curated.includes(s.id)),
  ]
}
