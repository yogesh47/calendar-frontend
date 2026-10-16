import { ApiError } from '@/lib/apiError'
import { API_BASE_URL, LOGIN_ROUTE, SESSION_KEY } from '../constants'
import type { LoginResponse, Session } from '../types'

export const readSession = (): Session | null => {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? (JSON.parse(raw) as Session) : null
  } catch {
    return null
  }
}

export const writeSession = (session: Session): void => {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  } catch {
    return
  }
}

export const clearSession = (): void => {
  try {
    localStorage.removeItem(SESSION_KEY)
  } catch {
    return
  }
}

export const login = async (email: string, password: string): Promise<Session> => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  const body = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new ApiError(response.status, body)
  }

  const payload = body as LoginResponse

  return { token: payload.access_token, user: payload.user }
}

// StrictMode dev me effect do baar chalata hai; ek hi waqt ki call share kar lete hain.
let meInFlight: Promise<Session['user'] | null> | null = null

export const fetchMe = (token: string): Promise<Session['user'] | null> => {
  if (!meInFlight) meInFlight = askMe(token).finally(() => { meInFlight = null })

  return meInFlight
}

const askMe = async (token: string): Promise<Session['user'] | null> => {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!response.ok) return null

  return response.json()
}

export const signOutOnExpiry = (): void => {
  clearSession()
  if (window.location.pathname !== LOGIN_ROUTE) window.location.assign(LOGIN_ROUTE)
}
