/** Social science, English, economics and computer science scenes. Same contract as scenes.jsx. */
import { Arrow, C, Emoji, Label, clamp, ease, lerp, loop, pop, seg, wedge } from './scenes.jsx'
import { along } from './scenesScience.jsx'

const sc = (s) => Math.max(s, 0.001)
const mono = { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }

// ------------------------------------------------------------------ globe: latitudes and longitudes

function Globe({ ms, lat = 0, lon = 0 }) {
  return (
    <>
      <defs><clipPath id="globe-clip"><circle cx="200" cy="130" r="95" /></clipPath></defs>
      <circle cx="200" cy="130" r="95" fill={C.blue} />
      <g clipPath="url(#globe-clip)">
        {[0, 90, 180, 270].map((off, k) => <ellipse key={k} cx={95 + ((ms / 30 + off) % 360) - 40} cy={95 + (k % 2) * 70} rx="38" ry="26" fill={C.leaf} />)}
        {[-60, -30, 0, 30, 60].map((d, k) => {
          const y = 130 - 95 * Math.sin((d * Math.PI) / 180), rx = 95 * Math.cos((d * Math.PI) / 180)
          return <ellipse key={d} cx="200" cy={y} rx={rx} ry={rx * 0.12} fill="none" stroke={d === 0 ? C.red : '#fff'} strokeWidth={d === 0 ? 3 : 1.5} opacity={clamp(lat * 5 - k)} />
        })}
        {Array.from({ length: 6 }, (_, k) => {
          const phase = ms / 2500 + (k * Math.PI) / 6
          return <ellipse key={k} cx="200" cy="130" rx={Math.abs(95 * Math.sin(phase))} ry="95" fill="none" stroke="#fff" strokeWidth="1.5" opacity={clamp(lon * 6 - k)} />
        })}
      </g>
      <circle cx="200" cy="130" r="95" fill="none" stroke="#1c7ed6" strokeWidth="3" />
    </>
  )
}

const globe = {
  title: 'Lines on the globe',
  frames: [
    { caption: 'The globe is a small model of our Earth, spinning slowly.', duration: 3500,
      draw: (t, ms) => <g transform={`translate(200 130) scale(${sc(pop(seg(t, 0, 0.5)))}) translate(-200 -130)`}><Globe ms={ms} /></g> },
    { caption: 'Latitudes are lines that go across, like the steps of a ladder. The middle one is the Equator.', duration: 5000,
      draw: (t, ms) => <><Globe ms={ms} lat={seg(t, 0.05, 0.8)} /><Label x={345} y={130} size={14} color={C.red} show={seg(t, 0.5, 0.7)}>← Equator</Label></> },
    { caption: 'Longitudes run from the North Pole down to the South Pole.', duration: 5000,
      draw: (t, ms) => <><Globe ms={ms} lat={1} lon={seg(t, 0.05, 0.8)} /><Label x={200} y={22} size={13} show={seg(t, 0.5, 0.7)}>North Pole</Label><Label x={200} y={240} size={13} show={seg(t, 0.5, 0.7)}>South Pole</Label></> },
    { caption: 'Where two lines cross is an exact address on Earth, like 23°N, 80°E for a place in India.', duration: 4500,
      draw: (t, ms) => (
        <>
          <Globe ms={0} lat={1} lon={1} />
          <Emoji x={245} y={lerp(10, 98, ease(seg(t, 0.1, 0.5)))} size={32}>📍</Emoji>
          <Label x={330} y={60} size={15} color={C.primary} show={seg(t, 0.55, 0.8)}>23°N, 80°E</Label>
        </>
      ) },
  ],
}

// ------------------------------------------------------------------ history timeline

const EVENTS = [['🔥', 'fire'], ['🌾', 'farming'], ['🏰', 'kingdoms'], ['✊', 'revolutions'], ['🗽', 'freedom'], ['📜', 'constitutions']]
const evX = (k) => 48 + k * 61
function Timeline({ walker, shown, ms, draw = 1 }) {
  return (
    <>
      <line x1="30" y1="160" x2={lerp(30, 375, draw)} y2="160" stroke={C.muted} strokeWidth="6" strokeLinecap="round" />
      {EVENTS.map(([e, l], k) => shown > k && (
        <g key={k}>
          <line x1={evX(k)} y1="160" x2={evX(k)} y2="115" stroke={C.muted} strokeWidth="2" />
          <Emoji x={evX(k)} y={95} size={34} scale={pop(clamp(shown - k))}>{e}</Emoji>
          <Label x={evX(k)} y={185} size={11} color={C.muted}>{l}</Label>
        </g>
      ))}
      <Emoji x={walker} y={140 - Math.abs(Math.sin(ms / 150)) * 4} size={28}>🚶</Emoji>
    </>
  )
}

const timeline = {
  title: 'The road of history',
  frames: [
    { caption: 'History is like a long road of events, one after another.', duration: 3000,
      draw: (t, ms) => <Timeline walker={35} shown={0} ms={ms} draw={ease(seg(t, 0, 0.7))} /> },
    { caption: 'Long ago, early humans learned to make fire. Later they learned to grow crops and farm.', duration: 4500,
      draw: (t, ms) => <Timeline walker={lerp(35, 120, ease(seg(t, 0, 0.9)))} shown={seg(t, 0.1, 0.9) * 2} ms={ms} /> },
    { caption: 'Then came kingdoms. Over time, people began to fight for fairness and their rights.', duration: 4500,
      draw: (t, ms) => <Timeline walker={lerp(120, 235, ease(seg(t, 0, 0.9)))} shown={2 + seg(t, 0.1, 0.9) * 2} ms={ms} /> },
    { caption: 'Many countries won freedom and wrote constitutions: rules that protect everyone.', duration: 4500,
      draw: (t, ms) => <Timeline walker={lerp(235, 350, ease(seg(t, 0, 0.9)))} shown={4 + seg(t, 0.1, 0.9) * 2} ms={ms} /> },
  ],
}

// ------------------------------------------------------------------ society: diversity, power sharing, equality

const PEOPLE = ['🧕', '🧑🏾', '👳🏽‍♂️', '👩🏻', '🧑🏼‍🦱', '👵🏽', '🧒🏿', '👨🏻‍🦳']
const PILLARS = [{ x: 110, e: '📜', l: 'makes laws' }, { x: 200, e: '🏛️', l: 'runs the country' }, { x: 290, e: '⚖️', l: 'judges fairly' }]
function Pillars({ rise = 1, roof = 1, labels = 1 }) {
  return (
    <>
      <polygon points="70,80 200,30 330,80" fill="#e9ecef" stroke={C.muted} strokeWidth="2" opacity={roof} />
      {PILLARS.map((p, k) => {
        const h = 120 * ease(clamp(rise * 3 - k))
        return (
          <g key={k}>
            <rect x={p.x - 22} y={210 - h} width="44" height={h} fill="#f1f3f5" stroke={C.muted} strokeWidth="2" />
            <Emoji x={p.x} y={150} size={28} opacity={labels}>{p.e}</Emoji>
            <Label x={p.x} y={230} size={11} show={labels}>{p.l}</Label>
          </g>
        )
      })}
    </>
  )
}

const society = {
  title: 'Living together fairly',
  frames: [
    { caption: 'A country is like a big family, with people of many languages, religions and cultures.', duration: 4000,
      draw: (t, ms) => PEOPLE.map((e, k) => {
        const a = (k / PEOPLE.length) * Math.PI * 2 + ms / 4000
        return <Emoji key={k} x={200 + 95 * Math.cos(a)} y={130 + 80 * Math.sin(a)} size={34} scale={pop(seg(t, k * 0.07, k * 0.07 + 0.3))}>{e}</Emoji>
      }) },
    { caption: 'Power is shared between three parts, so that no one person has all the power.', duration: 5000,
      draw: (t) => <Pillars rise={seg(t, 0.05, 0.6)} roof={seg(t, 0.6, 0.75)} labels={seg(t, 0.7, 0.9)} /> },
    { caption: 'The Constitution is the rulebook of the country. Everyone, even leaders, must follow it.', duration: 4000,
      draw: (t, ms) => (
        <>
          <Pillars />
          <rect x={200 - 90 * ease(seg(t, 0.1, 0.5))} y="40" width={180 * ease(seg(t, 0.1, 0.5))} height="34" rx="6" fill="#fff3bf" stroke="#f08c00" />
          <Label x={200} y={57} size={14} color="#e67700" show={seg(t, 0.4, 0.6)}>📜 Constitution</Label>
        </>
      ) },
    { caption: 'Everyone is equal before the law: rich or poor, young or old.', duration: 4000,
      draw: (t, ms) => {
        const tilt = 12 * Math.sin(ms / 400) * (1 - seg(t, 0.2, 0.6))
        return (
          <>
            <line x1="200" y1="70" x2="200" y2="210" stroke={C.ink} strokeWidth="5" />
            <g transform={`rotate(${tilt} 200 80)`}>
              <line x1="90" y1="80" x2="310" y2="80" stroke={C.ink} strokeWidth="5" strokeLinecap="round" />
              <Emoji x={90} y={120} size={40}>🤵</Emoji>
              <Emoji x={310} y={120} size={40}>🧑‍🌾</Emoji>
            </g>
            <Label x={200} y={235} size={16} color={C.green} show={seg(t, 0.6, 0.8)}>equal ⚖️</Label>
          </>
        )
      } },
  ],
}

// ------------------------------------------------------------------ inside the Earth

const LAYERS = [[95, '#a0522d', 'crust: where we live'], [80, '#f76707', 'mantle: hot, soft rock'], [52, '#fab005', 'outer core: liquid metal'], [28, '#ffe066', 'inner core: solid and super hot']]
const earthLayers = {
  title: 'Inside the Earth',
  frames: [
    { caption: 'Imagine opening up the Earth, like opening a peach, to see what is inside.', duration: 4000,
      draw: (t) => {
        const open = 90 * ease(seg(t, 0.3, 0.9))
        return (
          <>
            {LAYERS.map(([r, c], k) => <circle key={k} cx="200" cy="130" r={r} fill={c} />)}
            {open < 1 ? <circle cx="200" cy="130" r="97" fill={C.blue} /> : <path d={wedge(200, 130, 97, open, 360)} fill={C.blue} />}
          </>
        )
      } },
    { caption: 'Inside there are layers: the thin crust, the hot mantle, and the metal core in the middle.', duration: 5500,
      draw: (t) => (
        <>
          {LAYERS.map(([r, c], k) => <circle key={k} cx="140" cy="130" r={r} fill={c} />)}
          {LAYERS.map(([r, , l], k) => (
            <g key={k} opacity={seg(t, k * 0.2, k * 0.2 + 0.2)}>
              <line x1={140 + r - 8} y1={130 - 15 * k} x2="250" y2={50 + k * 45} stroke={C.ink} strokeWidth="1.5" />
              <Label x={255} y={50 + k * 45} size={12} anchor="start">{l}</Label>
            </g>
          ))}
        </>
      ) },
    { caption: 'Sometimes hot melted rock called magma pushes up through the crust. That is a volcano!', duration: 4500,
      draw: (t, ms) => (
        <>
          <rect x="0" y="200" width="400" height="60" fill="#f76707" />
          <polygon points="110,200 200,80 290,200" fill="#a0522d" />
          <rect x="192" y={lerp(240, 85, ease(seg(t, 0.1, 0.5)))} width="16" height={lerp(0, 155, ease(seg(t, 0.1, 0.5)))} fill={C.red} />
          {t > 0.5 && Array.from({ length: 10 }, (_, k) => {
            const p = loop(ms, 1400, k * 140), dir = (k % 5) - 2
            return <circle key={k} cx={200 + dir * 30 * p} cy={80 - 70 * p + 60 * p * p} r="5" fill={k % 2 ? C.red : C.orange} opacity={1 - p} />
          })}
        </>
      ) },
    { caption: 'The crust is broken into giant plates that move very slowly. When they push together, mountains rise.', duration: 5000,
      draw: (t) => {
        const p = ease(seg(t, 0.1, 0.9))
        return (
          <>
            <rect x="0" y="190" width="400" height="70" fill="#f76707" />
            <rect x={lerp(20, 50, p)} y="150" width="160" height="40" fill="#a0522d" />
            <rect x={lerp(220, 190, p)} y="150" width="160" height="40" fill="#8d5524" />
            <polygon points={`150,150 200,${150 - 90 * p} 250,150`} fill="#a0522d" />
            <Arrow x1={60} y1={120} x2={120} y2={120} color={C.ink} /><Arrow x1={340} y1={120} x2={280} y2={120} color={C.ink} />
          </>
        )
      } },
  ],
}

// ------------------------------------------------------------------ landforms

const landforms = {
  title: 'Mountains, plains and coasts',
  frames: [
    { caption: 'Mountains are high and steep. The Himalayas stand tall in the north of India.', duration: 3500,
      draw: (t) => (
        <>
          <rect x="0" y="0" width="400" height="260" fill="#e7f5ff" />
          {[[70, 70, 50], [130, 50, 60], [190, 85, 45]].map(([x, top, w], k) => {
            const h = ease(seg(t, k * 0.15, k * 0.15 + 0.5))
            return <g key={k}><polygon points={`${x - w},200 ${x},${lerp(200, top, h)} ${x + w},200`} fill="#868e96" /><polygon points={`${x - w * 0.3},${lerp(200, top, h) + (200 - top) * 0.3 * h} ${x},${lerp(200, top, h)} ${x + w * 0.3},${lerp(200, top, h) + (200 - top) * 0.3 * h}`} fill="#fff" /></g>
          })}
          <rect x="0" y="200" width="400" height="60" fill="#8ce99a" />
        </>
      ) },
    { caption: 'Rivers flow down from the mountains and make wide, flat, fertile plains.', duration: 4500,
      draw: (t, ms) => {
        const river = [[130, 200], [170, 215], [220, 205], [270, 225], [330, 215], [400, 230]]
        const shown = Math.max(2, Math.ceil(seg(t, 0.05, 0.8) * river.length))
        return (
          <>
            <rect x="0" y="0" width="400" height="260" fill="#e7f5ff" />
            {[[70, 70, 50], [130, 50, 60], [190, 85, 45]].map(([x, top, w], k) => <polygon key={k} points={`${x - w},200 ${x},${top} ${x + w},200`} fill="#868e96" />)}
            <rect x="0" y="200" width="400" height="60" fill="#8ce99a" />
            <polyline points={river.slice(0, shown).map((p) => p.join(',')).join(' ')} fill="none" stroke={C.blue} strokeWidth="8" strokeLinecap="round" strokeDasharray="14 6" strokeDashoffset={-ms / 25} />
            <Label x={250} y={245} size={13} show={seg(t, 0.7, 0.9)}>plains 🌾</Label>
          </>
        )
      } },
    { caption: 'A plateau is high land with a flat top, like a table.', duration: 3500,
      draw: (t) => (
        <>
          <rect x="0" y="0" width="400" height="260" fill="#e7f5ff" />
          <rect x="0" y="200" width="400" height="60" fill="#8ce99a" />
          <polygon points={`200,200 230,${lerp(200, 120, ease(seg(t, 0.1, 0.6)))} 350,${lerp(200, 120, ease(seg(t, 0.1, 0.6)))} 380,200`} fill="#c0855a" />
          <Label x={290} y={105} size={13} show={seg(t, 0.6, 0.8)}>flat top ↔</Label>
        </>
      ) },
    { caption: 'Along the edges of the land are coasts, beaches and the sea, with islands nearby.', duration: 4000,
      draw: (t, ms) => (
        <>
          <rect x="0" y="0" width="400" height="260" fill="#e7f5ff" />
          <rect x="0" y="200" width="220" height="60" fill="#8ce99a" />
          <path d={`M220,200 ${Array.from({ length: 5 }, (_, k) => `q18,${6 * Math.sin(ms / 300 + k)} 36,0`).join(' ')} L400,260 L220,260 Z`} fill={C.blue} opacity={seg(t, 0, 0.3)} />
          <rect x="205" y="196" width="30" height="64" fill="#ffe8a1" opacity={seg(t, 0.2, 0.4)} />
          <ellipse cx="320" cy="225" rx="24" ry="8" fill="#8ce99a" opacity={seg(t, 0.5, 0.7)} />
          <Emoji x={320} y={212} size={20} opacity={seg(t, 0.6, 0.8)}>🌴</Emoji>
        </>
      ) },
  ],
}

// ------------------------------------------------------------------ sectors and industries

const factory = {
  title: 'From farm to factory to shop',
  frames: [
    { caption: 'Primary sector: we take things from nature, like cotton from a farm.', duration: 4000,
      draw: (t) => <><rect x="0" y="180" width="400" height="80" fill="#8ce99a" />{Array.from({ length: 6 }, (_, k) => <Emoji key={k} x={60 + k * 55} y={175} size={30} scale={pop(seg(t, k * 0.1, k * 0.1 + 0.3))}>🌿</Emoji>)}<Emoji x={lerp(30, 340, seg(t, 0.4, 1))} y={140} size={40}>🧑‍🌾</Emoji></> },
    { caption: 'Secondary sector: factories turn raw materials into products, like cotton into shirts.', duration: 5000,
      draw: (t, ms) => (
        <>
          <Emoji x={200} y={130} size={80}>🏭</Emoji>
          {[0, 1, 2].map((k) => { const p = loop(ms, 2000, k * 600); return <circle key={k} cx={182 + 8 * Math.sin(ms / 300 + k)} cy={lerp(80, 20, p)} r={6 + 10 * p} fill="#ced4da" opacity={1 - p} /> })}
          <Emoji x={lerp(20, 140, ease(seg(t, 0, 0.4)))} y={150} size={40}>🚚</Emoji>
          {[0, 1, 2].map((k) => <Emoji key={k} x={lerp(250, 300 + k * 30, ease(seg(t, 0.5 + k * 0.1, 0.7 + k * 0.1)))} y={150} size={30} opacity={seg(t, 0.5 + k * 0.1, 0.55 + k * 0.1)}>👕</Emoji>)}
        </>
      ) },
    { caption: 'Tertiary sector: services like transport, shops, banks and schools help everyone.', duration: 4500,
      draw: (t) => ['🚚', '🏪', '🏦', '🧑‍🏫', '🏥'].map((e, k) => <Emoji key={k} x={50 + k * 75} y={130} size={46} scale={pop(seg(t, k * 0.15, k * 0.15 + 0.3))}>{e}</Emoji>) },
    { caption: 'All three sectors work together to build the economy.', duration: 4000,
      draw: (t) => (
        <>
          {[['🌿', 'primary'], ['🏭', 'secondary'], ['🏪', 'tertiary']].map(([e, l], k) => (
            <g key={k}>
              <circle cx={80 + k * 120} cy="120" r="45" fill={C.soft} stroke={C.primary} strokeWidth="2" opacity={seg(t, k * 0.2, k * 0.2 + 0.2)} />
              <Emoji x={80 + k * 120} y={115} size={40} opacity={seg(t, k * 0.2, k * 0.2 + 0.2)}>{e}</Emoji>
              <Label x={80 + k * 120} y={190} size={14} show={seg(t, k * 0.2 + 0.1, k * 0.2 + 0.3)}>{l}</Label>
              {k < 2 && <Arrow x1={128 + k * 120} y1={120} x2={152 + k * 120} y2={120} progress={seg(t, k * 0.2 + 0.2, k * 0.2 + 0.35)} />}
            </g>
          ))}
        </>
      ) },
  ],
}

// ------------------------------------------------------------------ English: the sentence train

const WORDS = [
  { w: 'The', role: null }, { w: 'happy', role: 'adjective', c: '#ffd43b' }, { w: 'dog', role: 'noun', c: '#74c0fc' },
  { w: 'runs', role: 'verb', c: '#ff8787' }, { w: 'quickly', role: 'adverb', c: '#8ce99a' },
]
function Train({ offset = 0, colored = [], verb = 'runs', ms = 0, labels = [] }) {
  return (
    <g transform={`translate(${offset} 0)`}>
      {WORDS.map((wd, k) => {
        const x = 20 + k * 64, on = colored.includes(wd.role)
        return (
          <g key={k}>
            <rect x={x} y="120" width="58" height="44" rx="6" fill={on ? wd.c : '#f1f3f5'} stroke={C.ink} strokeWidth="2" />
            <Label x={x + 29} y={142} size={13}>{wd.role === 'verb' ? verb : wd.w}</Label>
            {[x + 14, x + 44].map((cx) => <g key={cx} transform={`rotate(${ms / 4} ${cx} 168)`}><circle cx={cx} cy="168" r="7" fill={C.ink} /><line x1={cx - 5} y1="168" x2={cx + 5} y2="168" stroke="#fff" strokeWidth="2" /></g>)}
            {labels.includes(wd.role) && <Label x={x + 29} y={98} size={11} color={C.ink}>{wd.role}</Label>}
          </g>
        )
      })}
      <Emoji x={360} y={135} size={48}>🚂</Emoji>
    </g>
  )
}

const sentenceBuilder = {
  title: 'The sentence train',
  frames: [
    { caption: 'A sentence is like a train. Each word is a carriage, joined in the right order.', duration: 4000,
      draw: (t, ms) => <><line x1="0" y1="178" x2="400" y2="178" stroke={C.muted} strokeWidth="3" /><Train offset={lerp(-420, 0, ease(seg(t, 0, 0.8)))} ms={ms * (1 - seg(t, 0.8, 0.9))} /></> },
    { caption: 'Every word has a job. A noun names a person, place or thing: dog. A verb shows an action: runs.', duration: 5000,
      draw: (t) => <><line x1="0" y1="178" x2="400" y2="178" stroke={C.muted} strokeWidth="3" /><Train colored={t > 0.2 ? (t > 0.55 ? ['noun', 'verb'] : ['noun']) : []} labels={t > 0.2 ? (t > 0.55 ? ['noun', 'verb'] : ['noun']) : []} /></> },
    { caption: 'An adjective describes a noun: happy dog. An adverb describes a verb: runs quickly.', duration: 5000,
      draw: (t) => {
        const roles = ['noun', 'verb', ...(t > 0.2 ? ['adjective'] : []), ...(t > 0.55 ? ['adverb'] : [])]
        return <><line x1="0" y1="178" x2="400" y2="178" stroke={C.muted} strokeWidth="3" /><Train colored={roles} labels={roles} /></>
      } },
    { caption: 'Change the verb to change the time: runs (now), ran (yesterday), will run (tomorrow).', duration: 5500,
      draw: (t) => {
        const k = Math.min(2, Math.floor(seg(t, 0.05, 0.95) * 3)), verbs = ['runs', 'ran', 'will run'], when = ['now ⏰', 'yesterday ⬅️', 'tomorrow ➡️']
        return (
          <>
            <line x1="0" y1="178" x2="400" y2="178" stroke={C.muted} strokeWidth="3" />
            <Train colored={['verb']} verb={verbs[k]} />
            <Label x={221} y={95} size={16} color={C.red}>{when[k]}</Label>
          </>
        )
      } },
  ],
}

// ------------------------------------------------------------------ English: writing a letter

const Lines = ({ x, y, n, w, p = 1, gap = 12 }) => Array.from({ length: n }, (_, k) => (
  <line key={k} x1={x} y1={y + k * gap} x2={x + w * clamp(p * n - k) * (k === n - 1 ? 0.6 : 1)} y2={y + k * gap} stroke={C.muted} strokeWidth="3" strokeLinecap="round" />
))
function Paper({ fold = 0, children }) {
  return (
    <g transform={`translate(0 ${fold * 60}) scale(1 ${1 - fold * 0.66}) `}>
      <rect x="110" y="20" width="180" height="220" rx="6" fill="#fff" stroke="#ced4da" strokeWidth="2" />
      {children}
    </g>
  )
}

const letter = {
  title: 'Writing with a clear shape',
  frames: [
    { caption: 'Good writing has a clear shape, like a building with floors.', duration: 3000,
      draw: (t) => <g opacity={seg(t, 0, 0.4)}><Paper /></g> },
    { caption: 'First: who it is from, the date, and who it is for.', duration: 4500,
      draw: (t) => (
        <Paper>
          <Lines x={125} y={38} n={3} w={60} p={seg(t, 0, 0.35)} />
          <Lines x={125} y={78} n={1} w={50} p={seg(t, 0.35, 0.55)} />
          <Lines x={125} y={100} n={3} w={70} p={seg(t, 0.55, 0.9)} />
          <Label x={250} y={50} size={11} color={C.primary} show={seg(t, 0.2, 0.35)}>from</Label>
          <Label x={250} y={78} size={11} color={C.primary} show={seg(t, 0.45, 0.55)}>date</Label>
          <Label x={250} y={112} size={11} color={C.primary} show={seg(t, 0.8, 0.9)}>to</Label>
        </Paper>
      ) },
    { caption: 'Then: a greeting, the message in short paragraphs, and a polite ending.', duration: 5000,
      draw: (t) => (
        <Paper>
          <Lines x={125} y={38} n={3} w={60} /><Lines x={125} y={78} n={1} w={50} /><Lines x={125} y={100} n={3} w={70} />
          <Label x={125} y={150} size={11} anchor="start" show={seg(t, 0, 0.15)}>Dear …,</Label>
          <Lines x={125} y={168} n={3} w={150} p={seg(t, 0.15, 0.55)} gap={10} />
          <Lines x={125} y={202} n={2} w={150} p={seg(t, 0.55, 0.75)} gap={10} />
          <Label x={270} y={228} size={10} anchor="end" show={seg(t, 0.8, 0.95)}>Yours sincerely ✍️</Label>
        </Paper>
      ) },
    { caption: 'Fold it, seal it and send it!', duration: 4000,
      draw: (t) => {
        const fold = ease(seg(t, 0, 0.35)), fly = ease(seg(t, 0.55, 1))
        return (
          <>
            {t < 0.4 && <Paper fold={fold}><Lines x={125} y={38} n={10} w={150} /></Paper>}
            {t >= 0.4 && <Emoji x={lerp(200, 430, fly)} y={lerp(130, 40, fly)} size={80} scale={pop(seg(t, 0.4, 0.55))}>✉️</Emoji>}
            <Emoji x={360} y={200} size={44} opacity={seg(t, 0.5, 0.7)}>📮</Emoji>
          </>
        )
      } },
  ],
}

// ------------------------------------------------------------------ English: figures of speech

const figurative = {
  title: 'Pictures made of words',
  frames: [
    { caption: 'Simile: "as brave as a lion" compares two things using "as" or "like".', duration: 4500,
      draw: (t) => {
        const p = ease(seg(t, 0.3, 0.8))
        return <><Emoji x={lerp(110, 170, p)} y={130} size={64}>🧒</Emoji><Emoji x={lerp(290, 230, p)} y={130} size={64}>🦁</Emoji><Label x={200} y={45} size={18} color={C.orange} show={seg(t, 0, 0.3)}>as brave as a lion</Label>{t > 0.8 && <Emoji x={200} y={80} size={30} scale={pop(seg(t, 0.8, 0.95))}>✨</Emoji>}</>
      } },
    { caption: 'Metaphor: "Time is a thief" says one thing IS another. Time quietly steals our hours!', duration: 4500,
      draw: (t, ms) => <><Emoji x={lerp(80, 320, seg(t, 0.1, 0.9))} y={140 - Math.abs(Math.sin(ms / 200)) * 10} size={64}>⏰</Emoji><Emoji x={lerp(80, 320, seg(t, 0.1, 0.9))} y={110} size={40}>🥷</Emoji><Label x={200} y={45} size={18} color={C.primary}>Time is a thief</Label></> },
    { caption: 'Personification: "The wind whispered" gives human actions to things that are not human.', duration: 4500,
      draw: (t, ms) => (
        <>
          <Emoji x={90} y={110} size={60}>🌬️</Emoji>
          {[0, 1, 2].map((k) => <g key={k} transform={`rotate(${8 * Math.sin(ms / 400 + k)} ${230 + k * 55} 200)`}><Emoji x={230 + k * 55} y={160} size={56}>🌳</Emoji></g>)}
          <rect x="120" y="40" width="130" height="34" rx="16" fill="#fff" stroke="#ced4da" opacity={seg(t, 0.2, 0.4)} />
          <Label x={185} y={57} size={13} show={seg(t, 0.3, 0.5)}>shhh… hello!</Label>
        </>
      ) },
    { caption: 'Idiom: "It\'s raining cats and dogs" does not mean animals fall from the sky. It means it is raining very heavily!', duration: 5500,
      draw: (t, ms) => (
        <>
          {Array.from({ length: 10 }, (_, k) => {
            const p = loop(ms, 1800, k * 180), animal = t < 0.55
            return <Emoji key={k} x={30 + k * 38} y={lerp(-20, 240, p)} size={animal ? 26 : 16}>{animal ? (k % 2 ? '🐈' : '🐕') : '💧'}</Emoji>
          })}
          <Label x={200} y={130} size={18} color={C.blue} show={seg(t, 0.6, 0.8)}>= very heavy rain</Label>
        </>
      ) },
  ],
}

// ------------------------------------------------------------------ economics: demand and supply

const AX = { x0: 60, y0: 220, x1: 360, y1: 25 }
const PriceAxes = ({ show = 1 }) => (
  <g opacity={show}>
    <line x1={AX.x0} y1={AX.y0} x2={AX.x1} y2={AX.y0} stroke={C.ink} strokeWidth="2.5" />
    <line x1={AX.x0} y1={AX.y0} x2={AX.x0} y2={AX.y1} stroke={C.ink} strokeWidth="2.5" />
    <Label x={30} y={40} size={12}>price</Label><Label x={330} y={240} size={12}>quantity</Label>
  </g>
)
const seg2 = (a, b, p) => [lerp(a[0], b[0], p), lerp(a[1], b[1], p)]
const D1 = [[90, 50], [330, 200]], S1 = [[90, 200], [330, 50]], D2 = [[140, 50], [360, 187.5]]
const Curve = ({ line, p = 1, color }) => { const e = seg2(line[0], line[1], p); return <line x1={line[0][0]} y1={line[0][1]} x2={e[0]} y2={e[1]} stroke={color} strokeWidth="4" strokeLinecap="round" /> }

const supplyDemand = {
  title: 'Buyers and sellers meet',
  frames: [
    { caption: 'When mangoes are cheap, people want lots of them. When they are costly, people want fewer. That is demand.', duration: 5000,
      draw: (t) => {
        const [mx, my] = seg2(D1[0], D1[1], 0.5 + 0.4 * Math.sin(t * Math.PI * 2))
        return <><PriceAxes /><Curve line={D1} p={ease(seg(t, 0, 0.4))} color={C.blue} />{t > 0.4 && <Emoji x={mx} y={my - 14} size={24}>🥭</Emoji>}<Label x={330} y={185} size={13} color={C.blue} show={seg(t, 0.3, 0.5)}>demand</Label></>
      } },
    { caption: 'Sellers want to sell more when the price is high. That is supply.', duration: 4000,
      draw: (t) => <><PriceAxes /><Curve line={D1} color={C.blue} /><Curve line={S1} p={ease(seg(t, 0.05, 0.6))} color={C.orange} /><Label x={330} y={40} size={13} color={C.orange} show={seg(t, 0.5, 0.7)}>supply</Label></> },
    { caption: 'Where the two lines meet, buyers and sellers agree. That is the market price.', duration: 4000,
      draw: (t) => (
        <>
          <PriceAxes /><Curve line={D1} color={C.blue} /><Curve line={S1} color={C.orange} />
          <line x1={AX.x0} y1="125" x2="210" y2="125" stroke={C.green} strokeDasharray="5 5" opacity={seg(t, 0.2, 0.4)} />
          <circle cx="210" cy="125" r={8 + 3 * Math.sin(t * 20)} fill={C.green} />
          <Emoji x={95} y={110} size={22} opacity={seg(t, 0.4, 0.6)}>🏷️</Emoji>
        </>
      ) },
    { caption: 'If more people want mangoes, demand moves to the right and the price goes up.', duration: 4500,
      draw: (t) => {
        const p = ease(seg(t, 0.1, 0.7)), D = [seg2(D1[0], D2[0], p), seg2(D1[1], D2[1], p)]
        const ix = lerp(210, 235, p), iy = lerp(125, 109, p)
        return (
          <>
            <PriceAxes /><Curve line={D1} color="#a5d8ff" /><Curve line={D} color={C.blue} /><Curve line={S1} color={C.orange} />
            <circle cx={ix} cy={iy} r="8" fill={C.green} />
            <Label x={300} y={110} size={14} color={C.green} show={seg(t, 0.7, 0.9)}>price ↑</Label>
          </>
        )
      } },
  ],
}

// ------------------------------------------------------------------ economics: how money flows

const NODES = { home: [80, 130, '🏠', 'families'], biz: [320, 130, '🏭', 'businesses'], bank: [200, 45, '🏦', 'bank'], gov: [200, 215, '🏛️', 'government'] }
function Flow({ from, to, ms, color = C.yellow, n = 3, show = 1 }) {
  const a = NODES[from], b = NODES[to]
  return Array.from({ length: n }, (_, k) => {
    const [x, y] = along([[a[0], a[1]], [b[0], b[1]]], loop(ms, 2000, (k * 2000) / n))
    return <circle key={k} cx={x} cy={y} r="7" fill={color} stroke={C.crust} strokeWidth="1.5" opacity={show} />
  })
}
const Nodes = ({ s = 1 }) => Object.values(NODES).map(([x, y, e, l], k) => (
  <g key={k}><Emoji x={x} y={y} size={46} scale={pop(clamp(s * 4 - k))}>{e}</Emoji><Label x={x} y={y + 34} size={11} color={C.muted} show={clamp(s * 4 - k)}>{l}</Label></g>
))

const moneyFlow = {
  title: 'Money goes round',
  frames: [
    { caption: 'Money moves around between families, businesses, banks and the government.', duration: 3500, draw: (t) => <Nodes s={seg(t, 0, 0.8)} /> },
    { caption: 'Families work in businesses and earn wages.', duration: 4000, draw: (t, ms) => <><Nodes /><Flow from="biz" to="home" ms={ms} show={seg(t, 0, 0.2)} /></> },
    { caption: 'Families spend money in shops and save some in the bank. The bank lends it to businesses.', duration: 5000,
      draw: (t, ms) => <><Nodes /><Flow from="home" to="biz" ms={ms} color={C.green} show={seg(t, 0, 0.2)} /><Flow from="home" to="bank" ms={ms} show={seg(t, 0.3, 0.5)} /><Flow from="bank" to="biz" ms={ms + 700} color={C.orange} show={seg(t, 0.6, 0.8)} /></> },
    { caption: 'The government collects taxes and spends them on schools, hospitals and roads.', duration: 5000,
      draw: (t, ms) => (
        <>
          <Nodes />
          <Flow from="home" to="gov" ms={ms} show={seg(t, 0, 0.2)} /><Flow from="biz" to="gov" ms={ms + 500} show={seg(t, 0, 0.2)} />
          {['🏫', '🏥', '🛣️'].map((e, k) => <Emoji key={k} x={120 + k * 80} y={250} size={22} scale={pop(seg(t, 0.4 + k * 0.15, 0.6 + k * 0.15))}>{e}</Emoji>)}
        </>
      ) },
  ],
}

// ------------------------------------------------------------------ computer science: a robot following code

const GRID = { x: 20, y: 40, cell: 40, cols: 5, rows: 4 }
const cellXY = ([c, r]) => [GRID.x + c * GRID.cell + GRID.cell / 2, GRID.y + r * GRID.cell + GRID.cell / 2]
function Board({ robot, star = [4, 0], sparkle = 0 }) {
  const [rx, ry] = cellXY(robot), [sx, sy] = cellXY(star)
  return (
    <>
      {Array.from({ length: GRID.cols * GRID.rows }, (_, k) => <rect key={k} x={GRID.x + (k % GRID.cols) * GRID.cell} y={GRID.y + Math.floor(k / GRID.cols) * GRID.cell} width={GRID.cell} height={GRID.cell} fill={(k + Math.floor(k / GRID.cols)) % 2 ? '#f8f9fa' : '#f1f3f5'} stroke="#dee2e6" />)}
      <Emoji x={sx} y={sy} size={26} scale={1 + 0.3 * sparkle}>⭐</Emoji>
      <Emoji x={rx} y={ry} size={28}>🤖</Emoji>
    </>
  )
}
function Code({ lines, active = -1, output }) {
  return (
    <>
      <rect x="232" y="40" width="160" height={Math.max(lines.length * 22 + 16, 70)} rx="8" fill="#212529" />
      {lines.map((l, k) => (
        <g key={k}>
          {k === active && <rect x="236" y={46 + k * 22} width="152" height="20" rx="4" fill="#495057" />}
          <text x="242" y={60 + k * 22} fontSize="12" fill={k === active ? '#ffe066' : '#69db7c'} style={mono}>{l}</text>
        </g>
      ))}
      {output && <text x="242" y={215} fontSize="13" fill={C.ink} style={mono}>{output}</text>}
    </>
  )
}
/** Robot position after following `path` (list of cells) with progress p; returns [cell, index]. */
function walk(path, p) {
  const f = clamp(p) * (path.length - 1), i = Math.floor(f), frac = f - i
  const a = path[i], b = path[Math.min(i + 1, path.length - 1)]
  return [[lerp(a[0], b[0], ease(frac)), lerp(a[1], b[1], ease(frac))], i]
}

const codeRobot = {
  title: 'A robot follows code',
  frames: [
    { caption: 'A program is a list of exact steps. The robot does exactly what the code says, one line at a time.', duration: 6000,
      draw: (t) => {
        const path = [[0, 3], [1, 3], [2, 3], [2, 3], [2, 2], [2, 1]], lines = ['move()', 'move()', 'turn_left()', 'move()', 'move()']
        const [pos, i] = walk(path, seg(t, 0.05, 0.95))
        return <><Board robot={pos} /><Code lines={lines} active={Math.min(i, lines.length - 1)} /></>
      } },
    { caption: 'A loop repeats steps. "for i in range(3)" means: do it 3 times.', duration: 5000,
      draw: (t) => {
        const [pos, i] = walk([[0, 1], [1, 1], [2, 1], [3, 1]], seg(t, 0.05, 0.9))
        return <><Board robot={pos} /><Code lines={['for i in range(3):', '    move()']} active={1} output={`i = ${Math.min(i, 2)}`} /></>
      } },
    { caption: 'An if checks a condition. If there is a wall ahead, the robot turns. Otherwise it moves.', duration: 5000,
      draw: (t) => {
        const turned = t > 0.5
        return (
          <>
            <Board robot={[4, 3]} />
            <rect x={GRID.x + GRID.cols * GRID.cell} y={GRID.y + 3 * GRID.cell} width="6" height={GRID.cell} fill={C.red} />
            <Emoji x={cellXY([4, 3])[0]} y={cellXY([4, 3])[1] - 26} size={18}>{turned ? '⬆️' : '➡️'}</Emoji>
            <Code lines={['if wall_ahead():', '    turn_left()', 'else:', '    move()']} active={turned ? 1 : 0} />
          </>
        )
      } },
    { caption: 'Step by step, the robot reaches the star. Computers follow our instructions exactly!', duration: 5000,
      draw: (t) => {
        const [pos, i] = walk([[4, 3], [4, 2], [4, 1], [4, 0]], seg(t, 0.05, 0.7))
        return <><Board robot={pos} sparkle={seg(t, 0.7, 0.85) * Math.abs(Math.sin(t * 30))} /><Code lines={['for i in range(3):', '    move()', 'print("Done!")']} active={t > 0.7 ? 2 : 1} output={t > 0.75 ? 'Done!' : `i = ${Math.min(i, 2)}`} /></>
      } },
  ],
}

// ------------------------------------------------------------------ computer science: stacks and lists

const Plate = ({ x = 200, y, n, color = '#e7f5ff' }) => <g><ellipse cx={x} cy={y} rx="70" ry="13" fill={color} stroke={C.blue} strokeWidth="2" /><Label x={x} y={y + 1} size={12} color={C.blue}>{n}</Label></g>
const FRUITS = ['🍎', '🍌', '🍇', '🍓', '🍊']

const stack = {
  title: 'Stacks and lists',
  frames: [
    { caption: 'A stack is like a pile of plates. You can only reach the plate on top.', duration: 3000,
      draw: (t) => <><line x1="100" y1="222" x2="300" y2="222" stroke={C.muted} strokeWidth="4" /><g opacity={seg(t, 0, 0.4)}><Plate y={208} n="1" /></g></> },
    { caption: 'push puts a new plate on the top of the stack.', duration: 4500,
      draw: (t) => (
        <>
          <line x1="100" y1="222" x2="300" y2="222" stroke={C.muted} strokeWidth="4" />
          <Plate y={208} n="1" />
          {[2, 3, 4].map((n, k) => <g key={n} opacity={seg(t, k * 0.3, k * 0.3 + 0.05)}><Plate y={lerp(20, 208 - (k + 1) * 26, ease(seg(t, k * 0.3, k * 0.3 + 0.25)))} n={n} /></g>)}
          <text x="20" y="40" fontSize="14" fill={C.primary} style={mono}>push({Math.min(4, 2 + Math.floor(t * 3))})</text>
        </>
      ) },
    { caption: 'pop takes the top plate off. The last one in is the first one out!', duration: 4000,
      draw: (t) => (
        <>
          <line x1="100" y1="222" x2="300" y2="222" stroke={C.muted} strokeWidth="4" />
          {[1, 2, 3].map((n, k) => <Plate key={n} y={208 - k * 26} n={n} />)}
          <g transform={`translate(${lerp(0, 120, ease(seg(t, 0.2, 0.7)))} ${lerp(0, -90, ease(seg(t, 0.2, 0.7)))})`}><Plate y={130} n="4" color="#ffe8cc" /></g>
          <text x="20" y="40" fontSize="14" fill={C.orange} style={mono} opacity={seg(t, 0.6, 0.8)}>pop() → 4</text>
        </>
      ) },
    { caption: 'A list keeps items in order. Each item has a number called an index, starting from 0.', duration: 5000,
      draw: (t) => {
        const pick = 2, hl = seg(t, 0.55, 0.7)
        return (
          <>
            {FRUITS.map((f, k) => (
              <g key={k} opacity={seg(t, k * 0.08, k * 0.08 + 0.15)}>
                <rect x={50 + k * 62} y="95" width="54" height="54" rx="8" fill={k === pick && hl ? '#fff3bf' : C.soft} stroke={k === pick && hl ? C.orange : C.primary} strokeWidth="2" />
                <Emoji x={77 + k * 62} y={122} size={28}>{f}</Emoji>
                <Label x={77 + k * 62} y={168} size={13} color={C.muted}>{k}</Label>
              </g>
            ))}
            <text x="120" y="215" fontSize="15" fill={C.ink} style={mono} opacity={seg(t, 0.6, 0.8)}>fruits[2] → 🍇</text>
          </>
        )
      } },
  ],
}

// ------------------------------------------------------------------ computer science: networks

const NET = { router: [200, 130], a: [60, 50], b: [340, 50], c: [60, 210], d: [340, 210] }
const NetBase = ({ draw = 1 }) => (
  <>
    {['a', 'b', 'c', 'd'].map((k) => <line key={k} x1={NET.router[0]} y1={NET.router[1]} x2={lerp(NET.router[0], NET[k][0], draw)} y2={lerp(NET.router[1], NET[k][1], draw)} stroke="#ced4da" strokeWidth="4" />)}
    <Emoji x={NET.router[0]} y={NET.router[1]} size={42}>📡</Emoji>
    {['a', 'b', 'c', 'd'].map((k) => <Emoji key={k} x={NET[k][0]} y={NET[k][1]} size={40} opacity={draw}>💻</Emoji>)}
  </>
)
const Packet = ({ x, y, n }) => <g><rect x={x - 11} y={y - 11} width="22" height="22" rx="4" fill={C.orange} /><Label x={x} y={y + 1} size={11} color="#fff">{n}</Label></g>

const network = {
  title: 'Messages across a network',
  frames: [
    { caption: 'Computers connect through wires and Wi-Fi to make a network.', duration: 3500, draw: (t) => <NetBase draw={ease(seg(t, 0, 0.7))} /> },
    { caption: 'To send a message, the computer cuts it into small pieces called packets.', duration: 4000,
      draw: (t) => <><NetBase />{t < 0.4 ? <Emoji x={60} y={95} size={30}>✉️</Emoji> : [1, 2, 3].map((n) => <Packet key={n} x={30 + n * 22} y={lerp(95, 90, seg(t, 0.4, 0.6))} n={n} />)}</> },
    { caption: 'The packets travel through the network and find their way to the right computer.', duration: 5000,
      draw: (t) => <><NetBase />{[1, 2, 3].map((n, k) => { const [x, y] = along([NET.a, NET.router, NET.d], ease(seg(t, k * 0.15, k * 0.15 + 0.6))); return <Packet key={n} x={x} y={y} n={n} /> })}</> },
    { caption: 'At the other end, the packets join back together. Message delivered!', duration: 3500,
      draw: (t) => <><NetBase />{t < 0.4 ? [1, 2, 3].map((n) => <Packet key={n} x={lerp(318 + n * 12, 340, seg(t, 0, 0.4))} y={170} n={n} />) : <Emoji x={340} y={165} size={30} scale={pop(seg(t, 0.4, 0.6))}>✉️</Emoji>}<Emoji x={370} y={175} size={24} opacity={seg(t, 0.6, 0.8)}>✅</Emoji></> },
  ],
}

// ------------------------------------------------------------------ computer science: binary

function Bulb({ x, y, on, label, value }) {
  return (
    <g>
      {on && <circle cx={x} cy={y} r="34" fill="url(#anim-glow)" />}
      <circle cx={x} cy={y} r="20" fill={on ? C.yellow : '#e9ecef'} stroke={C.muted} strokeWidth="2" />
      <rect x={x - 8} y={y + 18} width="16" height="10" fill="#adb5bd" />
      <Label x={x} y={y + 46} size={18} color={on ? C.orange : C.muted}>{on ? 1 : 0}</Label>
      {value !== undefined && <Label x={x} y={y - 34} size={12} color={C.muted}>{value}</Label>}
      {label}
    </g>
  )
}

const binary = {
  title: 'Counting with switches',
  frames: [
    { caption: 'A computer stores everything as 0s and 1s, like light switches: off is 0 and on is 1.', duration: 4000,
      draw: (t) => <Bulb x={200} y={110} on={Math.floor(t * 4) % 2 === 1} /> },
    { caption: 'With 3 switches worth 4, 2 and 1, we can count from 0 up to 7.', duration: 6500,
      draw: (t) => {
        const n = Math.min(7, Math.floor(seg(t, 0.05, 0.95) * 8))
        return <>{[4, 2, 1].map((v, k) => <Bulb key={v} x={110 + k * 90} y={100} on={(n & v) > 0} value={v} />)}<Label x={200} y={215} size={22} color={C.primary}>= {n}</Label></>
      } },
    { caption: '101 in binary means 4 + 0 + 1, which is 5.', duration: 4000,
      draw: (t) => <>{[4, 2, 1].map((v, k) => <Bulb key={v} x={110 + k * 90} y={100} on={v !== 2} value={v} />)}<Label x={200} y={215} size={20} color={C.primary} show={seg(t, 0.3, 0.6)}>4 + 0 + 1 = 5</Label></> },
    { caption: '8 bits make a byte. Letters, pictures and music are all stored as bits!', duration: 4500,
      draw: (t, ms) => (
        <>
          {Array.from({ length: 8 }, (_, k) => <Bulb key={k} x={35 + k * 47} y={90} on={Math.sin(ms / 300 + k * 1.7) > 0} />)}
          {['🔤', '🖼️', '🎵'].map((e, k) => <Emoji key={k} x={120 + k * 80} y={205} size={34} scale={pop(seg(t, 0.4 + k * 0.15, 0.6 + k * 0.15))}>{e}</Emoji>)}
        </>
      ) },
  ],
}

// ------------------------------------------------------------------ computer science: databases

const ROWS = [['Asha', '10', 'Pune'], ['Ravi', '9', 'Delhi'], ['Meera', '10', 'Goa'], ['Kabir', '8', 'Pune'], ['Zoya', '10', 'Agra']]
function Table({ rows = ROWS, y = 30, shown = 1, highlight = () => false }) {
  return (
    <>
      {['Name', 'Grade', 'City'].map((h, c) => <g key={h}><rect x={70 + c * 90} y={y} width="88" height="24" fill={C.primary} /><Label x={114 + c * 90} y={y + 12} size={12} color="#fff">{h}</Label></g>)}
      {rows.map((r, i) => r.map((v, c) => (
        <g key={`${i}${c}`} opacity={clamp(shown * rows.length - i)}>
          <rect x={70 + c * 90} y={y + 26 + i * 24} width="88" height="22" fill={highlight(r) ? '#fff3bf' : '#f8f9fa'} stroke="#dee2e6" />
          <Label x={114 + c * 90} y={y + 37 + i * 24} size={12} weight={600}>{v}</Label>
        </g>
      )))}
    </>
  )
}
const QUERY = 'SELECT * FROM students WHERE grade = 10'

const database = {
  title: 'Asking a database',
  frames: [
    { caption: 'A database stores information neatly in tables, like a class register.', duration: 3500, draw: (t) => <Table shown={seg(t, 0, 0.8)} /> },
    { caption: 'We ask it questions with SQL. "Show me the students in grade 10."', duration: 5000,
      draw: (t) => (
        <>
          <Table highlight={(r) => t > 0.7 && r[1] === '10'} />
          <text x="20" y="200" fontSize="12" fill={C.ink} style={mono}>{QUERY.slice(0, Math.floor(seg(t, 0, 0.6) * QUERY.length))}</text>
        </>
      ) },
    { caption: 'The database finds the matching rows and gives them back.', duration: 4000,
      draw: (t) => <><g opacity={1 - seg(t, 0, 0.3) * 0.7}><Table /></g><g transform={`translate(0 ${lerp(0, 110, ease(seg(t, 0.2, 0.6)))})`} opacity={seg(t, 0.2, 0.3)}><Table rows={ROWS.filter((r) => r[1] === '10')} y={30} highlight={() => true} /></g></> },
    { caption: 'Each row is one record (one student). Each column is one field (one kind of information).', duration: 4000,
      draw: (t) => (
        <>
          <Table />
          <rect x="68" y="78" width="274" height="26" fill="none" stroke={C.orange} strokeWidth="3" rx="4" opacity={seg(t, 0.1, 0.3)} />
          <Label x={370} y={90} size={12} color={C.orange} show={seg(t, 0.2, 0.4)}>row</Label>
          <rect x="158" y="28" width="92" height="148" fill="none" stroke={C.green} strokeWidth="3" rx="4" opacity={seg(t, 0.5, 0.7)} />
          <Label x={204} y={192} size={12} color={C.green} show={seg(t, 0.6, 0.8)}>column</Label>
        </>
      ) },
  ],
}

export const SOCIETY_SCENES = {
  globe, timeline, society, 'earth-layers': earthLayers, landforms, factory, 'sentence-builder': sentenceBuilder, letter,
  figurative, 'supply-demand': supplyDemand, 'money-flow': moneyFlow, 'code-robot': codeRobot, stack, network, binary, database,
}
