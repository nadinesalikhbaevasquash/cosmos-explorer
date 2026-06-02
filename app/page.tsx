"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import Nav from "./components/Nav";
import { PLANETS, MOONS, STARS, GALAXIES, BLACK_HOLES } from "./data/space";

// ── Starfield ─────────────────────────────────────────────────────────────────

function Starfield() {
  const [stars, setStars] = useState<
    { id: number; x: number; y: number; size: number; delay: number; duration: number }[]
  >([]);

  useEffect(() => {
    setStars(
      Array.from({ length: 220 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 2.2 + 0.4,
        delay: Math.random() * 6,
        duration: Math.random() * 4 + 2,
      }))
    );
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Deep nebula glow blobs */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #6366f1, transparent 70%)", filter: "blur(60px)" }} />
        <div className="absolute top-1/2 right-1/4 w-80 h-80 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #c084fc, transparent 70%)", filter: "blur(60px)" }} />
        <div className="absolute bottom-1/4 left-1/3 w-64 h-64 rounded-full opacity-8"
          style={{ background: "radial-gradient(circle, #67e8f9, transparent 70%)", filter: "blur(50px)" }} />
      </div>
      {stars.map((s) => (
        <div key={s.id} className="star absolute rounded-full bg-white"
          style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.size, height: s.size,
            animationDelay: `${s.delay}s`, animationDuration: `${s.duration}s` }} />
      ))}
    </div>
  );
}

// ── Photo card ────────────────────────────────────────────────────────────────

type SpaceItem = {
  name: string;
  emoji: string;
  color: string;
  glowColor: string;
  bgGradient: string;
  photoUrl: string;
  [key: string]: string | number;
};

function PhotoCard({ item, onClick }: { item: SpaceItem; onClick: () => void }) {
  const [imgError, setImgError] = useState(false);

  return (
    <motion.button
      onClick={onClick}
      className="photo-card w-full text-left focus:outline-none group"
      whileHover={{ y: -6, scale: 1.01 }}
      transition={{ duration: 0.25 }}
    >
      {/* Photo / gradient header */}
      <div className="relative w-full overflow-hidden" style={{ aspectRatio: "4/3" }}>
        {!imgError ? (
          <Image
            src={item.photoUrl}
            alt={item.name}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            onError={() => setImgError(true)}
            unoptimized
          />
        ) : (
          <div className="absolute inset-0" style={{ background: item.bgGradient }} />
        )}
        {/* Overlay gradient */}
        <div className="absolute inset-0"
          style={{ background: "linear-gradient(to top, rgba(3,7,18,0.95) 0%, rgba(3,7,18,0.3) 50%, transparent 100%)" }} />
        {/* Top badge */}
        <span className="absolute top-3 right-3 text-xs px-2 py-0.5 rounded-full font-medium backdrop-blur-sm"
          style={{ backgroundColor: `${item.color}25`, color: item.color, border: `1px solid ${item.color}40` }}>
          {String(item.type || (item.planet ? `Moon of ${item.planet}` : ""))}
        </span>
      </div>

      {/* Card body */}
      <div className="p-4">
        <h3 className="text-base font-bold mb-1" style={{ color: item.color }}>{item.name}</h3>
        {/* Two quick stats */}
        <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 mb-3">
          {Object.entries(item)
            .filter(([k]) => !["name","emoji","color","glowColor","bgGradient","photoUrl","type","planet","fact"].includes(k))
            .slice(0, 2)
            .map(([k, v]) => (
              <div key={k} className="text-xs text-slate-500 truncate">
                <span className="text-slate-400">{String(v)}</span>
              </div>
            ))}
        </div>
        <span className="text-xs font-medium" style={{ color: item.color }}>Explore →</span>
      </div>
    </motion.button>
  );
}

// ── Detail Modal ──────────────────────────────────────────────────────────────

function DetailModal({ item, fields, onClose }: {
  item: SpaceItem;
  fields: { label: string; key: string }[];
  onClose: () => void;
}) {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
      style={{ backgroundColor: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)" }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="relative w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl"
        style={{ border: `1px solid ${item.color}30`, backgroundColor: "#0d1117" }}
        initial={{ scale: 0.88, y: 40, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.88, y: 40, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 28 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header image */}
        <div className="relative h-52 overflow-hidden">
          {!imgError ? (
            <Image src={item.photoUrl} alt={item.name} fill className="object-cover" onError={() => setImgError(true)} unoptimized />
          ) : (
            <div className="absolute inset-0" style={{ background: item.bgGradient }} />
          )}
          <div className="absolute inset-0"
            style={{ background: "linear-gradient(to top, #0d1117 0%, rgba(13,17,23,0.4) 50%, transparent 100%)" }} />
          <button onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors"
            style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>✕</button>
        </div>

        <div className="p-6 -mt-8 relative">
          <div className="mb-5">
            <h2 className="text-3xl font-extrabold" style={{ color: item.color }}>{item.name}</h2>
            <p className="text-slate-400 text-sm mt-0.5">
              {String(item.type || (item.planet ? `Moon of ${item.planet}` : ""))}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-5">
            {fields.map(({ label, key }) => (
              <div key={key} className="rounded-xl px-3 py-2.5"
                style={{ backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <p className="text-xs text-slate-500 mb-0.5">{label}</p>
                <p className="text-sm font-semibold text-slate-200">{String(item[key] ?? "—")}</p>
              </div>
            ))}
          </div>

          {item.fact && (
            <div className="rounded-2xl p-4"
              style={{ background: `linear-gradient(135deg, ${item.color}12, ${item.color}06)`, border: `1px solid ${item.color}25` }}>
              <p className="text-xs uppercase tracking-widest mb-2" style={{ color: item.color }}>Fun Fact</p>
              <p className="text-slate-300 text-sm leading-relaxed">{String(item.fact)}</p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Section ───────────────────────────────────────────────────────────────────

function Section<T extends SpaceItem>({
  id, title, subtitle, accent, items, fields, columns = 4,
}: {
  id: string; title: string; subtitle: string; accent: string;
  items: T[]; fields: { label: string; key: string }[]; columns?: number;
}) {
  const [selected, setSelected] = useState<T | null>(null);
  const colClass = {
    4: "grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    2: "grid-cols-1 sm:grid-cols-2",
  }[columns] ?? "grid-cols-2 md:grid-cols-4";

  return (
    <section id={id} className="relative max-w-7xl mx-auto px-6 pb-28 section-glow">
      {/* Section colour blob */}
      <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[600px] h-40 rounded-full pointer-events-none opacity-20"
        style={{ background: `radial-gradient(ellipse, ${accent}, transparent 70%)`, filter: "blur(40px)" }} />

      <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }} transition={{ duration: 0.6 }} className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-1 h-8 rounded-full" style={{ backgroundColor: accent }} />
          <h2 className="text-4xl font-extrabold text-white">{title}</h2>
        </div>
        <p className="text-slate-500 ml-4">{subtitle}</p>
      </motion.div>

      <div className={`grid gap-5 ${colClass}`}>
        {items.map((item, i) => (
          <motion.div key={item.name}
            initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ delay: i * 0.07, duration: 0.45 }}>
            <PhotoCard item={item} onClick={() => setSelected(item)} />
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {selected && (
          <DetailModal item={selected} fields={fields} onClose={() => setSelected(null)} />
        )}
      </AnimatePresence>
    </section>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { id: "planets",     label: "Planets",     icon: "🪐", count: "8 planets",      color: "#f97316", href: "#planets" },
  { id: "moons",       label: "Moons",       icon: "🌕", count: "290+ moons",     color: "#94a3b8", href: "#moons" },
  { id: "stars",       label: "Stars",       icon: "⭐", count: "400B in Milky Way",color: "#fbbf24", href: "#stars" },
  { id: "galaxies",    label: "Galaxies",    icon: "🌌", count: "2T+ galaxies",   color: "#818cf8", href: "#galaxies" },
  { id: "black-holes", label: "Black Holes", icon: "🕳️", count: "Millions est.",  color: "#c084fc", href: "#black-holes" },
  { id: "missions",    label: "Missions",    icon: "🚀", count: "1,000+ launched",color: "#34d399", href: "/missions" },
];

export default function Home() {
  return (
    <>
      <Starfield />
      <div className="relative z-10 min-h-screen">
        <Nav />

        {/* ── Hero ─────────────────────────────────────────────────── */}
        <section className="relative max-w-7xl mx-auto px-6 pt-20 pb-24 text-center overflow-hidden">
          {/* Hero glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-80 pointer-events-none"
            style={{ background: "radial-gradient(ellipse, rgba(99,102,241,0.18) 0%, rgba(192,132,252,0.08) 50%, transparent 70%)", filter: "blur(1px)" }} />

          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease: "easeOut" }}>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2, duration: 0.6 }}
              className="text-indigo-400 text-xs tracking-[0.6em] uppercase mb-8 font-medium">
              Your gateway to the cosmos
            </motion.p>

            <h1 className="text-6xl sm:text-7xl md:text-[6rem] font-black leading-none tracking-tighter mb-6">
              <span className="text-white">Explore the</span>{" "}
              <span className="gradient-text">Universe</span>
            </h1>

            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.7 }}
              className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
              Dive into planets, moons, stars, galaxies, black holes, and the bold missions
              humanity has launched into the unknown.
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.6 }}
              className="flex flex-wrap items-center justify-center gap-3">
              <a href="#planets"
                className="px-7 py-3 rounded-full text-white font-semibold text-sm transition-all hover:scale-105 hover:shadow-lg"
                style={{ background: "linear-gradient(135deg, #6366f1, #c084fc)", boxShadow: "0 0 24px rgba(99,102,241,0.35)" }}>
                Start Exploring
              </a>
              <Link href="/solar-system"
                className="px-7 py-3 rounded-full font-semibold text-sm transition-all hover:scale-105"
                style={{ border: "1px solid rgba(99,102,241,0.4)", color: "#a5b4fc", backgroundColor: "rgba(99,102,241,0.08)" }}>
                🌍 Solar System
              </Link>
              <Link href="/missions"
                className="px-7 py-3 rounded-full font-semibold text-sm transition-all hover:scale-105"
                style={{ border: "1px solid rgba(255,255,255,0.1)", color: "#94a3b8", backgroundColor: "rgba(255,255,255,0.03)" }}>
                🚀 Missions
              </Link>
            </motion.div>
          </motion.div>

          {/* Orbiting dots */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9, duration: 1 }}
            className="mt-16 flex justify-center gap-10 select-none pointer-events-none">
            {[["#f97316",5],["#818cf8",4],["#34d399",5],["#f87171",4],["#fbbf24",5],["#c084fc",4]].map(([color, i], idx) => (
              <div key={String(color)} className="rounded-full"
                style={{
                  width: Number(i), height: Number(i),
                  background: String(color),
                  boxShadow: `0 0 12px ${color}, 0 0 24px ${color}60`,
                  animation: `float 5s ease-in-out ${idx * 0.7}s infinite`,
                  opacity: 0.7,
                }} />
            ))}
          </motion.div>
        </section>

        {/* ── Category grid ────────────────────────────────────────── */}
        <section className="max-w-7xl mx-auto px-6 pb-24">
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.6 }} className="mb-10">
            <h2 className="text-3xl font-extrabold text-white mb-1">What would you like to explore?</h2>
            <p className="text-slate-500">Pick a category and begin your journey.</p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {CATEGORIES.map((cat, i) => (
              <motion.a key={cat.id} href={cat.href}
                initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.07, duration: 0.45 }}
                whileHover={{ y: -6, scale: 1.03 }}
                className="glass glass-hover rounded-2xl p-5 flex flex-col items-center text-center gap-2 no-underline"
                style={{ border: `1px solid ${cat.color}20` }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                  style={{ background: `${cat.color}18`, boxShadow: `0 0 16px ${cat.color}30` }}>
                  {cat.icon}
                </div>
                <p className="text-sm font-bold text-white">{cat.label}</p>
                <p className="text-xs" style={{ color: cat.color }}>{cat.count}</p>
              </motion.a>
            ))}
          </div>
        </section>

        {/* ── Feature pages banner ──────────────────────────────────── */}
        <section className="max-w-7xl mx-auto px-6 pb-24">
          <div className="grid sm:grid-cols-2 gap-5">
            {[
              {
                href: "/solar-system",
                gradient: "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(192,132,252,0.08))",
                border: "rgba(99,102,241,0.3)",
                accent: "#818cf8",
                emoji: "🌍",
                title: "Solar System Visualizer",
                desc: "Watch all 8 planets orbit the Sun in real time with accurate relative speeds. Click any planet for facts.",
                tag: "Interactive",
              },
              {
                href: "/missions",
                gradient: "linear-gradient(135deg, rgba(52,211,153,0.12), rgba(16,185,129,0.06))",
                border: "rgba(52,211,153,0.25)",
                accent: "#34d399",
                emoji: "🚀",
                title: "Missions Timeline",
                desc: "Explore 70 years of humanity's greatest space adventures — from Sputnik 1957 to the James Webb Telescope.",
                tag: "11 missions",
              },
            ].map((card) => (
              <Link key={card.href} href={card.href} className="no-underline">
                <motion.div className="rounded-2xl p-6 h-full cursor-pointer"
                  style={{ background: card.gradient, border: `1px solid ${card.border}` }}
                  whileHover={{ y: -5, scale: 1.01 }}
                  transition={{ duration: 0.25 }}>
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-5xl">{card.emoji}</span>
                    <span className="text-xs px-2.5 py-1 rounded-full font-medium"
                      style={{ backgroundColor: `${card.accent}20`, color: card.accent }}>{card.tag}</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{card.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed mb-4">{card.desc}</p>
                  <span className="text-sm font-semibold" style={{ color: card.accent }}>Open →</span>
                </motion.div>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Content sections ─────────────────────────────────────── */}

        <Section id="planets" title="Our Solar System" subtitle="Click any planet to learn more."
          accent="#f97316" items={PLANETS} columns={4}
          fields={[
            { label: "Diameter",          key: "diameter" },
            { label: "Moons",             key: "moons" },
            { label: "Day Length",        key: "dayLength" },
            { label: "Year Length",       key: "yearLength" },
            { label: "Temperature",       key: "tempRange" },
            { label: "Distance from Sun", key: "distanceFromSun" },
          ]} />

        <Section id="moons" title="Notable Moons" subtitle="Over 290 moons orbit in our solar system. These are the most remarkable."
          accent="#94a3b8" items={MOONS} columns={3}
          fields={[
            { label: "Diameter",              key: "diameter" },
            { label: "Distance from Planet",  key: "distanceFromPlanet" },
            { label: "Orbital Period",        key: "orbitalPeriod" },
            { label: "Discovered",            key: "discovered" },
          ]} />

        <Section id="stars" title="Stars" subtitle="From red dwarfs to blue supergiants — stars come in extraordinary variety."
          accent="#fbbf24" items={STARS} columns={3}
          fields={[
            { label: "Type",                key: "type" },
            { label: "Diameter",            key: "diameter" },
            { label: "Temperature",         key: "temperature" },
            { label: "Distance from Earth", key: "distanceFromEarth" },
            { label: "Mass",                key: "mass" },
            { label: "Age",                 key: "age" },
          ]} />

        <Section id="galaxies" title="Galaxies" subtitle="Vast islands of billions of stars. The observable universe contains at least 2 trillion."
          accent="#818cf8" items={GALAXIES} columns={2}
          fields={[
            { label: "Type",                key: "type" },
            { label: "Diameter",            key: "diameter" },
            { label: "Stars",               key: "stars" },
            { label: "Distance from Earth", key: "distanceFromEarth" },
            { label: "Age",                 key: "age" },
          ]} />

        <Section id="black-holes" title="Black Holes" subtitle="Where gravity crushes everything beyond escape. Not even light returns."
          accent="#c084fc" items={BLACK_HOLES} columns={2}
          fields={[
            { label: "Type",                key: "type" },
            { label: "Mass",                key: "mass" },
            { label: "Diameter",            key: "diameter" },
            { label: "Distance from Earth", key: "distanceFromEarth" },
            { label: "Location",            key: "location" },
          ]} />

        {/* ── Did You Know ─────────────────────────────────────────── */}
        <section className="py-20 mb-0 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: "linear-gradient(to bottom, transparent, rgba(99,102,241,0.05), transparent)" }} />
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-3xl font-extrabold text-white mb-2 text-center">Did You Know?</h2>
            <p className="text-slate-500 text-center mb-10">A few of the universe's most jaw-dropping facts.</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[
                { icon: "☀️", title: "The Sun's mass", fact: "The Sun contains 99.86% of all the mass in our solar system.", color: "#fbbf24" },
                { icon: "🌌", title: "Milky Way size", fact: "The Milky Way galaxy is about 100,000 light-years across.", color: "#818cf8" },
                { icon: "⚫", title: "Sagittarius A*", fact: "Our galaxy's central black hole weighs 4 million times the mass of the Sun.", color: "#c084fc" },
                { icon: "🚀", title: "Voyager 1", fact: "Launched in 1977, Voyager 1 is now over 24 billion kilometres from Earth.", color: "#34d399" },
              ].map(({ icon, title, fact, color }) => (
                <motion.div key={title}
                  initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }} transition={{ duration: 0.5 }}
                  className="rounded-2xl p-6 glass"
                  style={{ border: `1px solid ${color}20` }}>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4"
                    style={{ background: `${color}15`, boxShadow: `0 0 16px ${color}30` }}>
                    {icon}
                  </div>
                  <p className="text-sm font-bold text-white mb-2">{title}</p>
                  <p className="text-slate-400 text-sm leading-relaxed">{fact}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Footer ───────────────────────────────────────────────── */}
        <footer className="py-12 border-t border-white/5">
          <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">🔭</span>
              <span className="font-bold text-white">CosmosExplorer</span>
              <span className="text-slate-600 text-sm ml-2">· Phase 2</span>
            </div>
            <div className="flex gap-6 text-sm">
              {[["Home", "/"], ["Solar System", "/solar-system"], ["Missions", "/missions"]].map(([label, href]) => (
                <Link key={href} href={href} className="text-slate-500 hover:text-slate-300 transition-colors">{label}</Link>
              ))}
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
