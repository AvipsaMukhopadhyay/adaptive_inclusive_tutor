import { useEffect, useRef, useState } from 'react'
import SpeakButton from './SpeakButton.jsx'

// How the tutor presents itself for each voice (chosen on the server from the learner's profile).
const PERSONAS = {
  standard: { avatar: '🤖', title: 'Your tutor', subtitle: 'Ask anything about this chapter', placeholder: 'Ask your tutor anything…' },
  gentle: { avatar: '🦉', title: 'Your learning buddy', subtitle: "We'll go at your pace 💛", placeholder: 'Ask me anything. There are no silly questions 💛' },
  calm: { avatar: '🦉', title: 'Your tutor', subtitle: 'One step at a time', placeholder: 'Type your question here' },
  lively: { avatar: '🦊', title: 'Your study buddy', subtitle: 'Quick ideas, quick wins ⚡', placeholder: 'Ask me anything! ⚡' },
}

/** Renders the tutor's light formatting: **bold**, "• " bullet lists and paragraphs. */
function Formatted({ text }) {
  const inline = (line) => line.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**') ? <strong key={i}>{part.slice(2, -2)}</strong> : part)

  return text.split(/\n{2,}/).map((block, i) => {
    const lines = block.split('\n')
    if (lines.every((l) => l.startsWith('• '))) {
      return <ul key={i}>{lines.map((l, j) => <li key={j}>{inline(l.slice(2))}</li>)}</ul>
    }
    return <p key={i}>{lines.map((l, j) => <span key={j}>{j > 0 && <br />}{inline(l)}</span>)}</p>
  })
}

const plain = (text) => text.replace(/\*\*/g, '').replace(/•/g, '')

/** Conversational tutor panel. Messages are owned by the parent so answer feedback can appear here too. */
export default function TutorChat({ messages, suggestions, onSend, readAloud, busy, voice = 'standard', checking = false }) {
  const [text, setText] = useState('')
  const endRef = useRef(null)
  const persona = PERSONAS[voice] ?? PERSONAS.standard
  const supportive = voice !== 'standard'
  const last = messages[messages.length - 1]

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'nearest' })
  }, [messages, busy])

  const send = (msg) => {
    const m = (msg ?? text).trim()
    if (!m) return
    setText('')
    onSend(m)
  }

  return (
    <section className={`card chat voice-${voice}`} aria-label="AI tutor chat">
      <header className="chat-head">
        <span className="chat-avatar" aria-hidden="true">{persona.avatar}</span>
        <div>
          <h2>{persona.title}</h2>
          <p className="muted small">{persona.subtitle}</p>
        </div>
      </header>

      <div className="messages" aria-live="polite">
        {messages.map((m, i) => (
          <div key={i} className={`msg-row ${m.from}`}>
            {m.from === 'tutor' && <span className="msg-avatar" aria-hidden="true">{persona.avatar}</span>}
            <div className={`msg ${m.from}`}>
              <Formatted text={m.text} />
              {readAloud && m.from === 'tutor' && <SpeakButton text={plain(m.text)} label="" />}
            </div>
          </div>
        ))}
        {busy && (
          <div className="msg-row tutor">
            <span className="msg-avatar" aria-hidden="true">{persona.avatar}</span>
            <div className="msg tutor typing" aria-label="Tutor is typing"><span /><span /><span /></div>
          </div>
        )}
        {supportive && !busy && !checking && last?.from === 'tutor' && messages.length > 1 && (
          <div className="reactions" aria-label="How did that feel?">
            <button className="reaction" onClick={() => send('Got it!')}>👍 Got it</button>
            <button className="reaction" onClick={() => send("Not yet, I'm still confused")}>🤔 Not yet</button>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {checking && <p className="check-label">{supportive ? 'Tap your answer 👇' : 'Choose an answer:'}</p>}
      <div className={`chips ${checking ? 'answer-chips' : ''}`}>
        {suggestions.map((s) => (
          <button key={s} className={`chip ${checking && s !== 'Show me the answer' ? 'answer' : ''}`}
                  onClick={() => send(s)} disabled={busy}>{s}</button>
        ))}
      </div>
      <form className="chat-input" onSubmit={(e) => { e.preventDefault(); send() }}>
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder={persona.placeholder} aria-label="Message" />
        <button className="btn-primary" disabled={busy || !text.trim()}>Send</button>
      </form>
    </section>
  )
}
