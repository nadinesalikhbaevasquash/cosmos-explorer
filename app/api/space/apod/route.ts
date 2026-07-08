// GET /api/space/apod
// NASA Astronomy Picture of the Day. Works with DEMO_KEY thanks to the 1h
// server-side cache (~24 upstream requests/day); set NASA_API_KEY for headroom.

export async function GET() {
  const key = process.env.NASA_API_KEY || "DEMO_KEY";
  try {
    const res = await fetch(
      `https://api.nasa.gov/planetary/apod?api_key=${key}&thumbs=true`,
      { next: { revalidate: 3600 }, headers: { Accept: "application/json" } }
    );
    if (!res.ok) return Response.json({ error: "APOD unavailable" }, { status: 502 });
    const d = await res.json();
    const image =
      d.media_type === "image" ? (d.url ?? d.hdurl ?? null) : (d.thumbnail_url ?? null);
    return Response.json({
      title: d.title ?? null,
      date: d.date ?? null,
      explanation: d.explanation ?? null,
      image,
      mediaType: d.media_type ?? "image",
      copyright: typeof d.copyright === "string" ? d.copyright.trim() : null,
      link: "https://apod.nasa.gov/apod/astropix.html",
    });
  } catch {
    return Response.json({ error: "APOD unavailable" }, { status: 502 });
  }
}
