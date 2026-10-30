import { addDays, addMinutes, format } from 'date-fns'

import { REMINDER_TYPE } from '../types'
import type { EventDraft } from '../types'

/** A blank draft. An app spreads its own fields over it (`draftDefaults`). */
export const EMPTY_DRAFT: EventDraft = {
  eventType: '',
  title: '',
  eventDate: '',
  endDate: '',
  startTime: '',
  endTime: '',
  description: '',
  note: '',
  remindBefore: 'none',
  linkedType: null,
  linkedId: null,
  recurrence: null,
  imageUrl: '',
}

const STEP = 30

export const nextSlot = (from = new Date()): string => {
  const minutes = from.getMinutes()
  const bump = minutes === 0 ? 0 : minutes <= STEP ? STEP - minutes : 60 - minutes

  return format(addMinutes(from, bump), 'HH:mm')
}

export const newDraftOn = <T extends EventDraft>(picked: string, base: T): T => {
  const now = new Date()
  const startTime = nextSlot(now)
  // After 23:30 the next slot is midnight — tomorrow, if the day picked is today.
  const rolls = startTime === '00:00' && now.getHours() === 23 && picked === format(now, 'yyyy-MM-dd')
  const eventDate = rolls ? format(addDays(now, 1), 'yyyy-MM-dd') : picked
  const [hour, minute] = startTime.split(':').map(Number)
  // An hour on; from 23:00 that is the next day, and the end date follows it.
  const end = addMinutes(new Date(2000, 0, 1, hour, minute), 60)
  const endTime = format(end, 'HH:mm')
  const endDate = end.getDate() !== 1 && eventDate ? format(addDays(new Date(`${eventDate}T00:00:00`), 1), 'yyyy-MM-dd') : eventDate

  return { ...base, eventDate, endDate, startTime, endTime }
}

/**
 * How far ahead a brand-new reminder is set: an hour and a minute.
 *
 * A reminder alerts `remindBefore` ahead of its own time, and a new one opens on
 * "1 hour". An hour and a minute out therefore puts the alert a minute from now
 * — close enough to watch it arrive, instead of picking a time by hand every
 * time someone wants to see a reminder actually fire.
 */
export const REMINDER_LEAD_MINUTES = 61

export const newReminderOn = <T extends EventDraft>(eventDate: string, base: T): T => {
  const at = addMinutes(new Date(), REMINDER_LEAD_MINUTES)
  // Opening on today means "remind me shortly", and the lead can tip that past
  // midnight — so the date is read off the same moment as the time. A day picked
  // in the calendar is left exactly as picked.
  const date = eventDate === format(new Date(), 'yyyy-MM-dd') ? format(at, 'yyyy-MM-dd') : eventDate

  return {
    ...newDraftOn(eventDate, base),
    eventType: REMINDER_TYPE,
    eventDate: date,
    endDate: date,
    startTime: format(at, 'HH:mm'),
    endTime: '',
    remindBefore: '1_hour',
  }
}
