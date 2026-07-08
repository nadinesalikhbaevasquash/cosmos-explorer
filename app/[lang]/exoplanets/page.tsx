"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Nav from "@/app/components/Nav";
import { useDict } from "@/app/hooks/useDict";
import { useParams } from "next/navigation";

// ── Featured worlds: real artist-concept imagery + physical data ──────────────
// Images: ESO / ESA Hubble (CC BY 4.0) and NASA/JPL-Caltech — see per-item credit.

type Featured = {
  id: string;
  img: string;
  credit: string;
  color: string;
  radiusEarths: number;
  ly: number;
  orbitDays: number;
  tempK: number;
  travelParam?: string;
};

const FEATURED: Featured[] = [
  { id: "peg51b",     img: "/exoplanets/peg51b.jpg",     credit: "ESO/M. Kornmesser",  color: "#fbbf24", radiusEarths: 13.4, ly: 50,   orbitDays: 4.2,  tempK: 1265 },
  { id: "proximab",   img: "/exoplanets/proximab.jpg",   credit: "ESO/M. Kornmesser",  color: "#fb7185", radiusEarths: 1.1,  ly: 4.25, orbitDays: 11.2, tempK: 234, travelParam: "proxima" },
  { id: "trappist1e", img: "/exoplanets/trappist1e.jpg", credit: "NASA/JPL-Caltech",   color: "#67e8f9", radiusEarths: 0.92, ly: 40,   orbitDays: 6.1,  tempK: 250 },
  { id: "kepler452b", img: "/exoplanets/kepler452b.jpg", credit: "NASA/JPL-Caltech",   color: "#4ade80", radiusEarths: 1.63, ly: 1400, orbitDays: 385,  tempK: 265 },
  { id: "hd189733b",  img: "/exoplanets/hd189733b.jpg",  credit: "NASA/ESA Hubble",    color: "#60a5fa", radiusEarths: 12.7, ly: 64,   orbitDays: 2.2,  tempK: 1200 },
  { id: "cancri55e",  img: "/exoplanets/cancri55e.jpg",  credit: "ESA/Hubble",         color: "#fb923c", radiusEarths: 1.95, ly: 41,   orbitDays: 0.75, tempK: 2000 },
  { id: "wasp12b",    img: "/exoplanets/wasp12b.jpg",    credit: "NASA/JPL-Caltech",   color: "#fcd34d", radiusEarths: 21,   ly: 1400, orbitDays: 1.1,  tempK: 2600 },
  { id: "k218b",      img: "/exoplanets/k218b.jpg",      credit: "ESA/Hubble",         color: "#2dd4bf", radiusEarths: 2.6,  ly: 124,  orbitDays: 33,   tempK: 265 },
];

// Same physics as the travel-time page: how long to cross `ly` light-years.
const LY_KM = 9.4607e12;
const HOURS_PER_YEAR = 8766;
const VOYAGER_KMH = 61500;
const yearsAt = (ly: number, kmh: number) => (ly * LY_KM) / kmh / HOURS_PER_YEAR;

// ── Live data types ───────────────────────────────────────────────────────────

type ApiData = {
  total: number | null;
  methods: { method: string; count: number }[];
  recent: {
    name: string; host: string; year: number; method: string;
    radiusEarths: number | null; massEarths: number | null; orbitDays: number | null;
    distanceLy: number | null; tempK: number | null;
  }[];
};

// Equilibrium-temperature bands, relative to Earth's ~255 K.
function tempClass(k: number): { key: "cold" | "temperate" | "hot"; color: string } {
  if (k < 200) return { key: "cold", color: "#93c5fd" };
  if (k <= 330) return { key: "temperate", color: "#4ade80" };
  return { key: "hot", color: "#fb923c" };
}

// ── Animated counter ──────────────────────────────────────────────────────────

function CountUp({ value, locale }: { value: number; locale: string }) {
  const [shown, setShown] = useState(0);
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const t0 = performance.now();
    const dur = 1800;
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / dur);
      setShown(Math.round(value * (1 - Math.pow(1 - p, 3))));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [value]);
  return <>{shown.toLocaleString(locale)}</>;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ExoplanetsPage() {
  const dict = useDict();
  const params = useParams();
  const lang = (params?.lang as string) || "en";
  const locale = lang === "ru" ? "ru-RU" : lang === "uz" ? "uz-UZ" : "en-US";
  const exo = dict.exoplanets;
  const tt = dict.travelTime;

  const [data, setData] = useState<ApiData | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    fetch("/api/space/exoplanets")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setData)
      .catch(() => setFailed(true));
  }, []);

  const formatOrbit = (days: number) =>
    days < 10
      ? days.toLocaleString(locale, { maximumFractionDigits: 1 })
      : Math.round(days).toLocaleString(locale);

  const fmtYears = (y: number) =>
    y.toLocaleString(locale, { maximumSignificantDigits: 3 });

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#030712" }}>
      <Nav />
      {/* Nebula backdrop */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/5 w-[500px] h-[500px] rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #2dd4bf, transparent 70%)", filter: "blur(80px)" }} />
        <div className="absolute bottom-1/4 right-1/5 w-[400px] h-[400px] rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #818cf8, transparent 70%)", filter: "blur(70px)" }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-12 pb-24">
        {/* Hero with live counter */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}
          className="text-center mb-14">
          <p className="text-teal-400 text-xs tracking-[0.6em] uppercase mb-4 font-medium">{exo.tagline}</p>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white mb-6">
            {exo.title[0]} <span className="gradient-text">{exo.title[1]}</span>
          </h1>
          <div className="mb-4 h-20 flex items-center justify-center">
            {data?.total ? (
              <p className="text-6xl md:text-7xl font-black" style={{ color: "#2dd4bf", textShadow: "0 0 40px rgba(45,212,191,0.4)" }}>
                <CountUp value={data.total} locale={locale} />
              </p>
            ) : failed ? (
              <p className="text-4xl font-black text-slate-600">6,000+</p>
            ) : (
              <div className="w-48 h-14 rounded-2xl animate-pulse" style={{ backgroundColor: "rgba(45,212,191,0.1)" }} />
            )}
          </div>
          <p className="text-slate-400 max-w-xl mx-auto text-lg leading-relaxed">{exo.subtitle}</p>
          <p className="text-slate-600 text-xs mt-2">{exo.liveSource}</p>
        </motion.div>

        {/* Discovery method stats */}
        {data && data.methods.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="flex flex-wrap justify-center gap-3 mb-24">
            {data.methods.map((m) => (
              <div key={m.method} className="glass rounded-2xl px-5 py-3 text-center"
                style={{ border: "1px solid rgba(45,212,191,0.15)" }}>
                <p className="text-lg font-extrabold text-white">
                  {m.count.toLocaleString(locale)}
                  {data.total ? (
                    <span className="text-xs font-medium text-slate-500 ml-1.5">
                      {Math.round((m.count / data.total) * 100)}%
                    </span>
                  ) : null}
                </p>
                <p className="text-xs text-slate-500">
                  {exo.methods[m.method as keyof typeof exo.methods] ?? m.method}
                </p>
              </div>
            ))}
          </motion.div>
        )}

        {/* Featured worlds — immersive panels with real artist imagery */}
        <div className="mb-24">
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ duration: 0.6 }} className="mb-14">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-1 h-8 rounded-full" style={{ backgroundColor: "#2dd4bf" }} />
              <h2 className="text-3xl md:text-4xl font-extrabold text-white">{exo.featuredHeading}</h2>
            </div>
            <p className="text-slate-500 ml-4">{exo.featuredSub}</p>
          </motion.div>

          <div className="space-y-20">
            {FEATURED.map((p, i) => {
              const item = exo.items[p.id as keyof typeof exo.items];
              if (!item) return null;
              const tc = tempClass(p.tempK);
              const flip = i % 2 === 1;
              return (
                <motion.article key={p.id}
                  initial={{ opacity: 0, y: 36 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.6 }}
                  className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                  {/* Image */}
                  <div className={`relative rounded-3xl overflow-hidden group ${flip ? "lg:order-2" : ""}`}
                    style={{ border: `1px solid ${p.color}25`, boxShadow: `0 0 60px ${p.color}18` }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.img} alt={item.name}
                      className="w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                      style={{ aspectRatio: "16/10" }} loading={i > 1 ? "lazy" : undefined} />
                    <div className="absolute inset-0 pointer-events-none"
                      style={{ background: "linear-gradient(to top, rgba(3,7,18,0.55), transparent 35%)" }} />
                    <span className="absolute bottom-2.5 right-3.5 text-[10px] text-slate-400/80">{p.credit}</span>
                  </div>

                  {/* Facts */}
                  <div className={flip ? "lg:order-1" : ""}>
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <span className="text-xs px-3 py-1 rounded-full font-semibold"
                        style={{ backgroundColor: `${p.color}18`, color: p.color, border: `1px solid ${p.color}35` }}>
                        {item.type}
                      </span>
                      <span className="text-xs px-3 py-1 rounded-full font-mono"
                        style={{ backgroundColor: "rgba(255,255,255,0.05)", color: "#94a3b8" }}>
                        {item.distance}
                      </span>
                    </div>
                    <h3 className="text-3xl md:text-4xl font-black tracking-tight mb-4" style={{ color: p.color }}>
                      {item.name}
                    </h3>
                    <p className="text-slate-300 text-base md:text-lg leading-relaxed mb-6">{item.fact}</p>

                    {/* Stat tiles */}
                    <div className="grid grid-cols-3 gap-3 mb-6 max-w-md">
                      <div className="glass rounded-2xl px-3 py-3 text-center">
                        <p className="text-sm font-extrabold text-white">
                          {formatOrbit(p.orbitDays)} {exo.labels.days}
                        </p>
                        <p className="text-[10px] text-slate-500 mt-0.5">{exo.labels.orbit}</p>
                      </div>
                      <div className="glass rounded-2xl px-3 py-3 text-center">
                        <p className="text-sm font-extrabold" style={{ color: tc.color }}>
                          {p.tempK.toLocaleString(locale)} K
                        </p>
                        <p className="text-[10px] mt-0.5" style={{ color: `${tc.color}99` }}>{exo.tempBadge[tc.key]}</p>
                      </div>
                      <div className="glass rounded-2xl px-3 py-3 text-center">
                        <p className="text-sm font-extrabold text-white">
                          {p.radiusEarths.toLocaleString(locale, { maximumFractionDigits: 1 })}×🌍
                        </p>
                        <p className="text-[10px] text-slate-500 mt-0.5">{exo.labels.radius}</p>
                      </div>
                    </div>

                    {/* How long to get there */}
                    <p className="text-xs font-semibold text-slate-500 mb-2">{exo.modal.travelHeading}</p>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs px-3 py-1.5 rounded-full font-mono"
                        style={{ backgroundColor: "rgba(255,255,255,0.05)", color: "#cbd5e1" }}>
                        ⚡ {tt.vehicles.light}: {fmtYears(p.ly)} {tt.units.y}
                      </span>
                      <span className="text-xs px-3 py-1.5 rounded-full font-mono"
                        style={{ backgroundColor: "rgba(255,255,255,0.05)", color: "#cbd5e1" }}>
                        📡 {tt.vehicles.voyager}: {fmtYears(yearsAt(p.ly, VOYAGER_KMH))} {tt.units.y}
                      </span>
                      <Link
                        href={`/${lang}/travel-time${p.travelParam ? `?to=${p.travelParam}&by=voyager` : ""}`}
                        className="text-xs px-3 py-1.5 rounded-full font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                        style={{ backgroundColor: `${p.color}15`, color: p.color, border: `1px solid ${p.color}30` }}>
                        {exo.modal.travelCta}
                      </Link>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>
        </div>

        {/* Fresh discoveries (live) */}
        <div>
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ duration: 0.6 }} className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-1 h-8 rounded-full" style={{ backgroundColor: "#818cf8" }} />
              <h2 className="text-3xl md:text-4xl font-extrabold text-white">{exo.recentHeading}</h2>
            </div>
            <p className="text-slate-500 ml-4">{exo.recentSub}</p>
          </motion.div>

          {failed && (
            <p className="text-slate-500 text-sm ml-4">{exo.unavailable}</p>
          )}

          {!data && !failed && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-32 rounded-2xl animate-pulse" style={{ backgroundColor: "rgba(255,255,255,0.04)" }} />
              ))}
            </div>
          )}

          {data && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.recent.map((p, i) => {
                const tc = p.tempK != null ? tempClass(p.tempK) : null;
                return (
                  <motion.div key={p.name}
                    initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                    transition={{ delay: (i % 3) * 0.05, duration: 0.4 }}
                    className="glass rounded-2xl p-5"
                    style={{ border: "1px solid rgba(129,140,248,0.15)" }}>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-white text-sm">{p.name}</h3>
                        <p className="text-xs text-slate-500">{exo.labels.host}: {p.host}</p>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0"
                        style={{ backgroundColor: "rgba(129,140,248,0.15)", color: "#a5b4fc" }}>
                        {p.year}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-center">
                      <div className="rounded-lg py-1.5" style={{ backgroundColor: "rgba(255,255,255,0.04)" }}>
                        <p className="text-xs font-bold text-slate-200">{p.radiusEarths != null ? `${p.radiusEarths.toFixed(1)}⊕` : "—"}</p>
                        <p className="text-[10px] text-slate-600">{exo.labels.radius}</p>
                      </div>
                      <div className="rounded-lg py-1.5" style={{ backgroundColor: "rgba(255,255,255,0.04)" }}>
                        <p className="text-xs font-bold text-slate-200">
                          {p.orbitDays != null ? `${formatOrbit(p.orbitDays)} ${exo.labels.days}` : "—"}
                        </p>
                        <p className="text-[10px] text-slate-600">{exo.labels.orbit}</p>
                      </div>
                      <div className="rounded-lg py-1.5" style={{ backgroundColor: "rgba(255,255,255,0.04)" }}>
                        <p className="text-xs font-bold text-slate-200">{p.distanceLy != null ? p.distanceLy.toLocaleString(locale) : "—"}</p>
                        <p className="text-[10px] text-slate-600">{exo.labels.distanceLy}</p>
                      </div>
                      <div className="rounded-lg py-1.5" style={{ backgroundColor: "rgba(255,255,255,0.04)" }}>
                        <p className="text-xs font-bold" style={{ color: tc?.color ?? "#e2e8f0" }}>
                          {p.tempK != null ? `${p.tempK.toLocaleString(locale)} K` : "—"}
                        </p>
                        <p className="text-[10px] text-slate-600">
                          {tc ? exo.tempBadge[tc.key] : exo.labels.temp}
                        </p>
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-600 mt-2">
                      {exo.methods[p.method as keyof typeof exo.methods] ?? p.method}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
