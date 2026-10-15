import { isSameDay } from 'date-fns'
import type { CalendarItem } from '../types'

export const itemsOn = (items: CalendarItem[], day: Date): CalendarItem[] =>
  items
    .filter((item) => isSameDay(new Date(item.startsAt), day))
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
