import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin", "cyrillic"] });

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
    <html lang="en" className={`${geist.variable} h-full`}>
      <body
        className="min-h-full text-slate-100 antialiased"
        style={{ backgroundColor: "#030712", color: "#f1f5f9" }}
      >
        {children}
      </body>
    </html>
  );
}
