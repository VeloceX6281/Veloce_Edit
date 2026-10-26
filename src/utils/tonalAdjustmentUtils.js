/**
 * Tonal adjustments and pixel manipulation algorithms for Photoshop parity
 * Includes: Histogram, Levels, Curves (monotonic cubic spline LUT),
 * Hue/Saturation/Lightness, Color Balance, and Desaturate.
 */

/**
 * Computes a 256-bin brightness/luminance histogram from an ImageData object
 */
export function computeHistogram(imageData) {
  const bins = new Uint32Array(256);
  if (!imageData || !imageData.data) return bins;

  const data = imageData.data;
  const len = data.length;

  for (let i = 0; i < len; i += 4) {
    if (data[i + 3] === 0) continue; // Skip completely transparent pixels
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const lum = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
    bins[Math.max(0, Math.min(255, lum))]++;
  }

  return bins;
}

/**
 * Computes a 256-entry lookup table (LUT) for Photoshop Levels
 */
export function buildLevelsLUT(inBlack = 0, gamma = 1.0, inWhite = 255, outBlack = 0, outWhite = 255) {
  const lut = new Uint8Array(256);
  const minIn = Math.min(inBlack, inWhite - 1);
  const maxIn = Math.max(minIn + 1, inWhite);
  const safeGamma = Math.max(0.1, Math.min(9.9, gamma));
  const invGamma = 1.0 / safeGamma;
  const inRange = maxIn - minIn;
  const outRange = outWhite - outBlack;

  for (let i = 0; i < 256; i++) {
    // 1. Normalize input relative to shadow and highlight inputs
    let norm = (i - minIn) / inRange;
    norm = Math.max(0, Math.min(1, norm));

    // 2. Apply midtone gamma curve
    norm = Math.pow(norm, invGamma);

    // 3. Map to output levels
    let out = outBlack + norm * outRange;
    lut[i] = Math.max(0, Math.min(255, Math.round(out)));
  }

  return lut;
}

/**
 * Applies Levels adjustment to ImageData in-place using a precalculated LUT
 */
export function applyLevels(imageData, inBlack, gamma, inWhite, outBlack, outWhite) {
  if (!imageData) return;
  const lut = buildLevelsLUT(inBlack, gamma, inWhite, outBlack, outWhite);
  const data = imageData.data;
  const len = data.length;

  for (let i = 0; i < len; i += 4) {
    if (data[i + 3] === 0) continue;
    data[i] = lut[data[i]];
    data[i + 1] = lut[data[i + 1]];
    data[i + 2] = lut[data[i + 2]];
  }
}

/**
 * Monotonic cubic Hermite spline interpolation for smooth, overshoot-free Curves
 */
export function buildCurvesLUT(points = [{ x: 0, y: 0 }, { x: 255, y: 255 }]) {
  const lut = new Uint8Array(256);
  if (!points || points.length === 0) {
    for (let i = 0; i < 256; i++) lut[i] = i;
    return lut;
  }

  // Sort points by x coordinate
  const pts = [...points].sort((a, b) => a.x - b.x);

  // If only 1 point, flat line
  if (pts.length === 1) {
    const val = Math.max(0, Math.min(255, Math.round(pts[0].y)));
    lut.fill(val);
    return lut;
  }

  const n = pts.length;
  const xs = pts.map((p) => p.x);
  const ys = pts.map((p) => p.y);

  // Calculate slopes
  const ms = new Float64Array(n);
  const dxs = new Float64Array(n - 1);
  const dys = new Float64Array(n - 1);

  for (let i = 0; i < n - 1; i++) {
    dxs[i] = Math.max(1e-5, xs[i + 1] - xs[i]);
    dys[i] = ys[i + 1] - ys[i];
    ms[i] = dys[i] / dxs[i];
  }

  // Calculate tangents
  const tangents = new Float64Array(n);
  tangents[0] = ms[0];
  tangents[n - 1] = ms[n - 2];

  for (let i = 1; i < n - 1; i++) {
    if (ms[i - 1] * ms[i] <= 0) {
      tangents[i] = 0;
    } else {
      tangents[i] = (ms[i - 1] + ms[i]) / 2;
    }
  }

  // Monotonicity adjustment (Fritsch-Carlson)
  for (let i = 0; i < n - 1; i++) {
    if (Math.abs(dys[i]) < 1e-5) {
      tangents[i] = 0;
      tangents[i + 1] = 0;
    } else {
      const alpha = tangents[i] / ms[i];
      const beta = tangents[i + 1] / ms[i];
      const dist = alpha * alpha + beta * beta;
      if (dist > 9) {
        const tau = 3 / Math.sqrt(dist);
        tangents[i] = tau * alpha * ms[i];
        tangents[i + 1] = tau * beta * ms[i];
      }
    }
  }

  // Interpolate for all 0..255
  let seg = 0;
  for (let x = 0; x < 256; x++) {
    if (x <= xs[0]) {
      lut[x] = Math.max(0, Math.min(255, Math.round(ys[0])));
      continue;
    }
    if (x >= xs[n - 1]) {
      lut[x] = Math.max(0, Math.min(255, Math.round(ys[n - 1])));
      continue;
    }

    while (seg < n - 2 && x > xs[seg + 1]) {
      seg++;
    }

    const h = dxs[seg];
    const t = (x - xs[seg]) / h;
    const t2 = t * t;
    const t3 = t2 * t;

    const h00 = 2 * t3 - 3 * t2 + 1;
    const h10 = t3 - 2 * t2 + t;
    const h01 = -2 * t3 + 3 * t2;
    const h11 = t3 - t2;

    const yVal = h00 * ys[seg] + h10 * h * tangents[seg] + h01 * ys[seg + 1] + h11 * h * tangents[seg + 1];
    lut[x] = Math.max(0, Math.min(255, Math.round(yVal)));
  }

  return lut;
}

/**
 * Applies Curves adjustment to ImageData in-place
 */
export function applyCurves(imageData, controlPoints) {
  if (!imageData) return;
  const lut = buildCurvesLUT(controlPoints);
  const data = imageData.data;
  const len = data.length;

  for (let i = 0; i < len; i += 4) {
    if (data[i + 3] === 0) continue;
    data[i] = lut[data[i]];
    data[i + 1] = lut[data[i + 1]];
    data[i + 2] = lut[data[i + 2]];
  }
}

/**
 * RGB to HSL helper
 */
function rgbToHsl(r, g, b) {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;

  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rn:
        h = (gn - bn) / d + (gn < bn ? 6 : 0);
        break;
      case gn:
        h = (bn - rn) / d + 2;
        break;
      case bn:
        h = (rn - gn) / d + 4;
        break;
    }
    h *= 60;
  }

  return [h, s, l];
}

/**
 * HSL to RGB helper
 */
function hslToRgb(h, s, l) {
  let r, g, b;

  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const hue2rgb = (p, q, t) => {
      let tNorm = t;
      if (tNorm < 0) tNorm += 1;
      if (tNorm > 1) tNorm -= 1;
      if (tNorm < 1 / 6) return p + (q - p) * 6 * tNorm;
      if (tNorm < 1 / 2) return q;
      if (tNorm < 2 / 3) return p + (q - p) * (2 / 3 - tNorm) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    const hNorm = (h % 360) / 360;

    r = hue2rgb(p, q, hNorm + 1 / 3);
    g = hue2rgb(p, q, hNorm);
    b = hue2rgb(p, q, hNorm - 1 / 3);
  }

  return [
    Math.max(0, Math.min(255, Math.round(r * 255))),
    Math.max(0, Math.min(255, Math.round(g * 255))),
    Math.max(0, Math.min(255, Math.round(b * 255)))
  ];
}

/**
 * Applies Hue/Saturation/Lightness adjustment to ImageData
 * hueShift: -180 to 180
 * satShift: -100 to 100
 * lightShift: -100 to 100
 * isColorize: boolean
 */
export function applyHueSaturation(imageData, hueShift = 0, satShift = 0, lightShift = 0, isColorize = false) {
  if (!imageData) return;
  const data = imageData.data;
  const len = data.length;

  for (let i = 0; i < len; i += 4) {
    if (data[i + 3] === 0) continue;

    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    if (isColorize) {
      // Colorize converts luminance to monochromatic hue
      const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      const targetHue = (hueShift + 360) % 360;
      const targetSat = Math.max(0, Math.min(1, (satShift + 100) / 200));

      let targetLight = lum;
      if (lightShift > 0) {
        targetLight = targetLight + (1 - targetLight) * (lightShift / 100);
      } else if (lightShift < 0) {
        targetLight = targetLight * (1 + lightShift / 100);
      }
      targetLight = Math.max(0, Math.min(1, targetLight));

      const [nr, ng, nb] = hslToRgb(targetHue, targetSat, targetLight);
      data[i] = nr;
      data[i + 1] = ng;
      data[i + 2] = nb;
    } else {
      let [h, s, l] = rgbToHsl(r, g, b);

      // Shift Hue
      h = (h + hueShift + 360) % 360;

      // Shift Saturation
      if (satShift > 0) {
        s = s + (1 - s) * (satShift / 100);
      } else if (satShift < 0) {
        s = s * (1 + satShift / 100);
      }
      s = Math.max(0, Math.min(1, s));

      // Shift Lightness
      if (lightShift > 0) {
        l = l + (1 - l) * (lightShift / 100);
      } else if (lightShift < 0) {
        l = l * (1 + lightShift / 100);
      }
      l = Math.max(0, Math.min(1, l));

      const [nr, ng, nb] = hslToRgb(h, s, l);
      data[i] = nr;
      data[i + 1] = ng;
      data[i + 2] = nb;
    }
  }
}

/**
 * Applies Color Balance adjustment across Shadows, Midtones, and Highlights
 * values: {
 *   shadows: { cyanRed: 0, magentaGreen: 0, yellowBlue: 0 },
 *   midtones: { cyanRed: 0, magentaGreen: 0, yellowBlue: 0 },
 *   highlights: { cyanRed: 0, magentaGreen: 0, yellowBlue: 0 },
 *   preserveLuminosity: true
 * }
 */
export function applyColorBalance(imageData, balanceSettings) {
  if (!imageData || !balanceSettings) return;
  const {
    shadows = { cyanRed: 0, magentaGreen: 0, yellowBlue: 0 },
    midtones = { cyanRed: 0, magentaGreen: 0, yellowBlue: 0 },
    highlights = { cyanRed: 0, magentaGreen: 0, yellowBlue: 0 },
    preserveLuminosity = true
  } = balanceSettings;

  const data = imageData.data;
  const len = data.length;

  for (let i = 0; i < len; i += 4) {
    if (data[i + 3] === 0) continue;

    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    const normLum = lum / 255;

    // Weight factors for tonal ranges
    // Shadows peak at 0, Midtones peak at 0.5, Highlights peak at 1.0
    const wShadow = Math.max(0, 1 - normLum * 2);
    const wMidtone = Math.max(0, 1 - Math.abs(normLum - 0.5) * 2);
    const wHighlight = Math.max(0, (normLum - 0.5) * 2);

    const shiftR =
      shadows.cyanRed * wShadow * 0.4 +
      midtones.cyanRed * wMidtone * 0.4 +
      highlights.cyanRed * wHighlight * 0.4;

    const shiftG =
      shadows.magentaGreen * wShadow * 0.4 +
      midtones.magentaGreen * wMidtone * 0.4 +
      highlights.magentaGreen * wHighlight * 0.4;

    const shiftB =
      shadows.yellowBlue * wShadow * 0.4 +
      midtones.yellowBlue * wMidtone * 0.4 +
      highlights.yellowBlue * wHighlight * 0.4;

    let nr = Math.max(0, Math.min(255, r + shiftR));
    let ng = Math.max(0, Math.min(255, g + shiftG));
    let nb = Math.max(0, Math.min(255, b + shiftB));

    if (preserveLuminosity) {
      const newLum = 0.299 * nr + 0.587 * ng + 0.114 * nb;
      if (newLum > 0) {
        const factor = lum / newLum;
        nr = Math.max(0, Math.min(255, nr * factor));
        ng = Math.max(0, Math.min(255, ng * factor));
        nb = Math.max(0, Math.min(255, nb * factor));
      }
    }

    data[i] = Math.round(nr);
    data[i + 1] = Math.round(ng);
    data[i + 2] = Math.round(nb);
  }
}

/**
 * Instant Desaturate: converts active layer pixels to grayscale preserving luminosity
 */
export function applyDesaturate(canvasOrImageData) {
  let ctx, imgData;
  if (canvasOrImageData && canvasOrImageData.getContext) {
    ctx = canvasOrImageData.getContext('2d', { willReadFrequently: true });
    imgData = ctx.getImageData(0, 0, canvasOrImageData.width, canvasOrImageData.height);
  } else {
    imgData = canvasOrImageData;
  }
  if (!imgData || !imgData.data) return;
  const data = imgData.data;
  const len = data.length;

  for (let i = 0; i < len; i += 4) {
    if (data[i + 3] === 0) continue;
    const lum = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
    data[i] = lum;
    data[i + 1] = lum;
    data[i + 2] = lum;
  }

  if (ctx) {
    ctx.putImageData(imgData, 0, 0);
  }
}

/**
 * Invert Colors (Ctrl+I): inverts RGB color values of the active layer
 */
export function applyInvertColors(canvasOrImageData) {
  let ctx, imgData;
  if (canvasOrImageData && canvasOrImageData.getContext) {
    ctx = canvasOrImageData.getContext('2d', { willReadFrequently: true });
    imgData = ctx.getImageData(0, 0, canvasOrImageData.width, canvasOrImageData.height);
  } else {
    imgData = canvasOrImageData;
  }
  if (!imgData || !imgData.data) return;
  const data = imgData.data;
  const len = data.length;

  for (let i = 0; i < len; i += 4) {
    if (data[i + 3] === 0) continue;
    data[i] = 255 - data[i];
    data[i + 1] = 255 - data[i + 1];
    data[i + 2] = 255 - data[i + 2];
  }

  if (ctx) {
    ctx.putImageData(imgData, 0, 0);
  }
}

/**
 * Auto Tone (Shift+Ctrl+L): stretches per-channel RGB levels across non-transparent pixels
 */
export function applyAutoTone(canvasOrImageData) {
  let ctx, imgData;
  if (canvasOrImageData && canvasOrImageData.getContext) {
    ctx = canvasOrImageData.getContext('2d', { willReadFrequently: true });
    imgData = ctx.getImageData(0, 0, canvasOrImageData.width, canvasOrImageData.height);
  } else {
    imgData = canvasOrImageData;
  }
  if (!imgData || !imgData.data) return;
  const data = imgData.data;
  const len = data.length;

  let minR = 255, maxR = 0;
  let minG = 255, maxG = 0;
  let minB = 255, maxB = 0;
  let hasPixels = false;

  for (let i = 0; i < len; i += 4) {
    if (data[i + 3] === 0) continue;
    hasPixels = true;
    if (data[i] < minR) minR = data[i];
    if (data[i] > maxR) maxR = data[i];
    if (data[i + 1] < minG) minG = data[i + 1];
    if (data[i + 1] > maxG) maxG = data[i + 1];
    if (data[i + 2] < minB) minB = data[i + 2];
    if (data[i + 2] > maxB) maxB = data[i + 2];
  }

  if (!hasPixels) return;

  const rangeR = Math.max(1, maxR - minR);
  const rangeG = Math.max(1, maxG - minG);
  const rangeB = Math.max(1, maxB - minB);

  for (let i = 0; i < len; i += 4) {
    if (data[i + 3] === 0) continue;
    data[i] = Math.round(((data[i] - minR) / rangeR) * 255);
    data[i + 1] = Math.round(((data[i + 1] - minG) / rangeG) * 255);
    data[i + 2] = Math.round(((data[i + 2] - minB) / rangeB) * 255);
  }

  if (ctx) {
    ctx.putImageData(imgData, 0, 0);
  }
}
