"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, GraduationCap } from "lucide-react";
import {
  COUNTRIES,
  ENGLISH_LEVELS,
  FIELDS,
  type Country,
  type EnglishLevel,
  type Field,
} from "../lib/types";
import { saveProfile } from "../lib/storage";

const EASE = [0.22, 1, 0.36, 1] as const;
const TOTAL = 5;

// GPA → plain-language band, shown live under the slider.
function gpaLabel(gpa: number): string {
  if (gpa >= 3.8) return "Top of class — A / A+ average";
  if (gpa >= 3.5) return "Strong — mostly A's";
  if (gpa >= 3.0) return "Solid — A's and B's";
  if (gpa >= 2.5) return "Mixed — B's and C's";
  return "Building up — room to grow";
}

const BUDGETS = [
  { value: 35000, label: "Under $35k / yr", note: "Tight budget — focus on affordable schools & aid" },
  { value: 50000, label: "$35k – $50k / yr", note: "Many Canadian & UK options open up" },
  { value: 70000, label: "$50k – $70k / yr", note: "Most public US universities in range" },
  { value: 90000, label: "$70k+ / yr", note: "Full range, including private US schools" },
];

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);

  const [countries, setCountries] = useState<Country[]>([]);
  const [gpa, setGpa] = useState(3.5);
  const [interests, setInterests] = useState<Field[]>([]);
  const [budget, setBudget] = useState<number | null>(null);
  const [english, setEnglish] = useState<EnglishLevel | null>(null);

  const canAdvance =
    (step === 0 && countries.length > 0) ||
    (step === 1 && true) ||
    (step === 2 && interests.length > 0) ||
    (step === 3 && budget !== null) ||
    (step === 4 && english !== null);

  function go(next: number) {
    setDir(next > step ? 1 : -1);
    setStep(next);
  }

  function finish() {
    if (budget === null || english === null) return;
    saveProfile({
      countries,
      gpa,
      interests,
      budgetUSD: budget,
      english,
      createdAt: Date.now(),
    });
    router.push("/coach/results");
  }

  function toggleCountry(c: Country) {
    setCountries((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
  }
  function toggleInterest(f: Field) {
    setInterests((prev) => (prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]));
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-16">
      {/* Progress */}
      <div className="mb-10">
        <div className="flex items-center justify-between">
          <p className="section-header">
            Step {step + 1} of {TOTAL}
          </p>
          <p className="text-xs font-semibold text-taupe">{Math.round(((step + 1) / TOTAL) * 100)}%</p>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-sand">
          <motion.div
            className="h-full rounded-full bg-sage"
            initial={false}
            animate={{ width: `${((step + 1) / TOTAL) * 100}%` }}
            transition={{ duration: 0.4, ease: EASE }}
          />
        </div>
      </div>

      <div className="relative min-h-[360px]">
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={step}
            custom={dir}
            initial={{ opacity: 0, x: dir * 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: dir * -40 }}
            transition={{ duration: 0.35, ease: EASE }}
          >
            {/* Step 1 — Countries */}
            {step === 0 && (
              <Step
                title="Where do you want to study?"
                hint="Pick one or more. We'll only show universities in these countries."
              >
                <div className="grid gap-3 sm:grid-cols-3">
                  {COUNTRIES.map((c) => (
                    <SelectCard
                      key={c.id}
                      active={countries.includes(c.id)}
                      onClick={() => toggleCountry(c.id)}
                    >
                      <span className="text-3xl">{c.flag}</span>
                      <span className="mt-2 block font-semibold text-espresso">{c.label}</span>
                    </SelectCard>
                  ))}
                </div>
              </Step>
            )}

            {/* Step 2 — GPA */}
            {step === 1 && (
              <Step
                title="What are your grades?"
                hint="Use your GPA on a 4.0 scale. Roughly convert if your school uses percentages."
              >
                <div className="rounded-2xl border border-sand bg-surface p-6 shadow-soft">
                  <div className="flex items-end justify-between">
                    <span className="fin-label">Current GPA</span>
                    <span className="font-display tabular text-5xl font-bold text-sage-deep">
                      {gpa.toFixed(2)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={2}
                    max={4}
                    step={0.05}
                    value={gpa}
                    onChange={(e) => setGpa(parseFloat(e.target.value))}
                    className="mt-5 w-full accent-sage"
                  />
                  <div className="mt-1 flex justify-between text-xs text-taupe">
                    <span>2.0</span>
                    <span>4.0</span>
                  </div>
                  <p className="mt-4 rounded-lg bg-sage-tint px-3 py-2 text-sm font-medium text-sage-ink">
                    {gpaLabel(gpa)}
                  </p>
                </div>
              </Step>
            )}

            {/* Step 3 — Interests */}
            {step === 2 && (
              <Step
                title="What do you want to study?"
                hint="Choose the fields you're drawn to. We use these to rank program fit."
              >
                <div className="flex flex-wrap gap-2.5">
                  {FIELDS.map((f) => {
                    const active = interests.includes(f);
                    return (
                      <button
                        key={f}
                        type="button"
                        onClick={() => toggleInterest(f)}
                        className={`rounded-full border px-4 py-2 text-sm font-medium transition-all ${
                          active
                            ? "border-sage bg-sage text-white shadow-soft"
                            : "border-sand-deep bg-surface text-cocoa hover:border-sage hover:text-sage-ink"
                        }`}
                      >
                        {active && <Check className="mr-1 inline h-3.5 w-3.5" />}
                        {f}
                      </button>
                    );
                  })}
                </div>
              </Step>
            )}

            {/* Step 4 — Budget */}
            {step === 3 && (
              <Step
                title="What's your annual budget?"
                hint="Estimate tuition plus living costs per year, in USD. This flags schools beyond reach."
              >
                <div className="grid gap-3">
                  {BUDGETS.map((b) => (
                    <SelectCard key={b.value} row active={budget === b.value} onClick={() => setBudget(b.value)}>
                      <div className="text-left">
                        <span className="font-semibold text-espresso">{b.label}</span>
                        <span className="mt-0.5 block text-sm text-cocoa">{b.note}</span>
                      </div>
                    </SelectCard>
                  ))}
                </div>
              </Step>
            )}

            {/* Step 5 — English */}
            {step === 4 && (
              <Step
                title="How's your English?"
                hint="Be honest — this sets your IELTS/TOEFL prep and flags schools with high requirements."
              >
                <div className="grid gap-3">
                  {ENGLISH_LEVELS.map((e) => (
                    <SelectCard key={e.id} row active={english === e.id} onClick={() => setEnglish(e.id)}>
                      <div className="text-left">
                        <span className="font-semibold text-espresso">{e.label}</span>
                        <span className="mt-0.5 block text-sm text-cocoa">{e.hint}</span>
                      </div>
                      <span className="fin-label whitespace-nowrap">≈ IELTS {e.ielts.toFixed(1)}</span>
                    </SelectCard>
                  ))}
                </div>
              </Step>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Controls */}
      <div className="mt-10 flex items-center justify-between">
        <button
          type="button"
          onClick={() => go(step - 1)}
          disabled={step === 0}
          className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-semibold text-cocoa transition-colors hover:bg-cream-deep disabled:invisible"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        {step < TOTAL - 1 ? (
          <button
            type="button"
            onClick={() => go(step + 1)}
            disabled={!canAdvance}
            className="group inline-flex items-center gap-2 rounded-xl bg-espresso px-6 py-3 text-sm font-semibold text-cream shadow-soft transition-all hover:bg-sage-ink hover:shadow-lift disabled:cursor-not-allowed disabled:bg-sand-deep disabled:text-cocoa disabled:shadow-none"
          >
            Continue
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={finish}
            disabled={!canAdvance}
            className="group inline-flex items-center gap-2 rounded-xl bg-sage px-6 py-3 text-sm font-semibold text-white shadow-soft transition-all hover:bg-sage-deep hover:shadow-lift disabled:cursor-not-allowed disabled:bg-sand-deep disabled:text-cocoa disabled:shadow-none"
          >
            <GraduationCap className="h-4 w-4" />
            See my universities
          </button>
        )}
      </div>
    </main>
  );
}

function Step({
  title,
  hint,
  children,
}: {
  title: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h1 className="font-display text-3xl font-bold tracking-tight text-espresso sm:text-4xl">{title}</h1>
      <p className="mt-2 text-[15px] leading-relaxed text-cocoa">{hint}</p>
      <div className="mt-7">{children}</div>
    </div>
  );
}

function SelectCard({
  active,
  onClick,
  children,
  row = false,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  row?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative rounded-2xl border p-5 text-center transition-all ${
        row ? "flex items-center justify-between gap-3 text-left" : ""
      } ${
        active
          ? "border-sage bg-sage-tint shadow-soft ring-1 ring-sage"
          : "border-sand bg-surface hover:border-sage/50 hover:shadow-soft"
      }`}
    >
      {children}
      {active && !row && (
        <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-sage text-white">
          <Check className="h-3 w-3" strokeWidth={3} />
        </span>
      )}
    </button>
  );
}
