/**
 * The survey field for Mission 1.
 *
 * Every star here is a real star, and every planet here is a real planet with its
 * published parameters. Nothing is invented, because the payoff at the end of the
 * mission is telling the player that the thing they just found is real and they can
 * go look it up. That only lands if it is true.
 *
 * Where the simulation does compress reality, it compresses *time*, not physics:
 * Kepler stared at its field for four years, and this mission gives the player 45
 * nights. So the field is stocked with short-period planets that a 45-night campaign
 * could genuinely recover, rather than pretending a 300-day orbit is findable in six
 * weeks. The "how do we know" panel on the results screen says exactly this.
 *
 * Magnitudes are near-infrared (J band). Small red stars are far brighter in the
 * infrared than in visible light, which is how they are actually observed, and using
 * V band would make TRAPPIST-1 look impossibly faint.
 */

import { habitableZone, luminosityFromMass, transitDepth } from './physics'

export type Planet = {
  /** Published name, revealed only once the player confirms the detection. */
  name: string
  /** Planet radius in Earth radii. */
  radiusEarth: number
  /** Orbital period in days. */
  periodDays: number
  /** Time of first mid-transit, in days from the campaign start. */
  epochDays: number
  /** Bond albedo used for the equilibrium temperature. 0.3 is Earth-like. */
  albedo: number
  /** One-line note shown after characterisation. */
  note: string
}

export type Star = {
  id: string
  /** Catalogue name shown in the sky field. */
  name: string
  /** Spectral type, the clue the player uses to justify the assumed mass. */
  spectralType: string
  /** Stellar mass in solar masses. */
  massSun: number
  /** Stellar radius in solar radii. */
  radiusSun: number
  /** Effective surface temperature in kelvin. */
  tempK: number
  /** Bolometric luminosity in solar luminosities, measured rather than derived. */
  luminositySun: number
  /** Apparent J-band magnitude. Drives photometric noise. */
  magnitude: number
  /** Distance in light years, flavour for the sky field. */
  distanceLy: number
  /** Colour used to draw the star, roughly matched to its temperature. */
  colour: string
  /** The transiting planet, if this star has one. */
  planet?: Planet
  /** A rotating starspot that mimics a periodic signal, if this star has one. */
  starspot?: { rotationDays: number; amplitude: number; epochDays: number }
  /** Shown in the target briefing before the player commits nights. */
  blurb: string
}

/**
 * Luminosity is stored per star rather than computed from mass. The mass-luminosity
 * relation L ∝ M^3.5 is a decent rule of thumb but it is genuinely wrong for the
 * smallest red dwarfs: it puts TRAPPIST-1 at about 2.2e-4 solar luminosities when
 * the measured value is 5.5e-4, a factor of 2.5. Since the habitable zone scales as
 * sqrt(L), that error would move the zone by 60% and drop the mission's answer
 * straight out of it. Measured values in, derived values only where honest.
 */
export const STARS: Star[] = [
  {
    id: 'trappist-1',
    name: 'TRAPPIST-1',
    spectralType: 'M8V',
    massSun: 0.0898,
    radiusSun: 0.1192,
    tempK: 2566,
    luminositySun: 0.000553,
    magnitude: 11.35,
    distanceLy: 40.7,
    colour: '#ff6b4a',
    blurb: 'An ultra-cool red dwarf, barely larger than Jupiter. Small stars make transits deep.',
    planet: {
      name: 'TRAPPIST-1e',
      radiusEarth: 0.92,
      periodDays: 6.101,
      epochDays: 2.4,
      albedo: 0.3,
      note: 'Rocky, almost exactly Earth-sized, and squarely inside the habitable zone. One of the most promising targets known.',
    },
  },
  {
    id: 'hd-219134',
    name: 'HD 219134',
    spectralType: 'K3V',
    massSun: 0.794,
    radiusSun: 0.778,
    tempK: 4699,
    luminositySun: 0.2645,
    magnitude: 3.98,
    distanceLy: 21.3,
    colour: '#ffc98b',
    blurb: 'A bright orange dwarf, naked-eye visible. Bright stars give clean photometry.',
    planet: {
      name: 'HD 219134 b',
      radiusEarth: 1.602,
      periodDays: 3.0929,
      epochDays: 1.1,
      albedo: 0.3,
      note: 'A dense super-Earth orbiting eight times closer than Mercury. Its surface is hot enough to melt rock.',
    },
  },
  {
    id: 'gj-1214',
    name: 'GJ 1214',
    spectralType: 'M4.5V',
    massSun: 0.181,
    radiusSun: 0.215,
    tempK: 3250,
    luminositySun: 0.00351,
    magnitude: 9.75,
    distanceLy: 47.5,
    colour: '#ff8c5a',
    blurb: 'A quiet red dwarf. Its planet was one of the first small worlds ever studied in detail.',
    planet: {
      name: 'GJ 1214 b',
      radiusEarth: 2.742,
      periodDays: 1.58040,
      epochDays: 0.6,
      albedo: 0.3,
      note: 'A mini-Neptune wrapped in thick, hazy atmosphere. Too close to its star for liquid water anywhere on it.',
    },
  },
  {
    id: 'gj-1243',
    name: 'GJ 1243',
    spectralType: 'M4V',
    massSun: 0.24,
    radiusSun: 0.239,
    tempK: 3300,
    luminositySun: 0.00612,
    magnitude: 8.61,
    distanceLy: 39.9,
    colour: '#ff9a68',
    blurb: 'A young, fast-spinning red dwarf. Known to be heavily spotted.',
    // No planet. A huge starspot rotates in and out of view every 14 hours, producing
    // a periodic dimming that a period search will happily lock onto. The give-away is
    // the shape: smooth and rounded, never flat-bottomed. This is the trap, and it is
    // the single most educational object in the field.
    starspot: { rotationDays: 0.5927, amplitude: 0.011, epochDays: 0.2 },
  },
  {
    id: 'barnards-star',
    name: "Barnard's Star",
    spectralType: 'M4V',
    massSun: 0.162,
    radiusSun: 0.196,
    tempK: 3134,
    luminositySun: 0.0035,
    magnitude: 5.24,
    distanceLy: 5.96,
    colour: '#ff8f5c',
    blurb: 'The fastest-moving star in our sky, and the closest single star to the Sun.',
  },
  {
    id: 'ross-128',
    name: 'Ross 128',
    spectralType: 'M4V',
    massSun: 0.168,
    radiusSun: 0.1967,
    tempK: 3192,
    luminositySun: 0.00362,
    magnitude: 6.51,
    distanceLy: 11.0,
    colour: '#ff915e',
    blurb: 'An unusually quiet red dwarf, rarely flaring.',
  },
  {
    id: 'wolf-359',
    name: 'Wolf 359',
    spectralType: 'M6V',
    massSun: 0.11,
    radiusSun: 0.144,
    tempK: 2800,
    luminositySun: 0.0014,
    magnitude: 7.09,
    distanceLy: 7.86,
    colour: '#ff7a4f',
    blurb: 'One of the faintest and lowest-mass stars known in our neighbourhood.',
  },
  {
    id: 'lacaille-9352',
    name: 'Lacaille 9352',
    spectralType: 'M0.5V',
    massSun: 0.479,
    radiusSun: 0.474,
    tempK: 3692,
    luminositySun: 0.0367,
    magnitude: 5.32,
    distanceLy: 10.7,
    colour: '#ffab74',
    blurb: 'A stable red dwarf, long used as a photometric reference star.',
  },
  {
    id: 'luytens-star',
    name: "Luyten's Star",
    spectralType: 'M3.5V',
    massSun: 0.26,
    radiusSun: 0.35,
    tempK: 3150,
    luminositySun: 0.0132,
    magnitude: 5.70,
    distanceLy: 12.2,
    colour: '#ff9060',
    blurb: 'A nearby red dwarf with known non-transiting companions.',
  },
  {
    id: 'lalande-21185',
    name: 'Lalande 21185',
    spectralType: 'M2V',
    massSun: 0.39,
    radiusSun: 0.393,
    tempK: 3547,
    luminositySun: 0.0195,
    magnitude: 4.20,
    distanceLy: 8.31,
    colour: '#ffa06b',
    blurb: 'The brightest red dwarf in the northern sky.',
  },
  {
    id: 'epsilon-eridani',
    name: 'Epsilon Eridani',
    spectralType: 'K2V',
    massSun: 0.82,
    radiusSun: 0.735,
    tempK: 5084,
    luminositySun: 0.32,
    magnitude: 1.88,
    distanceLy: 10.5,
    colour: '#ffd9a3',
    blurb: 'A young orange dwarf with a dusty debris disc. Its known planet does not transit.',
  },
  {
    id: '61-cygni-a',
    name: '61 Cygni A',
    spectralType: 'K5V',
    massSun: 0.70,
    radiusSun: 0.665,
    tempK: 4374,
    luminositySun: 0.153,
    magnitude: 3.10,
    distanceLy: 11.4,
    colour: '#ffc590',
    blurb: 'The first star ever to have its distance measured, by Bessel in 1838.',
  },
]

/** Nights available for the whole campaign. */
export const TOTAL_NIGHTS = 45

/** Photometric samples taken per night of continuous monitoring (10-minute cadence). */
export const POINTS_PER_NIGHT = 144

/** The star the mission is built around. */
export const TARGET_STAR_ID = 'trappist-1'

export function getStar(id: string): Star | undefined {
  return STARS.find((s) => s.id === id)
}

/** Depth this star's planet would produce, or 0 for a starless star. */
export function starPlanetDepth(star: Star): number {
  if (!star.planet) return 0
  return transitDepth(star.planet.radiusEarth, star.radiusSun)
}

/** Habitable zone bounds in AU, from the star's measured luminosity. */
export function starHabitableZone(star: Star) {
  return habitableZone(star.luminositySun)
}

/**
 * The habitable zone the mass-luminosity shortcut would have predicted.
 *
 * Used by the "how do we know" panel to show the player why astronomers insist on
 * measuring a star's brightness instead of guessing it from its mass.
 */
export function estimatedHabitableZone(star: Star) {
  return habitableZone(luminosityFromMass(star.massSun))
}
