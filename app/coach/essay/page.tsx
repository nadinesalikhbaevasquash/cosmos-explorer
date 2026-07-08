"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  Lightbulb,
  PenLine,
  Quote,
  Sparkles,
} from "lucide-react";
import { analyzeEssay, type Flag, type FlagType } from "../lib/essay";

const EASE = [0.22, 1, 0.36, 1] as const;

const SAMPLE = `Ever since I was young, I have always been passionate about helping people. In today's society, many people struggle with things that they cannot control. I learned that hard work pays off and that I should always follow my dreams. Volunteering at the local hospital changed my life and taught me the value of compassion. I worked very hard and really tried my best every single day. The experience was truly amazing and I definitely want to make a difference in the world.`;

const FLAG_META: Record<FlagType, { label: string; color: string; bg: string }> = {
  opener: { label: "Weak opener", color: "text-neg", bg: "bg-neg-tint" },
  cliche: { label: "Cliché", color: "text-warn", bg: "bg-warn-tint" },
  passive: { label: "Passive voice", color: "text-cocoa", bg: "bg-cream-deep" },
  filler: { label: "Filler words", color: "text-cocoa", bg: "bg-cream-deep" },
  long: { label: "Run-on", color: "text-warn", bg: "bg-warn-tint" },
};

function scoreColor(score: number): string {
  if (score >= 70) return "text-pos";
  if (score >= 50) return "text-warn";
  return "text-neg";
}
function barColor(score: number): string {
  if (score >= 70) return "bg-pos";
  if (score >= 50) return "bg-warn";
  return "bg-neg";
}

export default function EssayPage() {
  const [text, setText] = useState("");
  const [submitted, setSubmitted] = useState("");

  const report = useMemo(() => (submitted ? analyzeEssay(submitted) : null), [submitted]);
  const liveWords = (text.trim().match(/\S+/g) ?? []).length;

  return (
    <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="max-w-2xl">
        <p className="section-header">Essay feedback</p>
        <h1 className="font-display mt-2 text-4xl font-bold tracking-tight text-espresso sm:text-5xl">
          Make your essay impossible to ignore
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-cocoa">
          Paste your personal statement and get instant, specific feedback — no account, nothing
          sent anywhere. We score five things admissions readers care about and flag the exact
          lines holding you back.
        </p>
        <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-taupe">
          <Sparkles className="h-3.5 w-3.5" />
          Rule-based analysis runs entirely in your browser.
        </p>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.05fr]">
        {/* Editor */}
        <div className="flex flex-col">
          <div className="rounded-2xl border border-sand bg-surface p-5 shadow-soft">
            <div className="mb-3 flex items-center justify-between">
              <span className="fin-label">Your essay</span>
              <span
                className={`tabular text-xs font-semibold ${
                  liveWords > 650 ? "text-warn" : "text-taupe"
                }`}
              >
                {liveWords} / 650 words
              </span>
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste your college essay or personal statement here…"
              className="h-80 w-full resize-y rounded-xl border border-sand bg-surface-2 p-4 text-[15px] leading-relaxed text-espresso outline-none transition-colors placeholder:text-taupe-soft focus:border-sage"
            />
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setSubmitted(text)}
                disabled={text.trim().length === 0}
                className="group inline-flex items-center gap-2 rounded-xl bg-espresso px-5 py-2.5 text-sm font-semibold text-cream shadow-soft transition-all hover:bg-sage-ink hover:shadow-lift disabled:cursor-not-allowed disabled:bg-sand-deep disabled:text-cocoa disabled:shadow-none"
              >
                <PenLine className="h-4 w-4" />
                Analyze my essay
              </button>
              <button
                type="button"
                onClick={() => {
                  setText(SAMPLE);
                  setSubmitted("");
                }}
                className="text-sm font-semibold text-sage-deep underline underline-offset-2 hover:text-sage-ink"
              >
                Load a sample
              </button>
              {text && (
                <button
                  type="button"
                  onClick={() => {
                    setText("");
                    setSubmitted("");
                  }}
                  className="text-sm font-medium text-taupe hover:text-cocoa"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          <p className="mt-3 px-1 text-xs leading-relaxed text-taupe">
            This tool checks structure, specificity, voice and clichés — it can&apos;t judge your
            story or honesty. Use it to tighten a draft you believe in.
          </p>
        </div>

        {/* Report */}
        <div>
          <AnimatePresence mode="wait">
            {!report || report.empty ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex h-full min-h-[420px] flex-col items-center justify-center rounded-2xl border border-dashed border-sand-deep bg-surface-2 p-8 text-center"
              >
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sage-tint text-sage-deep">
                  <Lightbulb className="h-7 w-7" />
                </span>
                <p className="font-display mt-4 text-xl font-semibold text-espresso">
                  Your feedback appears here
                </p>
                <p className="mt-1.5 max-w-xs text-sm text-cocoa">
                  Write or paste your essay, then hit analyze for a scored breakdown and line-by-line
                  flags.
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="report"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, ease: EASE }}
                className="space-y-5"
              >
                {/* Overall */}
                <div className="rounded-2xl border border-sand bg-surface p-6 shadow-soft">
                  <div className="flex items-center gap-5">
                    <ScoreRing score={report.overall} />
                    <div>
                      <p className="fin-label">Overall essay score</p>
                      <p className="mt-1 text-[15px] font-medium leading-relaxed text-cocoa">
                        {report.summary}
                      </p>
                    </div>
                  </div>
                  <div className="mt-5 grid grid-cols-3 gap-2 border-t border-sand pt-4 sm:grid-cols-6">
                    {report.metrics.map((mt) => (
                      <div key={mt.label} className="text-center">
                        <div
                          className={`tabular text-lg font-bold ${
                            mt.status === "good"
                              ? "text-pos"
                              : mt.status === "warn"
                                ? "text-warn"
                                : "text-neg"
                          }`}
                        >
                          {mt.value}
                        </div>
                        <div className="fin-label mt-0.5 leading-tight">{mt.label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Dimensions */}
                <div className="rounded-2xl border border-sand bg-surface p-6 shadow-soft">
                  <p className="section-header">The five dimensions</p>
                  <div className="mt-4 space-y-4">
                    {report.dimensions.map((d) => (
                      <div key={d.id}>
                        <div className="flex items-baseline justify-between">
                          <span className="text-sm font-semibold text-espresso">{d.label}</span>
                          <span className={`tabular text-sm font-bold ${scoreColor(d.score)}`}>
                            {d.score}
                            <span className="ml-1.5 text-xs font-medium text-taupe">{d.verdict}</span>
                          </span>
                        </div>
                        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-sand">
                          <motion.div
                            className={`h-full rounded-full ${barColor(d.score)}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${d.score}%` }}
                            transition={{ duration: 0.6, ease: EASE }}
                          />
                        </div>
                        <p className="mt-1.5 text-[13px] leading-relaxed text-cocoa">{d.explanation}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Strengths */}
                {report.strengths.length > 0 && (
                  <div className="rounded-2xl border border-pos/30 bg-pos-tint/50 p-5">
                    <p className="inline-flex items-center gap-1.5 text-sm font-bold text-pos">
                      <CheckCircle2 className="h-4 w-4" />
                      What&apos;s working
                    </p>
                    <ul className="mt-2.5 space-y-1.5">
                      {report.strengths.map((s, i) => (
                        <li key={i} className="flex gap-2 text-sm text-sage-ink">
                          <span className="text-pos">✓</span>
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Flags */}
                <div className="rounded-2xl border border-sand bg-surface p-6 shadow-soft">
                  <p className="inline-flex items-center gap-1.5 section-header">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    {report.flags.length} thing{report.flags.length === 1 ? "" : "s"} to fix
                  </p>
                  {report.flags.length === 0 ? (
                    <p className="mt-3 text-sm text-cocoa">
                      No specific issues flagged — clean draft. Read it aloud once more to catch
                      anything a machine can&apos;t.
                    </p>
                  ) : (
                    <div className="mt-4 space-y-3">
                      {report.flags.map((f, i) => (
                        <FlagRow key={i} flag={f} />
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
}

function FlagRow({ flag }: { flag: Flag }) {
  const meta = FLAG_META[flag.type];
  return (
    <div className="rounded-xl border border-sand bg-surface-2 p-4">
      <div className="flex items-center justify-between gap-2">
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${meta.bg} ${meta.color}`}>
          {meta.label}
        </span>
      </div>
      <p className="mt-2.5 flex gap-2 text-[13px] italic leading-relaxed text-cocoa">
        <Quote className="h-3.5 w-3.5 shrink-0 text-taupe-soft" />
        <span className="line-clamp-2">{flag.text}</span>
      </p>
      <p className="mt-2 text-[13px] leading-relaxed text-espresso">{flag.message}</p>
    </div>
  );
}

function ScoreRing({ score }: { score: number }) {
  const r = 30;
  const c = 2 * Math.PI * r;
  const stroke = score >= 70 ? "var(--pos)" : score >= 50 ? "var(--warn)" : "var(--neg)";
  return (
    <div className="relative h-20 w-20 shrink-0">
      <svg viewBox="0 0 72 72" className="h-20 w-20 -rotate-90">
        <circle cx="36" cy="36" r={r} fill="none" stroke="var(--sand)" strokeWidth="7" />
        <motion.circle
          cx="36"
          cy="36"
          r={r}
          fill="none"
          stroke={stroke}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c - (score / 100) * c }}
          transition={{ duration: 0.8, ease: EASE }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="tabular text-2xl font-bold text-espresso">{score}</span>
      </div>
    </div>
  );
}
