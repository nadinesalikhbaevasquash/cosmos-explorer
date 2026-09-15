'use client'

/**
 * The frame every mission sits in: the dome background, the mission tabs, and the
 * night budget.
 *
 * Lifted out of mission 1's page so mission 2 is the same instrument rather than a
 * look-alike. The budget takes its total as a prop because the missions ration time
 * differently; everything else about it, including the rule that it is always on
 * screen, is shared.
 */

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import Nav from '@/app/components/Nav'
import Starfield from '@/app/components/Starfield'
import { useDict } from '@/app/hooks/useDict'
import { fmt } from '../lib/format'

export default function ObservatoryShell({
  lang,
  nightsLeft,
  total,
  showBudget = true,
  children,
}: {
  lang: string
  nightsLeft: number
  total: number
  showBudget?: boolean
  children: React.ReactNode
}) {
  const t = useDict().observatory
  return (
    <div className="relative min-h-screen bg-[#060b18]">
      {/* The dome, lit the same way as the rest of the site. Density is lower than
          the hub's: this page is an instrument panel, and a busy sky behind a light
          curve competes with the data. */}
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <Starfield density={0.5} />
        <div className="absolute rounded-full blur-3xl pointer-events-none -left-32 top-10 h-96 w-96" style={{ background: 'rgba(99,102,241,0.14)' }} />
        <div className="absolute rounded-full blur-3xl pointer-events-none right-[-8rem] top-[28rem] h-80 w-80" style={{ background: 'rgba(192,132,252,0.08)' }} />
      </div>
      <Nav />
      <main className="relative mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
        <MissionTabs lang={lang} />
        {showBudget && <NightBudget nightsLeft={nightsLeft} total={total} />}
        {children}
        <div className="mt-12 border-t border-white/5 pt-6">
          <Link
            href={`/${lang}`}
            className="inline-block py-2.5 text-[13px] text-slate-400 transition-colors hover:text-slate-200"
          >
            ← {t.backToGames}
          </Link>
        </div>
      </main>
    </div>
  )
}

/** Two missions, one instrument. Tabs make the second one discoverable from the first. */
function MissionTabs({ lang }: { lang: string }) {
  const m = useDict().observatory.missions
  const pathname = usePathname()
  const tabs = [
    { n: '01', title: m.one, href: `/${lang}/observatory` },
    { n: '02', title: m.two, href: `/${lang}/observatory/seven` },
  ]
  return (
    // Two equal halves rather than a scrolling strip: on a phone the strip cut the
    // second mission's name in half, which is the one tab this row exists to advertise.
    <div className="mb-5 grid grid-cols-2 gap-2 sm:flex" role="tablist">
      {tabs.map((tab) => {
        const active = pathname === tab.href
        return (
          <Link
            key={tab.n}
            href={tab.href}
            role="tab"
            aria-selected={active}
            className={`flex min-w-0 flex-col gap-0.5 rounded-2xl border px-3.5 py-2.5 text-[13px] transition-colors sm:flex-row sm:items-baseline sm:gap-2 sm:rounded-full sm:px-4 sm:py-2 ${
              active
                ? 'border-indigo-400/50 bg-indigo-500/20 text-white'
                : 'border-white/10 bg-white/[0.02] text-slate-400 hover:border-indigo-400/30 hover:text-white'
            }`}
          >
            <span className="font-mono text-[11px] text-indigo-300">{fmt(m.label, { n: tab.n })}</span>
            <span className="truncate font-medium">{tab.title}</span>
          </Link>
        )
      })}
    </div>
  )
}

/**
 * The night budget, pinned above everything.
 *
 * Always visible on purpose. The player should never be able to spend nights without
 * seeing the cost, because the moment the budget is out of sight the game stops being
 * about allocation and starts being about clicking.
 */
export function NightBudget({ nightsLeft, total }: { nightsLeft: number; total: number }) {
  const t = useDict().observatory
  const used = total - nightsLeft
  const pct = (nightsLeft / total) * 100
  const colour = pct > 50 ? '#7e88ec' : pct > 20 ? '#e2b43d' : '#ec8090'

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] mb-6 px-4 py-3.5 sm:px-5 sm:py-4">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[11px] uppercase tracking-wider text-slate-500">
          {t.timeRemaining}
        </span>
        <span className="font-mono text-sm tabular-nums whitespace-nowrap" style={{ color: colour }}>
          <strong className="text-lg">{nightsLeft}</strong>
          <span className="text-slate-500"> / {total} {t.nights}</span>
        </span>
      </div>
      <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-white/[0.04]">
        <AnimatePresence>
          <motion.div
            className="h-full rounded-full"
            initial={false}
            animate={{ width: `${pct}%`, backgroundColor: colour }}
            transition={{ type: 'spring', stiffness: 120, damping: 22 }}
          />
        </AnimatePresence>
      </div>
      {used > 0 && (
        <p className="mt-2 text-[11px] text-slate-500">
          {used} {t.nights} {t.nightsSpent}
        </p>
      )}
    </div>
  )
}

export function BriefCard({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
      <span className="font-mono text-[11px] text-indigo-300">{n}</span>
      <h3 className="mt-1 font-semibold text-white">{title}</h3>
      <p className="mt-1.5 text-[13px] leading-relaxed text-slate-400">{body}</p>
    </div>
  )
}
