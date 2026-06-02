"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Nav from "@/app/components/Nav";
import { useDict } from "@/app/hooks/useDict";
import { useParams } from "next/navigation";
import { SOLAR_SYSTEM_PLANETS } from "@/app/data/space";

type Planet = typeof SOLAR_SYSTEM_PLANETS[0];

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
  const params = useParams();
  const lang = (params?.lang as string) || "en";
  const [selected, setSelected] = useState<Planet | null>(null);
  const [paused, setPaused] = useState(false);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#030712" }}>
      <Nav />

      {/* Nebula blobs */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-1/3 left-1/4 w-[600px] h-[600px] rounded-full opacity-8"
          style={{ background: "radial-gradient(circle, #6366f1, transparent 70%)", filter: "blur(80px)" }} />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full opacity-6"
          style={{ background: "radial-gradient(circle, #c084fc, transparent 70%)", filter: "blur(70px)" }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-12 pb-24">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}
          className="text-center mb-12">
          <p className="text-indigo-400 text-xs tracking-[0.6em] uppercase mb-4 font-medium">Interactive</p>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white mb-4">
            Solar <span className="gradient-text">System</span>
          </h1>
          <p className="text-slate-400 max-w-xl mx-auto text-lg leading-relaxed mb-6">
            All 8 planets orbit the Sun at speeds scaled to their real relative periods.
            Click any planet to learn about it.
          </p>
          <button onClick={() => setPaused((p) => !p)}
            className="px-6 py-2.5 rounded-full text-sm font-semibold transition-all border hover:scale-105"
            style={{ borderColor: "rgba(99,102,241,0.4)", color: "#a5b4fc", backgroundColor: "rgba(99,102,241,0.08)" }}>
            {paused ? "▶ Resume Orbits" : "⏸ Pause Orbits"}
          </button>
        </motion.div>

        {/* Orrery */}
        <div className="relative flex items-center justify-center overflow-x-auto pb-6">
          <div className="relative flex-shrink-0" style={{ width: 980, height: 980 }}>
            {/* Sun */}
            <div className="absolute rounded-full"
              style={{
                width: 52, height: 52,
                left: "50%", top: "50%",
                transform: "translate(-50%, -50%)",
                background: "radial-gradient(circle at 30% 30%, #fff9c4, #fbbf24 40%, #f97316 70%, #dc2626 90%)",
                boxShadow: "0 0 50px #fbbf24, 0 0 100px #f97316, 0 0 160px rgba(249,115,22,0.3)",
              }} />
            {/* Sun corona */}
            <div className="absolute rounded-full"
              style={{
                width: 80, height: 80,
                left: "50%", top: "50%",
                transform: "translate(-50%, -50%)",
                background: "radial-gradient(circle, rgba(251,191,36,0.2), transparent 70%)",
                animation: "glow-pulse 2s ease-in-out infinite",
              }} />

            {/* Orbit rings + planets */}
            {SOLAR_SYSTEM_PLANETS.map((planet) => (
              <div key={planet.name}>
                {/* Orbit ring */}
                <div className="absolute rounded-full"
                  style={{
                    width: planet.orbitRadius * 2, height: planet.orbitRadius * 2,
                    left: "50%", top: "50%",
                    transform: "translate(-50%, -50%)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    boxShadow: "inset 0 0 30px rgba(99,102,241,0.04)",
                  }} />

                {/* Rotating arm */}
                <div className="absolute"
                  style={{
                    width: planet.orbitRadius, height: 2,
                    left: "50%", top: "50%",
                    transformOrigin: "0% 50%",
                    marginTop: -1,
                    animationName: paused ? "none" : "orbit-arm",
                    animationDuration: `${planet.period}s`,
                    animationTimingFunction: "linear",
                    animationIterationCount: "infinite",
                  }}>
                  <button
                    onClick={() => setSelected(selected?.name === planet.name ? null : planet)}
                    className="absolute focus:outline-none group"
                    style={{
                      width: planet.size, height: planet.size,
                      right: 0, top: "50%",
                      transform: "translate(50%, -50%)",
                      borderRadius: "50%",
                      background: PLANET_GRADIENTS[planet.name] || planet.color,
                      boxShadow: `0 0 ${planet.size * 1.5}px ${planet.color}90, 0 0 ${planet.size * 3}px ${planet.color}30`,
                      animationName: paused ? "none" : "counter-orbit",
                      animationDuration: `${planet.period}s`,
                      animationTimingFunction: "linear",
                      animationIterationCount: "infinite",
                    }}>
                    {/* Saturn rings */}
                    {planet.name === "Saturn" && (
                      <div className="absolute"
                        style={{
                          width: planet.size * 2.8, height: planet.size * 0.55,
                          top: "50%", left: "50%",
                          transform: "translate(-50%, -50%)",
                          background: "linear-gradient(90deg, transparent 10%, rgba(253,230,138,0.5) 25%, rgba(253,230,138,0.7) 50%, rgba(253,230,138,0.5) 75%, transparent 90%)",
                          borderRadius: "50%",
                          pointerEvents: "none",
                        }} />
                    )}
                    {/* Hover label */}
                    <span className="absolute bottom-full left-1/2 mb-2 px-2.5 py-1 rounded-lg text-xs font-semibold text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                      style={{ transform: "translateX(-50%)", backgroundColor: "rgba(0,0,0,0.85)", border: `1px solid ${planet.color}50` }}>
                      {planet.name}
                    </span>
                    {/* Selected ring */}
                    {selected?.name === planet.name && (
                      <span className="absolute rounded-full"
                        style={{ inset: -5, border: `2px solid ${planet.color}`, boxShadow: `0 0 12px ${planet.color}` }} />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Planet detail panel */}
        <AnimatePresence>
          {selected && (
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }} transition={{ duration: 0.35 }}
              className="mt-4 max-w-2xl mx-auto rounded-3xl p-7 overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${selected.color}10, rgba(13,17,23,0.95))`,
                border: `1px solid ${selected.color}35`,
                backdropFilter: "blur(20px)",
              }}>
              <div className="flex items-center gap-5 mb-5">
                <div className="w-20 h-20 rounded-full flex-shrink-0"
                  style={{
                    background: PLANET_GRADIENTS[selected.name] || selected.color,
                    boxShadow: `0 0 30px ${selected.color}80`,
                  }} />
                <div className="flex-1">
                  <h2 className="text-3xl font-extrabold text-white">{selected.name}</h2>
                  <p className="text-slate-400">{selected.type}</p>
                </div>
                <button onClick={() => setSelected(null)}
                  className="text-slate-500 hover:text-white text-xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors">✕</button>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-5">
                {[
                  ["Distance from Sun", selected.distanceFromSun],
                  ["Moons", selected.moons],
                  ["Type", selected.type],
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
                <p className="text-xs uppercase tracking-widest mb-2" style={{ color: selected.color }}>Fun Fact</p>
                <p className="text-slate-300 text-sm leading-relaxed">{selected.fact}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Planet reference strip */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">All Planets</h2>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
            {SOLAR_SYSTEM_PLANETS.map((planet) => (
              <button key={planet.name} onClick={() => setSelected(selected?.name === planet.name ? null : planet)}
                className="rounded-2xl py-4 px-2 text-center transition-all focus:outline-none"
                style={{
                  background: selected?.name === planet.name
                    ? `linear-gradient(135deg, ${planet.color}20, ${planet.color}08)`
                    : "rgba(255,255,255,0.03)",
                  border: `1px solid ${selected?.name === planet.name ? planet.color : "rgba(255,255,255,0.07)"}`,
                  boxShadow: selected?.name === planet.name ? `0 0 20px ${planet.color}30` : "none",
                }}>
                <div className="w-10 h-10 rounded-full mx-auto mb-2"
                  style={{ background: PLANET_GRADIENTS[planet.name] || planet.color, boxShadow: `0 0 12px ${planet.color}80` }} />
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
