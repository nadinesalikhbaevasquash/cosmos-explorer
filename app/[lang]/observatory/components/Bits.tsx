'use client'

/**
 * Small instrument-panel pieces shared by every mission, so a readout on mission 2
 * looks and reads exactly like one on mission 1.
 */

import { motion } from 'framer-motion'
import { useDict } from '@/app/hooks/useDict'

export function Readout({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone?: 'good' | 'warn'
}) {
  const colour =
    tone === 'good' ? 'text-emerald-300' : tone === 'warn' ? 'text-amber-300' : 'text-white'
  return (
    <div className="min-w-0 rounded-xl border border-white/5 bg-[#060b18] px-3 py-2">
      <div className={`font-mono text-[14px] font-semibold tabular-nums break-words ${colour}`}>{value}</div>
      <div className="mt-0.5 text-[10px] uppercase tracking-wider text-slate-500">{label}</div>
    </div>
  )
}

export function Notice({
  tone,
  children,
}: {
  tone: 'good' | 'warn' | 'neutral'
  children: React.ReactNode
}) {
  const tones = {
    good: 'border-emerald-400/20 bg-emerald-500/15 text-emerald-300',
    warn: 'border-amber-400/20 bg-amber-500/10 text-amber-300',
    neutral: 'border-white/10 bg-white/[0.04] text-slate-300',
  }
  return (
    <div className={`rounded-xl border px-4 py-3 text-[13px] leading-relaxed ${tones[tone]}`}>
      {children}
    </div>
  )
}

/** Warm/cold feedback while dragging, so the search is a hunt and not a lottery. */
export function FoldMeter({ score }: { score: number }) {
  const m = useDict().observatory.ui.meter
  const label = score > 0.75 ? m.locked : score > 0.5 ? m.close : score > 0.25 ? m.warmer : m.scattered
  const colour = score > 0.5 ? '#4ade80' : score > 0.25 ? '#e2b43d' : '#64748b'
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-[11px]">
        <span className="text-slate-500">{m.label}</span>
        <span className="font-medium" style={{ color: colour }}>
          {label}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.04]">
        <motion.div
          className="h-full rounded-full"
          animate={{ width: `${score * 100}%`, backgroundColor: colour }}
          transition={{ duration: 0.15 }}
        />
      </div>
    </div>
  )
}

/* ── Period control ─────────────────────────────────────────────────────── */

/**
 * The trial-period slider, with nudge buttons.
 *
 * The slider is logarithmic so that a day of drag near 1.5 days is as findable as a
 * day near 20. On its own it is not precise enough: TRAPPIST-1b goes round twenty
 * times in a month, so a period 0.2% off smears its transits across the fold, and a
 * thumb on a 350-pixel phone slider cannot hit 0.2%. The nudges step by 1% and by
 * 0.05%, which is fine enough for the shortest orbit in either mission and big
 * enough to tap.
 */
export function PeriodControl({
  period,
  onChange,
  min,
  max,
  id = 'period',
}: {
  period: number
  onChange: (p: number) => void
  min: number
  max: number
  id?: string
}) {
  const u = useDict().observatory.ui
  const lo = Math.log10(min)
  const hi = Math.log10(max)
  const fraction = (Math.log10(period) - lo) / (hi - lo)
  const clamp = (p: number) => Math.min(max, Math.max(min, p))
  const nudge = (rel: number) => onChange(clamp(period * (1 + rel)))

  const nudges: { rel: number; glyph: string; label: string }[] = [
    { rel: -0.01, glyph: '−1%', label: u.nudgeDownBig },
    { rel: -0.0005, glyph: '−', label: u.nudgeDown },
    { rel: 0.0005, glyph: '+', label: u.nudgeUp },
    { rel: 0.01, glyph: '+1%', label: u.nudgeUpBig },
  ]

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-[12px] text-slate-500">
          {u.trialPeriod}
        </label>
        <span className="font-mono text-lg font-semibold text-white tabular-nums">
          {period.toFixed(3)} <span className="text-[12px] font-normal text-slate-500">{u.days}</span>
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={0}
        max={1}
        step={0.0002}
        value={fraction}
        onChange={(e) => onChange(Math.pow(10, lo + parseFloat(e.target.value) * (hi - lo)))}
        className="an-range w-full accent-indigo-400 cursor-grab active:cursor-grabbing"
      />
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-mono text-slate-500">
          {min} {u.d}
        </span>
        <div className="flex gap-1.5" role="group" aria-label={u.fineTune}>
          {nudges.map((n) => (
            <button
              key={n.glyph}
              type="button"
              onClick={() => nudge(n.rel)}
              aria-label={n.label}
              title={n.label}
              className="h-9 min-w-9 rounded-lg border border-white/10 bg-white/[0.04] px-2 font-mono text-[12px] text-slate-300 transition-colors hover:border-indigo-400/40 hover:text-white active:bg-indigo-500/20"
            >
              {n.glyph}
            </button>
          ))}
        </div>
        <span className="text-[10px] font-mono text-slate-500">
          {max} {u.d}
        </span>
      </div>
    </div>
  )
}
