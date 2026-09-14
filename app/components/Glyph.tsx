"use client";

/**
 * Emoji shim.
 *
 * The site had emoji scattered through data files and locale strings, which made
 * them awkward to remove one by one: they are values, not markup. This maps each
 * one to its animated counterpart at render time, so a data file can keep saying
 * "🚀" while the page draws the real thing.
 *
 * Anything unmapped falls through to the original character rather than vanishing,
 * so adding a new item to a data file can never render an empty box.
 */

import {
  Astronaut, BlackHole, Car, Comet, EarthGlobe, Galaxy, Jet, Magnifier, Moon,
  Mountain, Planet, Rocket, Satellite, SunStar, Target, Telescope, Ufo, Walker,
} from "@/app/components/SpaceCast";

type Icon = (p: { className?: string }) => React.ReactElement;

const MAP: Record<string, Icon> = {
  // space
  "🔭": Telescope, "🚀": Rocket, "🛰️": Satellite, "📡": Satellite,
  "🪐": Planet, "🟠": Planet, "🟡": Planet, "🔴": Planet, "🔵": Planet,
  "⚪": Planet, "💫": Planet, "🌑": Moon, "🌕": Moon, "🌙": Moon,
  "⭐": SunStar, "🌟": SunStar, "☀️": SunStar, "✨": Comet, "☄️": Comet,
  "🌌": Galaxy, "🕳️": BlackHole, "⚫": BlackHole, "🌍": EarthGlobe,
  "🌎": EarthGlobe, "🌏": EarthGlobe, "👨‍🚀": Astronaut, "🧑‍🚀": Astronaut,
  "🛸": Ufo, "🏔️": Mountain, "⛰️": Mountain,
  // tools
  "🔍": Magnifier, "🔎": Magnifier, "🎯": Target, "🧠": Target,
  // travel
  "🚶": Walker, "🚗": Car, "✈️": Jet, "🧭": Magnifier, "📍": Target,
};

export default function Glyph({
  emoji,
  className = "h-8 w-8",
}: {
  emoji: string | undefined;
  className?: string;
}) {
  if (!emoji) return null;
  const Icon = MAP[emoji] ?? MAP[emoji.replace("️", "")];
  if (!Icon) return <span className={className}>{emoji}</span>;
  return <Icon className={className} />;
}
