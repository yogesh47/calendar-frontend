import { addDays, addMinutes, format } from 'date-fns'
import { EMPTY_DRAFT } from '../constants/tpo'
import type { EventDraft } from '../types/tpo'

const STEP = 30

export const nextSlot = (from = new Date()): string => {
  const minutes = from.getMinutes()
  const bump = minutes === 0 ? 0 : minutes <= STEP ? STEP - minutes : 60 - minutes

  return format(addMinutes(from, bump), 'HH:mm')
}

export const newDraftOn = (eventDate: string): EventDraft => {
  const startTime = nextSlot()
  const [hour, minute] = startTime.split(':').map(Number)
  const wraps = hour === 23 && minute === 30
  const endTime = wraps ? '00:30' : format(addMinutes(new Date(2000, 0, 1, hour, minute), 60), 'HH:mm')
  const endDate = wraps && eventDate ? format(addDays(new Date(`${eventDate}T00:00:00`), 1), 'yyyy-MM-dd') : eventDate

  return { ...EMPTY_DRAFT, eventDate, endDate, startTime, endTime }
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

export const newReminderOn = (eventDate: string): EventDraft => {
  const at = addMinutes(new Date(), REMINDER_LEAD_MINUTES)
  // Opening on today means "remind me shortly", and the lead can tip that past
  // midnight — so the date is read off the same moment as the time. A day picked
  // in the calendar is left exactly as picked.
  const date = eventDate === format(new Date(), 'yyyy-MM-dd') ? format(at, 'yyyy-MM-dd') : eventDate

  return {
    ...newDraftOn(eventDate),
    eventType: 'my_reminder',
    eventDate: date,
    endDate: date,
    startTime: format(at, 'HH:mm'),
    endTime: '',
    mode: '',
    remindBefore: '1_hour',
  }
}
