'use client'

/**
 * Nova, the observatory telescope.
 *
 * Crossfire gets most of its charm from having faces on the page, so AstraNova gets
 * one too. A telescope rather than an astronaut or a rocket: it is what the site
 * actually is, and it is a shape nobody else is using as a character.
 *
 * Hand-drawn SVG rather than an illustration file, because the eyes have to track
 * the cursor and the whole thing has to recolour with the palette. The personality
 * is entirely in the timing: a slow bob, a blink on an uneven schedule, and a lens
 * that follows your pointer. Nothing here is a loop running at the same speed as
 * anything else, which is what stops it reading as a spinner.
 */

import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

type Props = {
  size?: number
  className?: string
}

export default function Mascot({ size = 190, className = '' }: Props) {
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const reduce = useReducedMotion()

  // Pupil offset in SVG units, driven by the pointer.
  const [gaze, setGaze] = useState({ x: 0, y: 0 })
  const [blink, setBlink] = useState(false)

  useEffect(() => {
    if (reduce) return
    const onMove = (e: PointerEvent) => {
      const el = wrapRef.current
      if (!el) return
      const r = el.getBoundingClientRect()
      const cx = r.left + r.width / 2
      const cy = r.top + r.height / 2
      const dx = e.clientX - cx
      const dy = e.clientY - cy
      const dist = Math.hypot(dx, dy) || 1
      // Clamped so the pupil stays inside the lens however far away the cursor is.
      const reach = Math.min(dist, 260) / 260
      setGaze({ x: (dx / dist) * 4.6 * reach, y: (dy / dist) * 4.6 * reach })
    }
    window.addEventListener('pointermove', onMove)
    return () => window.removeEventListener('pointermove', onMove)
  }, [reduce])

  // Blinks at irregular intervals. A fixed interval reads mechanical; the random
  // gap is what makes it feel alive.
  useEffect(() => {
    if (reduce) return
    let timer: ReturnType<typeof setTimeout>
    const schedule = () => {
      timer = setTimeout(() => {
        setBlink(true)
        setTimeout(() => setBlink(false), 145)
        schedule()
      }, 2600 + Math.random() * 4200)
    }
    schedule()
    return () => clearTimeout(timer)
  }, [reduce])

  return (
    <div
      ref={wrapRef}
      className={`relative ${className}`}
      style={{ width: size, height: size }}
      aria-hidden
    >
      {/* Halo behind the lens, the page's one focal pulse. */}
      <div
        className="halo absolute left-1/2 top-[38%] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          width: size * 0.62,
          height: size * 0.62,
          background: 'radial-gradient(circle, rgba(155,140,255,0.5), transparent 68%)',
          filter: 'blur(14px)',
        }}
      />

      <motion.div
        animate={reduce ? undefined : { y: [0, -7, 0], rotate: [0, 1.1, 0, -1.1, 0] }}
        transition={{ duration: 6.2, repeat: Infinity, ease: 'easeInOut' }}
        className="relative h-full w-full"
      >
        <svg viewBox="0 0 200 200" className="h-full w-full overflow-visible">
          <defs>
            <linearGradient id="tube" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#3A3470" />
              <stop offset="55%" stopColor="#2A2554" />
              <stop offset="100%" stopColor="#1D1940" />
            </linearGradient>
            <linearGradient id="lensGlass" x1="0" y1="0" x2="0.7" y2="1">
              <stop offset="0%" stopColor="#B9AEFF" />
              <stop offset="60%" stopColor="#7FD1FF" />
              <stop offset="100%" stopColor="#6FE7C0" />
            </linearGradient>
            <linearGradient id="legMetal" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#4A4384" />
              <stop offset="100%" stopColor="#302B5C" />
            </linearGradient>
          </defs>

          {/* Tripod */}
          <g stroke="url(#legMetal)" strokeWidth="7" strokeLinecap="round" fill="none">
            <path d="M100 138 L74 182" />
            <path d="M100 138 L126 182" />
            <path d="M100 138 L100 176" />
          </g>
          <circle cx="100" cy="138" r="9" fill="#3A3470" />

          {/* Body of the telescope, tilted up at the sky */}
          <g transform="rotate(-20 100 100)">
            <rect x="62" y="84" width="88" height="34" rx="17" fill="url(#tube)" />
            {/* Two banding rings, the detail that makes it read as an instrument */}
            <rect x="88" y="84" width="5" height="34" fill="#4A4384" opacity="0.85" />
            <rect x="116" y="84" width="5" height="34" fill="#4A4384" opacity="0.85" />

            {/* Eyepiece at the back */}
            <rect x="52" y="92" width="14" height="18" rx="6" fill="#241F4C" />

            {/* The lens, which is also the eye */}
            <circle cx="152" cy="101" r="25" fill="#1B1740" />
            <circle cx="152" cy="101" r="21" fill="url(#lensGlass)" />

            {/* Pupil tracks the cursor */}
            <motion.g animate={{ x: gaze.x, y: gaze.y }} transition={{ type: 'spring', stiffness: 170, damping: 16 }}>
              <circle cx="152" cy="101" r="9.5" fill="#12102A" />
              <circle cx="148.6" cy="97.6" r="3.4" fill="#FFFFFF" opacity="0.92" />
              <circle cx="156" cy="105" r="1.7" fill="#FFFFFF" opacity="0.5" />
            </motion.g>

            {/* Eyelid. Scaling a covering rect is cheaper and smoother than
                animating the circle itself, and it blinks from the top like a lid. */}
            <motion.rect
              x="127"
              y="76"
              width="50"
              height="50"
              fill="#2A2554"
              animate={{ scaleY: blink ? 1 : 0 }}
              style={{ originY: 0, transformBox: 'fill-box' }}
              transition={{ duration: 0.07 }}
            />
            <circle cx="152" cy="101" r="25" fill="none" stroke="#4A4384" strokeWidth="3" />

            {/* Blush, directly responsible for the whole thing reading as cute */}
            <ellipse cx="132" cy="116" rx="7" ry="4.2" fill="#FF9FC9" opacity="0.42" />
          </g>

          {/* Little stars orbiting the lens, on their own unrelated timings */}
          <motion.g
            animate={reduce ? undefined : { opacity: [0.25, 1, 0.25], scale: [0.85, 1.15, 0.85] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
            style={{ originX: '168px', originY: '44px' }}
          >
            <path d="M168 38 L170 43 L175 44 L170 46 L168 51 L166 46 L161 44 L166 43 Z" fill="#FFD36B" />
          </motion.g>
          <motion.g
            animate={reduce ? undefined : { opacity: [1, 0.3, 1], scale: [1.1, 0.9, 1.1] }}
            transition={{ duration: 4.1, repeat: Infinity, ease: 'easeInOut', delay: 0.7 }}
          >
            <path d="M46 56 L47.4 59.6 L51 61 L47.4 62.4 L46 66 L44.6 62.4 L41 61 L44.6 59.6 Z" fill="#FF9FC9" />
          </motion.g>
          <motion.circle
            cx="182"
            cy="76"
            r="2.6"
            fill="#6FE7C0"
            animate={reduce ? undefined : { opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 1.4 }}
          />
        </svg>
      </motion.div>
    </div>
  )
}
