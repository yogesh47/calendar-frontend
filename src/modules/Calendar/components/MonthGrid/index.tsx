import {
  eachDayOfInterval, endOfMonth, endOfWeek, format, isSameMonth, isToday,
  startOfMonth, startOfWeek,
} from 'date-fns'
import { cn } from '@/lib/utils'
import ItemTile from '../ItemTile'
import { splitForMonthTile } from '../../helpers'
import { itemsOn } from '../../services'
import type { CalendarItem } from '../../types'

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

type MonthGridProps = {
  month: Date
  items: CalendarItem[]
  onOpen?: (item: CalendarItem) => void
  onPickDate?: (day: Date) => void
}

/**
 * The month view: six rows of seven, always, so the grid does not jump height
 * as the user pages through. Days outside the month stay visible but dimmed —
 * an event on the 1st is easier to find when the week it sits in is whole.
 */
const MonthGrid = ({ month, items, onOpen, onPickDate }: MonthGridProps) => {
  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(month), { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(month), { weekStartsOn: 1 }),
  })

  return (
    <div className="w-full overflow-hidden rounded-[0.75rem] border bg-card">
      <div className="grid grid-cols-7 border-b bg-muted/50">
        {WEEKDAYS.map((day) => (
          <div key={day} className="px-[0.5rem] py-[0.5rem] text-[0.75rem] font-semibold text-muted-foreground">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {days.map((day) => {
          const dayItems = itemsOn(items, day)
          const { shown, hiddenCount } = splitForMonthTile(dayItems)

          return (
            <div
              key={day.toISOString()}
              className={cn(
                'flex min-h-[7rem] flex-col gap-[0.25rem] border-b border-r p-[0.375rem]',
                !isSameMonth(day, month) && 'bg-muted/30',
              )}
            >
              <button
                type="button"
                onClick={() => onPickDate?.(day)}
                className={cn(
                  'self-start rounded-full px-[0.375rem] text-[0.75rem] font-semibold hover:bg-muted',
                  isSameMonth(day, month) ? 'text-foreground' : 'text-muted-foreground',
                  isToday(day) && 'bg-brand text-brand-foreground',
                )}
              >
                {format(day, 'd')}
              </button>

              {shown.map((item) => (
                <ItemTile key={item.id} item={item} onOpen={onOpen} />
              ))}

              {hiddenCount > 0 && (
                <span className="px-[0.375rem] text-[0.6875rem] font-medium text-muted-foreground">
                  +{hiddenCount} more
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default MonthGrid
