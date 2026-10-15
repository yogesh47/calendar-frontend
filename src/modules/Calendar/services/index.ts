import { isSameDay } from 'date-fns'
import { MOCK_ITEMS } from './mockItems'
import type { CalendarItem } from '../types'

/**
 * The one place a view asks for items.
 *
 * It reads a fixture today and will read the service later; keeping every view
 * behind this function means that swap is one file, not twelve.
 */
export const fetchCalendarItems = async (): Promise<CalendarItem[]> => MOCK_ITEMS

export const itemsOn = (items: CalendarItem[], day: Date): CalendarItem[] =>
  items
    .filter((item) => isSameDay(new Date(item.startsAt), day))
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
