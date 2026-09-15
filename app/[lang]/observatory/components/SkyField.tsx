'use client'

/**
 * Target selection: the survey field, and the place nights get spent.
 *
 * A grid of cards rather than a literal star map. A scatter of dots on a black
 * rectangle looks more like an observatory, but it hides exactly the information the
 * player needs to make the only real decision here: which stars are worth their
 * nights. Spectral type, brightness and radius are the whole basis of that call, so
 * they are on the face of the card, not behind a hover.
 *
 * Nothing here reveals whether a star has a planet. The cards for TRAPPIST-1 and
 * Barnard's Star are identical in kind, and the only way to tell them apart is to
 * spend nights and look.
 */

import { motion } from 'framer-motion'
import { useDict } from '@/app/hooks/useDict'
import { fmt } from '../lib/format'
import type { Star } from '../lib/stars'
import type { Verdict } from '../lib/campaign'

type Props = {
  stars: Star[]
  nightsOn: Record<string, number>
  verdicts: Record<string, Verdict>
  nightsRemaining: number
  onObserve: (starId: string, nights: number) => void
  onOpen: (starId: string) => void
}

const BATCHES = [3, 6, 12]

export default function SkyField({
  stars,
  nightsOn,
  verdicts,
  nightsRemaining,
  onObserve,
  onOpen,
}: Props) {
  const o = useDict().observatory
  const u = o.ui
  const blurbs = o.stars as Record<string, string>

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {stars.map((star, i) => {
        const nights = nightsOn[star.id] ?? 0
        const verdict = verdicts[star.id]
        const observed = nights > 0

        return (
          <motion.div
            key={star.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: Math.min(i * 0.035, 0.4) }}
            className={`rounded-2xl border p-4 flex flex-col gap-3 transition-colors ${
              verdict
                ? 'border-white/5 bg-white/[0.015]'
                : observed
                  ? 'border-indigo-400/25 bg-indigo-500/15'
                  : 'border-white/10 bg-white/[0.02] hover:border-indigo-400/30'
            }`}
          >
            {/* Star glyph and identity */}
            <div className="flex items-start gap-3">
              <StarGlyph star={star} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-[15px] text-white truncate">{star.name}</h3>
                  {verdict && <VerdictChip verdict={verdict} />}
                </div>
                <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                  {star.spectralType} · {star.distanceLy} {u.ly}
                </p>
              </div>
            </div>

            <p className="text-[13px] leading-relaxed text-slate-400">{blurbs[star.id] ?? star.blurb}</p>

            {/* The three numbers that justify spending nights here */}
            <dl className="grid grid-cols-3 gap-2 text-center">
              <Stat label={u.brightness} value={`${star.magnitude.toFixed(1)}ᴶ`} />
              <Stat label={u.radius} value={`${star.radiusSun.toFixed(3)} R☉`} />
              <Stat label={u.mass} value={`${star.massSun.toFixed(3)} M☉`} />
            </dl>

            {/* Nights invested */}
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-500">{u.nightsSpentLabel}</span>
              <span className={`font-mono font-semibold ${observed ? 'text-indigo-300' : 'text-slate-500'}`}>
                {nights}
              </span>
            </div>

            {/* Tall enough to hit with a thumb: these are the most-tapped controls in
                the whole mission, and a 28px strip of four was a mis-tap on phones. */}
            <div className="flex gap-1.5 mt-auto">
              {BATCHES.map((n) => (
                <button
                  key={n}
                  onClick={() => onObserve(star.id, n)}
                  disabled={n > nightsRemaining || !!verdict}
                  className="flex-1 min-h-10 rounded-lg border border-white/10 bg-white/[0.04] px-2 py-2 text-[12px] font-medium text-slate-300 transition-colors hover:border-indigo-400/50 hover:bg-indigo-500/15 hover:text-white disabled:cursor-not-allowed disabled:opacity-25 disabled:hover:border-white/10 disabled:hover:bg-white/[0.04] disabled:hover:text-slate-300"
                  title={verdict ? u.alreadyFiled : n > nightsRemaining ? u.notEnough : fmt(u.observeFor, { n })}
                >
                  {fmt(u.batch, { n })}
                </button>
              ))}
              <button
                onClick={() => onOpen(star.id)}
                disabled={!observed}
                className="flex-[1.3] min-h-10 rounded-lg border border-indigo-400/30 bg-indigo-500/15 px-2 py-2 text-[12px] font-semibold text-indigo-300 transition-colors hover:bg-indigo-500/25 disabled:cursor-not-allowed disabled:opacity-25"
                title={observed ? u.openCurve : u.observeFirst}
              >
                {u.analyse}
              </button>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-lg bg-white/[0.02] border border-white/5 py-1.5">
      <dd className="font-mono text-[11px] text-white">{value}</dd>
      <dt className="text-[9px] uppercase tracking-wider text-slate-500 mt-0.5 truncate px-1">{label}</dt>
    </div>
  )
}

/**
 * A star drawn at a size and glow set by its apparent brightness.
 *
 * Magnitude is backwards (smaller means brighter), which trips up every beginner, so
 * the visual reinforces it constantly: Epsilon Eridani at magnitude 1.9 is a fat
 * bright disc, TRAPPIST-1 at 11.4 is a dim speck. By the time the player reaches the
 * noise discussion, they have already absorbed that bright stars are easier.
 */
function StarGlyph({ star }: { star: Star }) {
  const size = Math.max(10, Math.min(30, 34 - star.magnitude * 1.9))
  return (
    <div className="relative flex h-12 w-12 flex-shrink-0 items-center justify-center">
      <div
        className="absolute rounded-full blur-md opacity-50"
        style={{ width: size * 1.9, height: size * 1.9, backgroundColor: star.colour }}
      />
      <div
        className="relative rounded-full"
        style={{
          width: size,
          height: size,
          backgroundColor: star.colour,
          boxShadow: `0 0 ${size / 2}px ${star.colour}`,
        }}
      />
    </div>
  )
}

function VerdictChip({ verdict }: { verdict: Verdict }) {
  const chips = useDict().observatory.ui.chips
  const cls: Record<Verdict, string> = {
    planet: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/25',
    starspot: 'bg-amber-500/10 text-amber-300 border-amber-400/25',
    nothing: 'bg-white/[0.04] text-slate-400 border-white/10',
  }
  return (
    <span className={`flex-shrink-0 rounded-md border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${cls[verdict]}`}>
      {chips[verdict]}
    </span>
  )
}
