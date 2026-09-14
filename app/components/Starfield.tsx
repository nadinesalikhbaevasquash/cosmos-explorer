'use client'

/**
 * The starfield behind everything.
 *
 * Generated once on mount rather than baked into markup, so the sky is different
 * on every visit and the server never has to ship a few hundred absolutely
 * positioned divs in the HTML.
 *
 * Three depths, because a single layer of identical dots reads as noise. Far stars
 * are small, dim and still; mid stars twinkle; a few near stars are larger, tinted
 * and drift slowly sideways. That parallax is most of what separates a sky from a
 * speckle pattern.
 */

import { useEffect, useMemo, useState } from 'react'

type Star = {
  x: number
  y: number
  size: number
  delay: number
  duration: number
  opacity: number
  colour: string
}

// Pastels from the palette, so the sky belongs to the same system as the UI.
const TINTS = ['#FFFFFF', '#FFFFFF', '#FFFFFF', '#C9BFFF', '#FFD7EA', '#CFF3E6', '#FFE6C2']

function build(count: number, sizeRange: [number, number], seedOffset: number): Star[] {
  return Array.from({ length: count }, (_, i) => {
    const r = (n: number) => Math.abs(Math.sin((i + seedOffset) * n) * 10000) % 1
    return {
      x: r(12.9898) * 100,
      y: r(78.233) * 100,
      size: sizeRange[0] + r(45.164) * (sizeRange[1] - sizeRange[0]),
      delay: r(93.989) * 6,
      duration: 2.4 + r(27.611) * 4.5,
      opacity: 0.28 + r(64.121) * 0.6,
      colour: TINTS[Math.floor(r(31.42) * TINTS.length)],
    }
  })
}

export default function Starfield({ density = 1 }: { density?: number }) {
  // Rendered only after mount. Server and client would otherwise disagree about
  // the sky and React would warn about a hydration mismatch.
  const [ready, setReady] = useState(false)
  useEffect(() => setReady(true), [])

  const far = useMemo(() => build(Math.round(90 * density), [0.8, 1.6], 0), [density])
  const mid = useMemo(() => build(Math.round(45 * density), [1.4, 2.4], 300), [density])
  const near = useMemo(() => build(Math.round(14 * density), [2.6, 4], 900), [density])

  if (!ready) return null

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Far: still, dim, no animation at all. Depth comes from stillness. */}
      <div className="absolute inset-0">
        {far.map((s, i) => (
          <span
            key={`f${i}`}
            className="absolute rounded-full"
            style={{
              left: `${s.x}%`,
              top: `${s.y}%`,
              width: s.size,
              height: s.size,
              background: s.colour,
              opacity: s.opacity * 0.5,
            }}
          />
        ))}
      </div>

      {/* Mid: the twinkling layer. */}
      <div className="absolute inset-0">
        {mid.map((s, i) => (
          <span
            key={`m${i}`}
            className="star"
            style={{
              left: `${s.x}%`,
              top: `${s.y}%`,
              width: s.size,
              height: s.size,
              background: s.colour,
              animationDelay: `${s.delay}s`,
              animationDuration: `${s.duration}s`,
            }}
          />
        ))}
      </div>

      {/* Near: larger, tinted, drifting. Carries the parallax. */}
      <div className="drift absolute inset-0">
        {near.map((s, i) => (
          <span
            key={`n${i}`}
            className="star"
            style={{
              left: `${s.x}%`,
              top: `${s.y}%`,
              width: s.size,
              height: s.size,
              background: s.colour,
              boxShadow: `0 0 ${s.size * 2.5}px ${s.colour}`,
              animationDelay: `${s.delay}s`,
              animationDuration: `${s.duration * 1.4}s`,
            }}
          />
        ))}
      </div>
    </div>
  )
}
