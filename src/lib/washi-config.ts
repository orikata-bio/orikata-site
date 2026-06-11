/**
 * ORIKATA — WASHI PAPER TEXTURE CONFIG
 *
 * SVG filter pipeline that builds an authentic handmade washi paper
 * texture from layered feTurbulence noise. The non-obvious choices
 * encoded here:
 *
 * 1. Four fiber direction layers (H, V, two diagonals) instead of one
 *    horizontal + one cross. Real washi has fibers tangled at many
 *    angles — feTurbulence baseFrequency asymmetry is the only way
 *    SVG filters can produce directionally-biased noise, so four
 *    layers with different (X, Y) frequency ratios approximate
 *    multi-direction fiber tangle.
 *
 * 2. feComponentTransfer threshold on each layer turns the smooth
 *    turbulence gradient into DISCRETE fiber strands. Without this
 *    the result reads as wood grain / scanlines, not washi.
 *
 * 3. feMorphology dilate thickens each thresholded layer's strands
 *    from hairlines to readable filaments.
 *
 * 4. Per-layer pre-displacement (tiltDisp) on H and V layers adds
 *    random angle jitter to individual strands — H strands tilted ±
 *    by a vertical displacement that varies along X, V strands the
 *    reverse. Each strand centers on its H/V axis but rotates by a
 *    small random angle, so they don't read as perfectly parallel.
 *
 * 5. Whole-field displacement (bend) bends the merged fiber field
 *    along curved paths — fibers no longer follow straight lines.
 *
 * 6. Low-frequency cloud layer adds sheet density variation
 *    (neri pooling — the cloudy patches you see in handmade washi).
 *
 * 7. Final feColorMatrix maps grayscale noise to a warm-dark RGBA
 *    overlay with low alpha. Pure-gray noise overlays kill washi
 *    authenticity instantly; the warm tint reads as kozo fiber color.
 *
 * Seeds in this config are SSR fallback defaults — PaperTexture
 * regenerates them client-side on each page load so every visit
 * produces a different fiber pattern (matching the BrushBorder
 * and PALETTE_SWITCH per-load randomization patterns).
 */

export type WashiSeeds = {
  fibersH: number;
  fibersV: number;
  fibersD1: number;
  fibersD2: number;
  hTiltDisp: number;
  vTiltDisp: number;
  bend: number;
  grain: number;
  cloud: number;
};

// SSR / first-paint fallback seeds. After hydration PaperTexture
// replaces these with mulberry32-derived values from a fresh salt.
export const DEFAULT_SEEDS: WashiSeeds = {
  fibersH: 3,
  fibersV: 7,
  fibersD1: 17,
  fibersD2: 29,
  hTiltDisp: 51,
  vTiltDisp: 53,
  bend: 41,
  grain: 11,
  cloud: 23,
};

export const WASHI_CONFIG = {
  // Four fiber direction layers — strong anisotropy along their dominant
  // axis (~58× ratio). Threshold + dilate per layer turns smooth
  // turbulence into discrete strands.
  fibersH: {
    baseFreqX: 0.012,
    baseFreqY: 0.7,
    octaves: 2,
    dilate: 0.5,
    thresholdTable: "0 0 0 0 0.3 0.7 1 1",
    // Per-strand angle jitter — Y-displacement varying along X tilts
    // each H strand by a small random angle without altering its
    // horizontal center axis.
    tiltDisp: { baseFreqX: 0.025, baseFreqY: 0.005, octaves: 2, scale: 6 },
  },
  fibersV: {
    baseFreqX: 0.7,
    baseFreqY: 0.012,
    octaves: 2,
    dilate: 0.4,
    thresholdTable: "0 0 0 0 0.3 0.7 1 1",
    tiltDisp: { baseFreqX: 0.005, baseFreqY: 0.025, octaves: 2, scale: 6 },
  },
  fibersD1: {
    baseFreqX: 0.05,
    baseFreqY: 0.22,
    octaves: 2,
    dilate: 0.3,
    thresholdTable: "0 0 0 0.2 0.6 1",
  },
  fibersD2: {
    baseFreqX: 0.22,
    baseFreqY: 0.05,
    octaves: 2,
    dilate: 0.3,
    thresholdTable: "0 0 0 0.2 0.6 1",
  },

  // Composite weights for merging fiber layers. H/V blend first
  // (perpendicular pair), D1/D2 blend (diagonal pair), then combined.
  layerMix: { hvH: 0.5, hvV: 0.4, ddD1: 0.5, ddD2: 0.5, hvAll: 0.7, ddAll: 0.4 },

  // Whole-field displacement — bends the merged fiber field along
  // curved paths so individual fibers follow non-straight trajectories.
  bend: { baseFreq: 0.02, octaves: 2, scale: 8 },

  // Fine isotropic grain — sub-fiber surface tooth / micro-texture.
  grain: { baseFreq: 1.4, octaves: 2 },

  // Low-freq cloud — sheet thickness variation from neri pooling.
  cloud: { baseFreq: 0.004, octaves: 1 },

  // Final blend weights. The fiber+grain composite gets full weight
  // (k2=1 since it already sums all fiber layers); cloud and grain
  // are added with smaller k3 weights.
  finalMix: { grain: 0.1, cloud: 0.22 },

  // Warm-dark RGBA overlay tint. The R/G/B constants set the hue of
  // any darkening; alpha caps maximum darkening at the brightest noise.
  // Bumped from 0.09 to 0.12 because the threshold pipeline produces
  // sharper-but-thinner features that need slightly more alpha to read.
  color: { r: 0.2, g: 0.14, b: 0.1, alpha: 0.12 },
} as const;

/**
 * mulberry32 PRNG — deterministic [0, 1) random from a 32-bit seed.
 * Matches the Frame BrushBorder PRNG so the codebase has one
 * derivation function for per-session randomization.
 */
function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Generate a full WashiSeeds set from a 32-bit salt. */
export function seedsFromSalt(salt: number): WashiSeeds {
  const rng = mulberry32(salt);
  const s = () => Math.floor(rng() * 1_000_000);
  return {
    fibersH: s(),
    fibersV: s(),
    fibersD1: s(),
    fibersD2: s(),
    hTiltDisp: s(),
    vTiltDisp: s(),
    bend: s(),
    grain: s(),
    cloud: s(),
  };
}
