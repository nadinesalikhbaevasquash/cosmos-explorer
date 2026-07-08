import Link from "next/link";
import { Inter, Cormorant_Garamond } from "next/font/google";

// Editorial type pairing — Inter for UI, Cormorant Garamond for display serif.
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-cormorant",
  display: "swap",
});

export default async function TravelPlannerLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;

  return (
    <div
      className={`${inter.variable} ${cormorant.variable} min-h-screen bg-cream text-espresso`}
      style={{ fontFamily: "var(--font-inter), system-ui, -apple-system, sans-serif", fontFeatureSettings: "'cv01','cv02','cv03'" }}
    >
      {/* Editorial top bar */}
      <header className="sticky top-0 z-50 border-b border-sand bg-cream/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link href={`/${lang}/travel-planner`} className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-sage shadow-soft">
              <span className="text-[11px] font-black tracking-tight text-white">V</span>
            </span>
            <span className="font-display text-base font-semibold tracking-tight text-espresso">Voyage</span>
          </Link>
          <nav className="flex items-center gap-1.5">
            <Link
              href={`/${lang}/travel-planner`}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-cocoa transition-colors hover:bg-cream-deep hover:text-espresso"
            >
              Plan
            </Link>
            <Link
              href={`/${lang}/travel-planner/trips`}
              className="rounded-lg border border-sand-deep px-3 py-1.5 text-sm font-semibold text-cocoa transition-all hover:border-sage hover:text-sage-ink"
            >
              Saved trips
            </Link>
          </nav>
        </div>
      </header>

      {children}
    </div>
  );
}
