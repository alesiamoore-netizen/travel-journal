export const THEME_FONTS = [
  { label: 'System UI',          value: 'system-ui' },
  { label: 'Georgia',            value: 'Georgia' },
  { label: 'Playfair Display',   value: 'Playfair Display' },
  { label: 'Lora',               value: 'Lora' },
  { label: 'EB Garamond',        value: 'EB Garamond' },
  { label: 'Merriweather',       value: 'Merriweather' },
  { label: 'Libre Baskerville',  value: 'Libre Baskerville' },
  { label: 'Raleway',            value: 'Raleway' },
  { label: 'Montserrat',         value: 'Montserrat' },
  { label: 'Nunito',             value: 'Nunito' },
  { label: 'Dancing Script',     value: 'Dancing Script' },
]

const GOOGLE_FONTS = new Set([
  'Playfair Display', 'Lora', 'EB Garamond', 'Merriweather',
  'Libre Baskerville', 'Raleway', 'Montserrat', 'Nunito', 'Dancing Script',
])

export function loadFont(name) {
  if (!name || !GOOGLE_FONTS.has(name)) return
  const id = `gfont-${name.replace(/\s+/g, '-')}`
  if (document.getElementById(id)) return
  const link = document.createElement('link')
  link.id = id
  link.rel = 'stylesheet'
  link.href = `https://fonts.googleapis.com/css2?family=${name.replace(/ /g, '+')}:ital,wght@0,400;0,600;0,700;1,400&display=swap`
  document.head.appendChild(link)
}

export const THEME_PRESETS = [
  {
    id: 'classic', label: 'Classic',
    accentColor: '#c0813a', accentColorSecondary: '#4a7c59',
    backgroundColor: '#f5f0e8', backgroundTexture: null,
    fontHeading: 'Playfair Display', fontBody: 'Lora',
  },
  {
    id: 'minimal', label: 'Minimal',
    accentColor: '#1a1a1a', accentColorSecondary: '#555555',
    backgroundColor: '#ffffff', backgroundTexture: null,
    fontHeading: 'Raleway', fontBody: 'Nunito',
  },
  {
    id: 'vintage', label: 'Vintage',
    accentColor: '#8b6914', accentColorSecondary: '#5c4033',
    backgroundColor: '#f7edd6', backgroundTexture: 'linen',
    fontHeading: 'EB Garamond', fontBody: 'EB Garamond',
  },
  {
    id: 'modern', label: 'Modern',
    accentColor: '#2563eb', accentColorSecondary: '#7c3aed',
    backgroundColor: '#f8fafc', backgroundTexture: 'dots',
    fontHeading: 'Montserrat', fontBody: 'Montserrat',
  },
  {
    id: 'nature', label: 'Nature',
    accentColor: '#16a34a', accentColorSecondary: '#166534',
    backgroundColor: '#f0fdf4', backgroundTexture: 'grid',
    fontHeading: 'Merriweather', fontBody: 'Nunito',
  },
  {
    id: 'noir', label: 'Noir',
    accentColor: '#a78bfa', accentColorSecondary: '#60a5fa',
    backgroundColor: '#18181b', backgroundTexture: null,
    fontHeading: 'Raleway', fontBody: 'Nunito',
  },
]
