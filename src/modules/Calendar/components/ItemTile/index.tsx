import { cn } from '@/lib/utils'
import { styleOf } from '../../helpers'
import type { CalendarItem } from '../../types'

type ItemTileProps = {
  item: CalendarItem
  onOpen?: (item: CalendarItem) => void
  className?: string
}

/**
 * One row on a day — month tile, week column, list, "Coming Up", mobile.
 *
 * The coloured left border carries the kind, and the label repeats it in words:
 * the spec forbids leaning on colour alone, so the text is not optional here.
 */
const ItemTile = ({ item, onOpen, className }: ItemTileProps) => {
  const style = styleOf(item)

  return (
    <button
      type="button"
      onClick={() => onOpen?.(item)}
      title={item.title}
      className={cn(
        'flex w-full items-center gap-[0.375rem] rounded-[0.25rem] px-[0.375rem] py-[0.25rem] text-left',
        'border-l-[3px] transition-colors hover:brightness-95',
        style.dashed && 'border-l-0 border border-dashed',
        className,
      )}
      style={{
        backgroundColor: `hsl(${style.surface})`,
        borderColor: `hsl(${style.accent})`,
      }}
    >
      <span
        className="shrink-0 text-[0.625rem] font-semibold uppercase tracking-[0.02em]"
        style={{ color: `hsl(${style.accent})` }}
      >
        {style.label}
      </span>
      <span
        className={cn(
          'min-w-0 flex-1 truncate text-[0.75rem] font-medium text-foreground',
          style.struck && 'line-through opacity-60',
        )}
      >
        {item.title}
      </span>
    </button>
  )
}

export default ItemTile
