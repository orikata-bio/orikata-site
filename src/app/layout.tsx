import type { Metadata, Viewport } from "next";
import "./globals.css";
import PaperTexture from "@/components/PaperTexture";

/* ============================================================
   Fonts loaded via standard <link> tags from Google Fonts CDN.
   Browser fetches at runtime; build is offline-clean.

   To upgrade to self-hosted fonts (faster, no FOUT, no external
   dependency), swap to next/font/google. See README.md "Fonts"
   section for the migration snippet — it requires the build
   environment to have network access to fonts.googleapis.com.
   ============================================================ */

export const metadata: Metadata = {
  metadataBase: new URL("https://orikata.ai"),
  // Frame stays "Orikata" alone (shibui restraint); tab title and link
  // previews carry the legal entity name "Orikata Bio" so investors and
  // share-card consumers land on something unambiguously named.
  title: "Orikata Bio",
  description: "Orikata — the way of folding.",
  openGraph: {
    title: "Orikata Bio",
    description: "The way of folding.",
    type: "website",
    url: "https://orikata.ai",
  },
  // Favicon is set via an explicit <link> tag in the layout below, not
  // through metadata.icons, because the inline palette-switch script
  // must run *after* the icon link in document order so it can mutate
  // the link's href when the sakura palette wins the 50/50 roll.
};

// Inline-SVG favicons — the wisteria single-petal silhouette in each
// colorway. Path is the same SVG translation of WISTERIA_VARIANTS'
// single-petal Bézier (centered, s=40 in a 100-viewBox so the curves
// don't touch the edges). Encoded as data: URIs so they ship with the
// HTML and don't need a network round-trip.
//
// Earlier iterations used the kanji 折 directly; that's been retired
// because it's a linguistic borrow from a culture none of the founders
// belong to, and the favicon is small but the principle is the same as
// the on-page kanji removal. The petal is a global flower silhouette
// that's already on the page (falling-petals canvas), so the favicon
// references an existing brand asset rather than an unrelated symbol.
//
//   wisteria-600: #604694
//   sakura-600:   #A0395E
const FAVICON_WISTERIA =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpath d='M 56 12 C 72 38 67 72 50 88 C 37 72 43 38 56 12 Z' fill='%23604694'/%3E%3C/svg%3E";
const FAVICON_SAKURA =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpath d='M 56 12 C 72 38 67 72 50 88 C 37 72 43 38 56 12 Z' fill='%23A0395E'/%3E%3C/svg%3E";

// Inline palette-switch script — runs synchronously in <head> before the
// body paints, so the brand colors and favicon are correct on first frame
// (no flash of wisteria → sakura). 50/50 PRNG roll per page load.
//
// For the favicon swap we replace the <link> element rather than mutating
// its `href` in place: Chrome and Safari aggressively cache the rendered
// favicon and an in-place `setAttribute('href', …)` often doesn't trigger
// a refetch, leaving the old icon visible while the new one is "set."
// Removing the node and inserting a fresh one bypasses that cache.
const PALETTE_SWITCH_SCRIPT = `(function(){
  if (Math.random() < 0.5) {
    document.documentElement.classList.add('palette-sakura');
    var old = document.querySelector("link[rel='icon']");
    if (old && old.parentNode) old.parentNode.removeChild(old);
    var icon = document.createElement('link');
    icon.rel = 'icon';
    icon.type = 'image/svg+xml';
    icon.href = ${JSON.stringify(FAVICON_SAKURA)};
    document.head.appendChild(icon);
  }
})();`;

export const viewport: Viewport = {
  themeColor: "#fdf6f0",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Yuji+Syuku&family=IBM+Plex+Sans:wght@300&display=swap"
        />
        <link rel="icon" type="image/svg+xml" href={FAVICON_WISTERIA} />
        <script dangerouslySetInnerHTML={{ __html: PALETTE_SWITCH_SCRIPT }} />
      </head>
      <body className="font-ibm font-light antialiased bg-rice-50 text-wisteria-600">
        <PaperTexture />
        {children}
      </body>
    </html>
  );
}
