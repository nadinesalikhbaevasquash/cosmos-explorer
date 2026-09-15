'use client'

/**
 * The search bench for mission 2.
 *
 * One chart, one period control, one list of claims. Mission 1's bench walks a single
 * star through detect, measure, decide; this one loops the first step: find a period,
 * claim it, watch the data get quieter, find the next.
 *
 * Everything here is derived from two numbers in campaign state, nights observed and
 * the list of claims, so there is nothing to fall out of sync: the curve is rebuilt
 * from the nights, the masks from the claims, and every readout from those.
 */

import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import LightCurve from '../../components/LightCurve'
import HowDoWeKnow from '../../components/HowDoWeKnow'
import Prose from '../../components/Prose'
import { FoldMeter, Notice, PeriodControl, Readout } from '../../components/Bits'
import { useDict } from '@/app/hooks/useDict'
import { fmt } from '../../lib/format'
import {
  foldNoiseFloor,
  foldScore,
  foldStats,
  habitableZone,
  planetRadiusFromDepth,
  semiMajorAxisAU,
} from '../../lib/physics'
import SystemMap from './SystemMap'
import {
  HOST,
  PERIOD_MAX,
  PERIOD_MIN,
  SIGMA,
  TOTAL_NIGHTS,
  generateSystemCurve,
  maskClaims,
  type SevenCampaign,
} from '../lib/system'

const BATCHES = [3, 6, 12]

export default function Bench({
  campaign,
  onObserve,
  onClaim,
  onRetract,
  onClose,
}: {
  campaign: SevenCampaign
  onObserve: (nights: number) => void
  onClaim: (period: number) => void
  onRetract: (id: string) => void
  onClose: () => void
}) {
  const o = useDict().observatory
  const s = o.seven
  const u = o.ui

  const [trial, setTrial] = useState(2)
  const [touched, setTouched] = useState(false)

  const nightsLeft = TOTAL_NIGHTS - campaign.nightsUsed
  const points = useMemo(() => generateSystemCurve(campaign.nightsUsed), [campaign.nightsUsed])
  const { remaining, measured } = useMemo(
    () => maskClaims(points, campaign.claims),
    [points, campaign.claims],
  )

  // Scored against the noise floor of what is *left*, so the meter responds to masking.
  const floor = useMemo(() => foldNoiseFloor(remaining, SIGMA), [remaining])
  const stats = useMemo(() => foldStats(remaining, trial, SIGMA), [remaining, trial])
  const meter = remaining.length ? foldScore(stats.snr, floor) : 0

  const hz = habitableZone(HOST.luminositySun)
  const claims = useMemo(
    () =>
      [...campaign.claims]
        .sort((a, b) => a.period - b.period)
        .map((c) => {
          const depth = measured[c.id]?.depth ?? 0
          const axis = semiMajorAxisAU(c.period, HOST.massSun)
          return {
            ...c,
            depth,
            axis,
            radius: planetRadiusFromDepth(depth, HOST.radiusSun),
            inHZ: axis >= hz.inner && axis <= hz.outer,
          }
        }),
    [campaign.claims, measured, hz.inner, hz.outer],
  )

  // Two claims on the same planet would mask the same transits twice and count once;
  // stopping it at the button is kinder than marking it wrong at the end.
  const duplicate = campaign.claims.some((c) => Math.abs(c.period - trial) / c.period < 0.015)

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-bold text-2xl text-white sm:text-3xl">{HOST.name}</h1>
          <p className="mt-1 font-mono text-[11px] text-slate-500">
            {fmt(s.dataLabel, { n: campaign.nightsUsed, count: remaining.length.toLocaleString() })}
          </p>
        </div>
        <button
          onClick={onClose}
          disabled={campaign.claims.length === 0}
          title={campaign.claims.length === 0 ? s.closeHint : undefined}
          className="rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2.5 text-[13px] font-medium text-slate-300 transition-colors hover:border-indigo-400/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
        >
          {s.close} ({campaign.claims.length})
        </button>
      </div>

      {nightsLeft === 0 && <Notice tone="warn">{s.outOfTime}</Notice>}

      <div className="grid gap-5 lg:grid-cols-[1.55fr_1fr] lg:items-start">
        {/* ── Search ─────────────────────────────────────────────────── */}
        <section className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:p-5">
          <div className="rounded-xl border border-white/5 bg-[#060b18] p-2 sm:p-3">
            <LightCurve
              points={remaining}
              mode={touched ? 'folded' : 'raw'}
              period={trial}
              height={260}
              sigma={SIGMA}
              accent={meter > 0.55 ? '#4ade80' : '#7e88ec'}
            />
          </div>

          <div className="flex gap-1.5">
            {BATCHES.map((n) => (
              <button
                key={n}
                onClick={() => onObserve(n)}
                disabled={n > nightsLeft}
                className="min-h-10 flex-1 rounded-lg border border-white/10 bg-white/[0.04] px-2 py-2 text-[12px] font-medium text-slate-300 transition-colors hover:border-indigo-400/50 hover:bg-indigo-500/15 hover:text-white disabled:cursor-not-allowed disabled:opacity-25"
                title={n > nightsLeft ? u.notEnough : fmt(u.observeFor, { n })}
              >
                {fmt(s.observe, { n })}
              </button>
            ))}
          </div>

          {points.length > 0 && (
            <>
              <PeriodControl
                id="seven-period"
                period={trial}
                min={PERIOD_MIN}
                max={PERIOD_MAX}
                onChange={(p) => {
                  setTrial(p)
                  setTouched(true)
                }}
              />
              <FoldMeter score={meter} />

              <button
                onClick={() => onClaim(trial)}
                disabled={duplicate}
                className="w-full rounded-lg border border-indigo-400/40 bg-indigo-500/20 px-4 py-3 text-[14px] font-semibold text-white transition-colors hover:bg-indigo-500/35 disabled:cursor-not-allowed disabled:opacity-30"
              >
                {s.claim}
              </button>

              {touched && meter < 0.5 && !duplicate && <Notice tone="warn">{s.claimWeak}</Notice>}
            </>
          )}

          <HowDoWeKnow question={s.subtractQ}>
            {s.subtractP.map((t, i) => (
              <Prose key={i} text={t} dim={i === 2} />
            ))}
          </HowDoWeKnow>
          <HowDoWeKnow question={o.explain.fold.q}>
            {o.explain.fold.p.map((t, i) => (
              <Prose key={i} text={t} dim={i === 2} />
            ))}
          </HowDoWeKnow>
        </section>

        {/* ── What has been found ─────────────────────────────────────── */}
        <section className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:p-5">
          <h2 className="font-semibold text-white">{s.mapTitle}</h2>
          <SystemMap
            bodies={claims.map((c) => ({ id: c.id, axis: c.axis, radiusEarth: c.radius }))}
            hzLabel={u.hzBar}
          />

          <h3 className="pt-1 text-[12px] font-semibold uppercase tracking-wider text-slate-500">
            {s.claimsTitle}
          </h3>
          {claims.length === 0 ? (
            <p className="text-[13px] leading-relaxed text-slate-400">{s.claimsEmpty}</p>
          ) : (
            <ul className="space-y-2">
              <AnimatePresence initial={false}>
                {claims.map((c) => (
                  <motion.li
                    key={c.id}
                    layout
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: 12 }}
                    className="flex items-center gap-3 rounded-xl border border-white/5 bg-[#060b18] px-3 py-2.5"
                  >
                    <span
                      aria-hidden
                      className={`h-2.5 w-2.5 flex-shrink-0 rounded-full ${c.inHZ ? 'bg-emerald-400' : 'bg-indigo-300'}`}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="font-mono text-[14px] font-semibold text-white tabular-nums">
                        {c.period.toFixed(3)} {u.d}
                      </div>
                      <div className="font-mono text-[11px] text-slate-500">
                        {fmt(s.claimRow, {
                          depth: (c.depth * 100).toFixed(2),
                          radius: c.radius.toFixed(2),
                          axis: c.axis.toFixed(4),
                        })}
                      </div>
                    </div>
                    <button
                      onClick={() => onRetract(c.id)}
                      className="min-h-9 rounded-lg border border-white/10 px-2.5 text-[12px] text-slate-400 transition-colors hover:border-rose-400/40 hover:text-rose-300"
                    >
                      {s.retract}
                    </button>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          )}

          {claims.length > 0 && (
            <div className="grid grid-cols-2 gap-2 pt-1">
              <Readout label={u.habitableZone} value={`${hz.inner.toFixed(3)}–${hz.outer.toFixed(3)} AU`} />
              <Readout label={s.claimsTitle} value={String(claims.length)} />
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
