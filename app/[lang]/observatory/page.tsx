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
import { motion } from 'framer-motion'
import { useParams } from 'next/navigation'
import { useDict } from '@/app/hooks/useDict'
import ObservatoryShell, { BriefCard } from './components/Chrome'
import SkyField from './components/SkyField'
import Analysis from './components/Analysis'
import Results from './components/Results'
import HowDoWeKnow from './components/HowDoWeKnow'
import Prose from './components/Prose'
import { STARS, TOTAL_NIGHTS, getStar } from './lib/stars'
import {
  generateLightCurve,
  gradeCampaign,
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
      <ObservatoryShell lang={lang} nightsLeft={TOTAL_NIGHTS} total={TOTAL_NIGHTS} showBudget={false}>
        <div className="py-20 text-center text-slate-500">{t.opening}</div>
      </ObservatoryShell>
    )
  }

  /* ── Briefing ─────────────────────────────────────────────────────────── */
  if (campaign.phase === 'briefing') {
    return (
      <ObservatoryShell lang={lang} nightsLeft={nightsLeft} total={TOTAL_NIGHTS} showBudget={false}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="space-y-6"
        >
          <div className="text-center">
            <p className="text-[11px] uppercase tracking-[0.2em] font-semibold text-indigo-300">{t.mission}</p>
            <h1 className="font-bold mt-3 text-3xl text-white sm:text-6xl">{t.title}</h1>
            <p className="mx-auto mt-4 max-w-2xl text-[15px] leading-relaxed text-slate-400">
              {t.intro}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {t.steps.map((s, i) => (
              <BriefCard key={s.title} n={`0${i + 1}`} title={s.title} body={s.body} />
            ))}
          </div>

          <HowDoWeKnow question={t.briefing.q}>
            {t.briefing.p.map((p, i) => (
              <Prose key={i} text={p} dim={i === 2} />
            ))}
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
      </ObservatoryShell>
    )
  }

  /* ── Results ──────────────────────────────────────────────────────────── */
  if (campaign.phase === 'results') {
    return (
      <ObservatoryShell lang={lang} nightsLeft={nightsLeft} total={TOTAL_NIGHTS}>
        <Results
          campaign={campaign}
          onRestart={() => {
            clearCampaign()
            setCampaign(newCampaign())
          }}
        />
      </ObservatoryShell>
    )
  }

  /* ── Analysis bench ───────────────────────────────────────────────────── */
  if (activeStar) {
    return (
      <ObservatoryShell lang={lang} nightsLeft={nightsLeft} total={TOTAL_NIGHTS}>
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
      </ObservatoryShell>
    )
  }

  /* ── Sky field ────────────────────────────────────────────────────────── */
  const filedCount = Object.keys(campaign.verdicts).length

  return (
    <ObservatoryShell lang={lang} nightsLeft={nightsLeft} total={TOTAL_NIGHTS}>
      <div className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-bold text-2xl text-white sm:text-3xl">{t.fieldTitle}</h1>
            <p className="mt-1 text-[13px] text-slate-400">{t.fieldSubtitle}</p>
          </div>
          <button
            onClick={() => {
              if (gradeCampaign(campaign).foundTarget) track('observatory_planet_found')
              update((c) => ({ ...c, phase: 'results', completedAt: Date.now() }))
            }}
            disabled={filedCount === 0}
            className="rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2.5 text-[13px] font-medium text-slate-300 transition-colors hover:border-indigo-400/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
            title={filedCount === 0 ? t.ui.fileFirst : undefined}
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
    </ObservatoryShell>
  )
}
