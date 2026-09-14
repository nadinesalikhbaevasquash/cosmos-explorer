'use client'

/**
 * The light curve plotter.
 *
 * Canvas rather than SVG, and rather than a chart library, for one reason: a
 * 20-night campaign is nearly 3,000 points, the fold redraws on every frame of a
 * slider drag, and 3,000 DOM nodes cannot be re-laid-out at 60fps. Canvas draws the
 * whole thing in a single pass.
 *
 * Two modes share this component because they have to look like the same instrument.
 * Raw mode shows brightness against time and is meant to look like nothing at all.
 * Folded mode wraps every point onto one cycle of the trial period, and when the
 * period is right the scatter collapses into a transit. The player has to feel that
 * those are two views of the same data, not two different charts.
 */

import { useEffect, useRef } from 'react'
import { foldPhase, foldStats } from '../lib/physics'
import type { Point } from '../lib/campaign'

type Props = {
  points: Point[]
  mode: 'raw' | 'folded'
  /** Trial period in days. Required in folded mode. */
  period?: number
  /** Per-point photometric scatter, needed to bin the fold. Required in folded mode. */
  sigma?: number
  /** Draw a horizontal guide at this depth below the baseline, as a fraction. */
  depthGuide?: number | null
  height?: number
  /** Accent used for the binned-average overlay. */
  accent?: string
  className?: string
}


export default function LightCurve({
  points,
  mode,
  period,
  sigma = 0.001,
  depthGuide = null,
  height = 300,
  accent = '#7e88ec',
  className = '',
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const wrapRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    if (!canvas || !wrap) return

    const draw = () => {
      const width = wrap.clientWidth
      if (width === 0) return

      // Render at device resolution so points stay crisp on retina displays, then
      // scale the context back so all drawing code can work in CSS pixels.
      const dpr = window.devicePixelRatio || 1
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`

      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, width, height)

      const padL = 62
      const padTopLabel = 12
      const padR = 16
      const padT = 28
      const padB = 34
      const plotW = width - padL - padR
      const plotH = height - padT - padB
      if (plotW <= 0 || plotH <= 0) return

      if (points.length === 0) {
        ctx.fillStyle = '#475569'
        ctx.font = '13px system-ui, sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText('No data yet. Spend nights on this target to build a light curve.', width / 2, height / 2)
        return
      }

      /* ── Vertical scale ──────────────────────────────────────────────
         Fixed to the data's own spread rather than to the transit depth, because
         auto-zooming onto a dip the player has not found yet would give the answer
         away. A quiet star and a star with a planet must look equally featureless
         until the fold lines up. */
      let lo = Infinity
      let hi = -Infinity
      for (const p of points) {
        if (p.flux < lo) lo = p.flux
        if (p.flux > hi) hi = p.flux
      }
      const span = Math.max(hi - lo, 1e-6)
      const padY = span * 0.12
      lo -= padY
      hi += padY

      const yOf = (flux: number) => padT + ((hi - flux) / (hi - lo)) * plotH

      /* ── Horizontal scale ───────────────────────────────────────────── */
      const folded = mode === 'folded' && period && period > 0

      // In folded mode the event is shifted to the middle of the chart. Mid-transit
      // lands at whatever phase the epoch happens to put it, and a transit sitting
      // half off the left edge reads as two unrelated stubs rather than one dip.
      const stats = folded ? foldStats(points, period!, sigma) : null
      const shift = stats ? stats.minPhase : 0
      const recentre = (ph: number) => {
        let v = ph - shift
        if (v < -0.5) v += 1
        if (v >= 0.5) v -= 1
        return v
      }

      let xOf: (p: Point) => number
      if (folded) {
        xOf = (p: Point) => padL + (recentre(foldPhase(p.time, period!)) + 0.5) * plotW
      } else {
        const tMax = points[points.length - 1].time || 1
        xOf = (p: Point) => padL + (p.time / tMax) * plotW
      }

      /* ── Grid ───────────────────────────────────────────────────────── */
      ctx.strokeStyle = 'rgba(148,163,184,0.10)'
      ctx.lineWidth = 1
      ctx.beginPath()
      for (let i = 0; i <= 4; i++) {
        const y = padT + (i / 4) * plotH
        ctx.moveTo(padL, y)
        ctx.lineTo(padL + plotW, y)
      }
      ctx.stroke()

      // Baseline at unobscured brightness, the reference the dip is measured from.
      if (1 >= lo && 1 <= hi) {
        ctx.strokeStyle = 'rgba(148,163,184,0.35)'
        ctx.setLineDash([4, 4])
        ctx.beginPath()
        ctx.moveTo(padL, yOf(1))
        ctx.lineTo(padL + plotW, yOf(1))
        ctx.stroke()
        ctx.setLineDash([])
      }

      if (depthGuide != null && depthGuide > 0) {
        const y = yOf(1 - depthGuide)
        if (y > padT && y < padT + plotH) {
          ctx.strokeStyle = 'rgba(251,191,36,0.55)'
          ctx.setLineDash([2, 3])
          ctx.beginPath()
          ctx.moveTo(padL, y)
          ctx.lineTo(padL + plotW, y)
          ctx.stroke()
          ctx.setLineDash([])
        }
      }

      /* ── Points ─────────────────────────────────────────────────────── */
      // Individual measurements are drawn faint and small. Any one of them is mostly
      // noise; the signal only exists in the population, which is the intuition the
      // visual weighting is trying to build.
      ctx.fillStyle = folded ? 'rgba(148,163,184,0.40)' : 'rgba(148,163,184,0.30)'
      const r = points.length > 4000 ? 0.7 : 1.1
      for (const p of points) {
        const x = xOf(p)
        const y = yOf(p.flux)
        ctx.fillRect(x - r, y - r, r * 2, r * 2)
      }

      /* ── Binned averages ────────────────────────────────────────────── */
      // Averaging beats the noise down by sqrt(N). This overlay is where a real
      // transit becomes undeniable and where a starspot reveals its rounded shape,
      // so it only appears in folded mode, as the reward for finding the period.
      if (folded && stats) {
        const n = stats.bins
        // Bins are drawn as separated points rather than one continuous stroke,
        // because a line drawn straight through a gap would invent data that was
        // never measured.
        const xs: (number | null)[] = new Array(n).fill(null)
        for (let i = 0; i < n; i++) {
          if (stats.means[i] == null) continue
          xs[i] = padL + (recentre((i + 0.5) / n - 0.5) + 0.5) * plotW
        }

        ctx.strokeStyle = accent
        ctx.lineWidth = 2
        ctx.beginPath()
        let prevX: number | null = null
        for (let i = 0; i < n; i++) {
          const m = stats.means[i]
          const x = xs[i]
          if (m == null || x == null) {
            prevX = null
            continue
          }
          const y = yOf(m)
          // Wrapping the phase can place consecutive bins on opposite sides of the
          // chart; break the stroke there instead of drawing across the whole plot.
          if (prevX == null || Math.abs(x - prevX) > plotW / 4) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
          prevX = x
        }
        ctx.stroke()

        ctx.fillStyle = accent
        for (let i = 0; i < n; i++) {
          const m = stats.means[i]
          const x = xs[i]
          if (m == null || x == null) continue
          ctx.beginPath()
          ctx.arc(x, yOf(m), 1.8, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      /* ── Axes ───────────────────────────────────────────────────────── */
      ctx.fillStyle = '#64748b'
      ctx.font = '11px ui-monospace, SFMono-Regular, monospace'
      ctx.textAlign = 'right'
      for (let i = 0; i <= 4; i++) {
        const flux = hi - (i / 4) * (hi - lo)
        const pct = (flux - 1) * 100
        ctx.fillText(`${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`, padL - 8, padT + (i / 4) * plotH + 4)
      }

      ctx.textAlign = 'center'
      if (folded) {
        ctx.fillText('-0.5', padL, height - 12)
        ctx.fillText('0', padL + plotW / 2, height - 12)
        ctx.fillText('+0.5', padL + plotW, height - 12)
        ctx.fillStyle = '#475569'
        ctx.fillText('orbital phase', padL + plotW / 2, height - 1)
      } else {
        const tMax = points[points.length - 1].time || 1
        ctx.fillText('0', padL, height - 12)
        ctx.fillText(`${(tMax / 2).toFixed(1)}`, padL + plotW / 2, height - 12)
        ctx.fillText(`${tMax.toFixed(1)}`, padL + plotW, height - 12)
        ctx.fillStyle = '#475569'
        ctx.fillText('nights since campaign start', padL + plotW / 2, height - 1)
      }

      // Horizontal caption above the plot rather than a rotated label beside it. A
      // rotated title has to share the left gutter with the tick labels, and at this
      // font size they overlap no matter how wide the gutter gets.
      ctx.textAlign = 'left'
      ctx.fillStyle = '#475569'
      ctx.fillText('relative brightness', padL, padTopLabel + 4)
    }

    draw()

    // Redraw on container resize so the chart survives a window resize or a layout
    // shift from a panel opening beside it.
    const ro = new ResizeObserver(draw)
    ro.observe(wrap)
    return () => ro.disconnect()
  }, [points, mode, period, sigma, depthGuide, height, accent])

  return (
    <div ref={wrapRef} className={`w-full ${className}`}>
      <canvas ref={canvasRef} className="block w-full" />
    </div>
  )
}
