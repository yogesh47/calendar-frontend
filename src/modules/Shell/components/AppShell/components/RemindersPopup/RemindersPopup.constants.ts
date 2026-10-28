export const REMINDERS_COPY = {
  title: 'Reminders',
  dismissAll: 'Dismiss all',
  close: 'Close reminders',
  now: 'Now',
} as const

export const REMINDERS_TICK_MS = 15000

export const NUDGE_KINDS = [
  'reminder_alert',
  'event_day_before',
  'event_hour_before',
  'assessment_day',
  'deadline_days_before',
  'deadline_last_day',
]
