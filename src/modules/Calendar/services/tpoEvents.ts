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
