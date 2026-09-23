import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client.js'

export default function LoginPage({ onAuthenticated }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      onAuthenticated(await api.login(email, password))
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="page auth-page">
      <header className="hero">
        <div className="hero-emoji" aria-hidden>🦉</div>
        <h1>Welcome back!</h1>
        <p>Log in to continue from where you left off.</p>
      </header>

      <form className="card form auth-card" onSubmit={submit}>
        <label>
          Email
          <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                 placeholder="you@example.com" autoComplete="email" autoFocus />
        </label>
        <label>
          Password
          <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                 placeholder="Your password" autoComplete="current-password" />
        </label>

        {error && <div className="alert" role="alert">{error}</div>}

        <button className="btn-primary big" disabled={busy}>{busy ? 'Logging in…' : 'Log in →'}</button>
        <p className="auth-switch">New here? <Link to="/signup">Create your account</Link></p>
      </form>
    </div>
  )
}
