'use client'

/**
 * The reveal.
 *
 * This screen exists for one sentence: the planet you just found is real, here is its
 * name, go look it up. Everything before this is a simulation the player has every
 * right to be sceptical of, and everything after depends on them learning that their
 * own measurement landed on a published value.
 *
 * So the numbers are shown side by side, theirs against the catalogue's, including
 * where they were off. Hiding the error would make the moment feel like a reward
 * screen. Showing it makes it feel like a measurement.
 */

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import HowDoWeKnow from './HowDoWeKnow'
import Prose from './Prose'
import ShareButton from '@/app/components/ShareButton'
import { useDict } from '@/app/hooks/useDict'
import { fmt } from '../lib/format'
import { STARS, TOTAL_NIGHTS, type Star } from '../lib/stars'
import { generateLightCurve, gradeCampaign, type Campaign, type Verdict } from '../lib/campaign'
import {
  equilibriumTempK,
  foldStats,
  habitableZone,
  noiseSigma,
  semiMajorAxisAU,
  transitDepth,
} from '../lib/physics'

type Props = {
  campaign: Campaign
  onRestart: () => void
}

export default function Results({ campaign, onRestart }: Props) {
  const params = useParams()
  const lang = (params?.lang as string) || 'en'
  const r = useDict().observatory.results
  const grade = gradeCampaign(campaign)
  const filed = STARS.filter((s) => campaign.verdicts[s.id])
  const unexamined = STARS.filter((s) => !campaign.verdicts[s.id])

  const headline = grade.foundTarget ? r.foundTarget : grade.correct > 0 ? r.closed : r.nothingConfirmed

  const shareText = () =>
    fmt(r.share, {
      squares: grade.squares,
      correct: grade.correct,
      filed: grade.correct + grade.wrong,
      used: grade.nightsUsed,
      total: TOTAL_NIGHTS,
      target: grade.foundTarget ? r.shareTarget : '',
      url: `https://astranova.uz/${lang}/observatory`,
    })

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded-2xl border border-white/10 bg-gradient-to-b from-indigo-500/[0.08] to-transparent p-5 text-center sm:p-6"
      >
        <p className="text-[11px] uppercase tracking-[0.2em] font-semibold text-indigo-300">{r.eyebrow}</p>
        <h2 className="font-bold mt-2 text-2xl text-white sm:text-4xl">{headline}</h2>
        <p className="mt-2 text-[13px] text-slate-400">
          {fmt(r.tally, { correct: grade.correct, wrong: grade.wrong, used: grade.nightsUsed, total: TOTAL_NIGHTS })}
        </p>
        {grade.squares && (
          <p className="mt-3 font-mono text-2xl tracking-widest" aria-label={r.summary}>
            {grade.squares}
          </p>
        )}
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <ShareButton
            text={shareText}
            label={r.shareButton}
            className="rounded-full border border-indigo-400/40 bg-indigo-500/20 px-6 py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-indigo-500/35"
          />
          <Link
            href={`/${lang}/observatory/seven`}
            className="rounded-full border border-white/10 bg-white/[0.04] px-6 py-2.5 text-[14px] font-medium text-slate-200 transition-colors hover:border-indigo-400/40 hover:text-white"
          >
            {r.next} →
          </Link>
        </div>
      </motion.div>

      {filed.map((star, i) => (
        <StarResult key={star.id} star={star} campaign={campaign} index={i} />
      ))}

      {unexamined.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
          <h3 className="text-[13px] font-semibold text-slate-300">
            {fmt(r.unexamined, { n: unexamined.length })}
          </h3>
          <p className="mt-1.5 text-[12px] leading-relaxed text-slate-500">
            {unexamined.map((s) => s.name).join(' · ')}
          </p>
          <p className="mt-2.5 text-[13px] leading-relaxed text-slate-400">{r.unexaminedBody}</p>
        </div>
      )}

      <HowDoWeKnow question={r.realQ}>
        {r.realP.map((t, i) => (
          <Prose key={i} text={t} />
        ))}
      </HowDoWeKnow>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={onRestart}
          className="rounded-lg border border-indigo-400/40 bg-indigo-500/15 px-4 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-indigo-500/30"
        >
          {r.restart}
        </button>
      </div>
    </div>
  )
}

function StarResult({
  star,
  campaign,
  index,
}: {
  star: Star
  campaign: Campaign
  index: number
}) {
  const o = useDict().observatory
  const r = o.results
  const chips = o.ui.chips
  const notes = o.planetNotes as Record<string, string>
  const verdict = campaign.verdicts[star.id]
  const truth: Verdict = star.planet ? 'planet' : star.starspot ? 'starspot' : 'nothing'
  const correct = verdict === truth

  const lockedPeriod = campaign.lockedPeriod[star.id]
  const fittedRadius = campaign.fittedRadius[star.id]

  // Recomputed rather than stored. The light curve is deterministic in (star, nights)
  // and the fold is deterministic in the locked period, so the depth the player saw
  // can be rebuilt exactly here instead of being threaded through campaign state.
  const nights = campaign.observations[star.id] ?? 0
  const measuredDepth =
    lockedPeriod && nights > 0
      ? foldStats(generateLightCurve(star, nights), lockedPeriod, noiseSigma(star.magnitude)).depth
      : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.1 + index * 0.08 }}
      className={`rounded-2xl border p-4 sm:p-5 ${
        correct ? 'border-emerald-400/20 bg-emerald-500/15' : 'border-rose-400/20 bg-rose-500/[0.06]'
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[13px] font-bold"
          style={{
            background: correct ? 'rgba(52,211,153,0.18)' : 'rgba(251,113,133,0.18)',
            color: correct ? '#34d399' : '#ec8090',
          }}
        >
          {correct ? '✓' : '✕'}
        </span>
        <div className="min-w-0 flex-1 text-[13px] text-slate-400">
          <h3 className="font-semibold text-[15px] text-white">{star.name}</h3>
          <Prose text={r.youSaid} values={{ verdict: chips[verdict], truth: chips[truth] }} />
        </div>
      </div>

      {star.planet && (
        <div className="mt-4 space-y-3">
          <div className="rounded-xl border border-white/10 bg-[#060b18] p-4">
            <p className="text-[11px] uppercase tracking-wider text-indigo-300">{r.planetHeading}</p>
            <p className="font-bold mt-1 text-xl text-white">{star.planet.name}</p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-slate-300">
              {notes[star.id] ?? star.planet.note}
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            <Compare
              label={r.compare.period}
              yours={lockedPeriod ? `${lockedPeriod.toFixed(3)} ${o.ui.d}` : '·'}
              actual={`${star.planet.periodDays.toFixed(3)} ${o.ui.d}`}
            />
            <Compare
              label={r.compare.radius}
              yours={fittedRadius ? `${fittedRadius.toFixed(2)} R⊕` : '·'}
              actual={`${star.planet.radiusEarth.toFixed(2)} R⊕`}
            />
            <Compare
              label={r.compare.depth}
              yours={measuredDepth != null ? `${(measuredDepth * 100).toFixed(3)}%` : '·'}
              actual={`${(transitDepth(star.planet.radiusEarth, star.radiusSun) * 100).toFixed(3)}%`}
            />
          </div>

          <PlanetVerdictLine star={star} />
        </div>
      )}

      {star.starspot && (
        <div className="mt-4 space-y-2 rounded-xl border border-amber-400/20 bg-amber-500/10 p-4 text-[13px] leading-relaxed text-amber-300">
          {r.starspot.map((t, i) => (
            <Prose
              key={i}
              text={t}
              values={{
                star: star.name,
                hours: (star.starspot!.rotationDays * 24).toFixed(1),
                amp: (star.starspot!.amplitude * 100).toFixed(1),
              }}
            />
          ))}
        </div>
      )}

      {!star.planet && !star.starspot && (
        <p className="mt-3 text-[13px] leading-relaxed text-slate-400">{fmt(r.quiet, { star: star.name })}</p>
      )}
    </motion.div>
  )
}

function PlanetVerdictLine({ star }: { star: Star }) {
  const r = useDict().observatory.results
  if (!star.planet) return null
  const axis = semiMajorAxisAU(star.planet.periodDays, star.massSun)
  const hz = habitableZone(star.luminositySun)
  const teq = equilibriumTempK(star.tempK, star.radiusSun, axis, star.planet.albedo)
  const inHZ = axis >= hz.inner && axis <= hz.outer
  const values = {
    axis: axis.toFixed(4),
    planet: star.planet.name,
    inner: hz.inner.toFixed(4),
    outer: hz.outer.toFixed(4),
    teq: teq.toFixed(0),
  }

  return (
    <div
      className={`rounded-xl border px-4 py-3 text-[13px] leading-relaxed ${
        inHZ
          ? 'border-emerald-400/25 bg-emerald-500/15 text-emerald-300'
          : 'border-white/5 bg-white/[0.02] text-slate-300'
      }`}
    >
      {fmt(inHZ ? r.inHZ : r.notHZ, values)}
    </div>
  )
}

function Compare({ label, yours, actual }: { label: string; yours: string; actual: string }) {
  const c = useDict().observatory.results.compare
  return (
    <div className="rounded-xl border border-white/5 bg-[#060b18] px-3 py-2">
      <div className="text-[10px] uppercase tracking-wider text-slate-500">{label}</div>
      <div className="mt-1 flex items-baseline justify-between gap-2">
        <span className="font-mono text-[13px] text-slate-400">{yours}</span>
        <span className="font-mono text-[13px] font-semibold text-white">{actual}</span>
      </div>
      <div className="mt-0.5 flex justify-between text-[9px] uppercase tracking-wider text-slate-500">
        <span>{c.yours}</span>
        <span>{c.actual}</span>
      </div>
    </div>
  )
}
