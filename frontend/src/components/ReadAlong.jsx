import { useEffect, useMemo, useRef, useState } from 'react'

/**
 * Text that can be read aloud with each word highlighted as it is spoken.
 * Helps learners who find reading hard follow along with their eyes.
 */
export default function ReadAlong({ text, as: Tag = 'p', className = '', enabled = true }) {
  const [active, setActive] = useState(-1)
  const [speaking, setSpeaking] = useState(false)
  const utterance = useRef(null)

  // Word boundaries (start offsets) so speech events can be mapped to words.
  const words = useMemo(() => {
    const out = []
    const re = /\S+/g
    let m
    while ((m = re.exec(text || ''))) out.push({ word: m[0], start: m.index })
    return out
  }, [text])

  useEffect(() => () => { if (utterance.current) window.speechSynthesis?.cancel() }, [])

  const supported = enabled && typeof window !== 'undefined' && !!window.speechSynthesis
  if (!supported) return <Tag className={className}>{text}</Tag>

  const speak = () => {
    const synth = window.speechSynthesis
    synth.cancel()
    if (speaking) { setSpeaking(false); setActive(-1); return }
    const u = new SpeechSynthesisUtterance(text)
    u.rate = 0.85
    u.onboundary = (e) => {
      if (e.name && e.name !== 'word') return
      let idx = words.findIndex((w, i) => e.charIndex >= w.start && (i === words.length - 1 || e.charIndex < words[i + 1].start))
      setActive(idx)
    }
    u.onend = u.onerror = () => { setSpeaking(false); setActive(-1) }
    utterance.current = u
    setSpeaking(true)
    synth.speak(u)
  }

  return (
    <div className="read-along">
      <Tag className={className}>
        {words.map((w, i) => (
          <span key={i} className={i === active ? 'ra-word on' : 'ra-word'}>{w.word} </span>
        ))}
      </Tag>
      <button type="button" className="btn-speak" onClick={speak} aria-label={speaking ? 'Stop reading' : 'Read aloud'}>
        {speaking ? '⏹ Stop' : '🔊 Read to me'}
      </button>
    </div>
  )
}
