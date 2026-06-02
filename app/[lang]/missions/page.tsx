"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Nav from "@/app/components/Nav";
import { useDict } from "@/app/hooks/useDict";
import { MISSIONS } from "@/app/data/space";

function MissionCard({ mission, achievementLabel }: { mission: typeof MISSIONS[0]; achievementLabel: string }) {
  const dict = useDict();
  const missionOverride = dict.missionData[mission.name as keyof typeof dict.missionData];
  const description  = missionOverride?.description  || mission.description;
  const achievement  = missionOverride?.achievement  || mission.achievement;

  return (
    <div className="rounded-2xl overflow-hidden h-full"
      style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${mission.agencyColor}25`, backdropFilter: "blur(12px)" }}>
      <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${mission.agencyColor}, transparent)` }} />
      <div className="p-5">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
            style={{ background: `${mission.agencyColor}15`, border: `1px solid ${mission.agencyColor}30` }}>
            {mission.emoji}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <h3 className="text-base font-bold text-white">{mission.name}</h3>
              <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{
                  backgroundColor: mission.status === "Active" ? "rgba(16,185,129,0.15)" : "rgba(100,116,139,0.15)",
                  color: mission.status === "Active" ? "#34d399" : "#64748b",
                  border: `1px solid ${mission.status === "Active" ? "rgba(16,185,129,0.25)" : "rgba(100,116,139,0.2)"}`,
                }}>
                {mission.status}
              </span>
            </div>
            <p className="text-xs text-slate-500">{mission.year} · {mission.agency}</p>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0"
            style={{ backgroundColor: `${mission.agencyColor}15`, color: mission.agencyColor }}>
            {mission.type}
          </span>
        </div>
        <p className="text-slate-400 text-sm leading-relaxed mb-4">{description}</p>
        <div className="flex items-center gap-2 p-3 rounded-xl"
          style={{ background: "rgba(52,211,153,0.06)", border: "1px solid rgba(52,211,153,0.15)" }}>
          <span className="text-emerald-500 text-xs">★</span>
          <span className="text-xs font-semibold text-emerald-400">{achievement}</span>
        </div>
      </div>
    </div>
  );
}

export default function MissionsPage() {
  const dict = useDict();
  const [filterIdx, setFilterIdx] = useState(0);
  const filters = dict.missions.filters;
  const filter = filters[filterIdx];

  const EN_FILTERS = ["All", "Active", "Complete", "Human Spaceflight", "Mars Rover", "Observatory", "Deep Space"];

  const filtered = MISSIONS.filter((m) => {
    const enFilter = EN_FILTERS[filterIdx];
    if (enFilter === "All") return true;
    if (enFilter === "Active" || enFilter === "Complete") return m.status === enFilter;
    return m.type === enFilter;
  });

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#030712" }}>
      <Nav />
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] rounded-full opacity-8"
          style={{ background: "radial-gradient(circle, #059669, transparent 70%)", filter: "blur(80px)" }} />
        <div className="absolute bottom-1/3 right-1/4 w-[350px] h-[350px] rounded-full opacity-6"
          style={{ background: "radial-gradient(circle, #3b82f6, transparent 70%)", filter: "blur(70px)" }} />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 pt-12 pb-24">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}
          className="text-center mb-14">
          <p className="text-emerald-400 text-xs tracking-[0.6em] uppercase mb-4 font-medium">{dict.missions.tagline}</p>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white mb-4">
            {dict.missions.title[0]} <span className="gradient-text">{dict.missions.title[1]}</span>
          </h1>
          <p className="text-slate-400 max-w-xl mx-auto text-lg leading-relaxed">{dict.missions.subtitle}</p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12">
          {[
            { value: MISSIONS.length, color: "#818cf8" },
            { value: MISSIONS.filter(m => m.status === "Active").length, color: "#34d399" },
            { value: 65, color: "#fbbf24" },
            { value: 4, color: "#f97316" },
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="rounded-2xl p-5 text-center glass" style={{ border: `1px solid ${s.color}20` }}>
              <p className="text-4xl font-extrabold mb-1" style={{ color: s.color }}>{s.value}</p>
              <p className="text-slate-500 text-xs uppercase tracking-wider">{dict.missions.stats[i]}</p>
            </motion.div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 justify-center mb-12">
          {filters.map((f, i) => (
            <button key={f} onClick={() => setFilterIdx(i)}
              className="px-4 py-2 rounded-full text-sm font-medium transition-all"
              style={{
                background: filterIdx === i ? "linear-gradient(135deg, #059669, #047857)" : "rgba(255,255,255,0.04)",
                border: `1px solid ${filterIdx === i ? "#059669" : "rgba(255,255,255,0.1)"}`,
                color: filterIdx === i ? "white" : "#94a3b8",
                boxShadow: filterIdx === i ? "0 0 20px rgba(5,150,105,0.35)" : "none",
              }}>
              {f}
            </button>
          ))}
        </div>

        {/* Timeline */}
        <div className="relative">
          <div className="absolute left-1/2 top-0 bottom-0 w-px hidden md:block"
            style={{ background: "linear-gradient(to bottom, transparent, rgba(99,102,241,0.25), rgba(99,102,241,0.1), transparent)", transform: "translateX(-50%)" }} />
          <AnimatePresence mode="popLayout">
            {filtered.map((mission, i) => {
              const isLeft = i % 2 === 0;
              return (
                <motion.div key={mission.name} layout
                  initial={{ opacity: 0, x: isLeft ? -30 : 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: i * 0.05, duration: 0.4 }}
                  className="relative mb-8 flex items-start gap-0">
                  <div className={`hidden md:block w-1/2 pr-10 ${!isLeft ? "opacity-0 pointer-events-none" : ""}`}>
                    {isLeft && (
                      <div className="flex flex-col items-end">
                        <span className="text-sm font-bold text-slate-500 mb-2">{mission.year}</span>
                        <MissionCard mission={mission} achievementLabel={dict.missions.stats[0]} />
                      </div>
                    )}
                  </div>
                  <div className="hidden md:flex items-center justify-center w-5 flex-shrink-0 mt-8"
                    style={{ transform: "translateX(-50%)" }}>
                    <div className="w-4 h-4 rounded-full"
                      style={{ background: mission.agencyColor, boxShadow: `0 0 12px ${mission.agencyColor}80, 0 0 24px ${mission.agencyColor}40`, border: "2px solid rgba(3,7,18,0.8)" }} />
                  </div>
                  <div className={`hidden md:block w-1/2 pl-10 ${isLeft ? "opacity-0 pointer-events-none" : ""}`}>
                    {!isLeft && (
                      <div className="flex flex-col items-start">
                        <span className="text-sm font-bold text-slate-500 mb-2">{mission.year}</span>
                        <MissionCard mission={mission} achievementLabel={dict.missions.stats[0]} />
                      </div>
                    )}
                  </div>
                  <div className="md:hidden w-full">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-3 h-3 rounded-full" style={{ background: mission.agencyColor }} />
                      <span className="text-sm font-bold text-slate-500">{mission.year}</span>
                    </div>
                    <MissionCard mission={mission} achievementLabel={dict.missions.stats[0]} />
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          {filtered.length === 0 && (
            <p className="text-center text-slate-600 py-20 text-lg">{dict.missions.noResults}</p>
          )}
        </div>
      </div>
    </div>
  );
}
