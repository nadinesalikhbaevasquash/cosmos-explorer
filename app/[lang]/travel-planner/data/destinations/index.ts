import type { Destination } from "../types";
import { BARCELONA, PARIS, ROME, LONDON, AMSTERDAM } from "./europe";
import { TOKYO, KYOTO, SEOUL, BANGKOK, SINGAPORE, BALI } from "./asia";
import { NEW_YORK, LOS_ANGELES, VANCOUVER } from "./americas";
import { SYDNEY, CAPE_TOWN, DUBAI, ISTANBUL } from "./world";

export const DESTINATIONS: Destination[] = [
  // Europe
  BARCELONA, PARIS, ROME, LONDON, AMSTERDAM,
  // Asia
  TOKYO, KYOTO, SEOUL, BANGKOK, SINGAPORE, BALI,
  // Americas
  NEW_YORK, LOS_ANGELES, VANCOUVER,
  // Rest of world
  SYDNEY, CAPE_TOWN, DUBAI, ISTANBUL,
];

const BY_CITY = new Map(DESTINATIONS.map((d) => [d.city.toLowerCase(), d]));

// Tolerant lookup: case-insensitive, ignores surrounding whitespace, and
// matches when the user types a city plus extra text ("Paris, France").
export function findDestination(query: string): Destination | undefined {
  const q = query.trim().toLowerCase();
  if (!q) return undefined;

  const exact = BY_CITY.get(q);
  if (exact) return exact;

  return DESTINATIONS.find(
    (d) => q.includes(d.city.toLowerCase()) || d.city.toLowerCase().includes(q),
  );
}

export const DESTINATION_CITIES = DESTINATIONS.map((d) => d.city);
