import axiosInstance from '@/api/axiosInstance'
import type { CalendarSettings } from '../types'

type ApiSettings = {
  event_reminder_days_before: number
  event_reminder_hours_before: number
  deadline_reminder_days_before: number
  deadline_reminder_same_day: boolean
  daily_nudge_limit: number
  quiet_hours_start: string
  quiet_hours_end: string
  time_zone: string
  feed_past_days: number
  feed_future_days: number
  feed_show_cancelled: boolean
  updated_at: string | null
}

const ask = async <T,>(path: string, init: { method?: 'GET' | 'PUT'; data?: unknown } = {}): Promise<T> =>
  (await axiosInstance.request<T>({ url: path, method: init.method ?? 'GET', data: init.data })).data

const toSettings = (entry: ApiSettings): CalendarSettings => ({
  eventReminderDaysBefore: entry.event_reminder_days_before,
  eventReminderHoursBefore: entry.event_reminder_hours_before,
  deadlineReminderDaysBefore: entry.deadline_reminder_days_before,
  deadlineReminderSameDay: entry.deadline_reminder_same_day,
  dailyNudgeLimit: entry.daily_nudge_limit,
  quietHoursStart: entry.quiet_hours_start,
  quietHoursEnd: entry.quiet_hours_end,
  timeZone: entry.time_zone,
  feedPastDays: entry.feed_past_days,
  feedFutureDays: entry.feed_future_days,
  feedShowCancelled: entry.feed_show_cancelled,
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
  time_zone: settings.timeZone,
  feed_past_days: settings.feedPastDays,
  feed_future_days: settings.feedFutureDays,
  feed_show_cancelled: settings.feedShowCancelled,
})

export const fetchSettings = async (): Promise<CalendarSettings> => toSettings(await ask<ApiSettings>('/settings'))

export const saveSettings = async (settings: CalendarSettings): Promise<CalendarSettings> =>
  toSettings(await ask<ApiSettings>('/settings', { method: 'PUT', data: toPayload(settings) }))
