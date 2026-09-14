"use client";

/**
 * The reference library: every planet, moon, star, galaxy and black hole.
 *
 * This used to live on the home page under "What would you like to explore?".
 * That question only works if you already know the answer, and it meant the landing
 * page and the library were the same page, so the landing had nothing of its own to
 * say. Crossfire's landing is a pitch that exists nowhere else in the product; this
 * split gives AstraNova the same shape.
 *
 * The anchors moved with it, so the nav points at /topics#planets now.
 */

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useDict } from "@/app/hooks/useDict";
import Glyph from "@/app/components/Glyph";
import { EarthGlobe, Rocket, Planet, Moon, SunStar, Galaxy, BlackHole, Satellite } from "@/app/components/SpaceCast";
import { PLANETS, MOONS, STARS, GALAXIES, BLACK_HOLES } from "@/app/data/space";

const CATEGORY_ICONS = [Planet, Moon, SunStar, Galaxy, BlackHole, Satellite];
const CATEGORY_COLORS = ["#e0782f", "#94a3b8", "#e2b43d", "#7e88ec", "#b884ed", "#34d399"];
const CATEGORY_HREFS = (lang: string) => [
  `/${lang}/topics#planets`, `/${lang}/topics#moons`, `/${lang}/topics#stars`,
  `/${lang}/topics#galaxies`, `/${lang}/topics#black-holes`, `/${lang}/missions`,
];

// ── Types ─────────────────────────────────────────────────────────────────────

type SpaceItem = {
  name: string; emoji: string; color: string; glowColor: string;
  bgGradient: string; photoUrl: string; [key: string]: string | number;
};

// ── Photo card ────────────────────────────────────────────────────────────────

function PhotoCard({ item, label, onClick }: { item: SpaceItem; label: string; onClick: () => void }) {
  const [imgError, setImgError] = useState(false);

  return (
    <motion.button onClick={onClick}
      className="photo-card w-full text-left group"
      whileHover={{ y: -6, scale: 1.01 }} transition={{ duration: 0.25 }}>
      <div className="relative w-full overflow-hidden" style={{ aspectRatio: "4/3" }}>
        {!imgError ? (
          <Image src={item.photoUrl} alt={item.name} fill sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            onError={() => setImgError(true)} unoptimized />
        ) : (
          <div className="absolute inset-0" style={{ background: item.bgGradient }} />
        )}
        <div className="absolute inset-0"
          style={{ background: "linear-gradient(to top, rgba(3,7,18,0.95) 0%, rgba(3,7,18,0.3) 50%, transparent 100%)" }} />
        <span className="absolute top-3 right-3 text-xs px-2 py-0.5 rounded-full font-medium backdrop-blur-sm"
          style={{ backgroundColor: `${item.color}25`, color: item.color, border: `1px solid ${item.color}40` }}>
          {String(item.type || (item.planet ? item.planet : ""))}
        </span>
      </div>
      <div className="p-4">
        <h3 className="text-base font-bold mb-1" style={{ color: item.color }}>{item.name}</h3>
        <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 mb-3">
          {Object.entries(item)
            .filter(([k]) => !["name","emoji","color","glowColor","bgGradient","photoUrl","type","planet","fact"].includes(k))
            .slice(0, 2)
            .map(([, v]) => (
              <div key={String(v)} className="text-[15px] text-slate-400 truncate">{String(v)}</div>
            ))}
        </div>
        <span className="text-xs font-medium" style={{ color: item.color }}>{label}</span>
      </div>
    </motion.button>
  );
}

// ── Detail Modal ──────────────────────────────────────────────────────────────

function DetailModal({ item, fields, funFactLabel, onClose }: {
  item: SpaceItem; fields: { label: string; key: string }[];
  funFactLabel: string; onClose: () => void;
}) {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
      style={{ backgroundColor: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)" }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}>
      <motion.div className="relative w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl"
        style={{ border: `1px solid ${item.color}30`, backgroundColor: "#0d1117" }}
        initial={{ scale: 0.88, y: 40, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.88, y: 40, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 28 }}
        onClick={(e) => e.stopPropagation()}>
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
            <p className="text-slate-400 text-sm mt-0.5">{String(item.type || (item.planet ? item.planet : ""))}</p>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-5">
            {fields.map(({ label, key }) => (
              <div key={key} className="rounded-xl px-3 py-2.5"
                style={{ backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <p className="text-[15px] text-slate-500 mb-0.5">{label}</p>
                <p className="text-sm font-semibold text-slate-200">{String(item[key] ?? "—")}</p>
              </div>
            ))}
          </div>
          {item.fact && (
            <div className="rounded-2xl p-4"
              style={{ background: `linear-gradient(135deg, ${item.color}12, ${item.color}06)`, border: `1px solid ${item.color}25` }}>
              <p className="text-xs uppercase tracking-widest mb-2" style={{ color: item.color }}>{funFactLabel}</p>
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
  id, title, subtitle, accent, items, fields, columns = 4, exploreLabel, funFactLabel,
}: {
  id: string; title: string; subtitle: string; accent: string; exploreLabel: string; funFactLabel: string;
  items: T[]; fields: { label: string; key: string }[]; columns?: number;
}) {
  const [selected, setSelected] = useState<T | null>(null);
  const colClass = ({ 4: "grid-cols-2 md:grid-cols-3 lg:grid-cols-4", 3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3", 2: "grid-cols-1 sm:grid-cols-2" } as Record<number,string>)[columns] ?? "grid-cols-2 md:grid-cols-4";

  return (
    <section id={id} className="relative max-w-7xl mx-auto px-6 pb-28 section-glow">
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
            <PhotoCard item={item} label={exploreLabel} onClick={() => setSelected(item)} />
          </motion.div>
        ))}
      </div>
      <AnimatePresence>
        {selected && (
          <DetailModal item={selected} fields={fields} funFactLabel={funFactLabel} onClose={() => setSelected(null)} />
        )}
      </AnimatePresence>
    </section>
  );
}

export default function TopicContent() {
  const dict = useDict();
  const params = useParams();
  const lang = (params?.lang as string) || "en";

  const planets = PLANETS.map(p => ({ ...p, ...dict.planetData[p.name as keyof typeof dict.planetData] }));
  const moons   = MOONS.map(m => {
    const ov = dict.moonData[m.name as keyof typeof dict.moonData];
    return ov ? { ...m, ...ov } : m;
  });
  const stars   = STARS.map(s => {
    const ov = dict.starData[s.name as keyof typeof dict.starData];
    return ov ? { ...s, ...ov } : s;
  });
  const galaxies = GALAXIES.map(g => {
    const ov = dict.galaxyData[g.name as keyof typeof dict.galaxyData];
    return ov ? { ...g, ...ov } : g;
  });
  const blackHoles = BLACK_HOLES.map(b => {
    const ov = dict.blackHoleData[b.name as keyof typeof dict.blackHoleData];
    return ov ? { ...b, ...ov } : b;
  });

  return (
    <>
        {/* Category grid */}
        <section className="max-w-7xl mx-auto px-6 pb-24">
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.6 }} className="mb-10">
            <h2 className="text-3xl font-extrabold text-white mb-1">{dict.categories.heading}</h2>
            <p className="text-slate-500">{dict.categories.subheading}</p>
          </motion.div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {dict.categories.items.map((cat, i) => (
              <motion.a key={cat.label} href={CATEGORY_HREFS(lang)[i]}
                initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.07, duration: 0.45 }}
                whileHover={{ y: -6, scale: 1.03 }}
                className="glass glass-hover rounded-2xl p-5 flex flex-col items-center text-center gap-2 no-underline"
                style={{ border: `1px solid ${CATEGORY_COLORS[i]}20` }}>
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                  style={{ background: `${CATEGORY_COLORS[i]}18`, boxShadow: `0 0 16px ${CATEGORY_COLORS[i]}30` }}>
                  {(() => { const Icon = CATEGORY_ICONS[i]; return <Icon className="h-11 w-11" />; })()}
                </div>
                <p className="text-[15px] font-bold text-white">{cat.label}</p>
                <p className="text-[13px]" style={{ color: CATEGORY_COLORS[i] }}>{cat.count}</p>
              </motion.a>
            ))}
          </div>
        </section>

        {/* Feature banners */}
        <section className="max-w-7xl mx-auto px-6 pb-24">
          <div className="grid sm:grid-cols-2 gap-5">
            {[
              { href: `/${lang}/solar-system`, gradient: "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(192,132,252,0.08))", border: "rgba(99,102,241,0.3)", accent: "#7e88ec" },
              { href: `/${lang}/missions`,     gradient: "linear-gradient(135deg, rgba(52,211,153,0.12), rgba(16,185,129,0.06))",  border: "rgba(52,211,153,0.25)", accent: "#34d399" },
            ].map((card, i) => (
              <Link key={card.href} href={card.href} className="no-underline">
                <motion.div className="rounded-2xl p-6 h-full cursor-pointer"
                  style={{ background: card.gradient, border: `1px solid ${card.border}` }}
                  whileHover={{ y: -5, scale: 1.01 }} transition={{ duration: 0.25 }}>
                  <div className="flex items-start justify-between mb-3">
                    {i === 0 ? <EarthGlobe className="h-16 w-16" /> : <Rocket className="h-16 w-16" />}
                    <span className="text-[12px] px-2.5 py-1 rounded-full font-medium"
                      style={{ backgroundColor: `${card.accent}20`, color: card.accent }}>{dict.features[i].tag}</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{dict.features[i].title}</h3>
                  <p className="text-slate-400 text-[15px] leading-relaxed mb-4">{dict.features[i].desc}</p>
                  <span className="text-sm font-semibold" style={{ color: card.accent }}>{dict.ui.open}</span>
                </motion.div>
              </Link>
            ))}
          </div>
        </section>

        {/* Content sections */}
        <Section id="planets" title={dict.sections.planets.title} subtitle={dict.sections.planets.subtitle}
          accent="#e0782f" items={planets} columns={4} exploreLabel={dict.ui.explore} funFactLabel={dict.ui.funFact}
          fields={[
            { label: dict.labels.diameter,          key: "diameter" },
            { label: dict.labels.moons,              key: "moons" },
            { label: dict.labels.dayLength,          key: "dayLength" },
            { label: dict.labels.yearLength,         key: "yearLength" },
            { label: dict.labels.temperature,        key: "tempRange" },
            { label: dict.labels.distanceFromSun,    key: "distanceFromSun" },
          ]} />

        <Section id="moons" title={dict.sections.moons.title} subtitle={dict.sections.moons.subtitle}
          accent="#94a3b8" items={moons} columns={3} exploreLabel={dict.ui.explore} funFactLabel={dict.ui.funFact}
          fields={[
            { label: dict.labels.diameter,           key: "diameter" },
            { label: dict.labels.distanceFromPlanet, key: "distanceFromPlanet" },
            { label: dict.labels.orbitalPeriod,      key: "orbitalPeriod" },
            { label: dict.labels.discovered,         key: "discovered" },
          ]} />

        <Section id="stars" title={dict.sections.stars.title} subtitle={dict.sections.stars.subtitle}
          accent="#e2b43d" items={stars} columns={3} exploreLabel={dict.ui.explore} funFactLabel={dict.ui.funFact}
          fields={[
            { label: dict.labels.type,               key: "type" },
            { label: dict.labels.diameter,           key: "diameter" },
            { label: dict.labels.temperature,        key: "temperature" },
            { label: dict.labels.distanceFromEarth,  key: "distanceFromEarth" },
            { label: dict.labels.mass,               key: "mass" },
            { label: dict.labels.age,                key: "age" },
          ]} />

        <Section id="galaxies" title={dict.sections.galaxies.title} subtitle={dict.sections.galaxies.subtitle}
          accent="#7e88ec" items={galaxies} columns={2} exploreLabel={dict.ui.explore} funFactLabel={dict.ui.funFact}
          fields={[
            { label: dict.labels.type,               key: "type" },
            { label: dict.labels.diameter,           key: "diameter" },
            { label: dict.labels.stars,              key: "stars" },
            { label: dict.labels.distanceFromEarth,  key: "distanceFromEarth" },
            { label: dict.labels.age,                key: "age" },
          ]} />

        <Section id="black-holes" title={dict.sections.blackHoles.title} subtitle={dict.sections.blackHoles.subtitle}
          accent="#b884ed" items={blackHoles} columns={2} exploreLabel={dict.ui.explore} funFactLabel={dict.ui.funFact}
          fields={[
            { label: dict.labels.type,               key: "type" },
            { label: dict.labels.mass,               key: "mass" },
            { label: dict.labels.diameter,           key: "diameter" },
            { label: dict.labels.distanceFromEarth,  key: "distanceFromEarth" },
            { label: dict.labels.location,           key: "location" },
          ]} />
    </>
  );
}
