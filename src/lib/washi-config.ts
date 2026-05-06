/**
 * ORIKATA — WASHI PAPER TEXTURE CONFIG
 *
 * All tunables for the generative paper background. Three SVG noise
 * layers — fibers (dominant horizontal, broken anisotropy), crossFibers
 * (faint vertical cross-grain, scaled by alphaMultiplier), grain (fine
 * isotropic) — are blended via a single 3-way arithmetic composite using
 * `composite.fiberMix / crossMix / grainMix` weights. The final blend is
 * mapped through a feColorMatrix to a warm-dark RGBA tint with low alpha.
 *
 * The cross-grain hint differentiates handmade washi from machine-made
 * washi-look paper: real handmade washi has fibers tangled at near-90°
 * because the papermaker rocks the bamboo screen forward/back as well as
 * side-to-side during nagashizuki, and short kozo fibers settle in the
 * slurry without orientation preference. The crossFibers.alphaMultiplier
 * keeps that hint quiet — it scales the cross-grain layer's intensity
 * (RGB channels) before compositing, so it reads as faint background
 * tangle rather than a second equal-weight layer.
 *
 * Tuning workflow: defaults below are starting values. Iterate seeds
 * (3, 7, 11, 23 in combination), alpha (0.08-0.18 range), baseFreqY of
 * fibers (0.5-0.8 range) until the result reads as authentic handmade
 * washi at production size.
 *
 * Performance fallback: if window resize feels laggy, add
 * viewBox="0 0 1920 1080" + preserveAspectRatio="none" to the SVG to
 * cap noise resolution and let CSS stretch.
 */
export const WASHI_CONFIG = {
  // Dominant horizontal fibers (yokogami orientation, broken anisotropy
  // from baseFreqY 0.65 — fibers shorter and less perfectly parallel
  // than 0.45 would give)
  fibers: { baseFreqX: 0.012, baseFreqY: 0.65, octaves: 3, seed: 3 },

  // Cross-grain perpendicular fibers — same shape, X/Y swapped (vertical
  // orientation), independent seed. alphaMultiplier scales the layer's
  // RGB intensity before compositing so it reads as faint tangle.
  crossFibers: {
    baseFreqX: 0.65,
    baseFreqY: 0.012,
    octaves: 3,
    seed: 7,
    alphaMultiplier: 0.30,
  },

  // Fine isotropic grain — higher frequency, smaller-scale variation
  grain: { baseFreq: 1.4, octaves: 2, seed: 11 },

  // Single 3-way blend — weights sum to 1.0 for a clean weighted average.
  // Tuned down from the spec's starting fiberMix 0.55: at that level the
  // horizontal fiber layer dominated the composite and produced a corduroy
  // / scan-line pattern. 0.42 lets the cross-grain and grain layers compete
  // enough to break the strict horizontal pattern.
  composite: { fiberMix: 0.42, crossMix: 0.25, grainMix: 0.33 },

  // Warm-dark overlay tint — RGB constants set the hue of any darkening
  // effect, alpha caps the maximum darkening at the brightest noise.
  // Tuned from spec's 0.13 (too prominent at this weighted blend) to 0.09
  // — paper texture present-but-quiet, "did I imagine that?" target.
  color: { r: 0.20, g: 0.14, b: 0.10, alpha: 0.09 },
} as const;
