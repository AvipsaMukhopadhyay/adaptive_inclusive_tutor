import { useState } from 'react'
import ReadAlong from './ReadAlong.jsx'

const STAGES = ['Read the question', 'Think about it', 'See the answer']

/** "Watch me solve it": each example is revealed in small, predictable steps. */
export default function GuidedExamples({ examples, profile, onFinish }) {
  const [i, setI] = useState(0)
  const [stage, setStage] = useState(0)
  if (!examples.length) return null
  const ex = examples[i]
  const last = i === examples.length - 1

  return (
    <section className="card guided" aria-labelledby="guided-h">
      <div className="card-head">
        <h2 id="guided-h">🧑‍🏫 Watch how to solve it ({i + 1} of {examples.length})</h2>
      </div>
      <ol className="stage-bar" aria-label="Steps">
        {STAGES.map((s, k) => <li key={s} className={k <= stage ? 'on' : ''}><span>{k + 1}</span>{s}</li>)}
      </ol>

      <div className="guided-q">
        <ReadAlong text={ex.prompt} className="prompt" enabled={profile.readAloud} />
        {ex.options?.length > 0 && (
          <div className="options readonly">
            {ex.options.map((o) => (
              <div key={o} className={`option ${stage >= 2 && o === ex.answer ? 'correct pop' : ''}`}>{o}</div>
            ))}
          </div>
        )}
      </div>

      {stage >= 1 && (
        <div className="think-box">
          <h3>💭 How to think about it</h3>
          <ReadAlong text={ex.think} enabled={profile.readAloud} />
        </div>
      )}
      {stage >= 2 && (
        <div className="answer-box pop">
          <h3>✅ Answer: {ex.answer}</h3>
          <ReadAlong text={ex.why} enabled={profile.readAloud} />
        </div>
      )}

      <div className="step-nav">
        {stage === 0 && <button className="btn-primary" onClick={() => setStage(1)}>💭 How do I think about it?</button>}
        {stage === 1 && <button className="btn-primary" onClick={() => setStage(2)}>✅ Show me the answer</button>}
        {stage === 2 && !last && <button className="btn-primary" onClick={() => { setI(i + 1); setStage(0) }}>Next example →</button>}
        {stage === 2 && last && <button className="btn-primary" onClick={onFinish}>I'm ready to try! 🎯</button>}
      </div>
    </section>
  )
}
