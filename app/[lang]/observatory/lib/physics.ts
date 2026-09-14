/**
 * Observatory physics.
 *
 * Every number the player measures comes out of this file, and every formula here
 * is the real one. The mission is only honest if the simulation is: when the player
 * fits a curve and reads off a planet radius, that radius has to be what a real
 * astronomer would get from the same data.
 *
 * Units, fixed once so nothing downstream has to guess:
 *   distance  AU, except stellar radii which stay in solar radii
 *   time      days, except where Kepler's third law needs years
 *   mass      solar masses
 *   radius    Earth radii for planets, solar radii for stars
 *   flux      normalised so an untransited star sits at 1.0
 */

/** Solar radius expressed in AU. Converts stellar radii into orbital units. */
export const R_SUN_IN_AU = 0.00465047

/** Earth radius expressed in solar radii. Converts planet radii into stellar units. */
export const R_EARTH_IN_R_SUN = 0.0091577

const DAYS_PER_YEAR = 365.25

/* ── Transit geometry ─────────────────────────────────────────────────── */

/**
 * Fractional dip in brightness while the planet crosses the star's disc.
 *
 * The planet blocks its own silhouette, so the missing light is the ratio of the
 * two discs' areas: depth = (Rp / Rs)^2. This is the whole reason transits work,
 * and it is why a small planet around a small star is easier to find than a small
 * planet around a big one.
 */
export function transitDepth(planetRadiusEarth: number, starRadiusSun: number): number {
  const ratio = (planetRadiusEarth * R_EARTH_IN_R_SUN) / starRadiusSun
  return ratio * ratio
}

/**
 * The inverse of {@link transitDepth}: read a planet's size back out of a measured
 * depth. This is what the player is really doing when they size a disc against the
 * star until the simulated dip matches the observed one.
 */
export function planetRadiusFromDepth(depth: number, starRadiusSun: number): number {
  if (depth <= 0) return 0
  return (Math.sqrt(depth) * starRadiusSun) / R_EARTH_IN_R_SUN
}

/**
 * Kepler's third law, in the form where the Sun-Earth case falls out as 1:
 *   a^3 = M * P^2     (a in AU, P in years, M in solar masses)
 *
 * The period is something the player measures directly off the light curve, and the
 * stellar mass comes from the star's spectral type, so this is the step that turns
 * "it repeats every 6 days" into "it orbits 0.028 AU out".
 */
export function semiMajorAxisAU(periodDays: number, starMassSun: number): number {
  const periodYears = periodDays / DAYS_PER_YEAR
  return Math.cbrt(starMassSun * periodYears * periodYears)
}

/** Kepler's third law solved the other way, for the draggable-orbit control. */
export function periodDaysFromAxis(axisAU: number, starMassSun: number): number {
  const periodYears = Math.sqrt((axisAU * axisAU * axisAU) / starMassSun)
  return periodYears * DAYS_PER_YEAR
}

/**
 * How long one transit lasts, for a planet crossing the centre of the star's disc.
 *
 * The planet has to travel one stellar diameter relative to the orbit's
 * circumference, so the transit takes the fraction Rs / (pi * a) of a full period.
 * Real transits vary with impact parameter; the missions all use central crossings,
 * which keeps the geometry teachable without making the number wrong.
 */
export function transitDurationDays(
  periodDays: number,
  starRadiusSun: number,
  axisAU: number,
): number {
  const starRadiusAU = starRadiusSun * R_SUN_IN_AU
  return (periodDays * starRadiusAU) / (Math.PI * axisAU)
}

/* ── Starlight ────────────────────────────────────────────────────────── */

/**
 * Main-sequence mass-luminosity relation, L ∝ M^3.5.
 *
 * An approximation, but a good one across the range of stars these missions use,
 * and it captures the fact the player needs: small stars are drastically fainter,
 * which is why their habitable zones sit so close in.
 */
export function luminosityFromMass(starMassSun: number): number {
  return Math.pow(starMassSun, 3.5)
}

/**
 * Conservative habitable zone, in AU, scaled from the Sun's by sqrt(L).
 *
 * Bounds follow the runaway-greenhouse and maximum-greenhouse limits: roughly
 * 0.95 AU to 1.37 AU for the Sun. "Habitable" here means liquid water could be
 * stable on the surface given an Earth-like atmosphere, which is a much narrower
 * claim than "life lives there", and the mission says so.
 */
export function habitableZone(luminositySun: number): { inner: number; outer: number } {
  const scale = Math.sqrt(luminositySun)
  return { inner: 0.95 * scale, outer: 1.37 * scale }
}

/**
 * Equilibrium temperature in kelvin: the temperature a planet settles at when the
 * starlight it absorbs balances the heat it radiates away.
 *
 * Deliberately ignores greenhouse warming, which is why Earth computes to about
 * 255 K here instead of its actual 288 K. That gap is itself a "how do we know"
 * panel rather than a bug to paper over.
 */
export function equilibriumTempK(
  starTempK: number,
  starRadiusSun: number,
  axisAU: number,
  albedo = 0.3,
): number {
  const starRadiusAU = starRadiusSun * R_SUN_IN_AU
  return starTempK * Math.sqrt(starRadiusAU / (2 * axisAU)) * Math.pow(1 - albedo, 0.25)
}

/* ── Seeded randomness ────────────────────────────────────────────────── */

/**
 * Mulberry32. Small, fast, and good enough for photon noise.
 *
 * Seeded on purpose: a star observed for five nights and then five more must extend
 * the same light curve, not produce a fresh random one. Without this the player
 * could re-roll noise by revisiting a target, which would quietly break the whole
 * "observing time is a resource" premise.
 */
export function rng(seed: number): () => number {
  let a = seed >>> 0
  return function next() {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Box-Muller: turn two uniform draws into one standard normal draw. */
export function gaussian(next: () => number): number {
  let u = 0
  let v = 0
  while (u === 0) u = next()
  while (v === 0) v = next()
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

/**
 * Per-point photometric scatter for a star of the given apparent magnitude.
 *
 * Brightness falls by 10^(0.4 * Δmag), and photon-counting noise goes as the square
 * root of the signal, so the scatter grows as 10^(0.2 * Δmag). A magnitude 10 star
 * is the reference. The practical effect, which is the point of modelling it at all:
 * faint stars need more nights before a real planet climbs out of the noise.
 */
export function noiseSigma(magnitude: number, referenceMag = 10, baseSigma = 0.0006): number {
  return baseSigma * Math.pow(10, 0.2 * (magnitude - referenceMag))
}

/* ── Signal shapes ────────────────────────────────────────────────────── */

/**
 * Flux from a transiting planet at time t, as a fraction of the unobscured star.
 *
 * Trapezoidal: flat-bottomed while the planet is fully on the disc, with linear
 * ingress and egress ramps. The flat bottom with sharp shoulders is the shape the
 * player learns to recognise, and it is what separates a real transit from the
 * decoy below.
 */
export function transitFlux(
  timeDays: number,
  periodDays: number,
  epochDays: number,
  durationDays: number,
  depth: number,
): number {
  // Phase measured from mid-transit, wrapped into [-P/2, +P/2).
  let phase = (timeDays - epochDays) % periodDays
  if (phase < -periodDays / 2) phase += periodDays
  if (phase >= periodDays / 2) phase -= periodDays

  const half = durationDays / 2
  const rampFraction = 0.18 // ingress and egress each take ~18% of the crossing
  const ramp = durationDays * rampFraction
  const dist = Math.abs(phase)

  if (dist >= half) return 1
  if (dist <= half - ramp) return 1 - depth
  return 1 - depth * ((half - dist) / ramp)
}

/**
 * Flux from a rotating star carrying a large starspot.
 *
 * Smooth and sinusoidal, because the spot rotates in and out of view rather than
 * cutting across the disc. It is periodic and it dims the star, so it fools a naive
 * period search, but it has no flat bottom and no sharp shoulders. Telling these two
 * shapes apart is the real skill the detection phase is teaching.
 */
export function starspotFlux(
  timeDays: number,
  rotationDays: number,
  epochDays: number,
  amplitude: number,
): number {
  const phase = ((timeDays - epochDays) / rotationDays) * 2 * Math.PI
  return 1 - (amplitude / 2) * (1 + Math.cos(phase))
}

/* ── Folding ──────────────────────────────────────────────────────────── */

/**
 * Wrap every observation onto a single cycle of the trial period.
 *
 * This is the heart of the mission. Scattered points spread over weeks carry a
 * repeating signal too shallow to see in any one night. Fold them at the wrong
 * period and they stay a formless cloud; fold them at the right one and every
 * transit lands on top of every other transit, and the planet appears.
 *
 * Returns phase in [-0.5, 0.5) so mid-transit sits at 0, centred in the chart.
 */
export function foldPhase(timeDays: number, periodDays: number, epochDays = 0): number {
  const raw = ((timeDays - epochDays) / periodDays) % 1
  const wrapped = raw < 0 ? raw + 1 : raw
  return wrapped >= 0.5 ? wrapped - 1 : wrapped
}

export type FoldStats = {
  bins: number
  /** Mean flux per phase bin, null where no measurement landed. */
  means: (number | null)[]
  /** Out-of-transit reference level, taken as the median of the bins. */
  baseline: number
  /** Depth of the deepest bin below the baseline. */
  depth: number
  /** Phase in [-0.5, 0.5) of the deepest bin, i.e. where mid-transit sits. */
  minPhase: number
  /** Expected noise on a single bin mean, sigma / sqrt(points per bin). */
  binSigma: number
  /** depth / binSigma. The statistic that says whether the fold found anything. */
  snr: number
}

/**
 * Bin count for a folded curve.
 *
 * This is not a cosmetic choice, it decides whether the mission works at all.
 * TRAPPIST-1e's transit lasts 0.88 hours out of a 6.1-day orbit, so it occupies
 * 0.6% of the phase. Bin the fold into 60 bins and the transit is narrower than a
 * single bin: its depth gets averaged together with the out-of-transit points
 * sharing that bin, and a 0.50% transit reads as 0.14%. The player would then fit a
 * 0.49 Earth-radius planet to a world that is actually 0.92, and the results screen
 * would tell them they were wrong when the instrument was.
 *
 * So bins scale with the data, targeting roughly 14 points each: enough that a bin
 * mean is stable, fine enough that a short transit lands in a bin of its own.
 */
export function binCountFor(pointCount: number): number {
  return Math.max(60, Math.min(240, Math.round(pointCount / 14)))
}

/**
 * Fold the data at a trial period and measure what came out.
 *
 * Everything the detection step needs comes from here: the binned curve the chart
 * draws, the depth the player fits a planet to, and the signal-to-noise that drives
 * the warm/cold meter while they drag.
 *
 * The baseline is the median bin rather than the mean, because a transit deep enough
 * to matter would drag a mean down and make the dip understate itself.
 */
export function foldStats(
  points: { time: number; flux: number }[],
  periodDays: number,
  sigma: number,
  binsOverride?: number,
): FoldStats {
  const bins = binsOverride ?? binCountFor(points.length)
  const empty: FoldStats = {
    bins,
    means: new Array(bins).fill(null),
    baseline: 1,
    depth: 0,
    minPhase: 0,
    binSigma: sigma,
    snr: 0,
  }
  if (points.length === 0 || periodDays <= 0) return empty

  const sums = new Array<number>(bins).fill(0)
  const counts = new Array<number>(bins).fill(0)

  for (const p of points) {
    const phase = foldPhase(p.time, periodDays) + 0.5 // [0,1)
    const bin = Math.min(bins - 1, Math.max(0, Math.floor(phase * bins)))
    sums[bin] += p.flux
    counts[bin] += 1
  }

  const means: (number | null)[] = new Array(bins).fill(null)
  const filled: number[] = []
  let minVal = Infinity
  let minIdx = 0
  let occupied = 0

  for (let i = 0; i < bins; i++) {
    if (counts[i] === 0) continue
    const m = sums[i] / counts[i]
    means[i] = m
    filled.push(m)
    occupied += counts[i]
    if (m < minVal) {
      minVal = m
      minIdx = i
    }
  }

  if (filled.length === 0) return empty

  const sorted = [...filled].sort((a, b) => a - b)
  const baseline = sorted[Math.floor(sorted.length / 2)]

  // Noise on a bin mean falls as sqrt of the points averaged into it.
  const perBin = occupied / filled.length
  const binSigma = perBin > 0 ? sigma / Math.sqrt(perBin) : sigma

  /* Depth, measured by fitting a box to the folded curve.
   *
   * Neither the deepest bin nor a window of whole bins gives an honest depth. A
   * transit lasting 0.6% of the phase is narrower than a single bin, so any bin
   * touching the event also holds out-of-transit points that pull the average up.
   * Measured that way TRAPPIST-1e reads 0.23% when it is really 0.50%, and the player
   * walks away with a planet half the size of the real one.
   *
   * The fix is the same one real transit searches use. Box Least Squares scans window
   * widths around the candidate centre and keeps the one that maximises
   * depth / (sigma / sqrt(N)). The maximum sits at the true transit duration on its
   * own: too narrow and there are too few points to beat the noise, too wide and the
   * depth dilutes. Nobody has to tell it how long the transit is, which matters
   * because neither does the player. */
  const phases = points.map((p) => ({ ph: foldPhase(p.time, periodDays), flux: p.flux }))
  phases.sort((a, b) => a.ph - b.ph)

  // Prefix sums make any window's mean an O(log n) lookup instead of a full scan,
  // which keeps the whole search cheap enough to run on every frame of a slider drag.
  const prefix = new Float64Array(phases.length + 1)
  for (let i = 0; i < phases.length; i++) prefix[i + 1] = prefix[i] + phases[i].flux

  const lowerBound = (target: number) => {
    let lo = 0
    let hi = phases.length
    while (lo < hi) {
      const mid = (lo + hi) >> 1
      if (phases[mid].ph < target) lo = mid + 1
      else hi = mid
    }
    return lo
  }

  const binWidth = 1 / bins
  const centre = (minIdx + 0.5) / bins - 0.5

  let bestDepth = 0
  let bestSNR = 0
  let bestCount = 0

  // Centres within half a bin either side, since the deepest bin locates the event
  // only to bin resolution, and widths from a fifth of a bin to four bins.
  for (let c = -2; c <= 2; c++) {
    const mid = centre + (c * binWidth) / 4
    for (let w = 1; w <= 20; w++) {
      const half = (binWidth * w) / 5
      const i0 = lowerBound(mid - half)
      const i1 = lowerBound(mid + half)
      const n = i1 - i0
      if (n < 3) continue
      const mean = (prefix[i1] - prefix[i0]) / n
      const d = baseline - mean
      if (d <= 0) continue
      const s = d / (sigma / Math.sqrt(n))
      if (s > bestSNR) {
        bestSNR = s
        bestDepth = d
        bestCount = n
      }
    }
  }

  // Fall back to the deepest bin if the box fit found nothing, which happens on a
  // genuinely quiet star where there is no event to fit.
  const depth = bestCount > 0 ? bestDepth : Math.max(0, baseline - minVal)
  const snr = bestCount > 0 ? bestSNR : (baseline - minVal) / binSigma

  return {
    bins,
    means,
    baseline,
    depth,
    minPhase: centre,
    binSigma,
    snr,
  }
}

/**
 * The signal-to-noise a *wrong* period produces for this dataset.
 *
 * Needed because absolute signal-to-noise is a useless meter on its own. GJ 1214 b is
 * so deep that even a badly detuned fold catches a couple of real transit points in
 * some bin and scores above 12, so an absolute scale pins the meter at full for every
 * period the player tries and tells them nothing. TRAPPIST-1e, twenty times shallower,
 * barely moves the same scale.
 *
 * Folding at a handful of deliberately detuned periods gives the noise floor for this
 * particular star and campaign length. The meter then measures how far above its own
 * background a trial period sits, which is what a periodogram does and what makes the
 * meter mean the same thing on every target.
 *
 * Cheap enough to compute once per (star, nights) and reuse across every drag frame.
 */
export function foldNoiseFloor(
  points: { time: number; flux: number }[],
  sigma: number,
  probes = [1.37, 2.71, 3.94, 5.23, 7.61, 11.3, 17.9],
): number {
  if (points.length === 0) return 1
  const scores = probes.map((p) => foldStats(points, p, sigma).snr).sort((a, b) => a - b)
  const median = scores[Math.floor(scores.length / 2)]
  return Math.max(median, 1)
}

/**
 * Warm/cold score in [0,1] for the fold-quality meter.
 *
 * Measured against this dataset's own noise floor rather than an absolute number, so
 * the meter behaves the same on a 1.4% transit and a 0.5% one. A trial period scoring
 * at the floor reads cold; one scoring three times the floor reads locked on.
 */
export function foldScore(snr: number, noiseFloor: number): number {
  const floor = noiseFloor * 1.15
  const ceiling = noiseFloor * 3
  if (ceiling <= floor) return 0
  return Math.max(0, Math.min(1, (snr - floor) / (ceiling - floor)))
}

/**
 * Signal-to-noise of a detection: how many times deeper the dip is than the
 * uncertainty on the averaged in-transit points.
 *
 * Astronomers do not call a planet real below about 7. The mission uses the same
 * bar, so "I need more nights" is a conclusion the player reaches from the data
 * rather than a rule the interface imposes on them.
 */
export function detectionSNR(depth: number, sigma: number, inTransitPoints: number): number {
  if (inTransitPoints <= 0 || sigma <= 0) return 0
  return depth / (sigma / Math.sqrt(inTransitPoints))
}

/** The SNR at which a signal is considered a confirmed detection. */
export const SNR_THRESHOLD = 7
