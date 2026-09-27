export const TEXTURES = [
  { id: null,    label: 'None' },
  { id: 'dots',  label: 'Dots' },
  { id: 'grid',  label: 'Grid' },
  { id: 'lines', label: 'Lines' },
  { id: 'linen', label: 'Linen' },
  { id: 'grain', label: 'Grain' },
  { id: 'topo',  label: 'Topo' },
  { id: 'roadline', label: 'Road Line' },
  { id: 'blueprint', label: 'Blueprint' },
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
    case 'grain':
      // Stippled kraft-paper look — layered small radial dots at offset positions/sizes to avoid an obviously-repeating grid.
      return {
        backgroundImage: [
          'radial-gradient(rgba(0,0,0,0.05) 0.5px, transparent 0.5px)',
          'radial-gradient(rgba(0,0,0,0.035) 0.5px, transparent 0.5px)',
          'radial-gradient(rgba(0,0,0,0.045) 0.5px, transparent 0.5px)',
        ].join(', '),
        backgroundSize: '3px 3px, 7px 7px, 11px 11px',
        backgroundPosition: '0 0, 2px 4px, 5px 1px',
      }
    case 'roadline':
      // Small elongated dash marks tiled in a grid (radial-gradient bounds in both axes,
      // unlike linear-gradient) — evokes lane-marking dashes as a faint all-over paper
      // texture, never a literal continuous line across the page.
      return {
        backgroundImage: 'radial-gradient(ellipse 7px 1.6px at 50% 50%, rgba(0,0,0,0.16), transparent 75%)',
        backgroundSize: '22px 26px',
      }
    case 'blueprint':
      // Two-tier navy-tinted grid — fine 14px lines plus a bolder line every 5 cells (70px),
      // like architectural drafting paper — visually distinct from the plain single-scale
      // black 'grid' texture above (different color, and minor+major lines vs. one scale).
      return {
        backgroundImage: [
          'linear-gradient(rgba(30,58,95,0.10) 1px, transparent 1px)',
          'linear-gradient(90deg, rgba(30,58,95,0.10) 1px, transparent 1px)',
          'linear-gradient(rgba(30,58,95,0.18) 1px, transparent 1px)',
          'linear-gradient(90deg, rgba(30,58,95,0.18) 1px, transparent 1px)',
        ].join(', '),
        backgroundSize: '14px 14px, 14px 14px, 70px 70px, 70px 70px',
      }
    case 'topo':
      // Concentric-ring approximation of topographic contour lines.
      return {
        backgroundImage: [
          'repeating-radial-gradient(circle at 15% 20%, transparent 0, transparent 22px, rgba(0,0,0,0.05) 23px, rgba(0,0,0,0.05) 24px)',
          'repeating-radial-gradient(circle at 85% 75%, transparent 0, transparent 30px, rgba(0,0,0,0.04) 31px, rgba(0,0,0,0.04) 32px)',
        ].join(', '),
      }
    default:
      return {}
  }
}
