export interface CalendarSettings {
  eventReminderDaysBefore: number
  eventReminderHoursBefore: number
  deadlineReminderDaysBefore: number
  deadlineReminderSameDay: boolean
  dailyNudgeLimit: number
  quietHoursStart: string
  quietHoursEnd: string
  updatedAt?: string
}

export type NumberField = 'eventReminderDaysBefore' | 'eventReminderHoursBefore' | 'deadlineReminderDaysBefore' | 'dailyNudgeLimit'
