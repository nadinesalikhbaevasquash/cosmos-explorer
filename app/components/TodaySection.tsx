"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useDict } from "@/app/hooks/useDict";
import { useParams } from "next/navigation";
import { loadQuizState, localDateStr, visibleStreak } from "@/app/lib/quiz";

type Apod = {
  title: string | null;
  date: string | null;
  explanation: string | null;
  image: string | null;
  mediaType: string;
  copyright: string | null;
  link: string;
};

export default function TodaySection() {
  const dict = useDict();
  const params = useParams();
  const lang = (params?.lang as string) || "en";
  const locale = lang === "ru" ? "ru-RU" : lang === "uz" ? "uz-UZ" : "en-US";
  const t = dict.apod;
  const qt = dict.quiz.teaser;

  const [apod, setApod] = useState<Apod | null>(null);
  const [failed, setFailed] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    fetch("/api/space/apod")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setApod)
      .catch(() => setFailed(true));
    setStreak(visibleStreak(loadQuizState(), localDateStr()));
  }, []);

  const dateStr = apod?.date
    ? new Date(`${apod.date}T12:00:00`).toLocaleDateString(locale, { year: "numeric", month: "long", day: "numeric" })
    : null;

  return (
    <section className="max-w-7xl mx-auto px-6 pb-24">
      <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }} transition={{ duration: 0.6 }} className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-1 h-8 rounded-full" style={{ backgroundColor: "#fbbf24" }} />
          <h2 className="text-4xl font-extrabold text-white">{t.sectionTitle}</h2>
        </div>
        <p className="text-slate-500 ml-4">{t.sectionSub}</p>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-5 items-start">
        {/* APOD card */}
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.5 }}
          className="lg:col-span-2 glass rounded-3xl overflow-hidden"
          style={{ border: "1px solid rgba(251,191,36,0.15)" }}>
          {!apod && !failed && (
            <div className="animate-pulse">
              <div className="w-full" style={{ aspectRatio: "16/8", backgroundColor: "rgba(255,255,255,0.04)" }} />
              <div className="p-6 space-y-3">
                <div className="h-5 w-2/3 rounded" style={{ backgroundColor: "rgba(255,255,255,0.06)" }} />
                <div className="h-3 w-full rounded" style={{ backgroundColor: "rgba(255,255,255,0.04)" }} />
                <div className="h-3 w-5/6 rounded" style={{ backgroundColor: "rgba(255,255,255,0.04)" }} />
              </div>
            </div>
          )}
          {failed && (
            <div className="p-8 text-center text-slate-500 text-sm">{t.unavailable}</div>
          )}
          {apod && (
            <>
              {apod.image && (
                <a href={apod.link} target="_blank" rel="noopener noreferrer" className="block relative group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={apod.image} alt={apod.title ?? "Astronomy Picture of the Day"}
                    className="w-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                    style={{ aspectRatio: "16/8" }} />
                  <div className="absolute inset-0"
                    style={{ background: "linear-gradient(to top, rgba(3,7,18,0.85), transparent 45%)" }} />
                  <div className="absolute bottom-4 left-6 right-6">
                    <p className="text-amber-300/80 text-xs font-medium mb-1">{t.heading}{dateStr ? ` · ${dateStr}` : ""}</p>
                    <h3 className="text-white text-2xl font-extrabold leading-tight">{apod.title}</h3>
                  </div>
                </a>
              )}
              <div className="p-6 pt-5">
                {apod.explanation && (
                  <>
                    <p className={`text-slate-400 text-sm leading-relaxed ${expanded ? "" : "line-clamp-3"}`}>
                      {apod.explanation}
                    </p>
                    <button onClick={() => setExpanded(!expanded)}
                      className="text-amber-400 text-xs font-semibold mt-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 rounded">
                      {expanded ? t.showLess : t.readMore}
                    </button>
                  </>
                )}
                <div className="flex flex-wrap items-center justify-between gap-2 mt-4">
                  <p className="text-slate-600 text-xs">
                    {t.credit}
                    {apod.copyright ? ` · © ${apod.copyright}` : ""}
                    {t.langNote ? ` · ${t.langNote}` : ""}
                  </p>
                  <a href={apod.link} target="_blank" rel="noopener noreferrer"
                    className="text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors">
                    {t.open}
                  </a>
                </div>
              </div>
            </>
          )}
        </motion.div>

        {/* Daily quiz teaser */}
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ delay: 0.1, duration: 0.5 }}>
          <Link href={`/${lang}/quiz`} className="no-underline block">
            <div className="glass glass-hover rounded-3xl p-7 flex flex-col gap-3 h-full cursor-pointer"
              style={{
                border: "1px solid rgba(251,191,36,0.25)",
                background: "linear-gradient(160deg, rgba(251,191,36,0.10), rgba(3,7,18,0.4))",
              }}>
              <div className="flex items-start justify-between">
                <span className="text-5xl">🧠</span>
                {streak > 0 && (
                  <span className="text-xs px-2.5 py-1 rounded-full font-semibold"
                    style={{ backgroundColor: "rgba(251,191,36,0.15)", color: "#fbbf24" }}>
                    {qt.streakLabel.replace("{n}", String(streak))}
                  </span>
                )}
              </div>
              <h3 className="text-xl font-bold text-white">{qt.heading}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{qt.sub}</p>
              <span className="text-sm font-semibold mt-auto" style={{ color: "#fbbf24" }}>{qt.cta}</span>
            </div>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
