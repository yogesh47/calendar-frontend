import { format } from 'date-fns'
import { LIMITS } from '../constants'
import { countAudience } from '../services/audience'
import { EVENT_TYPE_OPTIONS, MINOR_FIELDS, IMPORTANT_FIELD_LABEL } from '../constants/tpo'
import type { CalendarItem, CalendarItemKind, EventType } from '../types'
import type { EventDraft, TpoEvent, TpoEventType } from '../types/tpo'

export const rulesFor = (eventType: TpoEventType) =>
  EVENT_TYPE_OPTIONS.find((option) => option.value === eventType) ?? EVENT_TYPE_OPTIONS[0]

export const labelFor = (eventType: TpoEventType): string => rulesFor(eventType).label

const today = (): string => format(new Date(), 'yyyy-MM-dd')

export const validateDraft = (draft: EventDraft): Record<string, string> => {
  const rules = rulesFor(draft.eventType)
  const errors: Record<string, string> = {}

  if (!draft.title.trim()) errors.title = 'Title is required.'
  if (!draft.eventDate) errors.eventDate = 'Date is required.'
  if (draft.eventDate && draft.eventType !== 'my_reminder' && draft.eventDate < today()) {
    errors.eventDate = 'Date must be today or later.'
  }

  if (rules.needsTime) {
    if (!draft.startTime) errors.startTime = 'Start time is required.'
    if (!draft.endTime) errors.endTime = 'End time is required.'
    if (draft.startTime && draft.endTime && draft.endTime <= draft.startTime) {
      errors.endTime = 'End time must be after start time.'
    }
  }

  if (rules.needsMode) {
    if (!draft.mode) errors.mode = 'Select a mode.'
    if (draft.mode === 'offline' && !draft.venue.trim()) errors.venue = 'Venue is required.'
    if (draft.mode === 'online' && !draft.onlinePlatform.trim()) {
      errors.onlinePlatform = 'Online platform is required.'
    }
  }

  if (rules.needsAudience) {
    if (!draft.audience.courses.length) errors.courses = 'Select at least one course.'
    if (!draft.audience.batches.length) errors.batches = 'Select at least one batch.'
    if (!draft.audience.departments.length) errors.departments = 'Select at least one department.'
  }

  if (draft.description.length > LIMITS.descriptionLength) {
    errors.description = `Max ${LIMITS.descriptionLength} characters.`
  }

  if (draft.note.length > LIMITS.reminderNoteLength) {
    errors.note = `Max ${LIMITS.reminderNoteLength} characters.`
  }

  return errors
}

export const canPublish = (draft: EventDraft): boolean => {
  if (Object.keys(validateDraft(draft)).length) return false
  if (!rulesFor(draft.eventType).needsAudience) return true
  return countAudience(draft.audience) > 0
}

export const changedFields = (before: EventDraft, after: EventDraft): (keyof EventDraft)[] =>
  (Object.keys(after) as (keyof EventDraft)[]).filter(
    (field) => JSON.stringify(before[field]) !== JSON.stringify(after[field]),
  )

export const changedSummary = (before: EventDraft, after: EventDraft): string =>
  changedFields(before, after)
    .map((field) => IMPORTANT_FIELD_LABEL[field] ?? field)
    .join(', ')

export const onlyMinorChanged = (before: EventDraft, after: EventDraft): boolean => {
  const changed = changedFields(before, after)
  return changed.length > 0 && changed.every((field) => MINOR_FIELDS.includes(field))
}

export const audienceLine = (draft: EventDraft): string => {
  const { opportunityType, courses, batches, departments } = draft.audience
  const opportunity = opportunityType.charAt(0).toUpperCase() + opportunityType.slice(1)
  return [opportunity, batches.join(', '), courses.join(', '), departments.join(', ')]
    .filter(Boolean)
    .join(' · ')
}

const TILE_EVENT_TYPE: Record<TpoEventType, EventType> = {
  ppt: 'ppt',
  company_visit: 'drive',
  online_assessment: 'assessment',
  training: 'workshop',
  orientation: 'other',
  practice_test: 'other',
  deadline: 'other',
  other: 'other',
  my_reminder: 'other',
  nudge: 'other',
}

const instant = (day: string, time: string): string =>
  new Date(`${day}T${time || '00:00'}:00`).toISOString()

export const itemFromEvent = (event: TpoEvent): CalendarItem => {
  const { draft } = event
  const rules = rulesFor(draft.eventType)
  const kind: CalendarItemKind =
    draft.eventType === 'nudge'
      ? 'nudge'
      : draft.eventType === 'my_reminder'
        ? 'reminder'
        : draft.eventType === 'deadline'
          ? 'deadline'
          : 'event'

  return {
    id: event.id,
    kind,
    title: draft.title,
    startsAt: instant(draft.eventDate, draft.startTime),
    endsAt: rules.needsTime && kind !== 'nudge' ? instant(draft.endDate || draft.eventDate, draft.endTime) : undefined,
    isAllDay: kind === 'nudge' ? false : !rules.needsTime && !draft.startTime,
    eventType: kind === 'event' ? TILE_EVENT_TYPE[draft.eventType] : undefined,
    status: event.cancelledAt ? 'cancelled' : event.appliesToMe ? 'active' : 'not_applicable',
    updatedAt: event.updatedAt,
    venue: draft.mode === 'online' ? draft.onlinePlatform : draft.venue || undefined,
    description: draft.description || undefined,
    createdBy: event.createdBy,
  }
}
