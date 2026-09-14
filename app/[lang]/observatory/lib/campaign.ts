/**
 * Campaign state: what the player has observed, what it cost, and what they concluded.
 *
 * The design rule this file exists to enforce is that observing time is the game's
 * only currency. Every fact the player can know has to be paid for in nights, and
 * nights never come back. That is what separates this from a quiz: a quiz lets you
 * guess again, and an observatory makes you decide what you can afford to look at.
 */

import {
  POINTS_PER_NIGHT,
  TOTAL_NIGHTS,
  getStar,
  type Star,
} from './stars'
import {
  SNR_THRESHOLD,
  detectionSNR,
  foldStats,
  gaussian,
  noiseSigma,
  rng,
  semiMajorAxisAU,
  starspotFlux,
  transitDepth,
  transitDurationDays,
  transitFlux,
} from './physics'

export type Point = { time: number; flux: number }

/** What the player has decided about a star, once they commit. */
export type Verdict = 'planet' | 'starspot' | 'nothing'

export type Observation = {
  starId: string
  /** Nights spent on this star so far. Accumulates across visits. */
  nights: number
}

export type MissionPhase = 'briefing' | 'survey' | 'detect' | 'characterise' | 'decide' | 'results'

export type Campaign = {
  nightsUsed: number
  observations: Record<string, number>
  /** Star the player has opened in the analysis view. */
  activeStarId: string | null
  /** Periods the player has locked in, per star. */
  lockedPeriod: Record<string, number>
  /** Planet radius in Earth radii the player fitted, per star. */
  fittedRadius: Record<string, number>
  /** Final calls the player has made, per star. */
  verdicts: Record<string, Verdict>
  phase: MissionPhase
  /** Stars whose true nature has been revealed on the results screen. */
  revealed: string[]
  startedAt: number
  completedAt: number | null
}

export function newCampaign(): Campaign {
  return {
    nightsUsed: 0,
    observations: {},
    activeStarId: null,
    lockedPeriod: {},
    fittedRadius: {},
    verdicts: {},
    phase: 'briefing',
    revealed: [],
    startedAt: Date.now(),
    completedAt: null,
  }
}

export function nightsRemaining(c: Campaign): number {
  return Math.max(0, TOTAL_NIGHTS - c.nightsUsed)
}

export function nightsOn(c: Campaign, starId: string): number {
  return c.observations[starId] ?? 0
}

/* ── Generating the data ──────────────────────────────────────────────── */

/**
 * Build the light curve for a star given how many nights have been spent on it.
 *
 * Deterministic in (star, nights): observing three more nights extends the same
 * curve rather than redrawing it. The seed is derived from the star id alone, so
 * the noise on the first 1000 points is identical whether the player got there in
 * one visit or four. Without that, revisiting a target would re-roll the noise and
 * a patient player could simply wait out a bad draw, which would make nights
 * meaningless.
 */
export function generateLightCurve(star: Star, nights: number): Point[] {
  if (nights <= 0) return []

  const total = Math.floor(nights * POINTS_PER_NIGHT)
  const sigma = noiseSigma(star.magnitude)
  const next = rng(hashId(star.id))
  const points: Point[] = new Array(total)

  let depth = 0
  let duration = 0
  if (star.planet) {
    depth = transitDepth(star.planet.radiusEarth, star.radiusSun)
    const axis = semiMajorAxisAU(star.planet.periodDays, star.massSun)
    duration = transitDurationDays(star.planet.periodDays, star.radiusSun, axis)
  }

  for (let i = 0; i < total; i++) {
    const time = i / POINTS_PER_NIGHT // days since campaign start
    let flux = 1

    if (star.planet) {
      flux *= transitFlux(time, star.planet.periodDays, star.planet.epochDays, duration, depth)
    }
    if (star.starspot) {
      flux *= starspotFlux(
        time,
        star.starspot.rotationDays,
        star.starspot.epochDays,
        star.starspot.amplitude,
      )
    }

    points[i] = { time, flux: flux + gaussian(next) * sigma }
  }

  return points
}

/** Stable 32-bit hash of a star id, so seeds are reproducible across sessions. */
function hashId(id: string): number {
  let h = 2166136261
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/* ── Reading the data back ────────────────────────────────────────────── */

export type SignalReport = {
  /** True depth of the signal present, 0 if the star is quiet. */
  depth: number
  /** Per-point photometric scatter. */
  sigma: number
  /** Number of complete transits covered by the observation so far. */
  transitsObserved: number
  /** Signal-to-noise of the folded detection. */
  snr: number
  /** True period of whatever is modulating the star, if anything. */
  truePeriod: number | null
  /** Whether the signal clears the detection threshold. */
  detected: boolean
  /**
   * Whether the period is pinned down. One transit proves something happened; it
   * takes two to say how often. This is the distinction that makes the player spend
   * a second batch of nights rather than calling it after the first dip.
   */
  periodConstrained: boolean
}

export function analyseSignal(star: Star, nights: number): SignalReport {
  const sigma = noiseSigma(star.magnitude)

  if (star.planet) {
    const depth = transitDepth(star.planet.radiusEarth, star.radiusSun)
    const axis = semiMajorAxisAU(star.planet.periodDays, star.massSun)
    const duration = transitDurationDays(star.planet.periodDays, star.radiusSun, axis)
    const pointsPerTransit = duration * POINTS_PER_NIGHT
    const transits = Math.floor(Math.max(0, nights - star.planet.epochDays) / star.planet.periodDays) + (nights > star.planet.epochDays ? 1 : 0)
    const covered = Math.max(0, transits)
    const snr = detectionSNR(depth, sigma, covered * pointsPerTransit)
    return {
      depth,
      sigma,
      transitsObserved: covered,
      snr,
      truePeriod: star.planet.periodDays,
      detected: snr >= SNR_THRESHOLD && covered >= 1,
      periodConstrained: covered >= 2,
    }
  }

  if (star.starspot) {
    const depth = star.starspot.amplitude
    const cycles = nights / star.starspot.rotationDays
    // A sinusoid is modulated continuously, so effectively half the points carry signal.
    const covered = Math.floor(cycles)
    const snr = detectionSNR(depth, sigma, (nights * POINTS_PER_NIGHT) / 2)
    return {
      depth,
      sigma,
      transitsObserved: covered,
      snr,
      truePeriod: star.starspot.rotationDays,
      detected: snr >= SNR_THRESHOLD && nights > 0,
      periodConstrained: covered >= 2,
    }
  }

  return {
    depth: 0,
    sigma,
    transitsObserved: 0,
    snr: 0,
    truePeriod: null,
    detected: false,
    periodConstrained: false,
  }
}

/**
 * Depth the player can actually read off their own folded light curve.
 *
 * Deliberately measured from the data rather than looked up from the star, because
 * the whole point of step two is that the player fits *their* measurement. A curve
 * built from two noisy transits reads shallower and wobblier than the true depth,
 * and the radius they derive from it will be slightly off. That is not a bug to
 * correct; it is what a real measurement with real error bars feels like, and it is
 * why spending more nights visibly tightens the answer.
 *
 * Takes the deepest binned average rather than the single lowest point, since one
 * unlucky outlier is noise and a run of low bins is a transit.
 */
export function foldedDepth(points: Point[], periodDays: number, sigma: number): number {
  return foldStats(points, periodDays, sigma).depth
}

/**
 * Whether the player's locked period is close enough to count as correct.
 *
 * 1.5% tolerance, which is tight enough that they genuinely had to find the fold and
 * loose enough that dragging a slider with a mouse is not a precision test. Aliases
 * are handled deliberately: locking twice the true period still lines the transits up
 * visually, so it is accepted with a flag, and the results screen explains why half
 * the folded curve came out empty.
 */
export function checkPeriod(locked: number, truePeriod: number): {
  correct: boolean
  alias: null | 'double' | 'half'
} {
  const tol = 0.015
  const near = (a: number, b: number) => Math.abs(a - b) / b < tol
  if (near(locked, truePeriod)) return { correct: true, alias: null }
  if (near(locked, truePeriod * 2)) return { correct: true, alias: 'double' }
  if (near(locked, truePeriod / 2)) return { correct: true, alias: 'half' }
  return { correct: false, alias: null }
}

/* ── Scoring ──────────────────────────────────────────────────────────── */

export type Grade = {
  /** Stars the player called correctly. */
  correct: number
  /** Stars the player called incorrectly. */
  wrong: number
  /** Whether the habitable planet was found and correctly identified. */
  foundTarget: boolean
  /** Whether the starspot decoy was correctly rejected. */
  rejectedDecoy: boolean
  nightsUsed: number
  /** Emoji summary for sharing, matching the quiz's existing streak-share format. */
  squares: string
}

export function gradeCampaign(c: Campaign): Grade {
  let correct = 0
  let wrong = 0
  let foundTarget = false
  let rejectedDecoy = false
  const squares: string[] = []

  for (const [starId, verdict] of Object.entries(c.verdicts)) {
    const star = getStar(starId)
    if (!star) continue

    const truth: Verdict = star.planet ? 'planet' : star.starspot ? 'starspot' : 'nothing'
    const ok = verdict === truth
    if (ok) {
      correct++
      squares.push('🟩')
    } else {
      wrong++
      squares.push('🟥')
    }

    if (ok && star.planet) {
      const axis = semiMajorAxisAU(star.planet.periodDays, star.massSun)
      const hz = habitableRange(star)
      if (axis >= hz.inner && axis <= hz.outer) foundTarget = true
    }
    if (ok && star.starspot) rejectedDecoy = true
  }

  return {
    correct,
    wrong,
    foundTarget,
    rejectedDecoy,
    nightsUsed: c.nightsUsed,
    squares: squares.join(''),
  }
}

function habitableRange(star: Star) {
  const scale = Math.sqrt(star.luminositySun)
  return { inner: 0.95 * scale, outer: 1.37 * scale }
}
