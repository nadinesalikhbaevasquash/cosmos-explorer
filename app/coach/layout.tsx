import type { Metadata } from "next";
import { Inter, Cormorant_Garamond } from "next/font/google";
import CoachNav from "./components/CoachNav";

// Editorial type pairing — Inter for UI, Cormorant Garamond for the serif
// display face. Loaded here so the whole /coach sub-site inherits the Ladurée
// look without touching the dark root layout of the rest of the repo.
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-cormorant",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Study Abroad Coach — Plan Your Path to a Dream University",
    template: "%s | Study Abroad Coach",
  },
  description:
    "Find universities in the US, UK and Canada that fit your profile, generate a personalized application roadmap, and get instant feedback on your admissions essay.",
};

export default function CoachLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`${inter.variable} ${cormorant.variable} min-h-screen bg-cream text-espresso`}
      style={{
        fontFamily: "var(--font-inter), system-ui, -apple-system, sans-serif",
        fontFeatureSettings: "'cv01','cv02','cv03'",
      }}
    >
      <CoachNav />
      {children}
      <footer className="border-t border-sand bg-surface-2">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <p className="font-display text-lg font-semibold text-espresso">Study Abroad Coach</p>
          <p className="mt-1.5 max-w-md text-sm text-cocoa">
            A planning companion for high-schoolers applying to universities in the US, UK and
            Canada. Estimates are guidance, not admissions decisions.
          </p>
          <p className="mt-4 text-xs text-taupe">
            Built as a demo · No account needed · Your answers stay in your browser.
          </p>
        </div>
      </footer>
    </div>
  );
}
