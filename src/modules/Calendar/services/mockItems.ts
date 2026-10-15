import { addDays, formatISO, startOfDay } from 'date-fns'
import type { CalendarItem } from '../types'

const at = (dayOffset: number, hour: number) =>
  formatISO(new Date(startOfDay(addDays(new Date(), dayOffset)).setHours(hour)))

/**
 * Stand-in data while the service is still being built.
 *
 * Deliberately covers every shape the tiles have to render — each kind, a
 * cancelled one, a recently edited one and a past one — so the views can be
 * judged without waiting for an API.
 */
export const MOCK_ITEMS: CalendarItem[] = [
  { id: 'e1', kind: 'event', eventType: 'ppt', title: 'Infosys Pre-Placement Talk',
    startsAt: at(0, 10), endsAt: at(0, 12), status: 'active', venue: 'Auditorium A' },
  { id: 'e2', kind: 'event', eventType: 'assessment', title: 'TCS NQT Online Assessment',
    startsAt: at(1, 9), endsAt: at(1, 11), status: 'active' },
  { id: 'd1', kind: 'deadline', title: 'Wipro Elite — applications close',
    startsAt: at(1, 23), status: 'active', isAllDay: true },
  { id: 'r1', kind: 'reminder', title: 'Shortlist ko call karna hai',
    startsAt: at(2, 16), status: 'active', createdBy: 'me' },
  { id: 'n1', kind: 'nudge', title: 'Deloitte deadline kal hai',
    startsAt: at(2, 8), status: 'active' },
  { id: 'e3', kind: 'event', eventType: 'drive', title: 'Accenture Campus Drive',
    startsAt: at(3, 9), endsAt: at(3, 17), status: 'active', venue: 'Block C' },
  { id: 'e4', kind: 'event', eventType: 'interview', title: 'Capgemini — final round',
    startsAt: at(3, 11), endsAt: at(3, 13), status: 'cancelled' },
  { id: 'e5', kind: 'event', eventType: 'workshop', title: 'Resume workshop',
    startsAt: at(3, 14), endsAt: at(3, 16), status: 'active',
    updatedAt: formatISO(new Date()) },
  { id: 'e6', kind: 'event', eventType: 'ppt', title: 'Zoho PPT',
    startsAt: at(4, 15), endsAt: at(4, 16), status: 'active' },
  { id: 'e7', kind: 'event', eventType: 'other', title: 'Alumni AMA',
    startsAt: at(-3, 15), endsAt: at(-3, 16), status: 'active' },
]
