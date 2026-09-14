import type { Metadata } from "next";
import { Unbounded, Manrope } from "next/font/google";
import "./globals.css";

// Geist is a neutral UI face — deliberately characterless, which is why the site
// read as flat. Swapped for a pairing with an actual voice:
//
//   Unbounded  geometric, wide, faintly futuristic. Carries the headings.
//   Manrope    warm and highly legible at small sizes. Carries everything else.
//
// Both ship Cyrillic, which is non-negotiable here: the site is trilingual, and a
// display face without Cyrillic would silently drop Russian to a system fallback
// while English kept the real font.
const display = Unbounded({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-unbounded",
  display: "swap",
});

const body = Manrope({
  subsets: ["latin", "cyrillic"],
  variable: "--font-manrope",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://astranova.uz"),
  title: {
    default: "AstraNova — Interactive Space Exploration",
    template: "%s | AstraNova",
  },
  description:
    "Explore planets, moons, stars, galaxies, black holes and space missions. Interactive space learning platform in English, Russian and Uzbek.",
  keywords: [
    "space", "planets", "solar system", "astronomy", "NASA", "galaxy", "black hole",
    "space missions", "cosmos", "universe", "космос", "планеты", "koinot", "sayyoralar",
  ],
  authors: [{ name: "AstraNova" }],
  creator: "AstraNova",
  publisher: "AstraNova",
  verification: { google: "ztaCt5VovkGNXYyx15D0MnRVdHYnR3sOX86PKa7YmlA" },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
  openGraph: {
    type: "website",
    siteName: "AstraNova",
    title: "AstraNova — Interactive Space Exploration",
    description: "Explore planets, moons, stars, galaxies, black holes and space missions.",
    url: "https://astranova.uz",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "AstraNova — Explore the Universe" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "AstraNova — Interactive Space Exploration",
    description: "Explore planets, moons, stars, galaxies, black holes and space missions.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "https://astranova.uz",
    languages: {
      "en": "https://astranova.uz/en",
      "ru": "https://astranova.uz/ru",
      "uz": "https://astranova.uz/uz",
    },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} h-full`}>
      <body
        className="min-h-full text-slate-100 antialiased"
        style={{ backgroundColor: "#060b18", color: "#f1f5f9" }}
      >
        {children}
      </body>
    </html>
  );
}
