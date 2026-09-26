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
