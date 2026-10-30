import { cn } from '../../../../lib/utils'
import type { CalendarItem } from '../../../../types'
import { STATUS_BADGE } from './StatusBadge.constants'
import { isPast, isRecentlyUpdated } from '../../../../helpers'

/**
 * Updated / Cancelled / No longer applicable / Past.
 *
 * Only one shows at a time, in that order: a cancelled item is also past, and
 * saying both adds nothing.
 */
const StatusBadge = ({ item, className }: { item: CalendarItem; className?: string }) => {
  const key = item.status === 'cancelled'
    ? 'cancelled'
    : item.status === 'not_applicable'
      ? 'not_applicable'
      : isRecentlyUpdated(item)
        ? 'updated'
        : isPast(item)
          ? 'past'
          : null

  if (!key) return null

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-[0.375rem] py-[0.125rem] text-[0.625rem] font-semibold sm:px-[0.5rem] sm:text-[0.6875rem]',
        key === 'cancelled' && 'bg-destructive/10 text-destructive',
        key === 'updated' && 'bg-brand/10 text-brand',
        (key === 'past' || key === 'not_applicable') && 'bg-muted text-muted-foreground',
        className,
      )}
    >
      {STATUS_BADGE[key]}
    </span>
  )
}

export default StatusBadge
