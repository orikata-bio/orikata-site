/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static HTML export produces an `out/` directory of pure HTML/CSS/JS for
  // Cloudflare Workers Static Assets.
  output: "export",

  // Required when output: "export" since Next's image optimizer needs a server.
  images: { unoptimized: true },

  // Ensures URLs work consistently across hosts (trailing slashes -> directories).
  trailingSlash: true,

  reactStrictMode: true,

  // Keep Turbopack scoped to this repository even when a parent directory
  // contains an unrelated lockfile.
  turbopack: { root: process.cwd() },
};

export default nextConfig;
