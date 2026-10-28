import { LIMITS } from '../../constants'
import type { CalendarItem } from '../../types'

/** A month tile shows a few, then says how many are hidden. */
export const splitForMonthTile = (items: CalendarItem[]) => ({
  shown: items.slice(0, LIMITS.monthTileItems),
  hiddenCount: Math.max(0, items.length - LIMITS.monthTileItems),
})
