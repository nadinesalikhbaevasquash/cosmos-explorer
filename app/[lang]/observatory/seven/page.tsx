'use client'

/**
 * Mission 2: The Seven Worlds.
 *
 * Orchestration only, like mission 1's page. The instrument (light curve, fold
 * statistics, period control, night budget) is mission 1's, unchanged; what is new
 * lives in ./lib/system.ts (seven planets in one curve, and masking) and the bench.
 */

import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useParams } from 'next/navigation'
import { useDict } from '@/app/hooks/useDict'
import { track } from '@/app/lib/analytics'
import ObservatoryShell, { BriefCard } from '../components/Chrome'
import Bench from './components/Bench'
import SevenResults from './components/SevenResults'
import {
  TOTAL_NIGHTS,
  clearSeven,
  loadSeven,
  newSevenCampaign,
  saveSeven,
  type SevenCampaign,
} from './lib/system'

export default function SevenWorldsPage() {
  const params = useParams()
  const lang = (params?.lang as string) || 'en'
  const t = useDict().observatory
  const s = t.seven

  const [campaign, setCampaign] = useState<SevenCampaign | null>(null)

  // Restored after mount, for the same hydration reason as mission 1.
  useEffect(() => {
    setCampaign(loadSeven() ?? newSevenCampaign())
  }, [])

  const update = useCallback((fn: (c: SevenCampaign) => SevenCampaign) => {
    setCampaign((prev) => {
      if (!prev) return prev
      const next = fn(prev)
      saveSeven(next)
      return next
    })
  }, [])

  if (!campaign) {
    return (
      <ObservatoryShell lang={lang} nightsLeft={TOTAL_NIGHTS} total={TOTAL_NIGHTS} showBudget={false}>
        <div className="py-20 text-center text-slate-500">{t.opening}</div>
      </ObservatoryShell>
    )
  }

  const nightsLeft = TOTAL_NIGHTS - campaign.nightsUsed

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
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-indigo-300">{s.mission}</p>
            <h1 className="mt-3 text-3xl font-bold text-white sm:text-6xl">{s.title}</h1>
            <p className="mx-auto mt-4 max-w-2xl text-[15px] leading-relaxed text-slate-400">{s.intro}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {s.steps.map((step, i) => (
              <BriefCard key={step.title} n={`0${i + 1}`} title={step.title} body={step.body} />
            ))}
          </div>

          <div className="flex justify-center">
            <button
              onClick={() => {
                track('observatory_seven_opened')
                update((c) => ({ ...c, phase: 'search' }))
              }}
              className="sweep-host group inline-flex items-center gap-2 rounded-full bg-indigo-500 px-7 py-3.5 text-[15px] font-semibold text-ink shadow-glow transition-transform hover:scale-[1.03] active:scale-[0.99]"
            >
              {s.start}
              <span className="transition-transform group-hover:translate-x-0.5" aria-hidden>
                →
              </span>
            </button>
          </div>
        </motion.div>
      </ObservatoryShell>
    )
  }

  if (campaign.phase === 'results') {
    return (
      <ObservatoryShell lang={lang} nightsLeft={nightsLeft} total={TOTAL_NIGHTS}>
        <SevenResults
          campaign={campaign}
          onRestart={() => {
            clearSeven()
            setCampaign({ ...newSevenCampaign(), phase: 'search' })
          }}
        />
      </ObservatoryShell>
    )
  }

  return (
    <ObservatoryShell lang={lang} nightsLeft={nightsLeft} total={TOTAL_NIGHTS}>
      <Bench
        campaign={campaign}
        onObserve={(n) =>
          update((c) => {
            const affordable = Math.min(n, TOTAL_NIGHTS - c.nightsUsed)
            return affordable > 0 ? { ...c, nightsUsed: c.nightsUsed + affordable } : c
          })
        }
        onClaim={(period) =>
          update((c) => ({
            ...c,
            claims: [...c.claims, { id: `p${Date.now().toString(36)}`, period }],
          }))
        }
        onRetract={(id) => update((c) => ({ ...c, claims: c.claims.filter((x) => x.id !== id) }))}
        onClose={() => {
          track('observatory_seven_closed')
          update((c) => ({ ...c, phase: 'results', completedAt: Date.now() }))
        }}
      />
    </ObservatoryShell>
  )
}
