export interface CalendarSettings {
  eventReminderDaysBefore: number
  eventReminderHoursBefore: number
  deadlineReminderDaysBefore: number
  deadlineReminderSameDay: boolean
  dailyNudgeLimit: number
  quietHoursStart: string
  quietHoursEnd: string
  /** The college's campus time, e.g. "Asia/Kolkata". */
  timeZone: string
  /** Calendar sync: days back and ahead of today, and whether cancelled events are included. */
  feedPastDays: number
  feedFutureDays: number
  feedShowCancelled: boolean
  updatedAt?: string
}

export type NumberField = 'eventReminderDaysBefore' | 'eventReminderHoursBefore' | 'deadlineReminderDaysBefore' | 'dailyNudgeLimit' | 'feedPastDays' | 'feedFutureDays'
