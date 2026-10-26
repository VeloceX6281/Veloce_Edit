/**
 * Healing and Retouching Utilities:
 * 1. Spot Healing Brush (Seamless boundary texture synthesis & harmonic interpolation)
 * 2. Magic Eraser Tool (BFS flood-fill color tolerance erasure)
 */

import { colorDistance } from './selectionUtils';

/**
 * Executes Spot Healing over a circular blemish area on canvas.
 * Samples surrounding perimeter ring and synthesizes smooth seamless fill.
 */
export function applySpotHealing(canvas, centerX, centerY, radius = 12) {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return false;

  const r = Math.max(3, Math.round(radius));
  const sampleRadius = Math.round(r * 1.6);
  const minX = Math.max(0, Math.floor(centerX - sampleRadius));
  const minY = Math.max(0, Math.floor(centerY - sampleRadius));
  const maxX = Math.min(canvas.width, Math.ceil(centerX + sampleRadius));
  const maxY = Math.min(canvas.height, Math.ceil(centerY + sampleRadius));
  const width = maxX - minX;
  const height = maxY - minY;

  if (width <= 0 || height <= 0) return false;

  const imgData = ctx.getImageData(minX, minY, width, height);
  const data = imgData.data;

  // 1. Collect surrounding boundary samples (annulus between r and sampleRadius)
  const boundarySamples = [];
  const numAngleSteps = 64;

  for (let i = 0; i < numAngleSteps; i++) {
    const theta = (i / numAngleSteps) * Math.PI * 2;
    for (let rad = r + 1; rad <= sampleRadius; rad += 2) {
      const bx = Math.round(centerX + Math.cos(theta) * rad);
      const by = Math.round(centerY + Math.sin(theta) * rad);

      if (bx >= minX && bx < maxX && by >= minY && by < maxY) {
        const lx = bx - minX;
        const ly = by - minY;
        const idx = (ly * width + lx) * 4;
        if (data[idx + 3] > 0) {
          boundarySamples.push({
            x: bx,
            y: by,
            theta,
            rad,
            r: data[idx],
            g: data[idx + 1],
            b: data[idx + 2],
            a: data[idx + 3]
          });
        }
      }
    }
  }

  if (boundarySamples.length === 0) return false;

  // Average boundary color
  let avgR = 0, avgG = 0, avgB = 0, avgA = 0;
  boundarySamples.forEach((s) => {
    avgR += s.r;
    avgG += s.g;
    avgB += s.b;
    avgA += s.a;
  });
  avgR /= boundarySamples.length;
  avgG /= boundarySamples.length;
  avgB /= boundarySamples.length;
  avgA /= boundarySamples.length;

  // 2. Synthesize interior blemish pixels (dist <= r)
  for (let ly = 0; ly < height; ly++) {
    const cy = minY + ly;
    for (let lx = 0; lx < width; lx++) {
      const cx = minX + lx;
      const dist = Math.hypot(cx - centerX, cy - centerY);
      if (dist > r) continue;

      const idx = (ly * width + lx) * 4;
      const angle = Math.atan2(cy - centerY, cx - centerX);
      const normDist = dist / r; // 0 at center, 1 at boundary

      // Find closest boundary samples along opposite and matching angles
      let closest1 = boundarySamples[0];
      let closest2 = boundarySamples[0];
      let minAngleDiff1 = Infinity;
      let minAngleDiff2 = Infinity;
      const oppAngle = angle > 0 ? angle - Math.PI : angle + Math.PI;

      for (let i = 0; i < boundarySamples.length; i++) {
        const s = boundarySamples[i];
        let diff1 = Math.abs(s.theta - angle);
        if (diff1 > Math.PI) diff1 = Math.PI * 2 - diff1;
        if (diff1 < minAngleDiff1) {
          minAngleDiff1 = diff1;
          closest1 = s;
        }

        let diff2 = Math.abs(s.theta - oppAngle);
        if (diff2 > Math.PI) diff2 = Math.PI * 2 - diff2;
        if (diff2 < minAngleDiff2) {
          minAngleDiff2 = diff2;
          closest2 = s;
        }
      }

      // Smooth cubic hermite blend between opposite boundary points and boundary mean
      const t = (Math.cos(normDist * Math.PI) + 1) / 2; // 1 at center, 0 at edge
      const interpR = (closest1.r * normDist + closest2.r * (1 - normDist)) * 0.5 + avgR * 0.5;
      const interpG = (closest1.g * normDist + closest2.g * (1 - normDist)) * 0.5 + avgG * 0.5;
      const interpB = (closest1.b * normDist + closest2.b * (1 - normDist)) * 0.5 + avgB * 0.5;

      // Soft feather blend into original edge
      const weight = 1 - Math.pow(normDist, 2.5);
      data[idx] = Math.round(data[idx] * (1 - weight) + interpR * weight);
      data[idx + 1] = Math.round(data[idx + 1] * (1 - weight) + interpG * weight);
      data[idx + 2] = Math.round(data[idx + 2] * (1 - weight) + interpB * weight);
      data[idx + 3] = Math.max(data[idx + 3], Math.round(avgA));
    }
  }

  ctx.putImageData(imgData, minX, minY);
  return true;
}

/**
 * Executes Magic Eraser BFS flood-fill or global color-match erasure.
 */
export function applyMagicEraser({
  canvas,
  startX,
  startY,
  tolerance = 32,
  contiguous = true,
  isBackground = false,
  backgroundColor = '#ffffff'
}) {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return false;

  const width = canvas.width;
  const height = canvas.height;
  if (startX < 0 || startX >= width || startY < 0 || startY >= height) return false;

  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  const startIndex = (startY * width + startX) * 4;
  const targetR = data[startIndex];
  const targetG = data[startIndex + 1];
  const targetB = data[startIndex + 2];
  const targetA = data[startIndex + 3];

  // Parse background color if base background layer
  let bgR = 255, bgG = 255, bgB = 255;
  if (isBackground && backgroundColor) {
    const num = parseInt(backgroundColor.replace('#', ''), 16);
    if (!isNaN(num)) {
      bgR = (num >> 16) & 255;
      bgG = (num >> 8) & 255;
      bgB = num & 255;
    }
  }

  const matchesTarget = (idx) => {
    const dr = data[idx] - targetR;
    const dg = data[idx + 1] - targetG;
    const db = data[idx + 2] - targetB;
    const da = data[idx + 3] - targetA;
    const dist = Math.sqrt(dr * dr + dg * dg + db * db + da * da * 0.25) / 4.4167;
    return dist <= tolerance;
  };

  const erasePixel = (idx) => {
    if (isBackground) {
      data[idx] = bgR;
      data[idx + 1] = bgG;
      data[idx + 2] = bgB;
      data[idx + 3] = 255;
    } else {
      data[idx] = 0;
      data[idx + 1] = 0;
      data[idx + 2] = 0;
      data[idx + 3] = 0;
    }
  };

  if (!contiguous) {
    // Erase all matching pixels on layer
    for (let i = 0; i < width * height; i++) {
      const idx = i * 4;
      if (matchesTarget(idx)) {
        erasePixel(idx);
      }
    }
  } else {
    // Contiguous BFS queue
    const queue = new Int32Array(width * height);
    const visited = new Uint8Array(width * height);
    let head = 0;
    let tail = 0;

    const startPos = startY * width + startX;
    queue[tail++] = startPos;
    visited[startPos] = 1;

    while (head < tail) {
      const pos = queue[head++];
      const cx = pos % width;
      const cy = Math.floor(pos / width);
      const pIdx = pos * 4;

      erasePixel(pIdx);

      const neighbors = [
        cx > 0 ? pos - 1 : -1,
        cx < width - 1 ? pos + 1 : -1,
        cy > 0 ? pos - width : -1,
        cy < height - 1 ? pos + width : -1
      ];

      for (let i = 0; i < 4; i++) {
        const nPos = neighbors[i];
        if (nPos >= 0 && visited[nPos] === 0) {
          visited[nPos] = 1;
          if (matchesTarget(nPos * 4)) {
            queue[tail++] = nPos;
          }
        }
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return true;
}
