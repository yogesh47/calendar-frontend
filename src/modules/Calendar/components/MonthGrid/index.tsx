import {
  eachDayOfInterval, endOfMonth, endOfWeek, format, isSameDay, isSameMonth, isToday,
  startOfMonth, startOfWeek,
} from 'date-fns'
import { cn } from '@/lib/utils'
import DayAgenda from '../DayAgenda'
import ItemTile from '../ItemTile'
import { splitForMonthTile } from '../../helpers'
import { itemsOn } from '../../services'
import type { CalendarItem } from '../../types'

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

type MonthGridProps = {
  month: Date
  items: CalendarItem[]
  selected?: Date
  onOpen?: (item: CalendarItem) => void
  onPickDate?: (day: Date) => void
}

const MonthGrid = ({ month, items, selected, onOpen, onPickDate }: MonthGridProps) => {
  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(month), { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(month), { weekStartsOn: 1 }),
  })

  return (
    <div className="w-full overflow-hidden rounded-xl border [background-color:var(--ds-color-bg-surface)]">
      <div className="grid grid-cols-7 border-b [background-color:var(--ds-color-bg-subtle)]">
        {WEEKDAYS.map((day) => (
          <div key={day} className="px-2 py-2 text-xs font-semibold [color:var(--ds-color-text-secondary)]">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {days.map((day) => {
          const dayItems = itemsOn(items, day)
          const { shown, hiddenCount } = splitForMonthTile(dayItems)
          const isSelected = Boolean(selected && isSameDay(day, selected))

          return (
            <div
              key={day.toISOString()}
              onClick={() => onPickDate?.(day)}
              className={cn(
                'flex min-h-[7.5rem] flex-col gap-1 border-b border-r p-1.5 transition-colors',
                !isSameMonth(day, month) && '[background-color:var(--ds-color-bg-subtle)]',
                onPickDate && 'cursor-pointer hover:[background-color:var(--ds-color-bg-muted)]',
                isSelected && 'ring-2 ring-inset [--tw-ring-color:var(--ds-color-brand)]',
              )}
            >
              <span
                className={cn(
                  'grid size-6 shrink-0 place-items-center self-start rounded-full text-xs font-semibold',
                  !isSameMonth(day, month) && '[color:var(--ds-color-text-tertiary)]',
                  isToday(day) && '[background-color:var(--ds-color-brand)] [color:var(--ds-color-brand-fg)]',
                )}
              >
                {format(day, 'd')}
              </span>

              {shown.map((item) => (
                <ItemTile key={item.id} item={item} onOpen={onOpen} showTime />
              ))}

              {hiddenCount > 0 && (
                <DayAgenda day={day} items={dayItems} hiddenCount={hiddenCount} onOpen={onOpen} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default MonthGrid
