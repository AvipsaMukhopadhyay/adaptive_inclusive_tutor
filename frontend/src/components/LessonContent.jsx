import { useState } from 'react'
import SpeakButton from './SpeakButton.jsx'
import AnimatedVisual from './AnimatedVisual.jsx'

/** Explanation, chunked when the profile asks for small steps. */
export function LearnCard({ lesson }) {
  const { profile } = lesson
  const chunks = lesson.explanationChunks
  const [part, setPart] = useState(0)
  const [showFull, setShowFull] = useState(false)
  const chunked = chunks.length > 1

  return (
    <section className="card" aria-labelledby="learn-h">
      <div className="card-head">
        <h2 id="learn-h">📘 Learn</h2>
        {profile.readAloud && <SpeakButton text={chunked ? chunks[part] : lesson.explanation} />}
      </div>

      {chunked ? (
        <>
          <p className="lesson-text">{chunks[part]}</p>
          <div className="chunk-nav">
            <button className="btn-ghost" disabled={part === 0} onClick={() => setPart(part - 1)}>← Back</button>
            <span className="dots" aria-label={`Part ${part + 1} of ${chunks.length}`}>
              {chunks.map((_, i) => <span key={i} className={`dot ${i === part ? 'on' : ''}`} />)}
            </span>
            <button className="btn-secondary" disabled={part === chunks.length - 1} onClick={() => setPart(part + 1)}>Next part →</button>
          </div>
        </>
      ) : (
        <p className="lesson-text">{lesson.explanation}</p>
      )}

      {!profile.simpleLanguage && (
        <div className="key-points">
          <h3>Key ideas</h3>
          <ul>{lesson.keyPoints.map((k) => <li key={k}>{k}</li>)}</ul>
        </div>
      )}
      {profile.simpleLanguage && (
        <button className="btn-link" onClick={() => setShowFull(!showFull)}>
          {showFull ? 'Hide full explanation' : 'Show full explanation'}
        </button>
      )}
      {profile.simpleLanguage && showFull && <p className="lesson-text muted">{lesson.explanation}</p>}
    </section>
  )
}

/** Examples (animated pictures for learners who benefit) and a hands-on activity. */
export function ExamplesCard({ lesson }) {
  const { profile } = lesson
  return (
    <section className="card" aria-labelledby="ex-h">
      <h2 id="ex-h">✏️ Examples</h2>
      <div className="examples">
        {lesson.examples.map((ex) => (
          <div className="example" key={ex.title}>
            <div className="card-head">
              <h3>{ex.title}</h3>
              {profile.readAloud && <SpeakButton text={`${ex.title}. ${ex.content}`} label="" />}
            </div>
            <p>{ex.content}</p>
            {ex.visual && <AnimatedVisual visual={ex.visual} animate={profile.animatedVisuals} big={profile.visualExamples} />}
          </div>
        ))}
      </div>
      {lesson.activity && <p className="try-this">🧩 <strong>Try this:</strong> {lesson.activity}</p>}
    </section>
  )
}
