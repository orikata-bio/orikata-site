/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static HTML export — produces an `out/` directory of pure HTML/CSS/JS.
  // Drop into Cloudflare Pages, Vercel, Netlify, or any static host.
  output: "export",

  // Required when output: "export" since Next's image optimizer needs a server.
  images: { unoptimized: true },

  // Ensures URLs work consistently across hosts (trailing slashes -> directories).
  trailingSlash: true,

  reactStrictMode: true,
};

export default nextConfig;
