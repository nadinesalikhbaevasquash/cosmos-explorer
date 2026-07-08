// GET /api/travel/place?titles=Senso-ji Temple|Shibuya Crossing|...
// Real descriptions + images (Wikipedia) for itinerary attractions, batched.
// Returns a map keyed by the original label.

import { fetchWikiSummaries } from "../wiki";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const raw = searchParams.get("titles") ?? "";
  const titles = raw.split("|").map((t) => t.trim()).filter(Boolean);
  if (titles.length === 0) return Response.json({});

  const map = await fetchWikiSummaries(titles.slice(0, 40));
  return Response.json(map);
}
