"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import Nav from "@/app/components/Nav";
import TodaySection from "@/app/components/TodaySection";
import Glyph from "@/app/components/Glyph";
import WhyAstraNova from "@/app/components/WhyAstraNova";
import LearningPath from "@/app/components/LearningPath";
import PracticeSection from "@/app/components/PracticeSection";
import { Telescope, Rocket, Satellite, Astronaut, Planet, Moon, SunStar, Ufo, Galaxy, BlackHole, EarthGlobe } from "@/app/components/SpaceCast";
import { useDict } from "@/app/hooks/useDict";
import { PLANETS, MOONS, STARS, GALAXIES, BLACK_HOLES } from "@/app/data/space";

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
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #6b6ee9, transparent 70%)", filter: "blur(60px)" }} />
        <div className="absolute top-1/2 right-1/4 w-80 h-80 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #b884ed, transparent 70%)", filter: "blur(60px)" }} />
        <div className="absolute bottom-1/4 left-1/3 w-64 h-64 rounded-full opacity-8"
          style={{ background: "radial-gradient(circle, #76ddea, transparent 70%)", filter: "blur(50px)" }} />
      </div>
      {stars.map((s) => (
        <div key={s.id} className="star absolute rounded-full bg-white"
          style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.size, height: s.size,
            animationDelay: `${s.delay}s`, animationDuration: `${s.duration}s` }} />
      ))}
    </div>
  );
}



// ── Page ──────────────────────────────────────────────────────────────────────

// Animated cast rather than emoji. Emoji render differently on every device,
// cannot take the site's palette, and cannot move.
const CATEGORY_ICONS = [Planet, Moon, SunStar, Galaxy, BlackHole, Satellite];
const CATEGORY_COLORS = ["#e0782f", "#94a3b8", "#e2b43d", "#7e88ec", "#b884ed", "#34d399"];
const CATEGORY_HREFS = (lang: string) => [
  `/${lang}/#planets`, `/${lang}/#moons`, `/${lang}/#stars`,
  `/${lang}/#galaxies`, `/${lang}/#black-holes`, `/${lang}/missions`,
];

export default function Home() {
  const dict  = useDict();
  const params = useParams();
  const lang  = (params?.lang as string) || "en";

  // Merge locale overrides into base space data
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
      <Starfield />
      <div className="relative z-10 min-h-screen">
        <Nav />

        {/* Hero */}
        <section className="relative max-w-7xl mx-auto px-6 pt-20 pb-24 text-center overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-80 pointer-events-none"
            style={{ background: "radial-gradient(ellipse, rgba(99,102,241,0.18) 0%, rgba(192,132,252,0.08) 50%, transparent 70%)", filter: "blur(1px)" }} />
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1 }}>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2, duration: 0.6 }}
              className="text-indigo-400 text-[13px] tracking-[0.5em] uppercase mb-8 font-semibold">
              {dict.hero.tagline}
            </motion.p>
            <h1 className="text-6xl sm:text-7xl md:text-[6rem] font-black leading-none tracking-tighter mb-6">
              <span className="text-white">{dict.hero.title[0]}</span>{" "}
              <span className="gradient-text">{dict.hero.title[1]}</span>
            </h1>
            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.7 }}
              className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
              {dict.hero.subtitle}
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.6 }}
              className="flex flex-wrap items-center justify-center gap-3">
              <a href={`/${lang}/#planets`}
                className="an-sweep-host px-8 py-3.5 rounded-full text-white font-semibold text-[15px] transition-all hover:scale-105"
                style={{ background: "linear-gradient(135deg, #6b6ee9, #b884ed)", boxShadow: "0 0 24px rgba(99,102,241,0.35)" }}>
                {dict.hero.cta[0]}
              </a>
              <Link href={`/${lang}/quiz`}
                className="px-8 py-3.5 rounded-full font-semibold text-[15px] transition-all hover:scale-105"
                style={{ border: "1px solid rgba(99,102,241,0.4)", color: "#a1aff1", backgroundColor: "rgba(99,102,241,0.08)" }}>
                {dict.hero.cta[1]}
              </Link>
              <Link href={`/${lang}/solar-system`}
                className="px-8 py-3.5 rounded-full font-semibold text-[15px] transition-all hover:scale-105"
                style={{ border: "1px solid rgba(255,255,255,0.1)", color: "#94a3b8", backgroundColor: "rgba(255,255,255,0.03)" }}>
                {dict.hero.cta[2]}
              </Link>
            </motion.div>
          </motion.div>
          {/* The cast.
              Six tiny dots used to sit here, which was a weak way to end the hero.
              Now it is an actual scene: the telescope is the mascot and scans the
              sky, and the rest of the cast floats around it, every one on its own
              timing so nothing reads as a row of spinners. */}
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8, duration: 1 }}
            className="relative mt-14 h-[300px] sm:h-[360px] select-none pointer-events-none">

            {/* orbit rings behind the scene */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="an-spin rounded-full border border-indigo-400/10" style={{ width: 330, height: 330 }} />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="an-spin-rev rounded-full border border-purple-400/10" style={{ width: 460, height: 460 }} />
            </div>

            {/* the mascot, big */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <Telescope className="h-56 w-56 sm:h-72 sm:w-72" title="Nova, the AstraNova telescope" />
            </div>

            {/* the supporting cast, placed around it */}
            <Rocket    className="absolute left-[8%]  top-[6%]   h-20 w-20 sm:h-24 sm:w-24" />
            <Satellite className="absolute right-[6%] top-[2%]   h-24 w-24 sm:h-28 sm:w-28" />
            <Planet    className="absolute right-[3%] bottom-[4%] h-24 w-24 sm:h-28 sm:w-28" />
            <Astronaut className="absolute left-[2%]  bottom-[6%] h-20 w-20 sm:h-24 sm:w-24" />
            <Moon      className="absolute left-[26%] bottom-[0%] h-14 w-14 sm:h-16 sm:w-16 hidden sm:block" />
            <SunStar   className="absolute right-[27%] top-[0%]  h-14 w-14 sm:h-16 sm:w-16 hidden sm:block" />
            <Ufo       className="absolute left-[44%] top-[-4%]  h-16 w-16 hidden lg:block an-float-b" />
          </motion.div>
        </section>

        {/* Space today: NASA picture of the day + daily quiz */}
        <TodaySection />

        {/* The spine of the site: a guided route, then a place to test yourself.
            Both sit above the category grid on purpose — the grid only helps if you
            already know what you are looking for, and a first-time visitor doesn't. */}
        <LearningPath />
        <PracticeSection />

        {/* Why AstraNova — the landing page's own argument, which exists nowhere
            else in the product. This is what the category grid used to occupy. */}
        <WhyAstraNova />

        {/* Did You Know */}
        <section className="py-20 mb-0 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: "linear-gradient(to bottom, transparent, rgba(99,102,241,0.05), transparent)" }} />
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-3xl font-extrabold text-white mb-2 text-center">{dict.didYouKnow.heading}</h2>
            <p className="text-slate-500 text-center mb-10">{dict.didYouKnow.subheading}</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {dict.didYouKnow.facts.map(({ icon, title, fact, color }: { icon: string; title: string; fact: string; color?: string }, i: number) => (
                <motion.div key={title}
                  initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }} transition={{ duration: 0.5 }}
                  className="rounded-2xl p-6 glass"
                  style={{ border: `1px solid ${["#e2b43d","#7e88ec","#b884ed","#34d399"][i]}20` }}>
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-4"
                    style={{ background: `${["#e2b43d","#7e88ec","#b884ed","#34d399"][i]}15`, boxShadow: `0 0 16px ${["#e2b43d","#7e88ec","#b884ed","#34d399"][i]}30` }}>
                    <Glyph emoji={icon} className="h-10 w-10" />
                  </div>
                  <p className="text-[16px] font-bold text-white mb-2">{title}</p>
                  <p className="text-slate-400 text-[15px] leading-relaxed">{fact}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 border-t border-white/5">
          <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Telescope className="h-7 w-7" />
              <span className="font-bold text-white">Astra<span className="text-indigo-400">Nova</span></span>
              <span className="text-slate-600 text-sm ml-2">· {dict.footer.phase}</span>
            </div>
            <div className="flex flex-wrap justify-center gap-x-6 text-sm">
              {[`/${lang}`, `/${lang}/solar-system`, `/${lang}/missions`].map((href, i) => (
                <Link key={href} href={href} className="inline-block py-3 text-slate-500 hover:text-slate-300 transition-colors">
                  {dict.footer.links[i]}
                </Link>
              ))}
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
