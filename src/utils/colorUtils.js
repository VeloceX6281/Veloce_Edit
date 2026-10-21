/**
 * Color math and conversion utilities: HEX <-> RGB <-> HSB/HSV
 */

export function hexToRgb(hex) {
  let cleanHex = hex.replace('#', '').trim();
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map((c) => c + c).join('');
  }
  const num = parseInt(cleanHex, 16);
  if (isNaN(num) || cleanHex.length !== 6) {
    return { r: 99, g: 102, b: 241 }; // Default indigo
  }
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255
  };
}

export function rgbToHex(r, g, b) {
  const clamp = (val) => Math.max(0, Math.min(255, Math.round(val)));
  const toHex = (c) => clamp(c).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function rgbToHsb(r, g, b) {
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;

  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  const delta = max - min;

  let h = 0;
  if (delta !== 0) {
    if (max === rNorm) {
      h = ((gNorm - bNorm) / delta) % 6;
    } else if (max === gNorm) {
      h = (bNorm - rNorm) / delta + 2;
    } else {
      h = (rNorm - gNorm) / delta + 4;
    }
    h = Math.round(h * 60);
    if (h < 0) h += 360;
  }

  const s = max === 0 ? 0 : Math.round((delta / max) * 100);
  const v = Math.round(max * 100);

  return { h, s, b: v };
}

export function hsbToRgb(h, s, b) {
  const hNorm = (h % 360) / 60;
  const sNorm = s / 100;
  const bNorm = b / 100;

  const c = bNorm * sNorm;
  const x = c * (1 - Math.abs((hNorm % 2) - 1));
  const m = bNorm - c;

  let r1 = 0, g1 = 0, b1 = 0;
  if (hNorm >= 0 && hNorm < 1) {
    r1 = c; g1 = x; b1 = 0;
  } else if (hNorm >= 1 && hNorm < 2) {
    r1 = x; g1 = c; b1 = 0;
  } else if (hNorm >= 2 && hNorm < 3) {
    r1 = 0; g1 = c; b1 = x;
  } else if (hNorm >= 3 && hNorm < 4) {
    r1 = 0; g1 = x; b1 = c;
  } else if (hNorm >= 4 && hNorm < 5) {
    r1 = x; g1 = 0; b1 = c;
  } else if (hNorm >= 5 && hNorm < 6) {
    r1 = c; g1 = 0; b1 = x;
  }

  return {
    r: Math.round((r1 + m) * 255),
    g: Math.round((g1 + m) * 255),
    b: Math.round((b1 + m) * 255)
  };
}

export function hsbToHex(h, s, b) {
  const { r, g, b: bVal } = hsbToRgb(h, s, b);
  return rgbToHex(r, g, bVal);
}

export function hexToHsb(hex) {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHsb(r, g, b);
}
