"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import Nav from "@/app/components/Nav";
import { useDict } from "@/app/hooks/useDict";
import { SCALE_LEVELS, ZOOM_STEP } from "./scaleData";

const N = SCALE_LEVELS.length;
const T_MIN = 0;
const T_MAX = N - 1;

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
  const [t, setT] = useState(0);           // continuous zoom position, 0 … N-1
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
        if (Math.abs(target - next) < 0.003) { animRef.current = null; return target; }
        animRef.current = requestAnimationFrame(step);
        return next;
      });
    };
    animRef.current = requestAnimationFrame(step);
  }, [stopAnim]);

  useEffect(() => stopAnim, [stopAnim]);

  const focusedIndex = Math.max(0, Math.min(N - 1, Math.round(t)));
  const focused = SCALE_LEVELS[focusedIndex];

  const snapTo = useCallback((i: number) => {
    animateTo(Math.max(T_MIN, Math.min(T_MAX, i)));
  }, [animateTo]);

  // Wheel zoom (non-passive so we can preventDefault)
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      stopAnim();
      setT((cur) => Math.max(T_MIN, Math.min(T_MAX, cur + e.deltaY * 0.0012)));
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

  // View width in metres, interpolated in log space between levels
  const viewExponent = useMemo(() => {
    const i = Math.max(0, Math.min(N - 2, Math.floor(t)));
    const f = t - i;
    const a = Math.log10(SCALE_LEVELS[i].size / 0.8);
    const b = Math.log10(SCALE_LEVELS[i + 1].size / 0.8);
    return a + (b - a) * f;
  }, [t]);

  const items = dict.scale.items as Record<string, { name: string; size: string; fact: string }>;

  // Per-layer render state for the continuous zoom
  const layers = SCALE_LEVELS.map((lv, i) => {
    const s = Math.pow(ZOOM_STEP, i - t); // scale relative to the stage
    const d = s * stage * 0.9;            // circle diameter in px
    if (d < 2 || s > ZOOM_STEP * 1.1) return null;
    // Outer layers fade in as they shrink toward the frame; tiny dots fade out
    const rampIn = s > 1.6 ? Math.max(0, (ZOOM_STEP - s) / (ZOOM_STEP - 1.6)) : 1;
    const opacity = rampIn * Math.min(1, d / 8);
    if (opacity <= 0.01) return null;
    return { lv, i, d, opacity, isFocused: i === focusedIndex };
  }).filter(Boolean) as { lv: typeof SCALE_LEVELS[number]; i: number; d: number; opacity: number; isFocused: boolean }[];

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#030712" }}>
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
            {layers.map(({ lv, i, d, opacity, isFocused }) => (
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
                <Image src={lv.image} alt={items[lv.id]?.name ?? lv.id} fill sizes="900px"
                  className="object-cover" unoptimized priority={i <= 1} />
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
              <p className="text-sm font-bold font-mono" style={{ color: "#a5b4fc" }}>
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
            <div className="flex justify-between mt-2">
              {SCALE_LEVELS.map((lv, i) => {
                const isFocused = i === focusedIndex;
                return (
                  <button key={lv.id} onClick={() => snapTo(i)}
                    className="relative rounded-full overflow-hidden transition-all hover:scale-110 focus:outline-none flex-shrink-0"
                    style={{
                      width: 34, height: 34,
                      border: `2px solid ${isFocused ? lv.color : "rgba(255,255,255,0.15)"}`,
                      boxShadow: isFocused ? `0 0 14px ${lv.color}60` : "none",
                      opacity: isFocused ? 1 : 0.55,
                    }}
                    title={items[lv.id]?.name}>
                    <Image src={lv.image} alt={items[lv.id]?.name ?? lv.id} fill sizes="34px"
                      className="object-cover" unoptimized />
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
                <Image src={focused.image} alt={items[focused.id]?.name ?? focused.id} fill sizes="56px"
                  className="object-cover" unoptimized />
              </div>
              <h2 className="text-2xl font-extrabold text-white mb-1">{items[focused.id]?.name}</h2>
              <p className="text-sm font-mono mb-3" style={{ color: focused.color }}>{items[focused.id]?.size}</p>
              <p className="text-slate-300 text-sm leading-relaxed">{items[focused.id]?.fact}</p>
              <div className="flex justify-center gap-3 mt-5">
                <button onClick={() => snapTo(focusedIndex - 1)} disabled={focusedIndex === 0}
                  className="px-5 py-2 rounded-full text-sm font-semibold border transition-all hover:scale-105 disabled:opacity-30 disabled:hover:scale-100"
                  style={{ borderColor: "rgba(99,102,241,0.4)", color: "#a5b4fc", backgroundColor: "rgba(99,102,241,0.08)" }}>
                  ← {dict.scale.smaller}
                </button>
                <button onClick={() => snapTo(focusedIndex + 1)} disabled={focusedIndex === N - 1}
                  className="px-5 py-2 rounded-full text-sm font-semibold border transition-all hover:scale-105 disabled:opacity-30 disabled:hover:scale-100"
                  style={{ borderColor: "rgba(99,102,241,0.4)", color: "#a5b4fc", backgroundColor: "rgba(99,102,241,0.08)" }}>
                  {dict.scale.bigger} →
                </button>
              </div>
            </motion.div>
          </AnimatePresence>

          <p className="text-center text-xs text-slate-700 mt-8">
            {dict.scale.credits}: NASA · ESO · Pablo Carlos Budassi (Wikimedia Commons)
          </p>
        </div>
      </div>
    </div>
  );
}
