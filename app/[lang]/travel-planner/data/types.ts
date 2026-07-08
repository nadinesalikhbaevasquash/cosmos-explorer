// Domain types for the destination knowledge base.

export const ATTRACTION_CATEGORIES = [
  "Landmarks",
  "Museums",
  "Food",
  "Nature",
  "Shopping",
  "Nightlife",
  "Entertainment",
] as const;

export type AttractionCategory = (typeof ATTRACTION_CATEGORIES)[number];

export type Attraction = {
  name: string;
  category: AttractionCategory;
  durationHours: number; // estimated visit duration
  cost: number; // entry / activity cost in USD (0 = free)
  popularity: number; // 1–100, higher = more iconic / visited
};

export type DestinationCosts = {
  hotelPerNight: number; // mid-range hotel, USD
  hostelPerNight: number; // dorm bed, USD
  mealAverage: number; // one typical sit-down meal, USD
  publicTransportPerDay: number; // day pass / typical daily transit, USD
  touristPerDay: number; // observed average tourist spend per day, USD
};

export type Destination = {
  city: string;
  country: string;
  currency: string; // ISO 4217
  costs: DestinationCosts;
  bestMonths: string[]; // short month names, e.g. ["Apr", "May"]
  weatherSummary: string;
  attractions: Attraction[]; // 20 per destination
};
