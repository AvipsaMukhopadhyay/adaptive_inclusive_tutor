/** Science scenes (physics, chemistry, biology). Same contract as scenes.jsx: frames of { caption, duration, draw(t, ms) }. */
import { Arrow, C, Cloud, Emoji, Label, Sun, clamp, ease, lerp, loop, pop, rad, reflect, seg } from './scenes.jsx'

const sc = (s) => Math.max(s, 0.001)
/** Position along a polyline of [x, y] points, p from 0 to 1. */
function along(points, p) {
  const lens = points.slice(1).map((pt, i) => Math.hypot(pt[0] - points[i][0], pt[1] - points[i][1]))
  let d = clamp(p) * lens.reduce((a, b) => a + b, 0)
  for (let i = 0; i < lens.length; i++) {
    if (d <= lens[i] || i === lens.length - 1) {
      const f = lens[i] ? Math.min(d / lens[i], 1) : 0
      return [lerp(points[i][0], points[i + 1][0], f), lerp(points[i][1], points[i + 1][1], f)]
    }
    d -= lens[i]
  }
  return points[points.length - 1]
}
const pts = (points) => points.map((p) => p.join(',')).join(' ')

// ------------------------------------------------------------------ the Earth and the Sun

function Earth({ x, y, r = 12, tilt = 0, spin = 0 }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${tilt})`}>
      <circle r={r} fill={C.blue} />
      <ellipse cx={r * 0.3 * Math.cos(spin)} cy={-r * 0.2} rx={r * 0.35} ry={r * 0.25} fill={C.leaf} />
      <ellipse cx={-r * 0.35 * Math.cos(spin + 1)} cy={r * 0.35} rx={r * 0.3} ry={r * 0.2} fill={C.leaf} />
      {tilt !== 0 && <line x1="0" y1={-r - 8} x2="0" y2={r + 8} stroke={C.ink} strokeWidth="2" />}
    </g>
  )
}
const orbitPos = (a) => [200 + 150 * Math.cos(a), 130 + 70 * Math.sin(a)]

const earthSun = {
  title: 'The Earth spins and travels',
  frames: [
    { caption: 'The Sun is in the middle. The Earth travels around it on a path called an orbit.', duration: 5000,
      draw: (t, ms) => {
        const [x, y] = orbitPos(ms / 1200)
        return <><ellipse cx="200" cy="130" rx="150" ry="70" fill="none" stroke="#ced4da" strokeDasharray="5 5" /><Sun x={200} y={130} ms={ms} /><Earth x={x} y={y} /></>
      } },
    { caption: 'The Earth also spins like a top. The side facing the Sun has day. The other side has night.', duration: 5500,
      draw: (t, ms) => (
        <>
          <Sun x={40} y={130} ms={ms} />
          <defs><clipPath id="big-earth"><circle cx="230" cy="130" r="90" /></clipPath></defs>
          <circle cx="230" cy="130" r="90" fill={C.blue} />
          <g clipPath="url(#big-earth)">
            {[0, 80, 160, 240].map((off, k) => <ellipse key={k} cx={140 + ((ms / 25 + off) % 320) - 40} cy={95 + (k % 2) * 60} rx="34" ry="22" fill={C.leaf} />)}
            <rect x="230" y="40" width="90" height="180" fill="#0b1640" opacity="0.6" />
          </g>
          <Label x={180} y={30} size={15} color={C.orange}>day ☀️</Label>
          <Label x={290} y={30} size={15} color={C.primary}>night 🌙</Label>
        </>
      ) },
    { caption: 'One spin takes 24 hours: one day. One trip around the Sun takes 365 days: one year.', duration: 6000,
      draw: (t, ms) => {
        const [x, y] = orbitPos(-Math.PI / 2 + t * Math.PI * 2)
        return (
          <>
            <ellipse cx="200" cy="130" rx="150" ry="70" fill="none" stroke="#ced4da" strokeDasharray="5 5" />
            <Sun x={200} y={130} ms={ms} />
            <Earth x={x} y={y} spin={ms / 100} />
            <Label x={200} y={232} size={18} color={C.primary}>Day {Math.min(365, Math.floor(t * 366))} of 365</Label>
          </>
        )
      } },
    { caption: 'The Earth is tilted. When the north leans towards the Sun it is summer there; when it leans away, it is winter.', duration: 5500,
      draw: (t, ms) => {
        const a = lerp(Math.PI, 0, ease(seg(t, 0.1, 0.9))), [x, y] = orbitPos(a)
        return (
          <>
            <ellipse cx="200" cy="130" rx="150" ry="70" fill="none" stroke="#ced4da" strokeDasharray="5 5" />
            <Sun x={200} y={130} ms={ms} />
            <Earth x={x} y={y} r={18} tilt={-23} spin={ms / 100} />
            <Label x={60} y={60} size={14} color={C.orange} show={1 - seg(t, 0.3, 0.5)}>north summer ☀️</Label>
            <Label x={340} y={60} size={14} color={C.blue} show={seg(t, 0.7, 0.9)}>north winter ❄️</Label>
          </>
        )
      } },
  ],
}

// ------------------------------------------------------------------ gravity

const gravity = {
  title: 'The invisible pull',
  frames: [
    { caption: 'An apple falls from a tree. The Earth pulls it down. That pull is gravity.', duration: 3500,
      draw: (t) => {
        const f = seg(t, 0.2, 0.75), y = lerp(85, 215, f * f)
        return <><line x1="0" y1="230" x2="400" y2="230" stroke={C.green} strokeWidth="4" /><Emoji x={110} y={130} size={130}>🌳</Emoji><Emoji x={150} y={y} size={26}>🍎</Emoji><Arrow x1={220} y1={90} x2={220} y2={200} progress={seg(t, 0.5, 0.8)} color={C.primary} /></>
      } },
    { caption: 'Throw a ball forward. Gravity bends its path and brings it back down.', duration: 4000,
      draw: (t) => {
        const ball = (p) => [lerp(40, 360, p), 215 - 180 * p * (1 - p) * 2]
        const [bx, by] = ball(ease(seg(t, 0.05, 0.9)))
        return (
          <>
            <line x1="0" y1="230" x2="400" y2="230" stroke={C.green} strokeWidth="4" />
            {Array.from({ length: 20 }, (_, k) => k / 20 < ease(seg(t, 0.05, 0.9)) && <circle key={k} cx={ball(k / 20)[0]} cy={ball(k / 20)[1]} r="2.5" fill="#adb5bd" />)}
            <Emoji x={bx} y={by} size={24}>⚽</Emoji>
          </>
        )
      } },
    { caption: 'The same pull keeps the Moon going round and round the Earth.', duration: 5000,
      draw: (t, ms) => {
        const a = ms / 900
        return <><circle cx="200" cy="130" r="100" fill="none" stroke="#ced4da" strokeDasharray="5 5" /><Emoji x={200} y={130} size={64}>🌍</Emoji><Emoji x={200 + 100 * Math.cos(a)} y={130 + 100 * Math.sin(a)} size={28}>🌙</Emoji><Arrow x1={200 + 80 * Math.cos(a)} y1={130 + 80 * Math.sin(a)} x2={200 + 45 * Math.cos(a)} y2={130 + 45 * Math.sin(a)} color={C.orange} /></>
      } },
    { caption: 'Heavier things and things that are closer pull on each other more strongly.', duration: 4500,
      draw: (t) => {
        const gap = lerp(220, 90, ease(seg(t, 0.1, 0.8))), w = lerp(2, 9, ease(seg(t, 0.1, 0.8)))
        return (
          <>
            <circle cx={200 - gap / 2} cy="130" r="40" fill={C.blue} />
            <circle cx={200 + gap / 2} cy="130" r="22" fill="#adb5bd" />
            <line x1={200 - gap / 2 + 45} y1="130" x2={200 + gap / 2 - 27} y2="130" stroke={C.orange} strokeWidth={w} strokeLinecap="round" />
            <Label x={200} y={215} size={15} color={C.orange} show={seg(t, 0.7, 0.9)}>closer = stronger pull</Label>
          </>
        )
      } },
  ],
}

// ------------------------------------------------------------------ atoms and bonds

function Nucleus({ x = 200, y = 130, s = 1, n = 6 }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${sc(s)})`}>
      {Array.from({ length: n }, (_, k) => {
        const a = k * 2.4, r = k === 0 ? 0 : 9 + (k % 3) * 3
        return <g key={k}><circle cx={r * Math.cos(a)} cy={r * Math.sin(a)} r="9" fill={k % 2 ? '#adb5bd' : C.red} />{k % 2 === 0 && <Label x={r * Math.cos(a)} y={r * Math.sin(a) + 1} size={10} color="#fff">+</Label>}</g>
      })}
    </g>
  )
}
const Electrons = ({ x = 200, y = 130, r, n, ms, speed = 1, off = 0 }) => Array.from({ length: n }, (_, k) => {
  const a = (ms / 700) * speed + (k / n) * Math.PI * 2 + off
  return <g key={k}><circle cx={x + r * Math.cos(a)} cy={y + r * Math.sin(a)} r="6" fill={C.blue} /><Label x={x + r * Math.cos(a)} y={y + r * Math.sin(a)} size={9} color="#fff">−</Label></g>
})

const atom = {
  title: 'Inside an atom',
  frames: [
    { caption: "Everything around us is made of tiny atoms. Let's zoom in on one!", duration: 3500,
      draw: (t) => {
        const z = lerp(1, 7, ease(seg(t, 0.2, 0.95)))
        return (
          <g transform={`translate(200 130) scale(${z}) translate(-200 -130)`}>
            {Array.from({ length: 35 }, (_, k) => <circle key={k} cx={110 + (k % 7) * 30} cy={70 + Math.floor(k / 7) * 30} r="10" fill={k === 17 ? C.primary : '#adb5bd'} opacity={k === 17 ? 1 : 1 - seg(t, 0.3, 0.7)} />)}
          </g>
        )
      } },
    { caption: 'In the middle is the nucleus. It has protons (+) and neutrons packed together.', duration: 3500,
      draw: (t) => <><Nucleus s={pop(seg(t, 0, 0.5))} /><Label x={200} y={200} size={15} show={seg(t, 0.5, 0.8)}>nucleus</Label></> },
    { caption: 'Tiny electrons (−) zoom around the nucleus in layers called shells.', duration: 5000,
      draw: (t, ms) => (
        <>
          <circle cx="200" cy="130" r="50" fill="none" stroke="#ced4da" opacity={seg(t, 0, 0.3)} />
          <circle cx="200" cy="130" r="90" fill="none" stroke="#ced4da" opacity={seg(t, 0.2, 0.5)} />
          <Nucleus />
          <g opacity={seg(t, 0.1, 0.4)}><Electrons r={50} n={2} ms={ms} speed={1.6} /></g>
          <g opacity={seg(t, 0.3, 0.6)}><Electrons r={90} n={6} ms={ms} /></g>
        </>
      ) },
    { caption: 'Atoms can join by sharing electrons. That is a chemical bond, and it makes a molecule.', duration: 5000,
      draw: (t, ms) => {
        const d = lerp(150, 45, ease(seg(t, 0.05, 0.5))), shared = seg(t, 0.5, 0.7)
        const a = ms / 500
        return (
          <>
            <circle cx={200 - d} cy="130" r="45" fill="none" stroke="#ced4da" />
            <circle cx={200 + d} cy="130" r="45" fill="none" stroke="#ced4da" />
            <Nucleus x={200 - d} n={1} /><Nucleus x={200 + d} n={1} />
            {[0, 1].map((k) => {
              const sx = 200 - d + 45 * Math.cos(a + k * Math.PI), sy = 130 + 45 * Math.sin(a + k * Math.PI)
              const ex = 200 + 22 * Math.cos(a * 2 + k * Math.PI), ey = 130 + 40 * Math.sin(a * 2 + k * Math.PI)
              return <circle key={k} cx={lerp(k ? 200 + d - 45 * Math.cos(a) : sx, ex, shared)} cy={lerp(k ? 130 - 45 * Math.sin(a) : sy, ey, shared)} r="6" fill={C.blue} />
            })}
            <Label x={200} y={215} size={16} color={C.green} show={seg(t, 0.7, 0.9)}>shared electrons = bond</Label>
          </>
        )
      } },
  ],
}

// ------------------------------------------------------------------ force and motion

const Ground = () => <line x1="0" y1="205" x2="400" y2="205" stroke={C.muted} strokeWidth="3" />
const motionForce = {
  title: 'Pushes and pulls',
  frames: [
    { caption: 'This trolley is standing still. It will not move by itself.', duration: 2500,
      draw: (t) => <><Ground /><Emoji x={70} y={180} size={48} scale={pop(seg(t, 0, 0.4))}>🛒</Emoji></> },
    { caption: 'Push it! A force makes it start moving and speed up.', duration: 4000,
      draw: (t) => {
        const f = seg(t, 0.15, 1), x = 70 + 270 * f * f
        return (
          <>
            <Ground />
            <Emoji x={x} y={180} size={48}>🛒</Emoji>
            <Arrow x1={x - 80} y1={160} x2={x - 35} y2={160} progress={t > 0.05 ? 1 : 0} color={C.orange} />
            <Label x={330} y={40} size={15} color={C.primary}>speed: {(f * 10).toFixed(1)}</Label>
          </>
        )
      } },
    { caption: 'The same push moves a light trolley faster than a heavy one. Force = mass × acceleration.', duration: 4500,
      draw: (t) => {
        const f = seg(t, 0.1, 1)
        return (
          <>
            <line x1="0" y1="110" x2="400" y2="110" stroke={C.muted} strokeWidth="2" /><Ground />
            <Emoji x={60 + 280 * f * f} y={88} size={40}>🛒</Emoji>
            <Emoji x={60 + 110 * f * f} y={180} size={40}>🛒</Emoji>
            <Emoji x={60 + 110 * f * f} y={160} size={22}>📦</Emoji>
            <Label x={200} y={240} size={16} color={C.orange} show={seg(t, 0.6, 0.85)}>F = m × a</Label>
          </>
        )
      } },
    { caption: 'Every action has an equal and opposite reaction: the air rushes back, so the balloon zooms forward!', duration: 4500,
      draw: (t, ms) => {
        const x = lerp(90, 330, ease(seg(t, 0.1, 0.9)))
        return (
          <>
            <g transform={`translate(${x} 120) rotate(90)`}><Emoji x={0} y={0} size={56}>🎈</Emoji></g>
            {Array.from({ length: 5 }, (_, k) => {
              const p = loop(ms, 900, k * 180)
              return <circle key={k} cx={x - 40 - p * 70} cy={122 + (k - 2) * 6 * p} r={6 * (1 - p) + 2} fill="#adb5bd" opacity={1 - p} />
            })}
            <Arrow x1={x + 40} y1={175} x2={x + 90} y2={175} color={C.green} />
          </>
        )
      } },
  ],
}

// ------------------------------------------------------------------ light

function Ray({ points, p = 1, color = C.yellow, ms = 0 }) {
  const end = along(points, p), lens = []
  let acc = 0
  for (let i = 1; i < points.length; i++) { acc += Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]); lens.push(acc) }
  const shown = [points[0], ...points.slice(1).filter((_, i) => lens[i] <= p * acc), end]
  return <polyline points={pts(shown)} fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" strokeDasharray="14 6" strokeDashoffset={-ms / 20} />
}

const lightRay = {
  title: 'How light travels',
  frames: [
    { caption: 'Light travels in straight lines.', duration: 3000,
      draw: (t, ms) => <><rect x="20" y="118" width="50" height="24" rx="5" fill={C.ink} /><rect x="66" y="112" width="12" height="36" rx="3" fill="#868e96" /><Ray points={[[80, 130], [385, 130]]} p={ease(seg(t, 0.1, 0.7))} ms={ms} /></> },
    { caption: 'Light bounces off a mirror. The angle going in is equal to the angle coming out.', duration: 5000,
      draw: (t, ms) => (
        <>
          <rect x="110" y="200" width="180" height="10" fill="#ced4da" stroke={C.muted} />
          <line x1="200" y1="200" x2="200" y2="60" stroke={C.muted} strokeDasharray="5 5" />
          <Ray points={[[60, 60], [200, 200], [340, 60]]} p={ease(seg(t, 0.05, 0.75))} ms={ms} />
          <path d="M200,160 A40,40 0 0 0 172,172" fill="none" stroke={C.orange} strokeWidth="3" opacity={seg(t, 0.75, 0.9)} />
          <path d="M200,160 A40,40 0 0 1 228,172" fill="none" stroke={C.orange} strokeWidth="3" opacity={seg(t, 0.75, 0.9)} />
          <Label x={200} y={238} size={15} color={C.orange} show={seg(t, 0.8, 1)}>angle in = angle out</Label>
        </>
      ) },
    { caption: 'When light goes into water or glass it slows down and bends.', duration: 4500,
      draw: (t, ms) => (
        <>
          <rect x="0" y="140" width="400" height="120" fill="#a5d8ff" opacity="0.6" />
          <line x1="200" y1="60" x2="200" y2="240" stroke={C.muted} strokeDasharray="5 5" />
          <Ray points={[[80, 40], [200, 140], [250, 250]]} p={ease(seg(t, 0.05, 0.85))} ms={ms} />
          <Label x={320} y={200} size={15} color={C.blue} show={seg(t, 0.7, 0.9)}>bends here!</Label>
        </>
      ) },
    { caption: 'A lens bends light so the rays meet at one point, the focus. Your eye has a lens just like this!', duration: 5000,
      draw: (t, ms) => (
        <>
          <ellipse cx="200" cy="130" rx="14" ry="85" fill="#d0ebff" stroke={C.blue} strokeWidth="2" />
          {[75, 130, 185].map((y, k) => <Ray key={k} points={[[30, y], [200, y], [310, 130]]} p={ease(seg(t, 0.05 + k * 0.05, 0.8))} ms={ms} />)}
          <circle cx="310" cy="130" r={6 + 3 * Math.sin(ms / 150)} fill={C.orange} opacity={seg(t, 0.75, 0.9)} />
          <Label x={310} y={105} size={14} color={C.orange} show={seg(t, 0.8, 1)}>focus</Label>
          <Emoji x={370} y={130} size={30} opacity={seg(t, 0.85, 1)}>👁️</Emoji>
        </>
      ) },
  ],
}

// ------------------------------------------------------------------ sound

const waves = (ms, x, y, max = 260, speed = 12) => Array.from({ length: 6 }, (_, k) => {
  const r = (ms / speed + k * (max / 6)) % max
  return <path key={k} d={`M${x + r * Math.cos(rad(-40))},${y + r * Math.sin(rad(-40))} A${r},${r} 0 0 1 ${x + r * Math.cos(rad(40))},${y + r * Math.sin(rad(40))}`} fill="none" stroke={C.primary} strokeWidth="3" opacity={1 - r / max} />
})
const sineWave = (y, freq, amp, ms) => Array.from({ length: 81 }, (_, k) => `${40 + k * 4},${y + amp * Math.sin(k * freq - ms / 150)}`).join(' ')

const soundWave = {
  title: 'Waves you can hear',
  frames: [
    { caption: 'Sound starts with a vibration. Hit a drum and it shakes very fast.', duration: 3000,
      draw: (t, ms) => <Emoji x={90} y={130} size={80} scale={1 + 0.06 * Math.sin(ms / 25) * seg(t, 0.2, 0.4)}>🥁</Emoji> },
    { caption: 'The vibration pushes the air and makes waves that spread out in every direction.', duration: 4500,
      draw: (t, ms) => <><Emoji x={90} y={130} size={80} scale={1 + 0.06 * Math.sin(ms / 25)}>🥁</Emoji><g opacity={seg(t, 0, 0.3)}>{waves(ms, 120, 130)}</g></> },
    { caption: 'When the waves reach your ear, you hear the sound.', duration: 4500,
      draw: (t, ms) => <><Emoji x={90} y={130} size={80} scale={1 + 0.06 * Math.sin(ms / 25)}>🥁</Emoji>{waves(ms, 120, 130, 220)}<Emoji x={350} y={130} size={50} scale={1 + 0.08 * Math.max(0, Math.sin(ms / 120))}>👂</Emoji></> },
    { caption: 'Fast vibrations make a high sound. Slow vibrations make a low sound. Bigger waves are louder.', duration: 5000,
      draw: (t, ms) => (
        <>
          <polyline points={sineWave(70, 0.6, 22, ms)} fill="none" stroke={C.orange} strokeWidth="3" />
          <polyline points={sineWave(185, 0.15, 30, ms)} fill="none" stroke={C.blue} strokeWidth="3" />
          <Label x={200} y={30} size={14} color={C.orange}>high pitch 🐦</Label>
          <Label x={200} y={238} size={14} color={C.blue}>low pitch 🐘</Label>
        </>
      ) },
  ],
}

// ------------------------------------------------------------------ magnets

function BarMagnet({ x, y = 130, w = 160, flip = false, labels = true }) {
  const left = flip ? ['S', C.blue] : ['N', C.red], right = flip ? ['N', C.red] : ['S', C.blue]
  return (
    <g>
      <rect x={x - w / 2} y={y - 20} width={w / 2} height="40" fill={left[1]} rx="4" />
      <rect x={x} y={y - 20} width={w / 2} height="40" fill={right[1]} rx="4" />
      {labels && <><Label x={x - w / 4} y={y + 1} size={18} color="#fff">{left[0]}</Label><Label x={x + w / 4} y={y + 1} size={18} color="#fff">{right[0]}</Label></>}
    </g>
  )
}

const magnet = {
  title: 'Magnets pull and push',
  frames: [
    { caption: 'A magnet has two ends: a North pole and a South pole.', duration: 3000,
      draw: (t) => <g opacity={seg(t, 0, 0.4)}><BarMagnet x={200} /></g> },
    { caption: 'Iron filings show the invisible magnetic field curving from one pole to the other.', duration: 5000,
      draw: (t) => (
        <>
          {[1, 2, 3].map((k) => [-1, 1].map((s) => (
            <path key={`${k}${s}`} d={`M125,130 C150,${130 + s * 45 * k} 250,${130 + s * 45 * k} 275,130`} fill="none" stroke={C.muted} strokeWidth="2"
                  strokeDasharray="6 6" strokeDashoffset={-t * 80} opacity={seg(t, 0.1 * k, 0.1 * k + 0.4)} />
          )))}
          <BarMagnet x={200} />
        </>
      ) },
    { caption: 'Opposite poles pull towards each other and snap together!', duration: 4000,
      draw: (t) => {
        const p = ease(seg(t, 0.1, 0.6)) ** 2
        return (
          <>
            <BarMagnet x={lerp(90, 148, p)} w={100} />
            <BarMagnet x={lerp(310, 252, p)} w={100} />
            {t > 0.6 && <Emoji x={200} y={95} size={26} scale={pop(seg(t, 0.6, 0.75))}>✨</Emoji>}
            <Label x={200} y={200} size={15} color={C.green} show={seg(t, 0.65, 0.85)}>S + N attract</Label>
          </>
        )
      } },
    { caption: 'The same poles push each other away.', duration: 4000,
      draw: (t) => {
        const p = ease(seg(t, 0.15, 0.7))
        return (
          <>
            <BarMagnet x={lerp(148, 80, p)} w={100} />
            <BarMagnet x={lerp(252, 320, p)} w={100} flip />
            <Label x={200} y={200} size={15} color={C.red} show={seg(t, 0.5, 0.75)}>S + S repel</Label>
          </>
        )
      } },
  ],
}

// ------------------------------------------------------------------ breathing

const AIR_IN = [[200, 20], [200, 95], [178, 120]]
const TO_CELL = [[215, 140], [300, 150], [320, 205]]
function Body({ ms, breathe = true }) {
  const b = breathe ? 1 + 0.12 * Math.sin(ms / 500) : 1
  return (
    <>
      <rect x="130" y="30" width="140" height="200" rx="60" fill="#fff4e6" stroke="#ffc078" strokeWidth="2" />
      <line x1="200" y1="20" x2="200" y2="95" stroke="#ffa8a8" strokeWidth="8" strokeLinecap="round" />
      <ellipse cx="175" cy="130" rx={22 * b} ry={40 * b} fill="#ffa8a8" />
      <ellipse cx="225" cy="130" rx={22 * b} ry={40 * b} fill="#ffa8a8" />
      <Emoji x={205} y={180} size={22} scale={1 + 0.08 * Math.max(0, Math.sin(ms / 160))}>❤️</Emoji>
    </>
  )
}
const Dots = ({ path, ms, color, n = 5, period = 2200 }) => Array.from({ length: n }, (_, k) => {
  const [x, y] = along(path, loop(ms, period, (k * period) / n))
  return <circle key={k} cx={x} cy={y} r="5" fill={color} />
})

const breathing = {
  title: 'Breathing in and out',
  frames: [
    { caption: 'We breathe in air through the nose. The lungs fill up like balloons.', duration: 4500,
      draw: (t, ms) => <><Body ms={ms} /><Dots path={AIR_IN} ms={ms} color={C.blue} /></> },
    { caption: 'In the lungs, oxygen from the air passes into the blood.', duration: 4500,
      draw: (t, ms) => <><Body ms={ms} /><Dots path={[[180, 130], [205, 175]]} ms={ms} color={C.blue} n={4} /><Label x={330} y={80} size={14} color={C.blue}>oxygen (O₂)</Label></> },
    { caption: 'The blood carries oxygen to every cell. Cells use it to get energy from food.', duration: 5000,
      draw: (t, ms) => (
        <>
          <Body ms={ms} />
          <polyline points={pts(TO_CELL)} fill="none" stroke={C.red} strokeWidth="5" opacity="0.5" />
          <Dots path={TO_CELL} ms={ms} color={C.red} />
          <circle cx="330" cy="215" r="18" fill="#d3f9d8" stroke={C.green} />
          <Emoji x={330} y={215} size={18} scale={1 + 0.2 * Math.sin(ms / 120)}>⚡</Emoji>
        </>
      ) },
    { caption: 'Carbon dioxide is made in the cells. It goes back to the lungs, and we breathe it out.', duration: 4500,
      draw: (t, ms) => <><Body ms={ms} /><Dots path={[[320, 205], [300, 150], [225, 130], [200, 95], [200, 10]]} ms={ms} color="#868e96" /><Label x={330} y={60} size={14} color="#868e96">carbon dioxide (CO₂)</Label></> },
  ],
}

// ------------------------------------------------------------------ cell division

function Cell({ x, y, r, ms = 0, chromos = 1, split = 0 }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill="#d3f9d8" stroke={C.green} strokeWidth="3" />
      <circle cx={x} cy={y} r={r * 0.35} fill="#e5dbff" stroke="#9c36b5" strokeWidth="2" />
      {Array.from({ length: chromos }, (_, k) => {
        const off = (k - (chromos - 1) / 2) * r * 0.18 * (1 + split)
        return <g key={k} transform={`translate(${x + off} ${y}) rotate(${20 + k * 30})`}><line x1="-6" y1="-6" x2="6" y2="6" stroke="#9c36b5" strokeWidth="3" /><line x1="-6" y1="6" x2="6" y2="-6" stroke="#9c36b5" strokeWidth="3" /></g>
      })}
      {[0, 1, 2].map((k) => <ellipse key={k} cx={x + r * 0.6 * Math.cos(ms / 900 + k * 2)} cy={y + r * 0.6 * Math.sin(ms / 900 + k * 2)} rx="6" ry="3.5" fill="#ffa94d" />)}
    </g>
  )
}

const cellDivision = {
  title: 'One cell becomes two',
  frames: [
    { caption: 'This is a cell, the tiny building block of every living thing.', duration: 3500,
      draw: (t, ms) => <g transform={`translate(200 130) scale(${sc(pop(seg(t, 0, 0.5)))}) translate(-200 -130)`}><Cell x={200} y={130} r={70} ms={ms} /></g> },
    { caption: 'The cell grows bigger and makes a copy of its DNA.', duration: 4000,
      draw: (t, ms) => <Cell x={200} y={130} r={lerp(70, 85, seg(t, 0, 0.5))} ms={ms} chromos={t > 0.5 ? 4 : 2} split={seg(t, 0.5, 0.9)} /> },
    { caption: 'Then it pinches in the middle and splits into two cells.', duration: 4500,
      draw: (t, ms) => {
        const d = lerp(0, 75, ease(seg(t, 0.1, 0.85))), r = lerp(85, 62, ease(seg(t, 0.1, 0.85)))
        return <><Cell x={200 - d} y={130} r={r} ms={ms} chromos={2} /><Cell x={200 + d} y={130} r={r} ms={ms + 500} chromos={2} /></>
      } },
    { caption: 'Two new cells, and each can divide again! This is how we grow and heal.', duration: 4500,
      draw: (t, ms) => {
        const d = lerp(0, 45, ease(seg(t, 0.2, 0.8))), r = lerp(62, 42, ease(seg(t, 0.2, 0.8)))
        return [125, 275].map((cx) => [-1, 1].map((s) => <Cell key={`${cx}${s}`} x={cx} y={130 + s * d} r={r} ms={ms + cx} chromos={2} />))
      } },
  ],
}

// ------------------------------------------------------------------ heredity

function Flower({ x, y, color, s = 1 }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${sc(s)})`}>
      <line x1="0" y1="10" x2="0" y2="50" stroke={C.green} strokeWidth="4" />
      {Array.from({ length: 5 }, (_, k) => <circle key={k} cx={14 * Math.cos(rad(k * 72))} cy={14 * Math.sin(rad(k * 72))} r="11" fill={color} stroke="#adb5bd" />)}
      <circle r="7" fill={C.yellow} />
    </g>
  )
}
const PURPLE = '#9c36b5', WHITE = '#ffffff'
const Gene = ({ x, y, v }) => <g transform={`translate(${x} ${y})`}><rect x="-13" y="-13" width="26" height="26" rx="6" fill={v === 'P' ? PURPLE : '#f1f3f5'} stroke={PURPLE} /><Label x={0} y={1} size={15} color={v === 'P' ? '#fff' : PURPLE}>{v}</Label></g>

const heredity = {
  title: 'Passing on genes',
  frames: [
    { caption: 'Parents pass instructions called genes to their children. They decide things like flower colour.', duration: 4000,
      draw: (t) => <><Flower x={100} y={70} color={PURPLE} s={pop(seg(t, 0, 0.4))} /><Flower x={300} y={70} color={WHITE} s={pop(seg(t, 0.2, 0.6))} /><Label x={100} y={145} size={14} show={seg(t, 0.4, 0.6)}>PP</Label><Label x={300} y={145} size={14} show={seg(t, 0.5, 0.7)}>pp</Label></> },
    { caption: 'Each parent gives one copy of each gene. The child gets P from one and p from the other.', duration: 4500,
      draw: (t) => {
        const p = ease(seg(t, 0.1, 0.6))
        return (
          <>
            <Flower x={100} y={70} color={PURPLE} /><Flower x={300} y={70} color={WHITE} />
            <Gene x={lerp(100, 185, p)} y={lerp(150, 200, p)} v="P" /><Gene x={lerp(300, 215, p)} y={lerp(150, 200, p)} v="p" />
            <Flower x={200} y={140} color={PURPLE} s={pop(seg(t, 0.65, 0.9))} />
          </>
        )
      } },
    { caption: 'If both parents are Pp, a square helps us predict the children: PP, Pp, Pp and pp.', duration: 5500,
      draw: (t) => {
        const cells = [['P', 'P'], ['P', 'p'], ['p', 'P'], ['p', 'p']]
        return (
          <>
            <Gene x={175} y={45} v="P" /><Gene x={235} y={45} v="p" /><Gene x={120} y={95} v="P" /><Gene x={120} y={155} v="p" />
            {cells.map(([a, b], k) => (
              <g key={k} opacity={seg(t, k * 0.2, k * 0.2 + 0.2)}>
                <rect x={150 + (k % 2) * 60} y={70 + Math.floor(k / 2) * 60} width="56" height="56" rx="6" fill={a === 'P' || b === 'P' ? '#e5dbff' : '#fff'} stroke={PURPLE} />
                <Label x={178 + (k % 2) * 60} y={98 + Math.floor(k / 2) * 60} size={16} color={PURPLE}>{a === 'P' || b !== 'P' ? a + b : b + a}</Label>
              </g>
            ))}
          </>
        )
      } },
    { caption: 'So 3 out of 4 children have purple flowers, and 1 has white flowers.', duration: 4000,
      draw: (t) => (
        <>
          {[PURPLE, PURPLE, PURPLE, WHITE].map((c, k) => <Flower key={k} x={80 + k * 80} y={90} color={c} s={pop(seg(t, k * 0.15, k * 0.15 + 0.25))} />)}
          <Label x={200} y={205} size={22} color={PURPLE} show={seg(t, 0.7, 0.9)}>3 : 1</Label>
        </>
      ) },
  ],
}

// ------------------------------------------------------------------ chemical reactions in beakers

function Beaker({ x, y = 150, level = 0.6, color = C.blue, tilt = 0 }) {
  const h = 90, w = 70
  return (
    <g transform={`rotate(${tilt} ${x + w / 2} ${y - h / 2})`}>
      <rect x={x - w / 2} y={y - h / 2 + h * (1 - level)} width={w} height={h * level} fill={color} opacity="0.75" />
      <path d={`M${x - w / 2},${y - h / 2} L${x - w / 2},${y + h / 2} L${x + w / 2},${y + h / 2} L${x + w / 2},${y - h / 2}`} fill="none" stroke={C.muted} strokeWidth="3" />
    </g>
  )
}
const mix = (a, b, f) => {
  const pa = a.match(/\w\w/g).map((h) => parseInt(h, 16)), pb = b.match(/\w\w/g).map((h) => parseInt(h, 16))
  return `rgb(${pa.map((v, i) => Math.round(lerp(v, pb[i], f))).join(',')})`
}

const reaction = {
  title: 'Making something new',
  frames: [
    { caption: 'Here are two different liquids in two beakers.', duration: 3000,
      draw: (t) => <g opacity={seg(t, 0, 0.4)}><Beaker x={120} color={C.blue} /><Beaker x={280} color="#ffe066" level={0.4} /></g> },
    { caption: 'Pour one into the other…', duration: 4000,
      draw: (t) => {
        const tilt = lerp(0, 75, ease(seg(t, 0, 0.35))), flow = seg(t, 0.3, 0.9)
        return (
          <>
            <Beaker x={lerp(120, 175, ease(seg(t, 0, 0.3)))} y={lerp(150, 90, ease(seg(t, 0, 0.3)))} tilt={tilt} level={0.6 * (1 - flow)} />
            {flow > 0 && flow < 1 && <path d="M228,80 Q262,95 262,150" fill="none" stroke={C.blue} strokeWidth="6" opacity="0.7" />}
            <Beaker x={280} color={mix('ffe066', '74c0fc', flow)} level={0.4 + 0.4 * flow} />
          </>
        )
      } },
    { caption: 'Bubbles, a new colour or heat are signs that a new substance has formed. That is a chemical reaction!', duration: 5000,
      draw: (t, ms) => (
        <>
          <Beaker x={200} color={mix('74c0fc', 'f783ac', ease(seg(t, 0.05, 0.5)))} level={0.8} />
          {Array.from({ length: 8 }, (_, k) => {
            const p = loop(ms, 1500, k * 190)
            return <circle key={k} cx={180 + (k % 4) * 13} cy={lerp(190, 120, p)} r={3 + 2 * p} fill="#fff" stroke="#f06595" opacity={(1 - p) * seg(t, 0.2, 0.4)} />
          })}
          {[0, 1, 2].map((k) => <path key={k} d={`M${185 + k * 15},95 q5,-8 0,-16 q-5,-8 0,-16`} fill="none" stroke={C.orange} strokeWidth="2" opacity={seg(t, 0.5, 0.7) * (0.5 + 0.5 * Math.sin(ms / 200 + k))} />)}
        </>
      ) },
    { caption: 'In a reaction, atoms swap partners to make new substances. No atoms are lost: AB + CD → AD + CB.', duration: 5000,
      draw: (t) => {
        const p = ease(seg(t, 0.2, 0.75))
        const atoms = [
          { c: C.red, l: 'A', from: [80, 120], to: [250, 90] }, { c: C.blue, l: 'B', from: [110, 120], to: [310, 160] },
          { c: C.green, l: 'C', from: [160, 120], to: [280, 160] }, { c: C.yellow, l: 'D', from: [190, 120], to: [280, 90] },
        ]
        return (
          <>
            {atoms.map((a, k) => <g key={k} transform={`translate(${lerp(a.from[0], a.to[0], p)} ${lerp(a.from[1], a.to[1], p) - Math.sin(p * Math.PI) * 30})`}><circle r="15" fill={a.c} /><Label x={0} y={1} size={13} color="#fff">{a.l}</Label></g>)}
            <Label x={200} y={215} size={17} show={seg(t, 0.75, 0.95)}>AB + CD → AD + CB</Label>
          </>
        )
      } },
  ],
}

// ------------------------------------------------------------------ heat

function Particles({ x, y, w, h, speed, n = 10, color = C.red, ms }) {
  return Array.from({ length: n }, (_, k) => (
    <circle key={k} cx={x + 8 + reflect(k * 37 + (ms / 20) * speed * (1 + (k % 3) * 0.3), 0, w - 16)} cy={y + 8 + reflect(k * 53 + (ms / 25) * speed * (1 + (k % 2) * 0.4), 0, h - 16)} r="6" fill={color} />
  ))
}
const Flame = ({ x, y, ms }) => <Emoji x={x} y={y} size={36} scale={1 + 0.08 * Math.sin(ms / 90)}>🔥</Emoji>

const heat = {
  title: 'Heat on the move',
  frames: [
    { caption: 'Heating makes the tiny particles inside move faster and faster. The thermometer rises.', duration: 5000,
      draw: (t, ms) => (
        <>
          <rect x="110" y="60" width="120" height="120" fill="#f8f9fa" stroke={C.muted} strokeWidth="3" />
          <Particles x={110} y={60} w={120} h={120} speed={lerp(0.3, 3, t)} ms={ms * (0.5 + t)} color={mix('74c0fc', 'ff6b6b', t)} />
          <Flame x={170} y={210} ms={ms} />
          <rect x="300" y="50" width="16" height="150" rx="8" fill="#fff" stroke={C.muted} />
          <rect x="303" y={197 - 140 * lerp(0.2, 0.9, t)} width="10" height={140 * lerp(0.2, 0.9, t)} rx="5" fill={C.red} />
        </>
      ) },
    { caption: 'Heat always flows from hot things to cold things.', duration: 4500,
      draw: (t, ms) => (
        <>
          <Emoji x={90} y={130} size={70}>☕</Emoji>
          <Emoji x={310} y={130} size={60} scale={lerp(1, 0.7, seg(t, 0.3, 1))}>🧊</Emoji>
          {Array.from({ length: 4 }, (_, k) => {
            const p = loop(ms, 1600, k * 400)
            return <path key={k} d={`M${lerp(140, 260, p)},${110 + k * 12} q8,-8 16,0 q8,8 16,0`} fill="none" stroke={C.orange} strokeWidth="3" opacity={1 - p} />
          })}
        </>
      ) },
    { caption: 'In water and air, warm parts rise and cool parts sink, going round and round. This is convection.', duration: 5000,
      draw: (t, ms) => (
        <>
          <rect x="120" y="50" width="160" height="140" rx="10" fill="#d0ebff" stroke={C.muted} strokeWidth="3" />
          <Dots path={[[200, 180], [200, 70], [140, 70], [140, 180], [200, 180]]} ms={ms} color={C.red} n={8} period={4000} />
          <Dots path={[[200, 180], [200, 70], [260, 70], [260, 180], [200, 180]]} ms={ms + 2000} color={C.blue} n={8} period={4000} />
          <Flame x={200} y={215} ms={ms} />
        </>
      ) },
    { caption: "The Sun's heat travels through empty space to reach us. This is radiation.", duration: 4000,
      draw: (t, ms) => (
        <>
          <rect x="0" y="0" width="400" height="260" fill="#0b1640" opacity={seg(t, 0, 0.3) * 0.85} />
          <Sun x={60} y={130} ms={ms} />
          {Array.from({ length: 5 }, (_, k) => {
            const p = loop(ms, 1500, k * 300)
            return <path key={k} d={`M${lerp(100, 300, p)},${130 + (k - 2) * 14} q6,-6 12,0 q6,6 12,0`} fill="none" stroke={C.yellow} strokeWidth="3" />
          })}
          <Emoji x={340} y={130} size={56}>🌍</Emoji>
        </>
      ) },
  ],
}

// ------------------------------------------------------------------ separating mixtures

const separation = {
  title: 'Separating a mixture',
  frames: [
    { caption: 'A mixture has different things mixed together, like sand stirred into water.', duration: 4000,
      draw: (t, ms) => <><Beaker x={200} color={C.blue} level={0.7} />{Array.from({ length: 14 }, (_, k) => <circle key={k} cx={175 + reflect(k * 17 + ms / 30, 0, 50)} cy={135 + reflect(k * 23 + ms / 40, 0, 50)} r="3.5" fill={C.crust} />)}</> },
    { caption: 'Filtering: pour it through filter paper. The water passes through, the sand stays behind.', duration: 5000,
      draw: (t, ms) => (
        <>
          <polygon points="150,40 250,40 200,110" fill="#f1f3f5" stroke={C.muted} strokeWidth="2" />
          {Array.from({ length: 12 }, (_, k) => <circle key={k} cx={180 + (k % 6) * 8} cy={60 + Math.floor(k / 6) * 10} r="3.5" fill={C.crust} />)}
          {Array.from({ length: 3 }, (_, k) => <circle key={k} cx="200" cy={lerp(115, 175, loop(ms, 900, k * 300))} r="4" fill={C.blue} />)}
          <Beaker x={200} y={200} color={C.blue} level={0.2 + 0.4 * t} />
        </>
      ) },
    { caption: 'Evaporation: heat salty water. The water goes into the air, and the salt is left behind.', duration: 5000,
      draw: (t, ms) => (
        <>
          <path d="M120,150 Q200,200 280,150 Z" fill={mix('74c0fc', 'f8f9fa', seg(t, 0.1, 0.8))} stroke={C.muted} strokeWidth="3" />
          {Array.from({ length: 10 }, (_, k) => <rect key={k} x={150 + k * 10} y={158 + (k % 3) * 4} width="6" height="6" fill="#fff" stroke="#adb5bd" opacity={seg(t, 0.4 + k * 0.04, 0.6 + k * 0.04)} />)}
          {Array.from({ length: 5 }, (_, k) => {
            const p = loop(ms, 2000, k * 400)
            return <circle key={k} cx={160 + k * 20 + 6 * Math.sin(ms / 300 + k)} cy={lerp(145, 40, p)} r="5" fill="#fff" stroke={C.blue} opacity={(1 - p) * (1 - seg(t, 0.8, 1))} />
          })}
          <Flame x={200} y={215} ms={ms} />
        </>
      ) },
    { caption: 'A magnet pulls iron pieces out of a mixture.', duration: 4000,
      draw: (t) => (
        <>
          <g transform={`translate(0 ${lerp(-20, 0, ease(seg(t, 0, 0.3)))})`}><BarMagnet x={200} y={50} w={120} /></g>
          {Array.from({ length: 16 }, (_, k) => {
            const iron = k % 2 === 0, p = iron ? ease(seg(t, 0.3 + k * 0.02, 0.6 + k * 0.02)) : 0
            return <circle key={k} cx={lerp(130 + k * 9, 160 + (k % 8) * 10, p)} cy={lerp(205 - (k % 3) * 8, 78, p)} r="4.5" fill={iron ? '#495057' : C.yellow} />
          })}
        </>
      ) },
  ],
}

// ------------------------------------------------------------------ nutrients

const FOODS = [{ e: '🍚', box: 0 }, { e: '🥑', box: 0 }, { e: '🥚', box: 1 }, { e: '🥕', box: 2 }, { e: '🥛', box: 2 }]
const BOXES = [{ x: 80, l: 'Energy ⚡' }, { x: 200, l: 'Growth 💪' }, { x: 320, l: 'Health 🛡️' }]
const nutrients = {
  title: 'What food does for us',
  frames: [
    { caption: 'Food contains nutrients. Each nutrient has a special job in our body.', duration: 3500,
      draw: (t) => <><circle cx="200" cy="130" r="95" fill="#fff" stroke="#dee2e6" strokeWidth="6" />{FOODS.map((f, k) => <Emoji key={k} x={200 + 55 * Math.cos(k * 1.256)} y={130 + 55 * Math.sin(k * 1.256)} size={36} scale={pop(seg(t, k * 0.15, k * 0.15 + 0.3))}>{f.e}</Emoji>)}</> },
    { caption: 'Carbohydrates and fats give us energy. Proteins help our body grow and repair itself.', duration: 4500,
      draw: (t) => sortFoods(t, [0, 1]) },
    { caption: 'Vitamins and minerals protect us and keep us healthy.', duration: 4000, draw: (t) => sortFoods(t, [2]) },
    { caption: 'A balanced diet has a little of everything, in the right amounts.', duration: 4000,
      draw: (t) => (
        <>
          {[['#ffd43b', 0, 120], ['#ff8787', 120, 210], ['#69db7c', 210, 300], ['#74c0fc', 300, 360]].map(([c, a0, a1], k) => (
            <path key={k} d={`M200,130 L${200 + 90 * Math.sin(rad(a0))},${130 - 90 * Math.cos(rad(a0))} A90,90 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${200 + 90 * Math.sin(rad(a1))},${130 - 90 * Math.cos(rad(a1))} Z`} fill={c} opacity={seg(t, k * 0.2, k * 0.2 + 0.2)} stroke="#fff" strokeWidth="3" />
          ))}
          <Emoji x={200} y={130} size={34} scale={pop(seg(t, 0.8, 1))}>😋</Emoji>
        </>
      ) },
  ],
}
function sortFoods(t, boxesNow) {
  return (
    <>
      {BOXES.map((b, k) => <g key={k}><rect x={b.x - 55} y="150" width="110" height="80" rx="10" fill="#f8f9fa" stroke="#ced4da" /><Label x={b.x} y={245} size={13}>{b.l}</Label></g>)}
      {FOODS.map((f, k) => {
        const moving = boxesNow.includes(f.box), done = f.box < Math.min(...boxesNow)
        const p = done ? 1 : moving ? ease(seg(t, 0.1, 0.7)) : 0
        const slot = FOODS.filter((g, j) => g.box === f.box && j < k).length
        return <Emoji key={k} x={lerp(80 + k * 60, BOXES[f.box].x - 20 + slot * 40, p)} y={lerp(70, 190, p)} size={34}>{f.e}</Emoji>
      })}
    </>
  )
}

// ------------------------------------------------------------------ germs

const GERMS = Array.from({ length: 6 }, (_, k) => ({ x: 160 + (k % 3) * 40, y: 100 + Math.floor(k / 3) * 50 }))
const germs = {
  title: 'Tiny germs',
  frames: [
    { caption: 'Germs are tiny living things, too small to see without a microscope.', duration: 4000,
      draw: (t, ms) => (
        <>
          <circle cx="200" cy="125" r="95" fill="#f8f9fa" stroke={C.muted} strokeWidth="8" opacity={seg(t, 0, 0.3)} />
          <line x1="268" y1="192" x2="330" y2="250" stroke={C.muted} strokeWidth="14" strokeLinecap="round" opacity={seg(t, 0, 0.3)} />
          {GERMS.map((g, k) => <Emoji key={k} x={g.x + 6 * Math.sin(ms / 300 + k)} y={g.y + 6 * Math.cos(ms / 350 + k)} size={28} scale={pop(seg(t, 0.3 + k * 0.08, 0.5 + k * 0.08))}>🦠</Emoji>)}
        </>
      ) },
    { caption: 'Some germs make us ill. They spread through dirty hands, dirty water and coughs.', duration: 4500,
      draw: (t, ms) => (
        <>
          <Emoji x={80} y={140} size={70}>✋</Emoji>
          <Emoji x={320} y={140} size={70}>🧑</Emoji>
          {[0, 1, 2].map((k) => {
            const p = ease(seg(t, 0.2 + k * 0.15, 0.6 + k * 0.15))
            return <Emoji key={k} x={lerp(85 + k * 10, 310, p)} y={lerp(130, 120, p) - Math.sin(p * Math.PI) * 70} size={22}>🦠</Emoji>
          })}
          <Emoji x={340} y={95} size={26} opacity={seg(t, 0.85, 1)}>🤒</Emoji>
        </>
      ) },
    { caption: 'Our body has defenders called white blood cells. They fight the germs.', duration: 4500,
      draw: (t, ms) => (
        <>
          {GERMS.map((g, k) => <Emoji key={k} x={g.x + 6 * Math.sin(ms / 300 + k)} y={g.y} size={28} scale={1 - seg(t, 0.4 + k * 0.08, 0.55 + k * 0.08)}>🦠</Emoji>)}
          {[0, 1].map((k) => {
            const p = ease(seg(t, 0.05, 0.9))
            return <Emoji key={k} x={lerp(k ? 380 : 20, k ? 260 : 140, p)} y={k ? 150 : 100} size={40}>🛡️</Emoji>
          })}
        </>
      ) },
    { caption: 'Washing hands with soap and getting vaccines help keep germs away.', duration: 4500,
      draw: (t, ms) => (
        <>
          <Emoji x={110} y={140} size={60}>🧼</Emoji>
          {Array.from({ length: 8 }, (_, k) => {
            const p = loop(ms, 2000, k * 250)
            return <circle key={k} cx={110 + (k - 4) * 12 + 10 * Math.sin(ms / 400 + k)} cy={lerp(110, 30, p)} r={4 + 6 * p} fill="none" stroke={C.blue} opacity={1 - p} />
          })}
          <Emoji x={290} y={140} size={60} scale={pop(seg(t, 0.4, 0.7))}>💉</Emoji>
          <Emoji x={200} y={210} size={40} scale={pop(seg(t, 0.7, 0.95))}>💪</Emoji>
        </>
      ) },
  ],
}

// ------------------------------------------------------------------ energy

const valley = (x) => 210 - 140 * ((x - 200) / 160) ** 2
function Coaster({ x, ms }) {
  const y = valley(x), pe = (210 - y) / 140, moving = 1 - pe
  return (
    <>
      <polyline points={Array.from({ length: 41 }, (_, k) => `${40 + k * 8},${valley(40 + k * 8) + 12}`).join(' ')} fill="none" stroke={C.muted} strokeWidth="4" />
      <circle cx={x} cy={y} r="12" fill={C.primary} />
      <rect x="320" y={30} width="24" height="80" fill="#f1f3f5" /><rect x="320" y={30 + 80 * (1 - pe)} width="24" height={80 * pe} fill={C.blue} />
      <rect x="352" y={30} width="24" height="80" fill="#f1f3f5" /><rect x="352" y={30 + 80 * (1 - moving)} width="24" height={80 * moving} fill={C.orange} />
      <Label x={332} y={122} size={10} color={C.blue}>stored</Label><Label x={364} y={122} size={10} color={C.orange}>moving</Label>
    </>
  )
}
function Turbine({ x, y, ms }) {
  return (
    <g>
      <line x1={x} y1={y} x2={x} y2={y + 70} stroke={C.muted} strokeWidth="4" />
      {[0, 1, 2].map((k) => <line key={k} x1={x} y1={y} x2={x + 30 * Math.cos(ms / 200 + (k * 2 * Math.PI) / 3)} y2={y + 30 * Math.sin(ms / 200 + (k * 2 * Math.PI) / 3)} stroke={C.ink} strokeWidth="5" strokeLinecap="round" />)}
    </g>
  )
}

const energy = {
  title: 'Energy changes form',
  frames: [
    { caption: 'Lift a ball up high. Now it has stored energy, ready to be used.', duration: 3500,
      draw: (t, ms) => <Coaster x={lerp(200, 45, ease(seg(t, 0.1, 0.8)))} ms={ms} /> },
    { caption: 'Let it roll. The stored energy turns into moving energy. It is fastest at the bottom.', duration: 4000,
      draw: (t, ms) => <Coaster x={lerp(45, 200, seg(t, 0.05, 0.9) ** 1.6)} ms={ms} /> },
    { caption: 'It rolls up the other side and back again. Energy changes form, but it is never lost.', duration: 5000,
      draw: (t, ms) => <Coaster x={200 - 155 * Math.cos(Math.PI * 2 * t + Math.PI)} ms={ms} /> },
    { caption: 'Energy comes from many sources: the Sun, the wind, flowing water and fuels.', duration: 4500,
      draw: (t, ms) => (
        <>
          <g opacity={seg(t, 0, 0.2)}><Sun x={60} y={110} ms={ms} /></g>
          <g opacity={seg(t, 0.2, 0.4)}><Turbine x={160} y={90} ms={ms} /></g>
          <Emoji x={250} y={120} size={44} scale={pop(seg(t, 0.4, 0.6))}>🌊</Emoji>
          <Emoji x={340} y={120} size={44} scale={pop(seg(t, 0.6, 0.8))}>⛽</Emoji>
          {['Sun', 'wind', 'water', 'fuel'].map((l, k) => <Label key={l} x={[60, 160, 250, 340][k]} y={200} size={14} show={seg(t, k * 0.2 + 0.1, k * 0.2 + 0.25)}>{l}</Label>)}
        </>
      ) },
  ],
}

// ------------------------------------------------------------------ the periodic table

const ELEMENTS = [['H', 0, 0], ['He', 7, 0], ['Li', 0, 1], ['Be', 1, 1], ['B', 2, 1], ['C', 3, 1], ['N', 4, 1], ['O', 5, 1], ['F', 6, 1], ['Ne', 7, 1],
  ['Na', 0, 2], ['Mg', 1, 2], ['Al', 2, 2], ['Si', 3, 2], ['P', 4, 2], ['S', 5, 2], ['Cl', 6, 2], ['Ar', 7, 2]]
const METALS = new Set(['Li', 'Be', 'Na', 'Mg', 'Al'])
function Table({ t = 1, family = 0, metals = 0 }) {
  return ELEMENTS.map(([sym, col, row], k) => {
    const p = ease(clamp((t * (ELEMENTS.length + 6) - k) / 6))
    const glow = family && (col === 0 || col === 7)
    const fill = metals ? (METALS.has(sym) ? '#a5d8ff' : sym === 'H' ? '#f1f3f5' : '#ffd8a8') : glow ? '#d3f9d8' : C.soft
    return (
      <g key={sym} transform={`translate(${56 + col * 38} ${lerp(-40, 50 + row * 46, p)})`} opacity={clamp(p * 3)}>
        <rect width="34" height="40" rx="5" fill={fill} stroke={glow ? C.green : C.primary} strokeWidth={glow ? 2.5 : 1.5} />
        <Label x={17} y={21} size={14} color={C.ink}>{sym}</Label>
      </g>
    )
  })
}

const periodic = {
  title: 'The periodic table',
  frames: [
    { caption: 'Every element has its own place in the periodic table, in rows and columns.', duration: 5000, draw: (t) => <Table t={seg(t, 0, 0.9)} /> },
    { caption: 'Elements in the same column are like a family. They behave in similar ways.', duration: 4000,
      draw: (t) => <><Table family={Math.sin(t * 12) > -0.5 ? 1 : 0} /><Label x={74} y={210} size={12} color={C.green}>reactive metals</Label><Label x={340} y={210} size={12} color={C.green}>noble gases</Label></> },
    { caption: 'Metals are on the left. Non-metals are on the right.', duration: 3500,
      draw: (t) => <><Table metals={seg(t, 0.1, 0.3) > 0.5 ? 1 : 0} /><Label x={100} y={210} size={14} color={C.blue} show={seg(t, 0.3, 0.5)}>metals</Label><Label x={280} y={210} size={14} color={C.orange} show={seg(t, 0.4, 0.6)}>non-metals</Label></> },
    { caption: 'Going across a row, the atoms get smaller. Going down a column, they get bigger.', duration: 4500,
      draw: (t) => (
        <>
          {Array.from({ length: 6 }, (_, k) => <circle key={k} cx={60 + k * 55} cy={110} r={lerp(26, 12, k / 5) * pop(seg(t, k * 0.1, k * 0.1 + 0.25))} fill={C.primary} opacity="0.8" />)}
          <Arrow x1={60} y1={170} x2={340} y2={170} progress={seg(t, 0.6, 0.9)} />
          <Label x={200} y={195} size={14} show={seg(t, 0.75, 0.95)}>smaller →</Label>
        </>
      ) },
  ],
}

// ------------------------------------------------------------------ classifying living things

const ANIMALS = [{ e: '🐦', g: 0 }, { e: '🐟', g: 1 }, { e: '🐕', g: 2 }, { e: '🦋', g: 0 }, { e: '🐬', g: 1 }, { e: '🐘', g: 2 }, { e: '🦅', g: 0 }, { e: '🐙', g: 1 }]
const GROUPS = [{ x: 80, l: 'flies' }, { x: 200, l: 'swims' }, { x: 320, l: 'walks' }]
const classify = {
  title: 'Sorting living things',
  frames: [
    { caption: "There are millions of kinds of living things. Let's sort them into groups!", duration: 3500,
      draw: (t, ms) => ANIMALS.map((a, k) => <Emoji key={k} x={60 + (k % 4) * 90 + 8 * Math.sin(ms / 400 + k)} y={80 + Math.floor(k / 4) * 90 + 8 * Math.cos(ms / 500 + k)} size={40} scale={pop(seg(t, k * 0.08, k * 0.08 + 0.3))}>{a.e}</Emoji>) },
    { caption: 'We can group animals by how they move: some fly, some swim, some walk.', duration: 5000,
      draw: (t) => (
        <>
          {GROUPS.map((g, k) => <g key={k}><rect x={g.x - 55} y="120" width="110" height="110" rx="12" fill="#f8f9fa" stroke="#ced4da" /><Label x={g.x} y={245} size={14}>{g.l}</Label></g>)}
          {ANIMALS.map((a, k) => {
            const slot = ANIMALS.filter((b, j) => b.g === a.g && j < k).length, p = ease(seg(t, k * 0.08, k * 0.08 + 0.35))
            return <Emoji key={k} x={lerp(60 + (k % 4) * 90, GROUPS[a.g].x - 25 + (slot % 2) * 50, p)} y={lerp(40 + Math.floor(k / 4) * 40, 150 + Math.floor(slot / 2) * 50, p)} size={34}>{a.e}</Emoji>
          })}
        </>
      ) },
    { caption: 'Scientists sort all living things into a family tree, from big groups to smaller groups.', duration: 5000,
      draw: (t) => {
        const nodes = [{ x: 200, y: 30, l: 'Living things 🌍' }, { x: 110, y: 100, l: 'Plants 🌿' }, { x: 290, y: 100, l: 'Animals 🐾' },
          { x: 230, y: 175, l: 'with backbone 🐕' }, { x: 350, y: 175, l: 'no backbone 🐙' }]
        const edges = [[0, 1], [0, 2], [2, 3], [2, 4]]
        return (
          <>
            {edges.map(([a, b], k) => <line key={k} x1={nodes[a].x} y1={nodes[a].y + 12} x2={lerp(nodes[a].x, nodes[b].x, ease(seg(t, k * 0.2, k * 0.2 + 0.25)))} y2={lerp(nodes[a].y + 12, nodes[b].y - 12, ease(seg(t, k * 0.2, k * 0.2 + 0.25)))} stroke={C.muted} strokeWidth="2.5" />)}
            {nodes.map((n, k) => <Label key={k} x={n.x} y={n.y} size={13} show={k === 0 ? 1 : seg(t, (k - 1) * 0.2 + 0.2, (k - 1) * 0.2 + 0.3)}>{n.l}</Label>)}
          </>
        )
      } },
    { caption: 'Kingdom, phylum, class, order, family, genus, species: each group sits inside a bigger one.', duration: 5000,
      draw: (t) => ['Kingdom', 'Phylum', 'Class', 'Order', 'Family', 'Genus', 'Species'].map((l, k) => (
        <g key={l} opacity={seg(t, k * 0.11, k * 0.11 + 0.12)}>
          <rect x={30 + k * 18} y={20 + k * 16} width={340 - k * 36} height={220 - k * 32} rx="10" fill={k % 2 ? '#f8f9fa' : C.soft} stroke={C.primary} />
          <Label x={40 + k * 18} y={32 + k * 16} size={11} anchor="start" color={C.primary}>{l}</Label>
        </g>
      )) },
  ],
}

// ------------------------------------------------------------------ nerves and reflexes

const NERVE = [[95, 190], [150, 150], [200, 120], [250, 80], [300, 60]]
const reflex = {
  title: 'A message along the nerves',
  frames: [
    { caption: 'Oops! Your hand touches something hot.', duration: 3000,
      draw: (t, ms) => <><Emoji x={60} y={200} size={40} scale={1 + 0.06 * Math.sin(ms / 90)}>🔥</Emoji><Emoji x={lerp(180, 95, ease(seg(t, 0.1, 0.7)))} y={190} size={46}>✋</Emoji></> },
    { caption: 'In a flash, nerves carry a message from your hand to your spinal cord and brain.', duration: 4000,
      draw: (t, ms) => {
        const [x, y] = along(NERVE, ease(seg(t, 0.1, 0.8)))
        return <><Emoji x={60} y={200} size={40}>🔥</Emoji><Emoji x={95} y={190} size={46}>✋</Emoji><polyline points={pts(NERVE)} fill="none" stroke="#ffc078" strokeWidth="5" strokeLinecap="round" /><Emoji x={320} y={50} size={56}>🧠</Emoji><circle cx={x} cy={y} r="9" fill={C.yellow} stroke={C.orange} strokeWidth="2" /></>
      } },
    { caption: 'A message comes straight back to the muscles: move away! Your hand pulls back.', duration: 4000,
      draw: (t) => {
        const [x, y] = along([...NERVE].reverse(), ease(seg(t, 0, 0.5)))
        return <><Emoji x={60} y={200} size={40}>🔥</Emoji><polyline points={pts(NERVE)} fill="none" stroke="#ffc078" strokeWidth="5" strokeLinecap="round" /><Emoji x={320} y={50} size={56}>🧠</Emoji>{t < 0.5 && <circle cx={x} cy={y} r="9" fill={C.green} />}<Emoji x={lerp(95, 200, ease(seg(t, 0.5, 0.7)))} y={190} size={46}>✋</Emoji></>
      } },
    { caption: 'This super-fast automatic action is called a reflex. It keeps us safe.', duration: 3500,
      draw: (t, ms) => <><Emoji x={200} y={120} size={80} scale={pop(seg(t, 0, 0.4))}>🧠</Emoji>{[0, 1, 2].map((k) => <circle key={k} cx="200" cy="120" r={50 + loop(ms, 1500, k * 500) * 80} fill="none" stroke={C.primary} opacity={1 - loop(ms, 1500, k * 500)} />)}</> },
  ],
}

// ------------------------------------------------------------------ growing crops and using resources

function Sprout({ x, h }) {
  return h > 0 && (
    <g>
      <line x1={x} y1="190" x2={x} y2={190 - h} stroke={C.green} strokeWidth="4" strokeLinecap="round" />
      {h > 15 && <ellipse cx={x - 9} cy={190 - h * 0.6} rx="9" ry="4" fill={C.leaf} transform={`rotate(-30 ${x - 9} ${190 - h * 0.6})`} />}
      {h > 25 && <ellipse cx={x + 9} cy={190 - h * 0.8} rx="9" ry="4" fill={C.leaf} transform={`rotate(30 ${x + 9} ${190 - h * 0.8})`} />}
    </g>
  )
}
const Soil = () => <rect x="0" y="190" width="400" height="70" fill="#a0522d" opacity="0.85" />
const SEEDS = [90, 150, 210, 270, 330]

const plantGrowth = {
  title: 'From seed to harvest',
  frames: [
    { caption: 'A farmer gets the soil ready and sows seeds in it.', duration: 4000,
      draw: (t) => <><Soil /><Emoji x={lerp(30, 360, seg(t, 0, 0.9))} y={160} size={40}>🧑‍🌾</Emoji>{SEEDS.map((x, k) => <ellipse key={k} cx={x} cy={lerp(150, 200, ease(seg(t, k * 0.15 + 0.1, k * 0.15 + 0.3)))} rx="5" ry="3.5" fill="#f4a261" opacity={seg(t, k * 0.15 + 0.05, k * 0.15 + 0.1)} />)}</> },
    { caption: 'With water, sunlight and nutrients from the soil, the seeds sprout and grow.', duration: 5000,
      draw: (t, ms) => (
        <>
          <Sun x={50} y={45} ms={ms} />
          <Cloud x={280} y={45} scale={1} />
          {Array.from({ length: 6 }, (_, k) => <line key={k} x1={255 + (k % 3) * 22} y1={lerp(70, 185, loop(ms, 900, k * 150))} x2={253 + (k % 3) * 22} y2={lerp(70, 185, loop(ms, 900, k * 150)) + 8} stroke={C.blue} strokeWidth="3" />)}
          <Soil />
          {SEEDS.map((x, k) => <Sprout key={k} x={x} h={60 * ease(seg(t, 0.1 + k * 0.05, 0.8 + k * 0.03))} />)}
        </>
      ) },
    { caption: 'The crop is ready! It is harvested and stored safely.', duration: 4500,
      draw: (t) => (
        <>
          <Soil />
          {SEEDS.map((x, k) => {
            const p = ease(seg(t, 0.35 + k * 0.1, 0.6 + k * 0.1))
            return <Emoji key={k} x={lerp(x, 340, p)} y={lerp(160, 215, p)} size={lerp(40, 20, p)} opacity={1 - seg(t, 0.6 + k * 0.1, 0.65 + k * 0.1)}>🌾</Emoji>
          })}
          <Emoji x={340} y={215} size={50} scale={pop(seg(t, 0.2, 0.35))}>🧺</Emoji>
        </>
      ) },
    { caption: 'Soil, water, forests and minerals are resources. We must use them wisely so they last.', duration: 4500,
      draw: (t, ms) => (
        <>
          <Emoji x={200} y={130} size={80} scale={pop(seg(t, 0, 0.3))}>🌍</Emoji>
          {['💧', '🌳', '⛰️', '☀️'].map((e, k) => <Emoji key={k} x={200 + 100 * Math.cos(ms / 1500 + (k * Math.PI) / 2)} y={130 + 80 * Math.sin(ms / 1500 + (k * Math.PI) / 2)} size={30} opacity={seg(t, 0.2 + k * 0.1, 0.4 + k * 0.1)}>{e}</Emoji>)}
          <Emoji x={340} y={40} size={34} opacity={seg(t, 0.7, 0.9)}>♻️</Emoji>
        </>
      ) },
  ],
}

export const SCIENCE_SCENES = {
  'earth-sun': earthSun, gravity, atom, 'motion-force': motionForce, 'light-ray': lightRay, 'sound-wave': soundWave,
  magnet, breathing, 'cell-division': cellDivision, heredity, reaction, heat, separation, nutrients, germs, energy,
  periodic, classify, reflex, 'plant-growth': plantGrowth,
}
export { along, pts }
