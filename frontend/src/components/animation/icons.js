/**
 * Keyword → picture dictionary for the owl presenter. Each entry is [word pattern, emoji]; patterns match at the
 * start of a word (so "plant" also matches "plants"); a trailing $ means the whole word, optionally plural
 * (so "ear$" does not match "earth").
 */
const ENTRIES = [
  // numbers & maths
  ['fraction', '🍕'], ['decimal', '🔟'], ['percent', '💯'], ['integer', '🔢'], ['negative', '➖'], ['positive', '➕'],
  ['prime', '🧱'], ['factor', '🧩'], ['multiple', '✖️'], ['divid', '➗'], ['divisi', '➗'], ['multipl', '✖️'],
  ['add$', '➕'], ['sum$', '➕'], ['subtract', '➖'], ['equation', '⚖️'], ['variable', '📦'], ['unknown', '❓'],
  ['angle', '📐'], ['triangle', '🔺'], ['circle', '⭕'], ['square', '🟦'], ['rectangle', '▭'], ['line$', '📏'],
  ['graph', '📈'], ['data', '📊'], ['average', '📊'], ['mean$', '📊'], ['probab', '🎲'], ['chance', '🎲'],
  ['coin$', '🪙'], ['dice', '🎲'], ['ratio', '🍋'], ['proportion', '⚖️'], ['area', '🟩'], ['perimeter', '🐜'],
  ['volume', '🧊'], ['length', '📏'], ['measure', '📏'], ['number', '🔢'], ['digit', '🔢'], ['zero', '0️⃣'],
  ['set$', '🧺'], ['function', '⚙️'], ['matri', '🔲'], ['sequence', '🪜'], ['series', '🪜'], ['progression', '🪜'],
  ['power', '⚡'], ['exponent', '🚀'], ['interest', '🏦'], ['profit', '💰'], ['loss', '📉'],
  ['discount', '🏷️'], ['price', '🏷️'], ['cost', '🏷️'],
  // physics
  ['force', '💪'], ['push', '👉'], ['pull', '🧲'], ['gravit', '🍎'], ['weight', '🏋️'], ['mass', '🧱'],
  ['friction', '🧦'], ['pressure', '🎈'], ['motion', '🏃'], ['speed', '🏎️'], ['velocit', '🏎️'], ['accelerat', '🚀'],
  ['energy', '⚡'], ['work$', '🏗️'], ['heat', '🔥'], ['temperature', '🌡️'], ['hot$', '🔥'], ['cold$', '🧊'],
  ['light', '💡'], ['mirror', '🪞'], ['lens', '🔍'], ['shadow', '👤'], ['reflect', '🪞'], ['refract', '🌈'],
  ['colour', '🌈'], ['color', '🌈'], ['eye$', '👁️'], ['sound', '🔊'], ['vibrat', '〰️'], ['wave', '🌊'],
  ['ear$', '👂'], ['electric', '⚡'], ['current', '🔌'], ['circuit', '🔌'], ['battery', '🔋'], ['bulb', '💡'],
  ['magnet', '🧲'], ['charge', '⚡'], ['wire', '🔌'], ['switch', '🔘'], ['sun$', '☀️'], ['star$', '⭐'],
  ['moon', '🌙'], ['planet', '🪐'], ['earth', '🌍'], ['orbit', '🪐'], ['rocket', '🚀'], ['time$', '⏰'],
  ['clock', '⏰'], ['radiation', '☢️'], ['photon', '✨'], ['nuclear', '☢️'],
  // chemistry
  ['atom', '⚛️'], ['electron', '⚛️'], ['proton', '⚛️'], ['molecule', '🧬'], ['element', '🧪'], ['compound', '🧪'],
  ['mixture', '🥣'], ['solution', '🧪'], ['acid', '🍋'], ['base$', '🧼'], ['salt', '🧂'], ['metal', '🔩'],
  ['iron', '🔩'], ['gold', '🥇'], ['carbon', '💎'], ['oxygen', '🫧'], ['hydrogen', '🎈'], ['water', '💧'],
  ['gas', '💨'], ['liquid', '💧'], ['solid', '🧊'], ['ice$', '🧊'], ['steam', '♨️'], ['reaction', '💥'],
  ['burn', '🔥'], ['fuel', '⛽'], ['rust', '🟫'], ['bond', '🔗'], ['periodic', '🧪'],
  // biology
  ['cell', '🦠'], ['germ', '🦠'], ['bacteri', '🦠'], ['virus', '🦠'], ['microorganism', '🔬'], ['microscope', '🔬'],
  ['plant', '🌱'], ['leaf', '🍃'], ['leaves', '🍃'], ['flower', '🌸'], ['seed', '🌰'], ['tree', '🌳'], ['root$', '🌱'],
  ['photosynthes', '🍃'], ['food', '🍎'], ['nutri', '🥗'], ['vitamin', '🥕'], ['protein', '🥚'], ['carbohydrate', '🍚'],
  ['fat$', '🧈'], ['animal', '🐾'], ['bird$', '🐦'], ['fish$', '🐟'], ['insect', '🐞'], ['human', '🧑'], ['body', '🧍'],
  ['heart', '❤️'], ['blood', '🩸'], ['lung', '🫁'], ['breath', '🫁'], ['respir', '🫁'], ['brain', '🧠'],
  ['nerve', '🧠'], ['bone', '🦴'], ['muscle', '💪'], ['tooth', '🦷'], ['teeth', '🦷'], ['stomach', '🍽️'],
  ['digest', '🍽️'], ['disease', '🤒'], ['fall ill', '🤒'], ['illness', '🤒'], ['health', '💪'], ['vaccine', '💉'], ['medicine', '💊'],
  ['gene', '🧬'], ['dna', '🧬'], ['inherit', '👪'], ['heredit', '👪'], ['parent', '👪'], ['reproduc', '🐣'],
  ['egg$', '🥚'], ['evolution', '🦕'], ['environment', '🌳'], ['ecosystem', '🌳'], ['forest', '🌲'], ['habitat', '🏞️'],
  ['crop', '🌾'], ['farm', '🧑‍🌾'], ['soil', '🟫'], ['fertili', '🌱'],
  // geography & social science
  ['globe', '🌐'], ['map$', '🗺️'], ['latitude', '🌐'], ['longitude', '🌐'], ['equator', '🌐'], ['pole$', '🧭'],
  ['mountain', '⛰️'], ['river', '🏞️'], ['ocean', '🌊'], ['sea$', '🌊'], ['island', '🏝️'], ['desert', '🏜️'],
  ['rain', '🌧️'], ['cloud', '☁️'], ['wind', '🌬️'], ['air$', '💨'], ['weather', '⛅'], ['climate', '🌡️'],
  ['volcano', '🌋'], ['earthquake', '🌋'], ['resource', '💎'], ['mineral', '💎'], ['industr', '🏭'], ['factory', '🏭'],
  ['village', '🏘️'], ['city', '🏙️'], ['india', '🇮🇳'], ['country', '🏳️'], ['nation', '🏳️'], ['government', '🏛️'],
  ['parliament', '🏛️'], ['law$', '⚖️'], ['court', '⚖️'], ['judge', '⚖️'], ['justice', '⚖️'], ['rights$', '✋'],
  ['equal', '🤝'], ['vote', '🗳️'], ['election', '🗳️'], ['democra', '🗳️'], ['constitution', '📜'], ['king$', '👑'],
  ['queen', '👑'], ['war$', '⚔️'], ['revolution', '✊'], ['freedom', '🕊️'], ['history', '📜'], ['culture', '🎭'],
  ['religion', '🛕'], ['language', '🗣️'], ['people', '👥'], ['family', '👪'], ['community', '👥'], ['diversity', '🌈'],
  // economics
  ['money', '💰'], ['bank', '🏦'], ['credit', '💳'], ['loan', '💳'], ['tax$', '🧾'], ['budget', '🧾'],
  ['income', '💵'], ['demand', '🛒'], ['supply', '🚚'], ['market', '🏪'], ['trade', '🤝'], ['export', '🚢'],
  ['import', '🚢'], ['job$', '💼'], ['worker', '👷'], ['sector', '🏭'], ['economy', '📈'], ['goods', '📦'],
  // language
  ['noun', '🏷️'], ['pronoun', '👉'], ['verb', '🏃'], ['adjective', '🎨'], ['adverb', '⚡'], ['article', '🔤'],
  ['preposition', '📍'], ['conjunction', '🔗'], ['tense', '⏳'], ['past', '⏪'], ['future', '⏩'], ['present', '⏺️'],
  ['sentence', '📝'], ['word', '🔤'], ['letter', '✉️'], ['paragraph', '📄'], ['story', '📖'], ['poem', '📜'],
  ['speech', '🎤'], ['question', '❓'], ['punctuation', '❗'], ['comma', '⏸️'], ['full stop', '🛑'], ['voice', '🗣️'],
  ['report', '📰'], ['notice', '📌'], ['debate', '🎤'], ['idiom', '💬'], ['simile', '🦁'], ['metaphor', '🎭'],
  ['vocabulary', '📚'], ['spelling', '🔤'], ['write', '✍️'], ['writing', '✍️'], ['read$', '📖'], ['book', '📚'],
  // computers
  ['computer', '💻'], ['program', '👩‍💻'], ['code', '👩‍💻'], ['python', '🐍'], ['loop', '🔁'], ['condition', '🔀'],
  ['list', '📋'], ['string', '🔤'], ['file', '📁'], ['database', '🗄️'], ['table', '🗄️'], ['network', '🌐'],
  ['internet', '🌐'], ['binary', '0️⃣'], ['bit$', '0️⃣'], ['byte', '💾'], ['memory', '💾'], ['input', '⌨️'],
  ['output', '🖥️'], ['stack', '🥞'], ['queue', '🚶'], ['algorithm', '📋'],
  // everyday things used in the "imagine" pictures
  ['chair', '🪑'], ['sunlight', '☀️'], ['garden', '🌼'], ['street', '🏘️'], ['tile', '🟦'], ['ant$', '🐜'], ['lift$', '🛗'], ['building', '🏢'], ['floor', '🏢'],
  ['kitchen', '🍳'], ['stove', '🔥'], ['ingredient', '🧂'], ['pump', '⛽'], ['pipe', '🚰'], ['trolley', '🛒'], ['sock', '🧦'],
  ['carpet', '🟥'], ['stone', '🪨'], ['pond', '🌊'], ['puddle', '💧'], ['ripple', '🌊'], ['slide', '🛝'], ['road', '🛣️'],
  ['recipe', '📖'], ['robot', '🤖'], ['track', '🏃'], ['whistle', '📯'], ['marble', '🔮'], ['bag$', '👜'], ['sweet', '🍬'],
  ['block', '🧱'], ['scale', '⚖️'], ['box', '📦'], ['detective', '🕵️'], ['pin$', '📌'], ['juice', '🧃'], ['lemonade', '🍋'],
  ['rupee', '💰'], ['paise', '🪙'], ['wall', '🧱'], ['gate', '🚪'], ['power station', '🏭'], ['camera', '📷'], ['net$', '🥅'],
  ['monitor', '🧑‍🏫'], ['class$', '🏫'], ['rulebook', '📜'], ['film', '🎬'], ['song', '🎵'], ['toy', '🧸'], ['name tag', '🏷️'],
  ['video', '📹'], ['paint', '🎨'], ['baton', '🏃'], ['race', '🏁'], ['runner', '🏃'], ['wind-up', '🧸'], ['lamp', '💡'],
  ['torch', '🔦'], ['drum', '🥁'], ['peach', '🍑'], ['ladder', '🪜'], ['pencil', '✏️'], ['ruler', '📏'], ['bucket', '🪣'],
  ['bread', '🍞'], ['milk', '🥛'], ['rice', '🍚'], ['shop', '🏪'], ['bus$', '🚌'], ['bicycle', '🚲'], ['phone', '📱'],
  // everyday
  ['school', '🏫'], ['home', '🏠'], ['house', '🏠'], ['car$', '🚗'], ['train', '🚆'], ['ball$', '⚽'], ['apple', '🍎'],
  ['mango', '🥭'], ['pizza', '🍕'], ['cake', '🍰'], ['friend', '🧑‍🤝‍🧑'], ['child', '🧒'], ['dog$', '🐕'], ['cat$', '🐈'],
]

const COMPILED = ENTRIES.map(([word, emoji]) => {
  const whole = word.endsWith('$'), w = (whole ? word.slice(0, -1) : word).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return [new RegExp(whole ? `\\b${w}(s|es)?\\b` : `\\b${w}`, 'i'), emoji]
})

const SUBJECT_ICONS = {
  Mathematics: ['🔢', '📐', '➕'], Science: ['🔬', '🌱', '⚡'], Physics: ['⚛️', '⚡', '🔭'], Chemistry: ['🧪', '⚛️', '💧'],
  Biology: ['🧬', '🌱', '🦠'], English: ['📖', '✍️', '🔤'], 'Social Science': ['🌍', '🏛️', '📜'],
  'Computer Science': ['💻', '🤖', '🔁'], Economics: ['💰', '📈', '🏪'],
}

/** Up to `max` pictures for the text, in the order the words appear. */
export function iconsFor(text, subject, max = 4) {
  const found = []
  for (const [re, emoji] of COMPILED) {
    const m = re.exec(text || '')
    if (m && !found.some((f) => f.emoji === emoji)) found.push({ emoji, at: m.index })
  }
  const icons = found.sort((a, b) => a.at - b.at).slice(0, max).map((f) => f.emoji)
  return icons.length ? icons : (SUBJECT_ICONS[subject] ?? ['💡', '⭐', '📘']).slice(0, max)
}

/** How the sentence works, so the pictures can act it out. */
export function patternOf(text) {
  const s = (text || '').toLowerCase()
  if (/→|\b(becomes?|turns? into|changes? (in)?to|converts?|produces?|forms?|gives? out|is made into)\b/.test(s)) return 'transform'
  if (/[<>]|\b(more|less|bigger|smaller|greater|larger|higher|lower|faster|slower|heavier|lighter|than)\b/.test(s)) return 'compare'
  if (/\b(because|so that|causes?|leads? to|therefore|due to|results? in)\b/.test(s)) return 'cause'
  return 'show'
}

/** A small whole number mentioned in the text (to count out as dots), or null. */
export function smallNumber(text) {
  const m = /\b([2-9]|1[0-2])\b/.exec(text || '')
  return m ? Number(m[1]) : null
}
