/**
 * Utilities for content detection, bounding box calculations, and cropping
 */

/**
 * Calculates the bounding box of non-transparent pixel content on a canvas
 */
export function getLayerContentBounds(canvas) {
  if (!canvas) return null;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;

  const w = canvas.width;
  const h = canvas.height;
  let imgData;

  try {
    imgData = ctx.getImageData(0, 0, w, h);
  } catch (err) {
    console.error('Error getting image data for bounds:', err);
    return { x: 40, y: 40, width: w - 80, height: h - 80, empty: true };
  }

  const data = imgData.data;
  let minX = w;
  let minY = h;
  let maxX = -1;
  let maxY = -1;
  let hasPixels = false;

  // Stride loop for efficient scan
  for (let y = 0; y < h; y += 2) {
    for (let x = 0; x < w; x += 2) {
      const alpha = data[(y * w + x) * 4 + 3];
      if (alpha > 10) {
        hasPixels = true;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (!hasPixels) {
    return {
      x: Math.round(w * 0.1),
      y: Math.round(h * 0.1),
      width: Math.round(w * 0.8),
      height: Math.round(h * 0.8),
      empty: true
    };
  }

  const padding = 4;
  return {
    x: Math.max(0, minX - padding),
    y: Math.max(0, minY - padding),
    width: Math.min(w - Math.max(0, minX - padding), maxX - minX + padding * 2 + 1),
    height: Math.min(h - Math.max(0, minY - padding), maxY - minY + padding * 2 + 1),
    empty: false
  };
}

/**
 * Crops a canvas down to specified rectangle bounds
 */
export function cropCanvas(sourceCanvas, cropBox) {
  if (!sourceCanvas || !cropBox) return null;

  const cropped = document.createElement('canvas');
  cropped.width = Math.max(1, Math.round(cropBox.width));
  cropped.height = Math.max(1, Math.round(cropBox.height));

  const ctx = cropped.getContext('2d');
  ctx.drawImage(
    sourceCanvas,
    Math.round(cropBox.x),
    Math.round(cropBox.y),
    cropped.width,
    cropped.height,
    0,
    0,
    cropped.width,
    cropped.height
  );

  return cropped;
}
