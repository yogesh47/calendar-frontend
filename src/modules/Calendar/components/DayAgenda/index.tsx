import { differenceInMinutes, format } from 'date-fns'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover'
import { cn } from '@/lib/utils'
import { styleOf } from '../../helpers'
import type { CalendarItem } from '../../types'

interface DayAgendaProps {
  day: Date
  items: CalendarItem[]
  hiddenCount: number
  onOpen?: (item: CalendarItem) => void
}

const durationOf = (item: CalendarItem): string => {
  if (item.isAllDay || !item.endsAt) return 'All day'

  const minutes = differenceInMinutes(new Date(item.endsAt), new Date(item.startsAt))
  if (minutes < 60) return `${minutes} min`
  if (minutes % 60 === 0) return `${minutes / 60} hour${minutes === 60 ? '' : 's'}`

  return `${Math.floor(minutes / 60)} hr ${minutes % 60} min`
}

const DayAgenda = ({ day, items, hiddenCount, onOpen }: DayAgendaProps) => (
  <Popover>
    <PopoverTrigger asChild>
      <button
        type="button"
        aria-label={`Show all ${items.length} items`}
        onClick={(event) => event.stopPropagation()}
        className="cursor-pointer rounded px-1.5 text-left text-xs font-semibold [color:var(--ds-color-text-secondary)] hover:[background-color:var(--ds-color-bg-muted)]"
      >
        +{hiddenCount} more
      </button>
    </PopoverTrigger>

    <PopoverContent hideWhenDetached collisionPadding={8}
      align="start"
      className="w-[20rem] p-0 [background-color:var(--ds-color-bg-surface)]"
      onClick={(event) => event.stopPropagation()}
    >
      <p className="border-b px-4 py-3 text-base font-semibold">{format(day, 'EEE, MMM d')}</p>

      <div className="max-h-[18rem] overflow-y-auto">
        {items.map((item) => {
          const style = styleOf(item)

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onOpen?.(item)}
              className="flex w-full cursor-pointer items-start gap-3 px-4 py-2.5 text-left hover:[background-color:var(--ds-color-bg-muted)]"
            >
              <span className="mt-0.5 w-[4.5rem] shrink-0 text-xs [color:var(--ds-color-text-secondary)]">
                <span className="block font-semibold [color:var(--ds-color-text-primary)]">
                  {item.isAllDay ? 'All day' : format(new Date(item.startsAt), 'h:mm a')}
                </span>
                {!item.isAllDay && durationOf(item)}
              </span>

              <span className="w-1 shrink-0 self-stretch rounded" style={{ backgroundColor: style.accent }} />

              <span className="min-w-0 flex-1">
                <span
                  className={cn(
                    'block truncate text-sm font-medium',
                    style.struck && 'line-through [color:var(--ds-color-text-tertiary)]',
                  )}
                >
                  {style.struck ? `Cancelled: ${item.title}` : item.title}
                </span>
                <span className="block truncate text-xs [color:var(--ds-color-text-secondary)]">
                  {style.label}
                  {item.venue ? ` · ${item.venue}` : ''}
                </span>
              </span>
            </button>
          )
        })}
      </div>
    </PopoverContent>
  </Popover>
)

export default DayAgenda
