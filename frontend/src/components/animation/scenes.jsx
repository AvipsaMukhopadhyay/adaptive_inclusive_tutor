/**
 * Animated scenes that show an idea moving, one short frame at a time.
 *
 * A scene is { title, frames }. Each frame has a caption (shown and read aloud), a duration in ms and
 * draw(t, ms): t goes 0 → 1 over the frame, ms is the time since the frame started (for looping motion).
 * Frames return SVG content for a 400 × 260 stage. Scenes are matched to ideas on the server
 * (Imagery.java: the `scene` of each lesson step); ideas without a scene get the generic animation in
 * AnimationPlayer, built from the lesson's own text and example.
 */

export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x))
/** Progress of t through the window [a, b], as 0 → 1. */
export const seg = (t, a, b) => clamp((t - a) / (b - a))
export const ease = (x) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2)
export const lerp = (a, b, x) => a + (b - a) * x
/** Grows with a small, friendly overshoot. */
export const pop = (x) => {
  if (x <= 0) return 0
  if (x >= 1) return 1
  const c1 = 1.70158, c3 = c1 + 1
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2)
}
export const rad = (deg) => (deg * Math.PI) / 180
/** Bounces v back and forth between lo and hi. */
export const reflect = (v, lo, hi) => {
  const span = hi - lo, period = 2 * span
  const m = ((v - lo) % period + period) % period
  return lo + (m < span ? m : period - m)
}

export const C = {
  ink: '#1f2a44', muted: '#65708a', primary: '#4f46e5', soft: '#eef0ff', green: '#2f9e44', leaf: '#51cf66',
  blue: '#339af0', sky: '#d0ebff', orange: '#f08c00', yellow: '#fcc419', red: '#e03131', crust: '#d08b2c', cheese: '#f6c453',
}

export function Label({ x, y, children, size = 15, color = C.ink, show = 1, anchor = 'middle', weight = 800 }) {
  return (
    <text x={x} y={y} fontSize={size} fontWeight={weight} fill={color} textAnchor={anchor} dominantBaseline="central"
          opacity={show} style={{ fontFamily: 'inherit' }}>{children}</text>
  )
}

export function Emoji({ x, y, size = 28, scale = 1, children, opacity = 1 }) {
  return (
    <text x={0} y={0} fontSize={size} textAnchor="middle" dominantBaseline="central" opacity={opacity}
          transform={`translate(${x} ${y}) scale(${Math.max(scale, 0.001)})`}>{children}</text>
  )
}

export function Arrow({ x1, y1, x2, y2, progress = 1, color = C.muted, dashed = false }) {
  if (progress <= 0) return null
  const x = lerp(x1, x2, progress), y = lerp(y1, y2, progress)
  return (
    <line x1={x1} y1={y1} x2={x} y2={y} stroke={color} strokeWidth="3" strokeLinecap="round"
          strokeDasharray={dashed ? '6 6' : undefined} markerEnd={progress > 0.9 ? 'url(#anim-arrow)' : undefined} />
  )
}

export const ArrowDefs = () => (
  <defs>
    <marker id="anim-arrow" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z" fill={C.muted} />
    </marker>
    <radialGradient id="anim-glow">
      <stop offset="0%" stopColor="#fff3bf" />
      <stop offset="100%" stopColor="#fff3bf" stopOpacity="0" />
    </radialGradient>
  </defs>
)

/** A pie wedge from angle a0 to a1 (degrees clockwise from 12 o'clock). */
export function wedge(cx, cy, r, a0, a1) {
  const p = (a) => [cx + r * Math.sin(rad(a)), cy - r * Math.cos(rad(a))]
  const [x0, y0] = p(a0), [x1, y1] = p(a1)
  return `M${cx},${cy} L${x0},${y0} A${r},${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1},${y1} Z`
}

// ------------------------------------------------------------------ fractions: a pizza

const PZ = { cx: 140, cy: 130, r: 95 }
function WholePizza({ scale = 1, toppings = 1 }) {
  const { cx, cy, r } = PZ
  return (
    <g transform={`translate(${cx} ${cy}) scale(${Math.max(scale, 0.001)}) translate(${-cx} ${-cy})`}>
      <circle cx={cx} cy={cy} r={r} fill={C.cheese} stroke={C.crust} strokeWidth="8" />
      {Array.from({ length: 8 }, (_, k) => {
        const a = rad(k * 45 + 22.5)
        return <circle key={k} cx={cx + r * 0.58 * Math.sin(a)} cy={cy - r * 0.58 * Math.cos(a)} r="8" fill={C.red}
                       opacity={seg(toppings, k / 8, (k + 1) / 8)} />
      })}
    </g>
  )
}
function SlicedPizza({ taken = 0, pull = 0 }) {
  const { cx, cy, r } = PZ
  return Array.from({ length: 8 }, (_, k) => {
    const mid = rad(k * 45 + 22.5), out = k < taken ? pull * 22 : 0
    return (
      <g key={k} transform={`translate(${out * Math.sin(mid)} ${-out * Math.cos(mid)})`}>
        <path d={wedge(cx, cy, r, k * 45, (k + 1) * 45)} fill={k < taken ? '#ffa94d' : C.cheese} stroke={C.crust} strokeWidth="4" />
        <circle cx={cx + r * 0.58 * Math.sin(mid)} cy={cy - r * 0.58 * Math.cos(mid)} r="8" fill={C.red} />
      </g>
    )
  })
}
function Fraction({ x, y, top, bottom, show = 1, size = 44 }) {
  return (
    <g opacity={show}>
      <Label x={x} y={y - size * 0.55} size={size} color={C.primary}>{top}</Label>
      <line x1={x - size * 0.5} y1={y} x2={x + size * 0.5} y2={y} stroke={C.ink} strokeWidth="4" strokeLinecap="round" />
      <Label x={x} y={y + size * 0.6} size={size} color={C.orange}>{bottom}</Label>
    </g>
  )
}

const fraction = {
  title: 'Sharing a pizza',
  frames: [
    { caption: 'Here is one whole pizza. 🍕', duration: 3000,
      draw: (t) => <WholePizza scale={pop(seg(t, 0, 0.5))} toppings={seg(t, 0.4, 1)} /> },
    { caption: 'We cut it into 8 equal slices.', duration: 4500,
      draw: (t) => (
        <>
          <WholePizza />
          {[0, 1, 2, 3].map((k) => {
            const p = ease(seg(t, k * 0.2, k * 0.2 + 0.2)), a = rad(k * 45), { cx, cy, r } = PZ
            return <line key={k} x1={cx - r * Math.sin(a) * p} y1={cy + r * Math.cos(a) * p} x2={cx + r * Math.sin(a) * p}
                         y2={cy - r * Math.cos(a) * p} stroke={C.crust} strokeWidth="4" strokeLinecap="round" />
          })}
          <Label x={320} y={130} size={22} show={seg(t, 0.85, 1)}>8 slices</Label>
        </>
      ) },
    { caption: 'We take 3 slices. That is 3 out of 8.', duration: 4000,
      draw: (t) => (
        <>
          <SlicedPizza taken={Math.min(3, Math.floor(seg(t, 0, 0.6) * 3) + (t > 0 ? 1 : 0))} pull={ease(seg(t, 0, 0.6))} />
          <Fraction x={320} y={125} top="3" bottom="8" show={seg(t, 0.55, 0.9)} />
        </>
      ) },
    { caption: 'The bottom number is how many equal slices. The top number is how many we take.', duration: 4500,
      draw: (t) => (
        <>
          <SlicedPizza taken={3} pull={1} />
          <Fraction x={300} y={125} top="3" bottom="8" />
          <Label x={330} y={75} size={13} color={C.primary} anchor="start" show={seg(t, 0.1, 0.4)}>← we take</Label>
          <Label x={330} y={180} size={13} color={C.orange} anchor="start" show={seg(t, 0.5, 0.8)}>← slices in all</Label>
        </>
      ) },
  ],
}

// ------------------------------------------------------------------ factors: chairs in rows

const chairLayout = (rows, cols) => Array.from({ length: 12 }, (_, k) => ({
  x: 200 - (cols * 30) / 2 + 15 + (k % cols) * 30,
  y: 120 - (rows * 36) / 2 + 18 + Math.floor(k / cols) * 36,
}))
const L1 = chairLayout(1, 12), L2 = chairLayout(2, 6), L3 = chairLayout(3, 4)
const Chairs = ({ from, to, p = 1, appear = 12 }) => from.map((a, k) => (
  <Emoji key={k} x={lerp(a.x, to[k].x, p)} y={lerp(a.y, to[k].y, p)} size={24} scale={pop(clamp(appear - k))}>🪑</Emoji>
))

const factor = {
  title: 'Chairs in neat rows',
  frames: [
    { caption: 'Here are 12 chairs.', duration: 3500,
      draw: (t) => (
        <>
          <Chairs from={L1} to={L1} appear={seg(t, 0, 0.8) * 13} />
          <Label x={200} y={200} size={20} show={seg(t, 0.8, 1)}>12 chairs</Label>
        </>
      ) },
    { caption: 'We can put them in 2 rows of 6.', duration: 3500,
      draw: (t) => (
        <>
          <Chairs from={L1} to={L2} p={ease(seg(t, 0.1, 0.7))} />
          <Label x={200} y={210} size={20} show={seg(t, 0.7, 1)}>2 rows × 6 = 12</Label>
        </>
      ) },
    { caption: 'Or 3 rows of 4. No chair is left over!', duration: 3500,
      draw: (t) => (
        <>
          <Chairs from={L2} to={L3} p={ease(seg(t, 0.1, 0.7))} />
          <Label x={200} y={215} size={20} show={seg(t, 0.7, 1)}>3 rows × 4 = 12</Label>
        </>
      ) },
    { caption: '1, 2, 3, 4, 6 and 12 make neat rows. They are the factors of 12.', duration: 4500,
      draw: (t) => (
        <>
          <Chairs from={L3} to={L3.map((c) => ({ x: c.x, y: c.y - 25 }))} p={ease(seg(t, 0, 0.3))} />
          {[1, 2, 3, 4, 6, 12].map((n, k) => (
            <g key={n} transform={`translate(${75 + k * 50} 205) scale(${Math.max(pop(seg(t, 0.3 + k * 0.1, 0.45 + k * 0.1)), 0.001)})`}>
              <circle r="19" fill={C.soft} stroke={C.primary} strokeWidth="2.5" />
              <Label x={0} y={1} size={16} color={C.primary}>{n}</Label>
            </g>
          ))}
        </>
      ) },
  ],
}

// ------------------------------------------------------------------ place value: houses on a street

const HOUSES = [
  { name: 'Thousands', digit: '4', value: '4,000' },
  { name: 'Hundreds', digit: '5', value: '500' },
  { name: 'Tens', digit: '8', value: '80' },
  { name: 'Ones', digit: '2', value: '2' },
].map((h, k) => ({ ...h, x: 65 + k * 90 }))

function House({ x, scale = 1, name }) {
  return (
    <g transform={`translate(${x} 150) scale(${Math.max(scale, 0.001)})`}>
      <path d="M-38,-30 L0,-62 L38,-30 Z" fill="#ff8787" />
      <rect x="-32" y="-30" width="64" height="58" rx="4" fill="#fff4e6" stroke={C.crust} strokeWidth="2.5" />
      <Label x={0} y={42} size={12} color={C.muted}>{name}</Label>
    </g>
  )
}

const placeValue = {
  title: 'Digits live in houses',
  frames: [
    { caption: 'Each place is a house: Thousands, Hundreds, Tens and Ones.', duration: 3500,
      draw: (t) => HOUSES.map((h, k) => <House key={k} x={h.x} name={h.name} scale={pop(seg(t, k * 0.2, k * 0.2 + 0.35))} />) },
    { caption: 'The number 4,582 moves in. Each digit goes to its own house.', duration: 4500,
      draw: (t) => (
        <>
          {HOUSES.map((h, k) => <House key={k} x={h.x} name={h.name} />)}
          {HOUSES.map((h, k) => {
            const p = ease(seg(t, 0.1 + k * 0.17, 0.4 + k * 0.17))
            return <Label key={k} x={lerp(170 + k * 20, h.x, p)} y={lerp(28, 148, p)} size={lerp(28, 34, p)} color={C.primary}>{h.digit}</Label>
          })}
        </>
      ) },
    { caption: 'A digit is worth more in a house further to the left. The 5 is really 500!', duration: 4500,
      draw: (t) => (
        <>
          {HOUSES.map((h, k) => <House key={k} x={h.x} name={h.name} />)}
          {HOUSES.map((h, k) => <Label key={k} x={h.x} y={148} size={34} color={C.primary}>{h.digit}</Label>)}
          {HOUSES.map((h, k) => (
            <Label key={k} x={h.x} y={60 - 6 * pop(seg(t, k * 0.2, k * 0.2 + 0.3))} size={k === 1 ? 20 : 16}
                   color={k === 1 ? C.orange : C.ink} show={seg(t, k * 0.2, k * 0.2 + 0.25)}>{h.value}</Label>
          ))}
        </>
      ) },
    { caption: '4,000 + 500 + 80 + 2 = 4,582', duration: 4000,
      draw: (t) => (
        <>
          {HOUSES.map((h, k) => <House key={k} x={h.x} name={h.name} />)}
          {HOUSES.map((h, k) => <Label key={k} x={h.x} y={148} size={34} color={C.primary}>{h.digit}</Label>)}
          {HOUSES.map((h, k) => <Label key={k} x={h.x} y={54} size={16}>{h.value}</Label>)}
          <Label x={200} y={232} size={20} color={C.green} show={seg(t, 0.2, 0.6)}>4,000 + 500 + 80 + 2 = 4,582</Label>
        </>
      ) },
  ],
}

// ------------------------------------------------------------------ integers: a lift in a building

const floorY = (f) => 224 - (f + 3) * 19
function Building({ show = 1, colour = false }) {
  return (
    <g>
      {Array.from({ length: 11 }, (_, i) => {
        const f = i - 3
        const fill = !colour ? '#f1f3f5' : f > 0 ? '#d3f9d8' : f < 0 ? '#d0ebff' : '#ffe8cc'
        return (
          <g key={f} opacity={clamp(show * 11 - i)}>
            <rect x="110" y={floorY(f) - 9} width="110" height="18" fill={fill} stroke="#ced4da" />
            <Label x={92} y={floorY(f)} size={13} color={f === 0 ? C.orange : C.muted}>{f > 0 && colour ? `+${f}` : f}</Label>
          </g>
        )
      })}
    </g>
  )
}
const Lift = ({ floor }) => (
  <g transform={`translate(0 ${floorY(floor)})`}>
    <rect x="148" y="-9" width="34" height="18" rx="3" fill={C.primary} />
    <Emoji x={165} y={0} size={13}>🧍</Emoji>
  </g>
)
const liftFrame = (from, to, sum) => (t) => {
  const f = lerp(from, to, ease(seg(t, 0.15, 0.75)))
  return (
    <>
      <Building colour />
      <Lift floor={f} />
      <Label x={315} y={70} size={16} color={C.muted}>Floor {Math.round(f)}</Label>
      <Label x={315} y={130} size={24} color={C.primary} show={seg(t, 0.75, 0.95)}>{sum}</Label>
    </>
  )
}

const integer = {
  title: 'A lift in a tall building',
  frames: [
    { caption: 'This is a building. Floor 0 is the ground floor.', duration: 3500,
      draw: (t) => (
        <>
          <Building show={seg(t, 0, 0.7)} />
          <Label x={315} y={floorY(0)} size={15} color={C.orange} show={seg(t, 0.7, 1)}>← ground (0)</Label>
        </>
      ) },
    { caption: 'Going up is positive. Going down to the basement is negative.', duration: 4000,
      draw: (t) => (
        <>
          <Building colour />
          <Arrow x1={300} y1={150} x2={300} y2={55} progress={ease(seg(t, 0.1, 0.45))} color={C.green} />
          <Label x={345} y={90} size={14} color={C.green} show={seg(t, 0.3, 0.5)}>up = +</Label>
          <Arrow x1={300} y1={178} x2={300} y2={228} progress={ease(seg(t, 0.55, 0.85))} color={C.blue} />
          <Label x={345} y={205} size={14} color={C.blue} show={seg(t, 0.7, 0.9)}>down = −</Label>
        </>
      ) },
    { caption: 'Start on floor 7. Go down 3 floors. You are on floor 4.', duration: 4500, draw: liftFrame(7, 4, '7 − 3 = 4') },
    { caption: 'Start on floor 2. Go down 4 floors. You are in basement −2.', duration: 4500, draw: liftFrame(2, -2, '2 − 4 = −2') },
  ],
}

// ------------------------------------------------------------------ equations: a balance scale

function Scale({ angle = 0, left = [], right = [], show = 1 }) {
  const cx = 200, cy = 95, half = 125
  const ends = [-1, 1].map((s) => ({ x: cx + s * half * Math.cos(rad(angle)), y: cy + s * half * Math.sin(rad(angle)) }))
  const pan = (end, items) => (
    <g>
      <line x1={end.x} y1={end.y} x2={end.x} y2={end.y + 55} stroke={C.muted} strokeWidth="2" />
      <path d={`M${end.x - 48},${end.y + 55} Q${end.x},${end.y + 75} ${end.x + 48},${end.y + 55} Z`} fill="#dee2e6" stroke={C.muted} strokeWidth="2" />
      {items.map((it, k) => (
        <g key={k} opacity={it.opacity ?? 1} transform={`translate(${end.x - 34 + k * 19} ${end.y + 34 + (it.dy ?? 0)})`}>
          {it.box
            ? <><rect x="-2" y="-12" width="30" height="30" rx="4" fill={C.primary} /><Label x={13} y={3} size={16} color="#fff">{it.label ?? 'x'}</Label></>
            : <rect x="0" y="0" width="17" height="17" rx="3" fill={C.orange} />}
        </g>
      ))}
    </g>
  )
  return (
    <g opacity={show}>
      <path d="M200,95 L170,215 L230,215 Z" fill="#adb5bd" />
      <line x1={ends[0].x} y1={ends[0].y} x2={ends[1].x} y2={ends[1].y} stroke={C.ink} strokeWidth="6" strokeLinecap="round" />
      <circle cx={cx} cy={cy} r="7" fill={C.ink} />
      {pan(ends[0], left)}
      {pan(ends[1], right)}
    </g>
  )
}
const blocks = (n, extra = {}) => Array.from({ length: n }, () => ({ ...extra }))
const dropped = (t, k, n) => ({ dy: -60 * (1 - ease(seg(t, k / n, (k + 0.8) / n))), opacity: seg(t, k / n, (k + 0.3) / n) })

const equation = {
  title: 'A balance scale',
  frames: [
    { caption: 'An equation is like a balance. When both sides weigh the same, it stays level.', duration: 3500,
      draw: (t) => <Scale show={seg(t, 0, 0.5)} /> },
    { caption: 'On the left: a mystery box x and 2 blocks. On the right: 5 blocks.', duration: 5000,
      draw: (t) => {
        const order = [['L', 0], ['L', 1], ['L', 2], ['R', 0], ['R', 1], ['R', 2], ['R', 3], ['R', 4]]
        const left = [], right = []
        let weight = 0
        order.forEach(([side, k], i) => {
          const it = { ...(side === 'L' && k === 0 ? { box: true } : {}), ...dropped(t, i, order.length) }
          ;(side === 'L' ? left : right).push(it)
          const landed = seg(t, i / order.length, (i + 0.8) / order.length) >= 1
          if (landed) weight += (side === 'L' ? -1 : 1) * (k === 0 && side === 'L' ? 3 : 1)
        })
        return <Scale angle={clamp(weight * 3, -12, 12)} left={left} right={right} />
      } },
    { caption: 'Take 2 blocks off one side and it tips! Take 2 off the other side too, and it is level again.', duration: 6000,
      draw: (t) => {
        const goneL = seg(t, 0.05, 0.3), goneR = seg(t, 0.55, 0.8)
        const angle = lerp(0, 8, ease(seg(t, 0.25, 0.4))) * (1 - ease(seg(t, 0.75, 0.9)))
        const left = [{ box: true }, ...blocks(2, { opacity: 1 - goneL, dy: -40 * goneL })]
        const right = [...blocks(3), ...blocks(2, { opacity: 1 - goneR, dy: -40 * goneR })]
        return (
          <>
            <Scale angle={angle} left={left} right={right} />
            <Label x={200} y={240} size={18} color={C.primary} show={seg(t, 0.85, 1)}>x + 2 − 2 = 5 − 2</Label>
          </>
        )
      } },
    { caption: 'Now the box balances 3 blocks. So x = 3!', duration: 4000,
      draw: (t) => (
        <>
          <Scale left={[{ box: true, label: t > 0.4 ? '3' : 'x' }]} right={blocks(3)} />
          <Label x={200} y={240} size={24} color={C.green} show={seg(t, 0.4, 0.7)}>x = 3 ✓</Label>
        </>
      ) },
  ],
}

// ------------------------------------------------------------------ angles: clock hands

function Clock({ angle = 0, show = 1, square = false }) {
  const cx = 200, cy = 125, r = 90
  const hand = (a, len, colour) => (
    <line x1={cx} y1={cy} x2={cx + len * Math.sin(rad(a))} y2={cy - len * Math.cos(rad(a))} stroke={colour} strokeWidth="6" strokeLinecap="round" />
  )
  return (
    <g opacity={show}>
      <circle cx={cx} cy={cy} r={r} fill="#fff" stroke="#ced4da" strokeWidth="4" />
      {Array.from({ length: 12 }, (_, k) => (
        <circle key={k} cx={cx + (r - 12) * Math.sin(rad(k * 30))} cy={cy - (r - 12) * Math.cos(rad(k * 30))} r="3" fill="#adb5bd" />
      ))}
      {angle > 0.5 && (angle >= 359.5
        ? <circle cx={cx} cy={cy} r="42" fill="#ffd8a8" opacity="0.8" />
        : <path d={wedge(cx, cy, 42, 0, angle)} fill="#ffd8a8" opacity="0.8" />)}
      {square && <path d={`M${cx},${cy - 18} L${cx + 18},${cy - 18} L${cx + 18},${cy}`} fill="none" stroke={C.orange} strokeWidth="3" />}
      {hand(0, 72, C.ink)}
      {hand(angle, 72, C.primary)}
      <circle cx={cx} cy={cy} r="7" fill={C.ink} />
      <Label x={335} y={125} size={30} color={C.orange}>{Math.round(angle)}°</Label>
    </g>
  )
}
const turn = (from, to, label, square) => (t) => {
  const a = lerp(from, to, ease(seg(t, 0.1, 0.7)))
  return (
    <>
      <Clock angle={a} square={square && t > 0.7} />
      <Label x={200} y={240} size={17} color={C.primary} show={seg(t, 0.7, 0.9)}>{label}</Label>
    </>
  )
}

const angle = {
  title: 'Clock hands opening',
  frames: [
    { caption: 'Two clock hands start together. The angle between them is 0°.', duration: 3000,
      draw: (t) => <Clock show={seg(t, 0, 0.5)} /> },
    { caption: 'One hand turns. The opening gets bigger. A quarter turn is a right angle: 90°, like the corner of a book.', duration: 4500,
      draw: turn(0, 90, 'Right angle = 90° 📕', true) },
    { caption: 'Keep turning until the hands make a straight line: 180°.', duration: 4000, draw: turn(90, 180, 'Straight line = 180°') },
    { caption: 'All the way round is a full turn: 360°.', duration: 4500, draw: turn(180, 360, 'Full turn = 360° 🔄') },
  ],
}

// ------------------------------------------------------------------ perimeter & area: a garden

const G = { x: 100, y: 60, cell: 40, cols: 5, rows: 3 }
const Garden = ({ show = 1 }) => (
  <rect x={G.x} y={G.y} width={G.cols * G.cell} height={G.rows * G.cell} fill="#d3f9d8" stroke={C.green} strokeWidth="3" opacity={show} />
)
/** Point d units along the edge, clockwise from the top-left corner. */
function edgePoint(d) {
  const { x, y, cell, cols, rows } = G
  if (d <= cols) return [x + d * cell, y]
  if (d <= cols + rows) return [x + cols * cell, y + (d - cols) * cell]
  if (d <= 2 * cols + rows) return [x + cols * cell - (d - cols - rows) * cell, y + rows * cell]
  return [x, y + rows * cell - (d - 2 * cols - rows) * cell]
}
const corners = [0, 5, 8, 13, 16]
function Trail({ d }) {
  const pts = [...corners.filter((c) => c < d), d].map(edgePoint)
  return <polyline points={pts.map((p) => p.join(',')).join(' ')} fill="none" stroke={C.orange} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
}
const Tiles = ({ n }) => Array.from({ length: 15 }, (_, k) => (
  <g key={k} opacity={clamp(n - k)}>
    <rect x={G.x + (k % 5) * G.cell + 3} y={G.y + Math.floor(k / 5) * G.cell + 3} width={G.cell - 6} height={G.cell - 6} rx="4" fill="#a5d8ff" stroke={C.blue} />
    <Label x={G.x + (k % 5) * G.cell + G.cell / 2} y={G.y + Math.floor(k / 5) * G.cell + G.cell / 2} size={13} color={C.blue}>{k + 1}</Label>
  </g>
))

const areaPerimeter = {
  title: 'An ant and a tiled garden',
  frames: [
    { caption: 'Here is a garden. It is 5 steps long and 3 steps wide.', duration: 3000,
      draw: (t) => (
        <>
          <Garden show={seg(t, 0, 0.5)} />
          <Label x={200} y={45} size={14} color={C.muted} show={seg(t, 0.5, 0.8)}>5</Label>
          <Label x={315} y={120} size={14} color={C.muted} show={seg(t, 0.5, 0.8)}>3</Label>
        </>
      ) },
    { caption: 'An ant walks all the way around the edge. That distance is the perimeter.', duration: 6000,
      draw: (t) => {
        const d = 16 * seg(t, 0.05, 0.9)
        const [ax, ay] = edgePoint(d)
        return (
          <>
            <Garden />
            <Trail d={d} />
            <Emoji x={ax} y={ay} size={22}>🐜</Emoji>
            <Label x={200} y={225} size={18} color={C.orange}>Walked: {Math.floor(d)} steps</Label>
          </>
        )
      } },
    { caption: 'Now we cover the garden with square tiles. The number of tiles is the area.', duration: 5500,
      draw: (t) => {
        const n = seg(t, 0.05, 0.9) * 15
        return (
          <>
            <Garden />
            <Tiles n={n} />
            <Label x={200} y={225} size={18} color={C.blue}>Tiles: {Math.min(15, Math.floor(n + 0.001))}</Label>
          </>
        )
      } },
    { caption: 'Perimeter goes around the edge: 16. Area fills the inside: 15 squares.', duration: 4500,
      draw: (t) => (
        <>
          <Garden />
          <Tiles n={15} />
          <Trail d={16} />
          <Label x={200} y={215} size={16} color={C.orange} show={seg(t, 0.1, 0.4)}>Perimeter = 5 + 3 + 5 + 3 = 16</Label>
          <Label x={200} y={240} size={16} color={C.blue} show={seg(t, 0.5, 0.8)}>Area = 5 × 3 = 15 squares</Label>
        </>
      ) },
  ],
}

// ------------------------------------------------------------------ photosynthesis: a leaf kitchen

const LEAF = 'M130,150 Q230,40 330,150 Q230,250 130,150 Z'
export function Sun({ x = 55, y = 50, ms = 0, show = 1 }) {
  return (
    <g opacity={show} transform={`translate(${x} ${y})`}>
      {Array.from({ length: 8 }, (_, k) => {
        const a = rad(k * 45 + ms / 40)
        return <line key={k} x1={30 * Math.cos(a)} y1={30 * Math.sin(a)} x2={40 * Math.cos(a)} y2={40 * Math.sin(a)} stroke={C.yellow} strokeWidth="4" strokeLinecap="round" />
      })}
      <circle r="24" fill={C.yellow} />
    </g>
  )
}
export const loop = (ms, period, offset = 0) => (((ms + offset) % period) + period) % period / period

function LeafKitchen({ t, ms, stage }) {
  return (
    <>
      <g transform={`translate(230 150) scale(${stage === 0 ? Math.max(pop(seg(t, 0, 0.5)), 0.001) : 1}) translate(-230 -150)`}>
        <path d={LEAF} fill={C.leaf} stroke={C.green} strokeWidth="3" />
        <path d="M140,150 Q230,145 320,150" stroke={C.green} strokeWidth="2" fill="none" />
      </g>
      {stage >= 1 && (
        <>
          <Sun ms={ms} show={stage === 1 ? seg(t, 0, 0.3) : 1} />
          {[0, 1, 2].map((k) => (
            <line key={k} x1={85} y1={70 + k * 12} x2={175} y2={115 + k * 12} stroke={C.yellow} strokeWidth="4"
                  strokeDasharray="10 10" strokeDashoffset={-ms / 15} opacity={stage === 1 ? seg(t, 0.2, 0.5) : 1} />
          ))}
        </>
      )}
      {stage >= 2 && [0, 1, 2].map((k) => {
        const p = loop(ms, 2400, k * 800)
        return (
          <g key={k}>
            <Emoji x={230} y={lerp(255, 175, p)} size={16} opacity={1 - p * 0.6}>💧</Emoji>
            <Label x={lerp(395, 315, p)} y={110 + k * 14} size={12} color={C.muted} show={1 - p * 0.6}>CO₂</Label>
          </g>
        )
      })}
      {stage >= 3 && (
        <>
          <Emoji x={230} y={150} size={34} scale={pop(seg(t, 0, 0.4))}>🍬</Emoji>
          {[0, 1, 2].map((k) => {
            const p = loop(ms, 2600, k * 870)
            return <Label key={k} x={250 + k * 25} y={lerp(100, 10, p)} size={13} color={C.blue} show={(1 - p) * seg(t, 0.3, 0.6)}>O₂</Label>
          })}
        </>
      )}
    </>
  )
}

const photosynthesis = {
  title: 'A leaf is a tiny kitchen',
  frames: [
    { caption: 'Every leaf is like a tiny kitchen. 🍃', duration: 3000, draw: (t, ms) => <LeafKitchen t={t} ms={ms} stage={0} /> },
    { caption: 'Sunlight is the stove. It gives the energy to cook. ☀️', duration: 4000, draw: (t, ms) => <LeafKitchen t={t} ms={ms} stage={1} /> },
    { caption: 'The ingredients: water comes up from the roots, and carbon dioxide comes in from the air.', duration: 5000,
      draw: (t, ms) => <LeafKitchen t={t} ms={ms} stage={2} /> },
    { caption: 'The leaf cooks food (sugar) and lets oxygen out into the air for us to breathe.', duration: 5000,
      draw: (t, ms) => <LeafKitchen t={t} ms={ms} stage={3} /> },
  ],
}

// ------------------------------------------------------------------ electric circuit: water in pipes

const LOOP = { x0: 80, y0: 60, x1: 320, y1: 200 }
const loopLen = 2 * (LOOP.x1 - LOOP.x0 + LOOP.y1 - LOOP.y0)
function loopPoint(u) {
  const { x0, y0, x1, y1 } = LOOP, w = x1 - x0, h = y1 - y0
  let d = (((u % 1) + 1) % 1) * loopLen
  if (d < w) return [x0 + d, y0]
  d -= w
  if (d < h) return [x1, y0 + d]
  d -= h
  if (d < w) return [x1 - d, y1]
  d -= w
  return [x0, y1 - d]
}
function Circuit({ flow, glow, open = 0, build = 1 }) {
  const { x0, y0, x1, y1 } = LOOP
  return (
    <>
      <rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} fill="none" stroke={C.muted} strokeWidth="5"
            strokeDasharray={loopLen} strokeDashoffset={loopLen * (1 - build)} />
      <rect x="185" y="193" width="30" height="14" fill="#fff" />
      <line x1="185" y1="200" x2={185 + 32 * Math.cos(rad(-35 * open))} y2={200 + 32 * Math.sin(rad(-35 * open))} stroke={C.ink} strokeWidth="5" strokeLinecap="round" />
      <circle cx="185" cy="200" r="4" fill={C.ink} />
      <circle cx="217" cy="200" r="4" fill={C.ink} />
      {flow !== null && Array.from({ length: 18 }, (_, k) => {
        const [x, y] = loopPoint(k / 18 + flow)
        return <circle key={k} cx={x} cy={y} r="4" fill={C.blue} />
      })}
      <g opacity={build}>
        <rect x="66" y="105" width="28" height="50" rx="4" fill={C.ink} />
        <rect x="74" y="98" width="12" height="8" fill={C.ink} />
        <Label x={80} y={130} size={14} color="#fff">+</Label>
        <circle cx="200" cy="60" r={glow * 45} fill="url(#anim-glow)" />
        <circle cx="200" cy="60" r="17" fill={glow > 0.1 ? C.yellow : '#e9ecef'} stroke={C.muted} strokeWidth="3" />
      </g>
      <Label x={38} y={130} size={12} color={C.muted} show={build}>battery</Label>
      <Label x={200} y={25} size={12} color={C.muted} show={build}>bulb</Label>
      <Label x={200} y={228} size={12} color={C.muted} show={build}>switch</Label>
    </>
  )
}

const circuit = {
  title: 'Electricity flows like water',
  frames: [
    { caption: 'Here is a battery, some wires, a bulb and a switch.', duration: 3500,
      draw: (t) => <Circuit flow={null} glow={0} build={ease(seg(t, 0, 0.8))} /> },
    { caption: 'The battery pushes current around the wire, like a pump pushes water through pipes. The bulb lights up!', duration: 5000,
      draw: (t, ms) => <Circuit flow={ms / 6000} glow={seg(t, 0.2, 0.5)} /> },
    { caption: 'Open the switch: the path is broken. The flow stops and the bulb goes dark.', duration: 4500,
      draw: (t, ms) => {
        const stopAt = 0.3 * 4500
        return <Circuit flow={Math.min(ms, stopAt) / 6000} glow={1 - seg(t, 0.25, 0.45)} open={ease(seg(t, 0, 0.3))} />
      } },
    { caption: 'Close the switch again: the circle is complete, so the current flows and the bulb shines. 💡', duration: 4500,
      draw: (t, ms) => {
        const startAt = 0.3 * 4500
        return <Circuit flow={Math.max(0, ms - startAt) / 6000} glow={seg(t, 0.3, 0.5)} open={1 - ease(seg(t, 0, 0.3))} />
      } },
  ],
}

// ------------------------------------------------------------------ states of matter: particles

const BOX = [{ x: 20, name: 'Solid' }, { x: 145, name: 'Liquid' }, { x: 270, name: 'Gas' }]
const BW = 110, BY = 55, BH = 140
function Particles({ kind, ms }) {
  const b = BOX[kind]
  if (kind === 0) {
    return Array.from({ length: 16 }, (_, k) => (
      <circle key={k} cx={b.x + 22 + (k % 4) * 22 + 2 * Math.sin(ms / 70 + k)} cy={BY + BH - 80 + Math.floor(k / 4) * 20 + 2 * Math.cos(ms / 60 + k * 2)} r="9" fill={C.primary} />
    ))
  }
  if (kind === 1) {
    return Array.from({ length: 14 }, (_, k) => (
      <circle key={k} cx={b.x + 14 + reflect((k % 5) * 20 + ms / 25 * (k % 2 ? 1 : -0.7), 0, BW - 28)}
              cy={BY + BH - 14 - Math.floor(k / 5) * 18 - 3 * Math.sin(ms / 300 + k)} r="9" fill={C.blue} />
    ))
  }
  return Array.from({ length: 7 }, (_, k) => (
    <circle key={k} cx={b.x + 10 + reflect(k * 31 + ms / 9 * (1 + (k % 3) * 0.3), 0, BW - 20)}
            cy={BY + 10 + reflect(k * 47 + ms / 11 * (1 + (k % 2) * 0.4), 0, BH - 20)} r="9" fill={C.orange} />
  ))
}
const matterFrame = (shown) => (t, ms) => (
  <>
    {BOX.map((b, k) => (
      <g key={k} opacity={shown.includes(k) ? 1 : 0.25}>
        <rect x={b.x} y={BY} width={BW} height={BH} rx="8" fill="#f8f9fa" stroke="#adb5bd" strokeWidth="2" />
        <Label x={b.x + BW / 2} y={BY + BH + 22} size={16}>{b.name}</Label>
      </g>
    ))}
    {shown.map((k) => <g key={k} opacity={seg(t, 0, 0.3)}><Particles kind={k} ms={ms} /></g>)}
  </>
)

const matter = {
  title: 'Tiny particles moving',
  frames: [
    { caption: 'In a solid, the particles are packed tightly together. They only wiggle in their places.', duration: 4500, draw: matterFrame([0]) },
    { caption: 'In a liquid, the particles stay close but slide past each other. That is why liquids can be poured.', duration: 4500, draw: matterFrame([1]) },
    { caption: 'In a gas, the particles fly all over the place, far apart.', duration: 4500, draw: matterFrame([2]) },
    { caption: 'Solid, liquid and gas: the same particles, moving in different ways.', duration: 4500, draw: matterFrame([0, 1, 2]) },
  ],
}

// ------------------------------------------------------------------ the water cycle

export function Cloud({ x, y, scale }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${Math.max(scale, 0.001)})`}>
      {[[-30, 6, 22], [0, -6, 28], [30, 6, 22], [0, 12, 24]].map(([cx, cy, r], k) => <circle key={k} cx={cx} cy={cy} r={r} fill="#f1f3f5" stroke="#ced4da" />)}
    </g>
  )
}
function WaterCycle({ t, ms, stage }) {
  const wave = `M0,205 ${Array.from({ length: 8 }, (_, k) => `Q${k * 50 + 25},${205 + 6 * Math.sin(ms / 400 + k)} ${k * 50 + 50},205`).join(' ')} L400,260 L0,260 Z`
  return (
    <>
      <rect x="0" y="0" width="400" height="260" fill={C.sky} opacity="0.5" />
      <Sun x={60} y={50} ms={ms} show={stage === 0 ? seg(t, 0, 0.4) : 1} />
      <path d={wave} fill={C.blue} opacity={stage === 0 ? seg(t, 0.2, 0.6) : 1} />
      {stage >= 1 && Array.from({ length: 6 }, (_, k) => {
        const p = loop(ms, 3000, k * 500)
        return <circle key={k} cx={130 + k * 22 + 8 * Math.sin(ms / 300 + k)} cy={lerp(195, 85, p)} r="5" fill="#fff" stroke={C.blue}
                       opacity={(1 - p) * (stage === 1 ? seg(t, 0, 0.3) : 1)} />
      })}
      {stage >= 2 && <Cloud x={270} y={65} scale={stage === 2 ? pop(seg(t, 0.1, 0.7)) : 1} />}
      {stage >= 3 && Array.from({ length: 8 }, (_, k) => {
        const p = loop(ms, 1200, k * 150)
        return <line key={k} x1={240 + (k % 4) * 20} y1={lerp(95, 200, p)} x2={238 + (k % 4) * 20} y2={lerp(95, 200, p) + 10} stroke={C.blue} strokeWidth="3" strokeLinecap="round" />
      })}
      {stage >= 1 && <Label x={95} y={130} size={13} color={C.ink}>evaporation ↑</Label>}
      {stage >= 2 && <Label x={345} y={30} size={13} color={C.ink} show={stage === 2 ? seg(t, 0.6, 0.9) : 1}>condensation</Label>}
      {stage >= 3 && <Label x={345} y={150} size={13} color={C.ink} show={seg(t, 0.3, 0.6)}>rain ↓</Label>}
    </>
  )
}

const waterCycle = {
  title: 'The journey of water',
  frames: [
    { caption: 'The sun warms the water in the sea, rivers and puddles. ☀️', duration: 3500, draw: (t, ms) => <WaterCycle t={t} ms={ms} stage={0} /> },
    { caption: 'The water turns into invisible vapour and rises into the sky. This is evaporation.', duration: 4500, draw: (t, ms) => <WaterCycle t={t} ms={ms} stage={1} /> },
    { caption: 'High up, the vapour cools and makes clouds. This is condensation.', duration: 4500, draw: (t, ms) => <WaterCycle t={t} ms={ms} stage={2} /> },
    { caption: 'The water falls back down as rain, and the journey starts again. 🌧️', duration: 5000, draw: (t, ms) => <WaterCycle t={t} ms={ms} stage={3} /> },
  ],
}

// ------------------------------------------------------------------ food chain: a relay race of energy

const CHAIN = [{ e: '🌱', name: 'Grass' }, { e: '🦗', name: 'Grasshopper' }, { e: '🐸', name: 'Frog' }, { e: '🐍', name: 'Snake' }]
  .map((c, k) => ({ ...c, x: 55 + k * 97 }))
const chainFrame = (upTo) => (t) => (
  <>
    <Emoji x={55} y={45} size={32}>☀️</Emoji>
    <Arrow x1={55} y1={68} x2={55} y2={102} progress={upTo === 0 ? ease(seg(t, 0.2, 0.5)) : 1} dashed />
    {CHAIN.map((c, k) => k <= upTo && (
      <g key={k}>
        <Emoji x={c.x} y={140} size={44} scale={k === upTo ? pop(seg(t, 0, 0.35)) : 1}>{c.e}</Emoji>
        <Label x={c.x} y={185} size={13} color={C.muted}>{c.name}</Label>
        {k > 0 && <Arrow x1={CHAIN[k - 1].x + 28} y1={140} x2={c.x - 30} y2={140} progress={k === upTo ? ease(seg(t, 0.2, 0.5)) : 1} />}
      </g>
    ))}
    <Emoji x={upTo === 0 ? 55 : lerp(CHAIN[upTo - 1].x, CHAIN[upTo].x, ease(seg(t, 0.45, 0.85)))} y={100} size={22}>⚡</Emoji>
    <Label x={200} y={228} size={14} color={C.orange} show={seg(t, 0.6, 0.9)}>energy is passed along ⚡</Label>
  </>
)

const foodChain = {
  title: 'Who eats whom',
  frames: [
    { caption: 'Plants make their own food using sunlight. 🌱', duration: 3500, draw: chainFrame(0) },
    { caption: 'A grasshopper eats the grass. The energy passes to the grasshopper.', duration: 3500, draw: chainFrame(1) },
    { caption: 'A frog eats the grasshopper.', duration: 3500, draw: chainFrame(2) },
    { caption: 'A snake eats the frog. Energy is passed along the chain, like a baton in a relay race.', duration: 4500, draw: chainFrame(3) },
  ],
}

// ------------------------------------------------------------------ democracy: a class vote

const VOTES = ['A', 'B', 'A', 'B', 'A']
const VoteScene = ({ t, stage }) => {
  const counted = stage >= 2 ? (stage === 2 ? ease(seg(t, 0.1, 0.8)) : 1) : 0
  const a = 3 * counted, b = 2 * counted
  return (
    <>
      <Emoji x={110} y={45} size={34}>🙋‍♀️</Emoji>
      <Label x={110} y={78} size={14}>Candidate A</Label>
      <Emoji x={290} y={45} size={34}>🙋‍♂️</Emoji>
      <Label x={290} y={78} size={14}>Candidate B</Label>
      {stage >= 1 && VOTES.map((v, k) => {
        const p = stage === 1 ? ease(seg(t, k * 0.17, k * 0.17 + 0.2)) : 1
        return (
          <g key={k}>
            <Emoji x={80 + k * 60} y={120} size={26}>🧒</Emoji>
            {p < 1 && <Emoji x={lerp(80 + k * 60, 200, p)} y={lerp(140, 200, p)} size={18}>📄</Emoji>}
          </g>
        )
      })}
      {stage < 2 && stage >= 1 && <Emoji x={200} y={210} size={44}>🗳️</Emoji>}
      {stage >= 2 && (
        <>
          <rect x="70" y={240 - a * 22} width="80" height={a * 22} fill={C.primary} rx="4" />
          <rect x="250" y={240 - b * 22} width="80" height={b * 22} fill={C.orange} rx="4" />
          <Label x={110} y={228 - a * 22} size={16}>{Math.round(a)}</Label>
          <Label x={290} y={228 - b * 22} size={16}>{Math.round(b)}</Label>
        </>
      )}
      {stage >= 3 && <Emoji x={110} y={16} size={24} scale={pop(seg(t, 0.2, 0.5))}>👑</Emoji>}
    </>
  )
}

const vote = {
  title: 'Choosing a class monitor',
  frames: [
    { caption: 'Your class wants to choose a class monitor. There are two candidates.', duration: 3000, draw: (t) => <VoteScene t={t} stage={0} /> },
    { caption: 'Everyone gets one vote. Each student puts their vote in the box.', duration: 5000, draw: (t) => <VoteScene t={t} stage={1} /> },
    { caption: 'Now we count the votes. A has 3 votes. B has 2 votes.', duration: 4000, draw: (t) => <VoteScene t={t} stage={2} /> },
    { caption: 'The person with the most votes wins. A democracy chooses its leaders the same way! 🎉', duration: 4000, draw: (t) => <VoteScene t={t} stage={3} /> },
  ],
}

export const SCENES = {
  fraction, factor, 'place-value': placeValue, integer, equation, angle, 'area-perimeter': areaPerimeter,
  photosynthesis, circuit, matter, 'water-cycle': waterCycle, 'food-chain': foodChain, vote,
}
