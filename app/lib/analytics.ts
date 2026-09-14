/**
 * Event instrumentation.
 *
 * The site currently answers no questions about itself: nobody knows whether people
 * finish the learning path, come back for a second quiz, or bounce off the hero.
 * Every design decision so far, mine included, has been a guess.
 *
 * This is the measuring layer, not a provider. It defines *what* is worth counting
 * and gives one call site for it. Until a provider is configured it is a genuine
 * no-op: no network calls, no fake dashboard, no invented numbers.
 *
 * TO TURN IT ON
 * ─────────────
 * Both options are privacy-friendly, cookieless, and need no consent banner.
 *
 *   Plausible  add to app/layout.tsx <head>:
 *              <script defer data-domain="astranova.uz"
 *                      src="https://plausible.io/js/script.js" />
 *
 *   Umami      self-hostable and free:
 *              <script defer data-website-id="..."
 *                      src="https://cloud.umami.is/script.js" />
 *
 * Both expose a global that `track()` below already looks for, so no other file
 * needs to change. Netlify Analytics is a third option and needs no code at all,
 * but it is server-side only, so it cannot see any of the events here.
 */

/** The things actually worth knowing, rather than everything that can be counted. */
export type AnalyticsEvent =
  // Does anyone start, and do they get anywhere?
  | "path_started"
  | "path_stop_completed"
  | "path_completed"
  // Does the daily habit stick?
  | "quiz_started"
  | "quiz_completed"
  | "quiz_practice_started"
  | "streak_milestone"
  // Do the interactive pieces get used, or just admired?
  | "observatory_opened"
  | "observatory_planet_found"
  | "scale_explored"
  | "solar_system_opened"
  // Which language is this actually for?
  | "language_switched";

type Props = Record<string, string | number | boolean | undefined>;

type Plausible = (event: string, opts?: { props?: Props }) => void;
type Umami = { track: (event: string, data?: Props) => void };

declare global {
  interface Window {
    plausible?: Plausible;
    umami?: Umami;
  }
}

/**
 * Record an event.
 *
 * Safe to call from anywhere, including during render on the server, where it does
 * nothing. Never throws: a failed analytics call must not be able to break a page.
 */
export function track(event: AnalyticsEvent, props?: Props): void {
  if (typeof window === "undefined") return;

  try {
    if (typeof window.plausible === "function") {
      window.plausible(event, props ? { props } : undefined);
      return;
    }
    if (window.umami?.track) {
      window.umami.track(event, props);
      return;
    }
    // No provider configured. In development, say so once per event name so the
    // instrumentation is visibly working before anyone wires a provider up.
    if (process.env.NODE_ENV === "development" && !warned.has(event)) {
      warned.add(event);
      // eslint-disable-next-line no-console
      console.debug(`[analytics] ${event}`, props ?? "");
    }
  } catch {
    // Analytics is never allowed to take the page down with it.
  }
}

const warned = new Set<string>();
