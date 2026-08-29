# Orikata Bio by Megure Labs

The public source for [orikata.ai](https://orikata.ai), the Orikata Bio site by Megure Labs.

This repository is the curated production surface. Development happens in a separate private repository, then approved application files and runtime assets are exported here. Internal design material, research, development tools, and work records are not part of this repository.

## Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS
- Static HTML export
- Cloudflare Workers Static Assets

## Local development

```bash
npm ci
npm run dev
```

The development server is available at `http://localhost:3000`.

## Verification

```bash
npm run typecheck
npm run lint
npm run build
npm run check
npm audit --omit=dev
```

`npm run build` writes a static site to `out/`. The production site does not require a Next.js server.

`npm run check` also renders deterministic desktop, mobile, small-mobile, and landscape previews. It fails on horizontal overflow, escaped or clipped lockup content, footer collisions, and insufficient mobile card inset.

## Deployment

Production is designed to deploy from this repository with Cloudflare Workers Builds.

- Production repository: `orikata-bio/orikata-site`
- Production Worker: `orikata-site`
- Canonical domain: `orikata.ai`
- Build command: `npm run build`
- Deploy command: `npx wrangler deploy`

The production `wrangler.toml` belongs to this public repository. It is intentionally not overwritten by the private development export.

## Brand surface

The site currently uses its own Orikata typography, palette, paper texture, and petal animation. These remain product-specific rather than inheriting the Megure Labs site theme.

Runtime font families currently include Yuji Syuku, IBM Plex Sans, and Zen Kaku Gothic New. Brand typography can evolve independently without changing the repository or domain architecture.

## Public release boundary

Only the declared application and runtime surface is synchronized into this repository. The public tree contains:

- application source under `src/`
- static runtime assets under `public/`
- package metadata and lockfile
- build, lint, TypeScript, PostCSS, and Tailwind configuration
- this README

The export excludes private briefs, research, development scripts, internal documentation, and packet records.
