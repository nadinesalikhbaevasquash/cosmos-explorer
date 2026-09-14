"use client";

/**
 * Fires one beacon per page view, including client-side navigations — which is why
 * this watches the pathname rather than the load event. After the first load this
 * app never does another, so a load listener would count exactly one view per visit.
 *
 * The only thing kept in the browser is the date of the last hit, so each browser
 * can tell the server "first time today" without anyone issuing it an id.
 * Cookie-free by design: nothing to consent to, nothing to leak.
 */

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { beacon } from "@/app/lib/analytics";

const SEEN_KEY = "astranova-seen";

export default function PageViews() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;

    let firstToday = false;
    try {
      const today = new Date().toISOString().slice(0, 10);
      firstToday = localStorage.getItem(SEEN_KEY) !== today;
      if (firstToday) localStorage.setItem(SEEN_KEY, today);
    } catch {
      // Private mode or storage disabled. Still worth counting the view.
    }

    // Only an external referrer is interesting; an internal one is just the
    // previous page of the same visit.
    let referrer = "";
    try {
      if (document.referrer && new URL(document.referrer).host !== location.host) {
        referrer = document.referrer;
      }
    } catch {
      /* malformed referrer */
    }

    beacon({ path: pathname, referrer, firstToday });
  }, [pathname]);

  return null;
}
