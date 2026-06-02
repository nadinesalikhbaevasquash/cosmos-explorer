"use client";

import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import { localeNames } from "@/i18n/config";
import { useDict } from "@/app/hooks/useDict";

export default function Nav() {
  const dict   = useDict();
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const lang = (params?.lang as string) || "en";

  const LINKS = [
    { label: dict.nav.planets,      href: `/${lang}/#planets` },
    { label: dict.nav.moons,        href: `/${lang}/#moons` },
    { label: dict.nav.stars,        href: `/${lang}/#stars` },
    { label: dict.nav.galaxies,     href: `/${lang}/#galaxies` },
    { label: dict.nav.blackHoles,   href: `/${lang}/#black-holes` },
    { label: dict.nav.missions,     href: `/${lang}/missions` },
    { label: dict.nav.solarSystem,  href: `/${lang}/solar-system` },
  ];

  function switchLang(newLang: string) {
    // Replace current locale segment in pathname
    const newPath = pathname.replace(`/${lang}`, `/${newLang}`);
    router.push(newPath);
  }

  return (
    <nav
      className="sticky top-0 z-40 border-b border-white/5 backdrop-blur-md"
      style={{ backgroundColor: "rgba(3,7,18,0.88)" }}
    >
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
        {/* Brand */}
        <Link href={`/${lang}`} className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xl">🔭</span>
          <span className="font-bold text-base tracking-tight text-white">CosmosExplorer</span>
        </Link>

        {/* Page links */}
        <ul className="hidden lg:flex items-center gap-0.5 flex-1 justify-center">
          {LINKS.map((link) => {
            const isActive = pathname === link.href.split("#")[0] && !link.href.includes("#");
            return (
              <li key={link.label}>
                <Link
                  href={link.href}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                    isActive
                      ? "bg-indigo-600 text-white"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Language switcher */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {(Object.entries(localeNames) as [string, string][]).map(([code, name]) => (
            <button
              key={code}
              onClick={() => switchLang(code)}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all"
              style={{
                backgroundColor: lang === code ? "rgba(99,102,241,0.25)" : "rgba(255,255,255,0.04)",
                color: lang === code ? "#a5b4fc" : "#64748b",
                border: `1px solid ${lang === code ? "rgba(99,102,241,0.4)" : "rgba(255,255,255,0.06)"}`,
              }}
            >
              {code.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}
