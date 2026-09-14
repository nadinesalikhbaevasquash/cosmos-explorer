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

import { motion } from 'framer-motion'
import HowDoWeKnow from './HowDoWeKnow'
import { STARS, TOTAL_NIGHTS, type Star } from '../lib/stars'
import { generateLightCurve, gradeCampaign, type Campaign } from '../lib/campaign'
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
  const grade = gradeCampaign(campaign)
  const filed = STARS.filter((s) => campaign.verdicts[s.id])
  const unexamined = STARS.filter((s) => !campaign.verdicts[s.id])

  const headline = grade.foundTarget
    ? 'You found a habitable-zone world.'
    : grade.correct > 0
      ? 'Campaign closed.'
      : 'Campaign closed with nothing confirmed.'

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded-2xl border border-white/10 bg-gradient-to-b from-indigo-500/[0.08] to-transparent p-6 text-center"
      >
        <p className="text-[11px] uppercase tracking-[0.2em] font-semibold text-indigo-300">Survey complete</p>
        <h2 className="font-bold mt-2 text-3xl text-white sm:text-4xl">{headline}</h2>
        <p className="mt-2 text-[13px] text-slate-500">
          {grade.correct} correct · {grade.wrong} wrong · {grade.nightsUsed} of {TOTAL_NIGHTS} nights
          used
        </p>
        {grade.squares && (
          <p className="mt-3 font-mono text-2xl tracking-widest" aria-label="Result summary">
            {grade.squares}
          </p>
        )}
      </motion.div>

      {filed.map((star, i) => (
        <StarResult key={star.id} star={star} campaign={campaign} index={i} />
      ))}

      {unexamined.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
          <h3 className="text-[13px] font-semibold text-slate-300">
            {unexamined.length} stars you never filed on
          </h3>
          <p className="mt-1.5 text-[12px] leading-relaxed text-slate-500">
            {unexamined.map((s) => s.name).join(' · ')}
          </p>
          <p className="mt-2.5 text-[12px] leading-relaxed text-slate-500">
            Every real survey ends this way. Kepler watched 150,000 stars and most of them were
            never followed up, not because nothing was there but because nobody had the time. The
            choice of where not to look is part of the science.
          </p>
        </div>
      )}

      <HowDoWeKnow question="Is any of this real, or did the game make it up?">
        <p>
          Every star in that field is a real star, and every planet is a real planet with its
          published parameters. TRAPPIST-1 is 40.7 light years away in Aquarius and was announced
          in 2016. GJ 1214 b was found in 2009. HD 219134 is bright enough to see without a
          telescope.
        </p>
        <p>
          The physics is real too: the same depth formula, the same Kepler&apos;s third law, the
          same habitable-zone scaling astronomers use.
        </p>
        <p>
          <strong className="text-white">What is compressed is time.</strong> Kepler stared at
          its field for four years to find planets like these. You had 45 nights. So this field was
          stocked with short-period planets that a 45-night campaign genuinely could recover,
          instead of pretending a 300-day orbit is findable in six weeks. The measurements are
          honest. The schedule is generous.
        </p>
      </HowDoWeKnow>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={onRestart}
          className="rounded-lg border border-indigo-400/40 bg-indigo-500/15 px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-indigo-500/30"
        >
          Run a new campaign
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
  const verdict = campaign.verdicts[star.id]
  const truth = star.planet ? 'planet' : star.starspot ? 'starspot' : 'nothing'
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
      className={`rounded-2xl border p-5 ${
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
          {correct ? '\u2713' : '\u2715'}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-white">{star.name}</h3>
          <p className="text-[12px] text-slate-500">
            You said <strong className="text-white">{verdict}</strong>. It was{' '}
            <strong className="text-white">{truth}</strong>.
          </p>
        </div>
      </div>

      {star.planet && (
        <div className="mt-4 space-y-3">
          <div className="rounded-xl border border-white/10 bg-[#060b18] p-4">
            <p className="text-[11px] uppercase tracking-wider text-indigo-300">
              The planet you were looking at
            </p>
            <p className="font-bold mt-1 text-xl text-white">{star.planet.name}</p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-slate-300">{star.planet.note}</p>
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            <Compare
              label="Period"
              yours={lockedPeriod ? `${lockedPeriod.toFixed(3)} d` : '—'}
              actual={`${star.planet.periodDays.toFixed(3)} d`}
            />
            <Compare
              label="Radius"
              yours={fittedRadius ? `${fittedRadius.toFixed(2)} R⊕` : '—'}
              actual={`${star.planet.radiusEarth.toFixed(2)} R⊕`}
            />
            <Compare
              label="Transit depth"
              yours={measuredDepth != null ? `${(measuredDepth * 100).toFixed(3)}%` : '—'}
              actual={`${(transitDepth(star.planet.radiusEarth, star.radiusSun) * 100).toFixed(3)}%`}
            />
          </div>

          <PlanetVerdictLine star={star} />
        </div>
      )}

      {star.starspot && (
        <div className="mt-4 rounded-xl border border-amber-400/20 bg-amber-500/10 p-4">
          <p className="text-[13px] leading-relaxed text-amber-300">
            {star.name} has no known planet. It is a young, rapidly rotating red dwarf covered in
            starspots, and it turns once every{' '}
            {(star.starspot.rotationDays * 24).toFixed(1)} hours. A huge dark spot rotating in and
            out of view dimmed it by {(star.starspot.amplitude * 100).toFixed(1)}% on a strict
            schedule, which is exactly what a period search is built to find.
          </p>
          <p className="mt-2 text-[13px] leading-relaxed text-amber-200/80">
            The tell was the shape. Its folded curve is a smooth sine wave with no flat bottom.
            Spotted stars are the single most common source of false planet detections, and
            learning to throw them out is most of the job.
          </p>
        </div>
      )}

      {!star.planet && !star.starspot && (
        <p className="mt-3 text-[13px] leading-relaxed text-slate-500">
          {star.name} is photometrically quiet, with no known transiting planet. A non-detection is
          a real result: it rules something out, and it costs exactly as many nights as a discovery.
        </p>
      )}
    </motion.div>
  )
}

function PlanetVerdictLine({ star }: { star: Star }) {
  if (!star.planet) return null
  const axis = semiMajorAxisAU(star.planet.periodDays, star.massSun)
  const hz = habitableZone(star.luminositySun)
  const teq = equilibriumTempK(star.tempK, star.radiusSun, axis, star.planet.albedo)
  const inHZ = axis >= hz.inner && axis <= hz.outer

  return (
    <div
      className={`rounded-xl border px-4 py-3 text-[13px] leading-relaxed ${
        inHZ
          ? 'border-emerald-400/25 bg-emerald-500/15 text-emerald-300'
          : 'border-white/5 bg-white/[0.02] text-slate-300'
      }`}
    >
      {inHZ ? (
        <>
          At {axis.toFixed(4)} AU, {star.planet.name} orbits inside the habitable zone (
          {hz.inner.toFixed(4)} – {hz.outer.toFixed(4)} AU) with an equilibrium temperature of{' '}
          {teq.toFixed(0)} K. It is one of a small number of Earth-sized worlds known to sit
          there, and it is a primary target for the James Webb Space Telescope.
        </>
      ) : (
        <>
          At {axis.toFixed(4)} AU, {star.planet.name} orbits well inside the habitable zone&apos;s
          inner edge of {hz.inner.toFixed(4)} AU, at an equilibrium temperature of {teq.toFixed(0)}{' '}
          K. A real detection, and a real planet, just not a habitable one. Most of them are not.
        </>
      )}
    </div>
  )
}

function Compare({ label, yours, actual }: { label: string; yours: string; actual: string }) {
  return (
    <div className="rounded-xl border border-white/5 bg-[#060b18] px-3 py-2">
      <div className="text-[10px] uppercase tracking-wider text-slate-600">{label}</div>
      <div className="mt-1 flex items-baseline justify-between gap-2">
        <span className="font-mono text-[13px] text-slate-500">{yours}</span>
        <span className="font-mono text-[13px] font-semibold text-white">{actual}</span>
      </div>
      <div className="mt-0.5 flex justify-between text-[9px] uppercase tracking-wider text-slate-600">
        <span>yours</span>
        <span>actual</span>
      </div>
    </div>
  )
}
