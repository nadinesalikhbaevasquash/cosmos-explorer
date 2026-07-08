"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Nav from "@/app/components/Nav";
import { useDict } from "@/app/hooks/useDict";
import { useParams } from "next/navigation";
import {
  dayNumber, loadQuizState, localDateStr, quizNumber,
  saveQuizState, seededPick, visibleStreak, type QuizState,
} from "@/app/lib/quiz";

const QUESTIONS_PER_DAY = 5;
const GOLD = "#fbbf24";

type Phase = "loading" | "intro" | "play" | "done";

export default function QuizPage() {
  const dict = useDict();
  const params = useParams();
  const lang = (params?.lang as string) || "en";
  const t = dict.quiz;

  const today = useMemo(() => localDateStr(), []);
  const seed = useMemo(() => dayNumber(today), [today]);
  const qNum = useMemo(() => quizNumber(today), [today]);

  // Same questions for everyone on a given day; option order also day-seeded.
  const daily = useMemo(() => {
    const picks = seededPick(QUESTIONS_PER_DAY, t.questions.length, seed);
    return picks.map((qi, slot) => {
      const q = t.questions[qi];
      const order = seededPick(4, 4, seed * 37 + slot * 7 + qi);
      return {
        q: q.q,
        fact: q.fact,
        options: order.map((oi) => q.options[oi]),
        correctPos: order.indexOf(0), // options[0] in the dict is always correct
      };
    });
  }, [t.questions, seed]);

  const [phase, setPhase] = useState<Phase>("loading");
  const [state, setState] = useState<QuizState | null>(null);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const s = loadQuizState();
    setState(s);
    setPhase(s?.lastDate === today ? "done" : "intro");
  }, [today]);

  const streak = visibleStreak(state, today);
  const score = state?.lastDate === today ? state.lastScore : answers.filter(Boolean).length;
  const squares = state?.lastDate === today
    ? state.lastSquares
    : answers.map((a) => (a ? "🟩" : "🟥")).join("");

  function answer(pos: number) {
    if (selected !== null) return;
    setSelected(pos);
    setAnswers((prev) => [...prev, pos === daily[current].correctPos]);
  }

  function next() {
    if (current + 1 < QUESTIONS_PER_DAY) {
      setCurrent(current + 1);
      setSelected(null);
      return;
    }
    // Finish: persist score + streak.
    const finalScore = answers.filter(Boolean).length;
    const finalSquares = answers.map((a) => (a ? "🟩" : "🟥")).join("");
    const prev = loadQuizState();
    const continued = prev && dayNumber(today) - dayNumber(prev.lastDate) === 1;
    const newStreak = continued ? prev.streak + 1 : 1;
    const s: QuizState = {
      lastDate: today,
      lastScore: finalScore,
      lastSquares: finalSquares,
      streak: newStreak,
      best: Math.max(newStreak, prev?.best ?? 0),
      played: (prev?.played ?? 0) + 1,
    };
    saveQuizState(s);
    setState(s);
    setPhase("done");
  }

  function copyResult() {
    const text = `AstraNova ${t.quizNo.replace("{n}", String(qNum))} — ${score}/${QUESTIONS_PER_DAY}\n${squares}\n🔥 ${state?.streak ?? streak}\nhttps://astranova.uz/${lang}/quiz`;
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const chip = (label: string, value: number) => (
    <div className="glass rounded-2xl px-6 py-3 text-center" style={{ border: "1px solid rgba(251,191,36,0.2)" }}>
      <p className="text-2xl font-extrabold" style={{ color: GOLD }}>{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );

  const focusRing = "focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50";

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#030712" }}>
      <Nav />
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #fbbf24, transparent 70%)", filter: "blur(80px)" }} />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #818cf8, transparent 70%)", filter: "blur(70px)" }} />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-6 pt-12 pb-24">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}
          className="text-center mb-10">
          <p className="text-amber-400 text-xs tracking-[0.6em] uppercase mb-4 font-medium">{t.tagline}</p>
          <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-white mb-3">
            {t.title[0]} <span className="gradient-text">{t.title[1]}</span>
          </h1>
          <p className="text-slate-400 max-w-md mx-auto leading-relaxed">{t.subtitle}</p>
          <p className="text-slate-600 text-xs mt-2">{t.quizNo.replace("{n}", String(qNum))}</p>
        </motion.div>

        <AnimatePresence mode="wait">
          {phase === "intro" && (
            <motion.div key="intro" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.35 }} className="text-center">
              <div className="flex justify-center gap-4 mb-10">
                {chip(t.streak, streak)}
                {chip(t.best, state?.best ?? 0)}
              </div>
              <button onClick={() => setPhase("play")}
                className={`px-10 py-4 rounded-full font-bold text-base text-slate-900 transition-all hover:scale-105 ${focusRing}`}
                style={{ background: `linear-gradient(135deg, ${GOLD}, #f97316)`, boxShadow: "0 0 30px rgba(251,191,36,0.35)" }}>
                {t.start}
              </button>
            </motion.div>
          )}

          {phase === "play" && (
            <motion.div key={`q-${current}`} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.3 }}>
              {/* Progress */}
              <div className="flex items-center justify-between mb-5">
                <p className="text-sm text-slate-500 font-medium">
                  {t.question.replace("{i}", String(current + 1)).replace("{total}", String(QUESTIONS_PER_DAY))}
                </p>
                <div className="flex gap-1.5">
                  {Array.from({ length: QUESTIONS_PER_DAY }).map((_, i) => (
                    <span key={i} className="w-2 h-2 rounded-full"
                      style={{
                        backgroundColor:
                          i < answers.length ? (answers[i] ? "#4ade80" : "#f87171")
                          : i === current ? GOLD : "rgba(255,255,255,0.12)",
                      }} />
                  ))}
                </div>
              </div>

              <div className="glass rounded-3xl p-7" style={{ border: "1px solid rgba(251,191,36,0.18)" }}>
                <h2 className="text-xl font-bold text-white mb-6 leading-snug">{daily[current].q}</h2>
                <div className="grid gap-3">
                  {daily[current].options.map((opt, pos) => {
                    const isCorrect = pos === daily[current].correctPos;
                    const isPicked = selected === pos;
                    const revealed = selected !== null;
                    return (
                      <button key={pos} onClick={() => answer(pos)} disabled={revealed}
                        className={`w-full text-left px-5 py-3.5 rounded-2xl text-sm font-medium transition-all ${focusRing} ${revealed ? "" : "hover:scale-[1.01]"}`}
                        style={{
                          backgroundColor: revealed && isCorrect ? "rgba(74,222,128,0.12)"
                            : revealed && isPicked ? "rgba(248,113,113,0.12)"
                            : "rgba(255,255,255,0.04)",
                          border: `1px solid ${revealed && isCorrect ? "#4ade80"
                            : revealed && isPicked ? "#f87171"
                            : "rgba(255,255,255,0.08)"}`,
                          color: revealed && isCorrect ? "#4ade80"
                            : revealed && isPicked ? "#f87171"
                            : "#e2e8f0",
                          cursor: revealed ? "default" : "pointer",
                        }}>
                        {opt}
                      </button>
                    );
                  })}
                </div>

                {selected !== null && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
                    className="mt-5">
                    <p className="text-sm font-bold mb-1"
                      style={{ color: selected === daily[current].correctPos ? "#4ade80" : "#f87171" }}>
                      {selected === daily[current].correctPos ? t.correctLabel : t.wrongLabel}
                    </p>
                    <p className="text-sm text-slate-400 leading-relaxed mb-4">{daily[current].fact}</p>
                    <button onClick={next}
                      className={`w-full py-3 rounded-2xl font-bold text-sm text-slate-900 transition-all hover:scale-[1.01] ${focusRing}`}
                      style={{ background: `linear-gradient(135deg, ${GOLD}, #f97316)` }}>
                      {current + 1 < QUESTIONS_PER_DAY ? t.next : t.finish}
                    </button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

          {phase === "done" && (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }} className="text-center">
              <div className="glass rounded-3xl p-9 mb-6" style={{ border: "1px solid rgba(251,191,36,0.2)" }}>
                <p className="text-6xl font-black mb-2" style={{ color: GOLD, textShadow: "0 0 40px rgba(251,191,36,0.4)" }}>
                  {score}/{QUESTIONS_PER_DAY}
                </p>
                <p className="text-2xl tracking-widest mb-3">{squares}</p>
                <p className="text-slate-300 font-semibold mb-6">{t.results[Math.min(score, 5)]}</p>
                <div className="flex justify-center gap-4 mb-6">
                  {chip(t.streak, state?.streak ?? 0)}
                  {chip(t.best, state?.best ?? 0)}
                </div>
                <button onClick={copyResult}
                  className={`px-8 py-3 rounded-full font-bold text-sm transition-all hover:scale-105 ${focusRing}`}
                  style={{
                    backgroundColor: "rgba(251,191,36,0.12)", color: GOLD,
                    border: "1px solid rgba(251,191,36,0.35)",
                  }}>
                  {copied ? t.copied : t.copy}
                </button>
              </div>
              <p className="text-slate-500 text-sm">{t.playedToday}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
