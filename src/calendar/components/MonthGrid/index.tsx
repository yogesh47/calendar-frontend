import {
  eachDayOfInterval, endOfMonth, endOfWeek, format, isSameDay, isSameMonth, isToday,
  startOfMonth, startOfWeek,
} from 'date-fns'
import { ChevronDown } from '../../icons'
import { cn } from '../../lib/utils'
import { useIsMobile } from '../../hooks/useIsMobile'
import DayAgenda from './components/DayAgenda'
import ItemTile from '../ItemTile'
import { splitForMonthTile } from './MonthGrid.helpers'
import { itemsOn } from '../../helpers/dates'
import type { CalendarItem } from '../../types'

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export type MonthGridProps = {
  month: Date
  items: CalendarItem[]
  selected?: Date
  onOpen?: (item: CalendarItem) => void
  onPickDate?: (day: Date) => void
}

const MonthGrid = ({ month, items, selected, onOpen, onPickDate }: MonthGridProps) => {
  const isMobile = useIsMobile()
  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(month), { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(month), { weekStartsOn: 1 }),
  })

  return (
    <div className="w-full overflow-hidden rounded-xl border [background-color:var(--ds-color-bg-surface)]">
      <div className="grid grid-cols-7 border-b [background-color:var(--ds-color-bg-subtle)]">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="px-1 py-2 text-center text-xs font-semibold [color:var(--ds-color-text-secondary)] sm:px-2 sm:text-left"
          >
            <span className="sm:hidden">{day.slice(0, 1)}</span>
            <span className="hidden sm:inline">{day}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {days.map((day) => {
          const dayItems = itemsOn(items, day)
          const split = splitForMonthTile(dayItems)
          const shown = isMobile ? dayItems.slice(0, 1) : split.shown
          const hiddenCount = isMobile ? Math.max(0, dayItems.length - 1) : split.hiddenCount
          const isSelected = Boolean(selected && isSameDay(day, selected))

          return (
            <div
              key={day.toISOString()}
              onClick={() => onPickDate?.(day)}
              className={cn(
                'flex min-h-[4.5rem] min-w-0 flex-col gap-0.5 overflow-hidden border-b border-r p-1 transition-colors sm:min-h-[7.5rem] sm:gap-1 sm:p-1.5',
                !isSameMonth(day, month) && '[background-color:var(--ds-color-bg-subtle)]',
                onPickDate && 'cursor-pointer hover:[background-color:var(--ds-color-bg-muted)]',
                isSelected && 'ring-2 ring-inset [--tw-ring-color:var(--ds-color-brand)]',
              )}
            >
              <span
                className={cn(
                  'grid size-5 shrink-0 place-items-center self-start rounded-full text-[0.6875rem] font-semibold sm:size-6 sm:text-xs',
                  !isSameMonth(day, month) && '[color:var(--ds-color-text-tertiary)]',
                  isToday(day) && '[background-color:var(--ds-color-brand)] [color:var(--ds-color-brand-fg)]',
                )}
              >
                {format(day, 'd')}
              </span>

              {shown.map((item) => (
                <ItemTile
                  key={item.id}
                  item={item}
                  onOpen={onOpen}
                  showTime={!isMobile}
                  className={isMobile ? 'min-h-[1.25rem] [&>span:first-child]:hidden' : undefined}
                />
              ))}

              {hiddenCount > 0 && (
                <DayAgenda
                  day={day}
                  items={dayItems}
                  hiddenCount={hiddenCount}
                  onOpen={onOpen}
                  trigger={
                    isMobile ? (
                      <span className="flex w-full items-center justify-center gap-0.5 rounded [background-color:var(--ds-color-bg-muted)] py-[0.0625rem] text-[0.625rem] font-semibold">
                        +{hiddenCount}
                        <ChevronDown className="size-2.5" />
                      </span>
                    ) : undefined
                  }
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default MonthGrid
