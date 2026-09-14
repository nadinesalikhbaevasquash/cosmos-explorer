"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import Nav from "@/app/components/Nav";
import { useDict } from "@/app/hooks/useDict";
import { SCALE_LEVELS, LEVEL_EXP, FOCUS_FILL, T_MIN, T_MAX } from "./scaleData";
import { ICONS } from "@/app/components/SpaceCast";

const N = SCALE_LEVELS.length;

// ── Starfield (matches home page) ─────────────────────────────────────────────

function Starfield() {
  const [stars, setStars] = useState<{ id: number; x: number; y: number; size: number; delay: number; duration: number }[]>([]);
  useEffect(() => {
    setStars(Array.from({ length: 140 }, (_, i) => ({
      id: i, x: Math.random() * 100, y: Math.random() * 100,
      size: Math.random() * 2 + 0.4, delay: Math.random() * 6, duration: Math.random() * 4 + 2,
    })));
  }, []);
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {stars.map((s) => (
        <div key={s.id} className="star absolute rounded-full bg-white"
          style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.size, height: s.size,
            animationDelay: `${s.delay}s`, animationDuration: `${s.duration}s` }} />
      ))}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ScalePage() {
  const dict = useDict();
  const stageRef = useRef<HTMLDivElement>(null);
  const [stage, setStage] = useState(600); // stage square edge in px
  /* Zoom position is log10 of the view width in metres, NOT a level index.
     As an index it made every step between levels feel identical, when the real
     gaps run from 55x to 100,000,000x. In log-metre space one unit of scroll is
     always one order of magnitude, everywhere on the ladder. */
  const [t, setT] = useState(T_MIN);
  const animRef = useRef<number | null>(null);

  // Measure the stage
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setStage(Math.min(el.clientWidth, el.clientHeight)));
    ro.observe(el);
    setStage(Math.min(el.clientWidth, el.clientHeight));
    return () => ro.disconnect();
  }, []);

  const stopAnim = useCallback(() => {
    if (animRef.current !== null) cancelAnimationFrame(animRef.current);
    animRef.current = null;
  }, []);

  // Smoothly animate zoom to a target level
  const animateTo = useCallback((target: number) => {
    stopAnim();
    const step = () => {
      setT((cur) => {
        const next = cur + (target - cur) * 0.07;
        if (Math.abs(target - next) < 0.002) { animRef.current = null; return target; }
        animRef.current = requestAnimationFrame(step);
        return next;
      });
    };
    animRef.current = requestAnimationFrame(step);
  }, [stopAnim]);

  useEffect(() => stopAnim, [stopAnim]);

  // The level whose own focus exponent sits closest to where we are now.
  const focusedIndex = useMemo(() => {
    let best = 0;
    for (let i = 1; i < LEVEL_EXP.length; i++) {
      if (Math.abs(LEVEL_EXP[i] - t) < Math.abs(LEVEL_EXP[best] - t)) best = i;
    }
    return best;
  }, [t]);
  const focused = SCALE_LEVELS[focusedIndex];

  const snapTo = useCallback((i: number) => {
    const j = Math.max(0, Math.min(LEVEL_EXP.length - 1, i));
    animateTo(Math.max(T_MIN, Math.min(T_MAX, LEVEL_EXP[j])));
  }, [animateTo]);

  // Wheel zoom (non-passive so we can preventDefault)
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      stopAnim();
      setT((cur) => Math.max(T_MIN, Math.min(T_MAX, cur + e.deltaY * 0.004)));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [stopAnim]);

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") { e.preventDefault(); snapTo(focusedIndex + 1); }
      if (e.key === "ArrowLeft")  { e.preventDefault(); snapTo(focusedIndex - 1); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [focusedIndex, snapTo]);

  // The zoom position *is* the view width now, so the readout and the picture can
  // no longer disagree: they are the same number.
  const viewExponent = t;

  const items = dict.scale.items as Record<string, { name: string; size: string; fact: string }>;

  /* Per-layer render state.
     Each object is drawn at its real diameter divided by the current view width.
     That is the whole fix: previously every level was drawn one fixed step smaller
     than its neighbour regardless of how big it actually was, so the Milky Way sat
     the same distance from the Sun as the ISS sat from an astronaut. */
  const viewWidth = Math.pow(10, viewExponent);

  const layers = SCALE_LEVELS.map((lv, i) => {
    const s = lv.size / viewWidth;   // fraction of the stage this object spans
    const d = s * stage * 0.9;       // diameter in px

    // Bigger than the frame means you are inside it. Keep the nearest such shell as
    // a faint backdrop so a wide gap never leaves the stage completely empty.
    if (s > 6) {
      return { lv, i, d: stage * 2.4, opacity: 0.1, isFocused: false, enclosing: true };
    }
    if (d < 1.2) return null;

    const fadeIn = s > 1.2 ? Math.max(0, Math.min(1, (6 - s) / 4.8)) : 1;
    const opacity = fadeIn * Math.min(1, d / 9);
    if (opacity <= 0.01) return null;
    return { lv, i, d, opacity, isFocused: i === focusedIndex, enclosing: false };
  }).filter(Boolean) as { lv: typeof SCALE_LEVELS[number]; i: number; d: number; opacity: number; isFocused: boolean; enclosing: boolean }[];

  // Only the innermost enclosing shell is worth drawing; the rest are behind it.
  const enclosing = layers.filter((l) => l.enclosing);
  const visible = layers
    .filter((l) => !l.enclosing)
    .concat(enclosing.length ? [enclosing[0]] : []);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#060b18" }}>
      <Starfield />
      <div className="relative z-10">
        <Nav />

        <div className="max-w-7xl mx-auto px-6 pt-12 pb-20">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}
            className="text-center mb-8">
            <p className="text-indigo-400 text-xs tracking-[0.6em] uppercase mb-4 font-medium">{dict.scale.tagline}</p>
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white mb-4">
              {dict.scale.title[0]} <span className="gradient-text">{dict.scale.title[1]}</span>
            </h1>
            <p className="text-slate-400 max-w-xl mx-auto text-lg leading-relaxed mb-2">{dict.scale.subtitle}</p>
            <p className="text-slate-600 text-sm">{dict.scale.hint}</p>
          </motion.div>

          {/* Stage */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.2 }}
            ref={stageRef}
            className="relative mx-auto rounded-3xl overflow-hidden select-none"
            style={{
              height: "min(62vh, 660px)", minHeight: 400, maxWidth: 900,
              border: "1px solid rgba(99,102,241,0.2)",
              backgroundColor: "#02040c",
              boxShadow: "0 0 60px rgba(99,102,241,0.08)",
              touchAction: "none",
            }}>
            {/* Zoom layers — inner objects stack above the outer ones */}
            {visible.map(({ lv, i, d, opacity, isFocused }) => (
              <div key={lv.id}
                className="absolute rounded-full overflow-hidden"
                style={{
                  width: d, height: d,
                  left: "50%", top: "50%",
                  transform: "translate(-50%, -50%)",
                  zIndex: N - i,
                  opacity,
                  backgroundColor: "#02040c",
                  border: d > 14 ? `${isFocused ? 2 : 1}px solid ${lv.color}${isFocused ? "aa" : "40"}` : "none",
                  boxShadow: isFocused && d < stage * 1.1 ? `0 0 50px ${lv.color}25` : "none",
                }}>
                {lv.image ? (
                  <Image src={lv.image} alt={items[lv.id]?.name ?? lv.id} fill sizes="900px"
                    className="object-cover" unoptimized priority={i <= 1} />
                ) : (
                  (() => {
                    const Cast = ICONS[lv.cast as keyof typeof ICONS];
                    return Cast ? <Cast className="h-full w-full" /> : null;
                  })()
                )}
              </div>
            ))}

            {/* Focused label */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
              <span className="text-xs font-semibold whitespace-nowrap px-3 py-1 rounded-full"
                style={{
                  color: "#fff", backgroundColor: "rgba(3,7,18,0.75)",
                  border: `1px solid ${focused.color}70`, backdropFilter: "blur(6px)",
                }}>
                {items[focused.id]?.name} · {items[focused.id]?.size}
              </span>
            </div>

            {/* Zoom readout */}
            <div className="absolute top-4 right-4 z-40 text-right pointer-events-none">
              <p className="text-[10px] uppercase tracking-widest text-slate-500">{dict.scale.viewWidth}</p>
              <p className="text-sm font-bold font-mono" style={{ color: "#a1aff1" }}>
                10<sup>{viewExponent.toFixed(1)}</sup> m
              </p>
            </div>
          </motion.div>

          {/* Slider + thumbnail timeline */}
          <div className="mx-auto mt-6" style={{ maxWidth: 900 }}>
            <input
              type="range" min={T_MIN} max={T_MAX} step={0.001} value={t}
              onChange={(e) => { stopAnim(); setT(parseFloat(e.target.value)); }}
              className="w-full accent-indigo-500 cursor-pointer"
              aria-label={dict.scale.viewWidth}
            />
            <div className="mt-2 flex flex-wrap justify-center gap-1.5">
              {SCALE_LEVELS.map((lv, i) => {
                const isFocused = i === focusedIndex;
                return (
                  <button key={lv.id} onClick={() => snapTo(i)}
                    className="relative rounded-full overflow-hidden transition-all hover:scale-110 flex-shrink-0"
                    style={{
                      width: 34, height: 34,
                      border: `2px solid ${isFocused ? lv.color : "rgba(255,255,255,0.15)"}`,
                      boxShadow: isFocused ? `0 0 14px ${lv.color}60` : "none",
                      opacity: isFocused ? 1 : 0.55,
                    }}
                    title={items[lv.id]?.name}>
                    {lv.image ? (
                      <Image src={lv.image} alt={items[lv.id]?.name ?? lv.id} fill sizes="34px"
                        className="object-cover" unoptimized />
                    ) : (
                      (() => {
                        const Cast = ICONS[lv.cast as keyof typeof ICONS];
                        return Cast ? <Cast className="h-full w-full" /> : null;
                      })()
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Focused object card */}
          <AnimatePresence mode="wait">
            <motion.div key={focused.id}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="max-w-xl mx-auto mt-8 rounded-3xl p-6 text-center"
              style={{
                background: `linear-gradient(135deg, ${focused.color}10, rgba(13,17,23,0.95))`,
                border: `1px solid ${focused.color}35`,
              }}>
              <div className="relative w-14 h-14 mx-auto mb-3 rounded-full overflow-hidden"
                style={{ border: `2px solid ${focused.color}60`, boxShadow: `0 0 20px ${focused.color}40` }}>
                {focused.image ? (
                  <Image src={focused.image} alt={items[focused.id]?.name ?? focused.id} fill sizes="56px"
                    className="object-cover" unoptimized />
                ) : (
                  (() => {
                    const Cast = ICONS[focused.cast as keyof typeof ICONS];
                    return Cast ? <Cast className="h-full w-full" /> : null;
                  })()
                )}
              </div>
              <h2 className="text-2xl font-extrabold text-white mb-1">{items[focused.id]?.name}</h2>
              <p className="text-sm font-mono mb-3" style={{ color: focused.color }}>{items[focused.id]?.size}</p>
              <p className="text-slate-300 text-sm leading-relaxed">{items[focused.id]?.fact}</p>
              <div className="flex justify-center gap-3 mt-5">
                <button onClick={() => snapTo(focusedIndex - 1)} disabled={focusedIndex === 0}
                  className="px-5 py-2 rounded-full text-sm font-semibold border transition-all hover:scale-105 disabled:opacity-30 disabled:hover:scale-100"
                  style={{ borderColor: "rgba(99,102,241,0.4)", color: "#a1aff1", backgroundColor: "rgba(99,102,241,0.08)" }}>
                  ← {dict.scale.smaller}
                </button>
                <button onClick={() => snapTo(focusedIndex + 1)} disabled={focusedIndex === N - 1}
                  className="px-5 py-2 rounded-full text-sm font-semibold border transition-all hover:scale-105 disabled:opacity-30 disabled:hover:scale-100"
                  style={{ borderColor: "rgba(99,102,241,0.4)", color: "#a1aff1", backgroundColor: "rgba(99,102,241,0.08)" }}>
                  {dict.scale.bigger} →
                </button>
              </div>
            </motion.div>
          </AnimatePresence>

          <p className="text-center text-[15px] text-slate-700 mt-8">
            {dict.scale.credits}: NASA · ESO · Pablo Carlos Budassi (Wikimedia Commons)
          </p>
        </div>
      </div>
    </div>
  );
}
