"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { label: "Planets",     href: "/#planets" },
  { label: "Moons",       href: "/#moons" },
  { label: "Stars",       href: "/#stars" },
  { label: "Galaxies",    href: "/#galaxies" },
  { label: "Black Holes", href: "/#black-holes" },
  { label: "Missions",    href: "/missions" },
  { label: "Solar System", href: "/solar-system" },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-40 border-b border-white/5 backdrop-blur-md" style={{ backgroundColor: "rgba(3,7,18,0.85)" }}>
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 flex-shrink-0">
          <span className="text-2xl">🔭</span>
          <span className="font-bold text-lg tracking-tight text-white">CosmosExplorer</span>
        </Link>
        <ul className="hidden md:flex items-center gap-1 flex-wrap">
          {LINKS.map((link) => {
            const isActive =
              link.href === pathname ||
              (link.href.startsWith("/#") && pathname === "/");
            return (
              <li key={link.label}>
                <Link
                  href={link.href}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors whitespace-nowrap ${
                    isActive && link.href === pathname
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
      </div>
    </nav>
  );
}
