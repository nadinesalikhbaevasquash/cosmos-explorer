'use client'

/**
 * Mission 2's reveal: seven real planets, which ones the player dug out, and how
 * close their periods landed to the published ones.
 *
 * Laid out as cards rather than a table so it reads on a phone, in orbital order, so
 * the gaps in what the player found line up with where they sit in the system: the
 * misses are nearly always at the slow, outer end, and seeing that is the lesson
 * about observing time.
 */

import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import HowDoWeKnow from '../../components/HowDoWeKnow'
import Prose from '../../components/Prose'
import ShareButton from '@/app/components/ShareButton'
import { useDict } from '@/app/hooks/useDict'
import { fmt } from '../../lib/format'
import { equilibriumTempK, habitableZone, semiMajorAxisAU } from '../../lib/physics'
import { HOST, TOTAL_NIGHTS, WORLDS, gradeSeven, type SevenCampaign } from '../lib/system'

export default function SevenResults({
  campaign,
  onRestart,
}: {
  campaign: SevenCampaign
  onRestart: () => void
}) {
  const params = useParams()
  const lang = (params?.lang as string) || 'en'
  const o = useDict().observatory
  const r = o.seven.results
  const grade = gradeSeven(campaign)
  const hz = habitableZone(HOST.luminositySun)

  const headline =
    grade.foundCount === 7 ? r.allSeven : grade.foundCount > 0 ? fmt(r.some, { found: grade.foundCount }) : r.none

  const shareText = () =>
    fmt(r.share, {
      squares: grade.squares,
      found: grade.foundCount,
      used: campaign.nightsUsed,
      url: `https://astranova.uz/${lang}/observatory/seven`,
    })

  const falseClaims = campaign.claims.filter((c) => grade.outcomes[c.id]?.kind !== 'found')

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded-2xl border border-white/10 bg-gradient-to-b from-indigo-500/[0.08] to-transparent p-5 text-center sm:p-6"
      >
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-indigo-300">{r.eyebrow}</p>
        <h2 className="mt-2 text-2xl font-bold text-white sm:text-4xl">{headline}</h2>
        <p className="mt-2 text-[13px] text-slate-400">
          {fmt(r.tally, { found: grade.foundCount, wrong: grade.wrong, used: campaign.nightsUsed, total: TOTAL_NIGHTS })}
        </p>
        <p className="mt-3 font-mono text-2xl tracking-widest" aria-label={o.results.summary}>
          {grade.squares}
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <ShareButton
            text={shareText}
            label={r.shareButton}
            className="rounded-full border border-indigo-400/40 bg-indigo-500/20 px-6 py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-indigo-500/35"
          />
          <button
            onClick={onRestart}
            className="rounded-full border border-white/10 bg-white/[0.04] px-6 py-2.5 text-[14px] font-medium text-slate-200 transition-colors hover:border-indigo-400/40 hover:text-white"
          >
            {r.restart}
          </button>
        </div>
      </motion.div>

      <div className="grid gap-3 sm:grid-cols-2">
        {WORLDS.map((w, i) => {
          const claim = grade.found[w.id]
          const axis = semiMajorAxisAU(w.periodDays, HOST.massSun)
          const teq = equilibriumTempK(HOST.tempK, HOST.radiusSun, axis)
          const inHZ = axis >= hz.inner && axis <= hz.outer
          return (
            <motion.div
              key={w.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.08 + i * 0.05 }}
              className={`rounded-2xl border p-4 ${
                claim ? 'border-emerald-400/25 bg-emerald-500/10' : 'border-white/10 bg-white/[0.02]'
              }`}
            >
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white">{w.name}</h3>
                <span
                  className={`rounded-md border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${
                    claim
                      ? 'border-emerald-400/30 bg-emerald-500/15 text-emerald-300'
                      : 'border-white/10 bg-white/[0.04] text-slate-400'
                  }`}
                >
                  {claim ? r.found : r.missed}
                </span>
                {inHZ && (
                  <span className="ml-auto rounded-md border border-emerald-400/30 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-emerald-300">
                    {r.inHZ}
                  </span>
                )}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 font-mono text-[12px]">
                <span className="text-slate-500">{r.actual}</span>
                <span className="text-right text-white">
                  {w.periodDays.toFixed(3)} {o.ui.d}
                </span>
                <span className="text-slate-500">{r.yours}</span>
                <span className={`text-right ${claim ? 'text-emerald-300' : 'text-slate-500'}`}>
                  {claim ? `${claim.period.toFixed(3)} ${o.ui.d}` : '·'}
                </span>
                <span className="text-slate-500">{o.ui.radius}</span>
                <span className="text-right text-slate-300">{w.radiusEarth.toFixed(2)} R⊕</span>
                <span className="text-slate-500">{o.ui.orbit}</span>
                <span className="text-right text-slate-300">{axis.toFixed(4)} AU</span>
                <span className="text-slate-500">{o.ui.eqTemp}</span>
                <span className="text-right text-slate-300">{teq.toFixed(0)} K</span>
              </div>
            </motion.div>
          )
        })}
      </div>

      {falseClaims.length > 0 && (
        <div className="rounded-2xl border border-rose-400/20 bg-rose-500/[0.06] p-4 sm:p-5">
          <h3 className="text-[13px] font-semibold text-rose-200">{r.falseTitle}</h3>
          <ul className="mt-2 space-y-2">
            {falseClaims.map((c) => {
              const out = grade.outcomes[c.id]
              return (
                <li key={c.id} className="text-[13px] leading-relaxed text-slate-300">
                  <span className="font-mono text-white">
                    {c.period.toFixed(3)} {o.ui.d}
                  </span>
                  {' · '}
                  {out?.kind === 'alias'
                    ? fmt(r.alias, { ratio: out.ratio, planet: out.world.name })
                    : r.nothingThere}
                </li>
              )
            })}
          </ul>
        </div>
      )}

      <p className="text-[13px] leading-relaxed text-slate-400">{r.hzNote}</p>

      <HowDoWeKnow question={r.realQ}>
        {r.realP.map((t, i) => (
          <Prose key={i} text={t} dim={i === 2} />
        ))}
      </HowDoWeKnow>
    </div>
  )
}
