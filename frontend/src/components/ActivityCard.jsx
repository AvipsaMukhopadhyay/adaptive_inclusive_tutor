import { useEffect, useRef, useState } from 'react'
import ReadAlong from './ReadAlong.jsx'

const DIFF = { EASY: '🟢 Easy', MEDIUM: '🟡 Medium', HARD: '🔴 Hard' }

/**
 * Shows the activity chosen by the adaptive engine, collects the answer, and tracks attempts and time.
 */
export default function ActivityCard({ activity, profile, onSubmit, onNext, busy, attempted = 0 }) {
  const [answer, setAnswer] = useState('')
  const [attempt, setAttempt] = useState(1)
  const [result, setResult] = useState(null)
  const [onBreak, setOnBreak] = useState(activity.breakSuggested)
  const startedAt = useRef(Date.now())
  const q = activity.question

  useEffect(() => {
    setAnswer('')
    setAttempt(1)
    setResult(null)
    setOnBreak(activity.breakSuggested)
    startedAt.current = Date.now()
  }, [activity])

  const submit = async (e) => {
    e.preventDefault()
    if (!answer.trim()) return
    const seconds = Math.round((Date.now() - startedAt.current) / 1000)
    const res = await onSubmit({ questionId: q.id, answer, attemptNumber: attempt, timeTakenSeconds: seconds })
    if (!res) return
    setResult(res)
    if (!res.finished) {
      setAttempt(attempt + 1)
      setAnswer('')
    }
  }

  if (onBreak) {
    return (
      <section className="card break-card">
        <h2>🧘 Quick break time!</h2>
        <p>You've been working hard. Stand up, stretch, or take a sip of water for a minute.</p>
        <button className="btn-primary" onClick={() => { setOnBreak(false); startedAt.current = Date.now() }}>I'm ready to continue</button>
      </section>
    )
  }

  const finished = result?.finished
  // Focus mode: show how many questions until the next short break.
  const breakEvery = profile.breakEvery
  const doneInRound = breakEvery ? attempted % breakEvery : 0

  return (
    <section className="card activity" aria-live="polite">
      <div className="card-head">
        <h2>🎯 Practice</h2>
        <span className={`diff diff-${q.difficulty.toLowerCase()}`}>{DIFF[q.difficulty]}</span>
      </div>

      <p className="tutor-says">{activity.tutorMessage}</p>

      {profile.focusMode && breakEvery > 0 && (
        <div className="break-meter" aria-label={`${breakEvery - doneInRound} questions until a break`}>
          {Array.from({ length: breakEvery }, (_, k) => <span key={k} className={k < doneInRound ? 'on' : ''}>⭐</span>)}
          <span className="muted small">{breakEvery - doneInRound} more until a break</span>
        </div>
      )}

      {activity.reviewPoints && (
        <div className="support">
          <h3>Let's review</h3>
          <ul>{activity.reviewPoints.map((p) => <li key={p}>{p}</li>)}</ul>
        </div>
      )}
      {activity.workedExample && (
        <div className="support">
          <h3>Worked example</h3>
          <p><strong>Q:</strong> {activity.workedExample.prompt}</p>
          {activity.workedExample.answer && <p><strong>Answer:</strong> {activity.workedExample.answer}</p>}
          <p className="muted">{activity.workedExample.explanation}</p>
        </div>
      )}

      <form onSubmit={submit}>
        <div className="question">
          <ReadAlong key={q.id} text={q.prompt} className="prompt" enabled={profile.readAloud} />
        </div>

        {q.options?.length ? (
          <div className="options" role="radiogroup">
            {q.options.map((o) => (
              <label key={o} className={`option ${answer === o ? 'selected' : ''} ${finished && o === result.correctAnswer ? 'correct' : ''}`}>
                <input type="radio" name="answer" value={o} checked={answer === o} disabled={finished}
                       onChange={() => setAnswer(o)} />
                {o}
              </label>
            ))}
          </div>
        ) : (
          <input className="answer-input" value={answer} disabled={finished} onChange={(e) => setAnswer(e.target.value)}
                 placeholder="Type your answer" aria-label="Your answer" autoFocus />
        )}

        {result && (
          <div className={`feedback ${result.correct ? 'ok' : finished ? 'bad' : 'hint'} ${profile.celebrations ? 'pop' : ''}`}>
            <p>{result.tutorMessage}</p>
          </div>
        )}

        <div className="actions">
          {!finished ? (
            <>
              <button className="btn-primary" disabled={busy || !answer.trim()}>Submit answer</button>
              <span className="muted small">Try {attempt} of {activity.maxAttempts}</span>
            </>
          ) : (
            <button type="button" className="btn-primary" onClick={onNext} disabled={busy}>Next activity →</button>
          )}
        </div>
      </form>
    </section>
  )
}
