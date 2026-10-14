import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client.js'

const BOARDS = ['CBSE', 'ICSE', 'State Board', 'IB', 'Other']
const NEEDS = [
  { value: 'DYSLEXIA', label: 'Dyslexia' },
  { value: 'ADHD', label: 'ADHD' },
  { value: 'AUTISM', label: 'Autism' },
  { value: 'DOWN_SYNDROME', label: 'Down Syndrome' },
  { value: 'OTHER', label: 'Other' },
]

const EMPTY = {
  name: '', email: '', phone: '', grade: '', board: 'CBSE',
  learnerType: 'NORMAL', specialNeeds: [], otherNeeds: '',
}

export default function SignupPage({ onAuthenticated }) {
  const [form, setForm] = useState(EMPTY)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [grades, setGrades] = useState([])
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    api.grades().then(setGrades).catch(() => setError('Cannot reach the tutor server. Is the backend running?'))
  }, [])

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  const toggleNeed = (need) => {
    const has = form.specialNeeds.includes(need)
    setForm({ ...form, specialNeeds: has ? form.specialNeeds.filter((n) => n !== need) : [...form.specialNeeds, need] })
  }

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.learnerType === 'SPECIAL_NEEDS' && form.specialNeeds.length === 0) {
      return setError('Please choose at least one learning need, or select "Standard learner".')
    }
    if (form.specialNeeds.includes('OTHER') && !form.otherNeeds.trim()) {
      return setError('Please tell us a little about the "Other" learning need.')
    }
    if (password.length < 8) return setError('Your password needs at least 8 characters.')
    if (password !== confirm) return setError('The two passwords do not match.')
    setSubmitting(true)
    try {
      onAuthenticated(await api.signup({
        ...form,
        grade: Number(form.grade),
        specialNeeds: form.learnerType === 'SPECIAL_NEEDS' ? form.specialNeeds : [],
      }, password))
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const special = form.learnerType === 'SPECIAL_NEEDS'

  return (
    <div className="page narrow">
      <header className="hero">
        <div className="hero-emoji" aria-hidden>🎓</div>
        <h1>Create your Smart Tutor account</h1>
        <p>Tell us a little about yourself so we can make learning fit you.</p>
      </header>

      <form className="card form" onSubmit={submit}>
        <div className="grid-2">
          <label>
            Your name
            <input required value={form.name} onChange={set('name')} placeholder="e.g. Aarav Sharma" autoComplete="name" />
          </label>
          <label>
            Email
            <input required type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" autoComplete="email" />
          </label>
          <label>
            Phone number
            <input type="tel" value={form.phone} onChange={set('phone')} placeholder="+91 98765 43210" autoComplete="tel" />
          </label>
          <label>
            Grade / Class
            <select required value={form.grade} onChange={set('grade')}>
              <option value="" disabled>Choose your grade</option>
              {grades.map((g) => <option key={g} value={g}>Grade {g}</option>)}
            </select>
          </label>
          <label>
            Board / Curriculum
            <select value={form.board} onChange={set('board')}>
              {BOARDS.map((b) => <option key={b}>{b}</option>)}
            </select>
          </label>
          <label>
            Create a password
            <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                   placeholder="At least 8 characters" autoComplete="new-password" minLength={8} />
          </label>
          <label>
            Type it again
            <input required type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)}
                   placeholder="Same password" autoComplete="new-password" />
          </label>
        </div>

        <fieldset>
          <legend>How do you like to learn?</legend>
          <div className="choice-row">
            <label className={`choice ${!special ? 'selected' : ''}`}>
              <input type="radio" name="learnerType" value="NORMAL" checked={!special} onChange={set('learnerType')} />
              Standard learner
            </label>
            <label className={`choice ${special ? 'selected' : ''}`}>
              <input type="radio" name="learnerType" value="SPECIAL_NEEDS" checked={special} onChange={set('learnerType')} />
              I have additional learning needs
            </label>
          </div>
        </fieldset>

        {special && (
          <fieldset className="needs">
            <legend>Select all that apply</legend>
            <div className="chips">
              {NEEDS.map((n) => (
                <label key={n.value} className={`chip ${form.specialNeeds.includes(n.value) ? 'selected' : ''}`}>
                  <input type="checkbox" checked={form.specialNeeds.includes(n.value)} onChange={() => toggleNeed(n.value)} />
                  {n.label}
                </label>
              ))}
            </div>
            {form.specialNeeds.includes('OTHER') && (
              <label>
                Tell us more
                <input value={form.otherNeeds} onChange={set('otherNeeds')} placeholder="e.g. I need more time to read" />
              </label>
            )}
          </fieldset>
        )}

        <p className="note">
          🔒 This information is only used to <strong>personalise how you learn</strong> (pace, text style, practice).
          It is not used to diagnose anything.
        </p>

        {error && <div className="alert" role="alert">{error}</div>}

        <button className="btn-primary big" disabled={submitting}>
          {submitting ? 'Setting up…' : 'Create account & start learning →'}
        </button>
        <p className="auth-switch">Already have an account? <Link to="/login">Log in</Link></p>
      </form>
    </div>
  )
}
