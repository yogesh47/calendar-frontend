import * as yup from 'yup'
import { format } from 'date-fns'
import { LIMITS } from '@/calendar'
import { REMINDER_TYPE } from '@/calendar'
import type { EventDraft } from '@/calendar'

const todayValue = (): string => format(new Date(), 'yyyy-MM-dd')

/*
  Which types need a start and end time is the app's to say (`eventTypes`), so
  the form passes it in as `context.isTimed`. Everything the app adds on top of
  the calendar's fields it validates itself.
*/
type SchemaContext = { isTimed?: (eventType: string) => boolean; ownReminder?: boolean; allowPastDates?: boolean }

function timed(this: { options: { context?: SchemaContext } }, eventType: string): boolean {
  return Boolean(this.options.context?.isTimed?.(eventType))
}

export const eventSchema = yup.object({
  eventType: yup.string().required(),
  title: yup.string().trim().required('Title is required.').max(LIMITS.titleLength),
  eventDate: yup
    .string()
    .required('Date is required.')
    .test('not-past', 'Date must be today or later.', function (value) {
      if (!value) return true
      if (this.options.context?.allowPastDates) return true
      if (this.parent.eventType === REMINDER_TYPE && !this.options.context?.ownReminder) return true

      return value >= todayValue()
    }),
  startTime: yup.string().test('start-needed', 'Start time is required.', function (value) {
    return !timed.call(this, this.parent.eventType) || Boolean(value)
  }),
  endDate: yup
    .string()
    .test('end-date-after-start', 'End date cannot be before the start date.', function (value) {
      const { eventType, eventDate } = this.parent
      if (!timed.call(this, eventType) || !value || !eventDate) return true

      return value >= eventDate
    }),
  endTime: yup
    .string()
    .test('end-needed', 'End time is required.', function (value) {
      return !timed.call(this, this.parent.eventType) || Boolean(value)
    })
    .test('end-after-start', 'End must be after the start.', function (value) {
      const { eventType, eventDate, startTime, endDate } = this.parent
      if (!timed.call(this, eventType) || !value || !startTime || !eventDate) return true

      return `${endDate || eventDate}T${value}` > `${eventDate}T${startTime}`
    }),
  description: yup.string().max(LIMITS.descriptionLength),
  note: yup.string().max(LIMITS.reminderNoteLength),
})

// Repeat until — checked only when a repeat is picked.
export const recurrenceError = (draft: EventDraft): string | undefined => {
  if (!draft.recurrence) return undefined
  if (!draft.recurrence.until) return 'Pick the last date it repeats on.'
  if (draft.recurrence.until < draft.eventDate) return 'Repeat until cannot be before the start date.'

  const yearLater = new Date(`${draft.eventDate}T00:00:00`)
  yearLater.setFullYear(yearLater.getFullYear() + 1)
  if (new Date(`${draft.recurrence.until}T00:00:00`) > yearLater) return 'An event can repeat for at most one year.'

  return undefined
}

// `context.needsNote(reason)` — the app's reasons say which one asks for a few words.
export const cancelSchema = yup.object({
  reason: yup.string().required('Pick a reason.'),
  note: yup
    .string()
    .max(LIMITS.cancelOtherNoteLength)
    .test('note-needed', 'A short explanation is required.', function (value) {
      const needsNote = (this.options.context as { needsNote?: (reason: string) => boolean } | undefined)?.needsNote
      return !needsNote?.(this.parent.reason) || Boolean(value?.trim())
    }),
})
