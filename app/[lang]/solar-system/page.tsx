"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import Nav from "@/app/components/Nav";
import { useDict } from "@/app/hooks/useDict";
import { SOLAR_SYSTEM_PLANETS } from "@/app/data/space";

const SolarSystem3D = dynamic(() => import("./SolarSystem3D"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl mb-3 animate-pulse">🪐</div>
        <p className="text-slate-500 text-sm">Loading 3D…</p>
      </div>
    </div>
  ),
});

const PLANET_GRADIENTS: Record<string, string> = {
  Mercury: "radial-gradient(circle at 35% 35%, #d1d5db, #9ca3af 45%, #6b7280 80%)",
  Venus:   "radial-gradient(circle at 35% 35%, #fef3c7, #fbbf24 45%, #b45309 80%)",
  Earth:   "radial-gradient(circle at 30% 30%, #7dd3fc, #2563eb 35%, #16a34a 60%, #1e3a5f 80%)",
  Mars:    "radial-gradient(circle at 35% 35%, #fca5a5, #ef4444 45%, #7f1d1d 80%)",
  Jupiter: "radial-gradient(circle at 50% 45%, #fed7aa, #f97316 30%, #c2410c 55%, #431407 80%)",
  Saturn:  "radial-gradient(circle at 35% 35%, #fef3c7, #d97706 45%, #92400e 80%)",
  Uranus:  "radial-gradient(circle at 35% 35%, #cffafe, #22d3ee 45%, #0e7490 80%)",
  Neptune: "radial-gradient(circle at 35% 35%, #c7d2fe, #4338ca 45%, #1e1b4b 80%)",
};

export default function SolarSystemPage() {
  const dict = useDict();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);

  // Merge locale overrides (name / type / fact) into base planet data; id stays English
  const planets = useMemo(
    () =>
      SOLAR_SYSTEM_PLANETS.map((p) => ({
        id: p.name,
        ...p,
        ...(dict.planetData[p.name as keyof typeof dict.planetData] ?? {}),
      })),
    [dict]
  );

  const labels = useMemo(
    () => Object.fromEntries(planets.map((p) => [p.id, p.name])),
    [planets]
  );

  const selected = planets.find((p) => p.id === selectedId) ?? null;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#030712" }}>
      <Nav />

      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-12 pb-24">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}
          className="text-center mb-8">
          <p className="text-indigo-400 text-xs tracking-[0.6em] uppercase mb-4 font-medium">{dict.solarSystem.tagline}</p>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white mb-4">
            {dict.solarSystem.title[0]} <span className="gradient-text">{dict.solarSystem.title[1]}</span>
          </h1>
          <p className="text-slate-400 max-w-xl mx-auto text-lg leading-relaxed mb-2">
            {dict.solarSystem.subtitle}
          </p>
          <p className="text-slate-600 text-sm mb-6">{dict.solarSystem.hint}</p>
          <button onClick={() => setPaused((p) => !p)}
            className="px-6 py-2.5 rounded-full text-sm font-semibold transition-all border hover:scale-105"
            style={{ borderColor: "rgba(99,102,241,0.4)", color: "#a5b4fc", backgroundColor: "rgba(99,102,241,0.08)" }}>
            {paused ? dict.solarSystem.resume : dict.solarSystem.pause}
          </button>
        </motion.div>

        {/* 3D scene */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.2 }}
          className="relative rounded-3xl overflow-hidden"
          style={{
            height: "min(72vh, 780px)", minHeight: 420,
            border: "1px solid rgba(99,102,241,0.2)",
            boxShadow: "0 0 60px rgba(99,102,241,0.08), inset 0 0 120px rgba(3,7,18,0.4)",
          }}>
          <SolarSystem3D paused={paused} selected={selectedId} onSelect={setSelectedId} labels={labels} />
        </motion.div>

        {/* Planet detail panel */}
        <AnimatePresence>
          {selected && (
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }} transition={{ duration: 0.35 }}
              className="mt-6 max-w-2xl mx-auto rounded-3xl p-7 overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${selected.color}10, rgba(13,17,23,0.95))`,
                border: `1px solid ${selected.color}35`,
                backdropFilter: "blur(20px)",
              }}>
              <div className="flex items-center gap-5 mb-5">
                <div className="w-20 h-20 rounded-full flex-shrink-0"
                  style={{
                    background: PLANET_GRADIENTS[selected.id] || selected.color,
                    boxShadow: `0 0 30px ${selected.color}80`,
                  }} />
                <div className="flex-1">
                  <h2 className="text-3xl font-extrabold text-white">{selected.name}</h2>
                  <p className="text-slate-400">{selected.type}</p>
                </div>
                <button onClick={() => setSelectedId(null)}
                  className="text-slate-500 hover:text-white text-xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors">✕</button>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-5">
                {[
                  [dict.solarSystem.labels.distanceFromSun, selected.distanceFromSun],
                  [dict.solarSystem.labels.moons, selected.moons],
                  [dict.solarSystem.labels.type, selected.type],
                ].map(([label, val]) => (
                  <div key={String(label)} className="rounded-xl px-3 py-3 text-center"
                    style={{ backgroundColor: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <p className="text-xs text-slate-500 mb-1">{label}</p>
                    <p className="text-sm font-bold text-white">{String(val)}</p>
                  </div>
                ))}
              </div>
              <div className="rounded-2xl p-4"
                style={{ background: `${selected.color}0f`, border: `1px solid ${selected.color}25` }}>
                <p className="text-xs uppercase tracking-widest mb-2" style={{ color: selected.color }}>{dict.ui.funFact}</p>
                <p className="text-slate-300 text-sm leading-relaxed">{selected.fact}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Planet reference strip */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">{dict.solarSystem.allPlanets}</h2>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
            {planets.map((planet) => (
              <button key={planet.id}
                onClick={() => setSelectedId(selectedId === planet.id ? null : planet.id)}
                className="rounded-2xl py-4 px-2 text-center transition-all focus:outline-none"
                style={{
                  background: selectedId === planet.id
                    ? `linear-gradient(135deg, ${planet.color}20, ${planet.color}08)`
                    : "rgba(255,255,255,0.03)",
                  border: `1px solid ${selectedId === planet.id ? planet.color : "rgba(255,255,255,0.07)"}`,
                  boxShadow: selectedId === planet.id ? `0 0 20px ${planet.color}30` : "none",
                }}>
                <div className="w-10 h-10 rounded-full mx-auto mb-2"
                  style={{ background: PLANET_GRADIENTS[planet.id] || planet.color, boxShadow: `0 0 12px ${planet.color}80` }} />
                <p className="text-xs font-bold text-white">{planet.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">{planet.type}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
