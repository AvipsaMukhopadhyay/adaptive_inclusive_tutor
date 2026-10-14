/**
 * The owl presenter: a cartoon owl that acts out any idea with moving pictures, used for every lesson step
 * (after a topic scene, or on its own when no scene matches). Frames follow the scenes.jsx contract.
 */
import { C, Emoji, clamp, ease, lerp, loop, pop, seg } from './scenes.jsx'
import { graphemes } from '../motion.js'
import { iconsFor, patternOf, smallNumber } from './icons.js'

const sc = (s) => Math.max(s, 0.001)

/** A friendly owl. mood: 'talk' (beak moves), 'point' (right wing raised), 'cheer' (jumping, both wings up). */
export function Owl({ x = 70, y = 175, s = 1, ms = 0, mood = 'talk' }) {
  const blink = ms % 3300 < 150 ? 0.15 : 1
  const beak = mood === 'talk' || mood === 'point' ? (Math.sin(ms / 75) > 0 ? 1 : 0.2) : 0.6
  const bob = mood === 'cheer' ? -Math.abs(Math.sin(ms / 170)) * 18 : Math.sin(ms / 650) * 2
  const flap = Math.sin(ms / 140)
  const wingL = mood === 'cheer' ? 120 + 25 * flap : 8 * Math.sin(ms / 500)
  const wingR = mood === 'cheer' ? -120 - 25 * flap : mood === 'point' ? -95 + 6 * Math.sin(ms / 250) : -8 * Math.sin(ms / 500)
  return (
    <g transform={`translate(${x} ${y + bob}) scale(${s})`}>
      <ellipse cx="-12" cy="42" rx="8" ry="4" fill="#f08c00" />
      <ellipse cx="12" cy="42" rx="8" ry="4" fill="#f08c00" />
      <g transform={`rotate(${wingL} -28 -12)`}><ellipse cx="-34" cy="8" rx="12" ry="27" fill="#6d4c41" /></g>
      <g transform={`rotate(${wingR} 28 -12)`}><ellipse cx="34" cy="8" rx="12" ry="27" fill="#6d4c41" /></g>
      <polygon points="-30,-30 -22,-52 -12,-36" fill="#6d4c41" />
      <polygon points="30,-30 22,-52 12,-36" fill="#6d4c41" />
      <ellipse cx="0" cy="0" rx="35" ry="43" fill="#8d6e63" />
      <ellipse cx="0" cy="12" rx="22" ry="27" fill="#d7ccc8" />
      {[[-6, 8], [6, 8], [0, 18], [-8, 24], [8, 24]].map(([fx, fy], k) => <path key={k} d={`M${fx - 4},${fy} q4,5 8,0`} fill="none" stroke="#a1887f" strokeWidth="1.5" />)}
      <circle cx="-13" cy="-15" r="13" fill="#fff" stroke="#6d4c41" strokeWidth="2" />
      <circle cx="13" cy="-15" r="13" fill="#fff" stroke="#6d4c41" strokeWidth="2" />
      <ellipse cx="-11" cy="-14" rx="6" ry={6 * blink} fill={C.ink} />
      <ellipse cx="15" cy="-14" rx="6" ry={6 * blink} fill={C.ink} />
      <circle cx="-9" cy="-17" r="2" fill="#fff" opacity={blink} /><circle cx="17" cy="-17" r="2" fill="#fff" opacity={blink} />
      <polygon points="-6,-4 6,-4 0,3" fill="#f59f00" />
      <polygon points={`-5,2 5,2 0,${3 + 6 * beak}`} fill="#e67700" />
    </g>
  )
}

/** Speech bubble with the words appearing as the owl says them. */
function Bubble({ text, t = 1, x = 135, y = 10, w = 255, h = 78 }) {
  const words = (text || '').split(/\s+/)
  const n = Math.ceil(clamp(t * 1.4) * words.length)
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx="16" fill="#fff" stroke="#ced4da" strokeWidth="2" />
      <polygon points={`${x + 6},${y + h - 22} ${x - 22},${y + h + 18} ${x + 30},${y + h - 2}`} fill="#fff" stroke="#ced4da" strokeWidth="2" />
      <rect x={x + 4} y={y + h - 26} width="34" height="24" fill="#fff" />
      <foreignObject x={x + 10} y={y + 6} width={w - 20} height={h - 12}>
        <div xmlns="http://www.w3.org/1999/xhtml" className="owl-bubble">{words.slice(0, n).join(' ')}</div>
      </foreignObject>
    </g>
  )
}

/** Pictures acting out the sentence, in the stage area right of the owl (x 150–390, y 100–245). */
function Act({ icons, pattern, t, ms, count }) {
  const [a, b = a, c, d] = icons
  if (pattern === 'transform') {
    const move = ease(seg(t, 0.15, 0.45)), burst = seg(t, 0.4, 0.6), grow = pop(seg(t, 0.55, 0.8))
    return (
      <>
        <Emoji x={lerp(175, 265, move)} y={172} size={50} scale={1 - burst} opacity={1 - burst}>{a}</Emoji>
        {burst > 0 && burst < 1 && Array.from({ length: 8 }, (_, k) => (
          <circle key={k} cx={265 + Math.cos(k * 0.785) * 40 * burst} cy={172 + Math.sin(k * 0.785) * 40 * burst} r={5 * (1 - burst)} fill={C.yellow} />
        ))}
        <Emoji x={lerp(265, 335, ease(seg(t, 0.8, 1)))} y={172} size={56} scale={grow}>{b}</Emoji>
        <Emoji x={265} y={226} size={22} opacity={seg(t, 0.3, 0.5)}>✨</Emoji>
      </>
    )
  }
  if (pattern === 'compare') {
    const tilt = lerp(0, 14, ease(seg(t, 0.35, 0.7))) + Math.sin(ms / 300) * 2 * seg(t, 0.7, 1)
    return (
      <g>
        <polygon points="270,232 255,252 285,252" fill="#adb5bd" />
        <g transform={`rotate(${tilt} 270 232)`}>
          <rect x="170" y="228" width="200" height="8" rx="4" fill={C.ink} />
          <Emoji x={190} y={lerp(120, 205, ease(seg(t, 0, 0.3)))} size={46}>{a}</Emoji>
          <Emoji x={350} y={lerp(120, 200, ease(seg(t, 0.15, 0.4)))} size={58}>{b}</Emoji>
        </g>
      </g>
    )
  }
  if (pattern === 'cause') {
    return (
      <>
        {[0, 1, 2, 3].map((k) => {
          const fall = ease(seg(t, 0.2 + k * 0.1, 0.32 + k * 0.1)) * 70
          return <rect key={k} x={175 + k * 32} y={170} width="12" height="56" rx="3" fill={k === 0 ? C.primary : '#adb5bd'} transform={`rotate(${fall} ${187 + k * 32} 226)`} />
        })}
        <Emoji x={175} y={140} size={34} opacity={1 - seg(t, 0.2, 0.3)}>{a}</Emoji>
        <Emoji x={345} y={190} size={54} scale={pop(seg(t, 0.62, 0.85))}>{b}</Emoji>
        <Emoji x={345} y={140} size={26} scale={pop(seg(t, 0.62, 0.8))}>💥</Emoji>
      </>
    )
  }
  const list = [a, b, c, d].filter(Boolean).filter((e, i, arr) => arr.indexOf(e) === i)
  return (
    <>
      {list.map((e, k) => {
        const x = list.length === 1 ? 270 : 180 + (k * 180) / (list.length - 1)
        const y = 170 + Math.sin(ms / 450 + k) * 6
        return <Emoji key={k} x={x} y={lerp(260, y, ease(seg(t, k * 0.15, k * 0.15 + 0.3)))} size={list.length > 3 ? 42 : 52} scale={pop(seg(t, k * 0.15, k * 0.15 + 0.3))}>{e}</Emoji>
      })}
      {count && Array.from({ length: count }, (_, k) => (
        <circle key={k} cx={270 - ((count - 1) * 18) / 2 + k * 18} cy={232} r={7 * sc(pop(seg(t, 0.45 + k * 0.04, 0.55 + k * 0.04)))} fill={C.orange} />
      ))}
    </>
  )
}

/** Example pictures drop in piece by piece and bounce into place. */
function DropIn({ visual, t }) {
  const lines = visual.split('\n').map(graphemes)
  const total = lines.reduce((n, l) => n + l.length, 0)
  const size = Math.min(30, 230 / Math.max(...lines.map((l) => l.length), 1) * 1.6)
  let idx = 0
  return lines.map((chars, li) => chars.map((ch, ci) => {
    const k = idx++, p = seg(t, (k / total) * 0.7, (k / total) * 0.7 + 0.18)
    const bounce = p < 1 ? Math.abs(Math.cos(p * Math.PI * 1.5)) * (1 - p) * 60 : 0
    const x = 270 - (chars.length * size * 0.62) / 2 + ci * size * 0.62 + size * 0.3
    const y = 150 + (li - (lines.length - 1) / 2) * size * 1.3
    return ch.trim() && <text key={`${li}-${ci}`} x={x} y={y - bounce - (1 - Math.min(p * 4, 1)) * 80} fontSize={size} fontWeight="800" textAnchor="middle" dominantBaseline="central" fill={C.ink} opacity={p > 0 ? 1 : 0}>{ch}</text>
  }))
}

const confetti = (ms, t) => Array.from({ length: 18 }, (_, k) => {
  const p = loop(ms, 2200, k * 120)
  return <rect key={k} x={140 + ((k * 53) % 250)} y={lerp(-10, 250, p)} width="7" height="11" rx="2" fill={[C.red, C.yellow, C.blue, C.green, C.orange][k % 5]} opacity={seg(t, 0, 0.2)} transform={`rotate(${ms / 5 + k * 40} ${140 + ((k * 53) % 250)} ${lerp(-10, 250, p)})`} />
})

/** The owl presents the idea, its picture, the lesson's example and a "remember" moment. */
export function presenterFrames(step, subject, { withIdea }) {
  const frames = []
  const ideaIcons = iconsFor(`${step.point} ${step.detail ?? ''}`, subject)
  if (withIdea) {
    frames.push({
      caption: step.point, duration: 5500,
      draw: (t, ms) => (
        <>
          <Owl ms={ms} mood={t < 0.75 ? 'talk' : 'point'} />
          <Bubble text={step.point} t={seg(t, 0, 0.7)} />
          <Act icons={ideaIcons} pattern={patternOf(step.point)} t={seg(t, 0.15, 1)} ms={ms} count={smallNumber(step.point)} />
        </>
      ),
    })
    if (step.picture) {
      const pictureIcons = iconsFor(step.picture, subject)
      frames.push({
        caption: step.picture, duration: Math.min(9000, 3000 + step.picture.split(/\s+/).length * 140),
        draw: (t, ms) => (
          <>
            <Owl ms={ms} mood="talk" />
            <Bubble text={"Let's imagine it! 🎨"} t={1} h={44} />
            <Act icons={pictureIcons} pattern={patternOf(step.picture)} t={t} ms={ms} count={smallNumber(step.picture)} />
          </>
        ),
      })
    }
  }
  const ex = step.example
  if (ex) {
    frames.push({
      caption: ex.content, say: `${ex.title}. ${ex.content}`, duration: 5000 + Math.min(graphemes(ex.visual || '').length * 60, 3000),
      draw: (t, ms) => (
        <>
          <Owl ms={ms} mood="point" />
          <Bubble text={`Example: ${ex.title}`} t={1} h={44} />
          {ex.visual
            ? <DropIn visual={ex.visual} t={t} />
            : <Act icons={iconsFor(ex.content, subject)} pattern={patternOf(ex.content)} t={t} ms={ms} count={smallNumber(ex.content)} />}
        </>
      ),
    })
  }
  frames.push({
    caption: `Remember: ${step.point}`, duration: 4000,
    draw: (t, ms) => (
      <>
        {confetti(ms, t)}
        <Owl ms={ms} mood="cheer" />
        <Bubble text={`⭐ ${step.point}`} t={seg(t, 0.1, 0.6)} />
        <Emoji x={300} y={180} size={70} scale={pop(seg(t, 0, 0.4))}>{ideaIcons[0]}</Emoji>
        <Emoji x={300} y={180} size={110} opacity={0.25 * seg(t, 0.2, 0.5)}>⭐</Emoji>
      </>
    ),
  })
  return frames
}
