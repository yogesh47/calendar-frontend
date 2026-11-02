import type { CalendarSettings, NumberField } from '../../types'

export const SETTINGS_COPY = {
  title: 'Calendar & Nudges',
  subtitle: 'Settings for your college',
  nudgeSection: 'Nudge timings',
  nudgeCaption: 'When students get automatic reminders before events and application deadlines.',
  sameDayLabel: 'Deadline Reminder: same day',
  sameDayCaption: 'Also nudge students on the morning the application closes.',
  limitSection: 'Limits and quiet hours',
  limitCaption: 'How many nudges a student gets in a day, and when no alerts are sent.',
  quietStart: 'Quiet hours start',
  quietEnd: 'Quiet hours end',
  quietHint: 'Nudges due in quiet hours wait until they end. A 1-hour reminder for an event that itself starts in quiet hours still goes out.',
  zoneSection: 'Campus time zone',
  zoneLabel: 'Time zone',
  zoneHint:
    "New events are set in this time zone, and each student's nudges arrive by their own clock. It was picked up from the first staff sign-in; change it if that was wrong.",
  syncSection: 'Calendar sync',
  syncHint: 'The starting choice for everyone in this college. Each person can change what they sync from the Sync button on their calendar.',
  cancelledLabel: 'Include cancelled events',
  cancelledCaption: 'Shown as "Cancelled: …" so people see the change. Off: they disappear from synced calendars.',
  save: 'Save settings',
  saving: 'Saving…',
  saved: 'Settings saved.',
  discard: 'Discard changes',
  unsaved: 'Unsaved changes',
  wholeNumber: 'Enter a whole number.',
  pending: 'Deadline nudges follow these settings straight away; event nudges already scheduled keep their time.',
} as const

export const NUMBER_FIELDS: { key: NumberField; label: string; hint: string; unit: string; min: number; max: number }[] = [
  { key: 'eventReminderDaysBefore', label: 'Event Reminder: days before', hint: '1–30 days', unit: 'days', min: 1, max: 30 },
  { key: 'eventReminderHoursBefore', label: 'Event Reminder: hours before', hint: '1–12 hours', unit: 'hours', min: 1, max: 12 },
  { key: 'deadlineReminderDaysBefore', label: 'Deadline Reminder: days before', hint: '1–30 days', unit: 'days', min: 1, max: 30 },
  { key: 'dailyNudgeLimit', label: 'Daily nudge limit per student', hint: '1–10 nudges', unit: 'a day', min: 1, max: 10 },
  { key: 'feedPastDays', label: 'Past events to include', hint: '0–365 days back', unit: 'days', min: 0, max: 365 },
  { key: 'feedFutureDays', label: 'Upcoming events to include', hint: '7–730 days ahead', unit: 'days', min: 7, max: 730 },
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
  feedPastDays: 30,
  feedFutureDays: 365,
  feedShowCancelled: true,
}
