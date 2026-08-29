import type { Metadata, Viewport } from "next";
import "./globals.css";

/* ============================================================
   Fonts loaded via standard <link> tags from Google Fonts CDN.
   Browser fetches at runtime; build is offline-clean.
   ============================================================ */

export const metadata: Metadata = {
  metadataBase: new URL("https://orikata.ai"),
  // Tab title + link previews carry the legal entity name "Orikata Bio".
  title: "Orikata Bio",
  description: "Orikata Bio by Megure Labs. The way of folding.",
  openGraph: {
    title: "Orikata Bio",
    description: "Orikata Bio by Megure Labs. The way of folding.",
    type: "website",
    url: "https://orikata.ai",
  },
  // Favicon is set via an explicit <link> below (not metadata.icons) so the
  // inline palette-switch script can swap its href when the sakura roll wins.
};

/* ============================================================
   FAVICON — the Orikata origami-O mark (same decagon aperture as the
   pitch-deck logo, extracted to public/mark-{wisteria,sakura}.svg).

   Wisteria is the SSR / first-paint default; the inline script below
   swaps the icon to the sakura mark when the 50/50 palette roll lands
   sakura, so the browser-tab icon always matches the page's colorway.
   The link is removed + re-inserted (not just href-mutated) because
   Chrome/Safari aggressively cache favicons and an in-place href change
   often doesn't trigger a refetch.
============================================================ */
const PALETTE_SWITCH_SCRIPT = `(function(){
  var threshold = 0.25 + Math.random() * 0.5;
  if (Math.random() < threshold) {
    document.documentElement.classList.add('palette-sakura');
    var old = document.querySelector("link[rel='icon']");
    if (old && old.parentNode) old.parentNode.removeChild(old);
    var icon = document.createElement('link');
    icon.rel = 'icon';
    icon.type = 'image/svg+xml';
    icon.href = '/mark-sakura.svg';
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
          href="https://fonts.googleapis.com/css2?family=Yuji+Syuku&family=IBM+Plex+Sans:wght@300&family=Zen+Kaku+Gothic+New:wght@500;700&display=swap"
        />
        {/* Origami-O favicon — wisteria default; the script swaps it to the
            sakura mark when the palette roll lands sakura. */}
        <link rel="icon" type="image/svg+xml" href="/mark-wisteria.svg" />
        <script dangerouslySetInnerHTML={{ __html: PALETTE_SWITCH_SCRIPT }} />
      </head>
      <body className="font-brand font-light antialiased bg-rice-50 text-wisteria-600">
        {children}
      </body>
    </html>
  );
}
