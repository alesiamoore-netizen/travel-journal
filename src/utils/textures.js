export const TEXTURES = [
  { id: null,    label: 'None' },
  { id: 'dots',  label: 'Dots' },
  { id: 'grid',  label: 'Grid' },
  { id: 'lines', label: 'Lines' },
  { id: 'linen', label: 'Linen' },
]

export function getTextureStyle(textureId) {
  switch (textureId) {
    case 'dots':
      return {
        backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.15) 1px, transparent 1px)',
        backgroundSize: '20px 20px',
      }
    case 'grid':
      return {
        backgroundImage:
          'linear-gradient(rgba(0,0,0,0.08) 1px, transparent 1px), ' +
          'linear-gradient(90deg, rgba(0,0,0,0.08) 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }
    case 'lines':
      return {
        backgroundImage: 'linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px)',
        backgroundSize: '100% 28px',
      }
    case 'linen':
      return {
        backgroundImage:
          'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.04) 3px, rgba(0,0,0,0.04) 4px), ' +
          'repeating-linear-gradient(90deg, transparent, transparent 3px, rgba(0,0,0,0.03) 3px, rgba(0,0,0,0.03) 4px)',
      }
    default:
      return {}
  }
}
