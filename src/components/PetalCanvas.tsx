"use client";

import { useEffect, useRef } from "react";
import { CONFIG, PALETTE, buildGradient } from "@/lib/petal-config";
import { SAKURA_VARIANTS, WISTERIA_VARIANTS, type SpriteVariant } from "@/lib/sprites";

/* ============================================================
   PetalCanvas — falling sakura + wisteria over the page
   ============================================================
   Single canvas, single rAF loop. DPR-aware for retina crispness.
   Honors prefers-reduced-motion via CSS (canvas hidden when set).

   Sprite shapes live in `src/lib/sprites.ts` so the contact-sheet
   render script (`dev/render-sprites.mjs`, run via `npm run sprites`)
   can import them outside a React tree. See `SPRITES.md` for the
   design spec and the iteration loop.

   At init we pre-render each (variant × color-tier) to an offscreen
   canvas (DPR-aware), then the rAF loop just drawImage's those
   sprites with rotation per petal instance.
============================================================ */

type Kind = "sakura" | "wisteria";

/**
 * Flat sprite pool — replaces the (variant × color) cartesian table.
 *
 * Each slot is built from a randomly chosen variant template, a randomly
 * chosen color from the gradient, and a randomly chosen pre-bake transform
 * (scale x/y, skew x). The transform applies once at sprite-render time so
 * every pool slot has a slightly different silhouette: stretched, squashed,
 * or sheared variants of the seven base templates. A pool of POOL_SIZE
 * slots gives every petal instance an effectively unique shape rather than
 * one of seven repeated templates.
 *
 * Memory: POOL_SIZE × cssDim² × DPR² × 4 bytes per kind. With POOL_SIZE=64
 * and cssDim ≈ 50 px, that's ~64 × 50² × 4 × 4 ≈ 2.5 MB per kind, ~5 MB
 * total — same order as the previous (variant × color) table.
 */
type SpritePool = {
  cssDim: number;
  naturalSize: number;
  slots: Array<{
    canvas: HTMLCanvasElement;
    sizeRange: { min: number; max: number };
  }>;
};

const POOL_SIZE = 64;

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function buildSpritePool(
  variants: ReadonlyArray<SpriteVariant>,
  colors: ReadonlyArray<string>,
  defaultRange: { min: number; max: number },
  dpr: number,
  poolSize: number = POOL_SIZE,
): SpritePool {
  // naturalSize covers the largest variant in this kind so the offscreen
  // canvas fits even oversized variants (the wisteria cluster). Smaller
  // variants downscale via drawImage at runtime.
  const naturalSize = Math.max(
    defaultRange.max,
    ...variants.map((v) => v.sizeRange?.max ?? 0),
  );
  // Padding bumped from the prior 1.4 to 1.6 because the per-slot transform
  // (scaleX/Y up to 1.2, skewX up to ±0.18 rad) can push a max-size petal's
  // silhouette outside the un-padded canvas; clipped sprites read as
  // truncated petals at the diagonal extents.
  const cssDim = Math.ceil(naturalSize * 1.6 * 2);
  const pool: SpritePool = { cssDim, naturalSize, slots: [] };

  for (let i = 0; i < poolSize; i++) {
    const variant = variants[Math.floor(Math.random() * variants.length)]!;
    const color = colors[Math.floor(Math.random() * colors.length)]!;

    // Pre-bake transform — applied to the canvas before the variant draws.
    // Pushed harder than the prior modest range because at petal sizes
    // (5-18 px), ±15% scale and ±10° skew were imperceptible — pool slots
    // looked like the same 7 templates with slight color variation.
    //   scaleX, scaleY independently 0.70..1.40 → up to ±40% squash/stretch
    //   skewX up to ±0.40 rad (~23°) → noticeably leaning silhouette
    // scaleX/scaleY are sampled independently so a slot can be tall+narrow
    // OR short+wide, producing very different aspect ratios from the same
    // base bezier. No skewY — the runtime rotation would compose with it
    // unpredictably and create a wobbly orbit instead of a falling shape.
    const scaleX = 0.7 + Math.random() * 0.7;
    const scaleY = 0.7 + Math.random() * 0.7;
    const skewX = (Math.random() - 0.5) * 0.8;

    const c = document.createElement("canvas");
    c.width = cssDim * dpr;
    c.height = cssDim * dpr;
    const sctx = c.getContext("2d");
    if (!sctx) continue;
    sctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    sctx.translate(cssDim / 2, cssDim / 2);
    // Apply the per-slot deformation, then draw the variant template.
    sctx.transform(scaleX, 0, skewX, scaleY, 0, 0);
    sctx.fillStyle = color;
    variant.draw(sctx, variant.sizeRange?.max ?? defaultRange.max);

    pool.slots.push({
      canvas: c,
      sizeRange: variant.sizeRange ?? defaultRange,
    });
  }
  return pool;
}

class Petal {
  kind!: Kind;
  x!: number;
  y!: number;
  size!: number;
  fallSpeed!: number;
  swayAmp!: number;
  swayFreq!: number;
  swayPhase!: number;
  rotation!: number;
  rotSpeed!: number;
  sprite!: HTMLCanvasElement;
  spriteDrawSize!: number; // CSS px — destination side length for drawImage

  constructor(
    private W: () => number,
    private H: () => number,
    private sakura: SpritePool,
    private wisteria: SpritePool,
    private sakuraRatio: number,
    initial: boolean,
  ) {
    this.reset(initial);
  }

  reset(initial: boolean) {
    this.kind = Math.random() < this.sakuraRatio ? "sakura" : "wisteria";
    this.x = Math.random() * this.W();
    this.y = initial ? Math.random() * this.H() : -30 - Math.random() * 200;

    this.fallSpeed = rand(CONFIG.fallSpeedMin, CONFIG.fallSpeedMax);
    this.swayAmp = rand(CONFIG.swayAmpMin, CONFIG.swayAmpMax);
    this.swayFreq = rand(CONFIG.swayFreqMin, CONFIG.swayFreqMax);
    this.swayPhase = Math.random() * Math.PI * 2;
    this.rotation = Math.random() * Math.PI * 2;
    this.rotSpeed = (Math.random() - 0.5) * 2 * CONFIG.rotSpeedMax;

    // Pick a slot from the pool. Each slot already encodes a (variant,
    // color, deformation) trio sampled at init, so there's no separate
    // variant/color decision here — every slot is a pre-baked unique sprite.
    const pool = this.kind === "sakura" ? this.sakura : this.wisteria;
    const slot = pool.slots[Math.floor(Math.random() * pool.slots.length)]!;
    this.sprite = slot.canvas;

    this.size = rand(slot.sizeRange.min, slot.sizeRange.max);
    this.spriteDrawSize = (this.size / pool.naturalSize) * pool.cssDim;
  }

  update(t: number) {
    this.y += this.fallSpeed;
    this.x += Math.sin(t * this.swayFreq + this.swayPhase) * this.swayAmp;
    this.rotation += this.rotSpeed;

    const w = this.W();
    const h = this.H();
    if (this.y > h + 40 || this.x < -40 || this.x > w + 40) {
      this.reset(false);
      this.x = Math.random() * w;
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    const d = this.spriteDrawSize;
    ctx.drawImage(this.sprite, -d / 2, -d / 2, d, d);
    ctx.restore();
  }
}

export default function PetalCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let W = window.innerWidth;
    let H = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width = W + "px";
      canvas.style.height = H + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    // Continuous OKLCH interpolation across the locked palette tiers,
    // replacing discrete tier sampling. Each sprite gets pre-rendered for
    // every gradient sample.
    //
    // Sakura uses 32 samples across 4 control points (~10 samples per
    // segment). Wisteria uses 64 samples across 3 control points (~32 per
    // segment) — fewer anchor points means each segment spans a longer
    // OKLCH walk, so we double the sampling density to keep perceptual
    // step size comparable to sakura and avoid visible color stations in
    // the wisteria scatter.
    const sakuraColors   = buildGradient(PALETTE.sakura,   32);
    const wisteriaColors = buildGradient(PALETTE.wisteria, 64);

    const sakuraSprites = buildSpritePool(
      SAKURA_VARIANTS,
      sakuraColors,
      { min: CONFIG.sakuraSizeMin, max: CONFIG.sakuraSizeMax },
      dpr,
    );
    const wisteriaSprites = buildSpritePool(
      WISTERIA_VARIANTS,
      wisteriaColors,
      { min: CONFIG.wisteriaSizeMin, max: CONFIG.wisteriaSizeMax },
      dpr,
    );

    const count =
      window.innerWidth < CONFIG.mobileBreakpoint
        ? CONFIG.petalCountMobile
        : CONFIG.petalCountDesktop;

    // Bimodal petal mix — bias the sakura:wisteria split toward the colorway
    // that won this load's palette roll (.palette-sakura on <html>), giving the
    // dominant hue a random share so the exact ratio varies load to load.
    const dominant =
      CONFIG.dominantPetalMin +
      Math.random() * (CONFIG.dominantPetalMax - CONFIG.dominantPetalMin);
    const sakuraRatio = document.documentElement.classList.contains(
      "palette-sakura",
    )
      ? dominant
      : 1 - dominant;

    const petals: Petal[] = [];
    for (let i = 0; i < count; i++) {
      petals.push(
        new Petal(
          () => W,
          () => H,
          sakuraSprites,
          wisteriaSprites,
          sakuraRatio,
          true,
        ),
      );
    }

    let raf = 0;
    const start = performance.now();
    const loop = () => {
      const t = performance.now() - start;
      ctx.clearRect(0, 0, W, H);
      for (const p of petals) {
        p.update(t);
        p.draw(ctx);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 z-[1] h-full w-full pointer-events-none motion-reduce:hidden"
    />
  );
}
