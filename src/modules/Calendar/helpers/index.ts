import { differenceInHours, isBefore } from 'date-fns'
import { CALENDAR_ITEM_STYLE, CANCELLED_STYLE, EVENT_TYPE_LABEL, LIMITS } from '../constants'
import type { CalendarItem } from '../types'

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
  const label = item.kind === 'event' && item.eventType ? EVENT_TYPE_LABEL[item.eventType] : base.label

  return { ...base, label, struck: false }
}

/** The "Updated" badge only lives for a window after the edit. */
export const isRecentlyUpdated = (item: CalendarItem, now = new Date()): boolean =>
  Boolean(item.updatedAt) &&
  differenceInHours(now, new Date(item.updatedAt as string)) < LIMITS.updatedBadgeHours

export const isPast = (item: CalendarItem, now = new Date()): boolean =>
  isBefore(new Date(item.endsAt ?? item.startsAt), now)

/** A month tile shows a few, then says how many are hidden. */
export const splitForMonthTile = (items: CalendarItem[]) => ({
  shown: items.slice(0, LIMITS.monthTileItems),
  hiddenCount: Math.max(0, items.length - LIMITS.monthTileItems),
})
