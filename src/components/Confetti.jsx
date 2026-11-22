import React, { useEffect, useRef } from 'react'
import { reducedMotion } from '../lib/useMotion.js'

const COLORS = ['#2451E0', '#E0562A', '#0F9E72', '#14171C', '#F1B434']

// One short burst when a student finishes a topic. Skipped entirely with reduced motion.
export default function Confetti({ onDone }) {
  const ref = useRef(null)

  useEffect(() => {
    if (reducedMotion()) {
      onDone?.()
      return undefined
    }
    const canvas = ref.current
    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1
    const w = (canvas.width = window.innerWidth * dpr)
    const h = (canvas.height = window.innerHeight * dpr)
    const pieces = Array.from({ length: 110 }, () => ({
      x: w / 2 + (Math.random() - 0.5) * w * 0.25,
      y: h * 0.62,
      vx: (Math.random() - 0.5) * 16 * dpr,
      vy: (-Math.random() * 15 - 7) * dpr,
      size: (5 + Math.random() * 6) * dpr,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.3,
      color: COLORS[Math.floor(Math.random() * COLORS.length)]
    }))
    let raf
    const t0 = performance.now()
    const frame = (now) => {
      const t = now - t0
      ctx.clearRect(0, 0, w, h)
      for (const p of pieces) {
        p.vy += 0.42 * dpr
        p.x += p.vx
        p.y += p.vy
        p.rot += p.vr
        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rot)
        ctx.globalAlpha = Math.max(0, 1 - t / 2200)
        ctx.fillStyle = p.color
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2)
        ctx.restore()
      }
      if (t < 2200) raf = requestAnimationFrame(frame)
      else onDone?.()
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [onDone])

  return <canvas ref={ref} className="fixed inset-0 w-full h-full pointer-events-none z-50" aria-hidden="true" data-testid="confetti" />
}
