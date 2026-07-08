"use client";

import Link from "next/link";
import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  BookOpen,
  Check,
  DollarSign,
  FileText,
  FlagTriangleRight,
  GraduationCap,
  Search,
  Send,
  Users,
} from "lucide-react";
import type { TaskCategory } from "../lib/types";
import { buildRoadmap, examPlan } from "../lib/roadmap";
import { useProfile, useRoadmapProgress } from "../lib/storage";
import NeedsProfile from "../components/NeedsProfile";

const EASE = [0.22, 1, 0.36, 1] as const;

const CATEGORY_META: Record<TaskCategory, { icon: typeof BookOpen; color: string }> = {
  Research: { icon: Search, color: "text-taupe" },
  Exams: { icon: BookOpen, color: "text-rose-ink" },
  Essays: { icon: FileText, color: "text-sage-deep" },
  Recommendations: { icon: Users, color: "text-gold" },
  Applications: { icon: Send, color: "text-espresso" },
  Financial: { icon: DollarSign, color: "text-pos" },
  Decisions: { icon: FlagTriangleRight, color: "text-sage-ink" },
};

function fmtDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function RoadmapPage() {
  const { profile, ready } = useProfile();
  const { done, toggle, ready: progressReady } = useRoadmapProgress();

  const phases = useMemo(() => (profile ? buildRoadmap(profile) : []), [profile]);
  const exams = useMemo(() => (profile ? examPlan(profile) : null), [profile]);

  if (ready && !profile) {
    return (
      <NeedsProfile
        title="Let's build your roadmap"
        body="Once we know your destinations and English level, we'll generate a month-by-month application plan with every deadline and exam."
      />
    );
  }

  if (!ready || !progressReady || !profile || !exams) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-24 text-center sm:px-6">
        <p className="text-cocoa">Generating your plan…</p>
      </main>
    );
  }

  const allTasks = phases.flatMap((p) => p.tasks);
  const completed = allTasks.filter((t) => done[t.id]).length;
  const pct = Math.round((completed / allTasks.length) * 100);

  return (
    <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
      <p className="section-header">Your application roadmap</p>
      <h1 className="font-display mt-2 text-4xl font-bold tracking-tight text-espresso sm:text-5xl">
        Your plan to application day
      </h1>
      <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-cocoa">
        A complete, dated checklist from research to enrollment. Tick items off as you go — your
        progress saves automatically.
      </p>

      {/* Exam plan + progress summary */}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-sand bg-surface p-5 shadow-soft sm:col-span-2">
          <div className="flex items-center justify-between">
            <span className="fin-label">Overall progress</span>
            <span className="tabular text-sm font-bold text-sage-deep">
              {completed}/{allTasks.length} done
            </span>
          </div>
          <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-sand">
            <motion.div
              className="h-full rounded-full bg-sage"
              initial={false}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.5, ease: EASE }}
            />
          </div>
          <p className="mt-2 text-xs text-taupe">
            {pct === 100 ? "Every step complete — you're ready. 🎓" : `${pct}% of the way there`}
          </p>
        </div>
        <div className="rounded-2xl border border-sand bg-surface p-5 shadow-soft">
          <span className="fin-label">Tests to prep</span>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {exams.needsSat && (
              <span className="rounded-full bg-rose-tint px-2.5 py-1 text-xs font-bold text-rose-ink">SAT</span>
            )}
            {exams.needsIelts && (
              <span className="rounded-full bg-sage-tint px-2.5 py-1 text-xs font-bold text-sage-ink">IELTS</span>
            )}
            {!exams.needsSat && !exams.needsIelts && (
              <span className="text-xs text-taupe">No standardized tests required</span>
            )}
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="mt-12">
        {phases.map((phase, pi) => (
          <motion.section
            key={phase.id}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, ease: EASE }}
            className="relative pl-8 sm:pl-10"
          >
            {/* Spine */}
            {pi < phases.length - 1 && (
              <span className="absolute left-[11px] top-2 h-full w-px bg-sand-deep sm:left-[15px]" />
            )}
            <span className="absolute left-0 top-1.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-sage bg-cream sm:h-8 sm:w-8">
              <span className="tabular text-xs font-bold text-sage-deep">{pi + 1}</span>
            </span>

            <div className="pb-10">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h2 className="font-display text-2xl font-bold text-espresso">{phase.title}</h2>
                <span className="fin-label">{phase.window}</span>
              </div>

              <div className="mt-4 space-y-2.5">
                {phase.tasks.map((task) => {
                  const isDone = !!done[task.id];
                  const meta = CATEGORY_META[task.category];
                  const Icon = meta.icon;
                  return (
                    <button
                      key={task.id}
                      type="button"
                      onClick={() => toggle(task.id)}
                      className={`flex w-full items-start gap-3.5 rounded-xl border p-4 text-left transition-all ${
                        isDone
                          ? "border-sand bg-surface-2"
                          : "border-sand bg-surface shadow-soft hover:border-sage/50 hover:shadow-lift"
                      }`}
                    >
                      <span
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
                          isDone ? "border-sage bg-sage text-white" : "border-sand-deep bg-cream"
                        }`}
                      >
                        {isDone && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1 text-xs font-semibold ${meta.color}`}
                          >
                            <Icon className="h-3.5 w-3.5" />
                            {task.category}
                          </span>
                          <span className="tabular text-xs font-medium text-taupe">
                            · due {fmtDate(task.due)}
                          </span>
                        </span>
                        <span
                          className={`mt-1 block font-semibold ${
                            isDone ? "text-taupe line-through" : "text-espresso"
                          }`}
                        >
                          {task.title}
                        </span>
                        <span className={`mt-0.5 block text-sm leading-relaxed ${isDone ? "text-taupe-soft" : "text-cocoa"}`}>
                          {task.detail}
                        </span>
                        {task.id === "p3-feedback" && !isDone && (
                          <Link
                            href="/coach/essay"
                            onClick={(e) => e.stopPropagation()}
                            className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-sage-deep underline underline-offset-2 hover:text-sage-ink"
                          >
                            Open the essay feedback tool →
                          </Link>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.section>
        ))}
      </div>

      <div className="rounded-2xl border border-sage/30 bg-sage-ink p-6 text-center">
        <GraduationCap className="mx-auto h-7 w-7 text-cream" />
        <p className="font-display mt-2 text-xl font-semibold text-cream">
          One essay away from a stronger application
        </p>
        <Link
          href="/coach/essay"
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-cream px-5 py-2.5 text-sm font-semibold text-espresso transition-colors hover:bg-surface"
        >
          Get essay feedback
        </Link>
      </div>
    </main>
  );
}
