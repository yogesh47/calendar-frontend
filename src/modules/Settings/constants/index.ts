import type { CalendarSettings, NumberField } from '../types'

export const SETTINGS_COPY = {
  title: 'Calendar & Nudges',
  subtitle: 'Platform Settings · applies to every college',
  nudgeSection: 'Nudge timings',
  limitSection: 'Limits and quiet hours',
  save: 'Save settings',
  saving: 'Saving…',
  saved: 'Settings saved.',
  wholeNumber: 'Enter a whole number.',
  pending: 'Changes apply only to nudges that have not been scheduled yet.',
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
}
