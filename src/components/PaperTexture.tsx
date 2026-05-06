import { WASHI_CONFIG } from "@/lib/washi-config";

/* ============================================================
   PaperTexture — generative washi paper background
   ============================================================
   Server component, zero client JS. Renders a single SVG fixed at
   the back of the body's stacking context (-z-10), full viewport,
   pointer-events-none, aria-hidden.

   Three feTurbulence layers are blended via a single 3-way arithmetic
   composite (chained as two stages because feComposite arithmetic only
   takes two inputs):

     stage 1: fibers ⊕ crossFibers via fiberMix / crossMix
     stage 2: stage1 ⊕ grain via 1.0 / grainMix

   Cross-grain is scaled before compositing by alphaMultiplier — applied
   as RGB-channel multiplication on the crossFibers turbulence output so
   the layer's grayscale intensity (which feeds the final darkening) is
   reduced. This is functionally a brightness scaler; it keeps the
   cross-grain a faint tangle rather than a second equal-weight layer.

   Final feColorMatrix maps grayscale noise to a fixed warm-dark RGB with
   alpha modulated by the noise's R channel, so the result tints the
   underlying body background-color (rice-50) wherever noise is bright,
   leaving it unchanged where noise is zero.

   Tunables live in src/lib/washi-config.ts.
============================================================ */
export default function PaperTexture() {
  const { fibers, crossFibers, grain, composite, color } = WASHI_CONFIG;
  const m = crossFibers.alphaMultiplier;
  return (
    <svg
      aria-hidden="true"
      className="fixed inset-0 -z-10 h-full w-full pointer-events-none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <filter id="washi" x="0" y="0" width="100%" height="100%">
        {/* Dominant horizontal fibers */}
        <feTurbulence
          type="fractalNoise"
          baseFrequency={`${fibers.baseFreqX} ${fibers.baseFreqY}`}
          numOctaves={fibers.octaves}
          seed={fibers.seed}
          stitchTiles="noStitch"
          result="fibers"
        />
        {/* Cross-grain perpendicular fibers (raw turbulence) */}
        <feTurbulence
          type="fractalNoise"
          baseFrequency={`${crossFibers.baseFreqX} ${crossFibers.baseFreqY}`}
          numOctaves={crossFibers.octaves}
          seed={crossFibers.seed}
          stitchTiles="noStitch"
          result="crossRaw"
        />
        {/* Scale cross-grain RGB intensity by alphaMultiplier so the
            layer's contribution to the grayscale brightness is reduced
            before the composite blend. */}
        <feColorMatrix
          in="crossRaw"
          values={`${m} 0 0 0 0
                   0 ${m} 0 0 0
                   0 0 ${m} 0 0
                   0 0 0 1 0`}
          result="crossFibers"
        />
        {/* Fine isotropic grain */}
        <feTurbulence
          type="fractalNoise"
          baseFrequency={grain.baseFreq}
          numOctaves={grain.octaves}
          seed={grain.seed}
          stitchTiles="noStitch"
          result="grain"
        />
        {/* Stage 1: fibers + crossFibers blend.
            arithmetic: out = k1*in1*in2 + k2*in1 + k3*in2 + k4
            With k1=k4=0, this is a straight weighted blend. */}
        <feComposite
          in="fibers"
          in2="crossFibers"
          operator="arithmetic"
          k1="0"
          k2={composite.fiberMix}
          k3={composite.crossMix}
          k4="0"
          result="fibCross"
        />
        {/* Stage 2: + grain. fibCross at full weight (k2=1, since stage 1
            already produced fiberMix*fibers + crossMix*crossFibers) plus
            grainMix * grain. */}
        <feComposite
          in="fibCross"
          in2="grain"
          operator="arithmetic"
          k1="0"
          k2="1"
          k3={composite.grainMix}
          k4="0"
          result="combined"
        />
        {/* Map grayscale noise → fixed warm-dark RGB with alpha modulated
            by the noise's R channel. */}
        <feColorMatrix
          in="combined"
          values={`0 0 0 0 ${color.r}
                   0 0 0 0 ${color.g}
                   0 0 0 0 ${color.b}
                   ${color.alpha} 0 0 0 0`}
        />
      </filter>
      <rect width="100%" height="100%" filter="url(#washi)" />
    </svg>
  );
}
