'use client'

/**
 * Mission 1: Find the Exoplanet.
 *
 * The page owns the campaign and nothing else. Every system underneath it (the sky
 * field, the analysis bench, the results reveal) is handed state and callbacks, which
 * is what makes mission 2 cheap: a new mission re-uses these components with a
 * different star field and a different goal, and only this orchestration changes.
 *
 * The one rule enforced here rather than anywhere else: nights are spent, and spent
 * nights never come back. That is the difference between an observatory and a quiz.
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { useParams } from 'next/navigation'
import Nav from '@/app/components/Nav'
import Starfield from '@/app/components/Starfield'
import { useDict } from '@/app/hooks/useDict'
import SkyField from './components/SkyField'
import Analysis from './components/Analysis'
import Results from './components/Results'
import HowDoWeKnow, { Formula } from './components/HowDoWeKnow'
import { STARS, TOTAL_NIGHTS, getStar } from './lib/stars'
import {
  generateLightCurve,
  newCampaign,
  nightsRemaining as remainingOf,
  type Campaign,
  type Verdict,
} from './lib/campaign'
import { clearCampaign, loadCampaign, saveCampaign } from './lib/storage'
import { track } from "@/app/lib/analytics";

export default function ObservatoryPage() {
  const params = useParams()
  const lang = (params?.lang as string) || 'en'
  const t = useDict().observatory

  const [campaign, setCampaign] = useState<Campaign | null>(null)

  // Restore on mount. Rendered as null until this resolves so the server-rendered
  // markup and the first client render agree; reading localStorage during render
  // would produce a hydration mismatch.
  useEffect(() => {
    setCampaign(loadCampaign() ?? newCampaign())
  }, [])

  const update = useCallback((fn: (c: Campaign) => Campaign) => {
    setCampaign((prev) => {
      if (!prev) return prev
      const next = fn(prev)
      saveCampaign(next)
      return next
    })
  }, [])

  const nightsLeft = campaign ? remainingOf(campaign) : TOTAL_NIGHTS
  const activeStar = campaign?.activeStarId ? getStar(campaign.activeStarId) : undefined

  // Rebuilt only when the star or its night count changes. A 45-night curve is 6,480
  // points, so regenerating it on unrelated state updates would stutter the slider.
  const activePoints = useMemo(() => {
    if (!activeStar || !campaign) return []
    return generateLightCurve(activeStar, campaign.observations[activeStar.id] ?? 0)
  }, [activeStar, campaign])

  const observe = useCallback(
    (starId: string, nights: number) => {
      update((c) => {
        const affordable = Math.min(nights, remainingOf(c))
        if (affordable <= 0) return c
        return {
          ...c,
          nightsUsed: c.nightsUsed + affordable,
          observations: { ...c.observations, [starId]: (c.observations[starId] ?? 0) + affordable },
        }
      })
    },
    [update],
  )

  if (!campaign) {
    return (
      <div className="min-h-screen bg-[#060b18]">
        <Nav />
        <div className="mx-auto max-w-5xl px-6 py-20 text-center text-slate-500">
          {t.opening}
        </div>
      </div>
    )
  }

  /* ── Briefing ─────────────────────────────────────────────────────────── */
  if (campaign.phase === 'briefing') {
    return (
      <Shell lang={lang} nightsLeft={nightsLeft} showBudget={false}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="space-y-6"
        >
          <div className="text-center">
            <p className="text-[11px] uppercase tracking-[0.2em] font-semibold text-indigo-300">{t.mission}</p>
            <h1 className="font-bold mt-3 text-4xl text-white sm:text-6xl">{t.title}</h1>
            <p className="mx-auto mt-4 max-w-2xl text-[15px] leading-relaxed text-slate-500">
              {t.intro}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {t.steps.map((s, i) => (
              <BriefCard key={s.title} n={`0${i + 1}`} title={s.title} body={s.body} />
            ))}
          </div>

          <HowDoWeKnow question="How can anyone see a planet trillions of kilometres away?">
            <p>
              You cannot, and nobody has. Almost every planet we know about was found indirectly.
              The transit method watches for the shadow instead of the object.
            </p>
            <p>
              When a planet passes between its star and us, it blocks a sliver of the light. For an
              Earth-sized planet crossing a Sun-like star, that sliver is 0.008% of the total, which
              is like noticing one streetlight dim in a city seen from orbit. The dip is real, it is
              periodic, and with enough measurements stacked on top of each other it is measurable.
            </p>
            <p className="text-slate-500">
              The trick is <Formula>depth = (R_planet / R_star)²</Formula>. Because it is a ratio,
              the smaller the star, the bigger the shadow. Which is why this survey is full of tiny
              red dwarfs rather than stars like the Sun.
            </p>
          </HowDoWeKnow>

          <div className="flex justify-center">
            <button
              onClick={() => { track('observatory_opened'); update((c) => ({ ...c, phase: 'survey' })); }}
              className="sweep-host group inline-flex items-center gap-2 rounded-full bg-indigo-500 px-7 py-3.5 text-[15px] font-semibold text-ink shadow-glow transition-transform hover:scale-[1.03] active:scale-[0.99]"
            >
              {t.openDome}
              <span className="transition-transform group-hover:translate-x-0.5" aria-hidden>→</span>
            </button>
          </div>
        </motion.div>
      </Shell>
    )
  }

  /* ── Results ──────────────────────────────────────────────────────────── */
  if (campaign.phase === 'results') {
    return (
      <Shell lang={lang} nightsLeft={nightsLeft}>
        <Results
          campaign={campaign}
          onRestart={() => {
            clearCampaign()
            setCampaign(newCampaign())
          }}
        />
      </Shell>
    )
  }

  /* ── Analysis bench ───────────────────────────────────────────────────── */
  if (activeStar) {
    return (
      <Shell lang={lang} nightsLeft={nightsLeft}>
        <Analysis
          star={activeStar}
          points={activePoints}
          nights={campaign.observations[activeStar.id] ?? 0}
          lockedPeriod={campaign.lockedPeriod[activeStar.id] ?? null}
          fittedRadius={campaign.fittedRadius[activeStar.id] ?? null}
          verdict={campaign.verdicts[activeStar.id] ?? null}
          nightsRemaining={nightsLeft}
          onBack={() => update((c) => ({ ...c, activeStarId: null }))}
          onObserveMore={(n) => observe(activeStar.id, n)}
          onLockPeriod={(period) =>
            update((c) => ({
              ...c,
              lockedPeriod: { ...c.lockedPeriod, [activeStar.id]: period },
            }))
          }
          onFitRadius={(radius) =>
            update((c) => ({
              ...c,
              fittedRadius: { ...c.fittedRadius, [activeStar.id]: radius },
            }))
          }
          onVerdict={(v: Verdict) =>
            update((c) => ({
              ...c,
              verdicts: { ...c.verdicts, [activeStar.id]: v },
              activeStarId: null,
            }))
          }
        />
      </Shell>
    )
  }

  /* ── Sky field ────────────────────────────────────────────────────────── */
  const filedCount = Object.keys(campaign.verdicts).length

  return (
    <Shell lang={lang} nightsLeft={nightsLeft}>
      <div className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-bold text-3xl text-white">{t.fieldTitle}</h1>
            <p className="mt-1 text-[13px] text-slate-500">{t.fieldSubtitle}</p>
          </div>
          <button
            onClick={() => update((c) => ({ ...c, phase: 'results', completedAt: Date.now() }))}
            disabled={filedCount === 0}
            className="rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-[13px] font-medium text-slate-300 transition-colors hover:border-indigo-400/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
            title={filedCount === 0 ? 'File a conclusion on at least one star first' : undefined}
          >
            {t.closeCampaign} ({filedCount} {t.filed})
          </button>
        </div>

        {nightsLeft === 0 && (
          <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-[13px] text-amber-300">
{t.outOfTime}
          </div>
        )}

        <SkyField
          stars={STARS}
          nightsOn={campaign.observations}
          verdicts={campaign.verdicts}
          nightsRemaining={nightsLeft}
          onObserve={observe}
          onOpen={(starId) => update((c) => ({ ...c, activeStarId: starId }))}
        />
      </div>
    </Shell>
  )
}

/* ── Chrome ─────────────────────────────────────────────────────────────── */

function Shell({
  lang,
  nightsLeft,
  showBudget = true,
  children,
}: {
  lang: string
  nightsLeft: number
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
      <main className="relative mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        {showBudget && <NightBudget nightsLeft={nightsLeft} />}
        {children}
        <div className="mt-12 border-t border-white/5 pt-6">
          <Link
            href={`/${lang}`}
            className="text-[12px] text-slate-500 transition-colors hover:text-slate-300"
          >
            ← {t.backToGames}
          </Link>
        </div>
      </main>
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
function NightBudget({ nightsLeft }: { nightsLeft: number }) {
  const t = useDict().observatory
  const used = TOTAL_NIGHTS - nightsLeft
  const pct = (nightsLeft / TOTAL_NIGHTS) * 100
  const colour = pct > 50 ? '#7e88ec' : pct > 20 ? '#e2b43d' : '#ec8090'

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] mb-7 px-5 py-4">
      <div className="flex items-baseline justify-between">
        <span className="text-[11px] uppercase tracking-wider text-slate-500">
          {t.timeRemaining}
        </span>
        <span className="font-mono text-sm tabular-nums" style={{ color: colour }}>
          <strong className="text-lg">{nightsLeft}</strong>
          <span className="text-slate-600"> / {TOTAL_NIGHTS} {t.nights}</span>
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
        <p className="mt-2 text-[11px] text-slate-600">
          {used} {t.nights} {t.nightsSpent}
        </p>
      )}
    </div>
  )
}

function BriefCard({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
      <span className="font-mono text-[11px] text-indigo-300">{n}</span>
      <h3 className="mt-1 font-semibold text-white">{title}</h3>
      <p className="mt-1.5 text-[12px] leading-relaxed text-slate-500">{body}</p>
    </div>
  )
}
