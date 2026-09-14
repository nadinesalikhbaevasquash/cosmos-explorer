// Levels for the Scale of the Universe zoom-out.
// `size` is the characteristic width/diameter of the object in metres.
// Names, size labels and facts are localized in i18n/*.ts under `scale.items`.
// Images: NASA / ESO / Pablo Carlos Budassi via Wikimedia Commons.
//
// Levels with no photograph use an animated component from SpaceCast instead, so
// the ladder can be filled in without hunting for new imagery.
//
// WHY THE LADDER IS DENSER THAN IT WAS
// ────────────────────────────────────
// It used to hold seven levels whose real gaps were wildly uneven:
//
//   astronaut → ISS            55×
//   ISS       → Earth     117,000×
//   Earth     → Sun           109×
//   Sun       → solar system 6,500×
//   solar sys → Milky Way   1.0e8×
//   Milky Way → universe   926,000×
//
// Seven orders of magnitude separated the smallest jump from the largest, and the
// zoom drew every one of them as the same step. Intermediate levels close the gaps
// so that no single step crosses more than about three decades, which is what makes
// the zoom feel continuous instead of teleporting.

export type ScaleLevel = {
  id: string;
  size: number; // metres
  /** Photograph in /public/scale, where one exists. */
  image?: string;
  /** Key into SpaceCast's ICONS map, for levels with no photograph. */
  cast?: string;
  color: string;
};

export const SCALE_LEVELS: ScaleLevel[] = [
  { id: "astronaut",   size: 2,          image: "/scale/astronaut.jpg",   color: "#e2e8f0" },
  { id: "iss",         size: 109,        image: "/scale/iss.jpg",         color: "#94a3b8" },
  { id: "everest",     size: 8849,       cast: "mountain",                color: "#6ee7b7" },
  { id: "moon",        size: 3.4748e6,   cast: "moon",                    color: "#cbd5e1" },
  { id: "earth",       size: 1.2742e7,   image: "/scale/earth.jpg",       color: "#34d399" },
  { id: "jupiter",     size: 1.39822e8,  cast: "planet",                  color: "#f59e0b" },
  { id: "sun",         size: 1.3927e9,   image: "/scale/sun.jpg",         color: "#e2b43d" },
  { id: "betelgeuse",  size: 1.234e12,   cast: "star",                    color: "#ec8090" },
  { id: "solarSystem", size: 9.09e12,    image: "/scale/solarsystem.jpg", color: "#7e88ec" },
  { id: "lightYear",   size: 9.4607e15,  cast: "comet",                   color: "#76ddea" },
  { id: "orionNebula", size: 2.4e17,     cast: "ufo",                     color: "#f9a8d4" },
  { id: "milkyWay",    size: 9.5e20,     image: "/scale/milkyway.jpg",    color: "#b884ed" },
  { id: "localGroup",  size: 9.5e22,     cast: "galaxy",                  color: "#a78bfa" },
  { id: "universe",    size: 8.8e26,     image: "/scale/universe.jpg",    color: "#76ddea" },
];

/**
 * Fraction of the stage a level fills when it is the focused one.
 *
 * This is the only "visual" constant left. Every other on-screen size is derived
 * from the object's real diameter divided by the current view width, which is what
 * makes the zoom honest: a thing that is a thousandth of the view is drawn a
 * thousandth of the stage, not one fixed step smaller than its neighbour.
 */
export const FOCUS_FILL = 0.8;

/** log10 of the view width, in metres, at which each level is the focused one. */
export const LEVEL_EXP = SCALE_LEVELS.map((l) => Math.log10(l.size / FOCUS_FILL));

export const T_MIN = LEVEL_EXP[0];
export const T_MAX = LEVEL_EXP[LEVEL_EXP.length - 1];
