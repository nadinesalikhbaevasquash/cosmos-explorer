import { promises as fs } from "node:fs";
import path from "node:path";
import { getStore } from "@netlify/blobs";

/**
 * Self-hosted traffic counting.
 *
 * Ported from Crossfire, which has been running this in production. Deliberately
 * not Plausible, Google Analytics or anything else: this is a handful of counters,
 * the data never leaves Netlify, there is no third-party script, no cookie, and
 * therefore no consent banner.
 *
 * Extended here with an `events` bucket, because AstraNova already instruments
 * twelve things worth knowing that a pageview cannot tell you — whether anyone
 * finishes the learning path, whether the quiz streak survives a second day,
 * whether anyone ever switches to Uzbek.
 *
 * Storage mirrors lib/store.ts: Netlify Blobs in production because a serverless
 * filesystem is ephemeral, a JSON file for `next dev`. One blob per UTC day, so a
 * busy day can never grow into one unbounded object and a chart only reads the
 * range it needs.
 *
 * Known limitation, fine at this scale: each hit is a read-modify-write of that
 * day's blob, so two landing in the same millisecond can lose a count. AstraNova
 * measures traffic in tens per day. If that stops being true the fix is per-hour
 * shards or a queue, not a lock.
 */

const DATA_DIR = process.env.ASTRANOVA_DATA_DIR || path.join(process.cwd(), ".data");
const BLOB_STORE = "astranova-traffic";

export interface DayStats {
  /** UTC date, YYYY-MM-DD. */
  date: string;
  views: number;
  /** Distinct browsers, each self-reporting its first hit of the day. No
   *  identifier is ever stored server-side. */
  visitors: number;
  paths: Record<string, number>;
  /** Referring hostname, or "direct". */
  referrers: Record<string, number>;
  /** Locale prefix of the page viewed: en, ru or uz. */
  langs: Record<string, number>;
  /** Named events from app/lib/analytics.ts. */
  events: Record<string, number>;
  updatedAt: string;
}

export function emptyDay(date: string): DayStats {
  return {
    date,
    views: 0,
    visitors: 0,
    paths: {},
    referrers: {},
    langs: {},
    events: {},
    updatedAt: "",
  };
}

/** Everything buckets in UTC so numbers do not shift with the reader's timezone. */
export function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function blob() {
  try {
    return getStore(BLOB_STORE, { consistency: "strong" });
  } catch {
    return null; // local `next dev`
  }
}

const fileFor = (date: string) => path.join(DATA_DIR, `traffic-${date}.json`);

async function readDay(date: string): Promise<DayStats> {
  const store = blob();
  if (store) {
    const raw = (await store.get(`day-${date}.json`, { type: "json" })) as DayStats | null;
    // Spread over an empty day so a blob written before `langs`/`events` existed
    // still reads back with every field present.
    return raw ? { ...emptyDay(date), ...raw } : emptyDay(date);
  }
  try {
    const raw = JSON.parse(await fs.readFile(fileFor(date), "utf8")) as DayStats;
    return { ...emptyDay(date), ...raw };
  } catch {
    return emptyDay(date);
  }
}

async function writeDay(day: DayStats): Promise<void> {
  const store = blob();
  if (store) {
    await store.setJSON(`day-${day.date}.json`, day);
    return;
  }
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(fileFor(day.date), JSON.stringify(day, null, 2), "utf8");
}

/** Stop one label becoming a novel: a crafted URL must not be able to bloat the
 *  blob, and one day must not be able to hold unbounded distinct keys. */
const MAX_LABEL = 120;
const MAX_KEYS = 300;

function bump(counter: Record<string, number>, key: string, by = 1) {
  const k = key.slice(0, MAX_LABEL);
  if (counter[k] === undefined && Object.keys(counter).length >= MAX_KEYS) {
    counter["(other)"] = (counter["(other)"] ?? 0) + by;
    return;
  }
  counter[k] = (counter[k] ?? 0) + by;
}

export async function recordHit(hit: {
  path: string;
  referrer: string;
  lang: string;
  firstToday: boolean;
}): Promise<void> {
  const date = todayKey();
  const day = await readDay(date);

  day.views += 1;
  if (hit.firstToday) day.visitors += 1;
  bump(day.paths, hit.path);
  bump(day.referrers, hit.referrer);
  if (hit.lang) bump(day.langs, hit.lang);
  day.updatedAt = new Date().toISOString();

  await writeDay(day);
}

export async function recordEvent(name: string): Promise<void> {
  const date = todayKey();
  const day = await readDay(date);
  bump(day.events, name);
  day.updatedAt = new Date().toISOString();
  await writeDay(day);
}

/** The most recent `days` days, oldest first, gaps filled with zeroes. */
export async function readRange(days: number): Promise<DayStats[]> {
  const keys: string[] = [];
  const now = Date.now();
  for (let i = days - 1; i >= 0; i--) {
    keys.push(new Date(now - i * 86400000).toISOString().slice(0, 10));
  }
  return Promise.all(keys.map(readDay));
}
