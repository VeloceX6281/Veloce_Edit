/**
 * Default values for the Filter & Adjustment Pipeline
 */
export const DEFAULT_ADJUSTMENTS = {
  brightness: 100,  // 0% - 200%
  contrast: 100,    // 0% - 200%
  saturation: 100,  // 0% - 200%
  blur: 0,          // 0px - 20px
  grayscale: 0,     // 0% - 100%
  invert: 0,        // 0% - 100%
  sepia: 0,         // 0% - 100%
  hueRotate: 0      // 0deg - 360deg
};

/**
 * Builds standard CSS / Canvas 2D filter string from adjustment values
 */
export function getFilterCSSString(adjustments) {
  if (!adjustments) return 'none';

  const parts = [];
  if (adjustments.brightness !== 100) {
    parts.push(`brightness(${adjustments.brightness}%)`);
  }
  if (adjustments.contrast !== 100) {
    parts.push(`contrast(${adjustments.contrast}%)`);
  }
  if (adjustments.saturation !== 100) {
    parts.push(`saturate(${adjustments.saturation}%)`);
  }
  if (adjustments.blur > 0) {
    parts.push(`blur(${adjustments.blur}px)`);
  }
  if (adjustments.grayscale > 0) {
    parts.push(`grayscale(${adjustments.grayscale}%)`);
  }
  if (adjustments.invert > 0) {
    parts.push(`invert(${adjustments.invert}%)`);
  }
  if (adjustments.sepia > 0) {
    parts.push(`sepia(${adjustments.sepia}%)`);
  }
  if (adjustments.hueRotate > 0) {
    parts.push(`hue-rotate(${adjustments.hueRotate}deg)`);
  }

  return parts.length > 0 ? parts.join(' ') : 'none';
}

/**
 * Checks if current adjustment values differ from default baseline
 */
export function isAdjustmentsActive(adjustments) {
  if (!adjustments) return false;
  return (
    adjustments.brightness !== 100 ||
    adjustments.contrast !== 100 ||
    adjustments.saturation !== 100 ||
    adjustments.blur !== 0 ||
    adjustments.grayscale !== 0 ||
    adjustments.invert !== 0 ||
    adjustments.sepia !== 0 ||
    adjustments.hueRotate !== 0
  );
}

/**
 * Curated artistic filter presets
 */
export const FILTER_PRESETS = [
  {
    id: 'normal',
    name: 'Normal',
    values: { ...DEFAULT_ADJUSTMENTS }
  },
  {
    id: 'vibrant',
    name: 'Vibrant',
    values: {
      ...DEFAULT_ADJUSTMENTS,
      brightness: 105,
      contrast: 120,
      saturation: 140
    }
  },
  {
    id: 'noir',
    name: 'Noir B&W',
    values: {
      ...DEFAULT_ADJUSTMENTS,
      grayscale: 100,
      contrast: 140,
      brightness: 95
    }
  },
  {
    id: 'vintage',
    name: 'Vintage',
    values: {
      ...DEFAULT_ADJUSTMENTS,
      sepia: 70,
      contrast: 110,
      saturation: 90,
      brightness: 95
    }
  },
  {
    id: 'dreamy',
    name: 'Dreamy',
    values: {
      ...DEFAULT_ADJUSTMENTS,
      blur: 1.5,
      brightness: 110,
      contrast: 95,
      saturation: 115
    }
  },
  {
    id: 'negative',
    name: 'Inverted',
    values: {
      ...DEFAULT_ADJUSTMENTS,
      invert: 100
    }
  }
];
