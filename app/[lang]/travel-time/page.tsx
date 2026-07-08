"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Nav from "@/app/components/Nav";
import CelestialSprite, { CelestialArt } from "@/app/components/CelestialSprite";
import { useDict } from "@/app/hooks/useDict";
import { useParams } from "next/navigation";

// ── Physics data (names/notes localized in i18n under travelTime) ─────────────
// Textures shared with the 3D solar system page (Solar System Scope, CC-BY).

type Destination = { id: string; km: number; color: string; art: CelestialArt };
type Vehicle = { id: string; kmh: number; emoji: string };

const DESTINATIONS: Destination[] = [
  { id: "moon",      km: 3.844e5,  color: "#cbd5e1", art: { kind: "planet", src: "/textures/2k_moon.jpg" } },
  { id: "mars",      km: 5.46e7,   color: "#f87171", art: { kind: "planet", src: "/textures/2k_mars.jpg" } },
  { id: "sun",       km: 1.496e8,  color: "#fbbf24", art: { kind: "star",   src: "/textures/2k_sun.jpg" } },
  { id: "jupiter",   km: 5.88e8,   color: "#f97316", art: { kind: "planet", src: "/textures/2k_jupiter.jpg" } },
  { id: "neptune",   km: 4.3e9,    color: "#6366f1", art: { kind: "planet", src: "/textures/2k_neptune.jpg" } },
  { id: "proxima",   km: 4.017e13, color: "#fb7185", art: { kind: "star",   src: "/textures/2k_sun.jpg", filter: "hue-rotate(-45deg) saturate(1.7) brightness(0.8)" } },
  { id: "galaxy",    km: 2.46e17,  color: "#818cf8", art: { kind: "galaxy", src: "/scale/milkyway.jpg" } },
  { id: "andromeda", km: 2.365e19, color: "#c084fc", art: { kind: "galaxy", src: "/scale/milkyway.jpg", filter: "hue-rotate(45deg) saturate(1.4)", reverse: true } },
];

const VEHICLES: Vehicle[] = [
  { id: "walk",    kmh: 5,        emoji: "🚶" },
  { id: "car",     kmh: 100,      emoji: "🚗" },
  { id: "jet",     kmh: 900,      emoji: "✈️" },
  { id: "iss",     kmh: 27600,    emoji: "🛰️" },
  { id: "apollo",  kmh: 39937,    emoji: "🚀" },
  { id: "voyager", kmh: 61500,    emoji: "📡" },
  { id: "parker",  kmh: 690000,   emoji: "☄️" },
  { id: "light",   kmh: 1.079e9,  emoji: "⚡" },
];

const LOG_MIN = Math.log10(DESTINATIONS[0].km);
const LOG_MAX = Math.log10(DESTINATIONS[DESTINATIONS.length - 1].km);
const ladderPct = (km: number) => ((Math.log10(km) - LOG_MIN) / (LOG_MAX - LOG_MIN)) * 100;

// ── Duration formatting ───────────────────────────────────────────────────────

type Units = { min: string; h: string; d: string; y: string };

function formatDuration(hours: number, units: Units, locale: string): string {
  const nf = (n: number, digits = 0) =>
    n.toLocaleString(locale, { maximumFractionDigits: digits });
  if (hours < 1) return `${nf(Math.max(hours * 60, 0.1), hours * 60 < 10 ? 1 : 0)} ${units.min}`;
  if (hours < 48) return `${nf(hours, hours < 10 ? 1 : 0)} ${units.h}`;
  const days = hours / 24;
  if (days < 730) return `${nf(days, days < 10 ? 1 : 0)} ${units.d}`;
  const years = days / 365.25;
  return `${nf(years, years < 10 ? 1 : 0)} ${units.y}`;
}

function yearsFor(hours: number): number {
  return hours / 24 / 365.25;
}

// ── Distance ladder (log scale, dots directly labeled with emoji) ─────────────

function DistanceLadder({ selected, onSelect, nameFor, caption }: {
  selected: string;
  onSelect: (id: string) => void;
  nameFor: (id: string) => string;
  caption: string;
}) {
  return (
    <div className="mb-10">
      <div className="relative h-24 mx-4">
        {/* baseline */}
        <div className="absolute left-0 right-0 top-1/2 h-px" style={{ backgroundColor: "rgba(255,255,255,0.12)" }} />
        {/* decade ticks — each is 10× the previous distance */}
        {Array.from({ length: 14 }, (_, i) => i + 6).map((d) => (
          <div key={d} className="absolute top-1/2 -translate-y-1/2 w-px h-2.5"
            style={{ left: `${((d - LOG_MIN) / (LOG_MAX - LOG_MIN)) * 100}%`, backgroundColor: "rgba(255,255,255,0.07)" }} />
        ))}
        {DESTINATIONS.map((d, i) => {
          const active = d.id === selected;
          const above = i % 2 === 0;
          return (
            <button key={d.id} onClick={() => onSelect(d.id)}
              aria-pressed={active} aria-label={nameFor(d.id)} title={nameFor(d.id)}
              className="absolute group rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
              style={{ left: `${ladderPct(d.km)}%`, top: "50%", transform: "translate(-50%,-50%)" }}>
              <span className="relative flex items-center justify-center w-7 h-7">
                <span className="block w-2.5 h-2.5 rounded-full transition-all"
                  style={{
                    backgroundColor: active ? d.color : "rgba(148,163,184,0.5)",
                    boxShadow: active ? `0 0 12px ${d.color}` : "none",
                    outline: "2px solid #030712",
                  }} />
                {active && (
                  <motion.span layoutId="ladder-ring" className="absolute inset-0 rounded-full"
                    style={{ border: `1.5px solid ${d.color}` }} />
                )}
                <span
                  className={`absolute left-1/2 -translate-x-1/2 transition-opacity ${active ? "" : "opacity-50 group-hover:opacity-100"}`}
                  style={above ? { bottom: "calc(100% + 3px)" } : { top: "calc(100% + 3px)" }}>
                  <CelestialSprite art={d.art} size={20} glow={active ? d.color : undefined} />
                </span>
              </span>
            </button>
          );
        })}
      </div>
      <p className="text-[11px] text-slate-600 text-center mt-1">{caption}</p>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TravelTimePage() {
  const dict = useDict();
  const params = useParams();
  const lang = (params?.lang as string) || "en";
  const locale = lang === "ru" ? "ru-RU" : lang === "uz" ? "uz-UZ" : "en-US";
  const t = dict.travelTime;

  const [destId, setDestId] = useState("mars");
  const [vehicleId, setVehicleId] = useState("car");

  // Shareable URLs: read ?to=&by= once on mount, then keep the query in sync.
  const urlReady = useRef(false);
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const to = sp.get("to");
    const by = sp.get("by");
    if (to && DESTINATIONS.some((d) => d.id === to)) setDestId(to);
    if (by && VEHICLES.some((v) => v.id === by)) setVehicleId(by);
    urlReady.current = true;
  }, []);
  useEffect(() => {
    if (!urlReady.current) return;
    window.history.replaceState(null, "", `${window.location.pathname}?to=${destId}&by=${vehicleId}`);
  }, [destId, vehicleId]);

  const dest = DESTINATIONS.find((d) => d.id === destId)!;
  const vehicle = VEHICLES.find((v) => v.id === vehicleId)!;
  const hours = dest.km / vehicle.kmh;
  const years = yearsFor(hours);
  const lifetimes = years / 80;

  const destName = (id: string) => t.destinations[id as keyof typeof t.destinations]?.name ?? id;
  const destEntry = t.destinations[destId as keyof typeof t.destinations];
  const destNote = destEntry && "note" in destEntry ? destEntry.note : undefined;
  const vehicleName = (id: string) => t.vehicles[id as keyof typeof t.vehicles] ?? id;

  // "Leave today" line — a real date for short trips, a year for anything humanly reachable.
  let arrivalText: string | null = null;
  if (hours >= 24 && years <= 9000) {
    if (years < 1.5) {
      const date = new Date(Date.now() + hours * 3600e3)
        .toLocaleDateString(locale, { year: "numeric", month: "long", day: "numeric" });
      arrivalText = t.arrive.replace("{date}", date);
    } else {
      arrivalText = t.arriveYear.replace("{year}", String(new Date().getFullYear() + Math.round(years)));
    }
  }

  // Per-vehicle meter positions for the comparison list (log scale between fastest and slowest).
  const allHours = VEHICLES.map((v) => dest.km / v.kmh);
  const hLogMin = Math.log10(Math.min(...allHours));
  const hLogMax = Math.log10(Math.max(...allHours));
  const meterPct = (h: number) => ((Math.log10(h) - hLogMin) / (hLogMax - hLogMin)) * 100;

  const pickBtnFocus = "focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50";

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#030712" }}>
      <Nav />
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #f97316, transparent 70%)", filter: "blur(80px)" }} />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 pt-12 pb-24">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}
          className="text-center mb-10">
          <p className="text-orange-400 text-xs tracking-[0.6em] uppercase mb-4 font-medium">{t.tagline}</p>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white mb-4">
            {t.title[0]} <span className="gradient-text">{t.title[1]}</span>
          </h1>
          <p className="text-slate-400 max-w-xl mx-auto text-lg leading-relaxed">{t.subtitle}</p>
        </motion.div>

        {/* Distance ladder */}
        <DistanceLadder selected={destId} onSelect={setDestId} nameFor={destName} caption={t.ladderCaption} />

        {/* Destination picker */}
        <div className="mb-8">
          <p className="text-sm font-semibold text-slate-400 mb-3">{t.pickDestination}</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {DESTINATIONS.map((d) => (
              <button key={d.id} onClick={() => setDestId(d.id)} aria-pressed={destId === d.id}
                className={`rounded-2xl px-3 py-3 text-center transition-all hover:scale-[1.03] ${pickBtnFocus}`}
                style={{
                  background: destId === d.id ? `linear-gradient(135deg, ${d.color}20, ${d.color}08)` : "rgba(255,255,255,0.03)",
                  border: `1px solid ${destId === d.id ? d.color : "rgba(255,255,255,0.07)"}`,
                  boxShadow: destId === d.id ? `0 0 20px ${d.color}30` : "none",
                }}>
                <CelestialSprite art={d.art} size={40} glow={destId === d.id ? d.color : undefined} className="mx-auto mb-2" />
                <p className="text-xs font-bold text-white">{destName(d.id)}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Vehicle picker */}
        <div className="mb-10">
          <p className="text-sm font-semibold text-slate-400 mb-3">{t.pickVehicle}</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {VEHICLES.map((v) => (
              <button key={v.id} onClick={() => setVehicleId(v.id)} aria-pressed={vehicleId === v.id}
                className={`rounded-2xl px-3 py-3 text-center transition-all hover:scale-[1.03] ${pickBtnFocus}`}
                style={{
                  background: vehicleId === v.id ? "linear-gradient(135deg, rgba(249,115,22,0.2), rgba(249,115,22,0.06))" : "rgba(255,255,255,0.03)",
                  border: `1px solid ${vehicleId === v.id ? "#f97316" : "rgba(255,255,255,0.07)"}`,
                  boxShadow: vehicleId === v.id ? "0 0 20px rgba(249,115,22,0.3)" : "none",
                }}>
                <span className="text-2xl block mb-1">{v.emoji}</span>
                <p className="text-xs font-bold text-white">{vehicleName(v.id)}</p>
                <p className="text-[10px] text-slate-500 font-mono">{v.kmh.toLocaleString(locale)} {t.kmh}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Result */}
        <AnimatePresence mode="wait">
          <motion.div key={`${destId}-${vehicleId}`}
            initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.25 }}
            className="rounded-3xl p-8 md:p-10 text-center mb-10"
            style={{
              background: `linear-gradient(135deg, ${dest.color}12, rgba(13,17,23,0.95))`,
              border: `1px solid ${dest.color}35`,
            }}>
            <div className="flex items-center justify-center gap-4 mb-4">
              <span className="text-3xl">{vehicle.emoji}</span>
              <span className="text-slate-600 text-2xl">→</span>
              <CelestialSprite art={dest.art} size={52} glow={dest.color} />
            </div>
            <p className="text-slate-400 text-sm mb-2">
              {vehicleName(vehicleId)} → {destName(destId)} · {dest.km.toLocaleString(locale)} {t.km}
              {destNote ? ` · ${destNote}` : ""}
            </p>
            <p className="text-5xl md:text-6xl font-black my-4" style={{ color: dest.color, textShadow: `0 0 40px ${dest.color}50` }}>
              ≈ {formatDuration(hours, t.units, locale)}
            </p>
            {arrivalText && (
              <p className="text-slate-400 text-sm">{arrivalText}</p>
            )}
            {lifetimes >= 2 && (
              <p className="text-slate-500 text-sm mt-1">
                {t.lifetimes.replace("{n}", Math.round(lifetimes).toLocaleString(locale))}
              </p>
            )}
            {vehicleId === "light" && (
              <p className="text-slate-500 text-sm mt-3 max-w-md mx-auto leading-relaxed">{t.lightNote}</p>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Full comparison for chosen destination */}
        <div>
          <p className="text-sm font-semibold text-slate-400 mb-3">
            {t.comparisonHeading.replace("{dest}", destName(destId))}
          </p>
          <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.07)" }}>
            {VEHICLES.map((v, i) => {
              const h = dest.km / v.kmh;
              const active = v.id === vehicleId;
              return (
                <button key={v.id} onClick={() => setVehicleId(v.id)} aria-pressed={active}
                  className={`w-full flex items-center gap-4 px-5 py-3 text-left transition-colors ${pickBtnFocus} focus-visible:ring-inset`}
                  style={{
                    backgroundColor: active ? `${dest.color}12` : i % 2 ? "rgba(255,255,255,0.02)" : "transparent",
                    borderLeft: `3px solid ${active ? dest.color : "transparent"}`,
                  }}>
                  <span className="flex items-center gap-3 w-36 sm:w-44 flex-shrink-0">
                    <span className="text-lg">{v.emoji}</span>
                    <span className={`text-sm font-medium ${active ? "text-white" : "text-slate-400"}`}>{vehicleName(v.id)}</span>
                  </span>
                  {/* log-scale time meter — faster is left, slower is right */}
                  <span className="relative flex-1 hidden sm:block h-px" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
                    <span className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2 h-2 rounded-full transition-all"
                      style={{
                        left: `${meterPct(h)}%`,
                        backgroundColor: active ? dest.color : "rgba(148,163,184,0.45)",
                        boxShadow: active ? `0 0 10px ${dest.color}` : "none",
                        outline: "2px solid #030712",
                      }} />
                  </span>
                  <span className={`text-sm font-mono font-bold ml-auto flex-shrink-0 ${active ? "" : "text-slate-500"}`}
                    style={active ? { color: dest.color } : undefined}>
                    {formatDuration(h, t.units, locale)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
