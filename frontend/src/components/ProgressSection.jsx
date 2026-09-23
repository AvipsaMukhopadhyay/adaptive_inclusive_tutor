import { Link } from 'react-router-dom'
import ProgressRing from './ProgressRing.jsx'

/** "How much have I finished and how much is left?" */
export default function ProgressSection({ overview }) {
  if (!overview) return null
  const { overall, subjects, continueLearning } = overview
  const left = overall.totalChapters - overall.completed

  return (
    <>
      {continueLearning && (
        <Link to={`/learn/${continueLearning.chapterId}`} className="card continue-card">
          <span className="continue-icon" aria-hidden>{continueLearning.subjectIcon}</span>
          <span className="continue-text">
            <span className="continue-label">{continueLearning.resume ? 'Continue where you left off' : 'Start your next chapter'}</span>
            <strong>{continueLearning.chapterName}</strong>
            <span className="muted small">{continueLearning.subjectName}{continueLearning.resume && ` · ${continueLearning.percent}% done`}</span>
          </span>
          <span className="btn-primary continue-btn">{continueLearning.resume ? 'Continue →' : 'Start →'}</span>
        </Link>
      )}

      <section className="card progress-card" aria-labelledby="progress-h">
        <h2 id="progress-h">📊 My progress</h2>
        <div className="progress-top">
          <ProgressRing percent={overall.percent} />
          <div className="progress-counts">
            <div className="count done"><strong>{overall.completed}</strong><span>completed</span></div>
            <div className="count doing"><strong>{overall.inProgress}</strong><span>in progress</span></div>
            <div className="count todo"><strong>{left}</strong><span>chapters left</span></div>
          </div>
        </div>
        <p className="muted small">
          A chapter is complete when you answer 5 different questions correctly, including one Hard question.
        </p>
        <ul className="subject-progress">
          {subjects.map((s) => (
            <li key={s.subjectId}>
              <span className="sp-name">{s.icon} {s.name}</span>
              <span className="bar" aria-hidden><span style={{ width: `${s.percent}%` }} /></span>
              <span className="sp-count">{s.completed}/{s.totalChapters} done</span>
            </li>
          ))}
        </ul>
      </section>
    </>
  )
}
