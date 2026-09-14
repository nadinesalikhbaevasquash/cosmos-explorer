"use client";

/**
 * Practice.
 *
 * The learning path is the reading; this is where you find out whether any of it
 * stuck. Three ways in, ordered by how much they ask of you: a five-question daily
 * quiz, a real telescope campaign, and a size-intuition drill.
 *
 * The streak is read from the same store the quiz already writes, so the number
 * here and the number on the quiz page can never disagree.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useParams } from "next/navigation";
import { useDict } from "@/app/hooks/useDict";
import { loadQuizState, localDateStr, visibleStreak } from "@/app/lib/quiz";
import { Target, Telescope, Magnifier } from "@/app/components/SpaceCast";

export default function PracticeSection() {
  const dict = useDict();
  const params = useParams();
  const lang = (params?.lang as string) || "en";
  const t = dict.practice;

  const [streak, setStreak] = useState(0);
  const [doneToday, setDoneToday] = useState(false);

  useEffect(() => {
    const today = localDateStr();
    const state = loadQuizState();
    setStreak(visibleStreak(state, today));
    setDoneToday(state?.lastDate === today);
  }, []);

  const CARDS = [
    {
      id: "quiz",
      Icon: Target,
      href: `/${lang}/quiz`,
      colour: "#e2b43d",
      badge: doneToday ? t.doneToday : t.fiveQuestions,
    },
    {
      id: "observatory",
      Icon: Telescope,
      href: `/${lang}/observatory`,
      colour: "#7e88ec",
      badge: t.realData,
    },
    {
      id: "scale",
      Icon: Magnifier,
      href: `/${lang}/scale`,
      colour: "#34d399",
      badge: t.quickDrill,
    },
  ];

  return (
    <section className="relative max-w-6xl mx-auto px-6 py-20">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6 }}
        className="flex flex-wrap items-end justify-between gap-4"
      >
        <div>
          <p className="text-amber-400 text-[13px] tracking-[0.35em] uppercase font-semibold mb-3">
            {t.eyebrow}
          </p>
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-3">{t.title}</h2>
          <p className="text-slate-400 text-[16px] max-w-2xl leading-relaxed">{t.subtitle}</p>
        </div>

        {streak > 0 && (
          <div className="rounded-2xl border border-amber-400/25 bg-amber-500/10 px-5 py-3 text-center">
            <p className="text-3xl font-bold text-amber-300 tabular-nums">{streak}</p>
            <p className="text-[12px] text-amber-200/70">{t.dayStreak}</p>
          </div>
        )}
      </motion.div>

      <div className="an-stagger mt-10 grid gap-5 md:grid-cols-3">
        {CARDS.map((c) => {
          const copy = t.cards[c.id as keyof typeof t.cards];
          return (
            <Link key={c.id} href={c.href} className="no-underline">
              <motion.div
                whileHover={{ y: -6 }}
                transition={{ duration: 0.25 }}
                className="an-sweep-host flex h-full flex-col rounded-2xl border p-6"
                style={{
                  borderColor: `${c.colour}33`,
                  background: `linear-gradient(135deg, ${c.colour}12, rgba(255,255,255,0.015))`,
                }}
              >
                <div className="flex items-start justify-between">
                  <div
                    className="flex h-16 w-16 items-center justify-center rounded-2xl"
                    style={{ background: `${c.colour}18` }}
                  >
                    <c.Icon className="h-12 w-12" />
                  </div>
                  <span
                    className="rounded-full px-3 py-1 text-[12px] font-semibold"
                    style={{ background: `${c.colour}1f`, color: c.colour }}
                  >
                    {c.badge}
                  </span>
                </div>

                <h3 className="mt-5 text-[20px] font-bold text-white">{copy.title}</h3>
                <p className="mt-2 flex-1 text-[15px] leading-relaxed text-slate-400">{copy.body}</p>

                <span
                  className="mt-5 inline-flex items-center gap-1.5 text-[15px] font-semibold"
                  style={{ color: c.colour }}
                >
                  {copy.cta} <span aria-hidden>→</span>
                </span>
              </motion.div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
