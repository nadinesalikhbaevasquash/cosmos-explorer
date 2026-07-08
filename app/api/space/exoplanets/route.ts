// GET /api/space/exoplanets
// Live data from the NASA Exoplanet Archive (TAP service, no key required).
// Cached for 24h — the archive updates roughly weekly.

const TAP = "https://exoplanetarchive.ipac.caltech.edu/TAP/sync";

async function tapQuery<T>(adql: string): Promise<T | null> {
  try {
    const url = `${TAP}?query=${encodeURIComponent(adql)}&format=json`;
    const res = await fetch(url, {
      next: { revalidate: 86400 },
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

type CountRow = { total: number };
type MethodRow = { discoverymethod: string; n: number };
type PlanetRow = {
  pl_name: string; hostname: string; disc_year: number; discoverymethod: string;
  pl_rade: number | null; pl_bmasse: number | null; pl_orbper: number | null;
  sy_dist: number | null; pl_eqt: number | null;
};

export async function GET() {
  const [totalRows, methodRows, recentRows] = await Promise.all([
    tapQuery<CountRow[]>("select count(*) as total from pscomppars"),
    tapQuery<MethodRow[]>(
      "select discoverymethod, count(*) as n from pscomppars group by discoverymethod order by n desc"
    ),
    tapQuery<PlanetRow[]>(
      "select top 12 pl_name,hostname,disc_year,discoverymethod,pl_rade,pl_bmasse,pl_orbper,sy_dist,pl_eqt " +
      "from pscomppars where pl_rade is not null and sy_dist is not null " +
      "order by disc_year desc, pl_name"
    ),
  ]);

  if (!totalRows && !methodRows && !recentRows) {
    return Response.json({ error: "NASA Exoplanet Archive unavailable" }, { status: 502 });
  }

  return Response.json({
    total: totalRows?.[0]?.total ?? null,
    methods: (methodRows ?? []).slice(0, 4).map((m) => ({ method: m.discoverymethod, count: m.n })),
    recent: (recentRows ?? []).map((p) => ({
      name: p.pl_name,
      host: p.hostname,
      year: p.disc_year,
      method: p.discoverymethod,
      radiusEarths: p.pl_rade,
      massEarths: p.pl_bmasse,
      orbitDays: p.pl_orbper,
      distanceLy: p.sy_dist != null ? Math.round(p.sy_dist * 3.2616) : null,
      tempK: p.pl_eqt != null ? Math.round(p.pl_eqt) : null,
    })),
  });
}
