import { useEffect } from 'react'
import { useEditorStore } from '../../store/editorStore'
import { THEME_FONTS, THEME_PRESETS, loadFont } from '../../utils/fonts'
import { TEXTURES, getTextureStyle } from '../../utils/textures'

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs text-stone-400 mb-1.5">{label}</label>
      {children}
    </div>
  )
}

export default function ThemePanel() {
  const { notebook, updateTheme } = useEditorStore()
  const theme = notebook?.theme ?? {}

  // Load fonts whenever they change
  useEffect(() => {
    loadFont(theme.fontHeading)
    loadFont(theme.fontBody)
  }, [theme.fontHeading, theme.fontBody])

  const applyPreset = (preset) => {
    loadFont(preset.fontHeading)
    loadFont(preset.fontBody)
    updateTheme({
      accentColor: preset.accentColor,
      accentColorSecondary: preset.accentColorSecondary,
      backgroundColor: preset.backgroundColor,
      backgroundTexture: preset.backgroundTexture,
      fontHeading: preset.fontHeading,
      fontBody: preset.fontBody,
    })
  }

  const handleFontChange = (key, value) => {
    loadFont(value)
    updateTheme({ [key]: value })
  }

  const isCurrentPreset = (preset) =>
    theme.accentColor === preset.accentColor &&
    theme.backgroundColor === preset.backgroundColor

  return (
    <div className="p-4 space-y-4 overflow-y-auto">
      <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">Page Theme</p>

      {/* Presets */}
      <Field label="Theme gallery">
        <div className="grid grid-cols-2 gap-2">
          {THEME_PRESETS.map(preset => (
            <button
              key={preset.id}
              title={preset.label}
              onClick={() => applyPreset(preset)}
              className={`relative rounded-lg overflow-hidden transition-all border-2 text-left ${
                isCurrentPreset(preset)
                  ? 'border-amber-500 shadow-md'
                  : 'border-stone-200 hover:border-stone-400'
              }`}
              style={{ backgroundColor: preset.backgroundColor }}
            >
              <div className="px-2 pt-2 pb-1.5">
                <p
                  className="text-xs font-bold leading-tight truncate"
                  style={{ fontFamily: preset.fontHeading, color: preset.accentColor }}
                >
                  {preset.label}
                </p>
                <p
                  className="text-[9px] leading-snug opacity-60 mt-0.5"
                  style={{ fontFamily: preset.fontBody, color: preset.accentColor }}
                >
                  Aa Bb
                </p>
              </div>
              {isCurrentPreset(preset) && (
                <div className="absolute top-1 right-1 w-3 h-3 rounded-full bg-amber-500 flex items-center justify-center">
                  <span className="text-white" style={{ fontSize: 7 }}>✓</span>
                </div>
              )}
            </button>
          ))}
        </div>
      </Field>

      {/* Colors */}
      <Field label="Page background">
        <div className="flex items-center gap-2.5">
          <input
            type="color"
            value={theme.backgroundColor ?? '#ffffff'}
            onChange={e => updateTheme({ backgroundColor: e.target.value })}
            className="w-8 h-8 rounded border border-stone-200 cursor-pointer p-0.5"
          />
          <code className="text-xs text-stone-500">{theme.backgroundColor ?? '#ffffff'}</code>
        </div>
      </Field>

      <Field label="Accent color">
        <div className="flex items-center gap-2.5">
          <input
            type="color"
            value={theme.accentColor ?? '#c0813a'}
            onChange={e => updateTheme({ accentColor: e.target.value })}
            className="w-8 h-8 rounded border border-stone-200 cursor-pointer p-0.5"
          />
          <code className="text-xs text-stone-500">{theme.accentColor ?? '#c0813a'}</code>
        </div>
      </Field>

      {/* Fonts */}
      <Field label="Heading font">
        <select
          value={theme.fontHeading ?? 'Georgia'}
          onChange={e => handleFontChange('fontHeading', e.target.value)}
          className="w-full border border-stone-200 rounded-md px-2 py-1.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
          style={{ fontFamily: theme.fontHeading }}
        >
          {THEME_FONTS.map(f => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>
      </Field>

      <Field label="Body font">
        <select
          value={theme.fontBody ?? 'system-ui'}
          onChange={e => handleFontChange('fontBody', e.target.value)}
          className="w-full border border-stone-200 rounded-md px-2 py-1.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
          style={{ fontFamily: theme.fontBody }}
        >
          {THEME_FONTS.map(f => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>
      </Field>

      {/* Font preview */}
      <div
        className="rounded-lg border border-stone-100 p-3 space-y-0.5"
        style={{ backgroundColor: theme.backgroundColor ?? '#f5f0e8' }}
      >
        <p
          className="text-sm font-bold leading-tight"
          style={{
            fontFamily: theme.fontHeading ?? 'Georgia',
            color: theme.accentColor ?? '#c0813a',
          }}
        >
          Page Heading
        </p>
        <p
          className="text-xs leading-relaxed"
          style={{
            fontFamily: theme.fontBody ?? 'system-ui',
            color: theme.accentColor ? `${theme.accentColor}bb` : '#555',
          }}
        >
          Body text appears here. Travel memories last a lifetime.
        </p>
      </div>

      {/* Texture */}
      <Field label="Page texture">
        <div className="grid grid-cols-5 gap-1">
          {TEXTURES.map(t => {
            const active = (theme.backgroundTexture ?? null) === t.id
            const swatch = {
              backgroundColor: theme.backgroundColor ?? '#f5f0e8',
              ...getTextureStyle(t.id),
            }
            return (
              <button
                key={String(t.id)}
                title={t.label}
                onClick={() => updateTheme({ backgroundTexture: t.id })}
                className={`h-9 rounded border-2 text-[9px] font-medium transition-all ${
                  active
                    ? 'border-amber-500'
                    : 'border-stone-200 hover:border-stone-400'
                }`}
                style={swatch}
              >
                <span className="text-stone-500 mix-blend-multiply">{t.label}</span>
              </button>
            )
          })}
        </div>
      </Field>
    </div>
  )
}
