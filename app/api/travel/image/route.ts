// GET /api/travel/image?url=<wikimedia url>
// Streams a Wikimedia image through our origin so the browser never has to
// reach upload.wikimedia.org directly (some networks block it, which made
// images silently fail while server-fetched text still worked). Host-allowlisted
// to avoid being an open proxy / SSRF.

const ALLOWED_HOSTS = new Set(["upload.wikimedia.org"]);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");
  if (!url) return new Response("Missing url", { status: 400 });

  let target: URL;
  try {
    target = new URL(url);
  } catch {
    return new Response("Invalid url", { status: 400 });
  }
  if (target.protocol !== "https:" || !ALLOWED_HOSTS.has(target.hostname)) {
    return new Response("Forbidden host", { status: 403 });
  }

  const upstream = await fetch(target.toString(), {
    headers: { "User-Agent": "VoyageTravelPlanner/1.0 (https://example.com; travel planner)" },
    next: { revalidate: 604800 }, // 7 days
  });
  if (!upstream.ok || !upstream.body) {
    return new Response("Upstream error", { status: 502 });
  }

  return new Response(upstream.body, {
    headers: {
      "Content-Type": upstream.headers.get("content-type") ?? "image/jpeg",
      "Cache-Control": "public, max-age=604800, immutable",
    },
  });
}
