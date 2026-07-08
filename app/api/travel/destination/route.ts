// GET /api/travel/destination?city=Tokyo
// Real description + image (Wikipedia) and real current weather (Open-Meteo).

import { fetchWikiSummaries } from "../wiki";
import { fetchCityWeather } from "../weather";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get("city")?.trim();
  if (!city) return Response.json({ error: "Missing city" }, { status: 400 });

  const [wiki, weather] = await Promise.all([fetchWikiSummaries([city]), fetchCityWeather(city)]);
  const summary = wiki[city];

  return Response.json({
    city,
    description: summary?.description ?? null,
    image: summary?.image ?? null,
    url: summary?.url ?? null,
    weather, // { tempC, text, emoji, country, timezone } | null
  });
}
