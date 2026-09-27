// Lightweight per-month seasonal styling for Monthly Two-Page Spreads.
//
// `tokens` (accent/accentSecondary/background/texture) is the *only* vocabulary the
// theme-resolution machinery (resolveThemedElements/computeElementRestyle in themes.js)
// understands — it's consumed exclusively at the element level, via `$token` string
// references inside monthly layout defs (see layouts.js), resolved against a synthetic
// `{ id, tokens }` object exactly the way a real THEMES entry would be.
//
// `themeOverrides`/`effectiveTheme` (accentColor/accentColorSecondary/backgroundColor/
// backgroundTexture) is a completely different, page-level vocabulary — the one Canvas.jsx/
// PageHeader/PageFooter actually read, matching notebook.theme's own field names.
//
// These two vocabularies must never be crossed directly. monthTokensToOverrides() and
// baseTokensFromTheme() are the only bridge between them.

export const MONTHLY_STYLES = [
  { label: 'January',   tokens: { accent: '#3b6ea5', accentSecondary: '#8a99a8', background: '#eef3f7', texture: 'dots' } },
  { label: 'February',  tokens: { accent: '#6b5b95', accentSecondary: '#b391b3', background: '#f3eef5', texture: 'linen' } },
  { label: 'March',     tokens: { accent: '#5c8a52', accentSecondary: '#a8c98a', background: '#f0f5ec', texture: 'grain' } },
  { label: 'April',     tokens: { accent: '#c76b8f', accentSecondary: '#7fb069', background: '#faf0f3', texture: 'dots' } },
  { label: 'May',       tokens: { accent: '#8fae3d', accentSecondary: '#e0c341', background: '#f6f7ec', texture: 'grain' } },
  { label: 'June',      tokens: { accent: '#2e9e8f', accentSecondary: '#f2c14e', background: '#eef8f6', texture: 'lines' } },
  { label: 'July',      tokens: { accent: '#e07a3e', accentSecondary: '#3a8fb7', background: '#fdf3ea', texture: 'linen' } },
  { label: 'August',    tokens: { accent: '#d4a017', accentSecondary: '#8c5e3c', background: '#fbf6e8', texture: 'grain' } },
  { label: 'September', tokens: { accent: '#b5651d', accentSecondary: '#6b8e4e', background: '#f8f1e6', texture: 'topo' } },
  { label: 'October',   tokens: { accent: '#c1440e', accentSecondary: '#8b4513', background: '#f7ece0', texture: 'grain' } },
  { label: 'November',  tokens: { accent: '#7a5c3e', accentSecondary: '#a67c52', background: '#f2ece3', texture: 'linen' } },
  { label: 'December',  tokens: { accent: '#2f6b4f', accentSecondary: '#a63b3b', background: '#eef3ee', texture: 'dots' } },
]

// tokens (short names, element-resolution vocabulary) -> themeOverrides (Color-suffixed,
// page-level vocabulary). Never write tokens-shaped keys directly into themeOverrides.
export function monthTokensToOverrides(tokens) {
  return {
    accentColor: tokens.accent,
    accentColorSecondary: tokens.accentSecondary,
    backgroundColor: tokens.background,
    backgroundTexture: tokens.texture ?? null,
  }
}

// notebook.theme (page-level vocabulary) -> tokens (element-resolution vocabulary). Used to
// build the target for "Reset to journal theme" — every notebook.theme already has all four
// underlying fields, so this always produces a complete, valid token set, never `undefined`.
export function baseTokensFromTheme(theme) {
  return {
    accent: theme.accentColor,
    accentSecondary: theme.accentColorSecondary ?? theme.accentColor, // defensive: never undefined even if an older/custom theme lacks a secondary
    background: theme.backgroundColor,
    texture: theme.backgroundTexture ?? null,
  }
}
