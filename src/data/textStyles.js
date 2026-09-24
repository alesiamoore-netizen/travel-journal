export const TEXT_STYLES = {
  body: {
    label: 'Body',
    fontSize: 15,
    fontWeight: 400,
    fontStyle: 'normal',
    letterSpacing: '0',
    lineHeight: 1.7,
    textAlign: 'left',
    textTransform: 'none',
    color: '#2c2c2c',
  },
  heading: {
    label: 'Heading',
    fontSize: 38,
    fontWeight: 700,
    fontStyle: 'normal',
    letterSpacing: '-0.02em',
    lineHeight: 1.1,
    textAlign: 'left',
    textTransform: 'none',
    color: '#1a1a1a',
  },
  subheading: {
    label: 'Subhead',
    fontSize: 20,
    fontWeight: 600,
    fontStyle: 'normal',
    letterSpacing: '0.01em',
    lineHeight: 1.3,
    textAlign: 'left',
    textTransform: 'none',
    color: '#2c2c2c',
  },
  caption: {
    label: 'Caption',
    fontSize: 10,
    fontWeight: 400,
    fontStyle: 'normal',
    letterSpacing: '0.12em',
    lineHeight: 1.5,
    textAlign: 'center',
    textTransform: 'uppercase',
    color: '#888888',
  },
  pullquote: {
    label: 'Pull Quote',
    fontSize: 26,
    fontWeight: 400,
    fontStyle: 'italic',
    letterSpacing: '0.01em',
    lineHeight: 1.45,
    textAlign: 'center',
    textTransform: 'none',
    color: '#3a3a3a',
  },
  dateline: {
    label: 'Dateline',
    fontSize: 11,
    fontWeight: 400,
    fontStyle: 'normal',
    letterSpacing: '0.16em',
    lineHeight: 1.4,
    textAlign: 'left',
    textTransform: 'uppercase',
    color: '#c0813a',
  },
}

export function applyTextStyle(style) {
  const preset = TEXT_STYLES[style]
  if (!preset) return {}
  const { label: _label, ...css } = preset
  return css
}
