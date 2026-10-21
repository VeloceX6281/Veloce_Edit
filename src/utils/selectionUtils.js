/**
 * Selection utilities: BFS Magic Wand Flood Fill, Contours, and Masking
 */

/**
 * Calculates color Euclidean distance between two RGBA pixels (0 to 100 scale)
 */
export function colorDistance(r1, g1, b1, a1, r2, g2, b2, a2) {
  const dr = r1 - r2;
  const dg = g1 - g2;
  const db = b1 - db_val(b2);
  const da = a1 - a2;
  function db_val(v) { return v; }
  return Math.sqrt(dr * dr + dg * dg + db * db + (da * da) * 0.5) / 4.4167;
}

/**
 * Computes Magic Wand selection mask using fast BFS flood fill or global tolerance match
 */
export function computeMagicWandSelection({
  imageData,
  startX,
  startY,
  tolerance = 32,
  contiguous = true
}) {
  const { width, height, data } = imageData;
  if (startX < 0 || startX >= width || startY < 0 || startY >= height) {
    return null;
  }

  const startIndex = (startY * width + startX) * 4;
  const targetR = data[startIndex];
  const targetG = data[startIndex + 1];
  const targetB = data[startIndex + 2];
  const targetA = data[startIndex + 3];

  const mask = new Uint8Array(width * height);
  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;
  let selectedCount = 0;

  const matchesTarget = (idx) => {
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    const a = data[idx + 3];

    const dr = r - targetR;
    const dg = g - targetG;
    const db = b - targetB;
    const da = a - targetA;
    // Euclidean distance normalized:
    const dist = Math.sqrt(dr * dr + dg * dg + db * db + da * da * 0.25) / 4.4167;
    return dist <= tolerance;
  };

  if (!contiguous) {
    // Non-contiguous: Match all pixels in canvas within tolerance
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const pIdx = (y * width + x) * 4;
        if (matchesTarget(pIdx)) {
          mask[y * width + x] = 1;
          selectedCount++;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
  } else {
    // Contiguous: Fast BFS flood fill using Int32Array queue
    const queue = new Int32Array(width * height);
    let head = 0;
    let tail = 0;

    const startPos = startY * width + startX;
    queue[tail++] = startPos;
    mask[startPos] = 1;

    while (head < tail) {
      const pos = queue[head++];
      const cx = pos % width;
      const cy = Math.floor(pos / width);

      selectedCount++;
      if (cx < minX) minX = cx;
      if (cx > maxX) maxX = cx;
      if (cy < minY) minY = cy;
      if (cy > maxY) maxY = cy;

      // 4-connected neighbors
      const neighbors = [
        cx > 0 ? pos - 1 : -1,
        cx < width - 1 ? pos + 1 : -1,
        cy > 0 ? pos - width : -1,
        cy < height - 1 ? pos + width : -1
      ];

      for (let i = 0; i < 4; i++) {
        const nPos = neighbors[i];
        if (nPos >= 0 && mask[nPos] === 0) {
          const pIdx = nPos * 4;
          if (matchesTarget(pIdx)) {
            mask[nPos] = 1;
            queue[tail++] = nPos;
          }
        }
      }
    }
  }

  if (selectedCount === 0) {
    return null;
  }

  // Generate boundary segments for SVG path rendering and Path2D clipping
  const pathD = generateContourPath(mask, width, height, minX, minY, maxX, maxY);

  return {
    type: 'path',
    mask,
    x: minX,
    y: minY,
    width: maxX - minX + 1,
    height: maxY - minY + 1,
    pathString: pathD,
    inverted: false,
    selectedCount
  };
}

/**
 * Builds SVG path string tracing outer boundary of mask
 */
function generateContourPath(mask, width, height, minX, minY, maxX, maxY) {
  // Find border pixels (a pixel in mask with at least 1 non-mask 4-neighbor)
  const segments = [];
  const padMinX = Math.max(0, minX - 1);
  const padMaxX = Math.min(width - 1, maxX + 1);
  const padMinY = Math.max(0, minY - 1);
  const padMaxY = Math.min(height - 1, maxY + 1);

  // Scan grid lines (horizontal and vertical edges between selected and unselected)
  for (let y = padMinY; y <= padMaxY; y++) {
    for (let x = padMinX; x <= padMaxX; x++) {
      const isCur = x < width && y < height && mask[y * width + x] === 1;
      const isRight = x + 1 < width && y < height && mask[y * width + (x + 1)] === 1;
      const isBottom = x < width && y + 1 < height && mask[(y + 1) * width + x] === 1;

      // Vertical edge between (x, y) and (x+1, y)
      if (isCur !== isRight) {
        segments.push(`M ${x + 1} ${y} L ${x + 1} ${y + 1}`);
      }
      // Horizontal edge between (x, y) and (x, y+1)
      if (isCur !== isBottom) {
        segments.push(`M ${x} ${y + 1} L ${x + 1} ${y + 1}`);
      }
    }
  }

  if (segments.length === 0) {
    return `M ${minX} ${minY} H ${maxX + 1} V ${maxY + 1} H ${minX} Z`;
  }

  // Combine segments into SVG path
  return segments.join(' ');
}
