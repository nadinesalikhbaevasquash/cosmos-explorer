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
import HowDoWeKnow from './HowDoWeKnow'
import Prose from './Prose'
import { FoldMeter, Notice, PeriodControl, Readout } from './Bits'
import { useDict } from '@/app/hooks/useDict'
import { fmt } from '../lib/format'
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
  // The chart stays in raw time order until the player first touches the period, so
  // the opening view is the featureless scatter a real astronomer starts from.
  const [trialPeriod, setTrialPeriod] = useState(() => lockedPeriod ?? 3)
  const [touched, setTouched] = useState(() => lockedPeriod != null)
  const activePeriod = lockedPeriod ?? trialPeriod

  const o = useDict().observatory
  const u = o.ui
  const x = o.explain
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
          className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-[12px] text-slate-300 transition-colors hover:border-indigo-400/40 hover:text-white"
        >
          ← {u.skyField}
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-2xl text-white truncate">{star.name}</h2>
          <p className="text-[11px] font-mono text-slate-500">
            {fmt(u.header, { type: star.spectralType, nights, count: points.length.toLocaleString() })}
          </p>
        </div>
        <StepPips step={step} />
      </div>

      {/* ── Step 1: detection ───────────────────────────────────────────── */}
      <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:p-5 space-y-4">
        <SectionHead n={1} title={u.step1} done={!!lockedPeriod} hint={u.step1Hint} />

        <div className="rounded-xl bg-[#060b18] border border-white/5 p-2 sm:p-3">
          <LightCurve
            points={points}
            mode={lockedPeriod || touched ? 'folded' : 'raw'}
            period={activePeriod}
            height={260}
            sigma={sigma}
            accent={meter > 0.55 ? '#4ade80' : '#7e88ec'}
          />
        </div>

        {!lockedPeriod && (
          <>
            <PeriodControl
              period={trialPeriod}
              min={PERIOD_MIN}
              max={PERIOD_MAX}
              onChange={(p) => {
                setTrialPeriod(p)
                setTouched(true)
              }}
            />

            <FoldMeter score={meter} />

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => onLockPeriod(trialPeriod)}
                className="rounded-lg border border-indigo-400/40 bg-indigo-500/15 px-4 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-indigo-500/30"
              >
                {u.lockPeriod}
              </button>
              {nightsRemaining > 0 && (
                <button
                  onClick={() => onObserveMore(6)}
                  className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5 text-[12px] text-slate-300 transition-colors hover:border-indigo-400/40 hover:text-white"
                >
                  {fmt(u.observeMore, { n: 6, left: nightsRemaining })}
                </button>
              )}
            </div>

            {signal.detected && !signal.periodConstrained && (
              <Notice tone="warn">{u.oneTransit}</Notice>
            )}
          </>
        )}

        {lockedPeriod && (
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3">
            <Readout label={u.period} value={`${lockedPeriod.toFixed(3)} ${u.d}`} />
            <Readout label={u.measuredDepth} value={`${(measuredDepth * 100).toFixed(3)}%`} />
            <Readout
              label={u.snr}
              value={signal.snr.toFixed(1)}
              tone={signal.snr >= SNR_THRESHOLD ? 'good' : 'warn'}
            />
          </div>
        )}

        <HowDoWeKnow question={x.fold.q}>
          {x.fold.p.map((t, i) => (
            <Prose key={i} text={t} values={{}} dim={i === 2} />
          ))}
        </HowDoWeKnow>

        <HowDoWeKnow question={x.starspot.q}>
          {x.starspot.p.map((t, i) => (
            <Prose key={i} text={t} values={{}} dim={i === 2} />
          ))}
        </HowDoWeKnow>
      </section>

      {/* ── Step 2: characterisation ────────────────────────────────────── */}
      <AnimatePresence>
        {lockedPeriod && (
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:p-5 space-y-4"
          >
            <SectionHead n={2} title={u.step2} done={fittedRadius != null} hint={u.step2Hint} />
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
            className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:p-5 space-y-4"
          >
            <SectionHead n={3} title={u.step3} done={!!verdict} hint={u.step3Hint} />
            <Decide star={star} period={lockedPeriod} verdict={verdict} onVerdict={onVerdict} />
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
  const o = useDict().observatory
  const u = o.ui
  const x = o.explain
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
          <span className="absolute bottom-2 left-0 right-0 px-2 text-center text-[10px] font-mono text-slate-500">
            {fmt(u.silhouette, { star: star.name })}
          </span>
        </div>

        <div className="space-y-3">
          <div className="flex items-baseline justify-between">
            <label htmlFor="radius" className="text-[12px] text-slate-500">
              {u.planetRadius}
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
            className="an-range w-full accent-indigo-400 cursor-grab active:cursor-grabbing"
          />

          <div className="grid grid-cols-2 gap-2">
            <Readout label={u.yourDip} value={`${(simulatedDepth * 100).toFixed(3)}%`} />
            <Readout
              label={u.observedDip}
              value={`${(measuredDepth * 100).toFixed(3)}%`}
              tone={matched ? 'good' : undefined}
            />
          </div>

          <MatchMeter error={error} />

          <button
            onClick={() => onFit(radius)}
            disabled={!matched}
            className="w-full rounded-lg border border-indigo-400/40 bg-indigo-500/15 px-4 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-indigo-500/30 disabled:cursor-not-allowed disabled:opacity-30"
          >
            {matched ? u.recordRadius : u.matchFirst}
          </button>
        </div>
      </div>

      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3">
        <Readout label={u.orbitalDistance} value={`${axis.toFixed(4)} AU`} />
        <Readout label={u.transitDuration} value={`${(duration * 24).toFixed(2)} h`} />
        <Readout label={u.depthImplies} value={`${impliedRadius.toFixed(2)} R⊕`} />
      </div>

      <HowDoWeKnow question={x.size.q}>
        {x.size.p.map((t, i) => (
          <Prose key={i} text={t} values={{ star: star.name, radius: star.radiusSun.toFixed(3), earthDepth: (transitDepth(1, star.radiusSun) * 100).toFixed(3) }} dim={i === 2} />
        ))}
      </HowDoWeKnow>

      <HowDoWeKnow question={x.distance.q}>
        {x.distance.p.map((t, i) => (
          <Prose key={i} text={t} values={{ type: star.spectralType, period: period.toFixed(3), mass: star.massSun.toFixed(3), axis: axis.toFixed(4) }} dim={i === 2} />
        ))}
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
  const o = useDict().observatory
  const u = o.ui
  const x = o.explain
  const axis = semiMajorAxisAU(period, star.massSun)
  const hz = habitableZone(star.luminositySun)
  const teq = equilibriumTempK(star.tempK, star.radiusSun, axis)
  const inHZ = axis >= hz.inner && axis <= hz.outer
  const values = { axis: axis.toFixed(4), teq: teq.toFixed(0) }

  return (
    <div className="space-y-4">
      <HabitableZoneBar axis={axis} hz={hz} colour={star.colour} />

      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3">
        <Readout label={u.orbit} value={`${axis.toFixed(4)} AU`} />
        <Readout label={u.habitableZone} value={`${hz.inner.toFixed(4)}–${hz.outer.toFixed(4)} AU`} />
        <Readout
          label={u.eqTemp}
          value={`${teq.toFixed(0)} K`}
          tone={teq > 200 && teq < 320 ? 'good' : 'warn'}
        />
      </div>

      <Notice tone={inHZ ? 'good' : 'warn'}>
        {fmt(inHZ ? u.inZone : axis < hz.inner ? u.tooClose : u.tooFar, values)}
      </Notice>

      {!verdict ? (
        <div className="space-y-2">
          <p className="text-[12px] text-slate-500">{fmt(u.fileFor, { star: star.name })}</p>
          <div className="grid gap-2 sm:grid-cols-3">
            <VerdictButton {...u.verdicts.planet} tone="emerald" onClick={() => onVerdict('planet')} />
            <VerdictButton {...u.verdicts.starspot} tone="amber" onClick={() => onVerdict('starspot')} />
            <VerdictButton {...u.verdicts.nothing} tone="slate" onClick={() => onVerdict('nothing')} />
          </div>
        </div>
      ) : (
        <Notice tone="neutral">
          <Prose text={u.filedNotice} values={{ verdict: u.chips[verdict] }} />
        </Notice>
      )}

      <HowDoWeKnow question={x.habitable.q}>
        {x.habitable.p.map((t, i) => (
          <Prose key={i} text={t} values={{ star: star.name, lum: star.luminositySun.toExponential(2), inner: hz.inner.toFixed(4), outer: hz.outer.toFixed(4) }} dim={i === 2} />
        ))}
      </HowDoWeKnow>

      <HowDoWeKnow question={x.temperature.q}>
        {x.temperature.p.map((t, i) => (
          <Prose key={i} text={t} values={{}} dim={i === 2} />
        ))}
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
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
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
  const u = useDict().observatory.ui
  const order = ['detect', 'characterise', 'decide']
  const idx = order.indexOf(step)
  return (
    <div className="flex gap-1.5" aria-label={fmt(u.stepOf, { i: idx + 1 })}>
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

export function HabitableZoneBar({
  axis,
  hz,
  colour,
}: {
  axis: number
  hz: { inner: number; outer: number }
  colour: string
}) {
  const u = useDict().observatory.ui
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
      <div className="mt-1 flex justify-between text-[10px] font-mono text-slate-500">
        <span>{min.toFixed(3)} AU</span>
        <span className="text-emerald-300">{u.hzBar}</span>
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
