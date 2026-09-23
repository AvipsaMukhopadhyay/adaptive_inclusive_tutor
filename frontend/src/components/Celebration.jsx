import { useEffect, useMemo } from 'react'
import { prefersReducedMotion } from './motion.js'

const BITS = ['⭐', '🎉', '✨', '🌟', '👏', '💫']

/**
 * A short, joyful burst for correct answers ('correct') and finished chapters ('chapter').
 * In calm mode it is a gentle, still message instead of flying confetti.
 */
export default function Celebration({ kind, onDone }) {
  const calm = prefersReducedMotion()
  const pieces = useMemo(() => Array.from({ length: kind === 'chapter' ? 28 : 14 }, (_, i) => ({
    ch: BITS[i % BITS.length],
    left: Math.random() * 100,
    delay: Math.random() * 0.4,
    dur: 1.2 + Math.random() * 0.8,
  })), [kind])

  useEffect(() => {
    const t = setTimeout(onDone, kind === 'chapter' ? 3200 : 1600)
    return () => clearTimeout(t)
  }, [kind, onDone])

  return (
    <div className={`celebration ${calm ? 'calm' : ''}`} role="status" aria-live="polite">
      {!calm && pieces.map((p, i) => (
        <span key={i} className="confetti" style={{ left: `${p.left}%`, animationDelay: `${p.delay}s`, animationDuration: `${p.dur}s` }}>{p.ch}</span>
      ))}
      <div className={`celebrate-msg ${kind}`}>
        {kind === 'chapter' ? <>🏆<strong>Chapter complete!</strong><span>Amazing work!</span></> : <>✅<strong>Great job!</strong></>}
      </div>
    </div>
  )
}
