// Levels for the Scale of the Universe zoom-out.
// `size` is the characteristic width/height of the object in metres.
// Names, size labels and facts are localized in i18n/*.ts under `scale.items`.
// Images: NASA / ESO / Pablo Carlos Budassi via Wikimedia Commons.

export type ScaleLevel = {
  id: string;
  size: number; // metres
  image: string;
  color: string;
};

export const SCALE_LEVELS: ScaleLevel[] = [
  { id: "astronaut",   size: 2,        image: "/scale/astronaut.jpg",   color: "#e2e8f0" },
  { id: "iss",         size: 109,      image: "/scale/iss.jpg",         color: "#94a3b8" },
  { id: "earth",       size: 1.2742e7, image: "/scale/earth.jpg",       color: "#34d399" },
  { id: "sun",         size: 1.3927e9, image: "/scale/sun.jpg",         color: "#fbbf24" },
  { id: "solarSystem", size: 9.09e12,  image: "/scale/solarsystem.jpg", color: "#818cf8" },
  { id: "milkyWay",    size: 9.5e20,   image: "/scale/milkyway.jpg",    color: "#c084fc" },
  { id: "universe",    size: 8.8e26,   image: "/scale/universe.jpg",    color: "#67e8f9" },
];

// Visual zoom factor between adjacent levels: when a level fills the stage,
// the previous one appears 1/ZOOM_STEP of its size at the centre.
export const ZOOM_STEP = 14;
