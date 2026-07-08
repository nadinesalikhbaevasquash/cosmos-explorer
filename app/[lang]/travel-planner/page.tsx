"use client";

import { Suspense, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { generatePlan, STYLE_META } from "./planner";
import { findDestination, DESTINATIONS } from "./data/destinations";
import { createTrip, getTrip, updateTrip } from "./storage";
import { cityEmoji, costLevel, topHighlights } from "./presentation";
import { useDestinationInfo, usePlaceInfo, type DestinationLive, type PlaceMap } from "./useRealData";
import type { TravelPlan, TravelStyle } from "./types";
import type { Destination } from "./data/types";

const STYLES: TravelStyle[] = ["budget", "comfort", "luxury"];
const SUGGESTED = ["Tokyo", "Paris", "Bali", "New York", "Barcelona", "Istanbul"];
const EASE = [0.22, 1, 0.36, 1] as const;

const money = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const prettyDate = (iso: string) =>
  new Date(iso + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
const truncate = (s: string, n = 150) => (s.length > n ? s.slice(0, n).trimEnd() + "…" : s);

const fadeUp = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07, delayChildren: 0.04 } } };

// Wikimedia images are streamed through our own origin (/api/travel/image) so
// the browser never has to reach upload.wikimedia.org directly — that host is
// blocked/unreliable on some networks, which silently broke every photo.
function proxiedSrc(src: string): string {
  return src.includes("upload.wikimedia.org") ? `/api/travel/image?url=${encodeURIComponent(src)}` : src;
}

// Real photo with graceful fallback: on error renders nothing, revealing the
// sand placeholder beneath. Keyed by src so error state resets per image.
function DestImage({ src, className }: { src: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={proxiedSrc(src)} alt="" aria-hidden onError={() => setFailed(true)} className={className} />
  );
}

// ── Hero ──────────────────────────────────────────────────────────────────
function Hero({
  dest, live, loading, query, onPick, featured,
}: {
  dest: Destination | undefined;
  live: DestinationLive | null;
  loading: boolean;
  query: string;
  onPick: (city: string) => void;
  featured: PlaceMap;
}) {
  return (
    <section className="relative overflow-hidden border-b border-sand bg-cream">
      <div className="pointer-events-none absolute -left-24 -top-28 h-[460px] w-[460px] rounded-full bg-sage/20 blur-[130px]" />
      <div className="pointer-events-none absolute right-0 top-8 h-[420px] w-[420px] rounded-full bg-rose/20 blur-[140px]" />

      <div className="relative mx-auto max-w-6xl px-4 pb-14 pt-14 sm:px-6 sm:pb-16 sm:pt-20">
        <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
          <AnimatePresence mode="wait">
            {dest ? (
              <motion.div key={dest.city} initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: 0.55, ease: EASE }}>
                <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-sage/25 bg-surface px-3 py-1.5 text-xs font-semibold text-sage-deep shadow-soft">
                  <span aria-hidden>📍</span> {live?.weather?.country ?? dest.country}
                </span>
                <h1 className="font-display text-5xl font-semibold leading-[1.02] tracking-tight text-espresso sm:text-6xl lg:text-7xl">
                  {dest.city}
                </h1>

                {/* real description from Wikipedia */}
                {loading ? (
                  <div className="mt-5 max-w-xl space-y-2">
                    <div className="h-3.5 w-full animate-pulse rounded bg-sand" />
                    <div className="h-3.5 w-4/5 animate-pulse rounded bg-sand" />
                  </div>
                ) : (
                  <p className="mt-5 max-w-xl text-base leading-relaxed text-cocoa sm:text-lg">
                    {live?.description ?? "A standout destination — generate a plan to see the day-by-day."}
                  </p>
                )}

                {/* real current weather + cost level */}
                <div className="mt-5 flex flex-wrap items-center gap-2.5">
                  {live?.weather && (
                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-sand bg-surface px-2.5 py-1 text-sm text-cocoa shadow-soft">
                      <span aria-hidden>{live.weather.emoji}</span> {live.weather.text} · {live.weather.tempC}°C now
                    </span>
                  )}
                  <CostLevel touristPerDay={dest.costs.touristPerDay} />
                </div>

                <div className="mt-6">
                  <p className="section-header">Travel highlights</p>
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {topHighlights(dest, 4).map((a) => (
                      <span key={a.name} className="rounded-lg border border-sand bg-surface px-2.5 py-1 text-xs font-medium text-cocoa shadow-soft">
                        {a.name}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div key="aspirational" initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: 0.55, ease: EASE }}>
                <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-sage/25 bg-surface px-3 py-1.5 text-xs font-semibold text-sage-deep shadow-soft">
                  <span className="h-1.5 w-1.5 rounded-full bg-sage" /> Real places, real weather, your budget
                </span>
                <h1 className="font-display text-5xl font-semibold leading-[1.03] tracking-tight text-espresso sm:text-6xl lg:text-7xl">
                  Where to{" "}
                  <span className="bg-gradient-to-r from-sage-deep via-sage to-rose-deep bg-clip-text italic text-transparent">next?</span>
                </h1>
                <p className="mt-5 max-w-xl text-base leading-relaxed text-cocoa sm:text-lg">
                  Choose a destination and we&apos;ll compose a day-by-day itinerary — with real descriptions, photos, and current weather, tuned to your budget.
                </p>
                <div className="mt-7">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-taupe-soft">Start with</p>
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {SUGGESTED.map((city) => (
                      <button key={city} type="button" onClick={() => onPick(city)} className="rounded-lg border border-sand bg-surface px-3 py-1.5 text-sm font-medium text-cocoa shadow-soft transition-all hover:border-sage/50 hover:text-sage-deep">
                        {cityEmoji(city)} {city}
                      </button>
                    ))}
                  </div>
                  {query.trim() && (
                    <p className="mt-4 text-sm text-taupe">No guide for &ldquo;{query.trim()}&rdquo; yet — we&apos;ll still plan your days. Try one above for the full experience.</p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* right column — single hero photo when a city is chosen, else a
              live collage of real destination photos */}
          <div className="hidden lg:block">
            <AnimatePresence mode="wait">
              {dest ? (
                <motion.div
                  key={dest.city}
                  initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.5, ease: EASE }}
                  className={`relative h-[440px] overflow-hidden rounded-3xl border border-sand bg-sand-deep shadow-lift ${loading ? "animate-pulse" : ""}`}
                >
                  {live?.image && <DestImage key={live.image} src={live.image} className="h-full w-full object-cover" />}
                  <div className="absolute inset-0 flex items-center justify-center text-7xl opacity-30">{cityEmoji(dest.city)}</div>
                  <div className="absolute inset-0 bg-gradient-to-t from-espresso/40 via-transparent to-transparent" />
                  <div className="absolute inset-x-5 bottom-5 flex items-center gap-3 rounded-2xl border border-white/50 bg-surface/85 p-4 shadow-soft backdrop-blur-md">
                    <span className="text-3xl">{cityEmoji(dest.city)}</span>
                    <div>
                      <p className="text-sm font-bold text-espresso">{dest.attractions.length} sights mapped</p>
                      <p className="text-[11px] text-taupe">Photos &amp; facts via Wikipedia</p>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="collage"
                  initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.5, ease: EASE }}
                  className="grid h-[440px] grid-cols-2 gap-3"
                >
                  {SUGGESTED.map((city) => {
                    const img = featured[city]?.image;
                    return (
                      <button
                        key={city}
                        type="button"
                        onClick={() => onPick(city)}
                        className="group relative overflow-hidden rounded-2xl border border-sand bg-sand-deep shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lift"
                      >
                        {img && <DestImage key={img} src={img} className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />}
                        <span className="absolute inset-0 flex items-center justify-center text-4xl opacity-30">{cityEmoji(city)}</span>
                        <span className="absolute inset-0 bg-gradient-to-t from-espresso/70 via-espresso/10 to-transparent" />
                        <span className="absolute bottom-2.5 left-3 text-sm font-semibold text-white drop-shadow">{city}</span>
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}

function CostLevel({ touristPerDay }: { touristPerDay: number }) {
  const level = costLevel(touristPerDay);
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg border border-sand bg-surface px-2.5 py-1 text-sm text-cocoa shadow-soft">
      <span className="tabular font-semibold text-sage-deep">
        {["$", "$", "$"].map((s, i) => (
          <span key={i} style={{ opacity: i < level.tier ? 1 : 0.25 }}>{s}</span>
        ))}
      </span>
      {level.label}
    </span>
  );
}

// ── Budget breakdown ────────────────────────────────────────────────────────
function BudgetRow({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-2">
      <div>
        <span className="text-sm text-espresso">{label}</span>
        {sub && <span className="ml-2 text-xs text-taupe">{sub}</span>}
      </div>
      <span className="tabular shrink-0 text-sm font-semibold text-espresso">{value}</span>
    </div>
  );
}

function BudgetBreakdown({ plan }: { plan: TravelPlan }) {
  const b = plan.costBreakdown;
  if (!b) return null;
  const onGround = plan.estimatedTripCost;
  const forFlightsAndStay = Math.max(0, plan.budget - onGround);
  const nights = Math.max(plan.nights, 1);
  const nightly = Math.round(forFlightsAndStay / nights);

  return (
    <div className="mt-4 rounded-2xl border border-sand bg-surface-2 p-5">
      <div className="flex items-center justify-between">
        <p className="section-header">Budget breakdown</p>
        <span className="rounded-full bg-sage-tint px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sage-ink">{plan.style}</span>
      </div>

      {/* The budget lever: with a bigger budget, this nightly figure grows. */}
      <div className="mt-3 rounded-xl border border-sage/30 bg-sage-tint/60 p-4">
        <p className="fin-label">Your hotel budget</p>
        <p className="font-display mt-0.5 text-3xl font-semibold text-sage-ink">
          {money(nightly)}<span className="text-base font-medium text-cocoa"> / night</span>
        </p>
        <p className="mt-1 text-xs text-cocoa">
          {money(forFlightsAndStay)} left for flights + {nights} {nights === 1 ? "night" : "nights"} after on-the-ground costs.
        </p>
      </div>

      <div className="mt-3 divide-y divide-sand">
        <BudgetRow label="Flights" value="Connect API" sub="live fares need a provider key" />
        <BudgetRow label="Accommodation" value={`~${money(nightly)}/night`} sub="connect a hotels API for live stays" />
        <BudgetRow label="Activities & entries" value={money(b.activities)} />
        <BudgetRow label="Food" value={money(b.food)} sub="est." />
        <BudgetRow label="Local transport" value={money(b.transport)} sub="est." />
      </div>

      <div className="mt-2 flex items-baseline justify-between border-t border-sand-deep pt-3">
        <span className="text-sm font-semibold text-espresso">On-the-ground subtotal</span>
        <span className="tabular text-sm font-bold text-espresso">{money(onGround)}</span>
      </div>
      <div className="flex items-baseline justify-between">
        <span className="text-sm text-taupe">Your total budget</span>
        <span className="tabular text-sm text-taupe">{money(plan.budget)}</span>
      </div>

      <p className="mt-3 rounded-lg border border-warn/30 bg-warn-tint px-3 py-2 text-xs text-espresso">
        ✦ Flights &amp; hotels show live prices once a provider API key is connected. Everything above updates with your budget now.
      </p>
    </div>
  );
}

// ── Planner + result ────────────────────────────────────────────────────────
function PlannerForm() {
  const params = useParams();
  const router = useRouter();
  const search = useSearchParams();
  const lang = (params?.lang as string) || "en";
  const editId = search.get("edit");

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [budget, setBudget] = useState("");
  const [style, setStyle] = useState<TravelStyle>("comfort");

  const [plan, setPlan] = useState<TravelPlan | null>(null);
  const [error, setError] = useState<string | null>(null);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!editId) return;
    const trip = getTrip(editId);
    if (!trip) {
      setError("That trip could not be found — it may have been deleted.");
      return;
    }
    setFrom(trip.input.from);
    setTo(trip.input.to);
    setStartDate(trip.input.startDate);
    setEndDate(trip.input.endDate);
    setBudget(String(trip.input.budget));
    setStyle(trip.input.style);
    setPlan(trip.plan);
  }, [editId]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const liveDest = findDestination(to);
  const { info: destLive, loading: destLoading } = useDestinationInfo(liveDest?.city);
  // Real photos for the landing collage (fetched once).
  const featured = usePlaceInfo("featured", SUGGESTED);

  // Real attraction descriptions + photos for the generated itinerary.
  const planKey = plan ? `${plan.to}|${plan.startDate}|${plan.endDate}|${plan.style}` : "";
  const itemNames = plan ? [...new Set(plan.itinerary.flatMap((d) => d.items.map((it) => it.name)))] : [];
  const placeMap = usePlaceInfo(planKey, itemNames);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = generatePlan({ from, to, startDate, endDate, budget: Number(budget), style });
    if (result.ok) {
      setPlan(result.plan);
      setError(null);
    } else {
      setPlan(null);
      setError(result.error);
    }
  }

  function handleSave() {
    const input = { from, to, startDate, endDate, budget: Number(budget), style };
    try {
      if (editId) updateTrip(editId, input);
      else createTrip(input);
      router.push(`/${lang}/travel-planner/trips`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save trip.");
    }
  }

  return (
    <>
      <Hero dest={liveDest} live={destLive} loading={destLoading} query={to} onPick={setTo} featured={featured} />

      {/* TRIP PLANNER */}
      <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: EASE }}
          className="rounded-2xl border border-sand bg-surface p-6 shadow-soft sm:p-8"
        >
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className="section-header">Trip planner</p>
              <h2 className="font-display mt-1 text-2xl font-semibold tracking-tight text-espresso">Plan your trip</h2>
            </div>
            {editId && <span className="rounded-full border border-warn/40 bg-warn-tint px-3 py-1 text-xs font-semibold text-espresso">Editing saved trip</span>}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="From"><input type="text" value={from} onChange={(e) => setFrom(e.target.value)} placeholder="Departure city" className={inputClass} /></Field>
            <Field label="To">
              <input type="text" value={to} onChange={(e) => setTo(e.target.value)} placeholder="Destination city" list="known-destinations" className={inputClass} />
              <datalist id="known-destinations">{DESTINATIONS.map((d) => <option key={d.city} value={d.city} />)}</datalist>
              {liveDest && <span className="text-xs font-semibold text-sage-deep">✓ {liveDest.city}, {liveDest.country} — full guide available</span>}
            </Field>
            <Field label="Start date"><input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputClass} /></Field>
            <Field label="End date"><input type="date" value={endDate} min={startDate || undefined} onChange={(e) => setEndDate(e.target.value)} className={inputClass} /></Field>
            <Field label="Total budget (USD)"><input type="number" min={0} value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="e.g. 2500" className={inputClass} /></Field>
            <Field label="Travel style">
              <div className="grid grid-cols-3 gap-2">
                {STYLES.map((s) => {
                  const active = style === s;
                  return (
                    <button type="button" key={s} onClick={() => setStyle(s)} className={`rounded-xl border px-2 py-2.5 text-sm font-semibold transition-all ${active ? "border-sage bg-sage-tint text-sage-ink" : "border-sand-deep bg-surface text-cocoa hover:border-sage/50"}`}>
                      {STYLE_META[s].label}
                    </button>
                  );
                })}
              </div>
            </Field>
          </div>

          <p className="mt-3 text-xs text-taupe">{STYLE_META[style].blurb}</p>
          {error && <p className="mt-3 rounded-xl border border-neg/40 bg-neg-tint px-3 py-2 text-sm text-rose-ink">{error}</p>}

          <motion.button type="submit" whileHover={{ y: -2 }} whileTap={{ scale: 0.99 }} className="mt-5 w-full rounded-xl bg-sage px-4 py-3.5 text-sm font-semibold text-white shadow-lift transition-colors hover:bg-sage-deep">
            {editId ? "Regenerate plan" : "Generate travel plan"}
          </motion.button>
        </motion.form>
      </section>

      {/* GENERATED ITINERARY */}
      <AnimatePresence>
        {plan && (
          <motion.section key="itinerary" initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }} transition={{ duration: 0.55, ease: EASE }} className="mx-auto max-w-3xl px-4 pb-24 sm:px-6">
            <div className="relative overflow-hidden rounded-2xl border border-sand bg-surface shadow-soft">
              <div className="relative h-36 overflow-hidden bg-sand-deep sm:h-48">
                {destLive?.image && <DestImage key={destLive.image} src={destLive.image} className="h-full w-full object-cover" />}
                <div className="absolute inset-0 flex items-center justify-center text-6xl opacity-25">{plan.destination ? cityEmoji(plan.destination.city) : "🧭"}</div>
                <div className="absolute inset-0 bg-gradient-to-t from-espresso/55 to-transparent" />
                <div className="absolute bottom-4 left-5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-white/80">{plan.from} → {plan.to}</p>
                  <p className="font-display text-3xl font-semibold text-white">{plan.to}</p>
                </div>
                {destLive?.weather && (
                  <span className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-lg bg-surface/85 px-2.5 py-1 text-xs font-medium text-espresso shadow-soft backdrop-blur-md">
                    {destLive.weather.emoji} {destLive.weather.tempC}°C
                  </span>
                )}
              </div>

              <div className="p-6 sm:p-7">
                {destLive?.description && <p className="text-sm leading-relaxed text-cocoa">{destLive.description}</p>}

                <div className="mt-5 grid grid-cols-2 divide-sand rounded-xl border border-sand sm:grid-cols-4 sm:divide-x">
                  <Stat label="Dates" value={`${prettyDate(plan.startDate)} – ${prettyDate(plan.endDate)}`} />
                  <Stat label="Length" value={`${plan.days}d / ${plan.nights}n`} />
                  <Stat label="Budget" value={money(plan.budget)} />
                  <Stat label="Suggested / day" value={money(plan.suggestedDailyBudget)} />
                </div>

                <BudgetBreakdown plan={plan} />

                <motion.button onClick={handleSave} whileHover={{ y: -2 }} whileTap={{ scale: 0.99 }} className="mt-5 rounded-xl bg-espresso px-5 py-2.5 text-sm font-semibold text-cream shadow-lift transition-colors hover:bg-cocoa">
                  {editId ? "Update trip" : "Save trip"}
                </motion.button>
              </div>
            </div>

            <div className="mb-3 mt-8 flex items-baseline justify-between">
              <h3 className="font-display text-xl font-semibold tracking-tight text-espresso">Day-by-day itinerary</h3>
              <span className="section-header">{plan.days} days</span>
            </div>

            <motion.ol variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }} className="grid gap-3">
              {plan.itinerary.map((d) => (
                <motion.li key={d.day} variants={fadeUp} whileHover={{ y: -3 }} transition={{ type: "spring", stiffness: 300, damping: 24 }} className="rounded-2xl border border-sand bg-surface p-5 shadow-soft transition-shadow hover:border-sage/50 hover:shadow-lift">
                  <div className="flex items-baseline justify-between gap-3">
                    <div className="flex items-baseline gap-2.5">
                      <span className="rounded-md bg-sage-tint px-2 py-0.5 text-xs font-bold text-sage-ink">Day {d.day}</span>
                      <span className="text-sm text-taupe">{prettyDate(d.date)}</span>
                    </div>
                    <span className="tabular text-sm font-semibold text-espresso">~{money(d.estimatedCost)}<span className="text-xs font-normal text-taupe"> on-ground</span></span>
                  </div>
                  <p className="font-display mt-2 text-lg font-semibold text-espresso">{d.title}</p>

                  {d.items.length > 0 && (
                    <ul className="mt-3 grid gap-3">
                      {d.items.map((it) => (
                        <ItineraryItem key={it.name} name={it.name} category={it.category} durationHours={it.durationHours} cost={it.cost} place={placeMap[it.name]} />
                      ))}
                    </ul>
                  )}
                  {d.notes.length > 0 && <p className="mt-3 text-xs text-taupe">{d.notes.join(" · ")}</p>}
                </motion.li>
              ))}
            </motion.ol>

            <p className="mt-6 text-center text-xs text-taupe">Descriptions &amp; photos from Wikipedia · weather from Open-Meteo</p>
          </motion.section>
        )}
      </AnimatePresence>
    </>
  );
}

function ItineraryItem({
  name, category, durationHours, cost, place,
}: {
  name: string; category: string; durationHours: number; cost: number; place: PlaceMap[string];
}) {
  return (
    <li className="flex gap-3 rounded-xl border border-sand bg-surface-2 p-2.5">
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-sand bg-sand-deep">
        {place?.image && <DestImage key={place.image} src={place.image} className="h-full w-full object-cover" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className="truncate text-sm font-semibold text-espresso">{name}</p>
          <span className="tabular shrink-0 text-xs text-taupe">~{durationHours}h · {cost === 0 ? "free" : money(cost)}</span>
        </div>
        <span className="mt-0.5 inline-block rounded bg-cream-deep px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-cocoa">{category}</span>
        {place?.description ? (
          <p className="mt-1 text-xs leading-relaxed text-cocoa">{truncate(place.description, 160)}</p>
        ) : (
          <p className="mt-1 text-xs text-taupe">A recommended {category.toLowerCase()} stop.</p>
        )}
      </div>
    </li>
  );
}

export default function TravelPlannerPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-cream" />}>
      <PlannerForm />
    </Suspense>
  );
}

const inputClass =
  "w-full rounded-xl border border-sand-deep bg-surface px-3.5 py-2.5 text-sm text-espresso placeholder-taupe-soft shadow-soft outline-none transition-colors focus:border-sage";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5">
      <span className="fin-label">{label}</span>
      {children}
    </label>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-3 py-2.5">
      <p className="fin-label">{label}</p>
      <p className="tabular mt-0.5 text-sm font-bold text-espresso">{value}</p>
    </div>
  );
}
