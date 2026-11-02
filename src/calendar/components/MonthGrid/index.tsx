import {
  eachDayOfInterval, endOfMonth, endOfWeek, format, isBefore, isSameDay, isSameMonth, isToday,
  startOfDay, startOfMonth, startOfWeek,
} from 'date-fns'

import ItemTile from '../ItemTile'
import { useLabels } from '../../labels'
import { cn } from '../../lib/utils'
import { ChevronDown } from '../../icons'
import { itemsOn } from '../../helpers/dates'
import DayAgenda from './components/DayAgenda'
import type { CalendarItem } from '../../types'
import { useIsMobile } from '../../hooks/useIsMobile'
import { splitForMonthTile } from './MonthGrid.helpers'

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export type MonthGridProps = {
  month: Date
  items: CalendarItem[]
  selected?: Date
  onOpen?: (item: CalendarItem) => void
  onPickDate?: (day: Date) => void
  /** May a day before today be picked to create on? Default: off — those days are greyed out. */
  allowPastDates?: boolean
}

const MonthGrid = ({ month, items, selected, onOpen, onPickDate, allowPastDates = false }: MonthGridProps) => {
  const isMobile = useIsMobile()
  const labels = useLabels()
  const today = startOfDay(new Date())
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
          // A gone day still shows its items, which open as usual; only creating on it is off.
          const isGone = !allowPastDates && isBefore(day, today)
          const canPick = Boolean(onPickDate) && !isGone

          return (
            <div
              key={day.toISOString()}
              onClick={canPick ? () => onPickDate?.(day) : undefined}
              // Not aria-disabled: that would mark the items inside as disabled too, and they still open.
              data-past={isGone || undefined}
              title={isGone ? labels.state.pastTime : undefined}
              className={cn(
                'flex min-h-[4.5rem] min-w-0 flex-col gap-0.5 overflow-hidden border-b border-r p-1 transition-colors sm:min-h-[7.5rem] sm:gap-1 sm:p-1.5',
                (!isSameMonth(day, month) || isGone) && '[background-color:var(--ds-color-bg-subtle)]',
                isGone && 'cursor-not-allowed [background-image:repeating-linear-gradient(135deg,transparent_0_7px,var(--ds-color-border-default)_7px_8px)]',
                canPick && 'cursor-pointer hover:[background-color:var(--ds-color-bg-muted)]',
                isSelected && 'ring-2 ring-inset [--tw-ring-color:var(--ds-color-brand)]',
              )}
            >
              <span
                className={cn(
                  'grid size-5 shrink-0 place-items-center self-start rounded-full text-[0.6875rem] font-semibold sm:size-6 sm:text-xs',
                  (!isSameMonth(day, month) || isGone) && '[color:var(--ds-color-text-tertiary)]',
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
