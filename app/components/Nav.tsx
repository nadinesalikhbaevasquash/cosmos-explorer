"use client";

/**
 * Site navigation.
 *
 * Twelve flat links used to sit in this bar with no hierarchy, which made a visitor
 * choose between "Moons" and "Scale" with nothing to say which mattered. Crossfire
 * caps its bar at five or six short links, with a comment in its own Nav saying that
 * seven two-word links is what made the bar wrap.
 *
 * The reorganisation is around what the site is *for*, which is learning, not around
 * what pages happen to exist:
 *
 *   Learn       the guided path: topics, in order
 *   Practice    the things that test you
 *   Explore     the interactive instruments, for when you want to wander
 *   Observatory promoted on its own, because it is the flagship
 *
 * Menus open on click, never hover: hover menus are unusable on touch, and on a
 * laptop they fire when the pointer only crosses the bar on its way somewhere else.
 *
 * No emoji anywhere. Every glyph is an animated inline SVG from SpaceCast, because
 * emoji render differently on every device, cannot take the site's palette, and
 * cannot move.
 */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { localeNames } from "@/i18n/config";
import { useDict } from "@/app/hooks/useDict";
import AccountControls from "@/app/components/AccountControls";
import {
  Astronaut,
  BlackHole,
  Comet,
  EarthGlobe,
  Galaxy,
  Magnifier,
  Moon,
  Planet,
  Rocket,
  Satellite,
  SunStar,
  Target,
  Telescope,
} from "@/app/components/SpaceCast";
import { track } from "@/app/lib/analytics";

type Icon = (p: { className?: string }) => React.ReactElement;
type Item = { label: string; href: string; Icon: Icon };
type Group = { id: string; label: string; items: Item[] };

export default function Nav() {
  const dict = useDict();
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const lang = (params?.lang as string) || "en";

  const [open, setOpen] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const barRef = useRef<HTMLDivElement | null>(null);

  const n = dict.nav;

  const GROUPS: Group[] = [
    {
      id: "learn",
      label: n.learn,
      items: [
        { label: n.planets,    href: `/${lang}/topics#planets`,     Icon: Planet },
        { label: n.moons,      href: `/${lang}/topics#moons`,       Icon: Moon },
        { label: n.stars,      href: `/${lang}/topics#stars`,       Icon: SunStar },
        { label: n.galaxies,   href: `/${lang}/topics#galaxies`,    Icon: Galaxy },
        { label: n.blackHoles, href: `/${lang}/topics#black-holes`, Icon: BlackHole },
        { label: n.missions,   href: `/${lang}/missions`,     Icon: Satellite },
      ],
    },
    {
      id: "daily",
      label: n.daily,
      items: [{ label: n.quiz, href: `/${lang}/quiz`, Icon: Target }],
    },
    {
      id: "explore",
      label: n.explore,
      items: [
        { label: n.solarSystem, href: `/${lang}/solar-system`, Icon: Planet },
        { label: n.scale,       href: `/${lang}/scale`,        Icon: Magnifier },
        { label: n.exoplanets,  href: `/${lang}/exoplanets`,   Icon: EarthGlobe },
        { label: n.travelTime,  href: `/${lang}/travel-time`,  Icon: Rocket },
      ],
    },
  ];

  // Close on outside click, on Escape, and whenever the route changes.
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (barRef.current && !barRef.current.contains(e.target as Node)) setOpen(null);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(null);
        setMobileOpen(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  useEffect(() => {
    setOpen(null);
    setMobileOpen(false);
  }, [pathname]);

  function switchLang(next: string) {
    track("language_switched", { from: lang, to: next });
    router.push(pathname.replace(`/${lang}`, `/${next}`));
  }

  const obsHref = `/${lang}/observatory`;
  const obsActive = pathname.startsWith(obsHref);

  return (
    <nav
      className="sticky top-0 z-50 border-b border-white/5 backdrop-blur-md"
      style={{ backgroundColor: "rgba(3,7,18,0.9)" }}
    >
      <div ref={barRef} className="max-w-7xl mx-auto px-5 sm:px-6">
        <div className="flex items-center gap-3 py-3">
          {/* Brand */}
          <Link href={`/${lang}`} className="group flex items-center gap-2 flex-shrink-0">
            <Telescope className="h-8 w-8 transition-transform group-hover:scale-110" />
            <span className="font-bold text-lg tracking-tight text-white">
              Astra<span className="text-indigo-400">Nova</span>
            </span>
          </Link>

          {/* Grouped menus */}
          <div className="hidden md:flex items-center gap-1 flex-1 justify-center">
            {GROUPS.map((g) => (
              <div key={g.id} className="relative">
                <button
                  onClick={() => setOpen(open === g.id ? null : g.id)}
                  aria-expanded={open === g.id}
                  aria-haspopup="true"
                  className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-[14px] font-medium transition-colors ${
                    open === g.id
                      ? "bg-white/10 text-white"
                      : "text-slate-300 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {g.label}
                  <motion.span
                    animate={{ rotate: open === g.id ? 180 : 0 }}
                    transition={{ duration: 0.18 }}
                    className="text-[9px] text-slate-500"
                    aria-hidden
                  >
                    ▼
                  </motion.span>
                </button>

                <AnimatePresence>
                  {open === g.id && (
                    <motion.div
                      initial={{ opacity: 0, y: -6, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.98 }}
                      transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
                      className="absolute left-0 top-full mt-2 min-w-[236px] overflow-hidden rounded-2xl border border-white/10 p-1.5 shadow-2xl"
                      style={{ backgroundColor: "rgba(13,17,33,0.98)", backdropFilter: "blur(20px)" }}
                    >
                      {g.items.map(({ label, href, Icon }) => (
                        <Link
                          key={href}
                          href={href}
                          onClick={() => setOpen(null)}
                          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] text-slate-300 transition-colors hover:bg-indigo-500/15 hover:text-white"
                        >
                          <Icon className="h-6 w-6 flex-shrink-0" />
                          {label}
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}

            {/* Flagship, promoted out of the menus */}
            <Link
              href={obsHref}
              className={`ml-1 flex items-center gap-2 rounded-lg px-3.5 py-2 text-[14px] font-medium transition-colors ${
                obsActive
                  ? "bg-indigo-500/25 text-white"
                  : "text-indigo-300 hover:bg-indigo-500/15 hover:text-white"
              }`}
            >
              <Comet className="h-5 w-5" />
              {n.observatory}
            </Link>
          </div>

          {/* Language and account.
              On a phone the brand, three language buttons, the account links and the
              menu button came to 426px on a 390px screen, which pushed the menu button
              off the edge: the whole site nav was unreachable and every page scrolled
              sideways. Below `sm` the bar now carries only the brand and the menu;
              languages and the account move into the menu itself. */}
          <div className="ml-auto flex items-center gap-1 flex-shrink-0 md:ml-0">
            <div className="hidden items-center gap-1 sm:flex">
              {(Object.keys(localeNames) as string[]).map((code) => (
                <button
                  key={code}
                  onClick={() => switchLang(code)}
                  aria-current={lang === code ? "true" : undefined}
                  className="rounded-lg px-2.5 py-1 text-[12px] font-semibold uppercase transition-all"
                  style={{
                    backgroundColor: lang === code ? "rgba(99,102,241,0.25)" : "rgba(255,255,255,0.04)",
                    color: lang === code ? "#a1aff1" : "#64748b",
                    border: `1px solid ${lang === code ? "rgba(99,102,241,0.4)" : "rgba(255,255,255,0.06)"}`,
                  }}
                >
                  {code}
                </button>
              ))}

              <span className="mx-1 h-5 w-px bg-white/10" aria-hidden />
              <AccountControls />
            </div>

            <button
              onClick={() => setMobileOpen((v) => !v)}
              aria-expanded={mobileOpen}
              aria-label={n.menu}
              className="ml-1 flex h-11 min-w-11 items-center justify-center rounded-xl border border-white/10 px-3 text-[16px] font-medium text-slate-300 md:hidden"
            >
              {/* Drawn, not typed: "☰" rendered as an empty box in browsers whose
                  fonts lack U+2630, which hid the only way into the phone nav. */}
              <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
                {mobileOpen ? (
                  <path d="M5 5l10 10M15 5L5 15" />
                ) : (
                  <path d="M3.5 6h13M3.5 10h13M3.5 14h13" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile: the same groups, stacked, rather than a wall of links */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="overflow-hidden md:hidden"
            >
              <div className="space-y-4 border-t border-white/5 py-4">
                <Link
                  href={obsHref}
                  className="flex items-center gap-2.5 rounded-xl border border-indigo-400/30 bg-indigo-500/15 px-4 py-3 text-[15px] font-semibold text-white"
                >
                  <Comet className="h-6 w-6" />
                  {n.observatory}
                </Link>
                {GROUPS.map((g) => (
                  <div key={g.id}>
                    <p className="px-1 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      {g.label}
                    </p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {g.items.map(({ label, href, Icon }) => (
                        <Link
                          key={href}
                          href={href}
                          className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-[14px] text-slate-300"
                        >
                          <Icon className="h-6 w-6 flex-shrink-0" />
                          {label}
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Moved here from the bar on phones, where they did not fit. */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/5 pt-4 sm:hidden">
                  <div className="flex gap-1.5">
                    {(Object.keys(localeNames) as (keyof typeof localeNames)[]).map((code) => (
                      <button
                        key={code}
                        onClick={() => switchLang(code)}
                        aria-current={lang === code ? "true" : undefined}
                        className="h-10 rounded-xl px-3 text-[13px] font-semibold transition-all"
                        style={{
                          backgroundColor: lang === code ? "rgba(99,102,241,0.25)" : "rgba(255,255,255,0.04)",
                          color: lang === code ? "#a1aff1" : "#94a3b8",
                          border: `1px solid ${lang === code ? "rgba(99,102,241,0.4)" : "rgba(255,255,255,0.08)"}`,
                        }}
                      >
                        {localeNames[code]}
                      </button>
                    ))}
                  </div>
                  <AccountControls />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
}
