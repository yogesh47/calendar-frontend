import { REMINDER_TYPE } from '@/calendar'
import type { EventDraft } from '@/calendar'

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
