/**
 * Event instrumentation.
 *
 * Points at AstraNova's own counters (app/lib/traffic.ts, behind /api/hit) rather
 * than a third party. Same decision Crossfire made and for the same reasons: the
 * data never leaves Netlify, there is no external script to load, no cookie, and
 * therefore no consent banner to put in front of a fifteen-year-old.
 *
 * The list below is the point of the file. It is not "everything that can be
 * counted", it is the handful of things worth knowing:
 *
 *   Does anyone start the learning path, and does anyone finish it?
 *   Does the quiz streak survive a second day, or is it dead weight?
 *   Does anyone use the interactive pieces, or only look at them?
 *   Does anyone ever switch to Russian or Uzbek?
 *
 * Read the answers at /[lang]/admin/analytics.
 */

export type AnalyticsEvent =
  | "path_started"
  | "path_stop_completed"
  | "path_completed"
  | "quiz_started"
  | "quiz_completed"
  | "quiz_practice_started"
  | "streak_milestone"
  | "observatory_opened"
  | "observatory_planet_found"
  | "scale_explored"
  | "solar_system_opened"
  | "language_switched";

type Payload = {
  path?: string;
  referrer?: string;
  firstToday?: boolean;
  event?: string;
};

/**
 * Send one beacon, best-effort.
 *
 * sendBeacon because it survives the tab closing mid-navigation, which is exactly
 * when the most interesting events fire. fetch with keepalive is the fallback.
 * Never throws: a failed counter must not be able to break a page.
 */
export function beacon(payload: Payload): void {
  if (typeof window === "undefined") return;

  const body = JSON.stringify(payload);
  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/hit", new Blob([body], { type: "application/json" }));
      return;
    }
    void fetch("/api/hit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* counting is never worth an exception */
  }
}

/**
 * Record a named event.
 *
 * Properties are deliberately not sent. Crossfire's counters store one number per
 * name, and keeping the same shape means one dashboard reads both sites. Anything
 * needing a breakdown gets its own event name instead.
 */
export function track(event: AnalyticsEvent, _props?: Record<string, unknown>): void {
  beacon({ event });
}
