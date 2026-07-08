// Server-only: real descriptions + images from the MediaWiki (Wikipedia) API.
// Keyless. Images are Wikimedia-hosted (already whitelisted in next.config.ts).

export type WikiSummary = { title: string; description: string; image: string | null; url: string };

const WIKI_API = "https://en.wikipedia.org/w/api.php";
const UA = "VoyageTravelPlanner/1.0 (https://example.com; travel planner demo)";

// A few destinations/attractions whose plain name is ambiguous on Wikipedia.
const TITLE_OVERRIDES: Record<string, string> = {
  "New York": "New York City",
  Bali: "Bali",
};

// Reduce an itinerary label to something Wikipedia is likely to have an article for.
export function cleanTitle(raw: string): string {
  if (TITLE_OVERRIDES[raw]) return TITLE_OVERRIDES[raw];
  let t = raw.split(/[,(]/)[0]; // drop ", Asakusa" / "(FC Barcelona)"
  t = t.split(/\s+&\s+/)[0]; // drop "… & more"
  t = t
    .replace(/\b(walk|tour|crawl|cruise|experience|day trip|class|hike|ride|show|evening|tasting|night scene|sunrise|sundowner|hopping)\b.*$/i, "")
    .trim();
  return t || raw.trim();
}

async function wikiBatch(titles: string[]): Promise<Record<string, WikiSummary>> {
  if (titles.length === 0) return {};
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    formatversion: "2",
    prop: "extracts|pageimages",
    exintro: "1",
    explaintext: "1",
    exsentences: "2",
    exlimit: "20",
    piprop: "thumbnail",
    pithumbsize: "640",
    pilimit: "20",
    redirects: "1",
    titles: titles.join("|"),
  });

  const res = await fetch(`${WIKI_API}?${params}`, {
    headers: { "User-Agent": UA },
    next: { revalidate: 86400 },
  });
  if (!res.ok) return {};
  const data = await res.json();

  const normalized: Record<string, string> = {};
  for (const n of data?.query?.normalized ?? []) normalized[n.from] = n.to;
  const redirects: Record<string, string> = {};
  for (const r of data?.query?.redirects ?? []) redirects[r.from] = r.to;
  const pageByTitle: Record<string, { title: string; extract?: string; missing?: boolean; thumbnail?: { source: string } }> = {};
  for (const p of data?.query?.pages ?? []) pageByTitle[p.title] = p;

  const out: Record<string, WikiSummary> = {};
  for (const requested of titles) {
    const resolvedTitle = redirects[normalized[requested] ?? requested] ?? normalized[requested] ?? requested;
    const page = pageByTitle[resolvedTitle];
    if (!page || page.missing || !page.extract) continue;
    // Skip disambiguation pages — they have no real image and useless text;
    // let them fall through to the search pass (with city context) instead.
    if (isDisambiguation(page.extract, page.title)) continue;
    out[requested] = {
      title: page.title,
      description: page.extract,
      image: page.thumbnail?.source ?? null,
      url: `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title.replace(/ /g, "_"))}`,
    };
  }
  return out;
}

// Disambiguation / non-article pages carry no usable image or description.
function isDisambiguation(extract: string, title: string): boolean {
  return (
    title.includes("(disambiguation)") ||
    /\b(may refer to|commonly refers to|refers to:|is the name of|is french for|is a surname|is a given name)\b/i.test(
      extract.slice(0, 120),
    )
  );
}

// Run async work with bounded concurrency so we never burst Wikipedia (which
// throttles, turning every photo blank).
async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await fn(items[idx]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}

// Fallback for exact-title misses: full-text search and take the top article.
// Resolves macrons / alternate names ("Senso-ji Temple" → "Sensō-ji") and uses
// the city as context to skip disambiguation pages ("Notre-Dame" → cathedral).
async function searchWiki(query: string, context?: string): Promise<WikiSummary | null> {
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    formatversion: "2",
    generator: "search",
    gsrsearch: context ? `${query} ${context}` : query,
    gsrlimit: "1",
    gsrnamespace: "0",
    prop: "extracts|pageimages",
    exintro: "1",
    explaintext: "1",
    exsentences: "2",
    piprop: "thumbnail",
    pithumbsize: "640",
  });
  const res = await fetch(`${WIKI_API}?${params}`, { headers: { "User-Agent": UA }, next: { revalidate: 86400 } });
  if (!res.ok) return null;
  const data = await res.json();
  const page = data?.query?.pages?.[0];
  if (!page || !page.extract || isDisambiguation(page.extract, page.title)) return null;
  return {
    title: page.title,
    description: page.extract,
    image: page.thumbnail?.source ?? null,
    url: `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title.replace(/ /g, "_"))}`,
  };
}

// Public: fetch summaries for arbitrary labels, keyed by the ORIGINAL label so
// callers can match results back to their itinerary items.
export async function fetchWikiSummaries(labels: string[]): Promise<Record<string, WikiSummary | null>> {
  const pairs = labels.map((label) => ({ label, clean: cleanTitle(label) }));
  const uniqueClean = [...new Set(pairs.map((p) => p.clean))];

  // exlimit caps at 20 titles per request — chunk to stay within it.
  const chunks: string[][] = [];
  for (let i = 0; i < uniqueClean.length; i += 20) chunks.push(uniqueClean.slice(i, i + 20));
  const results = await Promise.all(chunks.map(wikiBatch));
  const byClean: Record<string, WikiSummary> = Object.assign({}, ...results);

  // Second pass: full-text search for anything the exact-title batch missed.
  const misses = uniqueClean.filter((c) => !byClean[c]);
  const searched = await Promise.all(misses.map((c) => searchWiki(c).then((r) => [c, r] as const)));
  for (const [clean, summary] of searched) if (summary) byClean[clean] = summary;

  const out: Record<string, WikiSummary | null> = {};
  for (const { label, clean } of pairs) out[label] = byClean[clean] ?? null;
  return out;
}
