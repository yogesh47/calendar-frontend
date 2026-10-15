import * as yup from 'yup'
import { format } from 'date-fns'
import { LIMITS } from '../constants'
import { countAudience } from './audience'
import { rulesFor } from '../helpers/tpo'
import type { EventDraft } from '../types/tpo'

const todayValue = (): string => format(new Date(), 'yyyy-MM-dd')

const needsTime = (eventType: string): boolean => rulesFor(eventType as EventDraft['eventType']).needsTime

const needsMode = (eventType: string): boolean => rulesFor(eventType as EventDraft['eventType']).needsMode

const needsAudience = (eventType: string): boolean => rulesFor(eventType as EventDraft['eventType']).needsAudience

export const eventSchema = yup.object({
  eventType: yup.string().required(),
  title: yup.string().trim().required('Title is required.').max(LIMITS.titleLength),
  eventDate: yup
    .string()
    .required('Date is required.')
    .test('not-past', 'Date must be today or later.', function (value) {
      if (!value) return true
      if (this.parent.eventType === 'my_reminder' && !this.options.context?.studentReminder) return true

      return value >= todayValue()
    }),
  startTime: yup.string().test('start-needed', 'Start time is required.', function (value) {
    return !needsTime(this.parent.eventType) || Boolean(value)
  }),
  endDate: yup.string(),
  endTime: yup
    .string()
    .test('end-needed', 'End time is required.', function (value) {
      return !needsTime(this.parent.eventType) || Boolean(value)
    })
    .test('end-after-start', 'End must be after the start.', function (value) {
      const { eventType, eventDate, startTime, endDate } = this.parent
      if (!needsTime(eventType) || !value || !startTime || !eventDate) return true

      return `${endDate || eventDate}T${value}` > `${eventDate}T${startTime}`
    }),
  mode: yup.string().test('mode-needed', 'Select a mode.', function (value) {
    return !needsMode(this.parent.eventType) || Boolean(value)
  }),
  venue: yup
    .string()
    .max(LIMITS.venueLength)
    .test('venue-needed', 'Venue is required.', function (value) {
      if (!needsMode(this.parent.eventType)) return true

      return this.parent.mode !== 'offline' || Boolean(value?.trim())
    }),
  onlinePlatform: yup.string().test('platform-needed', 'Online platform is required.', function (value) {
    if (!needsMode(this.parent.eventType)) return true

    return this.parent.mode !== 'online' || Boolean(value?.trim())
  }),
  description: yup.string().max(LIMITS.descriptionLength),
  note: yup.string().max(LIMITS.reminderNoteLength),
  audience: yup.object({
    opportunityType: yup.string().required(),
    courses: yup.array().test('courses-needed', 'Select at least one course.', function (value) {
      return !needsAudience(this.options.context?.eventType) || Boolean(value?.length)
    }),
    batches: yup.array().test('batches-needed', 'Select at least one batch.', function (value) {
      return !needsAudience(this.options.context?.eventType) || Boolean(value?.length)
    }),
    departments: yup.array().test('departments-needed', 'Select at least one department.', function (value) {
      return !needsAudience(this.options.context?.eventType) || Boolean(value?.length)
    }),
  }),
})

export const linkedJobSchema = yup.object({
  kind: yup.string().oneOf(['campus', 'external']).required(),
  campusJob: yup.string().test('campus-needed', 'Pick a campus job', function (value) {
    return this.parent.kind !== 'campus' || Boolean(value)
  }),
  url: yup
    .string()
    .test('url-needed', 'Enter a valid link starting with https://', function (value) {
      if (this.parent.kind !== 'external') return true
      return Boolean(value) && String(value).startsWith("https://")
    }),
  title: yup.string().test('title-needed', 'Job title is required for a pasted link', function (value) {
    return this.parent.kind !== 'external' || Boolean(value?.trim())
  }),
})

export const cancelSchema = yup.object({
  reason: yup.string().required('Pick a reason.'),
  note: yup
    .string()
    .max(LIMITS.cancelOtherNoteLength)
    .test('note-needed', 'A short explanation is required.', function (value) {
      return this.parent.reason !== 'other' || Boolean(value?.trim())
    }),
})

export const isPublishable = (draft: EventDraft): boolean => {
  if (!eventSchema.isValidSync(draft, { context: { eventType: draft.eventType } })) return false
  if (!needsAudience(draft.eventType)) return true
  return countAudience(draft.audience) > 0
}
