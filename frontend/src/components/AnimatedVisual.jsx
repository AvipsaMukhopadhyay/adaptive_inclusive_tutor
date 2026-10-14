import { useEffect, useMemo, useState } from 'react'
import { graphemes, prefersReducedMotion } from './motion.js'

/**
 * Draws a picture example piece by piece (each emoji/character pops in), so learners can
 * follow what is being counted or compared. Static when motion is reduced.
 */
export default function AnimatedVisual({ visual, animate = true, big = false }) {
  const lines = useMemo(() => (visual || '').split('\n').map(graphemes), [visual])
  const total = lines.reduce((n, l) => n + l.length, 0)
  const still = !animate || prefersReducedMotion()
  const [shown, setShown] = useState(still ? total : 0)
  const [run, setRun] = useState(0)

  useEffect(() => {
    if (still) { setShown(total); return }
    setShown(0)
    const speed = Math.max(25, Math.min(90, 2500 / Math.max(total, 1)))
    const t = setInterval(() => setShown((n) => { if (n >= total) { clearInterval(t); return n } return n + 1 }), speed)
    return () => clearInterval(t)
  }, [visual, run, still, total])

  if (!visual) return null
  let count = 0
  return (
    <div className="visual-wrap">
      <pre className={`visual ${big ? 'big' : ''} ${still ? '' : 'animated'}`} aria-label={visual}>
        {lines.map((chars, li) => (
          <span key={li} className="v-line">
            {chars.map((ch, ci) => {
              const idx = count++
              return <span key={ci} className={`v-ch ${idx < shown ? 'in' : ''}`}>{ch}</span>
            })}
            {li < lines.length - 1 && '\n'}
          </span>
        ))}
      </pre>
      {!still && shown >= total && (
        <button type="button" className="btn-link small" onClick={() => setRun(run + 1)}>▶ Play again</button>
      )}
    </div>
  )
}
