/**
 * Petal sprite registry.
 *
 * Each variant declares a draw(ctx, size) function that paints a petal
 * centered at (0, 0) using the current ctx.fillStyle. The petal extends
 * roughly within ±size on its long axis. Long axis points toward -y.
 *
 * Two consumers:
 *   1. `PetalCanvas.tsx` — pre-renders each (variant × color-tier) to an
 *      offscreen canvas at init, then `drawImage`s rotated sprites in the
 *      rAF loop.
 *   2. `dev/render-sprites.mjs` — produces a contact-sheet PNG showing
 *      every variant at multiple sizes / rotations / tiers, so we can
 *      iterate visual judgment from rendered output rather than reading
 *      Bézier coordinates. See `SPRITES.md`.
 *
 * Adding a variant: append a `{ name, draw }` entry to the relevant
 * array. No engine changes required.
 */

export type SpriteDraw = (
  ctx: CanvasRenderingContext2D,
  size: number,
) => void;

export interface SpriteVariant {
  name: string;
  draw: SpriteDraw;
  /**
   * Optional per-variant size band. Overrides the kind-default range
   * from `petal-config.ts`. Used for the wisteria cluster, which is
   * intentionally bigger than the single-petal range so the silhouette
   * can carry the raceme reading rather than blob into a darker patch.
   *
   * The kind's `naturalSize` is set to max(default, all variant
   * `sizeRange.max`) so the offscreen sprite canvas is big enough to
   * contain the largest variant; smaller variants downscale via
   * drawImage at runtime.
   */
  sizeRange?: { min: number; max: number };
}

export const SAKURA_VARIANTS: SpriteVariant[] = [
  {
    // Cherry blossom petal viewed flat-on, tip toward -y. Bulge is
    // biased toward the upper third (widest near the tip), base
    // tapers to a narrow point. V-notch is deep enough to read at
    // ~10–12px sprite size after pre-render.
    //
    // Geometry targets (per SPRITES.md hint):
    //   length ≈ 1.9·s (from base y=+0.95 to tip y=-0.95)
    //   width at midpoint ≈ 0.7·length → half-width ≈ 0.665·s
    //   V-notch depth ≈ 0.15·length, width ≈ 0.25·length
    name: "single-flat",
    draw: (ctx, s) => {
      ctx.beginPath();
      ctx.moveTo(0, 0.95 * s); // base
      // left side: gentle near base, strong outward near tip,
      // landing at left tip peak. Width at midpoint ≈ 0.7·length.
      ctx.bezierCurveTo(
        -0.42 * s,  0.50 * s,
        -1.10 * s, -0.30 * s,
        -0.22 * s, -0.95 * s,
      );
      // Sharp V-notch (lineTo, not quadratic) so the point survives
      // antialiasing at small sprite sizes. Depth ≈ 17% of total length.
      ctx.lineTo(0, -0.62 * s);
      ctx.lineTo(0.22 * s, -0.95 * s);
      // right side, mirrored
      ctx.bezierCurveTo(
         1.10 * s, -0.30 * s,
         0.42 * s,  0.50 * s,
         0, 0.95 * s,
      );
      ctx.closePath();
      ctx.fill();
    },
  },
  {
    // 3/4 angle — between flat and edge-on. The petal is rotated about
    // its long axis, so one side appears foreshortened (the "far" side,
    // narrower) and the other reads at near-full width. V-notch is still
    // visible but shifted toward the foreshortened side, since the tip
    // is no longer perpendicular to the viewer.
    //
    // Asymmetry must be obvious enough to distinguish from single-flat
    // at every contact-sheet rotation (otherwise it's just a redundant
    // variant). Left side widest extent ~0.45·s, right side ~0.65·s.
    name: "three-quarter",
    draw: (ctx, s) => {
      ctx.beginPath();
      ctx.moveTo(-0.04 * s, 0.95 * s); // base slightly left of center
      // left (far) side — narrower bulge, foreshortened
      ctx.bezierCurveTo(
        -0.20 * s,  0.50 * s,
        -0.55 * s, -0.30 * s,
        -0.10 * s, -0.95 * s,
      );
      // V-notch — valley shifted toward the near side
      ctx.lineTo(0.08 * s, -0.65 * s);
      ctx.lineTo(0.24 * s, -0.95 * s);
      // right (near) side — fuller bulge, closer to viewer
      ctx.bezierCurveTo(
         0.85 * s, -0.30 * s,
         0.40 * s,  0.50 * s,
        -0.04 * s,  0.95 * s,
      );
      ctx.closePath();
      ctx.fill();
    },
  },
  {
    // Twisting mid-fall — petal caught in mid-rotation as it falls.
    // The whole silhouette sweeps from base (lower-left) to tip area
    // (upper-right), with the centerline tracing a soft S-curve. The
    // V-notch sits at the swept tip, off-axis from the base — that
    // off-axis offset is the strongest visual cue that the petal is
    // twisting through 3D space rather than lying flat.
    //
    // Reads as motion frozen rather than a static silhouette.
    name: "twisting",
    draw: (ctx, s) => {
      ctx.beginPath();
      ctx.moveTo(-0.05 * s, 0.95 * s); // base, slightly left
      // left side: bulge out-and-down, then sweep up-and-right toward
      // the laterally-offset tip
      ctx.bezierCurveTo(
        -0.50 * s,  0.45 * s,
        -0.30 * s, -0.50 * s,
         0.15 * s, -0.95 * s, // left tip peak — shifted right
      );
      // V-notch — valley well off the base centerline (x = +0.30·s)
      ctx.lineTo(0.30 * s, -0.62 * s);
      ctx.lineTo(0.45 * s, -0.95 * s);
      // right side: wide bulge that completes the swept silhouette
      ctx.bezierCurveTo(
         0.95 * s, -0.30 * s,
         0.40 * s,  0.45 * s,
        -0.05 * s,  0.95 * s,
      );
      ctx.closePath();
      ctx.fill();
    },
  },
  {
    // Edge-on sliver — petal viewed from the side, foreshortened
    // along its short axis. Long axis (±y) full length; width
    // compressed to a thin curved sliver. V-notch is hidden by
    // perspective at this angle, which is correct — we don't fake
    // a notch the viewer wouldn't actually see.
    //
    // Slight asymmetry (right side bulges, left side concave) so it
    // reads as "banana / comma" rather than "perfect lens".
    name: "edge-sliver",
    draw: (ctx, s) => {
      ctx.beginPath();
      ctx.moveTo(0, -0.95 * s); // tip
      // outer (right) side — fuller bulge, the "back" of the petal
      ctx.bezierCurveTo(
         0.26 * s, -0.40 * s,
         0.30 * s,  0.40 * s,
         0,         0.95 * s,
      );
      // inner (left) side — concave, the "cup" face of the petal
      ctx.bezierCurveTo(
        -0.06 * s,  0.40 * s,
        -0.10 * s, -0.40 * s,
         0,        -0.95 * s,
      );
      ctx.closePath();
      ctx.fill();
    },
  },
];

export const WISTERIA_VARIANTS: SpriteVariant[] = [
  {
    // single-petal — elongated asymmetric droplet with a banana-curve
    // along the long axis. Length:width ≈ 1.8:1. One end (the keel point
    // at -y) tapers more sharply; the base at +y is broader. The tip is
    // offset slightly to the right (+x) so the centerline traces a soft
    // arc rather than a straight line — that arc is the signature of
    // this variant, the V-notch equivalent for the wisteria set.
    //
    // The curvature must read at 6px after pre-render, otherwise the
    // sprite collapses to a generic asymmetric droplet that doesn't
    // distinguish wisteria from a sakura sliver. Tip x-offset 0.14 was
    // chosen so the curve is still legible after antialiasing at 5-6px.
    name: "single-petal",
    draw: (ctx, s) => {
      ctx.beginPath();
      ctx.moveTo(0.14 * s, -0.95 * s); // pointed tip, offset right
      // right (outer / convex) side — fuller belly
      ctx.bezierCurveTo(
         0.55 * s, -0.30 * s,
         0.42 * s,  0.55 * s,
         0,         0.95 * s,
      );
      // left (inner / concave) side — slimmer, returns to offset tip
      ctx.bezierCurveTo(
        -0.32 * s,  0.55 * s,
        -0.18 * s, -0.30 * s,
         0.14 * s, -0.95 * s,
      );
      ctx.closePath();
      ctx.fill();
    },
  },
  {
    // single-twisted — single-petal caught mid-tumble. Same family
    // (asymmetric droplet, banana-curve along long axis) but with two
    // departures that read as motion-frozen rather than a different
    // shape:
    //
    //   1) S-curve instead of arc — the centerline reverses direction
    //      mid-petal, so the tip is offset LEFT and the base is offset
    //      RIGHT (or vice versa). Real pea-flower petals don't do this
    //      in repose, only when caught spinning through 3D space.
    //
    //   2) ~70% aspect ratio of single-petal — foreshortened along the
    //      short axis as if viewed from a partly-edge angle. Length stays
    //      ±0.95s but the width controls are pulled in (~0.45s vs 0.55s
    //      on the convex flank).
    //
    // The intent is a "sister silhouette" — at any size in the contact
    // sheet, single-twisted should read as kin to single-petal in motion,
    // NOT as a third unrelated wisteria shape.
    name: "single-twisted",
    draw: (ctx, s) => {
      ctx.beginPath();
      // Tip offset LEFT (mirror of single-petal), base offset RIGHT,
      // centerline traces an S not an arc.
      ctx.moveTo(-0.10 * s, -0.95 * s);
      // upper-right flank — convex bulge near tip on the right side
      ctx.bezierCurveTo(
         0.30 * s, -0.65 * s,
         0.45 * s, -0.10 * s,
         0.10 * s,  0.95 * s,
      );
      // lower-left flank — convex bulge near base on the left side,
      // reversing the curvature direction (this is the "S" inflection)
      ctx.bezierCurveTo(
        -0.45 * s,  0.20 * s,
        -0.30 * s, -0.55 * s,
        -0.10 * s, -0.95 * s,
      );
      ctx.closePath();
      ctx.fill();
    },
  },
  {
    // Cluster silhouette — a raceme segment, not a single petal. Wisteria's
    // iconic visual is the hanging cluster ("purple curtain hanging"); this
    // variant carries that cultural register so the swarm doesn't read as
    // "small purple blobs falling alongside the pink ones".
    //
    // CRITICAL: rendered as a single closed silhouette, NOT as 2-3
    // overlapping individual petal paths. Stacked components blob into a
    // darker patch at small sizes — the entire reason the cluster has its
    // own bigger sizeRange (12-18px vs the 5-10 single-petal range) is to
    // keep the silhouette legible.
    //
    // Shape: teardrop hanging downward, narrowest at +y (the dangling tip),
    // widest near -y (where the raceme attaches to a branch in life), with
    // gentle scallops along the sides suggesting flowers without rendering
    // any individually.
    //
    // Lobe amplitude is intentionally small (~10% lateral excursion against
    // the underlying teardrop envelope, vs the earlier ~25-30%). The earlier
    // pass scalloped hard enough that the cluster read as "lumpy three-blob"
    // rather than "raceme with hint of structure" — at production sizes the
    // strong scallops also fought the petal-like reading of the single-petal
    // siblings. Gentler undulation lets the silhouette stay teardrop-first
    // with the flower-cluster reading as second-order detail.
    name: "cluster",
    sizeRange: { min: 12, max: 18 },
    draw: (ctx, s) => {
      ctx.beginPath();
      ctx.moveTo(0, -0.95 * s); // narrow attach point at top
      // left flank — three subtle scallops descending. Each segment's
      // outer control point sits ~0.05s outside the local envelope, so
      // the rendered curve hints at fullness without bulging out hard.
      // Max silhouette width ≈ 0.50s (vs 0.65s in the prior pass).
      ctx.bezierCurveTo(
        -0.35 * s, -0.90 * s,
        -0.50 * s, -0.70 * s,
        -0.50 * s, -0.40 * s,
      );
      ctx.bezierCurveTo(
        -0.50 * s, -0.15 * s,
        -0.40 * s,  0.10 * s,
        -0.38 * s,  0.30 * s,
      );
      ctx.bezierCurveTo(
        -0.32 * s,  0.55 * s,
        -0.15 * s,  0.85 * s,
         0,         0.95 * s, // narrow bottom point
      );
      // right flank — mirrored
      ctx.bezierCurveTo(
         0.15 * s,  0.85 * s,
         0.32 * s,  0.55 * s,
         0.38 * s,  0.30 * s,
      );
      ctx.bezierCurveTo(
         0.40 * s,  0.10 * s,
         0.50 * s, -0.15 * s,
         0.50 * s, -0.40 * s,
      );
      ctx.bezierCurveTo(
         0.50 * s, -0.70 * s,
         0.35 * s, -0.90 * s,
         0,        -0.95 * s,
      );
      ctx.closePath();
      ctx.fill();
    },
  },
];
