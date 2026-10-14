/** Mathematics scenes. Same contract as scenes.jsx: frames of { caption, duration, draw(t, ms) } on a 400 × 260 stage. */
import { C, Emoji, Label, clamp, ease, lerp, pop, rad, seg } from './scenes.jsx'

const sc = (s) => Math.max(s, 0.001)

// ------------------------------------------------------------------ factor tree

const T = {
  root: { x: 200, y: 34, v: '60' }, a: { x: 130, y: 100, v: '6' }, b: { x: 270, y: 100, v: '10' },
  a1: { x: 95, y: 166, v: '2', prime: true }, a2: { x: 165, y: 166, v: '3', prime: true },
  b1: { x: 235, y: 166, v: '2', prime: true }, b2: { x: 305, y: 166, v: '5', prime: true },
}
function TNode({ n, s = 1, glow = 0 }) {
  const prime = n.prime && glow > 0
  return (
    <g transform={`translate(${n.x} ${n.y}) scale(${sc(s)})`}>
      {prime && <circle r={20 + 7 * glow} fill={C.green} opacity={0.25 * glow} />}
      <circle r="20" fill={prime ? '#d3f9d8' : C.soft} stroke={prime ? C.green : C.primary} strokeWidth="3" />
      <Label x={0} y={1} size={17} color={prime ? C.green : C.primary}>{n.v}</Label>
    </g>
  )
}
const Branch = ({ from, to, p = 1 }) => p > 0 && (
  <line x1={from.x} y1={from.y + 20} x2={lerp(from.x, to.x, p)} y2={lerp(from.y + 20, to.y - 20, p)} stroke={C.muted} strokeWidth="3" strokeLinecap="round" />
)

const factorTree = {
  title: 'Breaking a number into primes',
  frames: [
    { caption: "Let's break 60 into smaller pieces, like breaking a chocolate bar into squares.", duration: 2500,
      draw: (t) => <TNode n={T.root} s={pop(seg(t, 0, 0.5))} /> },
    { caption: '60 = 6 × 10. The number splits into two branches.', duration: 3500,
      draw: (t) => (
        <>
          <Branch from={T.root} to={T.a} p={ease(seg(t, 0.1, 0.45))} /><Branch from={T.root} to={T.b} p={ease(seg(t, 0.1, 0.45))} />
          <TNode n={T.root} /><TNode n={T.a} s={pop(seg(t, 0.45, 0.7))} /><TNode n={T.b} s={pop(seg(t, 0.5, 0.75))} />
          <Label x={340} y={34} size={16} show={seg(t, 0.75, 0.95)}>60 = 6 × 10</Label>
        </>
      ) },
    { caption: '6 = 2 × 3 and 10 = 2 × 5. Prime numbers cannot be split any more, so they glow!', duration: 4500,
      draw: (t) => (
        <>
          {[['root', 'a'], ['root', 'b']].map(([f, to]) => <Branch key={to} from={T[f]} to={T[to]} />)}
          {[['a', 'a1'], ['a', 'a2'], ['b', 'b1'], ['b', 'b2']].map(([f, to], k) => <Branch key={to} from={T[f]} to={T[to]} p={ease(seg(t, k * 0.1, k * 0.1 + 0.3))} />)}
          {['root', 'a', 'b'].map((k) => <TNode key={k} n={T[k]} />)}
          {['a1', 'a2', 'b1', 'b2'].map((k, i) => <TNode key={k} n={T[k]} s={pop(seg(t, 0.3 + i * 0.08, 0.5 + i * 0.08))} glow={seg(t, 0.75, 1) * (0.7 + 0.3 * Math.sin(t * 20))} />)}
        </>
      ) },
    { caption: 'So 60 = 2 × 2 × 3 × 5. Every number is built from prime numbers.', duration: 4000,
      draw: (t) => {
        const leaves = ['a1', 'b1', 'a2', 'b2'], p = ease(seg(t, 0.1, 0.6))
        return (
          <>
            <g opacity="0.3">
              {[['root', 'a'], ['root', 'b'], ['a', 'a1'], ['a', 'a2'], ['b', 'b1'], ['b', 'b2']].map(([f, to]) => <Branch key={to} from={T[f]} to={T[to]} />)}
              {['root', 'a', 'b'].map((k) => <TNode key={k} n={T[k]} />)}
            </g>
            {leaves.map((k, i) => <TNode key={k} n={{ ...T[k], x: lerp(T[k].x, 130 + i * 50, p), y: lerp(T[k].y, 222, p) }} glow={1} />)}
            {[0, 1, 2].map((i) => <Label key={i} x={155 + i * 50} y={222} size={16} show={seg(t, 0.6, 0.8)}>×</Label>)}
            <Label x={70} y={222} size={18} show={seg(t, 0.6, 0.8)}>60 =</Label>
          </>
        )
      } },
  ],
}

// ------------------------------------------------------------------ number line and √2

const NX = (n) => 200 + n * 55
function NumberLine({ draw = 1 }) {
  const end = lerp(25, 385, draw)
  return (
    <>
      <line x1="25" y1="150" x2={end} y2="150" stroke={C.ink} strokeWidth="3" strokeLinecap="round" />
      {[-3, -2, -1, 0, 1, 2, 3].map((n) => NX(n) <= end && (
        <g key={n}>
          <line x1={NX(n)} y1="142" x2={NX(n)} y2="158" stroke={C.ink} strokeWidth="2" />
          <Label x={NX(n)} y={174} size={14} color={C.muted}>{n}</Label>
        </g>
      ))}
    </>
  )
}
const Pin = ({ x, label, color = C.primary, drop = 1 }) => (
  <g opacity={clamp(drop * 3)}>
    <circle cx={x} cy={lerp(50, 150, ease(drop))} r="7" fill={color} />
    <Label x={x} y={lerp(50, 150, ease(drop)) - 20} size={15} color={color}>{label}</Label>
  </g>
)
const DIAG = 55 * Math.SQRT2

const numberLine = {
  title: 'Every number has a home',
  frames: [
    { caption: 'This is the number line. Every number has its own place on it.', duration: 3500,
      draw: (t) => <NumberLine draw={ease(seg(t, 0, 0.8))} /> },
    { caption: 'Fractions like ½ live between the whole numbers.', duration: 3500,
      draw: (t) => (
        <>
          <NumberLine />
          <Pin x={NX(0.5)} label="½" drop={seg(t, 0.1, 0.5)} />
          <Pin x={NX(-1.5)} label="−1½" drop={seg(t, 0.45, 0.85)} color={C.orange} />
        </>
      ) },
    { caption: 'Some numbers, like √2, go on forever without repeating. They are irrational. Watch where √2 lives!', duration: 6000,
      draw: (t) => {
        const a = lerp(45, 0, ease(seg(t, 0.5, 0.85)))
        const ex = NX(0) + DIAG * Math.cos(rad(a)), ey = 150 - DIAG * Math.sin(rad(a))
        return (
          <>
            <NumberLine />
            <rect x={NX(0)} y={95} width="55" height="55" fill={C.soft} stroke={C.primary} strokeWidth="2" opacity={seg(t, 0, 0.2)} />
            <Label x={NX(0) + 27} y={84} size={12} color={C.muted} show={seg(t, 0, 0.2)}>side 1</Label>
            {t > 0.2 && <line x1={NX(0)} y1={150} x2={lerp(NX(0), NX(1), ease(seg(t, 0.2, 0.45)))} y2={lerp(150, 95, ease(seg(t, 0.2, 0.45)))} stroke={C.orange} strokeWidth="3" />}
            {t > 0.5 && (
              <>
                <path d={`M${NX(0) + DIAG * Math.cos(rad(45))},${150 - DIAG * Math.sin(rad(45))} A${DIAG},${DIAG} 0 0 1 ${ex},${ey}`} fill="none" stroke={C.orange} strokeWidth="2" strokeDasharray="5 5" />
                <line x1={NX(0)} y1={150} x2={ex} y2={ey} stroke={C.orange} strokeWidth="3" />
              </>
            )}
            {t > 0.85 && <Pin x={NX(Math.SQRT2)} label="√2 ≈ 1.414" color={C.orange} />}
          </>
        )
      } },
    { caption: 'Rational and irrational numbers together make the real numbers. The line has no gaps at all!', duration: 4500,
      draw: (t) => (
        <>
          <NumberLine />
          {Array.from({ length: 90 }, (_, k) => {
            const x = 30 + ((k * 137) % 350)
            return <circle key={k} cx={x} cy={150} r="2.5" fill={k % 3 ? C.primary : C.orange} opacity={clamp(t * 90 / 60 - k / 60)} />
          })}
          <Label x={200} y={60} size={20} color={C.green} show={seg(t, 0.6, 0.9)}>Real numbers ✨</Label>
          <Label x={110} y={215} size={13} color={C.primary} show={seg(t, 0.3, 0.6)}>rational: ½, −1½, 3</Label>
          <Label x={290} y={215} size={13} color={C.orange} show={seg(t, 0.4, 0.7)}>irrational: √2, π</Label>
        </>
      ) },
  ],
}

// ------------------------------------------------------------------ graphs of equations

const GP = (x, y) => [50 + x * 24, 225 - y * 24]
function Axes({ draw = 1, grid = 1 }) {
  return (
    <>
      {Array.from({ length: 14 }, (_, k) => <line key={`v${k}`} x1={50 + k * 24} y1={10} x2={50 + k * 24} y2={225} stroke="#e9ecef" opacity={grid} />)}
      {Array.from({ length: 9 }, (_, k) => <line key={`h${k}`} x1={50} y1={225 - k * 24} x2={385} y2={225 - k * 24} stroke="#e9ecef" opacity={grid} />)}
      <line x1="50" y1="225" x2={lerp(50, 385, draw)} y2="225" stroke={C.ink} strokeWidth="2.5" />
      <line x1="50" y1="225" x2="50" y2={lerp(225, 10, draw)} stroke={C.ink} strokeWidth="2.5" />
      <Label x={378} y={240} size={13} show={draw}>x</Label>
      <Label x={38} y={14} size={13} show={draw}>y</Label>
    </>
  )
}
const LINE_PTS = [[1, 2], [2, 3], [3, 4], [4, 5]]
const polyline = (f, x0, x1, p, n = 60) => Array.from({ length: n + 1 }, (_, k) => lerp(x0, lerp(x0, x1, p), k / n))
  .map((x) => GP(x, f(x)).join(',')).join(' ')

const graphLine = {
  title: 'Drawing an equation',
  frames: [
    { caption: 'Here is a grid with an x-axis going across and a y-axis going up.', duration: 3000,
      draw: (t) => <Axes draw={ease(seg(t, 0, 0.6))} grid={seg(t, 0.4, 1)} /> },
    { caption: 'Each answer of y = x + 1 is a point: (1, 2), (2, 3), (3, 4) and (4, 5).', duration: 4500,
      draw: (t) => (
        <>
          <Axes />
          {LINE_PTS.map(([x, y], k) => {
            const [px, py] = GP(x, y), s = pop(seg(t, k * 0.2, k * 0.2 + 0.25))
            return (
              <g key={k}>
                <line x1={px} y1={225} x2={px} y2={py} stroke={C.primary} strokeDasharray="3 3" opacity={s * 0.6} />
                <circle cx={px} cy={py} r={6 * s} fill={C.primary} />
                <Label x={px - 20} y={py - 14} size={11} color={C.primary} show={s}>({x}, {y})</Label>
              </g>
            )
          })}
        </>
      ) },
    { caption: 'Join the points and you get a straight line. That is why it is called a linear equation!', duration: 3500,
      draw: (t) => (
        <>
          <Axes />
          <polyline points={polyline((x) => x + 1, 0, 8, ease(seg(t, 0.05, 0.7)))} fill="none" stroke={C.primary} strokeWidth="4" strokeLinecap="round" />
          {LINE_PTS.map(([x, y], k) => <circle key={k} cx={GP(x, y)[0]} cy={GP(x, y)[1]} r="6" fill={C.primary} />)}
          <Label x={290} y={40} size={18} color={C.primary} show={seg(t, 0.7, 0.9)}>y = x + 1</Label>
        </>
      ) },
    { caption: 'An equation with x² makes a U-shaped curve called a parabola.', duration: 4500,
      draw: (t) => (
        <>
          <Axes />
          <polyline points={polyline((x) => x + 1, 0, 8, 1)} fill="none" stroke={C.primary} strokeWidth="3" opacity="0.25" />
          <polyline points={polyline((x) => (x - 6) ** 2 / 5 + 1, 0, 12, ease(seg(t, 0.05, 0.8)))} fill="none" stroke={C.orange} strokeWidth="4" strokeLinecap="round" />
          <Label x={300} y={40} size={18} color={C.orange} show={seg(t, 0.75, 0.95)}>a parabola ∪</Label>
        </>
      ) },
  ],
}

// ------------------------------------------------------------------ arithmetic progressions: growing columns

const colX = (k) => 70 + k * 68
function Column({ k, n, shown = n, highlightFrom = 99 }) {
  return Array.from({ length: n }, (_, i) => i < shown && (
    <rect key={i} x={colX(k) - 14} y={205 - (i + 1) * 13} width="28" height="11" rx="2"
          fill={i >= highlightFrom ? C.orange : C.primary} />
  ))
}
const AP = [2, 5, 8, 11, 14]

const progression = {
  title: 'Growing by the same step',
  frames: [
    { caption: 'Start with 2 blocks.', duration: 2500, draw: (t) => <Column k={0} n={2} shown={Math.ceil(seg(t, 0, 0.6) * 2)} /> },
    { caption: 'Each step adds the same number: 3 more blocks every time.', duration: 5500,
      draw: (t) => (
        <>
          <Column k={0} n={2} />
          {[1, 2, 3].map((k) => {
            const local = seg(t, (k - 1) / 3, k / 3)
            return (
              <g key={k}>
                <Column k={k} n={AP[k]} shown={Math.ceil(local * AP[k])} highlightFrom={AP[k - 1]} />
                <Label x={colX(k) - 34} y={205 - AP[k] * 13 - 12} size={13} color={C.orange} show={seg(local, 0.6, 1)}>+3</Label>
              </g>
            )
          })}
        </>
      ) },
    { caption: '2, 5, 8, 11… is an arithmetic progression. The jump is always the same: 3.', duration: 4000,
      draw: (t) => (
        <>
          {[0, 1, 2, 3].map((k) => <Column key={k} k={k} n={AP[k]} />)}
          {[0, 1, 2, 3].map((k) => <Label key={k} x={colX(k)} y={225} size={18} color={C.primary} show={seg(t, k * 0.15, k * 0.15 + 0.2)}>{AP[k]}</Label>)}
          <Label x={300} y={40} size={15} color={C.orange} show={seg(t, 0.7, 0.9)}>difference d = 3</Label>
        </>
      ) },
    { caption: 'To find the next term, just add 3 again: 11 + 3 = 14!', duration: 4000,
      draw: (t) => (
        <>
          {[0, 1, 2, 3].map((k) => <Column key={k} k={k} n={AP[k]} />)}
          <Column k={4} n={14} shown={Math.ceil(seg(t, 0.1, 0.7) * 14)} highlightFrom={11} />
          {[0, 1, 2, 3, 4].map((k) => <Label key={k} x={colX(k)} y={225} size={18} color={k === 4 ? C.orange : C.primary} show={k === 4 ? seg(t, 0.7, 0.9) : 1}>{AP[k]}</Label>)}
          <Label x={150} y={30} size={15} color={C.ink} show={seg(t, 0.8, 1)}>aₙ = a + (n − 1)d</Label>
        </>
      ) },
  ],
}

// ------------------------------------------------------------------ probability: marbles in a bag

const BAG = 'M140,110 Q130,230 200,232 Q270,230 260,110 Q230,95 200,100 Q170,95 140,110 Z'
const MARBLES = [{ x: 180, y: 200, c: C.red }, { x: 215, y: 205, c: C.red }, { x: 197, y: 175, c: C.red }, { x: 230, y: 178, c: C.blue }]
const Marble = ({ x, y, c, s = 1 }) => <circle cx={x} cy={y} r={13 * sc(s)} fill={c} stroke="#fff" strokeWidth="2" />

const probability = {
  title: 'Picking a marble',
  frames: [
    { caption: 'A bag has 3 red marbles and 1 blue marble.', duration: 3500,
      draw: (t) => (
        <>
          <path d={BAG} fill="#e6c79c" stroke={C.crust} strokeWidth="3" opacity={seg(t, 0, 0.25)} />
          {MARBLES.map((m, k) => <Marble key={k} {...m} y={lerp(20, m.y, ease(seg(t, 0.2 + k * 0.15, 0.4 + k * 0.15)))} s={seg(t, 0.2 + k * 0.15, 0.25 + k * 0.15)} />)}
        </>
      ) },
    { caption: 'Close your eyes and pick one marble without looking…', duration: 4000,
      draw: (t) => {
        const down = ease(seg(t, 0, 0.35)), up = ease(seg(t, 0.45, 0.85))
        return (
          <>
            <path d={BAG} fill="#e6c79c" stroke={C.crust} strokeWidth="3" />
            {MARBLES.map((m, k) => k !== 0 && <Marble key={k} {...m} />)}
            <Marble x={lerp(180, 320, up)} y={lerp(200, 70, up)} c={C.red} />
            <Emoji x={lerp(200, 320, up)} y={lerp(30, 150, down) - up * 110} size={40}>🤚</Emoji>
            <Label x={320} y={110} size={16} color={C.red} show={seg(t, 0.85, 1)}>Red!</Label>
          </>
        )
      } },
    { caption: 'Red has 3 chances out of 4. Blue has only 1 chance out of 4. Red is more likely!', duration: 4500,
      draw: (t) => (
        <>
          {MARBLES.map((m, k) => <Marble key={k} x={lerp(m.x, 110 + k * 60, ease(seg(t, 0, 0.4)))} y={lerp(m.y, 100, ease(seg(t, 0, 0.4)))} c={m.c} />)}
          <path d="M95,125 L95,135 L245,135 L245,125" fill="none" stroke={C.red} strokeWidth="3" opacity={seg(t, 0.4, 0.6)} />
          <Label x={170} y={160} size={17} color={C.red} show={seg(t, 0.45, 0.65)}>red: 3 out of 4 = ¾</Label>
          <Label x={290} y={190} size={17} color={C.blue} show={seg(t, 0.65, 0.85)}>blue: 1 out of 4 = ¼</Label>
        </>
      ) },
    { caption: 'Probability = the outcomes you want ÷ all the possible outcomes.', duration: 4000,
      draw: (t) => (
        <>
          <rect x="60" y="90" width="280" height="40" rx="8" fill="#f1f3f5" />
          <rect x="60" y="90" width={280 * 0.75 * ease(seg(t, 0.1, 0.6))} height="40" rx="8" fill={C.red} />
          <rect x={60 + 210} y="90" width={70 * ease(seg(t, 0.5, 0.8))} height="40" rx="8" fill={C.blue} />
          <Label x={200} y={170} size={18} show={seg(t, 0.6, 0.9)}>P(red) = 3 ÷ 4 = 0.75</Label>
        </>
      ) },
  ],
}

// ------------------------------------------------------------------ right triangles: a ladder on a wall

const LA = { x: 120, y: 205 }, LB = { x: 208, y: 205 }, LC = { x: 208, y: 139 }
function Ladder({ x1, y1, x2, y2, color = '#a0522d' }) {
  const len = Math.hypot(x2 - x1, y2 - y1), n = 6
  const ux = (x2 - x1) / len, uy = (y2 - y1) / len, px = -uy * 6, py = ux * 6
  return (
    <g>
      <line x1={x1 + px} y1={y1 + py} x2={x2 + px} y2={y2 + py} stroke={color} strokeWidth="4" />
      <line x1={x1 - px} y1={y1 - py} x2={x2 - px} y2={y2 - py} stroke={color} strokeWidth="4" />
      {Array.from({ length: n }, (_, k) => {
        const f = (k + 0.5) / n, cx = lerp(x1, x2, f), cy = lerp(y1, y2, f)
        return <line key={k} x1={cx + px} y1={cy + py} x2={cx - px} y2={cy - py} stroke={color} strokeWidth="3" />
      })}
    </g>
  )
}
const Wall = () => (
  <>
    <rect x="208" y="50" width="26" height="155" fill="#ffc9c9" stroke="#e8590c" />
    {Array.from({ length: 7 }, (_, k) => <line key={k} x1="208" y1={70 + k * 20} x2="234" y2={70 + k * 20} stroke="#e8590c" opacity=".5" />)}
    <line x1="40" y1="205" x2="300" y2="205" stroke={C.ink} strokeWidth="3" />
  </>
)
const RightMark = ({ show = 1 }) => <path d={`M${LB.x - 14},${LB.y} L${LB.x - 14},${LB.y - 14} L${LB.x},${LB.y - 14}`} fill="none" stroke={C.orange} strokeWidth="2.5" opacity={show} />

const rightTriangle = {
  title: 'A ladder against a wall',
  frames: [
    { caption: 'A ladder leans against a wall. The wall, the ground and the ladder make a right-angled triangle.', duration: 4500,
      draw: (t) => {
        const dx = 88 * ease(seg(t, 0.1, 0.7)), topY = 205 - Math.sqrt(110 * 110 - dx * dx)
        return (
          <>
            <Wall />
            <Ladder x1={208 - dx} y1={205} x2={208} y2={topY} />
            <RightMark show={seg(t, 0.75, 0.95)} />
          </>
        )
      } },
    { caption: 'The longest side, the ladder, is the hypotenuse. The wall is opposite the angle θ. The ground is next to it.', duration: 5000,
      draw: (t) => (
        <>
          <Wall /><RightMark />
          <Ladder x1={LA.x} y1={LA.y} x2={LC.x} y2={LC.y} color={t > 0.1 ? C.orange : '#a0522d'} />
          <line x1={LB.x} y1={LB.y} x2={LC.x} y2={LC.y} stroke={C.blue} strokeWidth="5" opacity={seg(t, 0.35, 0.5)} />
          <line x1={LA.x} y1={LA.y} x2={LB.x} y2={LB.y} stroke={C.green} strokeWidth="5" opacity={seg(t, 0.6, 0.75)} />
          <path d={`M${LA.x + 28},${LA.y} A28,28 0 0 0 ${LA.x + 28 * Math.cos(rad(37))},${LA.y - 28 * Math.sin(rad(37))}`} fill="none" stroke={C.ink} strokeWidth="2" />
          <Label x={LA.x + 40} y={LA.y - 10} size={13}>θ</Label>
          <Label x={130} y={150} size={14} color={C.orange} show={seg(t, 0.1, 0.3)}>hypotenuse</Label>
          <Label x={290} y={170} size={14} color={C.blue} show={seg(t, 0.4, 0.55)}>opposite</Label>
          <Label x={164} y={225} size={14} color={C.green} show={seg(t, 0.65, 0.8)}>adjacent</Label>
        </>
      ) },
    { caption: 'Pythagoras: the squares on the two short sides add up to the square on the longest side. 9 + 16 = 25!', duration: 5500,
      draw: (t) => {
        const A = [150, 170], B = [214, 170], Cc = [214, 122], n = [-48, -64]
        return (
          <>
            <polygon points={`${A} ${B} ${Cc}`} fill={C.soft} stroke={C.ink} strokeWidth="2" />
            <g opacity={seg(t, 0.05, 0.3)}><rect x="150" y="170" width="64" height="64" fill="#b2f2bb" stroke={C.green} /><Label x={182} y={202} size={16} color={C.green}>16</Label></g>
            <g opacity={seg(t, 0.3, 0.55)}><rect x="214" y="122" width="48" height="48" fill="#a5d8ff" stroke={C.blue} /><Label x={238} y={146} size={16} color={C.blue}>9</Label></g>
            <g opacity={seg(t, 0.55, 0.8)}>
              <polygon points={`${A} ${Cc} ${Cc[0] + n[0]},${Cc[1] + n[1]} ${A[0] + n[0]},${A[1] + n[1]}`} fill="#ffd8a8" stroke={C.orange} />
              <Label x={158} y={114} size={18} color={C.orange}>25</Label>
            </g>
            <Label x={330} y={60} size={18} show={seg(t, 0.8, 1)}>9 + 16 = 25</Label>
            <Label x={330} y={88} size={15} color={C.muted} show={seg(t, 0.85, 1)}>3² + 4² = 5²</Label>
          </>
        )
      } },
    { caption: 'Trigonometry compares the sides: sin θ = opposite ÷ hypotenuse, cos θ = adjacent ÷ hypotenuse.', duration: 5000,
      draw: (t) => (
        <>
          <Wall /><RightMark />
          <Ladder x1={LA.x} y1={LA.y} x2={LC.x} y2={LC.y} color={C.orange} />
          <line x1={LB.x} y1={LB.y} x2={LC.x} y2={LC.y} stroke={C.blue} strokeWidth="5" opacity={0.4 + 0.6 * seg(t, 0.1, 0.3)} />
          <line x1={LA.x} y1={LA.y} x2={LB.x} y2={LB.y} stroke={C.green} strokeWidth="5" opacity={0.4 + 0.6 * seg(t, 0.5, 0.7)} />
          <Label x={320} y={70} size={16} color={C.blue} show={seg(t, 0.1, 0.3)}>sin θ = 3 ÷ 5</Label>
          <Label x={320} y={105} size={16} color={C.green} show={seg(t, 0.5, 0.7)}>cos θ = 4 ÷ 5</Label>
          <Label x={320} y={140} size={16} color={C.ink} show={seg(t, 0.75, 0.9)}>tan θ = 3 ÷ 4</Label>
        </>
      ) },
  ],
}

// ------------------------------------------------------------------ sets: a Venn diagram

const VENN_ITEMS = [
  { e: '🍌', x: 112, y: 115, from: 40 }, { e: '🍇', x: 120, y: 165, from: 90 },
  { e: '🍎', x: 200, y: 112, from: 150, both: true }, { e: '🍓', x: 200, y: 160, from: 210, both: true },
  { e: '🚒', x: 288, y: 115, from: 270 }, { e: '🌹', x: 280, y: 165, from: 330 },
]
function Venn({ draw = 1, union = 0, inter = 0, items = 1 }) {
  return (
    <>
      <defs><clipPath id="venn-a"><circle cx="160" cy="135" r="82" /></clipPath></defs>
      <circle cx="160" cy="135" r="82" fill={C.primary} opacity={0.15 * union} />
      <circle cx="240" cy="135" r="82" fill={C.orange} opacity={0.15 * union} />
      <circle cx="240" cy="135" r="82" fill={C.orange} opacity={0.45 * inter} clipPath="url(#venn-a)" />
      <circle cx="160" cy="135" r="82" fill="none" stroke={C.primary} strokeWidth="3" strokeDasharray="520" strokeDashoffset={520 * (1 - draw)} />
      <circle cx="240" cy="135" r="82" fill="none" stroke={C.orange} strokeWidth="3" strokeDasharray="520" strokeDashoffset={520 * (1 - draw)} />
      <Label x={110} y={35} size={15} color={C.primary} show={draw}>Fruits</Label>
      <Label x={290} y={35} size={15} color={C.orange} show={draw}>Red things</Label>
      {VENN_ITEMS.map((it, k) => {
        const p = ease(clamp(items * 6 - k))
        return <Emoji key={k} x={lerp(it.from, it.x, p)} y={lerp(240, it.y, p)} size={28} opacity={clamp(items * 6 - k + 0.5)}>{it.e}</Emoji>
      })}
    </>
  )
}

const venn = {
  title: 'Sorting things into sets',
  frames: [
    { caption: 'A set is a group of things. Here is a set of fruits and a set of red things.', duration: 5000,
      draw: (t) => <Venn draw={ease(seg(t, 0, 0.4))} items={seg(t, 0.35, 1)} /> },
    { caption: 'An apple and a strawberry are fruits AND red, so they go in the middle. That is the intersection.', duration: 4500,
      draw: (t) => <Venn inter={seg(t, 0.1, 0.5) * (0.7 + 0.3 * Math.sin(t * 12))} /> },
    { caption: 'Put both sets together and you get the union: everything in either set.', duration: 4000,
      draw: (t) => <Venn union={seg(t, 0.1, 0.6)} /> },
    { caption: 'Intersection: in both sets. Union: in either set.', duration: 4000,
      draw: (t) => (
        <>
          <Venn union={0.6} inter={0.6} />
          <Label x={200} y={235} size={15} show={seg(t, 0.1, 0.4)}>A ∩ B = {'{'}🍎, 🍓{'}'}</Label>
        </>
      ) },
  ],
}

// ------------------------------------------------------------------ powers, squares and square roots

const Dots = ({ n, cx, cy, size = 14, color = C.primary, s = 1 }) => Array.from({ length: n * n }, (_, k) => (
  <circle key={k} cx={cx - ((n - 1) * size) / 2 + (k % n) * size} cy={cy - ((n - 1) * size) / 2 + Math.floor(k / n) * size} r={size * 0.38 * sc(s)} fill={color} />
))

const powers = {
  title: 'Multiplying again and again',
  frames: [
    { caption: 'Start with 1 block and keep doubling: 1, 2, 4, 8, 16. That is 2 × 2 × 2 × 2 = 2⁴.', duration: 6000,
      draw: (t) => {
        const k = Math.min(4, Math.floor(seg(t, 0, 0.95) * 5)), n = 2 ** k
        return (
          <>
            {Array.from({ length: n }, (_, i) => (
              <rect key={i} x={120 + (i % 4) * 32} y={50 + Math.floor(i / 4) * 32} width="26" height="26" rx="4"
                    fill={i >= n / 2 && k > 0 ? C.orange : C.primary} />
            ))}
            <Label x={330} y={110} size={26} color={C.primary}>2<tspan dy="-10" fontSize="16">{k}</tspan><tspan dy="10"> = {n}</tspan></Label>
          </>
        )
      } },
    { caption: 'Square numbers make squares of dots: 1, 4, 9, 16.', duration: 4500,
      draw: (t) => [1, 2, 3, 4].map((n, k) => (
        <g key={n}>
          <Dots n={n} cx={60 + k * 95} cy={120} size={16} s={pop(seg(t, k * 0.2, k * 0.2 + 0.25))} />
          <Label x={60 + k * 95} y={200} size={18} show={seg(t, k * 0.2 + 0.1, k * 0.2 + 0.3)}>{n * n}</Label>
        </g>
      )) },
    { caption: 'The square root asks: what side makes this square? √16 = 4, because 4 × 4 = 16.', duration: 4500,
      draw: (t) => (
        <>
          <Dots n={4} cx={200} cy={120} size={30} color={C.primary} />
          <line x1="140" y1="195" x2={lerp(140, 260, ease(seg(t, 0.2, 0.6)))} y2="195" stroke={C.orange} strokeWidth="4" strokeLinecap="round" />
          <Label x={200} y={220} size={18} color={C.orange} show={seg(t, 0.6, 0.8)}>side = 4</Label>
          <Label x={330} y={120} size={22} show={seg(t, 0.75, 0.95)}>√16 = 4</Label>
        </>
      ) },
    { caption: 'Powers write very big numbers in a short way: 1,000,000 = 10⁶.', duration: 4500,
      draw: (t) => {
        const squeeze = ease(seg(t, 0.55, 0.85))
        return (
          <>
            <Label x={lerp(80, 170, squeeze)} y={110} size={30} color={C.primary}>1</Label>
            {Array.from({ length: 6 }, (_, k) => (
              <Label key={k} x={lerp(110 + k * 32, 200, squeeze)} y={lerp(110, 110, squeeze)} size={30} color={C.orange}
                     show={clamp(seg(t, 0, 0.5) * 6 - k) * (1 - squeeze)}>0</Label>
            ))}
            <Label x={210} y={110} size={34} color={C.primary} show={squeeze}>10<tspan dy="-14" fontSize="20">6</tspan></Label>
            <Label x={200} y={190} size={15} color={C.muted} show={seg(t, 0.85, 1)}>six zeros → power of 6</Label>
          </>
        )
      } },
  ],
}

// ------------------------------------------------------------------ percent

const Grid100 = ({ filled = 0, half = 0 }) => Array.from({ length: 100 }, (_, k) => (
  <rect key={k} x={40 + (k % 10) * 17} y={45 + Math.floor(k / 10) * 17} width="15" height="15" rx="2"
        fill={k < filled ? C.orange : k < half ? C.primary : '#e9ecef'} />
))

const percent = {
  title: 'Out of a hundred',
  frames: [
    { caption: 'Here are 100 small squares. Colour 25 of them: that is 25 out of 100, or 25%.', duration: 5000,
      draw: (t) => (
        <>
          <Grid100 filled={Math.floor(seg(t, 0.1, 0.8) * 25)} />
          <Label x={310} y={130} size={30} color={C.orange} show={seg(t, 0.8, 1)}>25%</Label>
        </>
      ) },
    { caption: '50% means half of all the squares.', duration: 4000,
      draw: (t) => (
        <>
          <Grid100 half={Math.floor(seg(t, 0.1, 0.8) * 50)} />
          <Label x={310} y={130} size={30} color={C.primary} show={seg(t, 0.8, 1)}>50% = ½</Label>
        </>
      ) },
    { caption: 'A toy costs ₹200 with 10% off. 10% of 200 is 20, so you pay ₹180.', duration: 5000,
      draw: (t) => (
        <>
          <Emoji x={130} y={120} size={90}>🏷️</Emoji>
          <Label x={290} y={90} size={30} color={C.muted}>₹200</Label>
          <line x1="245" y1="90" x2={lerp(245, 335, ease(seg(t, 0.3, 0.5)))} y2="90" stroke={C.red} strokeWidth="4" />
          <Label x={290} y={140} size={18} color={C.red} show={seg(t, 0.4, 0.6)}>− 10% (₹20)</Label>
          <Label x={290} y={190} size={34} color={C.green} show={seg(t, 0.65, 0.85)}>₹180</Label>
        </>
      ) },
    { caption: 'Money in a bank grows with interest. ₹100 at 10% becomes ₹110 after a year.', duration: 4500,
      draw: (t) => {
        const coins = 10 + Math.floor(seg(t, 0.3, 0.8) * 1.01)
        return (
          <>
            <Emoji x={90} y={120} size={64}>🏦</Emoji>
            {Array.from({ length: coins }, (_, k) => (
              <ellipse key={k} cx={240} cy={210 - k * 12} rx="34" ry="8" fill={k === 10 ? C.green : C.yellow} stroke={C.crust} />
            ))}
            <Label x={330} y={90} size={22} show={seg(t, 0.8, 1)}>₹110</Label>
          </>
        )
      } },
  ],
}

// ------------------------------------------------------------------ permutations: friends in seats

const KIDS = ['🧒', '👧', '👦']
const ORDERS = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]]

const arrange = {
  title: 'How many ways to sit?',
  frames: [
    { caption: 'Three friends and three seats. In how many different ways can they sit?', duration: 3500,
      draw: (t) => (
        <>
          {[0, 1, 2].map((k) => <Emoji key={`c${k}`} x={140 + k * 60} y={160} size={40} opacity={seg(t, 0, 0.3)}>🪑</Emoji>)}
          {KIDS.map((e, k) => <Emoji key={k} x={140 + k * 60} y={lerp(40, 130, ease(seg(t, 0.3 + k * 0.15, 0.55 + k * 0.15)))} size={36}>{e}</Emoji>)}
        </>
      ) },
    { caption: 'Let us try every order, one by one.', duration: 6000,
      draw: (t) => ORDERS.map((o, r) => (
        <g key={r} opacity={seg(t, r * 0.15, r * 0.15 + 0.1)}>
          <Label x={40} y={30 + r * 38} size={14} color={C.muted}>{r + 1}</Label>
          {o.map((kid, k) => <Emoji key={k} x={90 + k * 40} y={30 + r * 38} size={26}>{KIDS[kid]}</Emoji>)}
        </g>
      )) },
    { caption: 'Seat 1 has 3 choices. Then seat 2 has 2 choices. The last seat has 1. So 3 × 2 × 1 = 6.', duration: 5000,
      draw: (t) => (
        <>
          {[3, 2, 1].map((n, k) => (
            <g key={k} opacity={seg(t, k * 0.25, k * 0.25 + 0.2)}>
              <Emoji x={110 + k * 90} y={110} size={44}>🪑</Emoji>
              <Label x={110 + k * 90} y={165} size={24} color={C.primary}>{n}</Label>
              {k < 2 && <Label x={155 + k * 90} y={165} size={22}>×</Label>}
            </g>
          ))}
          <Label x={330} y={165} size={24} color={C.green} show={seg(t, 0.8, 1)}>= 6</Label>
        </>
      ) },
    { caption: 'We write 3 × 2 × 1 as 3! (3 factorial). There are 6 arrangements.', duration: 3500,
      draw: (t) => <Label x={200} y={130} size={44} color={C.primary} show={seg(t, 0, 0.4)}>3! = 6</Label> },
  ],
}

// ------------------------------------------------------------------ integrals: area under a curve

const fCurve = (x) => 2.2 + 1.8 * Math.sin(x / 2.2)
function Rects({ n, x0 = 1, x1 = 12, fill = C.soft }) {
  const w = (x1 - x0) / n
  return Array.from({ length: n }, (_, k) => {
    const x = x0 + k * w, [px, py] = GP(x, fCurve(x + w / 2))
    return <rect key={k} x={px} y={py} width={w * 24} height={225 - py} fill={fill} stroke={C.primary} strokeWidth={n > 30 ? 0.3 : 1.2} />
  })
}

const areaUnderCurve = {
  title: 'Adding up thin rectangles',
  frames: [
    { caption: 'Here is a curve. How much space is under it?', duration: 3000,
      draw: (t) => <><Axes /><polyline points={polyline(fCurve, 0, 13, ease(seg(t, 0, 0.8)))} fill="none" stroke={C.orange} strokeWidth="4" /></> },
    { caption: 'Fill the space with rectangles and add up their areas.', duration: 4000,
      draw: (t) => <><Axes /><g opacity={seg(t, 0.1, 0.5)}><Rects n={4} /></g><polyline points={polyline(fCurve, 0, 13, 1)} fill="none" stroke={C.orange} strokeWidth="4" /></> },
    { caption: 'Thinner rectangles fit the curve better and better…', duration: 5000,
      draw: (t) => <><Axes /><Rects n={Math.round(lerp(4, 40, ease(seg(t, 0.05, 0.9))))} /><polyline points={polyline(fCurve, 0, 13, 1)} fill="none" stroke={C.orange} strokeWidth="4" /></> },
    { caption: 'With super-thin rectangles we get the exact area. That is what an integral (∫) does.', duration: 4000,
      draw: (t) => (
        <>
          <Axes />
          <polygon points={`${GP(1, 0)} ${polyline(fCurve, 1, 12, 1)} ${GP(12, 0)}`} fill={C.primary} opacity={0.3 * seg(t, 0, 0.4) + 0.1} />
          <polyline points={polyline(fCurve, 0, 13, 1)} fill="none" stroke={C.orange} strokeWidth="4" />
          <Label x={200} y={40} size={22} color={C.primary} show={seg(t, 0.4, 0.7)}>area = ∫ f(x) dx</Label>
        </>
      ) },
  ],
}

// ------------------------------------------------------------------ continuity and slope

const hill = (x) => 6 - ((x - 6) ** 2) / 6
const tangent = {
  title: 'Smooth curves and slopes',
  frames: [
    { caption: 'A continuous curve can be drawn without lifting your pencil.', duration: 4000,
      draw: (t) => {
        const p = ease(seg(t, 0.05, 0.9)), x = lerp(0, 12, p), [px, py] = GP(x, hill(x))
        return <><Axes /><polyline points={polyline(hill, 0, 12, p)} fill="none" stroke={C.primary} strokeWidth="4" /><Emoji x={px + 10} y={py - 14} size={24}>✏️</Emoji></>
      } },
    { caption: 'This curve has a jump. You must lift the pencil, so it is not continuous.', duration: 4000,
      draw: (t) => {
        const jump = (x) => (x < 6 ? 2 + x / 3 : 5.5 + (x - 6) / 3)
        return (
          <>
            <Axes />
            <polyline points={polyline(jump, 0, 5.99, seg(t, 0, 0.45))} fill="none" stroke={C.red} strokeWidth="4" />
            {t > 0.55 && <polyline points={polyline(jump, 6.01, 12, seg(t, 0.55, 0.95))} fill="none" stroke={C.red} strokeWidth="4" />}
            <Emoji x={GP(6, 4)[0]} y={GP(6, 4)[1] - 30} size={26} opacity={seg(t, 0.45, 0.55)}>⚠️</Emoji>
          </>
        )
      } },
    { caption: 'The slope of the line that just touches the curve is the derivative: how fast the curve is changing.', duration: 6000,
      draw: (t) => {
        const x = lerp(1.5, 10.5, ease(seg(t, 0.05, 0.95))), m = -(x - 6) / 3, [px, py] = GP(x, hill(x))
        const dx = 2.2
        return (
          <>
            <Axes />
            <polyline points={polyline(hill, 0, 12, 1)} fill="none" stroke={C.primary} strokeWidth="4" />
            <line x1={GP(x - dx, hill(x) - m * dx)[0]} y1={GP(x - dx, hill(x) - m * dx)[1]} x2={GP(x + dx, hill(x) + m * dx)[0]} y2={GP(x + dx, hill(x) + m * dx)[1]} stroke={C.orange} strokeWidth="3" />
            <circle cx={px} cy={py} r="6" fill={C.orange} />
            <Label x={320} y={30} size={16} color={C.orange}>slope = {m.toFixed(1)}</Label>
          </>
        )
      } },
    { caption: 'At the very top of the hill the touching line is flat. The slope is 0.', duration: 3500,
      draw: (t) => (
        <>
          <Axes />
          <polyline points={polyline(hill, 0, 12, 1)} fill="none" stroke={C.primary} strokeWidth="4" />
          <line x1={GP(3.5, 6)[0]} y1={GP(3.5, 6)[1]} x2={GP(8.5, 6)[0]} y2={GP(8.5, 6)[1]} stroke={C.orange} strokeWidth="3" opacity={seg(t, 0, 0.3)} />
          <circle cx={GP(6, 6)[0]} cy={GP(6, 6)[1]} r={6 + 3 * Math.sin(t * 15)} fill={C.orange} />
          <Label x={GP(6, 6)[0]} y={GP(6, 6)[1] - 24} size={16} color={C.orange} show={seg(t, 0.3, 0.6)}>slope = 0</Label>
        </>
      ) },
  ],
}

// ------------------------------------------------------------------ functions: a machine

function Machine({ ms, show = 1, rule = '× 2 + 1' }) {
  return (
    <g opacity={show}>
      <rect x="140" y="80" width="120" height="90" rx="12" fill={C.primary} />
      <rect x="128" y="112" width="14" height="26" fill="#3b33c4" /><rect x="258" y="112" width="14" height="26" fill="#3b33c4" />
      <g transform={`translate(170 102) rotate(${-ms / 8})`}><Emoji x={0} y={0} size={22}>⚙️</Emoji></g>
      <g transform={`translate(230 102) rotate(${ms / 8})`}><Emoji x={0} y={0} size={22}>⚙️</Emoji></g>
      <Label x={200} y={145} size={18} color="#fff">{rule}</Label>
    </g>
  )
}
const Ball = ({ x, y, v, color = C.orange }) => (
  <g transform={`translate(${x} ${y})`}><circle r="17" fill={color} /><Label x={0} y={1} size={15} color="#fff">{v}</Label></g>
)
const through = (t, a, b, inV, outV) => {
  const pin = ease(seg(t, a, a + (b - a) * 0.45)), pout = ease(seg(t, a + (b - a) * 0.55, b))
  return (
    <>
      {pin < 1 && <Ball x={lerp(30, 140, pin)} y={125} v={inV} />}
      {pout > 0 && <Ball x={lerp(260, 370, pout)} y={125} v={outV} color={C.green} />}
    </>
  )
}

const functionMachine = {
  title: 'A function machine',
  frames: [
    { caption: 'A function is like a machine: something goes in, the machine follows its rule, and something comes out.', duration: 4000,
      draw: (t, ms) => <Machine ms={ms} show={seg(t, 0, 0.4)} /> },
    { caption: 'Put in 3. The rule "× 2 + 1" gives 7.', duration: 4500,
      draw: (t, ms) => <><Machine ms={ms} />{through(t, 0.05, 0.9, 3, 7)}</> },
    { caption: 'Every input gives exactly one output: 1 → 3, 2 → 5, 4 → 9.', duration: 6000,
      draw: (t, ms) => (
        <>
          <Machine ms={ms} />
          {[[1, 3], [2, 5], [4, 9]].map(([i, o], k) => (
            <g key={k}>
              {t > k / 3 && t < (k + 1) / 3 && through(seg(t, k / 3, (k + 1) / 3), 0, 1, i, o)}
              <Label x={130 + k * 70} y={215} size={16} show={seg(t, (k + 0.9) / 3, (k + 1) / 3)}>{i} → {o}</Label>
            </g>
          ))}
        </>
      ) },
    { caption: 'In Python, def builds your own function machine: def f(x): return 2 * x + 1', duration: 4000,
      draw: (t, ms) => (
        <>
          <Machine ms={ms} rule="f(x)" />
          <rect x="70" y="195" width="260" height="36" rx="8" fill="#212529" opacity={seg(t, 0.1, 0.4)} />
          <Label x={200} y={213} size={13} color="#69db7c" show={seg(t, 0.2, 0.5)} weight={700}>def f(x): return 2 * x + 1</Label>
        </>
      ) },
  ],
}

// ------------------------------------------------------------------ statistics: mean, median, mode

const DATA = [2, 6, 4, 8, 5], FRIENDS = ['🧒', '👧', '👦', '🧑', '👩']
const barX = (i) => 60 + i * 70
function Bars({ heights, xs = DATA.map((_, i) => barX(i)), highlight = -1 }) {
  return heights.map((h, i) => (
    <g key={i}>
      <rect x={xs[i] - 22} y={200 - h * 18} width="44" height={h * 18} rx="4" fill={i === highlight ? C.orange : C.primary} />
      <Label x={xs[i]} y={190 - h * 18} size={13}>{Math.round(h * 10) / 10}</Label>
      <Emoji x={xs[i]} y={222} size={20}>{FRIENDS[i]}</Emoji>
    </g>
  ))
}

const barChart = {
  title: 'Finding the middle of data',
  frames: [
    { caption: 'Five friends count the books they read: 2, 6, 4, 8 and 5.', duration: 4000,
      draw: (t) => <Bars heights={DATA.map((h, i) => h * ease(seg(t, i * 0.15, i * 0.15 + 0.3)))} /> },
    { caption: 'The mean: share all the books equally. Everyone gets 5.', duration: 5000,
      draw: (t) => (
        <>
          <Bars heights={DATA.map((h) => lerp(h, 5, ease(seg(t, 0.1, 0.7))))} />
          <line x1="25" y1={200 - 5 * 18} x2="375" y2={200 - 5 * 18} stroke={C.orange} strokeWidth="2.5" strokeDasharray="6 5" opacity={seg(t, 0.6, 0.8)} />
          <Label x={340} y={92} size={15} color={C.orange} show={seg(t, 0.7, 0.9)}>mean = 5</Label>
        </>
      ) },
    { caption: 'The median: line them up from smallest to biggest and pick the one in the middle.', duration: 5000,
      draw: (t) => {
        const order = [...DATA.keys()].sort((a, b) => DATA[a] - DATA[b]), p = ease(seg(t, 0.1, 0.6))
        const xs = DATA.map((_, i) => lerp(barX(i), barX(order.indexOf(i)), p))
        return (
          <>
            <Bars heights={DATA} xs={xs} highlight={t > 0.7 ? 4 : -1} />
            <Label x={barX(2)} y={40} size={15} color={C.orange} show={seg(t, 0.7, 0.9)}>median = 5 ↓</Label>
          </>
        )
      } },
    { caption: 'The mode is the value that appears most often. Here, 5 appears the most.', duration: 4500,
      draw: (t) => {
        const counts = { 2: 1, 3: 1, 4: 1, 5: 3 }
        return (
          <>
            {Object.entries(counts).map(([v, n], k) => (
              <g key={v}>
                {Array.from({ length: n }, (_, j) => <circle key={j} cx={90 + k * 75} cy={190 - j * 30} r={12 * sc(pop(seg(t, (k * 3 + j) * 0.06, (k * 3 + j) * 0.06 + 0.15)))} fill={v === '5' ? C.orange : C.primary} />)}
                <Label x={90 + k * 75} y={222} size={16}>{v}</Label>
              </g>
            ))}
            <Emoji x={315} y={86} size={28} scale={pop(seg(t, 0.7, 0.9))}>👑</Emoji>
          </>
        )
      } },
  ],
}

// ------------------------------------------------------------------ measurement

function Ruler({ cm = 10, x = 60, y = 150, unit = 28, draw = 1 }) {
  return (
    <g opacity={draw}>
      <rect x={x - 6} y={y} width={cm * unit + 12} height="34" rx="4" fill="#ffe066" stroke={C.crust} />
      {Array.from({ length: cm * 2 + 1 }, (_, k) => (
        <line key={k} x1={x + (k * unit) / 2} y1={y} x2={x + (k * unit) / 2} y2={y + (k % 2 ? 8 : 14)} stroke={C.ink} strokeWidth="1.5" />
      ))}
      {Array.from({ length: cm + 1 }, (_, k) => <Label key={k} x={x + k * unit} y={y + 24} size={10}>{k}</Label>)}
    </g>
  )
}

const measure = {
  title: 'Measuring things',
  frames: [
    { caption: 'A ruler measures length. This pencil is 7 centimetres long.', duration: 4000,
      draw: (t) => (
        <>
          <Ruler draw={seg(t, 0, 0.3)} />
          <rect x={60} y={lerp(40, 120, ease(seg(t, 0.3, 0.6)))} width={196} height="16" rx="4" fill={C.orange} />
          <polygon points={`256,${lerp(40, 120, ease(seg(t, 0.3, 0.6)))} 276,${lerp(48, 128, ease(seg(t, 0.3, 0.6)))} 256,${lerp(56, 136, ease(seg(t, 0.3, 0.6)))}`} fill="#ffd8a8" />
          <Label x={330} y={128} size={20} color={C.primary} show={seg(t, 0.7, 0.9)}>7 cm</Label>
        </>
      ) },
    { caption: 'If we measure a room with footsteps, big feet and small feet give different answers!', duration: 5000,
      draw: (t) => (
        <>
          <rect x="40" y="40" width="320" height="180" fill="none" stroke={C.muted} strokeWidth="2" strokeDasharray="6 4" />
          {Array.from({ length: 5 }, (_, k) => <Emoji key={`b${k}`} x={72 + k * 64} y={95} size={34} opacity={clamp(seg(t, 0, 0.45) * 5 - k)}>👣</Emoji>)}
          {Array.from({ length: 8 }, (_, k) => <Emoji key={`s${k}`} x={60 + k * 40} y={170} size={20} opacity={clamp(seg(t, 0.45, 0.9) * 8 - k)}>👣</Emoji>)}
          <Label x={340} y={60} size={13} color={C.primary} show={seg(t, 0.4, 0.5)}>5 steps</Label>
          <Label x={340} y={205} size={13} color={C.orange} show={seg(t, 0.9, 1)}>8 steps</Label>
        </>
      ) },
    { caption: 'So everyone uses the same standard units: metre for length, kilogram for mass, second for time.', duration: 4500,
      draw: (t) => [['📏', 'metre (m)'], ['⚖️', 'kilogram (kg)'], ['⏱️', 'second (s)']].map(([e, l], k) => (
        <g key={k}>
          <Emoji x={80 + k * 120} y={110} size={54} scale={pop(seg(t, k * 0.25, k * 0.25 + 0.25))}>{e}</Emoji>
          <Label x={80 + k * 120} y={175} size={14} show={seg(t, k * 0.25 + 0.15, k * 0.25 + 0.35)}>{l}</Label>
        </g>
      )) },
    { caption: '1 metre = 100 centimetres. 1 kilometre = 1000 metres.', duration: 4500,
      draw: (t) => (
        <>
          <rect x="50" y="90" width="300" height="30" rx="4" fill={C.primary} />
          {Array.from({ length: 100 }, (_, k) => <line key={k} x1={50 + k * 3} y1="90" x2={50 + k * 3} y2={k % 10 ? 100 : 108} stroke="#fff" opacity={clamp(seg(t, 0.1, 0.7) * 100 - k)} />)}
          <Label x={200} y={70} size={16} show={seg(t, 0, 0.2)}>1 m</Label>
          <Label x={200} y={150} size={16} color={C.orange} show={seg(t, 0.7, 0.9)}>= 100 cm</Label>
        </>
      ) },
  ],
}

export const MATH_SCENES = {
  'factor-tree': factorTree, 'number-line': numberLine, 'graph-line': graphLine, progression, probability,
  'right-triangle': rightTriangle, venn, powers, percent, arrange, 'area-under-curve': areaUnderCurve, tangent,
  'function-machine': functionMachine, 'bar-chart': barChart, measure,
}
