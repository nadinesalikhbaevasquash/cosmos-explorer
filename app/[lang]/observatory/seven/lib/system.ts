/**
 * Mission 2: the TRAPPIST-1 system, all seven planets in one light curve.
 *
 * Mission 1 ends on TRAPPIST-1e. This picks up there, on the same star with the same
 * noise model, and asks the question the real discovery team faced in 2016: if one
 * planet transits, what else is hiding in the same data?
 *
 * The new instrument is masking. Once a planet is claimed, its transits are cut out
 * of the curve and every later fold runs on what is left. It is not a game
 * convenience; it is how multi-planet systems are actually dug out, and without it
 * the mission is close to impossible. Measured on this exact noise model at 30
 * nights: d, e and f score 0.18 to 0.28 on the fold meter with b and c still in the
 * data, and 0.76 to 1.00 once they are removed. The big, fast planets drown out the
 * small, slow ones, and the player feels that happen.
 *
 * h is the long pole. Two of its transits need about 26 nights, and the fold only
 * climbs clear of the noise at 36 or more, which is what makes the budget a decision:
 * stop early with six, or spend nearly everything chasing the seventh.
 */

import { POINTS_PER_NIGHT, TARGET_STAR_ID, getStar, type Star } from '../../lib/stars'
import type { Point } from '../../lib/campaign'
import {
  foldPhase,
  foldStats,
  gaussian,
  noiseSigma,
  rng,
  semiMajorAxisAU,
  transitDepth,
  transitDurationDays,
  transitFlux,
} from '../../lib/physics'

export const HOST: Star = getStar(TARGET_STAR_ID)!

export const TOTAL_NIGHTS = 42
export const PERIOD_MIN = 0.8
export const PERIOD_MAX = 25

/** Per-point scatter for TRAPPIST-1, identical to mission 1's. */
export const SIGMA = noiseSigma(HOST.magnitude)

export type World = {
  id: string
  name: string
  radiusEarth: number
  periodDays: number
  /** First mid-transit, in days from the start of the campaign. A simulation choice. */
  epochDays: number
}

/**
 * Periods and radii from Agol et al. (2021), the most precise published solution for
 * the system. e matches mission 1's values, so the planet the player already found
 * sits exactly where they left it.
 */
export const WORLDS: World[] = [
  { id: 'b', name: 'TRAPPIST-1b', radiusEarth: 1.116, periodDays: 1.510826, epochDays: 0.37 },
  { id: 'c', name: 'TRAPPIST-1c', radiusEarth: 1.097, periodDays: 2.421937, epochDays: 1.93 },
  { id: 'd', name: 'TRAPPIST-1d', radiusEarth: 0.788, periodDays: 4.049219, epochDays: 0.81 },
  { id: 'e', name: 'TRAPPIST-1e', radiusEarth: 0.92, periodDays: 6.101013, epochDays: 2.4 },
  { id: 'f', name: 'TRAPPIST-1f', radiusEarth: 1.045, periodDays: 9.20754, epochDays: 5.62 },
  { id: 'g', name: 'TRAPPIST-1g', radiusEarth: 1.129, periodDays: 12.352446, epochDays: 3.14 },
  { id: 'h', name: 'TRAPPIST-1h', radiusEarth: 0.755, periodDays: 18.772866, epochDays: 7.3 },
]

export function durationFor(periodDays: number): number {
  const axis = semiMajorAxisAU(periodDays, HOST.massSun)
  return transitDurationDays(periodDays, HOST.radiusSun, axis)
}

/* ── Data ─────────────────────────────────────────────────────────────── */

/**
 * The light curve after `nights` of staring at TRAPPIST-1.
 *
 * Seeded once and generated in time order, so observing more nights extends the same
 * curve rather than re-rolling it, for the same reason as mission 1: a player must
 * not be able to wait out a bad draw.
 */
export function generateSystemCurve(nights: number): Point[] {
  if (nights <= 0) return []
  const total = Math.floor(nights * POINTS_PER_NIGHT)
  const next = rng(0x7a11e5)
  const geo = WORLDS.map((w) => ({
    w,
    duration: durationFor(w.periodDays),
    depth: transitDepth(w.radiusEarth, HOST.radiusSun),
  }))

  const points: Point[] = new Array(total)
  for (let i = 0; i < total; i++) {
    const time = i / POINTS_PER_NIGHT
    let flux = 1
    for (const g of geo) flux *= transitFlux(time, g.w.periodDays, g.w.epochDays, g.duration, g.depth)
    points[i] = { time, flux: flux + gaussian(next) * SIGMA }
  }
  return points
}

export type Claim = { id: string; period: number }

export type Measured = { depth: number; centre: number }

/**
 * Cut every claimed planet's transits out of the data, in the order they were
 * claimed, measuring each one on the data that was left when it was found.
 *
 * The mask is 1.5 transit durations wide, centred where the fold puts mid-transit.
 * The centre is re-measured every time rather than stored, so a claim made after 12
 * nights still masks correctly after 40, as long as its period was right. If the
 * period was wrong the mask drifts off the real transits, which is itself the lesson.
 */
export function maskClaims(
  points: Point[],
  claims: Claim[],
): { remaining: Point[]; measured: Record<string, Measured> } {
  let work = points
  const measured: Record<string, Measured> = {}

  for (const c of claims) {
    const s = foldStats(work, c.period, SIGMA)
    measured[c.id] = { depth: s.depth, centre: s.minPhase }
    const half = (durationFor(c.period) / c.period) * 0.75
    work = work.filter((p) => {
      let d = Math.abs(foldPhase(p.time, c.period) - s.minPhase)
      if (d > 0.5) d = 1 - d
      return d > half
    })
  }

  return { remaining: work, measured }
}

/* ── Campaign ─────────────────────────────────────────────────────────── */

export type SevenCampaign = {
  nightsUsed: number
  claims: Claim[]
  phase: 'briefing' | 'search' | 'results'
  startedAt: number
  completedAt: number | null
}

export function newSevenCampaign(): SevenCampaign {
  return { nightsUsed: 0, claims: [], phase: 'briefing', startedAt: Date.now(), completedAt: null }
}

const KEY = 'astranova-observatory-seven'

export function loadSeven(): SevenCampaign | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as SevenCampaign
    if (typeof parsed?.nightsUsed !== 'number' || !Array.isArray(parsed?.claims)) return null
    return { ...newSevenCampaign(), ...parsed }
  } catch {
    return null
  }
}

export function saveSeven(c: SevenCampaign) {
  try {
    localStorage.setItem(KEY, JSON.stringify(c))
  } catch {
    // Private browsing or a full quota. The survey still works for this session.
  }
}

export function clearSeven() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    // The caller resets in-memory state regardless.
  }
}

/* ── Grading ──────────────────────────────────────────────────────────── */

/** Same 1.5% tolerance as mission 1: the fold had to be found, the slider is not a precision test. */
const near = (a: number, b: number) => Math.abs(a - b) / b < 0.015

export type ClaimOutcome =
  | { kind: 'found'; world: World }
  | { kind: 'alias'; world: World; ratio: string }
  | { kind: 'none' }

export type SevenGrade = {
  /** Claim that found each world, keyed by world id. */
  found: Record<string, Claim>
  outcomes: Record<string, ClaimOutcome>
  foundCount: number
  wrong: number
  squares: string
}

export function gradeSeven(c: SevenCampaign): SevenGrade {
  const found: Record<string, Claim> = {}
  const outcomes: Record<string, ClaimOutcome> = {}

  for (const claim of c.claims) {
    const hit = WORLDS.find((w) => near(claim.period, w.periodDays) && !found[w.id])
    if (hit) {
      found[hit.id] = claim
      outcomes[claim.id] = { kind: 'found', world: hit }
      continue
    }

    // A fold at twice a real period stacks every other transit and still shows a dip,
    // so aliases are the mistake most worth explaining rather than just marking wrong.
    let alias: ClaimOutcome = { kind: 'none' }
    search: for (const w of WORLDS) {
      for (const [ratio, label] of [[2, '2×'], [3, '3×'], [0.5, '½'], [1 / 3, '⅓']] as const) {
        if (near(claim.period, w.periodDays * ratio)) {
          alias = { kind: 'alias', world: w, ratio: label }
          break search
        }
      }
    }
    outcomes[claim.id] = alias
  }

  const foundCount = Object.keys(found).length
  const wrong = c.claims.length - foundCount
  const squares = WORLDS.map((w) => (found[w.id] ? '🟩' : '⬛')).join('') + '🟥'.repeat(wrong)

  return { found, outcomes, foundCount, wrong, squares }
}
