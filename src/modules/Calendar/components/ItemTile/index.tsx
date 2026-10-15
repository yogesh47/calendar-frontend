import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { styleOf } from '../../helpers'
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

  return (
    <button
      type="button"
      title={item.title}
      onClick={(event) => {
        event.stopPropagation()
        onOpen?.(item)
      }}
      className={cn(
        'flex w-full cursor-pointer items-center gap-1.5 rounded px-1.5 py-1 text-left text-xs',
        'border-l-[3px] transition-colors hover:brightness-95',
        style.dashed && 'border-l-0 border border-dashed',
        className,
      )}
      style={{ backgroundColor: style.surface, borderColor: style.accent }}
    >
      {time && <span className="shrink-0 font-semibold" style={{ color: style.accent }}>{time}</span>}
      {!time && (
        <span className="shrink-0 text-[0.625rem] font-bold uppercase" style={{ color: style.accent }}>
          {style.label}
        </span>
      )}
      <span className={cn('truncate', style.struck && 'line-through [color:var(--ds-color-text-tertiary)]')}>
        {style.struck ? `Cancelled: ${item.title}` : item.title}
      </span>
    </button>
  )
}

export default ItemTile
