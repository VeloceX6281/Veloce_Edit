/**
 * Multi-layer utilities, blend modes, and layer factory helpers
 */

export const BLEND_MODES = [
  { id: 'normal', name: 'Normal' },
  { id: 'multiply', name: 'Multiply' },
  { id: 'screen', name: 'Screen' },
  { id: 'overlay', name: 'Overlay' },
  { id: 'darken', name: 'Darken' },
  { id: 'lighten', name: 'Lighten' },
  { id: 'color-dodge', name: 'Color Dodge' },
  { id: 'color-burn', name: 'Color Burn' },
  { id: 'difference', name: 'Difference' },
  { id: 'exclusion', name: 'Exclusion' }
];

/**
 * Maps CSS/Studio blend mode name to Canvas 2D globalCompositeOperation
 */
export function getCompositeOperation(blendMode) {
  switch (blendMode) {
    case 'multiply':
      return 'multiply';
    case 'screen':
      return 'screen';
    case 'overlay':
      return 'overlay';
    case 'darken':
      return 'darken';
    case 'lighten':
      return 'lighten';
    case 'color-dodge':
      return 'color-dodge';
    case 'color-burn':
      return 'color-burn';
    case 'difference':
      return 'difference';
    case 'exclusion':
      return 'exclusion';
    default:
      return 'source-over';
  }
}

/**
 * Creates an empty transparent layer descriptor
 */
export function createNewLayer(name = 'New Layer', customId = null) {
  return {
    id: customId || `layer_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    name,
    visible: true,
    opacity: 100,
    blendMode: 'normal',
    isBackground: false
  };
}

/**
 * Creates the default initial background layer (solid white paper)
 */
export function createInitialBackgroundLayer() {
  return {
    id: 'layer_background',
    name: 'Background',
    visible: true,
    opacity: 100,
    blendMode: 'normal',
    isBackground: true
  };
}

/**
 * Clones a canvas into a new canvas element with identical contents
 */
export function cloneCanvas(sourceCanvas) {
  if (!sourceCanvas) return null;
  const clone = document.createElement('canvas');
  clone.width = sourceCanvas.width;
  clone.height = sourceCanvas.height;
  const ctx = clone.getContext('2d');
  ctx.drawImage(sourceCanvas, 0, 0);
  return clone;
}
