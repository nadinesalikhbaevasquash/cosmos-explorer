"use client";

import Link from "next/link";
import { useMemo } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, ArrowRight, DollarSign, MapPin, Sparkles } from "lucide-react";
import { COUNTRIES, type MatchedUniversity, type Tier } from "../lib/types";
import { matchUniversities } from "../lib/match";
import { useProfile } from "../lib/storage";
import NeedsProfile from "../components/NeedsProfile";

const EASE = [0.22, 1, 0.36, 1] as const;

const TIER_META: Record<
  Tier,
  { sub: string; accent: string; chip: string; dot: string }
> = {
  Dream: {
    sub: "Reach schools — aim high, they're a stretch",
    accent: "text-rose-ink",
    chip: "bg-rose-tint text-rose-ink",
    dot: "bg-rose",
  },
  Target: {
    sub: "Well-matched to your profile — your core list",
    accent: "text-sage-ink",
    chip: "bg-sage-tint text-sage-ink",
    dot: "bg-sage",
  },
  Safe: {
    sub: "Strong odds — reliable anchors for your list",
    accent: "text-sage-deep",
    chip: "bg-pos-tint text-pos",
    dot: "bg-pos",
  },
};

function difficulty(acceptanceRate: number): string {
  if (acceptanceRate < 15) return "Highly selective";
  if (acceptanceRate < 40) return "Selective";
  if (acceptanceRate < 65) return "Moderately selective";
  return "Accessible";
}

function flagOf(country: string) {
  return COUNTRIES.find((c) => c.id === country)?.flag ?? "";
}

export default function ResultsPage() {
  const { profile, ready } = useProfile();
  const result = useMemo(() => (profile ? matchUniversities(profile) : null), [profile]);

  if (ready && !profile) {
    return (
      <NeedsProfile
        title="Let's find your universities"
        body="Tell us about your grades, interests and budget, and we'll sort schools into Dream, Target and Safe lists tailored to you."
      />
    );
  }

  if (!ready || !result || !profile) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-24 text-center sm:px-6">
        <p className="text-cocoa">Loading your matches…</p>
      </main>
    );
  }

  const tiers: { tier: Tier; list: MatchedUniversity[] }[] = [
    { tier: "Dream", list: result.dream },
    { tier: "Target", list: result.target },
    { tier: "Safe", list: result.safe },
  ];

  const total = result.all.length;

  return (
    <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="section-header">Your matches</p>
          <h1 className="font-display mt-2 text-4xl font-bold tracking-tight text-espresso sm:text-5xl">
            {total} universities for you
          </h1>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-cocoa">
            Sorted by how your {profile.gpa.toFixed(2)} GPA and profile line up against each
            school's selectivity. Build a balanced list across all three tiers.
          </p>
        </div>
        <Link
          href="/coach/roadmap"
          className="group inline-flex shrink-0 items-center gap-2 rounded-xl bg-espresso px-5 py-3 text-sm font-semibold text-cream shadow-soft transition-all hover:bg-sage-ink hover:shadow-lift"
        >
          Build my roadmap
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      {/* Profile summary chips */}
      <div className="mt-6 flex flex-wrap gap-2">
        {profile.countries.map((c) => (
          <span key={c} className="rounded-full border border-sand-deep bg-surface px-3 py-1 text-xs font-medium text-cocoa">
            {flagOf(c)} {COUNTRIES.find((x) => x.id === c)?.label}
          </span>
        ))}
        {profile.interests.slice(0, 4).map((f) => (
          <span key={f} className="rounded-full border border-sand-deep bg-surface px-3 py-1 text-xs font-medium text-cocoa">
            {f}
          </span>
        ))}
      </div>

      <div className="mt-12 space-y-14">
        {tiers.map(({ tier, list }) => {
          const meta = TIER_META[tier];
          return (
            <section key={tier}>
              <div className="flex items-baseline gap-3">
                <span className={`h-2.5 w-2.5 rounded-full ${meta.dot}`} />
                <h2 className="font-display text-3xl font-bold tracking-tight text-espresso">{tier}</h2>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${meta.chip}`}>
                  {list.length}
                </span>
              </div>
              <p className="ml-6 mt-1 text-sm text-cocoa">{meta.sub}</p>

              {list.length === 0 ? (
                <p className="ml-6 mt-5 rounded-xl border border-dashed border-sand-deep bg-surface-2 px-4 py-5 text-sm text-taupe">
                  No {tier.toLowerCase()} schools in your selected countries. Try widening your
                  countries or interests in{" "}
                  <Link href="/coach/onboarding" className="font-semibold text-sage-deep underline">
                    setup
                  </Link>
                  .
                </p>
              ) : (
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  {list.map((m, i) => (
                    <UniCard key={m.uni.id} m={m} tier={tier} index={i} />
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </main>
  );
}

function UniCard({ m, tier, index }: { m: MatchedUniversity; tier: Tier; index: number }) {
  const meta = TIER_META[tier];
  const { uni } = m;
  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, ease: EASE, delay: Math.min(index * 0.05, 0.3) }}
      className="group flex h-full flex-col rounded-2xl border border-sand bg-surface p-6 shadow-soft transition-all hover:border-sage/50 hover:shadow-lift"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-xl font-semibold leading-tight text-espresso">{uni.name}</h3>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-cocoa">
            <MapPin className="h-3.5 w-3.5 text-taupe" />
            {flagOf(uni.country)} {uni.city}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <div className={`font-display tabular text-2xl font-bold ${meta.accent}`}>{m.chance}%</div>
          <div className="fin-label">est. chance</div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${meta.chip}`}>
          {difficulty(uni.acceptanceRate)}
        </span>
        <span className="rounded-full border border-sand-deep px-2.5 py-0.5 text-xs font-medium text-cocoa">
          {uni.acceptanceRate}% accept rate
        </span>
        {m.relevance >= 50 && (
          <span className="inline-flex items-center gap-1 rounded-full border border-sage/40 bg-sage-tint px-2.5 py-0.5 text-xs font-semibold text-sage-ink">
            <Sparkles className="h-3 w-3" />
            {m.relevance}% fit
          </span>
        )}
      </div>

      <p className="mt-4 flex-1 text-[14px] leading-relaxed text-cocoa">{m.reason}</p>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-sand pt-3 text-xs">
        <span className="inline-flex items-center gap-1 font-medium text-taupe">
          <DollarSign className="h-3.5 w-3.5" />
          ~${Math.round(uni.annualCostUSD / 1000)}k / yr
        </span>
        {m.overBudget && (
          <span className="inline-flex items-center gap-1 font-semibold text-warn">
            <AlertTriangle className="h-3.5 w-3.5" />
            Over budget
          </span>
        )}
        {m.englishGap && (
          <span className="inline-flex items-center gap-1 font-semibold text-neg">
            <AlertTriangle className="h-3.5 w-3.5" />
            IELTS {uni.minIelts.toFixed(1)} needed
          </span>
        )}
      </div>
    </motion.article>
  );
}
