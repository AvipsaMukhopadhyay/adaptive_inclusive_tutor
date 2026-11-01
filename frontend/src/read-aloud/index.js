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

const SPEEDS = { slow: 0.8, normal: 0.95, fast: 1.15 }
const SPEED_KEY = 'read-aloud-speed'
const VOICE_KEY = 'read-aloud-voice'
// Sentences handed to the speech engine ahead of time, so one flows into the next without a gap.
const LOOKAHEAD = 3
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
  return [...lines].map(([el, nodes]) => ({ el, nodes, parsed: null, top: 0 }))
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

// ------------------------------------------------------------------ choosing a natural voice

let voices = []

/** Higher is more natural: neural "Natural"/"Online" voices (Edge) and Google voices (Chrome) beat desktop ones. */
function voiceScore(v) {
  let score = 0
  if (/natural/i.test(v.name)) score += 100
  if (/online/i.test(v.name)) score += 40
  if (/^google/i.test(v.name)) score += 60
  if (!v.localService) score += 10
  if (/^en-IN/i.test(v.lang)) score += 20
  else if (/^en-(GB|US)/i.test(v.lang)) score += 10
  if (/^en/i.test(v.lang)) score += 5
  return score
}

function loadVoices() {
  const all = synth.getVoices()
  const english = all.filter((v) => /^en/i.test(v.lang))
  voices = (english.length ? english : all).slice().sort((a, b) => voiceScore(b) - voiceScore(a))
  renderVoices()
}

function savedVoiceName() {
  try { return localStorage.getItem(VOICE_KEY) } catch { return null }
}

function currentVoice() {
  const name = savedVoiceName()
  return voices.find((v) => v.name === name) || voices[0] || null
}

/** "Microsoft Aria Online (Natural) - English (United States)" -> "Aria · Natural (US)" */
function voiceLabel(v) {
  const region = { 'en-IN': 'India', 'en-GB': 'UK', 'en-US': 'US', 'en-AU': 'Australia', 'en-CA': 'Canada' }[v.lang] || v.lang
  const name = v.name.replace(/^(Microsoft|Google)\s+/i, '').replace(/\s*-\s*English.*$/i, '')
    .replace(/\s*Online\s*\(Natural\)/i, ' · Natural').replace(/\s*\(Natural\)/i, ' · Natural')
  return `${name} (${region})`
}

// ------------------------------------------------------------------ the reader

const state = {
  active: false,
  paused: false,
  lines: [],
  li: 0, // line being spoken
  si: 0, // sentence being spoken in that line
  queued: null, // next position to hand to the speech engine
  inFlight: 0,
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
  state.inFlight = 0
  state.queued = null
  synth.cancel()
}

function absTop(el) {
  return el.getBoundingClientRect().top + window.scrollY
}

/** The first sentence at or after (li, si) that has something to say, or null at the end of the screen. */
function normalize(li, si) {
  while (li < state.lines.length) {
    const line = state.lines[li]
    if (!line.parsed) {
      line.parsed = parse(line)
      line.top = line.el.isConnected ? absTop(line.el) : 0
    }
    if (si < line.parsed.sentences.length) return { li, si }
    li++
    si = 0
  }
  return null
}

function after({ li, si }) {
  return normalize(li, si + 1)
}

/** Starts speaking from a position, queueing a few sentences ahead for gap-free speech. */
function speakFrom(pos) {
  silence()
  if (!pos) return finish()
  state.li = pos.li
  state.si = pos.si
  state.queued = pos
  fill(state.token)
  render()
}

function fill(token) {
  while (token === state.token && state.queued && state.inFlight < LOOKAHEAD) {
    const pos = state.queued
    state.queued = after(pos)
    state.inFlight++
    enqueue(pos, token, state.queued === null)
  }
}

function enqueue(pos, token, last) {
  const line = state.lines[pos.li]
  const sentence = line.parsed.sentences[pos.si]
  let text = line.parsed.spoken.slice(sentence.start, sentence.end)
  // Headings, labels and buttons have no full stop; adding one gives a natural falling tone and a short pause.
  if (!/[.!?:;]["')\]]*$/.test(text)) text += '.'

  const u = new SpeechSynthesisUtterance(text)
  const voice = currentVoice()
  if (voice) {
    u.voice = voice
    u.lang = voice.lang
  }
  u.rate = SPEEDS[speed]
  u.pitch = 1

  u.onstart = () => {
    if (token !== state.token) return
    if (location.pathname !== state.path) return stop()
    if (!line.el.isConnected || !line.nodes.every((n) => n.isConnected)) return recover(line)
    state.li = pos.li
    state.si = pos.si
    markLine(line, sentence)
    render()
  }
  u.onboundary = (e) => {
    if (token === state.token && (!e.name || e.name === 'word')) markWord(line, sentence, e.charIndex, e.charLength)
  }
  const done = () => {
    if (token !== state.token) return
    state.inFlight--
    if (last && state.inFlight <= 0) return finish()
    fill(token)
  }
  u.onend = done
  u.onerror = (e) => {
    if (token !== state.token) return
    // Another speak button on the page took over the voice: step aside.
    if (e.error === 'interrupted' || e.error === 'canceled') return stop()
    done()
  }
  synth.speak(u)
}

/** The page re-rendered under us (e.g. a new chat message): re-read the screen and carry on from the same place. */
function recover(line) {
  const y = line.top
  state.lines = collectLines()
  const idx = state.lines.findIndex((l) => absTop(l.el) >= y - 1)
  speakFrom(idx < 0 ? null : normalize(idx, 0))
}

function start(fromEl) {
  const lines = collectLines()
  if (!lines.length) return
  silence()
  state.lines = lines
  state.path = location.pathname
  state.active = true
  state.paused = false
  // From the top of the page, or from the line the student tapped.
  const li = fromEl ? Math.max(0, lines.findIndex((l) => l.el === fromEl)) : 0
  document.addEventListener('click', onPageClick, true)
  speakFrom(normalize(li, 0))
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
    speakFrom({ li: state.li, si: state.si })
  }
}

function step(delta) {
  if (!state.active) return
  state.paused = false
  // "Back" first returns to the start of the current line, like a music player.
  if (delta < 0 && state.si > 0) return speakFrom({ li: state.li, si: 0 })
  let li = state.li + delta
  if (delta < 0) {
    while (li > 0 && !normalize(li, 0)) li--
    return speakFrom(normalize(Math.max(li, 0), 0))
  }
  speakFrom(normalize(li, 0))
}

/** Speed or voice changed: carry on from the current sentence with the new setting. */
function restartCurrent() {
  if (state.active && !state.paused) speakFrom({ li: state.li, si: state.si })
}

function setSpeed(value) {
  speed = value
  try { localStorage.setItem(SPEED_KEY, value) } catch { /* private mode: keep it for this visit only */ }
  restartCurrent()
}

function setVoice(name) {
  try { localStorage.setItem(VOICE_KEY, name) } catch { /* private mode */ }
  restartCurrent()
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
  const settings = el('div', { class: 'ra-settings' })
  const voiceSel = el('select', { class: 'ra-select ra-voice', 'aria-label': 'Voice' })
  const speedSel = el('select', { class: 'ra-select', 'aria-label': 'Reading speed' },
    '<option value="slow">Slow</option><option value="normal">Normal</option><option value="fast">Fast</option>')
  const fab = el('button', { type: 'button', class: 'ra-fab' })

  speedSel.value = speed
  back.onclick = () => step(-1)
  next.onclick = () => step(1)
  pause.onclick = togglePause
  speedSel.onchange = () => setSpeed(speedSel.value)
  voiceSel.onchange = () => setVoice(voiceSel.value)
  fab.onclick = () => (state.active ? stop() : start())

  controls.append(back, pause, next)
  settings.append(voiceSel, speedSel)
  panel.append(status, controls, settings)
  widget.append(panel, fab)
  document.body.append(widget)
  ui = { panel, status, pause, fab, voiceSel }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && state.active) stop()
  })
  window.addEventListener('pagehide', () => synth.cancel())
  // Voices load asynchronously in most browsers.
  loadVoices()
  synth.addEventListener?.('voiceschanged', loadVoices)
  render()
}

function renderVoices() {
  if (!ui) return
  const chosen = currentVoice()
  ui.voiceSel.innerHTML = ''
  voices.forEach((v) => {
    const opt = document.createElement('option')
    opt.value = v.name
    opt.textContent = voiceLabel(v)
    ui.voiceSel.append(opt)
  })
  if (chosen) ui.voiceSel.value = chosen.name
  ui.voiceSel.hidden = voices.length < 2
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
