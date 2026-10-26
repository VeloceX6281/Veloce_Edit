/**
 * Multi-layer utilities, blend modes, clipping masks, and layer factory helpers
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
 * Creates an empty transparent pixel layer descriptor
 */
export function createNewLayer(name = 'New Layer', customId = null) {
  return {
    id: customId || `layer_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    name,
    type: 'pixel',
    visible: true,
    opacity: 100,
    blendMode: 'normal',
    isBackground: false,
    isClippingMask: false,
    locks: {
      transparent: false,
      pixels: false,
      position: false
    }
  };
}

/**
 * Creates a persistent live re-editable text layer descriptor
 */
export function createLiveTextLayer(textData = {}) {
  const textSnippet = (textData.text || 'Text Layer').trim().slice(0, 14);
  return {
    id: `text_layer_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    name: `Text: ${textSnippet || 'New Text'}`,
    type: 'text',
    textData: {
      text: textData.text || 'Sample Text',
      x: textData.x || 100,
      y: textData.y || 100,
      fontSize: textData.fontSize || 32,
      fontFamily: textData.fontFamily || 'Arial',
      color: textData.color || '#000000',
      align: textData.align || 'left',
      isBold: textData.isBold || false,
      isItalic: textData.isItalic || false,
      width: textData.width || 200,
      height: textData.height || 50
    },
    visible: true,
    opacity: 100,
    blendMode: 'normal',
    isBackground: false,
    isClippingMask: false,
    locks: {
      transparent: false,
      pixels: false,
      position: false
    }
  };
}

/**
 * Creates the default initial background layer (solid white paper)
 */
export function createInitialBackgroundLayer() {
  return {
    id: 'layer_background',
    name: 'Background',
    type: 'pixel',
    visible: true,
    opacity: 100,
    blendMode: 'normal',
    isBackground: true,
    isClippingMask: false,
    locks: {
      transparent: false,
      pixels: false,
      position: true
    }
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

/**
 * Finds the base layer index for a clipping mask layer
 */
export function getClippingBaseIndex(layers, clippingIndex) {
  for (let i = clippingIndex - 1; i >= 0; i--) {
    if (!layers[i].isClippingMask) {
      return i;
    }
  }
  return null;
}

/**
 * Applies a selection clipping path to a 2D canvas rendering context
 */
export function applySelectionPathToContext(ctx, selection, canvasWidth, canvasHeight) {
  if (!selection || selection.width === 0 || selection.height === 0) return;

  ctx.beginPath();

  if (selection.type === 'path' && selection.pathString) {
    try {
      const p2d = new Path2D(selection.pathString);
      ctx.clip(p2d);
      return;
    } catch (e) {
      // Fallback to bounding rect
    }
  }

  const rx = Math.min(selection.x, selection.x + selection.width);
  const ry = Math.min(selection.y, selection.y + selection.height);
  const rw = Math.abs(selection.width);
  const rh = Math.abs(selection.height);

  if (selection.type === 'rect' || selection.type === 'path') {
    if (selection.inverted) {
      ctx.rect(0, 0, canvasWidth, canvasHeight);
      ctx.rect(rx, ry, rw, rh);
      ctx.clip('evenodd');
    } else {
      ctx.rect(rx, ry, rw, rh);
      ctx.clip();
    }
  } else {
    const cx = rx + rw / 2;
    const cy = ry + rh / 2;
    const radX = Math.max(0.1, rw / 2);
    const radY = Math.max(0.1, rh / 2);

    if (selection.inverted) {
      ctx.rect(0, 0, canvasWidth, canvasHeight);
      ctx.ellipse(cx, cy, radX, radY, 0, 0, Math.PI * 2);
      ctx.clip('evenodd');
    } else {
      ctx.ellipse(cx, cy, radX, radY, 0, 0, Math.PI * 2);
      ctx.clip();
    }
  }
}

/**
 * Extracts pixels within a selection boundary from a source canvas into a new canvas
 */
export function extractSelectionPixels(sourceCanvas, selection, canvasWidth, canvasHeight) {
  if (!sourceCanvas) return null;
  const newCanvas = document.createElement('canvas');
  newCanvas.width = canvasWidth;
  newCanvas.height = canvasHeight;
  const ctx = newCanvas.getContext('2d');

  if (selection) {
    ctx.save();
    applySelectionPathToContext(ctx, selection, canvasWidth, canvasHeight);
    ctx.drawImage(sourceCanvas, 0, 0);
    ctx.restore();
  } else {
    ctx.drawImage(sourceCanvas, 0, 0);
  }

  return newCanvas;
}

/**
 * Clears (or fills with background color) pixels inside a selection on a canvas
 */
export function clearSelectionPixels(sourceCanvas, selection, canvasWidth, canvasHeight, isBackground = false, bgColor = '#ffffff') {
  if (!sourceCanvas) return;
  const ctx = sourceCanvas.getContext('2d');
  ctx.save();
  if (selection) {
    applySelectionPathToContext(ctx, selection, canvasWidth, canvasHeight);
  }

  if (isBackground) {
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  } else {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  }

  ctx.restore();
}

/**
 * Resamples a canvas to new dimensions with high-quality smoothing
 */
export function resampleCanvas(sourceCanvas, newWidth, newHeight) {
  if (!sourceCanvas) return null;
  const resampled = document.createElement('canvas');
  resampled.width = newWidth;
  resampled.height = newHeight;
  const ctx = resampled.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(sourceCanvas, 0, 0, sourceCanvas.width, sourceCanvas.height, 0, 0, newWidth, newHeight);
  return resampled;
}

/**
 * Repositions canvas contents inside expanded/trimmed canvas according to a 3x3 anchor
 */
export function anchorCanvas(sourceCanvas, oldW, oldH, newW, newH, anchor = 'C', isBackground = false, bgColor = '#ffffff') {
  let dx = 0;
  let dy = 0;

  // Horizontal calculation
  if (anchor === 'TL' || anchor === 'CL' || anchor === 'BL') {
    dx = 0;
  } else if (anchor === 'TC' || anchor === 'C' || anchor === 'BC') {
    dx = Math.round((newW - oldW) / 2);
  } else {
    dx = newW - oldW;
  }

  // Vertical calculation
  if (anchor === 'TL' || anchor === 'TC' || anchor === 'TR') {
    dy = 0;
  } else if (anchor === 'CL' || anchor === 'C' || anchor === 'CR') {
    dy = Math.round((newH - oldH) / 2);
  } else {
    dy = newH - oldH;
  }

  const result = document.createElement('canvas');
  result.width = newW;
  result.height = newH;
  const ctx = result.getContext('2d');

  if (isBackground) {
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, newW, newH);
  }

  if (sourceCanvas) {
    ctx.drawImage(sourceCanvas, dx, dy);
  }

  return { canvas: result, dx, dy };
}

/**
 * Composites all visible layers into a single flattened canvas
 */
export function compositeAllVisibleLayers(layers, layerCanvasesRef, width, height) {
  const comp = document.createElement('canvas');
  comp.width = width;
  comp.height = height;
  const ctx = comp.getContext('2d');

  layers.forEach((l) => {
    if (!l.visible) return;
    const lCanvas = layerCanvasesRef.current[l.id];
    if (lCanvas) {
      ctx.save();
      ctx.globalAlpha = l.opacity / 100;
      ctx.globalCompositeOperation = getCompositeOperation(l.blendMode);
      ctx.drawImage(lCanvas, 0, 0);
      ctx.restore();
    }
  });

  return comp;
}
