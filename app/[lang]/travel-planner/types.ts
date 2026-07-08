// Central planner I/O types. Destination knowledge-base types live in
// ./data/types — this file only models planner input and generated output.

import type { AttractionCategory } from "./data/types";

export type TravelStyle = "budget" | "comfort" | "luxury";

// ── Planner input ───────────────────────────────────────────────────────
export type PlanInput = {
  from: string;
  to: string;
  startDate: string; // ISO yyyy-mm-dd
  endDate: string; // ISO yyyy-mm-dd
  budget: number; // total, in USD
  style: TravelStyle;
};

// ── Generated output ────────────────────────────────────────────────────
// One real attraction scheduled into a day.
export type ItineraryItem = {
  name: string;
  category: AttractionCategory;
  durationHours: number;
  cost: number; // USD
};

export type DayPlan = {
  day: number;
  date: string; // ISO yyyy-mm-dd
  title: string;
  items: ItineraryItem[]; // attractions from the knowledge base
  notes: string[]; // lodging / meals / transit framing
  estimatedCost: number; // activities + meals + transit + lodging, USD
};

// A self-contained snapshot of the matched destination, embedded in the plan
// so saved trips survive changes to the underlying database.
export type DestinationInfo = {
  city: string;
  country: string;
  currency: string;
  bestMonths: string[];
  weatherSummary: string;
  estimatedDailyCost: number; // realistic cost for the chosen style, USD
};

export type TravelPlan = {
  from: string;
  to: string;
  startDate: string;
  endDate: string;
  nights: number;
  days: number;
  budget: number;
  suggestedDailyBudget: number; // budget ÷ days
  estimatedTripCost: number; // on-the-ground spend (food + transit + activities)
  withinBudget: boolean;
  costBreakdown: { activities: number; food: number; transport: number } | null;
  style: TravelStyle;
  summary: string;
  destination: DestinationInfo | null; // null when the city isn't in our DB
  itinerary: DayPlan[];
};

// ── Persistence ─────────────────────────────────────────────────────────
export type Trip = {
  id: string;
  name: string;
  input: PlanInput;
  plan: TravelPlan;
  createdAt: number; // epoch ms
  updatedAt: number; // epoch ms
};
