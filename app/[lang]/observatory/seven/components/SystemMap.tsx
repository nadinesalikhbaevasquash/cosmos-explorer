'use client'

/**
 * The system as the player has found it so far.
 *
 * A top-down sliver of TRAPPIST-1: the star off the left edge, orbits as arcs, the
 * habitable zone as a band, and each claimed planet sitting on its orbit at the size
 * its transit depth implies. It starts empty and fills in, which is the reward loop
 * of this mission: every claim visibly adds a world to a system you are building.
 *
 * Log distance, because b and h are five times apart and a linear scale would crush
 * the four inner planets into the star's glow.
 */

import { motion } from 'framer-motion'
import { habitableZone } from '../../lib/physics'
import { HOST } from '../lib/system'

type Body = { id: string; axis: number; radiusEarth: number }

const W = 600
const H = 150
const CY = 75
const MIN_AU = 0.008
const MAX_AU = 0.075
// The star's centre, off canvas, so orbits read as gentle arcs rather than full circles.
const SX = -70

const xOf = (au: number) =>
  ((Math.log10(au) - Math.log10(MIN_AU)) / (Math.log10(MAX_AU) - Math.log10(MIN_AU))) * (W - 40) + 20

export default function SystemMap({ bodies, hzLabel }: { bodies: Body[]; hzLabel: string }) {
  const hz = habitableZone(HOST.luminositySun)
  const x0 = xOf(hz.inner)
  const x1 = xOf(hz.outer)

  return (
    <div className="overflow-hidden rounded-xl border border-white/5 bg-[#060b18]">
      <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" role="img" aria-label={hzLabel}>
        <defs>
          <radialGradient id="sm-star" cx="0" cy="0.5" r="1">
            <stop offset="0%" stopColor={HOST.colour} stopOpacity="0.55" />
            <stop offset="100%" stopColor={HOST.colour} stopOpacity="0" />
          </radialGradient>
          <clipPath id="sm-clip">
            <rect width={W} height={H} />
          </clipPath>
        </defs>

        <g clipPath="url(#sm-clip)">
          <rect x="0" y="0" width="120" height={H} fill="url(#sm-star)" />

          {/* habitable zone band, drawn as a ring segment around the star */}
          <path
            d={`M ${x0} 0 A ${x0 - SX} ${x0 - SX} 0 0 1 ${x0} ${H} L ${x1} ${H} A ${x1 - SX} ${x1 - SX} 0 0 0 ${x1} 0 Z`}
            fill="rgba(52,211,153,0.10)"
            stroke="rgba(52,211,153,0.28)"
          />
          <text x={(x0 + x1) / 2 + 6} y="16" textAnchor="middle" fontSize="11" fill="#6ee7b7">
            {hzLabel}
          </text>

          {bodies.map((b) => {
            const x = xOf(b.axis)
            const r = x - SX
            return (
              <circle key={`o-${b.id}`} cx={SX} cy={CY} r={r} fill="none" stroke="rgba(148,163,184,0.16)" />
            )
          })}

          {bodies.map((b, i) => {
            const x = xOf(b.axis)
            const r = 3.5 + b.radiusEarth * 4
            return (
              <motion.g
                key={b.id}
                initial={{ opacity: 0, scale: 0.3 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 220, damping: 18, delay: i * 0.03 }}
                style={{ transformOrigin: `${x}px ${CY}px` }}
              >
                <circle cx={x} cy={CY} r={r + 5} fill="rgba(126,136,236,0.18)" />
                <circle cx={x} cy={CY} r={r} fill="#a5b4fc" stroke="#0b1022" strokeWidth="2" />
              </motion.g>
            )
          })}

          {[0.01, 0.02, 0.05].map((au) => (
            <text key={au} x={xOf(au)} y={H - 8} textAnchor="middle" fontSize="10" fill="#64748b" fontFamily="ui-monospace, monospace">
              {au} AU
            </text>
          ))}
        </g>
      </svg>
    </div>
  )
}
