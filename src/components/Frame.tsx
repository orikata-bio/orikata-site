"use client";

/**
 * Frame — the centered Orikata mark.
 *
 * 折形命 — "the way of folding life into shape"
 * 命 (mei, "life/fate/spirit") chosen over 生 (sei, "biological") to match
 * the poetic register of orikata (12th-c. ceremonial paper folding) and
 * Yuji Syuku's literary brush typography.
 *
 * Three-tier wisteria hierarchy:
 *   wordmark  wisteria-500
 *   kanji     wisteria-400
 *   tagline   wisteria-300
 *
 * The brush border is generative: at hydration, BrushBorder picks a random
 * layer count from {2, 4, 8, 16, 32, 64} and per-layer rect jitter from a
 * fresh seed, so every page load draws a slightly different brushstroke.
 * SSR renders a deterministic 4-layer fallback for first paint.
 */
import { useEffect, useMemo, useState } from "react";

const INK = "#3d2c5e";

/**
 * The set of layer counts the brush may pick from — powers of two from
 * 2 to 64. Linework heaviness is inversely correlated with N: low N gives
 * bold confident strokes, high N gives delicate fine lines. The earlier
 * 16-cap was needed when sqrt opacity attenuation alone wasn't enough to
 * keep high-N from compounding to a heavy black bar; the current
 * width-boost (`(4/N)^0.35`) plus opacity sqrt makes N=32 and N=64 the
 * *lightest* registers in the set rather than the heaviest.
 */
const POSSIBLE_LAYERS = [2, 4, 8, 16, 32, 64] as const;

export default function Frame() {
  return (
    <main className="frame relative z-[2] overflow-hidden bg-rice-50 px-9 py-[72px] text-center landscape:px-[124px] landscape:py-[96px]">
      {/* Paper texture extending through the frame interior */}
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="100%" height="100%" filter="url(#washi)" />
      </svg>

      {/* Sumi-e brushstroke border — generative each session */}
      <BrushBorder ink={INK} />

      {/* Wordmark — "Orikata" + "Bio" inline on landscape, stacked on
          portrait. The split is on screen *orientation* not width: a
          portrait tablet (e.g. 768×1024) gets the same vertical layout
          as a phone, because what matters for layout fit is whether the
          frame is being viewed in a tall-narrow or wide-short aspect.
          On portrait, the inline composition crowds the frame and "Bio"
          becomes a tiny appendage; stacked gives each word its own line
          with the size differential carrying hierarchy. */}
      <h1 className="relative font-yuji font-normal leading-[0.95] text-wisteria-600">
        <span className="block landscape:inline portrait:text-[clamp(52px,17vw,160px)] landscape:text-[clamp(52px,9vw,104px)]">
          Orikata
        </span>
        <span className="block landscape:inline landscape:ml-3 landscape:align-baseline portrait:text-[clamp(26px,8.5vw,80px)] landscape:text-[clamp(26px,4.5vw,52px)]">
          Bio
        </span>
      </h1>

      {/* Kanji subtitle */}
      <p
        aria-hidden="true"
        className="relative mt-8 font-yuji portrait:text-[clamp(28px,6vw,60px)] landscape:text-[clamp(28px,3.5vw,44px)] leading-none tracking-[0.35em] text-wisteria-400 landscape:mt-10"
        style={{ textIndent: "0.35em" }}
      >
        折形命
      </p>

      {/* Tagline — single line on landscape, three lines on portrait
          broken at the natural prepositional joints. Portrait uses vw
          scaling so it grows on portrait tablets the same way the
          wordmark does; landscape keeps a fixed point size. */}
      <p className="relative mt-10 font-yuji portrait:text-[clamp(18px,2.6vw,28px)] landscape:text-[20px] tracking-[0.08em] text-wisteria-600 landscape:mt-12">
        <span className="block landscape:inline">Mastering the Art</span>{" "}
        <span className="block landscape:inline">of</span>{" "}
        <span className="block landscape:inline">Folding Proteins</span>
      </p>
    </main>
  );
}

// ──────────────────────────────────────────────────────────────────
// BrushBorder — generative sumi-e perimeter
// ──────────────────────────────────────────────────────────────────

/**
 * Log-interpolate between two endpoints. a^(1-t) * b^t.
 */
function llerp(a: number, b: number, t: number): number {
  return Math.pow(a, 1 - t) * Math.pow(b, t);
}

/**
 * Geometric-mean-anchored range. factor=1 → full (a, b); factor=0 → both
 * endpoints collapse to the geometric mean. Returns [bigger, smaller].
 */
function geomRange(a: number, b: number, factor: number): [number, number] {
  const mid = Math.sqrt(a * b);
  const halfLog = Math.abs(Math.log(a) - Math.log(mid)) * factor;
  return [Math.exp(Math.log(mid) + halfLog), Math.exp(Math.log(mid) - halfLog)];
}

/**
 * Canonical 4-layer opacity profile [halo, wash, core, detail] = [0.15,
 * 0.35, 1.0, 0.7]. Peak (1.0) sits at the core position (t = 2/3); the
 * asymmetric tail (detail 0.7 vs halo 0.15) gives the "ink-loaded core
 * trailing dry wisps" reading rather than a symmetric outline. For any N,
 * opacity at t is piecewise-linearly interpolated through these four
 * control values, preserving the curve's silhouette regardless of sample
 * count.
 */
const OPACITY_CONTROLS = [0.15, 0.35, 1.0, 0.7] as const;

function opacityCurveAt(t: number): number {
  const segPos = t * (OPACITY_CONTROLS.length - 1);
  const segIdx = Math.min(OPACITY_CONTROLS.length - 2, Math.floor(segPos));
  const u = segPos - segIdx;
  return (
    OPACITY_CONTROLS[segIdx]! +
    (OPACITY_CONTROLS[segIdx + 1]! - OPACITY_CONTROLS[segIdx]!) * u
  );
}

/**
 * mulberry32 PRNG — deterministic [0, 1) random from a 32-bit seed. Used to
 * derive per-layer rect jitter and noise seeds from a single session salt
 * so the same brush is reproducible across re-renders within a session.
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

interface BrushLayer {
  strokeWidth: number;
  displacement: number;
  baseFreqX: number;
  baseFreqY: number;
  opacity: number;
  seed: number;
  filterId: string;
  // Per-layer rect coordinate jitter — small offsets so the N rects don't
  // overlay perfectly. Adds "loose brush" character beyond what filter
  // displacement alone provides; each layer's underlying path is genuinely
  // a different rectangle, then the filter perturbs that rectangle.
  rectDx: number;
  rectDy: number;
  rectDw: number;
  rectDh: number;
}

/**
 * Generate N stroke-layer parameter sets.
 *
 * Range scaling with N — heaviness explicitly inversely correlated with N.
 * Few layers → bold heavy linework; many layers → fine delicate linework.
 *   width range factor = (4/N)^0.15 — gentle log-range contraction.
 *   width boost = (4/N)^0.35 — multiplies the contracted range by a global
 *     scalar that makes low-N have intrinsically thicker strokes and
 *     high-N intrinsically thinner ones. At N=2 → ~1.27× the canonical
 *     width band (heavier brush). At N=16 → ~0.62× (delicate brush).
 *
 *   displacement / frequency: NO contraction with N — full range every N.
 *
 *   opacity scale = sqrt(4/N) — sqrt attenuation. At N=2 the result is
 *     ~1.41 which caps to 1.0 in the per-layer opacity calc, so low-N
 *     layers are at full canonical opacity. At higher N, opacity attenuates
 *     mildly so per-pixel composited alpha doesn't saturate, but combined
 *     with the inverse width boost, high-N still reads visibly lighter
 *     than low-N because thinner strokes paint fewer pixels.
 *
 * Per-layer rect jitter is sampled from the supplied PRNG, so the layer
 * count plus the session seed fully determines the brush.
 */
function buildBrushLayers(n: number, rng: () => number): BrushLayer[] {
  const N = Math.max(2, n);
  const widthRangeFactor = Math.pow(4 / N, 0.15);
  // Inverse-N width boost: low N gets thicker strokes overall; high N gets
  // thinner. This is the user-requested inverse correlation between layer
  // count and linework heaviness.
  const widthBoost = Math.pow(4 / N, 0.35);
  const opacityScale = Math.sqrt(4 / N);

  const [widthMaxBase, widthMinBase] = geomRange(14, 1.5, widthRangeFactor);
  const widthMax = widthMaxBase * widthBoost;
  const widthMin = widthMinBase * widthBoost;
  // Full displacement / frequency range regardless of N — preserves
  // per-layer path variance at high layer counts.
  const dispMax = 32;
  const dispMin = 4;
  const freqXMin = 0.005;
  const freqXMax = 0.06;
  const freqYMin = 0.018;
  const freqYMax = 0.14;

  const result: BrushLayer[] = [];
  for (let i = 0; i < n; i++) {
    // t-position along the brush profile.
    //   N=2: anchor on halo + core (t=[0, 2/3]) instead of halo + detail
    //        (t=[0, 1]). The canonical opacity profile peaks at t=2/3, so
    //        skipping the peak would give N=2 no full-opacity core stroke
    //        and make it lighter than N=4 — backwards for the
    //        inverse-correlation goal. Anchoring at the peak gives N=2
    //        a wide soft halo + a dark dominant stroke, the heaviest
    //        two-stroke configuration.
    //   N=3: halo + wash + core (skip detail).
    //   N≥4: uniform i/(N-1) — peak naturally sampled around the third
    //        layer where the canonical core sits.
    let t: number;
    if (n === 1) {
      t = 0;
    } else if (n === 2) {
      t = i === 0 ? 0 : 2 / 3;
    } else if (n === 3) {
      t = i === 0 ? 0 : i === 1 ? 1 / 3 : 2 / 3;
    } else {
      t = i / (n - 1);
    }
    result.push({
      strokeWidth: llerp(widthMax, widthMin, t),
      displacement: llerp(dispMax, dispMin, t),
      baseFreqX: llerp(freqXMin, freqXMax, t),
      baseFreqY: llerp(freqYMin, freqYMax, t),
      opacity: Math.min(1, opacityCurveAt(t) * opacityScale),
      // Filter seed varies per layer AND per RNG draw, so re-runs with the
      // same N but a new session salt produce different displacement
      // patterns rather than the same patterns at different scales.
      seed: Math.floor(rng() * 1_000_000),
      filterId: `brush-${n}-${i}`,
      // Rect coordinate jitter — small offsets in viewBox units (1000 wide
      // by 400 tall). ±4 on x/y, ±6 on width/height keeps each layer's
      // path within the visible region but breaks perfect alignment.
      rectDx: (rng() - 0.5) * 8,
      rectDy: (rng() - 0.5) * 8,
      rectDw: (rng() - 0.5) * 12,
      rectDh: (rng() - 0.5) * 12,
    });
  }
  return result;
}

function BrushBorder({ ink }: { ink: string }) {
  // SSR fallback: deterministic 4-layer brush with no rect jitter (RNG
  // returning 0.5 always). After mount, useEffect picks a random N from
  // POSSIBLE_LAYERS and a session salt; the brush re-renders generatively.
  const [config, setConfig] = useState<{ n: number; salt: number } | null>(
    null,
  );

  useEffect(() => {
    const idx = Math.floor(Math.random() * POSSIBLE_LAYERS.length);
    const n = POSSIBLE_LAYERS[idx]!;
    const salt = Math.floor(Math.random() * 0xffffffff);
    setConfig({ n, salt });
  }, []);

  const { layers, n } = useMemo(() => {
    if (config) {
      const rng = mulberry32(config.salt);
      return { layers: buildBrushLayers(config.n, rng), n: config.n };
    }
    // Stable SSR fallback: 4 layers, RNG that always returns 0.5 → all
    // jitter values are zero, layer seeds deterministic via index.
    const fallbackRng = () => 0.5;
    return { layers: buildBrushLayers(4, fallbackRng), n: 4 };
  }, [config]);

  return (
    <svg
      aria-hidden="true"
      data-brush-n={n}
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 1000 400"
      preserveAspectRatio="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {layers.map((L) => (
          <filter
            key={L.filterId}
            id={L.filterId}
            x="-8%"
            y="-8%"
            width="116%"
            height="116%"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency={`${L.baseFreqX} ${L.baseFreqY}`}
              numOctaves="3"
              seed={L.seed}
              result="noise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale={L.displacement}
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        ))}
      </defs>
      {layers.map((L) => (
        <rect
          key={L.filterId}
          x={8 + L.rectDx}
          y={8 + L.rectDy}
          width={984 + L.rectDw}
          height={384 + L.rectDh}
          fill="none"
          stroke={ink}
          strokeWidth={L.strokeWidth}
          opacity={L.opacity}
          filter={`url(#${L.filterId})`}
        />
      ))}
    </svg>
  );
}
