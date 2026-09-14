import { NextResponse } from "next/server";
import { recordHit, recordEvent } from "@/app/lib/traffic";

/**
 * The beacon. Handles both pageviews and named events.
 *
 * Fired via sendBeacon, so it must stay cheap and must never fail loudly: a broken
 * counter is not a reason to show anyone an error. Every path returns 204.
 *
 * Only JS-executing browsers reach it, which filters out most crawlers for free.
 * Nothing identifying is accepted or stored: no IP, no user agent, no visitor id.
 * "Distinct visitors" is the browser saying it has not been here yet today, and we
 * take its word for it.
 */

/** Query strings can carry reset tokens and personal data. Never record them. */
function cleanPath(raw: unknown): string | null {
  if (typeof raw !== "string" || !raw.startsWith("/")) return null;
  const p = raw.split(/[?#]/)[0];
  // Nothing to learn from counting our own API and admin traffic.
  if (p.startsWith("/api/") || p.includes("/admin")) return null;
  return p.length > 1 && p.endsWith("/") ? p.slice(0, -1) : p;
}

/** Which language the page was in, taken from the /en, /ru, /uz prefix. */
function langOf(p: string): string {
  const seg = p.split("/")[1];
  return seg === "en" || seg === "ru" || seg === "uz" ? seg : "";
}

/** Strip the locale so /en/quiz and /uz/quiz are one row, not three. */
function unlocalised(p: string): string {
  const seg = p.split("/")[1];
  if (seg === "en" || seg === "ru" || seg === "uz") {
    const rest = p.slice(seg.length + 1);
    return rest || "/";
  }
  return p;
}

const EVENT_RE = /^[a-z_]{3,40}$/;

export async function POST(request: Request) {
  const ok = new NextResponse(null, { status: 204 });

  let body: { path?: unknown; referrer?: unknown; firstToday?: unknown; event?: unknown };
  try {
    body = await request.json();
  } catch {
    return ok;
  }

  try {
    // An event beacon carries a name; a pageview beacon carries a path.
    if (typeof body.event === "string") {
      if (EVENT_RE.test(body.event)) await recordEvent(body.event);
      return ok;
    }

    const path = cleanPath(body.path);
    if (!path) return ok;

    await recordHit({
      path: unlocalised(path),
      referrer: cleanReferrer(body.referrer),
      lang: langOf(path),
      firstToday: body.firstToday === true,
    });
  } catch {
    // Counting is best-effort. Swallow it.
  }

  return ok;
}

/** Hostname only. A full referring URL is more than we need and more than a
 *  visitor expects us to keep. */
function cleanReferrer(raw: unknown): string {
  if (typeof raw !== "string" || !raw) return "direct";
  try {
    const host = new URL(raw).hostname.replace(/^www\./, "");
    return host || "direct";
  } catch {
    return "direct";
  }
}
