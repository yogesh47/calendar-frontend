import { endOfDay, isSameDay, isWithinInterval, startOfDay } from 'date-fns'
import type { CalendarItem } from '../types'

export const spansDays = (item: CalendarItem): boolean =>
  Boolean(item.endsAt) && !isSameDay(new Date(item.startsAt), new Date(item.endsAt as string))

export const coversDay = (item: CalendarItem, day: Date): boolean => {
  const start = new Date(item.startsAt)
  if (isSameDay(start, day)) return true
  if (!item.endsAt) return false

  return isWithinInterval(day, { start: startOfDay(start), end: endOfDay(new Date(item.endsAt)) })
}

export const itemsOn = (items: CalendarItem[], day: Date): CalendarItem[] =>
  items.filter((item) => coversDay(item, day)).sort((a, b) => a.startsAt.localeCompare(b.startsAt))
