# Orikata.ai

Coming-soon landing page for **orikata.ai**. Part of the Meguri brand family — sister site to megurilabs.org and the eventual personal site at caseymogilevsky.com (or wherever it lands).

**Stack:** Next.js 14 (App Router) · TypeScript · Tailwind CSS · static export → Cloudflare Pages

This stack matches the locked Meguri brand-family decision (see chat: "ICML submission review status", April 8 2026): `Next.js + TypeScript + Tailwind + CSS Modules`. Framer Motion / D3 / React Three Fiber will be added on the personal site for interactive visualizations; this coming-soon page doesn't need them yet.

---

## Quick start

```bash
npm install
npm run dev          # http://localhost:3000 — hot reload
npm run build        # → out/ static export
npm run typecheck    # tsc --noEmit
npm run lint         # next lint
```

Single command iteration loop: `npm run dev` → edit files → browser auto-refreshes. Claude Code can edit any value in `CONFIG`, `PALETTE`, the Tailwind theme, or a component, and you'll see it live within a second.

---

## Deploy

Static export means the entire site is plain HTML/CSS/JS in `out/` — works on any CDN, no Next.js runtime required.

**Cloudflare Pages (recommended):**

1. Push this repo to GitHub.
2. dash.cloudflare.com → Pages → Create a project → Connect to GitHub → select repo.
3. Build settings:
   - Framework preset: **Next.js (Static HTML Export)** (or **None** with the manual settings below)
   - Build command: `npm run build`
   - Build output directory: `out`
4. Deploy — `<project>.pages.dev` is live in ~90 seconds.
5. Pages → Custom domains → add `orikata.ai` and `www.orikata.ai`.

**DNS at Porkbun (since orikata.ai is registered there):**

Two paths — pick one:

- **Easier:** Stay on Porkbun's DNS. At Porkbun → Manage → DNS, add an `ALIAS` record for the apex `orikata.ai` → `<project>.pages.dev`, and a `CNAME` for `www` → same target. Cloudflare auto-issues the SSL cert.
- **Better long-term:** Change nameservers at Porkbun to Cloudflare's. Add the site to a free Cloudflare account; Cloudflare gives you two `xxx.ns.cloudflare.com` hostnames; paste those into Porkbun → Manage → Authoritative Nameservers. After propagation (5min–24hr) Cloudflare manages all DNS, Porkbun is just the registrar of record.

`.ai` domains can't transfer to Cloudflare Registrar — TLD isn't supported. Registration stays at Porkbun forever; only nameservers move.

**Email:** Porkbun has free email forwarding built in. `info@orikata.ai` → your real inbox in 30 seconds at Porkbun → Manage → Email Forwarding. No Workspace needed unless you want a real `.ai` mailbox later.

---

## File structure

```
orikata-landing/
├── src/
│   ├── app/
│   │   ├── layout.tsx          ← root: meta tags, fonts, body wrapper
│   │   ├── page.tsx            ← composes the three pieces
│   │   └── globals.css         ← Tailwind directives + minimal resets
│   ├── components/
│   │   ├── Frame.tsx           ← bordered wordmark + 折形 subtitle
│   │   ├── Footer.tsx          ← email mailto, copyright, blank left slot
│   │   └── PetalCanvas.tsx     ← 'use client' canvas animation
│   └── lib/
│       └── petal-config.ts     ← CONFIG + PALETTE for the animation
├── tailwind.config.ts          ← brand color tokens (sakura, fuji, etc.)
├── next.config.mjs             ← static export configured
├── package.json
└── BRIEF.md                    ← full design brief (locked vs open)
```

---

## Where to tune things

The codebase is structured so Claude Code (or any editor) can iterate without hunting:

### Animation — `src/lib/petal-config.ts`

| Want to change | Edit |
|---|---|
| Petal count | `CONFIG.petalCountDesktop`, `petalCountMobile` |
| Fall speed | `CONFIG.fallSpeedMin`, `fallSpeedMax` |
| Sakura/wisteria mix | `CONFIG.sakuraRatio` (0.7 = 70% sakura) |
| Petal sizes | `CONFIG.sakuraSizeMin/Max`, `wisteriaSizeMin/Max` |
| Sway intensity | `CONFIG.swayAmpMin/Max`, `swayFreqMin/Max` |
| Rotation speed | `CONFIG.rotSpeedMax` |
| Petal colors | `PALETTE.sakura`, `PALETTE.wisteria` arrays |

### Page chrome — `tailwind.config.ts`

All colors, spacing, type sizes, letter-spacing live in the Tailwind theme as design tokens. Components consume them as utility classes. Examples:

| Want to change | Edit |
|---|---|
| Background color | `colors["orikata-bg"]` |
| Wordmark/frame color | `colors.fuji` |
| Wordmark size | `fontSize.wordmark` (clamp value) |
| Kanji letter-spacing | `letterSpacing.kanji` |
| Footer letter-spacing | `letterSpacing.footer` |

Component-level layout (frame padding, footer position) lives in the Tailwind classes on `Frame.tsx` and `Footer.tsx`. Search the component for the class to change.

### Petal sprite shapes

The two methods `drawSakura()` and `drawWisteria()` in `PetalCanvas.tsx` are placeholders using parametric ellipses. Replace them to redesign the petal silhouettes — see `BRIEF.md` for the full sprite spec (variants per type, V-notch detail, pea-flower structure).

---

## Locked decisions

See `BRIEF.md` for the full version. Short list:

- **Typography:** M PLUS 2 ExtraBold (wordmark) + IBM Plex Sans 300 (footer). Both Google Fonts.
- **Palette:** Warm off-white `#fdf6f0`, fuji wordmark `#6b4c7a`, sakura + wisteria petals (locked tiers in PALETTE).
- **Structure:** Coefficient Bio framed wordmark — thin border, centered, dominant. Footer in corners + copyright centered.
- **Philosophy:** Wabi-sabi, Ma (negative space), shibui. Meditative restraint. Muji / Aesop / Snow Peak / Uniqlo aesthetic.

Don't change these without going back to the brief.

---

## Open work

1. **Petal sprites** — the parametric ellipses in `drawSakura()` / `drawWisteria()` are placeholders. Real sprites with multiple variants per type (top-down bloom, single petal, edge-on sliver, etc.) would lift this from "particles" to "atmosphere." See `BRIEF.md` for the full spec.
2. **Frame folded-corner detail** — possible v2: subtle origata-flavored fold on one corner of the frame. Easy win once the page is live.
3. **Eventual full site** — when this expands beyond coming-soon, add Framer Motion (transitions), D3 (any data viz), React Three Fiber (3D protein viewer) per the locked Meguri stack. Tailwind tokens already shared across the family, so design system migration is free.

---

## Notes

### Fonts: link tags now, next/font later

The current setup loads Google Fonts via `<link>` tags in `app/layout.tsx`. Works everywhere, no build-time network requirement, slightly less optimized than self-hosted (browser does the fetch on first load).

To migrate to `next/font/google` (recommended once you're iterating in an environment that can reach `fonts.googleapis.com` at build time):

```tsx
// src/app/layout.tsx
import { M_PLUS_2, IBM_Plex_Sans } from "next/font/google";

const mplus2 = M_PLUS_2({
  subsets: ["latin"],
  weight: ["500", "800"],
  variable: "--font-mplus2",
  display: "swap",
});
const ibmPlex = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["300", "400"],
  variable: "--font-ibm-plex",
  display: "swap",
});

// in RootLayout: <html lang="en" className={`${mplus2.variable} ${ibmPlex.variable}`}>
// remove the <link> tags from <head>
```

Then update `tailwind.config.ts`:

```ts
fontFamily: {
  mplus: ["var(--font-mplus2)", "sans-serif"],
  ibm:   ["var(--font-ibm-plex)", "-apple-system", "sans-serif"],
}
```

Self-hosting eliminates the Google CDN dependency, removes FOUT, and ships fonts with your build. Recommended once you've confirmed your build environment has network access to Google.

### Security advisories on Next.js 14

`npm audit` reports a few advisories on the pinned Next.js version. **None of them apply to a static-exported site** — they're all server-side runtime issues (Image Optimizer, RSC HTTP deserialization, rewrites, image disk cache, RSC DoS). We use `output: "export"` with `images: { unoptimized: true }`, so there's no Next.js runtime in production. The advisories matter only if you flip back to a server deployment.

If you want zero advisories, bump to Next 16 and resolve the React peer dep conflicts. For now, this is fine.

---

## Brand reference

| | |
|---|---|
| Parent company | Meguri (巡り) — cycle, circulation |
| This entity | Orikata Bio PBC — protein design vertical |
| Sister site | megurilabs.org — same template, ocean palette + waves |
| Type system | M PLUS 2 (display) + IBM Plex Sans (body) — Google Fonts |
| Reference | coefficientbio.com — framed wordmark structure |
| Design philosophy | wabi-sabi, Ma (間), shibui, kanso |
