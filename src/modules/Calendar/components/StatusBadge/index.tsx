import { cn } from '@/lib/utils'
import { STATUS_BADGE } from '../../constants'
import { isPast, isRecentlyUpdated } from '../../helpers'
import type { CalendarItem } from '../../types'

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
        'inline-flex items-center rounded-full px-[0.5rem] py-[0.125rem] text-[0.6875rem] font-semibold',
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
