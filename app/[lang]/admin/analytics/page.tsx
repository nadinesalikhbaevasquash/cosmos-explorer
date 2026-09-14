import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getSessionUser } from "@/app/lib/session";
import { readRange, type DayStats } from "@/app/lib/traffic";

export const metadata: Metadata = {
  title: "Traffic",
  robots: { index: false, follow: false },
};

// Counters are written on every request; a cached copy of this page would be a
// lie within seconds.
export const dynamic = "force-dynamic";

/**
 * Owner-only traffic dashboard.
 *
 * Gated by ASTRANOVA_ADMIN_EMAILS, and answers 404 rather than 403 to everyone
 * else — a 403 would confirm the page exists.
 */
const ADMIN_EMAILS = (
  process.env.ASTRANOVA_ADMIN_EMAILS ?? "nadine.salikhbaeva@gmail.com"
)
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

function Bar({ value, max, colour }: { value: number; max: number; colour: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: colour }} />
    </div>
  );
}

function Table({
  title,
  rows,
  colour,
}: {
  title: string;
  rows: [string, number][];
  colour: string;
}) {
  const max = rows.length ? Math.max(...rows.map(([, n]) => n)) : 0;
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
      <h2 className="mb-4 text-[15px] font-bold text-white">{title}</h2>
      {rows.length === 0 ? (
        <p className="text-[14px] text-slate-500">Nothing yet.</p>
      ) : (
        <ol className="space-y-3">
          {rows.map(([label, n]) => (
            <li key={label}>
              <div className="mb-1 flex items-baseline justify-between gap-3">
                <span className="truncate text-[14px] text-slate-300">{label}</span>
                <span className="tabular-nums text-[14px] font-semibold text-white">{n}</span>
              </div>
              <Bar value={n} max={max} colour={colour} />
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

/** Merge one counter across every day in range, biggest first. */
function totals(days: DayStats[], key: "paths" | "referrers" | "langs" | "events") {
  const out: Record<string, number> = {};
  for (const d of days) {
    for (const [k, n] of Object.entries(d[key] ?? {})) out[k] = (out[k] ?? 0) + n;
  }
  return Object.entries(out).sort((a, b) => b[1] - a[1]).slice(0, 12);
}

export default async function AnalyticsPage() {
  const user = await getSessionUser();
  if (!user || !ADMIN_EMAILS.includes(user.email.toLowerCase())) notFound();

  const days = await readRange(30);
  const views = days.reduce((a, d) => a + d.views, 0);
  const visitors = days.reduce((a, d) => a + d.visitors, 0);
  const peak = Math.max(1, ...days.map((d) => d.views));
  const today = days[days.length - 1];

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#060b18" }}>
      <main className="mx-auto max-w-4xl px-6 py-14">
        <h1 className="text-3xl font-bold text-white">Traffic</h1>
        <p className="mt-2 text-[15px] text-slate-400">
          Last 30 days. Counted on this site, stored on Netlify, shared with nobody.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            ["Pageviews", views, "#7e88ec"],
            ["Visitors", visitors, "#34d399"],
            ["Today", today?.views ?? 0, "#e2b43d"],
          ].map(([label, n, c]) => (
            <div key={String(label)} className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
              <p className="text-4xl font-bold tabular-nums" style={{ color: String(c) }}>
                {String(n)}
              </p>
              <p className="mt-1 text-[14px] text-slate-400">{String(label)}</p>
            </div>
          ))}
        </div>

        {/* Daily shape. A sparkline would be prettier; bars are readable at n=30. */}
        <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
          <h2 className="mb-4 text-[15px] font-bold text-white">Pageviews per day</h2>
          <div className="flex h-32 items-end gap-1">
            {days.map((d) => (
              <div
                key={d.date}
                title={`${d.date}: ${d.views} views, ${d.visitors} visitors`}
                className="flex-1 rounded-t"
                style={{
                  height: `${Math.max(2, (d.views / peak) * 100)}%`,
                  background: d.views ? "#7e88ec" : "rgba(255,255,255,0.06)",
                }}
              />
            ))}
          </div>
          <div className="mt-2 flex justify-between text-[12px] text-slate-600">
            <span>{days[0]?.date}</span>
            <span>{days[days.length - 1]?.date}</span>
          </div>
        </section>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Table title="Pages" rows={totals(days, "paths")} colour="#7e88ec" />
          <Table title="Where they came from" rows={totals(days, "referrers")} colour="#b884ed" />
          <Table title="Language" rows={totals(days, "langs")} colour="#34d399" />
          <Table title="What they did" rows={totals(days, "events")} colour="#e2b43d" />
        </div>
      </main>
    </div>
  );
}
