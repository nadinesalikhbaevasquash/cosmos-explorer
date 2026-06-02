import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CosmosExplorer — Explore the Universe",
  description:
    "An interactive space exploration platform. Learn about planets, moons, stars, galaxies, black holes, and space missions.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} h-full`}>
      <body
        className="min-h-full text-slate-100 antialiased"
        style={{ backgroundColor: '#030712', color: '#f1f5f9' }}
      >
        {children}
      </body>
    </html>
  );
}
