// Presentation helpers: imagery, landmark glyphs, and cost tiers. The editorial
// palette (cream / sage / rose) is applied uniformly in the UI, so destinations
// no longer carry their own accent colour — only an emoji and a photo.

import type { Attraction, Destination } from "./data/types";

const EMOJI: Record<string, string> = {
  Barcelona: "🏛️", Paris: "🗼", Rome: "🏟️", London: "🎡", Amsterdam: "🚲",
  Tokyo: "🗼", Kyoto: "⛩️", Seoul: "🏯", Bangkok: "🛕", Singapore: "🌆", Bali: "🌴",
  "New York": "🗽", "Los Angeles": "🌴", Vancouver: "🏔️", Sydney: "🌊",
  "Cape Town": "🏔️", Dubai: "🏜️", Istanbul: "🕌",
};

export function cityEmoji(city: string): string {
  return EMOJI[city] ?? "🌍";
}

// Stable per-city seed so the same photo is shown each visit.
function hashCity(city: string): number {
  let h = 0;
  for (let i = 0; i < city.length; i++) h = (h * 31 + city.charCodeAt(i)) >>> 0;
  return h % 1000;
}

// Keyword photo, no API key required. A solid sand placeholder sits beneath, so
// the layout still reads cleanly if the image fails to load.
export function cityImage(city: string, w = 1200, h = 800): string {
  const tag = city.toLowerCase().replace(/\s+/g, "");
  return `https://loremflickr.com/${w}/${h}/${tag},cityscape?lock=${hashCity(city)}`;
}

export type CostLevel = { tier: 1 | 2 | 3; label: string; symbol: string };

export function costLevel(touristPerDay: number): CostLevel {
  if (touristPerDay <= 90) return { tier: 1, label: "Affordable", symbol: "$" };
  if (touristPerDay <= 160) return { tier: 2, label: "Moderate", symbol: "$$" };
  return { tier: 3, label: "Premium", symbol: "$$$" };
}

export function topHighlights(dest: Destination, n = 4): Attraction[] {
  return [...dest.attractions].sort((a, b) => b.popularity - a.popularity).slice(0, n);
}
