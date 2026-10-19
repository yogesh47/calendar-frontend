import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { isPast, isRecentlyUpdated, styleOf } from '../../helpers'
import type { CalendarItem } from '../../types'

type ItemTileProps = {
  item: CalendarItem
  onOpen?: (item: CalendarItem) => void
  showTime?: boolean
  className?: string
}

const ItemTile = ({ item, onOpen, showTime, className }: ItemTileProps) => {
  const style = styleOf(item)
  const time = !item.isAllDay && showTime ? format(new Date(item.startsAt), 'h:mm a') : ''
  const isUpdated = item.status === 'active' && isRecentlyUpdated(item)
  const isOver = item.status === 'active' && isPast(item)

  return (
    <button
      type="button"
      title={item.title}
      onClick={(event) => {
        event.stopPropagation()
        onOpen?.(item)
      }}
      className={cn(
        'flex w-full min-w-0 max-w-full cursor-pointer items-center gap-1 overflow-hidden rounded px-1 py-1 text-left text-[0.6875rem] sm:gap-1.5 sm:px-1.5 sm:text-xs',
        'border-l-[3px] transition-colors hover:brightness-95',
        style.dashed && 'border-l-0 border border-dashed',
        isOver && 'opacity-60',
        className,
      )}
      style={{ backgroundColor: style.surface, borderColor: style.accent }}
    >
      {time && (
        <span className="shrink-0 truncate font-semibold" style={{ color: style.accent }}>
          {time}
        </span>
      )}
      {!time && (
        <span className="shrink-0 truncate text-[0.625rem] font-bold uppercase" style={{ color: style.accent }}>
          {style.label}
        </span>
      )}
      <span className={cn('min-w-0 flex-1 truncate', style.struck && 'line-through [color:var(--ds-color-text-tertiary)]')}>
        {style.struck ? `${style.label}: ${item.title}` : item.title}
      </span>

      {isUpdated && (
        <span
          className="ml-auto shrink-0 rounded-full px-1.5 text-[0.5625rem] font-bold uppercase"
          style={{ backgroundColor: style.accent, color: 'white' }}
        >
          Updated
        </span>
      )}
    </button>
  )
}

export default ItemTile
