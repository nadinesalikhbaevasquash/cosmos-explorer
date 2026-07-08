// Travel planner engine. Builds a day-by-day itinerary from the destination
// knowledge base: real attractions packed by popularity and visit duration,
// with day costs derived from the destination's actual lodging / meal /
// transit figures. Falls back to a generic plan for unknown cities.

import type {
  DayPlan,
  ItineraryItem,
  PlanInput,
  TravelPlan,
  TravelStyle,
} from "./types";
import type { Attraction, Destination } from "./data/types";
import { findDestination } from "./data/destinations";

type StyleModel = {
  label: string;
  blurb: string;
  lodging: (c: Destination["costs"]) => number; // per night
  mealMultiplier: number; // vs. the destination's average meal price
  mealsPerDay: number;
  transitMultiplier: number;
  activityHoursPerDay: number; // sightseeing pace
};

export const STYLE_META: Record<TravelStyle, StyleModel> = {
  budget: {
    label: "Budget",
    blurb: "Hostels, street food, public transit, free and low-cost sights.",
    lodging: (c) => c.hostelPerNight,
    mealMultiplier: 0.8,
    mealsPerDay: 2,
    transitMultiplier: 1,
    activityHoursPerDay: 7,
  },
  comfort: {
    label: "Comfort",
    blurb: "Mid-range hotels, sit-down restaurants, a relaxed sightseeing pace.",
    lodging: (c) => c.hotelPerNight,
    mealMultiplier: 1,
    mealsPerDay: 3,
    transitMultiplier: 1,
    activityHoursPerDay: 6,
  },
  luxury: {
    label: "Luxury",
    blurb: "Top hotels, fine dining, taxis over transit, fewer things done well.",
    lodging: (c) => Math.round(c.hotelPerNight * 2.2),
    mealMultiplier: 2.2,
    mealsPerDay: 3,
    transitMultiplier: 2.5,
    activityHoursPerDay: 5,
  },
};

function daysBetween(start: string, end: string): number {
  const a = new Date(start + "T00:00:00");
  const b = new Date(end + "T00:00:00");
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

function addDays(start: string, n: number): string {
  // Do the arithmetic in UTC so the formatted yyyy-mm-dd can't drift across a
  // day boundary in non-UTC timezones (local midnight + toISOString would).
  const [y, m, d] = start.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + n);
  return dt.toISOString().slice(0, 10);
}

export type PlanResult =
  | { ok: true; plan: TravelPlan }
  | { ok: false; error: string };

// Spread the destination's attractions across the trip, most iconic first,
// respecting a per-day time budget and avoiding three-of-a-kind categories.
function packAttractions(
  attractions: Attraction[],
  days: number,
  hoursPerDay: number,
): Attraction[][] {
  const pool = [...attractions].sort((a, b) => b.popularity - a.popularity);
  const used = new Array(pool.length).fill(false);
  const perDay: Attraction[][] = [];

  for (let i = 0; i < days; i++) {
    const isArrival = i === 0;
    const isDeparture = i === days - 1 && days > 1;
    // Lighter sightseeing on travel days.
    const target = isArrival || isDeparture ? Math.max(2, hoursPerDay * 0.5) : hoursPerDay;

    const items: Attraction[] = [];
    const catCount: Record<string, number> = {};
    let hours = 0;

    while (true) {
      let pick = -1;
      for (let j = 0; j < pool.length; j++) {
        if (used[j]) continue;
        const a = pool[j];
        if ((catCount[a.category] ?? 0) >= 2) continue; // variety cap
        if (items.length > 0 && hours + a.durationHours > target) continue;
        pick = j;
        break;
      }
      if (pick === -1) break;
      const a = pool[pick];
      used[pick] = true;
      items.push(a);
      catCount[a.category] = (catCount[a.category] ?? 0) + 1;
      hours += a.durationHours;
    }
    perDay.push(items);
  }
  return perDay;
}

function buildDay(
  dayIndex: number,
  days: number,
  date: string,
  picks: Attraction[],
  dest: Destination,
  style: StyleModel,
): DayPlan {
  const c = dest.costs;
  const isArrival = dayIndex === 0;
  const isDeparture = dayIndex === days - 1 && days > 1;

  const items: ItineraryItem[] = picks.map((a) => ({
    name: a.name,
    category: a.category,
    durationHours: a.durationHours,
    cost: a.cost,
  }));

  const activitiesCost = items.reduce((sum, it) => sum + it.cost, 0);
  const meals = Math.round(c.mealAverage * style.mealsPerDay * style.mealMultiplier);
  const transit = Math.round(c.publicTransportPerDay * style.transitMultiplier);
  // On-the-ground spend for the day. Accommodation is budgeted at trip level so
  // it can flex with the traveller's total budget.
  const estimatedCost = meals + transit + activitiesCost;

  const notes: string[] = [];
  if (isArrival) notes.push("Arrive and settle in");
  notes.push(`${style.mealsPerDay} meals ~$${meals}`);
  notes.push(`Local transit ~$${transit}`);
  if (isDeparture) notes.push("Check out and head to the airport");
  if (!isArrival && !isDeparture && items.length === 0) {
    notes.push("Free day — relax, revisit a favourite, or take an optional day trip");
  }

  let title: string;
  if (isArrival) title = `Arrive in ${dest.city}`;
  else if (isDeparture) title = items.length ? `${dest.city}: last sights & departure` : "Departure day";
  else if (items.length) title = items.length > 1 ? `${items[0].name} & more` : items[0].name;
  else title = `Leisure day in ${dest.city}`;

  return { day: dayIndex + 1, date, title, items, notes, estimatedCost };
}

// Generic fallback for cities outside the knowledge base.
function buildGenericDay(dayIndex: number, days: number, date: string, dailyBudget: number, city: string): DayPlan {
  const isArrival = dayIndex === 0;
  const isDeparture = dayIndex === days - 1 && days > 1;
  const title = isArrival ? `Arrive in ${city}` : isDeparture ? "Departure day" : `Explore ${city}`;
  return {
    day: dayIndex + 1,
    date,
    title,
    items: [],
    notes: [
      `${city} isn't in our destination guide yet — this is a budget-based outline`,
      `Plan around ~$${dailyBudget} for the day`,
    ],
    estimatedCost: dailyBudget,
  };
}

export function generatePlan(input: PlanInput): PlanResult {
  const { from, to, startDate, endDate, budget, style } = input;

  if (!from.trim() || !to.trim()) {
    return { ok: false, error: "Please enter both a departure and destination city." };
  }
  if (!startDate || !endDate) {
    return { ok: false, error: "Please select both a start and end date." };
  }

  const nights = daysBetween(startDate, endDate);
  if (Number.isNaN(nights) || nights < 0) {
    return { ok: false, error: "Your end date must be on or after your start date." };
  }
  if (!budget || budget <= 0) {
    return { ok: false, error: "Please enter a budget greater than 0." };
  }

  const days = nights + 1; // inclusive of arrival & departure day
  const model = STYLE_META[style];
  const dest = findDestination(to);
  const suggestedDailyBudget = Math.round(budget / days);

  let itinerary: DayPlan[];
  if (dest) {
    const packed = packAttractions(dest.attractions, days, model.activityHoursPerDay);
    itinerary = packed.map((picks, i) =>
      buildDay(i, days, addDays(startDate, i), picks, dest, model),
    );
  } else {
    itinerary = Array.from({ length: days }, (_, i) =>
      buildGenericDay(i, days, addDays(startDate, i), suggestedDailyBudget, to.trim()),
    );
  }

  const estimatedTripCost = itinerary.reduce((sum, d) => sum + d.estimatedCost, 0);
  const estimatedDailyCost = Math.round(estimatedTripCost / days);

  // On-the-ground spend, split for the budget breakdown (excludes flights and
  // accommodation, which are budget-driven / pending live prices).
  const costBreakdown = dest
    ? {
        activities: itinerary.reduce((s, d) => s + d.items.reduce((a, it) => a + it.cost, 0), 0),
        food: days * Math.round(dest.costs.mealAverage * model.mealsPerDay * model.mealMultiplier),
        transport: days * Math.round(dest.costs.publicTransportPerDay * model.transitMultiplier),
      }
    : null;

  const plan: TravelPlan = {
    from: from.trim(),
    to: to.trim(),
    startDate,
    endDate,
    nights,
    days,
    budget,
    suggestedDailyBudget,
    estimatedTripCost,
    withinBudget: estimatedTripCost <= budget,
    costBreakdown,
    style,
    summary: dest
      ? `A ${days}-day ${model.label.toLowerCase()} trip from ${from.trim()} to ${dest.city}, ${dest.country}.`
      : `A ${days}-day ${model.label.toLowerCase()} trip from ${from.trim()} to ${to.trim()}.`,
    destination: dest
      ? {
          city: dest.city,
          country: dest.country,
          currency: dest.currency,
          bestMonths: dest.bestMonths,
          weatherSummary: dest.weatherSummary,
          estimatedDailyCost,
        }
      : null,
    itinerary,
  };

  return { ok: true, plan };
}
