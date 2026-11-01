// Read-aloud for the whole screen.
//
// Adds a floating "Read aloud" button to every page. Pressing it reads all the visible text on the
// screen line by line with the browser's built-in voice, highlighting the line (and the word) being
// spoken and scrolling it into view. While reading, any line can be clicked to read from there.
//
// It is self-contained: it reads the page's DOM and never changes the app's own elements, so it works
// on every page (login, sign-up, dashboard, lessons, practice, tutor chat) without touching their code.
import './read-aloud.css'

const synth = typeof window !== 'undefined' ? window.speechSynthesis : null

const SPEEDS = { slow: 0.75, normal: 0.9, fast: 1.1 }
const SPEED_KEY = 'read-aloud-speed'
const ROOT_SELECTOR = '#root'
const BLOCK_DISPLAYS = new Set(['block', 'flex', 'grid', 'list-item', 'table-cell', 'table-caption', 'flow-root'])
const BLOCK_TAGS = new Set(['BUTTON', 'LABEL', 'A', 'SUMMARY'])
const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE', 'SELECT', 'OPTION', 'TEXTAREA', 'SVG'])
// Emoji, arrows and symbols are blanked (same length, so highlight offsets still line up) instead of
// being spoken as "rightwards arrow" or "owl".
const UNSPOKEN = /[\p{Extended_Pictographic}←-⇿⌀-⏿①-➿⬀-⯿️‍•·]/gu
const HAS_WORDS = /[\p{L}\p{N}]/u
const highlights = typeof CSS !== 'undefined' && CSS.highlights && typeof Highlight !== 'undefined'

// ------------------------------------------------------------------ reading the screen

/** The nearest ancestor that starts its own line on screen (a paragraph, heading, list item, button...). */
function blockOf(node, root) {
  for (let el = node.parentElement; el && el !== root; el = el.parentElement) {
    if (BLOCK_TAGS.has(el.tagName)) return el
    if (BLOCK_DISPLAYS.has(getComputedStyle(el).display)) return el
  }
  return root
}

function hidden(el) {
  if (el.closest('[aria-hidden="true"], [hidden], .ra-widget')) return true
  if (!el.getClientRects().length) return true
  const style = getComputedStyle(el)
  return style.visibility === 'hidden' || style.opacity === '0'
}

/** Every visible line of text on the screen, in reading order, each with the text nodes it is made of. */
function collectLines() {
  const root = document.querySelector(ROOT_SELECTOR) || document.body
  const lines = new Map()
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!node.nodeValue.trim()) return NodeFilter.FILTER_REJECT
      for (let el = node.parentElement; el && el !== root; el = el.parentElement) {
        if (SKIP_TAGS.has(el.tagName.toUpperCase())) return NodeFilter.FILTER_REJECT
      }
      return NodeFilter.FILTER_ACCEPT
    },
  })
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const el = blockOf(node, root)
    if (hidden(node.parentElement)) continue
    if (!lines.has(el)) lines.set(el, [])
    lines.get(el).push(node)
  }
  return [...lines].map(([el, nodes]) => ({ el, nodes, parsed: null }))
}

/** Joins a line's text nodes into one string and splits it into sentences, keeping node offsets for highlighting. */
function parse(line) {
  let text = ''
  const segs = []
  line.nodes.forEach((node, i) => {
    const value = node.nodeValue
    const prev = line.nodes[i - 1]
    if (prev && prev.parentElement !== node.parentElement && !/\s$/.test(text) && !/^\s/.test(value)) text += ' '
    segs.push({ node, start: text.length, end: text.length + value.length })
    text += value
  })
  const spoken = text.replace(UNSPOKEN, (m) => ' '.repeat(m.length))

  const sentences = []
  const re = /[.!?]+["')\]]*(?=\s|$)/g
  let from = 0
  const push = (to) => {
    let s = from, e = to
    while (s < e && /\s/.test(spoken[s])) s++
    while (e > s && /\s/.test(spoken[e - 1])) e--
    if (HAS_WORDS.test(spoken.slice(s, e))) sentences.push({ start: s, end: e })
  }
  for (let m = re.exec(spoken); m; m = re.exec(spoken)) {
    push(m.index + m[0].length)
    from = m.index + m[0].length
  }
  push(spoken.length)
  return { spoken, segs, sentences }
}

/** A DOM range over [start, end) of a parsed line's string. */
function rangeFor({ segs }, start, end) {
  const at = (pos, isEnd) => {
    for (let i = 0; i < segs.length; i++) {
      const s = segs[i]
      if (pos < s.start) return isEnd ? (i ? [segs[i - 1].node, segs[i - 1].end - segs[i - 1].start] : null) : [s.node, 0]
      if (pos < s.end || (isEnd && pos === s.end)) return [s.node, pos - s.start]
    }
    const last = segs[segs.length - 1]
    return [last.node, last.end - last.start]
  }
  const a = at(start, false)
  const b = at(end, true)
  if (!a || !b || !a[0].isConnected || !b[0].isConnected) return null
  try {
    const r = document.createRange()
    r.setStart(a[0], a[1])
    r.setEnd(b[0], b[1])
    return r
  } catch {
    return null
  }
}

// ------------------------------------------------------------------ the reader

const state = {
  active: false,
  paused: false,
  lines: [],
  li: 0, // current line
  si: 0, // current sentence in that line
  token: 0,
  path: '',
  current: null,
}

let ui = null

function loadSpeed() {
  try { return SPEEDS[localStorage.getItem(SPEED_KEY)] ? localStorage.getItem(SPEED_KEY) : 'normal' } catch { return 'normal' }
}
let speed = loadSpeed()

function calm() {
  return document.body.classList.contains('calm-mode') || window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function clearMarks() {
  state.current?.classList.remove('ra-line-active')
  state.current = null
  if (highlights) {
    CSS.highlights.delete('ra-sentence')
    CSS.highlights.delete('ra-word')
  }
}

function markLine(line, sentence) {
  if (state.current !== line.el) {
    state.current?.classList.remove('ra-line-active')
    state.current = line.el
    line.el.classList.add('ra-line-active')
  }
  const r = line.el.getBoundingClientRect()
  if (r.top < 70 || r.bottom > window.innerHeight - 90) {
    line.el.scrollIntoView({ block: 'center', behavior: calm() ? 'auto' : 'smooth' })
  }
  if (highlights) {
    const range = rangeFor(line.parsed, sentence.start, sentence.end)
    if (range) CSS.highlights.set('ra-sentence', new Highlight(range))
    CSS.highlights.delete('ra-word')
  }
}

function markWord(line, sentence, charIndex, charLength) {
  if (!highlights) return
  const text = line.parsed.spoken
  const start = sentence.start + charIndex
  let end = charLength ? start + charLength : start
  if (!charLength) while (end < sentence.end && !/\s/.test(text[end])) end++
  const range = rangeFor(line.parsed, start, Math.min(end, sentence.end))
  if (range) CSS.highlights.set('ra-word', new Highlight(range))
}

/** Silences our own speech without treating it as someone else interrupting. */
function silence() {
  state.token++
  synth.cancel()
}

function speakCurrent() {
  if (!state.active || state.paused) return
  if (location.pathname !== state.path) return stop()

  // Skip lines with nothing to say; recover if the page re-rendered under us.
  for (;;) {
    if (state.li >= state.lines.length) return finish()
    const line = state.lines[state.li]
    if (!line.el.isConnected || !line.nodes.every((n) => n.isConnected)) {
      const y = line.top ?? 0
      state.lines = collectLines()
      state.li = Math.max(0, state.lines.findIndex((l) => absTop(l.el) >= y))
      if (state.li < 0 || !state.lines.length) return finish()
      state.si = 0
      continue
    }
    line.parsed ??= parse(line)
    line.top = absTop(line.el)
    if (state.si < line.parsed.sentences.length) break
    state.li++
    state.si = 0
  }

  const line = state.lines[state.li]
  const sentence = line.parsed.sentences[state.si]
  markLine(line, sentence)
  render()

  const token = ++state.token
  const u = new SpeechSynthesisUtterance(line.parsed.spoken.slice(sentence.start, sentence.end))
  u.rate = SPEEDS[speed]
  u.onboundary = (e) => {
    if (token === state.token && (!e.name || e.name === 'word')) markWord(line, sentence, e.charIndex, e.charLength)
  }
  u.onend = () => {
    if (token !== state.token) return
    state.si++
    speakCurrent()
  }
  u.onerror = (e) => {
    if (token !== state.token) return
    // Another speak button on the page took over the voice: step aside.
    if (e.error === 'interrupted' || e.error === 'canceled') return stop()
    state.si++
    speakCurrent()
  }
  synth.speak(u)
}

function absTop(el) {
  return el.getBoundingClientRect().top + window.scrollY
}

function start(fromEl) {
  const lines = collectLines()
  if (!lines.length) return
  silence()
  state.lines = lines
  state.path = location.pathname
  state.active = true
  state.paused = false
  state.si = 0
  // From the top of the page, or from the line the student tapped.
  state.li = fromEl ? Math.max(0, lines.findIndex((l) => l.el === fromEl)) : 0
  document.addEventListener('click', onPageClick, true)
  speakCurrent()
  render()
}

function stop() {
  silence()
  state.active = false
  state.paused = false
  clearMarks()
  document.removeEventListener('click', onPageClick, true)
  render()
}

function finish() {
  stop()
  setStatus('Finished reading this screen.')
}

function togglePause() {
  if (!state.active) return
  state.paused = !state.paused
  if (state.paused) {
    silence() // pause() is unreliable across browsers; resuming re-reads the current sentence instead.
    render()
  } else {
    speakCurrent()
  }
}

function step(delta) {
  if (!state.active) return
  silence()
  const line = state.lines[state.li]
  // "Back" first returns to the start of the current line, like a music player.
  if (delta < 0 && state.si > 0) state.si = 0
  else {
    state.li = Math.min(Math.max(state.li + delta, 0), state.lines.length - 1)
    state.si = 0
  }
  if (!line) return
  state.paused = false
  speakCurrent()
}

function setSpeed(value) {
  speed = value
  try { localStorage.setItem(SPEED_KEY, value) } catch { /* private mode: keep it for this visit only */ }
  if (state.active && !state.paused) {
    silence()
    speakCurrent()
  }
}

/** While reading, clicking any line of text (not a button or field) reads from that line. */
function onPageClick(e) {
  const target = e.target
  if (!(target instanceof Element) || target.closest('.ra-widget')) return
  if (target.closest('button, a, input, select, textarea, label, summary, [role="button"], [role="radio"], [contenteditable]')) return
  const lineEls = new Set(state.lines.map((l) => l.el))
  for (let el = target; el; el = el.parentElement) {
    if (lineEls.has(el)) {
      start(el)
      return
    }
  }
}

// ------------------------------------------------------------------ the button and controls

const ICON_SPEAKER = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16 8.5a4.5 4.5 0 0 1 0 7M18.5 6a8 8 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>'
const ICON_STOP = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>'

function el(tag, attrs = {}, html = '') {
  const node = document.createElement(tag)
  Object.entries(attrs).forEach(([k, v]) => node.setAttribute(k, v))
  node.innerHTML = html
  return node
}

function mount() {
  if (!synth || document.querySelector('.ra-widget')) return
  const widget = el('div', { class: 'ra-widget', role: 'region', 'aria-label': 'Read aloud' })
  const panel = el('div', { class: 'ra-panel', hidden: '' })
  const status = el('p', { class: 'ra-status', 'aria-live': 'polite' })
  const controls = el('div', { class: 'ra-controls' })
  const back = el('button', { type: 'button', class: 'ra-btn', 'aria-label': 'Previous line' }, '⏮<span>Back</span>')
  const pause = el('button', { type: 'button', class: 'ra-btn ra-main' })
  const next = el('button', { type: 'button', class: 'ra-btn', 'aria-label': 'Next line' }, '<span>Next</span>⏭')
  const speedSel = el('select', { class: 'ra-speed', 'aria-label': 'Reading speed' },
    '<option value="slow">Slow</option><option value="normal">Normal</option><option value="fast">Fast</option>')
  const fab = el('button', { type: 'button', class: 'ra-fab' })

  speedSel.value = speed
  back.onclick = () => step(-1)
  next.onclick = () => step(1)
  pause.onclick = togglePause
  speedSel.onchange = () => setSpeed(speedSel.value)
  fab.onclick = () => (state.active ? stop() : start())

  controls.append(back, pause, next, speedSel)
  panel.append(status, controls)
  widget.append(panel, fab)
  document.body.append(widget)
  ui = { panel, status, pause, fab }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && state.active) stop()
  })
  // Leaving the page (or the app navigating to another screen) ends the reading.
  window.addEventListener('pagehide', () => synth.cancel())
  render()
}

function setStatus(text) {
  if (ui) ui.status.textContent = text
}

function render() {
  if (!ui) return
  const { panel, pause, fab } = ui
  panel.hidden = !state.active
  fab.innerHTML = state.active ? `${ICON_STOP}<span>Stop</span>` : `${ICON_SPEAKER}<span>Read aloud</span>`
  fab.setAttribute('aria-label', state.active ? 'Stop reading' : 'Read this screen aloud')
  fab.classList.toggle('on', state.active)
  pause.innerHTML = state.paused ? '▶<span>Resume</span>' : '⏸<span>Pause</span>'
  pause.setAttribute('aria-label', state.paused ? 'Resume reading' : 'Pause reading')
  if (state.active) {
    setStatus(`${state.paused ? 'Paused' : 'Reading'} line ${state.li + 1} of ${state.lines.length} · tap any line to jump`)
  }
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount)
else mount()
