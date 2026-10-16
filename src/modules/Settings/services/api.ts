import { API_BASE_URL } from '@/modules/Auth/constants'
import { readSession } from '@/modules/Auth/services'
import type { CalendarSettings } from '../types'

type ApiSettings = {
  event_reminder_days_before: number
  event_reminder_hours_before: number
  deadline_reminder_days_before: number
  deadline_reminder_same_day: boolean
  daily_nudge_limit: number
  quiet_hours_start: string
  quiet_hours_end: string
  updated_at: string | null
}

const ask = async <T,>(path: string, init?: RequestInit): Promise<T> => {
  const session = readSession()
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(session ? { Authorization: `Bearer ${session.token}` } : {}),
      ...(init?.headers ?? {}),
    },
  })

  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new Error(typeof body?.detail === 'string' ? body.detail : 'Something went wrong. Please try again.')
  }

  return (await response.json()) as T
}

const toSettings = (entry: ApiSettings): CalendarSettings => ({
  eventReminderDaysBefore: entry.event_reminder_days_before,
  eventReminderHoursBefore: entry.event_reminder_hours_before,
  deadlineReminderDaysBefore: entry.deadline_reminder_days_before,
  deadlineReminderSameDay: entry.deadline_reminder_same_day,
  dailyNudgeLimit: entry.daily_nudge_limit,
  quietHoursStart: entry.quiet_hours_start,
  quietHoursEnd: entry.quiet_hours_end,
  updatedAt: entry.updated_at ?? undefined,
})

const toPayload = (settings: CalendarSettings) => ({
  event_reminder_days_before: settings.eventReminderDaysBefore,
  event_reminder_hours_before: settings.eventReminderHoursBefore,
  deadline_reminder_days_before: settings.deadlineReminderDaysBefore,
  deadline_reminder_same_day: settings.deadlineReminderSameDay,
  daily_nudge_limit: settings.dailyNudgeLimit,
  quiet_hours_start: settings.quietHoursStart,
  quiet_hours_end: settings.quietHoursEnd,
})

export const fetchSettings = async (): Promise<CalendarSettings> => toSettings(await ask<ApiSettings>('/settings'))

export const saveSettings = async (settings: CalendarSettings): Promise<CalendarSettings> =>
  toSettings(await ask<ApiSettings>('/settings', { method: 'PUT', body: JSON.stringify(toPayload(settings)) }))
