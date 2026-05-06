/**
 * ORIKATA — PETAL ANIMATION CONFIG
 *
 * All tunable animation parameters live in CONFIG.
 * Petal colors live in PALETTE — built from `tokens.ts` so the canvas
 * and the Tailwind `*-petal-*` utility classes can never drift.
 *
 * Edit CONFIG values here and refresh — no need to touch the engine in
 * `components/PetalCanvas.tsx`. Sprite shapes live in `src/lib/sprites.ts`.
 *
 * `buildGradient` (below) replaces discrete tier sampling with continuous
 * OKLCH interpolation across the locked palette control points. The canvas
 * picks from a 32-sample gradient per kind instead of 3-4 discrete colors,
 * so the swarm reads as a perceptually-smooth wash rather than four distinct
 * color stripes.
 */
import { PETAL_TIERS } from "./tokens";

export const CONFIG = {
  // Petal counts — performance vs. visual richness tradeoff.
  petalCountDesktop: 50,
  petalCountMobile:  28,
  mobileBreakpoint:  720,

  // Mix
  sakuraRatio: 0.7, // 70% sakura, 30% wisteria

  // Fall behavior (px per frame at 60fps)
  fallSpeedMin: 0.25,
  fallSpeedMax: 0.80,

  // Horizontal sway
  swayAmpMin:   0.4,
  swayAmpMax:   1.1,
  swayFreqMin:  0.0006,
  swayFreqMax:  0.0020,

  // Rotation
  rotSpeedMax: 0.012,

  // Petal sizes (px — drawn in CSS pixels, canvas is DPR-scaled)
  sakuraSizeMin:   10,
  sakuraSizeMax:   18,
  wisteriaSizeMin: 5,
  wisteriaSizeMax: 10,
} as const;

/**
 * Locked sakura-iro + fuji-iro palette.
 * Each tier is [hex, alpha]. Alpha bands give atmospheric depth.
 * Hexes come from `tokens.ts`; alphas are canvas-rendering-specific
 * and stay here.
 */
export const PALETTE = {
  sakura: [
    [PETAL_TIERS.sakura.light,   0.78],
    [PETAL_TIERS.sakura.mid,     0.78],
    [PETAL_TIERS.sakura.deep,    0.72],
    [PETAL_TIERS.sakura.deepest, 0.65],
  ],
  wisteria: [
    [PETAL_TIERS.wisteria.light, 0.62],
    [PETAL_TIERS.wisteria.mid,   0.55],
    [PETAL_TIERS.wisteria.deep,  0.50],
  ],
} as const satisfies Record<string, ReadonlyArray<readonly [string, number]>>;

// ──────────────────────────────────────────────────────────────────
// OKLCH gradient interpolation
// ──────────────────────────────────────────────────────────────────
// Math: Björn Ottosson 2020. sRGB → linear sRGB → OKLAB → OKLCH for
// each control hex; lerp L/C/H/alpha within segment; OKLCH → linear
// sRGB → sRGB → rgba string.

function srgbToLinear(c: number): number {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function linearToSrgb(c: number): number {
  if (c <= 0) return 0;
  if (c >= 1) return 1;
  return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
}

interface OKLCH {
  L: number;
  C: number;
  H: number; // degrees
}

function hexToOKLCH(hex: string): OKLCH {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const rL = srgbToLinear(r);
  const gL = srgbToLinear(g);
  const bL = srgbToLinear(b);

  const l = 0.4122214708 * rL + 0.5363325363 * gL + 0.0514459929 * bL;
  const m = 0.2119034982 * rL + 0.6806995451 * gL + 0.1073969566 * bL;
  const s = 0.0883024619 * rL + 0.2817188376 * gL + 0.6299787005 * bL;

  const l_ = Math.cbrt(l);
  const m_ = Math.cbrt(m);
  const s_ = Math.cbrt(s);

  const L = 0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_;
  const a = 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_;
  const b2 = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_;

  return {
    L,
    C: Math.sqrt(a * a + b2 * b2),
    H: (Math.atan2(b2, a) * 180) / Math.PI,
  };
}

function oklchToRgbaString(L: number, C: number, H: number, alpha: number): string {
  const Hr = (H * Math.PI) / 180;
  const a = C * Math.cos(Hr);
  const b = C * Math.sin(Hr);

  let l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  let m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  let s_ = L - 0.0894841775 * a - 1.2914855480 * b;
  l_ = l_ * l_ * l_;
  m_ = m_ * m_ * m_;
  s_ = s_ * s_ * s_;

  const rLin =  4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_;
  const gLin = -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_;
  const bLin = -0.0041960863 * l_ - 0.7034186147 * m_ + 1.7076147010 * s_;

  const r = Math.round(linearToSrgb(rLin) * 255);
  const g = Math.round(linearToSrgb(gLin) * 255);
  const b3 = Math.round(linearToSrgb(bLin) * 255);

  return `rgba(${r}, ${g}, ${b3}, ${alpha.toFixed(3)})`;
}

/**
 * Build an array of `samples` rgba() strings interpolated continuously
 * across the given `[hex, alpha]` control points.
 *
 * Hue wraparound assumption: current palettes don't span the 0/360°
 * boundary (sakura ~355-358°, wisteria ~295-299°), so naive linear hue
 * interpolation is safe. If a future palette spans a wider hue range
 * that crosses 0°, the lerp will take the long way around and produce
 * an out-of-family hue mid-segment — guard with a shortest-arc check
 * if needed.
 */
export function buildGradient(
  controlPoints: ReadonlyArray<readonly [string, number]>,
  samples = 32,
): string[] {
  const oklchPoints = controlPoints.map(([hex, alpha]) => ({
    ...hexToOKLCH(hex),
    alpha,
  }));

  const N = oklchPoints.length;
  const result: string[] = [];

  for (let i = 0; i < samples; i++) {
    const t = i / (samples - 1);
    const segPos = t * (N - 1);
    const segIdx = Math.min(Math.floor(segPos), N - 2);
    const u = segPos - segIdx;
    const a = oklchPoints[segIdx]!;
    const b = oklchPoints[segIdx + 1]!;

    const L = a.L + (b.L - a.L) * u;
    const C = a.C + (b.C - a.C) * u;
    const H = a.H + (b.H - a.H) * u;
    const alpha = a.alpha + (b.alpha - a.alpha) * u;

    result.push(oklchToRgbaString(L, C, H, alpha));
  }

  return result;
}
