import type { Config } from "tailwindcss";
import { PETAL_TIERS } from "./src/lib/tokens";

/**
 * Meguri brand family — design tokens.
 *
 * These tokens are shared across the Meguri family:
 *   - orikata.ai (this site)
 *   - megurilabs.org (sister site, ocean palette swaps in for wisteria/sakura)
 *   - casey personal site
 *
 * Color scales are OKLCH-derived 11-step ramps anchored at locked brand
 * hexes (see `COLORS.md` for the methodology and the per-step rationale).
 * Locked petal-animation tier hexes live in `src/lib/tokens.ts` and are
 * imported here so canvas and Tailwind cannot drift.
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // ─── Wisteria — primary brand purple (fuji-iro, hue ~297°) ────
        // Wordmark + frame at 600. Locked petal anchor at 500.
        wisteria: {
          50:  "#FAF0FF",
          100: "#F0E5FF",
          200: "#DCCEFF",
          300: "#C0B0EB",
          400: "#9984CB",
          500: "#7B62B8", // LOCKED — matches PETAL_TIERS.wisteria.deep
          600: "#604694", // LOCKED — wordmark + frame
          700: "#493275",
          800: "#311D55",
          900: "#1B0936",
          950: "#0C0020",
        },

        // ─── Sakura — cherry pink accent (hue ~340°, rose-magenta) ────
        // General-purpose pink. Hue is rose-shifted vs natural sakura
        // (~357°) so the deep steps stay pink instead of drifting to
        // burgundy as lightness drops; chroma is held higher through
        // 600/700 to keep the saturation reading. Petal canvas uses
        // sakura-petal-* tokens for atmospheric depth, not these steps.
        sakura: {
          50:  "#FFEDF5",
          100: "#FFDCE9",
          200: "#FBC1D7",
          300: "#F09EBB",
          400: "#DE7397",
          500: "#C24E78",
          600: "#A0395E",
          700: "#7E2848",
          800: "#591935",
          900: "#330D1E",
          950: "#1A0510",
        },

        // ─── Rice — warm neutral surfaces (hue ~63°) ─────────────────
        // Page-bg family. Carries unchanged across the Meguri brand
        // family. Dark warm tones live under `ink-*` to avoid duplication.
        rice: {
          50:  "#fdf6f0", // LOCKED — page bg
          100: "#F2EBE6",
          200: "#DDD6D0",
          300: "#C1B9B1",
          400: "#9A9087",
          500: "#7C7167",
        },

        // ─── Ink — warm dark text (hue ~67°) ─────────────────────────
        // Hue is intentionally close to rice so cool/warm don't fight.
        // Body text lands at 800.
        ink: {
          50:  "#FAF6F3",
          100: "#F0ECE8",
          200: "#DBD7D2",
          300: "#BFB9B4",
          400: "#97918B",
          500: "#78726B",
          600: "#5D5750",
          700: "#47413C",
          800: "#2F2A26", // body text
          900: "#191512",
          950: "#090705",
        },

        // ─── Locked petal-animation tiers (semantic) ──────────────────
        // Imported from src/lib/tokens.ts so canvas and CSS stay in lockstep.
        "sakura-petal": {
          light:   PETAL_TIERS.sakura.light,
          DEFAULT: PETAL_TIERS.sakura.mid,
          deep:    PETAL_TIERS.sakura.deep,
          deepest: PETAL_TIERS.sakura.deepest,
        },
        "wisteria-petal": {
          light:   PETAL_TIERS.wisteria.light,
          DEFAULT: PETAL_TIERS.wisteria.mid,
          deep:    PETAL_TIERS.wisteria.deep,
        },
      },

      // ─── Typography ─────────────────────────────────────────────
      fontFamily: {
        // Loaded via <link> in app/layout.tsx; see README for next/font migration.
        // Yuji Syuku is the brand display face (kanji-first calligraphic
        // brush; Latin glyphs carry the same brush character intentionally).
        // IBM Plex Sans is reserved for legal footer copy only.
        yuji: ['"Yuji Syuku"', "serif"],
        ibm:  ['"IBM Plex Sans"', "system-ui", "sans-serif"],
      },
      fontSize: {
        // clamp(min, fluid, max) — type scales with viewport
        "wordmark": ["clamp(52px, 9vw, 104px)", { lineHeight: "1" }],
        "kanji":    ["clamp(13px, 1.4vw, 16px)", { lineHeight: "1" }],
      },
      letterSpacing: {
        wordmark:  "0.005em",
        kanji:     "0.5em",
        footer:    "0.16em",
        copyright: "0.18em",
      },

      // ─── Spacing tokens ─────────────────────────────────────────
      spacing: {
        "frame-y":  "84px",
        "frame-x":  "124px",
        "footer":   "40px",
        "footer-b": "36px",
      },
    },
  },
  plugins: [],
};

export default config;
