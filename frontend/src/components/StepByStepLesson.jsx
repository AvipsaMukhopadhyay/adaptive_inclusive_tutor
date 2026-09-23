import { useState } from 'react'
import ReadAlong from './ReadAlong.jsx'
import AnimatedVisual from './AnimatedVisual.jsx'

/**
 * One idea at a time: the idea in simple words, a "tell me more" explanation,
 * and an example (with an animated picture when available).
 */
export default function StepByStepLesson({ steps, profile, onFinish }) {
  const [i, setI] = useState(0)
  const [more, setMore] = useState(false)
  const [done, setDone] = useState(false)
  if (!steps.length) return null
  const step = steps[i]

  const go = (n) => { setI(n); setMore(false) }

  if (done) {
    return (
      <section className="card step-card step-done">
        <div className="big-emoji" aria-hidden>🎉</div>
        <h2>You learned all {steps.length} ideas!</h2>
        <p>Next, let's look at examples of how to solve questions.</p>
        <div className="step-nav">
          <button className="btn-ghost" onClick={() => { setDone(false); go(0) }}>↺ Go through again</button>
          <button className="btn-primary" onClick={onFinish}>Show me examples →</button>
        </div>
      </section>
    )
  }

  return (
    <section className="card step-card" aria-labelledby="step-h" key={i}>
      <div className="card-head">
        <h2 id="step-h">📘 Idea {i + 1} of {steps.length}</h2>
        <span className="dots" aria-hidden>{steps.map((_, k) => <span key={k} className={`dot ${k <= i ? 'on' : ''}`} />)}</span>
      </div>

      <div className="idea">
        <span className="idea-no" aria-hidden>{i + 1}</span>
        <ReadAlong text={step.point} className="idea-text" enabled={profile.readAloud} />
      </div>

      {step.detail && (
        more ? (
          <div className="more-box">
            <h3>🔍 A little more</h3>
            <ReadAlong text={step.detail} enabled={profile.readAloud} />
          </div>
        ) : (
          <button className="btn-secondary" onClick={() => setMore(true)}>🔍 Tell me more</button>
        )
      )}

      {step.example && (
        <div className="step-example">
          <h3>👀 Example: {step.example.title}</h3>
          <ReadAlong text={step.example.content} enabled={profile.readAloud} />
          {step.example.visual && <AnimatedVisual visual={step.example.visual} animate={profile.animatedVisuals} big={profile.visualExamples} />}
        </div>
      )}

      <div className="step-nav">
        <button className="btn-ghost" disabled={i === 0} onClick={() => go(i - 1)}>← Back</button>
        {i < steps.length - 1
          ? <button className="btn-primary" onClick={() => go(i + 1)}>Next idea →</button>
          : <button className="btn-primary" onClick={() => setDone(true)}>I've got it! ✓</button>}
      </div>
    </section>
  )
}
