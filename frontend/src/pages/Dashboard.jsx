import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client.js'
import ProgressSection from '../components/ProgressSection.jsx'

const NEED_LABELS = { DYSLEXIA: 'Dyslexia', ADHD: 'ADHD', AUTISM: 'Autism', DOWN_SYNDROME: 'Down Syndrome', OTHER: 'Other' }
const DIFF_LABEL = { EASY: 'Easy', MEDIUM: 'Medium', HARD: 'Hard' }

export default function Dashboard({ student, onLogout }) {
  const [subjects, setSubjects] = useState([])
  const [selected, setSelected] = useState(null)
  const [chapters, setChapters] = useState([])
  const [overview, setOverview] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.subjects(student.id).then((s) => {
      setSubjects(s)
      if (s.length) setSelected(s[0])
    }).catch((e) => setError(e.message))
    api.progress(student.id).then(setOverview).catch(() => {})
  }, [student.id])

  useEffect(() => {
    if (!selected) return
    api.chapters(student.id, selected.id).then(setChapters).catch((e) => setError(e.message))
  }, [selected, student.id])

  const needs = student.specialNeeds?.map((n) => (n === 'OTHER' && student.otherNeeds ? `Other: ${student.otherNeeds}` : NEED_LABELS[n])) ?? []
  const subjectProgress = overview?.subjects.find((s) => s.subjectId === selected?.id)

  return (
    <div className="page">
      <header className="topbar">
        <div>
          <h1>Hi, {student.name.split(' ')[0]} 👋</h1>
          <p className="muted">Grade {student.grade} · {student.board}</p>
        </div>
        <button className="btn-ghost" onClick={onLogout}>Log out</button>
      </header>

      <ProgressSection overview={overview} />

      <section className="card">
        <h2>Your learning profile</h2>
        <p className="muted">
          {student.learnerType === 'NORMAL' ? 'Standard learner' : `Additional learning needs: ${needs.join(', ')}`}
        </p>
        <ul className="ticks two-col">
          {student.profile.summary.map((s) => <li key={s}>{s}</li>)}
        </ul>
        {overview && (overview.strengths.length > 0 || overview.struggles.length > 0) && (
          <div className="insights">
            {overview.strengths.length > 0 && <p>💪 <strong>Strong in:</strong> {overview.strengths.join(', ')}</p>}
            {overview.struggles.length > 0 && <p>🌱 <strong>Needs more practice:</strong> {overview.struggles.join(', ')}</p>}
          </div>
        )}
      </section>

      {error && <div className="alert">{error}</div>}

      <h2 className="section-title">Your Grade {student.grade} subjects</h2>
      <div className="subject-row">
        {subjects.map((s) => {
          const sp = overview?.subjects.find((x) => x.subjectId === s.id)
          return (
            <button key={s.id} className={`subject-card ${selected?.id === s.id ? 'active' : ''}`} onClick={() => setSelected(s)}>
              <span className="subject-icon" aria-hidden>{s.icon}</span>
              <span className="subject-name">{s.name}</span>
              <span className="bar thin" aria-hidden><span style={{ width: `${sp?.percent ?? 0}%` }} /></span>
              <span className="muted small">{sp ? `${sp.completed}/${sp.totalChapters} chapters done` : `${s.chapterCount} chapters`}</span>
            </button>
          )
        })}
      </div>

      {selected && (
        <section className="card">
          <div className="card-head">
            <h2>{selected.icon} {selected.name} — Chapters</h2>
            {subjectProgress && (
              <span className="muted small">
                {subjectProgress.completed} completed · {subjectProgress.totalChapters - subjectProgress.completed} left
              </span>
            )}
          </div>
          <ol className="chapter-list">
            {chapters.map((c) => (
              <li key={c.id}>
                <Link to={`/learn/${c.id}`} className={`chapter-link status-${c.status.toLowerCase()}`}>
                  <span className="chapter-no">{c.status === 'COMPLETED' ? '✓' : c.order}</span>
                  <span className="chapter-main">
                    <span className="chapter-name">Chapter {c.order}: {c.name}</span>
                    {c.status !== 'NOT_STARTED' && (
                      <span className="bar thin" aria-hidden><span style={{ width: `${c.percent}%` }} /></span>
                    )}
                  </span>
                  {c.status === 'COMPLETED' && <span className="badge">Completed 🏆</span>}
                  {c.status === 'IN_PROGRESS' && (
                    <span className="badge doing-badge">{c.percent}% · {DIFF_LABEL[c.currentDifficulty]}</span>
                  )}
                  {c.status === 'NOT_STARTED' && <span className="badge muted-badge">Not started</span>}
                </Link>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  )
}
