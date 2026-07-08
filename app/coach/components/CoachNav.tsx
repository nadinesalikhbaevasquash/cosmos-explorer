"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GraduationCap } from "lucide-react";

const LINKS = [
  { href: "/coach/results", label: "Universities" },
  { href: "/coach/roadmap", label: "Roadmap" },
  { href: "/coach/essay", label: "Essay Feedback" },
];

export default function CoachNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-sand bg-cream/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link href="/coach" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sage shadow-soft">
            <GraduationCap className="h-5 w-5 text-white" strokeWidth={2.2} />
          </span>
          <span className="font-display text-lg font-semibold tracking-tight text-espresso">
            Study Abroad Coach
          </span>
        </Link>

        <nav className="hidden items-center gap-1 sm:flex">
          {LINKS.map((l) => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-sage-tint text-sage-ink"
                    : "text-cocoa hover:bg-cream-deep hover:text-espresso"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
          <Link
            href="/coach/onboarding"
            className="ml-1 rounded-lg bg-espresso px-3.5 py-1.5 text-sm font-semibold text-cream transition-colors hover:bg-sage-ink"
          >
            Start
          </Link>
        </nav>

        <Link
          href="/coach/onboarding"
          className="rounded-lg bg-espresso px-3.5 py-1.5 text-sm font-semibold text-cream sm:hidden"
        >
          Start
        </Link>
      </div>
    </header>
  );
}
