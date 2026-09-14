'use client'

/**
 * The analysis bench: everything the player does to one star after observing it.
 *
 * Three steps, in the order a real detection actually happens. Detect the period,
 * measure the planet against the star, then decide whether it could hold water.
 * Each step unlocks the next, because each genuinely needs the previous one's answer:
 * you cannot get an orbital distance without a period, and you cannot place a planet
 * in the habitable zone without a distance.
 *
 * The rule every control here follows: never ask the player to recall, always ask
 * them to decide. There is not a single input box expecting a typed number. The
 * period is found by dragging until the fold snaps, and the radius by sizing a disc
 * until the simulated dip matches the measured one. Same physics as the textbook
 * version, none of the exam feeling.
 */

import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import LightCurve from './LightCurve'
import HowDoWeKnow, { Formula } from './HowDoWeKnow'
import { analyseSignal, type Point, type Verdict } from '../lib/campaign'
import {
  SNR_THRESHOLD,
  equilibriumTempK,
  foldNoiseFloor,
  foldScore,
  foldStats,
  habitableZone,
  noiseSigma,
  planetRadiusFromDepth,
  semiMajorAxisAU,
  transitDepth,
  transitDurationDays,
} from '../lib/physics'
import type { Star } from '../lib/stars'

type Props = {
  star: Star
  points: Point[]
  nights: number
  lockedPeriod: number | null
  fittedRadius: number | null
  verdict: Verdict | null
  onLockPeriod: (period: number) => void
  onFitRadius: (radius: number) => void
  onVerdict: (verdict: Verdict) => void
  onBack: () => void
  onObserveMore: (nights: number) => void
  nightsRemaining: number
}

const PERIOD_MIN = 0.4
const PERIOD_MAX = 30

export default function Analysis({
  star,
  points,
  nights,
  lockedPeriod,
  fittedRadius,
  verdict,
  onLockPeriod,
  onFitRadius,
  onVerdict,
  onBack,
  onObserveMore,
  nightsRemaining,
}: Props) {
  // Slider position is stored as a 0-1 fraction and mapped logarithmically, so that
  // a day of drag near 1.5 days is as findable as a day of drag near 20. On a linear
  // scale the short-period planets would occupy a few pixels.
  const [trial, setTrial] = useState(() =>
    lockedPeriod ? periodToFraction(lockedPeriod) : periodToFraction(3),
  )
  const trialPeriod = fractionToPeriod(trial)
  const activePeriod = lockedPeriod ?? trialPeriod

  const signal = useMemo(() => analyseSignal(star, nights), [star, nights])
  const sigma = useMemo(() => noiseSigma(star.magnitude), [star.magnitude])

  // What a wrong period scores on this particular dataset. Computed once per star and
  // night count, then reused on every drag frame, so the meter stays responsive.
  const noiseFloor = useMemo(() => foldNoiseFloor(points, sigma), [points, sigma])

  const trialStats = useMemo(
    () => foldStats(points, trialPeriod, sigma),
    [points, trialPeriod, sigma],
  )
  const meter = foldScore(trialStats.snr, noiseFloor)

  // What the player can actually measure off their own folded curve, which is not the
  // same as the truth: a box fit to two noisy transits comes back a few percent
  // shallow, and the radius they derive inherits that error. That is what a real
  // measurement feels like, and it is why more nights visibly tighten the answer.
  const measuredDepth = useMemo(
    () => (lockedPeriod ? foldStats(points, lockedPeriod, sigma).depth : 0),
    [points, lockedPeriod, sigma],
  )

  const step: 'detect' | 'characterise' | 'decide' =
    !lockedPeriod ? 'detect' : fittedRadius == null ? 'characterise' : 'decide'

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={onBack}
          className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[12px] text-slate-300 transition-colors hover:border-indigo-400/40 hover:text-white"
        >
          ← Sky field
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-2xl text-white truncate">{star.name}</h2>
          <p className="text-[11px] font-mono text-slate-500">
            {star.spectralType} · {nights} nights observed · {points.length.toLocaleString()} measurements
          </p>
        </div>
        <StepPips step={step} />
      </div>

      {/* ── Step 1: detection ───────────────────────────────────────────── */}
      <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-4">
        <SectionHead
          n={1}
          title="Find the period"
          done={!!lockedPeriod}
          hint="Drag until the scatter collapses"
        />

        <div className="rounded-xl bg-[#060b18] border border-white/5 p-3">
          <LightCurve
            points={points}
            mode={lockedPeriod || trial !== periodToFraction(3) ? 'folded' : 'raw'}
            period={activePeriod}
            height={280}
            sigma={sigma}
            accent={meter > 0.55 ? '#4ade80' : '#7e88ec'}
          />
        </div>

        {!lockedPeriod && (
          <>
            <div className="space-y-2">
              <div className="flex items-baseline justify-between">
                <label htmlFor="period" className="text-[12px] text-slate-500">
                  Trial period
                </label>
                <span className="font-mono text-lg font-semibold text-white tabular-nums">
                  {trialPeriod.toFixed(3)}{' '}
                  <span className="text-[12px] font-normal text-slate-500">days</span>
                </span>
              </div>
              <input
                id="period"
                type="range"
                min={0}
                max={1}
                step={0.0002}
                value={trial}
                onChange={(e) => setTrial(parseFloat(e.target.value))}
                className="w-full accent-indigo-400 cursor-grab active:cursor-grabbing"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-600">
                <span>{PERIOD_MIN} d</span>
                <span>{PERIOD_MAX} d</span>
              </div>
            </div>

            <FoldMeter score={meter} />

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => onLockPeriod(trialPeriod)}
                className="rounded-lg border border-indigo-400/40 bg-indigo-500/15 px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-indigo-500/30"
              >
                Lock this period
              </button>
              {nightsRemaining > 0 && (
                <button
                  onClick={() => onObserveMore(6)}
                  className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-[12px] text-slate-300 transition-colors hover:border-indigo-400/40 hover:text-white"
                >
                  Observe 6 more nights ({nightsRemaining} left)
                </button>
              )}
            </div>

            {signal.detected && !signal.periodConstrained && (
              <Notice tone="warn">
                Something dimmed this star, but only once. A single event tells you an object
                passed in front; it cannot tell you how often. You need a second transit before
                any period is real.
              </Notice>
            )}
          </>
        )}

        {lockedPeriod && (
          <div className="grid gap-3 sm:grid-cols-3">
            <Readout label="Period" value={`${lockedPeriod.toFixed(3)} d`} />
            <Readout label="Measured depth" value={`${(measuredDepth * 100).toFixed(3)}%`} />
            <Readout
              label="Signal-to-noise"
              value={signal.snr.toFixed(1)}
              tone={signal.snr >= SNR_THRESHOLD ? 'good' : 'warn'}
            />
          </div>
        )}

        <HowDoWeKnow question="Why does folding the data make a planet appear?">
          <p>
            One transit dims the star by less than the noise on any single measurement, so
            no individual night shows anything. But the dip repeats on a fixed schedule,
            and the noise does not.
          </p>
          <p>
            Folding wraps every measurement onto one cycle of a trial period. At the wrong
            period the transits land in random places and stay buried. At the right period
            every transit lands on top of every other transit, and averaging them beats the
            noise down by <Formula>√N</Formula> while leaving the dip untouched.
          </p>
          <p className="text-slate-500">
            This is how Kepler found most of its 2,700 planets. Not by seeing them, but by
            stacking four years of brightness measurements until something that repeated
            rose out of something that did not.
          </p>
        </HowDoWeKnow>

        <HowDoWeKnow question="How do you know that dip is a planet and not a starspot?">
          <p>
            You do not, from the period alone. A big dark spot rotating in and out of view
            also dims a star on a strict schedule, and a period search will lock onto it
            just as happily.
          </p>
          <p>
            The difference is the <strong className="text-white">shape</strong>. A planet
            is an opaque disc crossing a bright one: the light drops fast, stays flat while
            the planet is fully in front, then rises fast. A starspot rotates smoothly around
            a curved surface, so its dimming is a soft sine wave with no flat bottom and no
            sharp shoulders.
          </p>
          <p className="text-slate-500">
            Look at the folded curve. Flat floor with steep walls means planet. Rounded valley
            means spots.
          </p>
        </HowDoWeKnow>
      </section>

      {/* ── Step 2: characterisation ────────────────────────────────────── */}
      <AnimatePresence>
        {lockedPeriod && (
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-4"
          >
            <SectionHead
              n={2}
              title="Measure the planet"
              done={fittedRadius != null}
              hint="Only if you think it is a planet"
            />
            <Characterise
              star={star}
              period={lockedPeriod}
              measuredDepth={measuredDepth}
              fittedRadius={fittedRadius}
              onFit={onFitRadius}
            />
          </motion.section>
        )}
      </AnimatePresence>

      {/* ── Step 3: the call ─────────────────────────────────────────────
          Gated on the period alone, deliberately. Measuring a planet's radius is
          only meaningful if you already believe there is a planet, so forcing the
          fit before the verdict would make the player size a world against a star
          they are about to declare has none. Step 2 is the planet path; rejecting a
          starspot skips it. */}
      <AnimatePresence>
        {lockedPeriod && (
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-4"
          >
            <SectionHead n={3} title="Make the call" done={!!verdict} hint="This one is final" />
            <Decide
              star={star}
              period={lockedPeriod}
              verdict={verdict}
              onVerdict={onVerdict}
            />
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ── Step 2 body ────────────────────────────────────────────────────────── */

function Characterise({
  star,
  period,
  measuredDepth,
  fittedRadius,
  onFit,
}: {
  star: Star
  period: number
  measuredDepth: number
  fittedRadius: number | null
  onFit: (r: number) => void
}) {
  // Opens at 1 Earth radius rather than at the answer, so the fit is a real search.
  const [radius, setRadius] = useState(() => fittedRadius ?? 1)
  const simulatedDepth = transitDepth(radius, star.radiusSun)

  // The player's own best estimate from the fit, for comparison with what the depth
  // implies directly. They should land on the same number two different ways.
  const impliedRadius = planetRadiusFromDepth(measuredDepth, star.radiusSun)
  const axis = semiMajorAxisAU(period, star.massSun)
  const duration = transitDurationDays(period, star.radiusSun, axis)

  const error = measuredDepth > 0 ? Math.abs(simulatedDepth - measuredDepth) / measuredDepth : 1
  const matched = error < 0.06

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-[1fr_1.1fr] items-center">
        {/* Visual disc comparison */}
        <div className="relative flex h-48 items-center justify-center rounded-xl bg-[#060b18] border border-white/5 overflow-hidden">
          <div
            className="absolute rounded-full blur-2xl opacity-25"
            style={{ width: 150, height: 150, backgroundColor: star.colour }}
          />
          <div
            className="relative rounded-full"
            style={{ width: 130, height: 130, backgroundColor: star.colour, boxShadow: `0 0 40px ${star.colour}66` }}
          />
          <motion.div
            className="absolute rounded-full bg-[#060b18] border border-ink-4"
            animate={{
              width: Math.max(3, 130 * ((radius * 0.0091577) / star.radiusSun)),
              height: Math.max(3, 130 * ((radius * 0.0091577) / star.radiusSun)),
            }}
            transition={{ type: 'spring', stiffness: 260, damping: 28 }}
          />
          <span className="absolute bottom-2 left-0 right-0 text-center text-[10px] font-mono text-slate-500">
            planet silhouette against {star.name}
          </span>
        </div>

        <div className="space-y-3">
          <div className="flex items-baseline justify-between">
            <label htmlFor="radius" className="text-[12px] text-slate-500">
              Planet radius
            </label>
            <span className="font-mono text-lg font-semibold text-white tabular-nums">
              {radius.toFixed(2)} <span className="text-[12px] font-normal text-slate-500">R⊕</span>
            </span>
          </div>
          <input
            id="radius"
            type="range"
            min={0.2}
            max={6}
            step={0.01}
            value={radius}
            onChange={(e) => setRadius(parseFloat(e.target.value))}
            className="w-full accent-indigo-400 cursor-grab active:cursor-grabbing"
          />

          <div className="grid grid-cols-2 gap-2">
            <Readout label="Your dip" value={`${(simulatedDepth * 100).toFixed(3)}%`} />
            <Readout
              label="Observed dip"
              value={`${(measuredDepth * 100).toFixed(3)}%`}
              tone={matched ? 'good' : undefined}
            />
          </div>

          <MatchMeter error={error} />

          <button
            onClick={() => onFit(radius)}
            disabled={!matched}
            className="w-full rounded-lg border border-indigo-400/40 bg-indigo-500/15 px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-indigo-500/30 disabled:cursor-not-allowed disabled:opacity-30"
          >
            {matched ? 'Record this radius' : 'Match the observed dip to continue'}
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Readout label="Orbital distance" value={`${axis.toFixed(4)} AU`} />
        <Readout label="Transit duration" value={`${(duration * 24).toFixed(2)} h`} />
        <Readout label="Depth implies" value={`${impliedRadius.toFixed(2)} R⊕`} />
      </div>

      <HowDoWeKnow question="How does a dip in brightness give you the planet's size?">
        <p>
          The planet blocks its own silhouette and nothing more, so the fraction of light
          that disappears is just the ratio of the two discs&apos; areas:{' '}
          <Formula>depth = (R_planet / R_star)²</Formula>.
        </p>
        <p>
          That means the measurement is a <em>ratio</em>. A transit never tells you how big
          a planet is on its own; it tells you how big the planet is compared to its star.
          Everything depends on knowing the star, which is why{' '}
          {star.name}&apos;s radius of {star.radiusSun.toFixed(3)} R☉ is doing as much work
          here as your own measurement.
        </p>
        <p className="text-slate-500">
          It is also why small red stars are the best hunting grounds. An Earth-sized planet
          blocks {(transitDepth(1, star.radiusSun) * 100).toFixed(3)}% of {star.name}, but only
          0.0084% of the Sun, which is about 60 times harder to see.
        </p>
      </HowDoWeKnow>

      <HowDoWeKnow question="Where does the orbital distance come from? Nobody measured it.">
        <p>
          Kepler&apos;s third law. For anything orbiting a star,{' '}
          <Formula>a³ = M × P²</Formula>, with distance in AU, period in years, and stellar
          mass in solar masses.
        </p>
        <p>
          You measured the period off the folded light curve. The mass comes from the star&apos;s
          spectral type, {star.spectralType}, which fixes its temperature and colour and
          therefore its mass to within a few percent. Put {period.toFixed(3)} days and{' '}
          {star.massSun.toFixed(3)} M☉ into the law and the orbit falls out at{' '}
          {axis.toFixed(4)} AU.
        </p>
        <p className="text-slate-500">
          Newton showed why the law holds in 1687. It has been letting astronomers convert a
          stopwatch reading into a distance ever since.
        </p>
      </HowDoWeKnow>
    </div>
  )
}

/* ── Step 3 body ────────────────────────────────────────────────────────── */

function Decide({
  star,
  period,
  verdict,
  onVerdict,
}: {
  star: Star
  period: number
  verdict: Verdict | null
  onVerdict: (v: Verdict) => void
}) {
  const axis = semiMajorAxisAU(period, star.massSun)
  const hz = habitableZone(star.luminositySun)
  const teq = equilibriumTempK(star.tempK, star.radiusSun, axis)
  const inHZ = axis >= hz.inner && axis <= hz.outer

  return (
    <div className="space-y-4">
      <HabitableZoneBar axis={axis} hz={hz} colour={star.colour} />

      <div className="grid gap-3 sm:grid-cols-3">
        <Readout label="Orbit" value={`${axis.toFixed(4)} AU`} />
        <Readout
          label="Habitable zone"
          value={`${hz.inner.toFixed(4)} – ${hz.outer.toFixed(4)} AU`}
        />
        <Readout
          label="Equilibrium temp"
          value={`${teq.toFixed(0)} K`}
          tone={teq > 200 && teq < 320 ? 'good' : 'warn'}
        />
      </div>

      <Notice tone={inHZ ? 'good' : 'warn'}>
        {inHZ
          ? `At ${axis.toFixed(4)} AU this world sits inside the zone where liquid water could be stable on a rocky surface. That is not proof of life, or even of water. It means it is worth the follow-up time.`
          : `At ${axis.toFixed(4)} AU this world is ${axis < hz.inner ? 'too close in' : 'too far out'}. Its equilibrium temperature of ${teq.toFixed(0)} K puts stable surface water out of reach.`}
      </Notice>

      {!verdict ? (
        <div className="space-y-2">
          <p className="text-[12px] text-slate-500">
            File your conclusion for {star.name}. You cannot revisit this star afterwards.
          </p>
          <div className="grid gap-2 sm:grid-cols-3">
            <VerdictButton
              label="Transiting planet"
              sub="Flat-bottomed, repeating, right shape"
              tone="emerald"
              onClick={() => onVerdict('planet')}
            />
            <VerdictButton
              label="Starspot"
              sub="Periodic, but rounded, no flat floor"
              tone="amber"
              onClick={() => onVerdict('starspot')}
            />
            <VerdictButton
              label="Nothing real"
              sub="Noise. Not enough signal to claim anything"
              tone="slate"
              onClick={() => onVerdict('nothing')}
            />
          </div>
        </div>
      ) : (
        <Notice tone="neutral">
          Filed: <strong className="text-white">{verdict}</strong>. Results are revealed when
          you close the campaign.
        </Notice>
      )}

      <HowDoWeKnow question="What actually makes a zone 'habitable'?">
        <p>
          It is a narrow, specific claim: the band of orbits where a rocky planet with an
          Earth-like atmosphere could hold <em>liquid water on its surface</em>. Too close and
          the oceans boil away; too far and they freeze out.
        </p>
        <p>
          The band scales with the square root of the star&apos;s brightness, so{' '}
          <Formula>a_inner = 0.95 × √L</Formula> and <Formula>a_outer = 1.37 × √L</Formula>.{' '}
          {star.name} puts out {star.luminositySun.toExponential(2)} times the Sun&apos;s light,
          which pulls its habitable zone in to {hz.inner.toFixed(4)} – {hz.outer.toFixed(4)} AU,
          far closer than Mercury orbits.
        </p>
        <p className="text-slate-500">
          Note what it does not mean. It says nothing about whether there is water, an
          atmosphere, a magnetic field, or life. It only says the sunlight is right. It is a
          filter for where to point the next telescope, not a verdict.
        </p>
      </HowDoWeKnow>

      <HowDoWeKnow question="Why is the calculated temperature colder than Earth really is?">
        <p>
          Equilibrium temperature only balances absorbed starlight against radiated heat. Run
          Earth through it and you get about 255 K, which is 18 degrees below freezing. Earth
          is actually 288 K.
        </p>
        <p>
          The missing 33 degrees is the greenhouse effect. Earth&apos;s atmosphere lets sunlight
          in and slows infrared heat on the way out. Venus, with the same calculation, comes out
          near 230 K and is actually 737 K.
        </p>
        <p className="text-slate-500">
          So this number is a floor, not a forecast. It tells you the sunlight budget. What a
          planet does with it depends on an atmosphere you cannot see from a transit alone.
        </p>
      </HowDoWeKnow>
    </div>
  )
}

/* ── Small shared pieces ────────────────────────────────────────────────── */

function SectionHead({
  n,
  title,
  done,
  hint,
}: {
  n: number
  title: string
  done: boolean
  hint: string
}) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
          done ? 'bg-emerald-500/15 text-emerald-300' : 'bg-indigo-500/15 text-indigo-300'
        }`}
      >
        {done ? '✓' : n}
      </span>
      <h3 className="font-semibold text-white">{title}</h3>
      <span className="ml-auto text-[11px] text-slate-500">{hint}</span>
    </div>
  )
}

function StepPips({ step }: { step: 'detect' | 'characterise' | 'decide' }) {
  const order = ['detect', 'characterise', 'decide']
  const idx = order.indexOf(step)
  return (
    <div className="flex gap-1.5" aria-label={`Step ${idx + 1} of 3`}>
      {order.map((s, i) => (
        <span
          key={s}
          className={`h-1.5 w-7 rounded-full transition-colors ${
            i < idx ? 'bg-emerald-400/60' : i === idx ? 'bg-indigo-500' : 'bg-white/10'
          }`}
        />
      ))}
    </div>
  )
}

function Readout({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone?: 'good' | 'warn'
}) {
  const colour =
    tone === 'good' ? 'text-emerald-300' : tone === 'warn' ? 'text-amber-300' : 'text-white'
  return (
    <div className="rounded-xl border border-white/5 bg-[#060b18] px-3 py-2">
      <div className={`font-mono text-[14px] font-semibold tabular-nums ${colour}`}>{value}</div>
      <div className="mt-0.5 text-[10px] uppercase tracking-wider text-slate-600">{label}</div>
    </div>
  )
}

/** Warm/cold feedback while dragging, so the search is a hunt and not a lottery. */
function FoldMeter({ score }: { score: number }) {
  const label =
    score > 0.75 ? 'Locked on' : score > 0.5 ? 'Very close' : score > 0.25 ? 'Warmer' : 'Scattered'
  const colour = score > 0.5 ? '#4ade80' : score > 0.25 ? '#e2b43d' : '#64748b'
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-[11px]">
        <span className="text-slate-500">Fold quality</span>
        <span className="font-medium" style={{ color: colour }}>
          {label}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.04]">
        <motion.div
          className="h-full rounded-full"
          animate={{ width: `${score * 100}%`, backgroundColor: colour }}
          transition={{ duration: 0.15 }}
        />
      </div>
    </div>
  )
}

function MatchMeter({ error }: { error: number }) {
  const score = Math.max(0, Math.min(1, 1 - error / 0.5))
  const colour = error < 0.06 ? '#4ade80' : error < 0.2 ? '#e2b43d' : '#64748b'
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.04]">
      <motion.div
        className="h-full rounded-full"
        animate={{ width: `${score * 100}%`, backgroundColor: colour }}
        transition={{ duration: 0.15 }}
      />
    </div>
  )
}

function HabitableZoneBar({
  axis,
  hz,
  colour,
}: {
  axis: number
  hz: { inner: number; outer: number }
  colour: string
}) {
  // Log scale, because the orbit can sit an order of magnitude inside the zone and a
  // linear axis would pin it to the far left edge with nothing readable.
  const max = Math.max(hz.outer * 1.6, axis * 1.4)
  const min = Math.min(hz.inner * 0.35, axis * 0.6)
  const pos = (v: number) =>
    ((Math.log10(v) - Math.log10(min)) / (Math.log10(max) - Math.log10(min))) * 100

  return (
    <div className="rounded-xl border border-white/5 bg-[#060b18] p-4">
      <div className="relative h-14">
        {/* Star at the inner edge of the scale */}
        <div
          className="absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full"
          style={{ left: 0, backgroundColor: colour, boxShadow: `0 0 16px ${colour}` }}
        />
        {/* The zone */}
        <div
          className="absolute top-1/2 h-8 -translate-y-1/2 rounded-md border border-emerald-400/30 bg-emerald-500/15"
          style={{ left: `${pos(hz.inner)}%`, width: `${pos(hz.outer) - pos(hz.inner)}%` }}
        />
        {/* The planet */}
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1, left: `${pos(axis)}%` }}
          transition={{ type: 'spring', stiffness: 200, damping: 24 }}
        >
          <div className="h-3.5 w-3.5 rounded-full bg-sky-300 ring-2 ring-sky-300/30" />
        </motion.div>
      </div>
      <div className="mt-1 flex justify-between text-[10px] font-mono text-slate-600">
        <span>{min.toFixed(3)} AU</span>
        <span className="text-emerald-300">habitable zone</span>
        <span>{max.toFixed(3)} AU</span>
      </div>
    </div>
  )
}

function VerdictButton({
  label,
  sub,
  tone,
  onClick,
}: {
  label: string
  sub: string
  tone: 'emerald' | 'amber' | 'slate'
  onClick: () => void
}) {
  const tones = {
    emerald: 'border-emerald-400/30 hover:border-emerald-400/60 hover:bg-emerald-500/15 text-emerald-300',
    amber: 'border-amber-400/30 hover:border-amber-400/60 hover:bg-amber-500/10 text-amber-300',
    slate: 'border-white/10 hover:border-indigo-400/40 hover:bg-white/[0.04] text-slate-300',
  }
  return (
    <button
      onClick={onClick}
      className={`rounded-xl border bg-white/[0.02] px-3 py-3 text-left transition-colors ${tones[tone]}`}
    >
      <div className="text-[13px] font-semibold">{label}</div>
      <div className="mt-0.5 text-[11px] leading-snug text-slate-500">{sub}</div>
    </button>
  )
}

function Notice({
  tone,
  children,
}: {
  tone: 'good' | 'warn' | 'neutral'
  children: React.ReactNode
}) {
  const tones = {
    good: 'border-emerald-400/20 bg-emerald-500/15 text-emerald-300',
    warn: 'border-amber-400/20 bg-amber-500/10 text-amber-300',
    neutral: 'border-white/10 bg-white/[0.04] text-slate-300',
  }
  return (
    <div className={`rounded-xl border px-4 py-3 text-[13px] leading-relaxed ${tones[tone]}`}>
      {children}
    </div>
  )
}

/* ── Log-scale slider mapping ───────────────────────────────────────────── */

function fractionToPeriod(f: number): number {
  const lo = Math.log10(PERIOD_MIN)
  const hi = Math.log10(PERIOD_MAX)
  return Math.pow(10, lo + f * (hi - lo))
}

function periodToFraction(p: number): number {
  const lo = Math.log10(PERIOD_MIN)
  const hi = Math.log10(PERIOD_MAX)
  return (Math.log10(p) - lo) / (hi - lo)
}
