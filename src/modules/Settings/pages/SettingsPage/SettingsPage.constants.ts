import type { CalendarSettings, NumberField } from '../../types'

export const SETTINGS_COPY = {
  title: 'Calendar & Nudges',
  subtitle: 'Settings for your college',
  nudgeSection: 'Nudge timings',
  limitSection: 'Limits and quiet hours',
  zoneSection: 'Campus time zone',
  zoneHint:
    "New events are set in this time zone, and each student's nudges arrive by their own clock. It was picked up from the first staff sign-in; change it if that was wrong.",
  save: 'Save settings',
  saving: 'Saving…',
  saved: 'Settings saved.',
  wholeNumber: 'Enter a whole number.',
  pending: 'Deadline nudges follow these settings straight away; event nudges already scheduled keep their time.',
} as const

export const NUMBER_FIELDS: { key: NumberField; label: string; hint: string; min: number; max: number }[] = [
  { key: 'eventReminderDaysBefore', label: 'Event Reminder: days before', hint: '1–30 days', min: 1, max: 30 },
  { key: 'eventReminderHoursBefore', label: 'Event Reminder: hours before', hint: '1–12 hours', min: 1, max: 12 },
  { key: 'deadlineReminderDaysBefore', label: 'Deadline Reminder: days before', hint: '1–30 days', min: 1, max: 30 },
  { key: 'dailyNudgeLimit', label: 'Daily nudge limit per student', hint: '1–10 nudges', min: 1, max: 10 },
]

export const DEFAULT_SETTINGS: CalendarSettings = {
  eventReminderDaysBefore: 1,
  eventReminderHoursBefore: 1,
  deadlineReminderDaysBefore: 2,
  deadlineReminderSameDay: true,
  dailyNudgeLimit: 3,
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00',
  timeZone: 'Asia/Kolkata',
}
