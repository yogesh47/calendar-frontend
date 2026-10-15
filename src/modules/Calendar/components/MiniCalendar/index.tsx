import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

interface MiniCalendarProps {
  month: Date
  selected: Date
  className?: string
  onMonthChange: (month: Date) => void
  onPick: (day: Date) => void
}

const MiniCalendar = ({ month, selected, className, onMonthChange, onPick }: MiniCalendarProps) => {
  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(month), { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(month), { weekStartsOn: 1 }),
  })

  return (
    <div className={cn('rounded-xl border p-3 [background-color:var(--ds-color-bg-surface)]', className)}>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-semibold">{format(month, 'MMMM yyyy')}</p>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            aria-label="Previous month"
            onClick={() => onMonthChange(subMonths(month, 1))}
            className="grid size-6 cursor-pointer place-items-center rounded [color:var(--ds-color-text-secondary)] hover:[background-color:var(--ds-color-bg-muted)]"
          >
            <ChevronUp className="size-4" />
          </button>
          <button
            type="button"
            aria-label="Next month"
            onClick={() => onMonthChange(addMonths(month, 1))}
            className="grid size-6 cursor-pointer place-items-center rounded [color:var(--ds-color-text-secondary)] hover:[background-color:var(--ds-color-bg-muted)]"
          >
            <ChevronDown className="size-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-y-0.5 text-center">
        {WEEKDAYS.map((day, index) => (
          <span key={`${day}${index}`} className="text-xs font-semibold [color:var(--ds-color-text-tertiary)]">
            {day}
          </span>
        ))}

        {days.map((day) => (
          <button
            key={day.toISOString()}
            type="button"
            onClick={() => onPick(day)}
            className={cn(
              'mx-auto grid size-7 cursor-pointer place-items-center rounded-full text-xs',
              !isSameMonth(day, month) && '[color:var(--ds-color-text-tertiary)]',
              isToday(day) && !isSameDay(day, selected) && 'font-bold [color:var(--ds-color-brand)]',
              isSameDay(day, selected)
                ? '[background-color:var(--ds-color-brand)] font-semibold [color:var(--ds-color-brand-fg)]'
                : 'hover:[background-color:var(--ds-color-bg-muted)]',
            )}
          >
            {format(day, 'd')}
          </button>
        ))}
      </div>
    </div>
  )
}

export default MiniCalendar
