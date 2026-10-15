import { MOCK_TPO_EVENTS } from './tpoEvents'
import type { TpoEvent } from '../types/tpo'

const EVENTS_KEY = 'campus-calendar-events'

const NOTIFICATIONS_KEY = 'campus-calendar-notifications'

const CHANGED = 'campus-calendar-changed'

export type CalendarNotification = {
  id: string
  eventId: string
  message: string
  createdAt: string
  readAt?: string
}

const read = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

const write = (key: string, value: unknown): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    return
  }
  window.dispatchEvent(new Event(CHANGED))
}

export const loadEvents = (): TpoEvent[] => {
  const stored = read<TpoEvent[] | null>(EVENTS_KEY, null)
  if (stored) return stored
  write(EVENTS_KEY, MOCK_TPO_EVENTS)
  return MOCK_TPO_EVENTS
}

export const saveEvents = (events: TpoEvent[]): void => write(EVENTS_KEY, events)

export const loadNotifications = (): CalendarNotification[] =>
  read<CalendarNotification[]>(NOTIFICATIONS_KEY, [])

export const pushNotification = (eventId: string, message: string): void => {
  const next: CalendarNotification = {
    id: `n${Date.now()}${Math.random().toString(16).slice(2, 6)}`,
    eventId,
    message,
    createdAt: new Date().toISOString(),
  }
  write(NOTIFICATIONS_KEY, [next, ...loadNotifications()].slice(0, 50))
}

export const markNotificationRead = (id: string): void =>
  write(
    NOTIFICATIONS_KEY,
    loadNotifications().map((entry) => (entry.id === id ? { ...entry, readAt: new Date().toISOString() } : entry)),
  )

export const markAllNotificationsRead = (): void =>
  write(
    NOTIFICATIONS_KEY,
    loadNotifications().map((entry) => ({ ...entry, readAt: entry.readAt ?? new Date().toISOString() })),
  )

export const onStoreChange = (listener: () => void): (() => void) => {
  window.addEventListener(CHANGED, listener)
  window.addEventListener('storage', listener)
  return () => {
    window.removeEventListener(CHANGED, listener)
    window.removeEventListener('storage', listener)
  }
}

const OPEN_EVENT = 'campus-calendar-open-event'

export const requestOpenEvent = (eventId: string): void => {
  window.dispatchEvent(new CustomEvent(OPEN_EVENT, { detail: eventId }))
}

export const onOpenEventRequest = (listener: (eventId: string) => void): (() => void) => {
  const handler = (event: Event) => listener((event as CustomEvent<string>).detail)
  window.addEventListener(OPEN_EVENT, handler)
  return () => window.removeEventListener(OPEN_EVENT, handler)
}
