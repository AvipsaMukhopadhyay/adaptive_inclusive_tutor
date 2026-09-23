// Thin wrapper around the Spring Boot REST API. Sends the login token on every request.
const TOKEN_KEY = 'aist.token'

export const session = {
  token: () => {
    try { return localStorage.getItem(TOKEN_KEY) } catch { return null }
  },
  set: (token) => {
    try { localStorage.setItem(TOKEN_KEY, token) } catch { /* private mode */ }
  },
  clear: () => {
    try { localStorage.removeItem(TOKEN_KEY) } catch { /* private mode */ }
  },
}

let onUnauthorized = () => {}
/** Called when the server says the session is missing or expired. */
export function setUnauthorizedHandler(fn) {
  onUnauthorized = fn
}

async function request(path, options = {}) {
  const token = session.token()
  const res = await fetch(`/api${path}`, {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  })
  const data = res.status === 204 ? null : await res.json().catch(() => null)
  if (res.status === 401 && !path.startsWith('/auth/login') && !path.startsWith('/auth/signup')) {
    session.clear()
    onUnauthorized()
  }
  if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`)
  return data
}

export const api = {
  grades: () => request('/grades'),
  signup: (profile, password) => request('/auth/signup', { method: 'POST', body: { profile, password } }),
  login: (email, password) => request('/auth/login', { method: 'POST', body: { email, password } }),
  me: () => request('/auth/me'),
  logout: () => request('/auth/logout', { method: 'POST' }),
  subjects: (id) => request(`/students/${id}/subjects`),
  chapters: (id, subjectId) => request(`/students/${id}/subjects/${subjectId}/chapters`),
  progress: (id) => request(`/students/${id}/progress`),
  lesson: (id, chapterId) => request(`/students/${id}/chapters/${chapterId}/lesson`),
  nextActivity: (id, chapterId) => request(`/students/${id}/chapters/${chapterId}/next-activity`, { method: 'POST' }),
  submitAnswer: (id, chapterId, answer) =>
    request(`/students/${id}/chapters/${chapterId}/answers`, { method: 'POST', body: answer }),
  chat: (id, message) => request(`/students/${id}/tutor/chat`, { method: 'POST', body: message }),
}
