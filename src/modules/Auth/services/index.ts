import axiosInstance from '@/api/axiosInstance'
import { browserZone } from '@/lib/timeZone'
import { LOGIN_ROUTE, SESSION_KEY } from '../constants'
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
  const { data } = await axiosInstance.post<LoginResponse>('/auth/login', { email, password })

  return { token: data.access_token, user: data.user }
}

// StrictMode runs effects twice in dev, so a call already in flight is shared.
let meInFlight: Promise<Session['user'] | null> | null = null

export const fetchMe = (token: string): Promise<Session['user'] | null> => {
  if (!meInFlight) meInFlight = askMe(token).finally(() => { meInFlight = null })

  return meInFlight
}

const askMe = async (token: string): Promise<Session['user'] | null> => {
  try {
    const { data } = await axiosInstance.get<Session['user']>('/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
    return data
  } catch {
    return null
  }
}

/**
 * Tell the server where this browser is, if it doesn't know yet. Whoever is
 * signed in now is where the account is now — their nudges and notifications
 * follow this zone. The first staff sign-in also sets the college's zone.
 */
export const syncTimeZone = async (session: Session): Promise<Session> => {
  const zone = browserZone()
  if (session.user.time_zone === zone) return session

  try {
    const { data } = await axiosInstance.put<Session['user']>(
      '/auth/me/time-zone',
      { time_zone: zone },
      { headers: { Authorization: `Bearer ${session.token}` } },
    )
    return { ...session, user: data }
  } catch {
    return session
  }
}

export const signOutOnExpiry = (): void => {
  clearSession()
  if (window.location.pathname !== LOGIN_ROUTE) window.location.assign(LOGIN_ROUTE)
}
