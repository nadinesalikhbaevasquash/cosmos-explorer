"use client";

/**
 * The learning path.
 *
 * The home page used to be a grid asking "what would you like to explore?", which
 * only works if you already know. This gives the site a spine instead: seven stops
 * that start at the ground you are standing on and end at the edge of the
 * observable universe, in the order the distances actually go.
 *
 * Progress is kept in localStorage, so there is a "next thing" waiting when you come
 * back. That is deliberately local for now: once accounts land it moves server-side
 * and follows you between devices.
 */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useParams } from "next/navigation";
import { useDict } from "@/app/hooks/useDict";
import {
  Astronaut,
  BlackHole,
  EarthGlobe,
  Galaxy,
  Moon,
  Planet,
  SunStar,
  Telescope,
} from "@/app/components/SpaceCast";
import { track } from "@/app/lib/analytics";
import { syncProgress } from "@/app/lib/sync";
import { useUser } from "@/app/components/UserProvider";

const KEY = "astranova-path";

type Stop = {
  id: string;
  Icon: (p: { className?: string }) => React.ReactElement;
  href: (lang: string) => string;
  colour: string;
};

/** Ordered outward from Earth. The order is the lesson. */
const STOPS: Stop[] = [
  { id: "home",        Icon: EarthGlobe, href: (l) => `/${l}/#planets`,     colour: "#34d399" },
  { id: "moon",        Icon: Moon,       href: (l) => `/${l}/#moons`,       colour: "#94a3b8" },
  { id: "solarSystem", Icon: Planet,     href: (l) => `/${l}/solar-system`, colour: "#e0782f" },
  { id: "stars",       Icon: SunStar,    href: (l) => `/${l}/#stars`,       colour: "#e2b43d" },
  { id: "exoplanets",  Icon: Telescope,  href: (l) => `/${l}/observatory`,  colour: "#7e88ec" },
  { id: "galaxies",    Icon: Galaxy,     href: (l) => `/${l}/#galaxies`,    colour: "#b884ed" },
  { id: "blackHoles",  Icon: BlackHole,  href: (l) => `/${l}/#black-holes`, colour: "#eb7bb6" },
];

export default function LearningPath() {
  const dict = useDict();
  const params = useParams();
  const lang = (params?.lang as string) || "en";
  const t = dict.path;

  const { user } = useUser();
  const [done, setDone] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  // Read after mount. Reading during render would make the server and client
  // disagree about which stops are complete and trip a hydration mismatch.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setDone(JSON.parse(raw));
    } catch {
      /* private mode or bad JSON: an empty path is a fine starting state */
    }
    setReady(true);
  }, []);

  /* When a session resolves, union the account's stops with this device's. Union
     rather than replace: signing in on a new phone must not erase what you did on
     the laptop, and finishing a stop offline must not be lost when you sign in. */
  useEffect(() => {
    if (!user?.pathDone?.length) return;
    setDone((prev) => {
      const merged = [...new Set([...prev, ...user.pathDone])];
      if (merged.length === prev.length) return prev;
      try {
        localStorage.setItem(KEY, JSON.stringify(merged));
      } catch {
        /* storage unavailable; in-memory state is still correct */
      }
      return merged;
    });
  }, [user]);

  const toggle = useCallback((id: string) => {
    setDone((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      if (!prev.includes(id)) {
        if (prev.length === 0) track("path_started");
        track("path_stop_completed", { stop: id, position: next.length });
        if (next.length === STOPS.length) track("path_completed");
      }
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        /* nothing to do; the path still works for this session */
      }
      syncProgress({ pathDone: next });
      return next;
    });
  }, []);

  const completed = done.length;
  const pct = Math.round((completed / STOPS.length) * 100);
  // The first stop not yet done is where "continue" should send you.
  const nextStop = STOPS.find((s) => !done.includes(s.id)) ?? STOPS[0];

  return (
    <section className="max-w-6xl mx-auto px-6 py-20">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6 }}
      >
        <p className="text-indigo-400 text-[13px] tracking-[0.35em] uppercase font-semibold mb-3">
          {t.eyebrow}
        </p>
        <h2 className="text-4xl sm:text-5xl font-bold text-white mb-3">{t.title}</h2>
        <p className="text-slate-400 text-[16px] max-w-2xl leading-relaxed">{t.subtitle}</p>
      </motion.div>

      {/* Progress */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.15 }}
        className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[15px] font-semibold text-white">
              {ready ? `${completed} / ${STOPS.length}` : "—"}{" "}
              <span className="font-normal text-slate-400">{t.stopsDone}</span>
            </p>
            <p className="text-[13px] text-slate-500 mt-0.5">
              {completed === STOPS.length ? t.allDone : `${t.upNext} ${t.stops[nextStop.id as keyof typeof t.stops].title}`}
            </p>
          </div>
          <Link
            href={nextStop.href(lang)}
            className="an-sweep-host rounded-full px-6 py-3 text-[15px] font-semibold text-white transition-transform hover:scale-105"
            style={{ background: "linear-gradient(135deg, #6b6ee9, #b884ed)", boxShadow: "0 0 24px rgba(99,102,241,0.35)" }}
          >
            {completed === 0 ? t.start : t.continue}
          </Link>
        </div>
        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-white/5">
          <motion.div
            className="h-full rounded-full"
            style={{ background: "linear-gradient(90deg, #34d399, #7e88ec, #b884ed)" }}
            initial={{ width: 0 }}
            animate={{ width: `${ready ? pct : 0}%` }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
      </motion.div>

      {/* The stops */}
      <ol className="mt-8 space-y-3">
        {STOPS.map((s, i) => {
          const copy = t.stops[s.id as keyof typeof t.stops];
          const isDone = done.includes(s.id);
          const isNext = ready && !isDone && s.id === nextStop.id;

          return (
            <motion.li
              key={s.id}
              initial={{ opacity: 0, x: -18 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.45, delay: Math.min(i * 0.06, 0.4) }}
              className="relative"
            >
              {/* the line joining the stops into a path */}
              {i < STOPS.length - 1 && (
                <span
                  aria-hidden
                  className="absolute left-[38px] top-[76px] w-px"
                  style={{ height: 26, background: isDone ? s.colour : "rgba(255,255,255,0.09)" }}
                />
              )}

              <div
                className={`flex items-center gap-4 rounded-2xl border p-4 transition-colors ${
                  isNext ? "bg-white/[0.05]" : "bg-white/[0.02] hover:bg-white/[0.04]"
                }`}
                style={{ borderColor: isNext ? `${s.colour}66` : "rgba(255,255,255,0.08)" }}
              >
                {/* number / tick */}
                <button
                  onClick={() => toggle(s.id)}
                  aria-pressed={isDone}
                  aria-label={isDone ? t.markUndone : t.markDone}
                  className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border text-[13px] font-bold transition-all hover:scale-110"
                  style={{
                    borderColor: isDone ? s.colour : "rgba(255,255,255,0.18)",
                    background: isDone ? `${s.colour}22` : "transparent",
                    color: isDone ? s.colour : "#94a3b8",
                  }}
                >
                  {isDone ? "✓" : i + 1}
                </button>

                <div
                  className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl"
                  style={{ background: `${s.colour}14` }}
                >
                  <s.Icon className="h-10 w-10" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-[17px] font-bold text-white">{copy.title}</h3>
                    {isNext && (
                      <span
                        className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                        style={{ background: `${s.colour}22`, color: s.colour }}
                      >
                        {t.upNextChip}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-[14px] leading-relaxed text-slate-400">{copy.body}</p>
                </div>

                <Link
                  href={s.href(lang)}
                  className="flex-shrink-0 rounded-full border border-white/10 px-4 py-2 text-[14px] font-medium text-slate-300 transition-colors hover:border-white/30 hover:text-white"
                >
                  {t.open}
                </Link>
              </div>
            </motion.li>
          );
        })}
      </ol>

      {/* Sign-in tease: the path is the reason an account is worth having. */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="mt-6 flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.02] px-5 py-4"
      >
        <Astronaut className="h-12 w-12 flex-shrink-0" />
        <p className="text-[14px] leading-relaxed text-slate-400">{t.saveNote}</p>
      </motion.div>
    </section>
  );
}
