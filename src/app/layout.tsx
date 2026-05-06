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
  // Inline SVG favicon — the 折 character, wisteria-600
  icons: {
    icon: [
      {
        url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='78' font-size='84' font-family='serif' fill='%23604694'%3E%E6%8A%98%3C/text%3E%3C/svg%3E",
        type: "image/svg+xml",
      },
    ],
  },
};

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
      </head>
      <body className="font-ibm font-light antialiased bg-rice-50 text-wisteria-600">
        <PaperTexture />
        {children}
      </body>
    </html>
  );
}
