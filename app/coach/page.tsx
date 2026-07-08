import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Compass, ListChecks, PenLine, Sparkles } from "lucide-react";
import Reveal from "./components/Reveal";
import LogoWall from "./components/LogoWall";

const GALLERY = [
  { src: "/coach/graduate.jpg", alt: "A graduate in cap and gown", caption: "Acceptance day" },
  { src: "/coach/students-study.jpg", alt: "Students studying together", caption: "Find your people" },
  { src: "/coach/library.jpg", alt: "A grand university library", caption: "World-class campuses" },
];

const STEPS = [
  {
    icon: Compass,
    n: "01",
    title: "Tell us about you",
    body: "Share your grades, interests, budget, English level and where you'd love to study. Takes about two minutes.",
  },
  {
    icon: ListChecks,
    n: "02",
    title: "Get your match & plan",
    body: "We sort universities into Dream, Target and Safe schools and generate a month-by-month application roadmap.",
  },
  {
    icon: PenLine,
    n: "03",
    title: "Sharpen your essay",
    body: "Paste your personal statement and get instant, specific feedback on your hook, voice, structure and more.",
  },
];

const STATS = [
  { value: "28", label: "Top universities" },
  { value: "3", label: "Countries" },
  { value: "5", label: "Essay dimensions scored" },
];

export default function CoachLanding() {
  return (
    <main>
      {/* ── Hero ───────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(60% 60% at 50% 0%, rgba(124,154,130,0.16), transparent 70%), radial-gradient(40% 40% at 85% 10%, rgba(212,154,160,0.14), transparent 70%)",
          }}
        />
        <div className="mx-auto max-w-4xl px-4 pb-16 pt-20 text-center sm:px-6 sm:pt-28">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-sand-deep bg-surface px-3.5 py-1.5 text-xs font-semibold text-sage-deep shadow-soft">
              <Sparkles className="h-3.5 w-3.5" />
              For high-schoolers applying to the US, UK & Canada
            </span>
          </Reveal>

          <Reveal delay={0.06}>
            <h1 className="font-display mt-6 text-5xl font-bold leading-[1.05] tracking-tight text-espresso sm:text-7xl">
              Get Into Your
              <br />
              <span className="text-sage-deep">Dream University</span>
            </h1>
          </Reveal>

          <Reveal delay={0.12}>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-cocoa">
              Studying abroad is overwhelming. We make it a plan. Find universities that fit your
              profile, get a personalized application roadmap, and polish your essay — all in one
              place, for free.
            </p>
          </Reveal>

          <Reveal delay={0.18}>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/coach/onboarding"
                className="group inline-flex items-center gap-2 rounded-xl bg-espresso px-7 py-3.5 text-base font-semibold text-cream shadow-soft transition-all hover:bg-sage-ink hover:shadow-lift"
              >
                Start your plan
                <ArrowRight className="h-4.5 w-4.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/coach/essay"
                className="inline-flex items-center gap-2 rounded-xl border border-sand-deep bg-surface px-7 py-3.5 text-base font-semibold text-espresso transition-all hover:border-sage hover:text-sage-ink"
              >
                Try essay feedback
              </Link>
            </div>
            <p className="mt-4 text-xs text-taupe">No sign-up · Works in your browser</p>
          </Reveal>

          <Reveal delay={0.24}>
            <div className="mx-auto mt-14 grid max-w-lg grid-cols-3 gap-4">
              {STATS.map((s) => (
                <div key={s.label} className="rounded-2xl border border-sand bg-surface px-4 py-5 shadow-soft">
                  <div className="font-display tabular text-3xl font-bold text-sage-deep">{s.value}</div>
                  <div className="fin-label mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Hero image ─────────────────────────────────────── */}
      <section className="mx-auto -mt-2 max-w-6xl px-4 sm:px-6">
        <Reveal>
          <div className="relative aspect-[16/9] overflow-hidden rounded-3xl border border-sand shadow-lift sm:aspect-[21/9]">
            <Image
              src="/coach/campus.jpg"
              alt="Students walking across a university campus"
              fill
              priority
              sizes="(max-width: 1152px) 100vw, 1152px"
              className="object-cover"
            />
            <div
              aria-hidden
              className="absolute inset-0"
              style={{ background: "linear-gradient(to top, rgba(45,42,36,0.55), transparent 55%)" }}
            />
            <div className="absolute bottom-0 left-0 p-6 sm:p-8">
              <p className="font-display text-2xl font-semibold text-cream drop-shadow sm:text-3xl">
                Your next four years start here
              </p>
              <p className="mt-1 max-w-md text-sm text-cream/85">
                Picture yourself on campus — then build the plan that gets you there.
              </p>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── University logo wall ───────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <Reveal>
          <p className="text-center text-sm font-medium text-taupe">
            Plan applications to world-class universities across the US, UK &amp; Canada
          </p>
        </Reveal>
        <div className="mt-6">
          <LogoWall />
        </div>
      </section>

      {/* ── How it works ───────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <Reveal>
          <div className="text-center">
            <p className="section-header">How it works</p>
            <h2 className="font-display mt-2 text-4xl font-bold tracking-tight text-espresso">
              From confused to admitted, in three steps
            </h2>
          </div>
        </Reveal>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <Reveal key={step.n} delay={i * 0.08}>
              <div className="group h-full rounded-2xl border border-sand bg-surface p-7 shadow-soft transition-all hover:border-sage/50 hover:shadow-lift">
                <div className="flex items-center justify-between">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-sage-tint text-sage-deep transition-colors group-hover:bg-sage group-hover:text-white">
                    <step.icon className="h-6 w-6" strokeWidth={2} />
                  </span>
                  <span className="font-display tabular text-3xl font-bold text-sand-deep">{step.n}</span>
                </div>
                <h3 className="font-display mt-5 text-2xl font-semibold text-espresso">{step.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-cocoa">{step.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Gallery ────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 pb-8 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-3">
          {GALLERY.map((g, i) => (
            <Reveal key={g.src} delay={i * 0.08}>
              <figure className="group relative aspect-[4/5] overflow-hidden rounded-2xl border border-sand shadow-soft">
                <Image
                  src={g.src}
                  alt={g.alt}
                  fill
                  sizes="(max-width: 640px) 100vw, 384px"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div
                  aria-hidden
                  className="absolute inset-0"
                  style={{ background: "linear-gradient(to top, rgba(45,42,36,0.6), transparent 50%)" }}
                />
                <figcaption className="absolute bottom-0 left-0 p-5">
                  <span className="fin-label text-cream/80">{String(i + 1).padStart(2, "0")}</span>
                  <p className="font-display text-xl font-semibold text-cream">{g.caption}</p>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Closing CTA ────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl border border-sage/30 bg-sage-ink px-8 py-14 text-center shadow-lift">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "radial-gradient(50% 80% at 50% 0%, rgba(229,237,228,0.18), transparent 70%)",
              }}
            />
            <h2 className="font-display relative text-4xl font-bold tracking-tight text-cream sm:text-5xl">
              Your dream school is closer than you think
            </h2>
            <p className="relative mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-sage-tint">
              Build your shortlist and a complete application timeline in the next few minutes.
            </p>
            <Link
              href="/coach/onboarding"
              className="group relative mt-8 inline-flex items-center gap-2 rounded-xl bg-cream px-7 py-3.5 text-base font-semibold text-espresso shadow-soft transition-all hover:bg-surface hover:shadow-lift"
            >
              Start onboarding
              <ArrowRight className="h-4.5 w-4.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </Reveal>
      </section>
    </main>
  );
}
