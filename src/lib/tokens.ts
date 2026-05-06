/**
 * Locked petal-tier hex values.
 *
 * Single source of truth for the colors that live in two consumers:
 *   1. Tailwind config (build time) — exposed as `sakura-petal-*` and
 *      `wisteria-petal-*` utility classes.
 *   2. PetalCanvas runtime — read by `petal-config.ts` to build the
 *      canvas fillStyle palette.
 *
 * Both consumers import from this file so a hex change here propagates
 * everywhere. Do not duplicate these values elsewhere.
 *
 * The tier hexes were tuned for atmospheric depth in the falling-petal
 * canvas; they don't sit on the Tailwind 11-step scale steps because
 * they're spaced more tightly than a numeric scale would land them.
 *
 * `wisteria.deep` (#7B62B8) deliberately matches the `wisteria-500`
 * scale step — the petal anchor and the scale anchor are the same color.
 */

export const PETAL_TIERS = {
  sakura: {
    light:   "#F2C4D4",
    mid:     "#E4A0B7",
    deep:    "#D48BA3",
    deepest: "#B8708C",
  },
  wisteria: {
    light: "#A688E0",
    mid:   "#9075CC",
    deep:  "#7B62B8",
  },
} as const;

export type SakuraTier = keyof typeof PETAL_TIERS.sakura;
export type WisteriaTier = keyof typeof PETAL_TIERS.wisteria;
