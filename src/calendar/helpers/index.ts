import { differenceInHours, isBefore } from 'date-fns'
import { CALENDAR_ITEM_STYLE, CANCELLED_STYLE, LIMITS } from '../constants'
import { DEADLINE_TYPE, NUDGE_TYPE, REMINDER_TYPE } from '../types'
import type { CalendarEvent, CalendarEventType, CalendarItem, CalendarItemKind } from '../types'

/**
 * How a tile should look and what it should say.
 *
 * Cancelled wins over the kind: the spec gives it its own muted, struck-through
 * treatment and its own label, whatever the item used to be.
 */
export const styleOf = (item: CalendarItem) => {
  if (item.status === 'cancelled') return { ...CANCELLED_STYLE, dashed: false, struck: true }
  if (item.status === 'not_applicable') {
    return { ...CANCELLED_STYLE, label: 'No longer applicable', dashed: false, struck: true }
  }

  const base = CALENDAR_ITEM_STYLE[item.kind]
  const label = item.kind === 'event' && item.typeLabel ? item.typeLabel : base.label

  return { ...base, label, struck: false }
}

/** The "Updated" badge only lives for a window after the edit. */
export const isRecentlyUpdated = (item: CalendarItem, now = new Date()): boolean =>
  Boolean(item.updatedAt) &&
  differenceInHours(now, new Date(item.updatedAt as string)) < LIMITS.updatedBadgeHours

export const isPast = (item: CalendarItem, now = new Date()): boolean =>
  isBefore(new Date(item.endsAt ?? item.startsAt), now)


/** The app's entry for a type, if it has one. */
export const typeFor = (eventTypes: CalendarEventType[], value: string): CalendarEventType | undefined =>
  eventTypes.find((entry) => entry.value === value)

/** A type with a start and an end. The calendar's own kinds never are; an unknown type is. */
export const isTimed = (eventTypes: CalendarEventType[], value: string): boolean =>
  value === REMINDER_TYPE || value === DEADLINE_TYPE || value === NUDGE_TYPE
    ? false
    : (typeFor(eventTypes, value)?.timed ?? true)

export const kindOf = (eventType: string): CalendarItemKind =>
  eventType === NUDGE_TYPE
    ? 'nudge'
    : eventType === REMINDER_TYPE
      ? 'reminder'
      : eventType === DEADLINE_TYPE
        ? 'deadline'
        : 'event'

const instant = (day: string, time: string): string => new Date(`${day}T${time || '00:00'}:00`).toISOString()

/** The flat item the grids draw, from one calendar event. */
export const itemFromEvent = (event: CalendarEvent, eventTypes: CalendarEventType[] = []): CalendarItem => {
  const { draft } = event
  const kind = kindOf(draft.eventType)
  const timed = isTimed(eventTypes, draft.eventType)
  const type = typeFor(eventTypes, draft.eventType)

  return {
    id: event.id,
    kind,
    title: draft.title,
    startsAt: instant(draft.eventDate, draft.startTime),
    endsAt: timed && kind !== 'nudge' ? instant(draft.endDate || draft.eventDate, draft.endTime) : undefined,
    isAllDay: kind === 'nudge' ? false : !timed && !draft.startTime,
    typeLabel: kind === 'event' ? (type?.shortLabel ?? type?.label) : undefined,
    status: event.cancelledAt ? 'cancelled' : event.appliesToMe ? 'active' : 'not_applicable',
    updatedAt: event.updatedAt,
    location: event.location,
    description: draft.description || undefined,
  }
}
