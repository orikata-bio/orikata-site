"use client";

/* ============================================================
   PaperTexture — generative washi paper background

   Each layer of the SVG filter pipeline is documented in
   src/lib/washi-config.ts. This component wires that config into
   the SVG `<filter>` chain and randomizes the noise seeds on
   each page load (matching BrushBorder's per-session randomization).

   SSR / first paint uses DEFAULT_SEEDS from the config so the
   hydrated client render and the server render match shape. After
   mount, a fresh salt is drawn and all 9 seeds are derived from it
   via mulberry32 — fibers, jitter sources, bending, grain, cloud
   all freshly seeded so each visit produces a different fiber
   pattern while the filter STRUCTURE (frequencies, octaves, dilate,
   threshold, weights) stays constant for visual consistency.
   ============================================================ */

import { useEffect, useState } from "react";
import {
  WASHI_CONFIG,
  DEFAULT_SEEDS,
  seedsFromSalt,
  type WashiSeeds,
} from "@/lib/washi-config";

export default function PaperTexture() {
  const [seeds, setSeeds] = useState<WashiSeeds>(DEFAULT_SEEDS);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const salt = Math.floor(Math.random() * 0xffffffff);
      setSeeds(seedsFromSalt(salt));
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  const c = WASHI_CONFIG;
  return (
    <svg
      aria-hidden="true"
      className="fixed inset-0 -z-10 h-full w-full pointer-events-none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <filter id="washi" x="0" y="0" width="100%" height="100%">
        {/* ─── Layer 1: horizontal fibers ───────────────────────── */}
        <feTurbulence
          type="fractalNoise"
          baseFrequency={`${c.fibersH.baseFreqX} ${c.fibersH.baseFreqY}`}
          numOctaves={c.fibersH.octaves}
          seed={seeds.fibersH}
          stitchTiles="noStitch"
          result="hRaw"
        />
        <feComponentTransfer in="hRaw" result="hThresh">
          <feFuncR type="table" tableValues={c.fibersH.thresholdTable} />
          <feFuncG type="table" tableValues={c.fibersH.thresholdTable} />
          <feFuncB type="table" tableValues={c.fibersH.thresholdTable} />
        </feComponentTransfer>
        <feMorphology
          in="hThresh"
          operator="dilate"
          radius={c.fibersH.dilate}
          result="hFib"
        />
        {/* H per-strand angle jitter */}
        <feTurbulence
          type="fractalNoise"
          baseFrequency={`${c.fibersH.tiltDisp.baseFreqX} ${c.fibersH.tiltDisp.baseFreqY}`}
          numOctaves={c.fibersH.tiltDisp.octaves}
          seed={seeds.hTiltDisp}
          stitchTiles="noStitch"
          result="hTiltDisp"
        />
        <feDisplacementMap
          in="hFib"
          in2="hTiltDisp"
          scale={c.fibersH.tiltDisp.scale}
          xChannelSelector="R"
          yChannelSelector="G"
          result="hFibJit"
        />

        {/* ─── Layer 2: vertical fibers ─────────────────────────── */}
        <feTurbulence
          type="fractalNoise"
          baseFrequency={`${c.fibersV.baseFreqX} ${c.fibersV.baseFreqY}`}
          numOctaves={c.fibersV.octaves}
          seed={seeds.fibersV}
          stitchTiles="noStitch"
          result="vRaw"
        />
        <feComponentTransfer in="vRaw" result="vThresh">
          <feFuncR type="table" tableValues={c.fibersV.thresholdTable} />
          <feFuncG type="table" tableValues={c.fibersV.thresholdTable} />
          <feFuncB type="table" tableValues={c.fibersV.thresholdTable} />
        </feComponentTransfer>
        <feMorphology
          in="vThresh"
          operator="dilate"
          radius={c.fibersV.dilate}
          result="vFib"
        />
        <feTurbulence
          type="fractalNoise"
          baseFrequency={`${c.fibersV.tiltDisp.baseFreqX} ${c.fibersV.tiltDisp.baseFreqY}`}
          numOctaves={c.fibersV.tiltDisp.octaves}
          seed={seeds.vTiltDisp}
          stitchTiles="noStitch"
          result="vTiltDisp"
        />
        <feDisplacementMap
          in="vFib"
          in2="vTiltDisp"
          scale={c.fibersV.tiltDisp.scale}
          xChannelSelector="R"
          yChannelSelector="G"
          result="vFibJit"
        />

        {/* ─── Layer 3: diagonal-1 ──────────────────────────────── */}
        <feTurbulence
          type="fractalNoise"
          baseFrequency={`${c.fibersD1.baseFreqX} ${c.fibersD1.baseFreqY}`}
          numOctaves={c.fibersD1.octaves}
          seed={seeds.fibersD1}
          stitchTiles="noStitch"
          result="d1Raw"
        />
        <feComponentTransfer in="d1Raw" result="d1Thresh">
          <feFuncR type="table" tableValues={c.fibersD1.thresholdTable} />
          <feFuncG type="table" tableValues={c.fibersD1.thresholdTable} />
          <feFuncB type="table" tableValues={c.fibersD1.thresholdTable} />
        </feComponentTransfer>
        <feMorphology
          in="d1Thresh"
          operator="dilate"
          radius={c.fibersD1.dilate}
          result="d1Fib"
        />

        {/* ─── Layer 4: diagonal-2 (perpendicular to d1) ────────── */}
        <feTurbulence
          type="fractalNoise"
          baseFrequency={`${c.fibersD2.baseFreqX} ${c.fibersD2.baseFreqY}`}
          numOctaves={c.fibersD2.octaves}
          seed={seeds.fibersD2}
          stitchTiles="noStitch"
          result="d2Raw"
        />
        <feComponentTransfer in="d2Raw" result="d2Thresh">
          <feFuncR type="table" tableValues={c.fibersD2.thresholdTable} />
          <feFuncG type="table" tableValues={c.fibersD2.thresholdTable} />
          <feFuncB type="table" tableValues={c.fibersD2.thresholdTable} />
        </feComponentTransfer>
        <feMorphology
          in="d2Thresh"
          operator="dilate"
          radius={c.fibersD2.dilate}
          result="d2Fib"
        />

        {/* ─── Merge layers: (H ⊕ V) ⊕ (D1 ⊕ D2) ────────────────── */}
        <feComposite
          in="hFibJit"
          in2="vFibJit"
          operator="arithmetic"
          k1="0"
          k2={c.layerMix.hvH}
          k3={c.layerMix.hvV}
          k4="0"
          result="hv"
        />
        <feComposite
          in="d1Fib"
          in2="d2Fib"
          operator="arithmetic"
          k1="0"
          k2={c.layerMix.ddD1}
          k3={c.layerMix.ddD2}
          k4="0"
          result="dd"
        />
        <feComposite
          in="hv"
          in2="dd"
          operator="arithmetic"
          k1="0"
          k2={c.layerMix.hvAll}
          k3={c.layerMix.ddAll}
          k4="0"
          result="fibers"
        />

        {/* ─── Whole-field bending ──────────────────────────────── */}
        <feTurbulence
          type="fractalNoise"
          baseFrequency={c.bend.baseFreq}
          numOctaves={c.bend.octaves}
          seed={seeds.bend}
          stitchTiles="noStitch"
          result="bendNoise"
        />
        <feDisplacementMap
          in="fibers"
          in2="bendNoise"
          scale={c.bend.scale}
          xChannelSelector="R"
          yChannelSelector="G"
          result="fibersBent"
        />

        {/* ─── Fine grain + cloud, blended in ───────────────────── */}
        <feTurbulence
          type="fractalNoise"
          baseFrequency={c.grain.baseFreq}
          numOctaves={c.grain.octaves}
          seed={seeds.grain}
          stitchTiles="noStitch"
          result="grain"
        />
        <feTurbulence
          type="fractalNoise"
          baseFrequency={c.cloud.baseFreq}
          numOctaves={c.cloud.octaves}
          seed={seeds.cloud}
          stitchTiles="noStitch"
          result="cloud"
        />
        <feComposite
          in="fibersBent"
          in2="grain"
          operator="arithmetic"
          k1="0"
          k2={1 - c.finalMix.grain}
          k3={c.finalMix.grain}
          k4="0"
          result="fg"
        />
        <feComposite
          in="fg"
          in2="cloud"
          operator="arithmetic"
          k1="0"
          k2="1"
          k3={c.finalMix.cloud}
          k4="0"
          result="combined"
        />

        {/* ─── Final warm-dark color overlay ────────────────────── */}
        <feColorMatrix
          in="combined"
          values={`0 0 0 0 ${c.color.r}
                   0 0 0 0 ${c.color.g}
                   0 0 0 0 ${c.color.b}
                   ${c.color.alpha} 0 0 0 0`}
        />
      </filter>
      <rect width="100%" height="100%" filter="url(#washi)" />
    </svg>
  );
}
