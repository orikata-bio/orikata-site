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

// Inline-SVG favicons — the 折 character, in each colorway. Encoded as
// data: URIs so they ship with the HTML and don't need a network round-trip.
//   wisteria-600: #604694
//   sakura-600:   #A0395E
const FAVICON_WISTERIA =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='78' font-size='84' font-family='serif' fill='%23604694'%3E%E6%8A%98%3C/text%3E%3C/svg%3E";
const FAVICON_SAKURA =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='78' font-size='84' font-family='serif' fill='%23A0395E'%3E%E6%8A%98%3C/text%3E%3C/svg%3E";

// Inline palette-switch script — runs synchronously in <head> before the
// body paints, so the brand colors and favicon are correct on first frame
// (no flash of wisteria → sakura). 50/50 PRNG roll per page load.
const PALETTE_SWITCH_SCRIPT = `(function(){
  if (Math.random() < 0.5) {
    document.documentElement.classList.add('palette-sakura');
    var icon = document.querySelector("link[rel='icon']");
    if (icon) icon.setAttribute('href', ${JSON.stringify(FAVICON_SAKURA)});
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
