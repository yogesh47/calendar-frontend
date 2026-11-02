import { format } from 'date-fns'
import { NUDGE_TYPE, REMINDER_TYPE } from '@/calendar'
import type { EventDraft } from '@/calendar'

/** Items that are not a TPO's campus event. */
const NOT_CAMPUS_EVENTS = [REMINDER_TYPE, NUDGE_TYPE]

/*
  Drafts only this app's modals need. A blank draft and a draft for a picked
  day are the calendar's own (EMPTY_DRAFT, newDraftOn, newReminderOn).
*/

/** "Remind me" on someone else's event: a reminder of mine, tied to it. */
export const reminderFor = <T extends EventDraft>(event: { id: string; draft: EventDraft }, base: T): T => ({
  ...base,
  eventType: REMINDER_TYPE,
  title: event.draft.title,
  eventDate: event.draft.eventDate,
  endDate: event.draft.eventDate,
  startTime: event.draft.startTime,
  remindBefore: '1_hour',
  linkedType: 'event',
  linkedId: event.id,
})

export type CompanyEvent = {
  id: string
  company: string
  eventType: string
  otherType: string
  eventDate: string
  repeats: boolean
  createdByName: string
}

/**
 * Campus events still ahead that name a company, for the company hint (BRD FR-CAL-05):
 * "Existing Deloitte events: Online Assessment — 2 Oct (Ravi Sharma)". Cancelled
 * events, reminders, nudges and a job's own deadline are left out, and so is the
 * event being edited.
 */
export const companyEventsOf = (
  events: {
    id: string
    seriesId?: string | null
    cancelledAt?: string | null
    createdByName: string
    draft: EventDraft & { company: string; otherType?: string; linkedType?: string | null }
  }[],
  exceptId?: string | null,
  today: string = format(new Date(), 'yyyy-MM-dd'),
): CompanyEvent[] => {
  const ahead = events
    .filter(
      (event) =>
        !event.cancelledAt &&
        event.id !== exceptId &&
        event.draft.company &&
        !NOT_CAMPUS_EVENTS.includes(event.draft.eventType) &&
        event.draft.linkedType !== 'job_deadline' &&
        event.draft.eventDate >= today,
    )
    .sort((a, b) => a.draft.eventDate.localeCompare(b.draft.eventDate))

  // A repeating event is one line — its next date — not one line per day.
  const seen = new Set<string>()

  return ahead.flatMap((event) => {
    if (event.seriesId && seen.has(event.seriesId)) return []
    if (event.seriesId) seen.add(event.seriesId)

    return [
      {
        id: event.id,
        company: event.draft.company,
        eventType: event.draft.eventType,
        otherType: event.draft.otherType ?? '',
        eventDate: event.draft.eventDate,
        repeats: Boolean(event.seriesId),
        createdByName: event.createdByName,
      },
    ]
  })
}

/**
 * What else is on the calendar, for a modal's day preview and clash warning.
 * The event being edited is left out so it does not clash with itself.
 */
export const dayEntriesOf = (
  events: { id: string; cancelledAt?: string | null; draft: EventDraft }[],
  exceptId?: string | null,
): { id: string; title: string; eventDate: string; startTime: string; endTime: string }[] =>
  events
    .filter((event) => !event.cancelledAt && event.id !== exceptId)
    .map((event) => ({
      id: event.id,
      title: event.draft.title,
      eventDate: event.draft.eventDate,
      startTime: event.draft.startTime,
      endTime: event.draft.endTime,
    }))
