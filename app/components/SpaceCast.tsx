'use client'

/**
 * The AstraNova cast.
 *
 * Built the way Crossfire builds its mascots: pure inline SVG, no image files, one
 * idle animation per character that is *in character*. The telescope scans the sky
 * and blinks, the rocket's exhaust flickers, the satellite pings, the black hole
 * drags its accretion disc round, the astronaut tumbles and waves.
 *
 * Colours come from the existing AstraNova palette in globals.css, so these sit
 * inside the current design rather than replacing it. Animation classes all live in
 * the motion library at the bottom of globals.css and are switched off by the
 * prefers-reduced-motion block there.
 *
 * Every character is viewBox 0 0 120 120 and scales to whatever you give it.
 */

const C = {
  indigo: '#7e88ec',
  indigoDeep: '#4f46e5',
  violet: '#b884ed',
  cyan: '#76ddea',
  gold: '#e2b43d',
  amber: '#f59e0b',
  rose: '#ec8090',
  pink: '#f9a8d4',
  emerald: '#34d399',
  slate: '#94a3b8',
  slateDeep: '#475569',
  ink: '#0b1020',
  inkDeep: '#050814',
  white: '#f8fafc',
}

type Props = { className?: string; title?: string }

/* ── Telescope ─────────────────────────────────────────────────────────────
   The mascot. Scans slowly across the sky, blinks on an offset timer, and
   carries a ring of sparks. Sized big on the hero, small in cards. */

export function Telescope({ className = '', title }: Props) {
  return (
    <svg viewBox="0 0 120 120" className={className} role={title ? 'img' : 'presentation'} aria-label={title}>
      <defs>
        <linearGradient id="an-tube" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#4c4a9e" />
          <stop offset="55%" stopColor="#332f6d" />
          <stop offset="100%" stopColor="#242047" />
        </linearGradient>
        <radialGradient id="an-lens" cx="38%" cy="34%">
          <stop offset="0%" stopColor="#d9f4ff" />
          <stop offset="45%" stopColor={C.cyan} />
          <stop offset="100%" stopColor={C.indigoDeep} />
        </radialGradient>
      </defs>

      {/* halo */}
      <circle cx="76" cy="48" r="26" fill={C.indigo} opacity="0.22" className="an-glow" />

      {/* tripod */}
      <g stroke="#3b3776" strokeWidth="5" strokeLinecap="round" fill="none">
        <path d="M60 82 L44 108" />
        <path d="M60 82 L76 108" />
        <path d="M60 82 L60 104" />
      </g>
      <circle cx="60" cy="82" r="6.5" fill="#4c4a9e" />

      {/* barrel, scanning the sky */}
      <g className="an-t-scan">
        <rect x="28" y="46" width="66" height="25" rx="12.5" fill="url(#an-tube)" />
        <rect x="48" y="46" width="4" height="25" fill="#5b57b8" opacity="0.9" />
        <rect x="70" y="46" width="4" height="25" fill="#5b57b8" opacity="0.9" />
        <rect x="20" y="52" width="11" height="13" rx="4.5" fill="#272350" />

        {/* lens, which is also the eye */}
        <circle cx="96" cy="58" r="19" fill="#1b1840" />
        <circle cx="96" cy="58" r="15.5" fill="url(#an-lens)" />
        <circle cx="96" cy="58" r="7" fill="#0d0b23" />
        <circle cx="92.6" cy="54.6" r="2.8" fill="#fff" opacity="0.95" />
        <circle cx="100" cy="62" r="1.4" fill="#fff" opacity="0.5" />
        {/* eyelid */}
        <rect x="77" y="37" width="38" height="21" fill="#332f6d" className="an-t-blink" />
        <circle cx="96" cy="58" r="19" fill="none" stroke="#5b57b8" strokeWidth="2.6" />
        {/* blush, which is most of why it reads as cute */}
        <ellipse cx="79" cy="70" rx="5.5" ry="3.2" fill={C.pink} opacity="0.45" />
      </g>

      <Spark x={104} y={22} fill={C.gold} dur="2.8s" />
      <Spark x={24} y={32} fill={C.pink} dur="4.1s" delay="0.7s" />
      <circle cx="110" cy="76" r="2.2" fill={C.emerald} className="an-glow" style={{ animationDelay: '1.4s' }} />
    </svg>
  )
}

/* ── Rocket ───────────────────────────────────────────────────────────────── */

export function Rocket({ className = '', title }: Props) {
  return (
    <svg viewBox="0 0 120 120" className={className} role={title ? 'img' : 'presentation'} aria-label={title}>
      <defs>
        <linearGradient id="an-body" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="55%" stopColor="#dbe2f5" />
          <stop offset="100%" stopColor="#9aa6c8" />
        </linearGradient>
      </defs>

      <g className="an-r-hover">
        {/* fins */}
        <path d="M42 74 L30 92 L44 86 Z" fill={C.rose} />
        <path d="M78 74 L90 92 L76 86 Z" fill={C.rose} />
        {/* body */}
        <path d="M60 14 C74 30 78 50 78 68 L78 84 L42 84 L42 68 C42 50 46 30 60 14 Z" fill="url(#an-body)" />
        {/* window */}
        <circle cx="60" cy="48" r="11" fill="#1b2a52" />
        <circle cx="60" cy="48" r="8" fill={C.cyan} opacity="0.85" />
        <circle cx="56.5" cy="44.5" r="2.6" fill="#fff" opacity="0.9" />
        {/* nose */}
        <path d="M60 14 C66 22 70 30 71 36 L49 36 C50 30 54 22 60 14 Z" fill={C.rose} />
        {/* exhaust */}
        <g className="an-r-flame">
          <path d="M50 84 C52 98 56 106 60 112 C64 106 68 98 70 84 Z" fill={C.gold} />
          <path d="M54 84 C55 94 57 100 60 105 C63 100 65 94 66 84 Z" fill="#fff7d6" />
        </g>
      </g>
      <circle cx="52" cy="100" r="4" fill={C.slate} opacity="0.35" className="an-r-smoke" />
      <circle cx="68" cy="102" r="3" fill={C.slate} opacity="0.3" className="an-r-smoke" style={{ animationDelay: '.9s' }} />
    </svg>
  )
}

/* ── Satellite ────────────────────────────────────────────────────────────── */

export function Satellite({ className = '', title }: Props) {
  return (
    <svg viewBox="0 0 120 120" className={className} role={title ? 'img' : 'presentation'} aria-label={title}>
      <g className="an-float-b">
        <g className="an-sat-tilt" style={{ transformOrigin: '60px 60px' }}>
          {/* panels */}
          <rect x="8" y="48" width="34" height="24" rx="3" fill={C.indigoDeep} />
          <rect x="78" y="48" width="34" height="24" rx="3" fill={C.indigoDeep} />
          {[14, 22, 30, 84, 92, 100].map((x) => (
            <rect key={x} x={x} y="50" width="6" height="20" fill={C.indigo} opacity="0.7" />
          ))}
          <rect x="42" y="52" width="36" height="16" rx="4" fill="#cbd5e1" />
          <rect x="46" y="56" width="28" height="8" rx="2" fill={C.slateDeep} />
          {/* dish */}
          <ellipse cx="60" cy="40" rx="13" ry="7" fill="#e2e8f0" />
          <ellipse cx="60" cy="40" rx="8" ry="4" fill={C.slateDeep} />
          <line x1="60" y1="44" x2="60" y2="52" stroke="#cbd5e1" strokeWidth="3" />
        </g>
      </g>
      {/* signal pings, offset so it reads as a repeating transmission */}
      <circle cx="60" cy="34" r="10" fill="none" stroke={C.cyan} strokeWidth="2" className="an-sat-ping" style={{ transformOrigin: '60px 34px' }} />
      <circle cx="60" cy="34" r="10" fill="none" stroke={C.cyan} strokeWidth="2" className="an-sat-ping" style={{ transformOrigin: '60px 34px', animationDelay: '1.3s' }} />
    </svg>
  )
}

/* ── Astronaut ────────────────────────────────────────────────────────────── */

export function Astronaut({ className = '', title }: Props) {
  return (
    <svg viewBox="0 0 120 120" className={className} role={title ? 'img' : 'presentation'} aria-label={title}>
      <defs>
        <radialGradient id="an-visor" cx="36%" cy="32%">
          <stop offset="0%" stopColor="#9ae6ff" />
          <stop offset="60%" stopColor="#2f5ea8" />
          <stop offset="100%" stopColor="#131c3a" />
        </radialGradient>
      </defs>
      <g className="an-a-tumble">
        {/* pack and limbs */}
        <rect x="46" y="46" width="28" height="34" rx="11" fill="#e8edf8" />
        <rect x="34" y="52" width="14" height="26" rx="7" fill="#d4dcee" />
        <rect x="72" y="52" width="14" height="26" rx="7" fill="#d4dcee" className="an-a-wave" />
        <rect x="48" y="76" width="10" height="24" rx="5" fill="#d4dcee" />
        <rect x="62" y="76" width="10" height="24" rx="5" fill="#d4dcee" />
        {/* helmet */}
        <circle cx="60" cy="36" r="21" fill="#f1f5fd" />
        <circle cx="60" cy="36" r="15.5" fill="url(#an-visor)" />
        <ellipse cx="53" cy="30" rx="5" ry="3.4" fill="#fff" opacity="0.55" />
        {/* chest light */}
        <circle cx="60" cy="60" r="3.4" fill={C.emerald} className="an-glow" />
      </g>
    </svg>
  )
}

/* ── Black hole ───────────────────────────────────────────────────────────── */

export function BlackHole({ className = '', title }: Props) {
  return (
    <svg viewBox="0 0 120 120" className={className} role={title ? 'img' : 'presentation'} aria-label={title}>
      <defs>
        <linearGradient id="an-disc" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={C.rose} />
          <stop offset="40%" stopColor={C.gold} />
          <stop offset="70%" stopColor={C.violet} />
          <stop offset="100%" stopColor={C.indigoDeep} />
        </linearGradient>
      </defs>
      {/* accretion disc, flattened and spun */}
      <g style={{ transformOrigin: '60px 60px' }} className="an-bh-swirl">
        <ellipse cx="60" cy="60" rx="52" ry="52" fill="none" stroke="url(#an-disc)" strokeWidth="13" opacity="0.85" />
      </g>
      <g style={{ transformOrigin: '60px 60px', animationDuration: '11s' }} className="an-bh-swirl">
        <ellipse cx="60" cy="60" rx="38" ry="38" fill="none" stroke={C.gold} strokeWidth="6" opacity="0.55" />
      </g>
      {/* event horizon */}
      <circle cx="60" cy="60" r="21" fill={C.inkDeep} className="an-bh-pull" style={{ transformOrigin: '60px 60px' }} />
      <circle cx="60" cy="60" r="24" fill="none" stroke={C.gold} strokeWidth="1.6" opacity="0.6" />
    </svg>
  )
}

/* ── Ringed planet ────────────────────────────────────────────────────────── */

export function Planet({ className = '', title }: Props) {
  return (
    <svg viewBox="0 0 120 120" className={className} role={title ? 'img' : 'presentation'} aria-label={title}>
      <defs>
        <radialGradient id="an-globe" cx="34%" cy="30%">
          <stop offset="0%" stopColor="#ffe4b8" />
          <stop offset="45%" stopColor={C.amber} />
          <stop offset="100%" stopColor="#8a4b12" />
        </radialGradient>
      </defs>
      <g className="an-float-a">
        <circle cx="60" cy="58" r="30" fill="url(#an-globe)" />
        {/* banding */}
        <path d="M32 50 h56" stroke="#c97b2b" strokeWidth="4" opacity="0.5" strokeLinecap="round" />
        <path d="M34 64 h52" stroke="#a85f1c" strokeWidth="5" opacity="0.45" strokeLinecap="round" />
        <path d="M40 74 h40" stroke="#c97b2b" strokeWidth="3" opacity="0.4" strokeLinecap="round" />
        {/* rings */}
        <g className="an-p-ring" style={{ transformOrigin: '60px 58px' }}>
          <ellipse cx="60" cy="58" rx="50" ry="50" fill="none" stroke={C.gold} strokeWidth="5" opacity="0.75" />
          <ellipse cx="60" cy="58" rx="42" ry="42" fill="none" stroke="#ffe9b0" strokeWidth="2.5" opacity="0.5" />
        </g>
      </g>
    </svg>
  )
}

/* ── Star ─────────────────────────────────────────────────────────────────── */

export function SunStar({ className = '', title }: Props) {
  return (
    <svg viewBox="0 0 120 120" className={className} role={title ? 'img' : 'presentation'} aria-label={title}>
      <defs>
        <radialGradient id="an-star" cx="42%" cy="36%">
          <stop offset="0%" stopColor="#fffdf0" />
          <stop offset="45%" stopColor={C.gold} />
          <stop offset="100%" stopColor="#e06a1a" />
        </radialGradient>
      </defs>
      <circle cx="60" cy="60" r="46" fill={C.gold} opacity="0.16" className="an-glow" />
      <g className="an-s-flare" style={{ transformOrigin: '60px 60px' }}>
        <path d="M60 4 L67 44 L60 60 L53 44 Z M60 116 L53 76 L60 60 L67 76 Z M4 60 L44 53 L60 60 L44 67 Z M116 60 L76 67 L60 60 L76 53 Z" fill={C.gold} opacity="0.5" />
      </g>
      <circle cx="60" cy="60" r="30" fill="url(#an-star)" className="an-s-pulse" style={{ transformOrigin: '60px 60px' }} />
    </svg>
  )
}

/* ── Moon ─────────────────────────────────────────────────────────────────── */

export function Moon({ className = '', title }: Props) {
  return (
    <svg viewBox="0 0 120 120" className={className} role={title ? 'img' : 'presentation'} aria-label={title}>
      <defs>
        <clipPath id="an-moon-clip"><circle cx="60" cy="60" r="34" /></clipPath>
      </defs>
      <g className="an-float-b">
        <circle cx="60" cy="60" r="34" fill="#dfe4ef" />
        <g clipPath="url(#an-moon-clip)">
          <circle cx="48" cy="50" r="7" fill="#b9c1d4" opacity="0.8" />
          <circle cx="70" cy="66" r="5" fill="#b9c1d4" opacity="0.7" />
          <circle cx="58" cy="76" r="3.5" fill="#b9c1d4" opacity="0.6" />
          <circle cx="74" cy="44" r="3" fill="#b9c1d4" opacity="0.6" />
          {/* terminator sweeping across, so the moon visibly cycles phase */}
          <circle cx="60" cy="60" r="36" fill="#0b1020" opacity="0.88" className="an-m-phase" />
        </g>
      </g>
    </svg>
  )
}

/* ── UFO ──────────────────────────────────────────────────────────────────── */

export function Ufo({ className = '', title }: Props) {
  return (
    <svg viewBox="0 0 120 120" className={className} role={title ? 'img' : 'presentation'} aria-label={title}>
      <path d="M38 62 L82 62 L94 104 L26 104 Z" fill={C.cyan} opacity="0.22" className="an-u-beam" />
      <g className="an-u-hover">
        <ellipse cx="60" cy="58" rx="38" ry="13" fill="#aab6d4" />
        <ellipse cx="60" cy="53" rx="38" ry="12" fill="#d7deef" />
        <path d="M40 48 a20 16 0 0 1 40 0 Z" fill={C.cyan} opacity="0.65" />
        <path d="M40 48 a20 16 0 0 1 40 0 Z" fill="none" stroke="#8fa2c9" strokeWidth="1.6" />
        {[36, 48, 60, 72, 84].map((x, i) => (
          <circle key={x} cx={x} cy="60" r="3.2" fill={C.gold} className="an-u-lights" style={{ animationDelay: `${i * 0.22}s` }} />
        ))}
      </g>
    </svg>
  )
}

/* ── Shared bits ──────────────────────────────────────────────────────────── */

function Spark({ x, y, fill, dur, delay = '0s' }: { x: number; y: number; fill: string; dur: string; delay?: string }) {
  return (
    <path
      d={`M${x} ${y - 6} L${x + 2} ${y - 1.6} L${x + 6.4} ${y} L${x + 2} ${y + 1.6} L${x} ${y + 6} L${x - 2} ${y + 1.6} L${x - 6.4} ${y} L${x - 2} ${y - 1.6} Z`}
      fill={fill}
      className="an-glow"
      style={{ animationDuration: dur, animationDelay: delay, transformOrigin: `${x}px ${y}px` }}
    />
  )
}

/** Every character, keyed, for places that want to pick one by name. */
export const CAST = {
  telescope: Telescope,
  rocket: Rocket,
  satellite: Satellite,
  astronaut: Astronaut,
  blackHole: BlackHole,
  planet: Planet,
  star: SunStar,
  moon: Moon,
  ufo: Ufo,
} as const

export type CastId = keyof typeof CAST

/* ══════════════════════════════════════════════════════════════════════════
   Icon-sized cast.

   These exist to replace emoji. An emoji renders differently on every device,
   cannot take the site's palette, and cannot move. Each of these is the same
   inline SVG approach as the big characters, tuned to read clearly at 18-24px
   and carrying one small idle animation so a menu or a card has life in it.
   ══════════════════════════════════════════════════════════════════════════ */

export function Galaxy({ className = '', title }: Props) {
  return (
    <svg viewBox="0 0 120 120" className={className} role={title ? 'img' : 'presentation'} aria-label={title}>
      <defs>
        <radialGradient id="an-gal" cx="50%" cy="50%">
          <stop offset="0%" stopColor="#fff6d8" />
          <stop offset="35%" stopColor={C.violet} />
          <stop offset="100%" stopColor={C.indigoDeep} />
        </radialGradient>
      </defs>
      <g className="an-spin" style={{ transformOrigin: '60px 60px', animationDuration: '26s' }}>
        <ellipse cx="60" cy="60" rx="54" ry="20" fill="url(#an-gal)" opacity="0.5" transform="rotate(28 60 60)" />
        <ellipse cx="60" cy="60" rx="40" ry="13" fill="url(#an-gal)" opacity="0.75" transform="rotate(28 60 60)" />
      </g>
      <circle cx="60" cy="60" r="13" fill="#fff3cf" className="an-s-pulse" style={{ transformOrigin: '60px 60px' }} />
    </svg>
  )
}

export function EarthGlobe({ className = '', title }: Props) {
  return (
    <svg viewBox="0 0 120 120" className={className} role={title ? 'img' : 'presentation'} aria-label={title}>
      <defs>
        <clipPath id="an-earth-clip"><circle cx="60" cy="60" r="38" /></clipPath>
        <radialGradient id="an-ocean" cx="34%" cy="30%">
          <stop offset="0%" stopColor="#8ed8ff" />
          <stop offset="60%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#132a52" />
        </radialGradient>
      </defs>
      <g className="an-float-a">
        <circle cx="60" cy="60" r="38" fill="url(#an-ocean)" />
        <g clipPath="url(#an-earth-clip)">
          {/* continents scroll, so the globe reads as turning */}
          <g className="an-p-roll">
            <path d="M18 44 q14-10 26-2 t20 4 q10 6 4 14 t-20 6 q-16-2-22-10z" fill={C.emerald} opacity="0.92" />
            <path d="M62 72 q12-6 22 2 t16 10 q-8 10-24 8 t-16-14z" fill={C.emerald} opacity="0.85" />
            <path d="M138 44 q14-10 26-2 t20 4 q10 6 4 14 t-20 6 q-16-2-22-10z" fill={C.emerald} opacity="0.92" />
            <path d="M182 72 q12-6 22 2 t16 10 q-8 10-24 8 t-16-14z" fill={C.emerald} opacity="0.85" />
          </g>
        </g>
        <circle cx="60" cy="60" r="38" fill="none" stroke="#bfe6ff" strokeWidth="1.4" opacity="0.35" />
      </g>
    </svg>
  )
}

export function Target({ className = '', title }: Props) {
  return (
    <svg viewBox="0 0 120 120" className={className} role={title ? 'img' : 'presentation'} aria-label={title}>
      <circle cx="60" cy="60" r="44" fill="none" stroke={C.rose} strokeWidth="8" opacity="0.9" />
      <circle cx="60" cy="60" r="28" fill="none" stroke="#fff" strokeWidth="8" opacity="0.85" />
      <circle cx="60" cy="60" r="13" fill={C.rose} className="an-s-pulse" style={{ transformOrigin: '60px 60px' }} />
      {/* arrow lands, then resets */}
      <g className="an-bob">
        <path d="M92 28 L66 54" stroke={C.gold} strokeWidth="6" strokeLinecap="round" />
        <path d="M96 24 l-4 12 l12-4 z" fill={C.gold} />
      </g>
    </svg>
  )
}

export function Magnifier({ className = '', title }: Props) {
  return (
    <svg viewBox="0 0 120 120" className={className} role={title ? 'img' : 'presentation'} aria-label={title}>
      <g className="an-sway" style={{ transformOrigin: '52px 52px' }}>
        <circle cx="52" cy="52" r="30" fill={C.cyan} opacity="0.22" />
        <circle cx="52" cy="52" r="30" fill="none" stroke="#cbd5e1" strokeWidth="8" />
        <path d="M74 74 L100 100" stroke="#94a3b8" strokeWidth="11" strokeLinecap="round" />
        {/* things being magnified */}
        <circle cx="44" cy="46" r="4" fill={C.gold} className="an-glow" />
        <circle cx="60" cy="58" r="3" fill={C.violet} className="an-glow" style={{ animationDelay: '.8s' }} />
        <circle cx="52" cy="64" r="2" fill={C.emerald} className="an-glow" style={{ animationDelay: '1.5s' }} />
      </g>
    </svg>
  )
}

export function Comet({ className = '', title }: Props) {
  return (
    <svg viewBox="0 0 120 120" className={className} role={title ? 'img' : 'presentation'} aria-label={title}>
      <g className="an-float-b">
        <path d="M84 36 L20 96" stroke={C.cyan} strokeWidth="11" strokeLinecap="round" opacity="0.28" />
        <path d="M80 40 L34 86" stroke="#fff" strokeWidth="5" strokeLinecap="round" opacity="0.45" />
        <circle cx="88" cy="32" r="15" fill={C.gold} opacity="0.3" className="an-glow" />
        <circle cx="88" cy="32" r="9" fill="#fff4d1" />
      </g>
    </svg>
  )
}

export function Book({ className = '', title }: Props) {
  return (
    <svg viewBox="0 0 120 120" className={className} role={title ? 'img' : 'presentation'} aria-label={title}>
      <g className="an-float-a">
        <path d="M18 30 q22-9 42 0 v60 q-20-9-42 0 z" fill="#dbe2f5" />
        <path d="M102 30 q-22-9-42 0 v60 q20-9 42 0 z" fill="#b9c4de" />
        <path d="M60 30 v60" stroke="#8f9cba" strokeWidth="2.5" />
        {[44, 54, 64].map((y, i) => (
          <g key={y}>
            <path d={`M28 ${y} h24`} stroke="#8f9cba" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
            <path d={`M68 ${y} h24`} stroke="#8f9cba" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
          </g>
        ))}
        {/* a star lifting off the page, because this is an astronomy book */}
        <g className="an-bob">
          <path d="M60 18 l3 7 l7 3 l-7 3 l-3 7 l-3-7 l-7-3 l7-3 z" fill={C.gold} />
        </g>
      </g>
    </svg>
  )
}

export function Mountain({ className = '', title }: Props) {
  return (
    <svg viewBox="0 0 120 120" className={className} role={title ? 'img' : 'presentation'} aria-label={title}>
      <defs>
        <linearGradient id="an-rock" x1="0" y1="0" x2="0.6" y2="1">
          <stop offset="0%" stopColor="#8fa2c9" />
          <stop offset="55%" stopColor="#5b6b90" />
          <stop offset="100%" stopColor="#39435f" />
        </linearGradient>
      </defs>
      <g className="an-float-b">
        <path d="M8 98 L44 34 L64 66 L78 46 L112 98 Z" fill="url(#an-rock)" />
        {/* snowline */}
        <path d="M44 34 L56 55 L50 52 L44 58 L38 50 L32 55 Z" fill="#f1f5fd" />
        <path d="M78 46 L86 58 L82 56 L78 60 L74 55 Z" fill="#f1f5fd" opacity="0.9" />
        {/* a cloud drifting past the summit, which is the only motion a mountain gets */}
        <g className="an-sway" style={{ transformOrigin: '60px 40px' }}>
          <ellipse cx="34" cy="30" rx="13" ry="5" fill="#cbd5e1" opacity="0.45" />
        </g>
      </g>
    </svg>
  )
}

export const ICONS = {
  mountain: Mountain,
  galaxy: Galaxy,
  earth: EarthGlobe,
  target: Target,
  magnifier: Magnifier,
  comet: Comet,
  book: Book,
  telescope: Telescope,
  rocket: Rocket,
  satellite: Satellite,
  astronaut: Astronaut,
  blackHole: BlackHole,
  planet: Planet,
  star: SunStar,
  moon: Moon,
  ufo: Ufo,
} as const

export type IconId = keyof typeof ICONS

/* ══════════════════════════════════════════════════════════════════════════
   Travel icons.
   The travel-time page compares how long a journey takes by different means,
   so it needs a few non-space vehicles alongside the rockets.
   ══════════════════════════════════════════════════════════════════════════ */

export function Walker({ className = '', title }: Props) {
  return (
    <svg viewBox="0 0 120 120" className={className} role={title ? 'img' : 'presentation'} aria-label={title}>
      <g className="an-bob" stroke="#cbd5e1" strokeWidth="8" strokeLinecap="round" fill="none">
        <circle cx="60" cy="26" r="11" fill="#cbd5e1" stroke="none" />
        <path d="M60 40 L60 70" />
        <path d="M60 70 L46 98" />
        <path d="M60 70 L76 96" />
        <path d="M60 50 L40 62" />
        <path d="M60 50 L80 40" />
      </g>
    </svg>
  )
}

export function Car({ className = '', title }: Props) {
  return (
    <svg viewBox="0 0 120 120" className={className} role={title ? 'img' : 'presentation'} aria-label={title}>
      <g className="an-bob">
        <path d="M18 74 L24 54 q2-8 10-8 h52 q8 0 10 8 l6 20 z" fill="#7ec8ec" />
        <rect x="14" y="70" width="92" height="16" rx="8" fill="#4cb5e4" />
        <path d="M36 54 h20 v-6 h-16 z" fill="#0b1020" opacity="0.55" />
        <path d="M64 48 h16 l6 6 h-22 z" fill="#0b1020" opacity="0.55" />
      </g>
      <circle cx="36" cy="88" r="9" fill="#1e293b" className="an-spin" style={{ transformOrigin: '36px 88px', animationDuration: '1.6s' }} />
      <circle cx="84" cy="88" r="9" fill="#1e293b" className="an-spin" style={{ transformOrigin: '84px 88px', animationDuration: '1.6s' }} />
    </svg>
  )
}

export function Jet({ className = '', title }: Props) {
  return (
    <svg viewBox="0 0 120 120" className={className} role={title ? 'img' : 'presentation'} aria-label={title}>
      <g className="an-float-b">
        <path d="M18 60 L86 52 q14-2 16 8 q-2 10-16 8 L18 60 Z" fill="#e2e8f0" />
        <path d="M46 56 L34 30 L44 30 L62 54 Z" fill="#cbd5e1" />
        <path d="M46 64 L34 90 L44 90 L62 66 Z" fill="#cbd5e1" />
        <circle cx="92" cy="60" r="4" fill="#4cb5e4" />
      </g>
      <path d="M16 60 L2 60" stroke="#94a3b8" strokeWidth="4" strokeLinecap="round" opacity="0.5" className="an-glow" />
    </svg>
  )
}
