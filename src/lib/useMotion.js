import { useEffect, useState } from 'react'

export function reducedMotion() {
  try {
    return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  } catch {
    return false
  }
}

/** Counts from 0 up to `target` once. With reduced motion it simply shows the target. */
export function useCountUp(target, { duration = 900, decimals = 0, delay = 0 } = {}) {
  const still = target === null || target === undefined || reducedMotion()
  const [v, setV] = useState(still ? target : 0)

  useEffect(() => {
    if (target === null || target === undefined || reducedMotion()) {
      setV(target)
      return undefined
    }
    let raf
    let start
    const timer = setTimeout(() => {
      const tick = (ts) => {
        if (start === undefined) start = ts
        const p = Math.min(1, (ts - start) / duration)
        setV(target * (1 - Math.pow(1 - p, 3)))
        if (p < 1) raf = requestAnimationFrame(tick)
        else setV(target)
      }
      raf = requestAnimationFrame(tick)
    }, delay)
    return () => {
      clearTimeout(timer)
      cancelAnimationFrame(raf)
    }
  }, [target, duration, delay])

  if (v === null || v === undefined) return v
  return decimals ? Number(v).toFixed(decimals) : Math.round(v)
}
