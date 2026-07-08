"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useParams } from "next/navigation";
import { deleteTrip } from "../storage";
import { useTrips } from "../useTrips";
import { cityEmoji } from "../presentation";

const money = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

const prettyDate = (iso: string) =>
  new Date(iso + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

const EASE = [0.22, 1, 0.36, 1] as const;

// Thumbnail: landmark emoji over a sand tile (matches the editorial palette).
function Thumb({ city }: { city: string }) {
  return (
    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-sand bg-sand-deep text-2xl sm:h-20 sm:w-20">
      {cityEmoji(city)}
    </div>
  );
}

export default function SavedTripsPage() {
  const params = useParams();
  const lang = (params?.lang as string) || "en";
  const trips = useTrips(); // reactive; empty during SSR

  function handleDelete(id: string) {
    if (!confirm("Delete this trip? This can't be undone.")) return;
    deleteTrip(id);
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <motion.header
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE }}
        className="mb-8 flex items-end justify-between gap-4"
      >
        <div>
          <p className="section-header">Your collection</p>
          <h1 className="font-display mt-1 text-4xl font-semibold tracking-tight text-espresso">Saved trips</h1>
        </div>
        <Link href={`/${lang}/travel-planner`} className="rounded-xl bg-sage px-4 py-2.5 text-sm font-semibold text-white shadow-lift transition-colors hover:bg-sage-deep">
          + New trip
        </Link>
      </motion.header>

      {trips.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE }}
          className="rounded-2xl border border-dashed border-sand-deep bg-surface-2 p-12 text-center"
        >
          <div className="text-4xl">🧭</div>
          <p className="mt-3 text-cocoa">No saved trips yet.</p>
          <Link href={`/${lang}/travel-planner`} className="mt-5 inline-block rounded-xl bg-sage px-5 py-2.5 text-sm font-semibold text-white shadow-lift transition-colors hover:bg-sage-deep">
            Plan your first trip
          </Link>
        </motion.div>
      ) : (
        <ul className="grid gap-3">
          {trips.map((trip, i) => {
            const city = trip.plan.destination?.city ?? trip.input.to;
            return (
              <motion.li
                key={trip.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: EASE, delay: i * 0.05 }}
                whileHover={{ y: -3 }}
                className="rounded-2xl border border-sand bg-surface p-5 shadow-soft transition-all hover:border-sage/50 hover:shadow-lift"
              >
                <div className="flex items-start gap-4">
                  <Thumb city={city} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h2 className="font-display truncate text-xl font-semibold text-espresso">{trip.name}</h2>
                        <p className="mt-0.5 text-sm text-cocoa">
                          {prettyDate(trip.input.startDate)} – {prettyDate(trip.input.endDate)} · {trip.plan.days} days
                          <span className="ml-2 rounded bg-sage-tint px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sage-ink">{trip.plan.style}</span>
                        </p>
                        <p className="mt-2 text-sm text-taupe">
                          <span className="tabular">Budget {money(trip.plan.budget)} · est. {money(trip.plan.estimatedTripCost)}</span>
                          {trip.plan.destination && <> · {trip.plan.destination.currency} · best {trip.plan.destination.bestMonths.join(", ")}</>}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <Link href={`/${lang}/travel-planner?edit=${trip.id}`} className="rounded-lg border border-sand-deep px-3 py-1.5 text-sm font-medium text-cocoa transition-all hover:border-sage hover:text-sage-ink">
                          Edit
                        </Link>
                        <button onClick={() => handleDelete(trip.id)} className="rounded-lg border border-neg/40 px-3 py-1.5 text-sm font-medium text-rose-ink transition-colors hover:bg-neg-tint">
                          Delete
                        </button>
                      </div>
                    </div>

                    <details className="mt-3">
                      <summary className="cursor-pointer text-sm font-semibold text-sage-deep">View itinerary</summary>
                      <ol className="mt-2 grid gap-1.5 text-sm text-cocoa">
                        {trip.plan.itinerary.map((d) => (
                          <li key={d.day}>
                            <span className="font-semibold text-espresso">Day {d.day}:</span> {d.title}
                          </li>
                        ))}
                      </ol>
                    </details>
                  </div>
                </div>
              </motion.li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
