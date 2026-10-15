import { useState } from 'react'
import {
  addDays,
  addMonths,
  addYears,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  setMonth as setMonthOf,
  startOfMonth,
  startOfWeek,
  subMonths,
  subYears,
} from 'date-fns'
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

interface MiniCalendarProps {
  month: Date
  selected: Date
  rangeStart?: Date
  rangeDays?: number
  className?: string
  onMonthChange: (month: Date) => void
  onPick: (day: Date) => void
}

const MiniCalendar = ({
  month,
  selected,
  rangeStart,
  rangeDays = 1,
  className,
  onMonthChange,
  onPick,
}: MiniCalendarProps) => {
  const [picking, setPicking] = useState(false)

  const inRange = (day: Date): boolean => {
    const start = new Date(rangeStart ?? selected)
    start.setHours(0, 0, 0, 0)
    const end = addDays(start, rangeDays - 1)
    const value = new Date(day)
    value.setHours(0, 0, 0, 0)

    return value >= start && value <= end
  }

  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(month), { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(month), { weekStartsOn: 1 }),
  })

  const step = (back: boolean) =>
    onMonthChange(
      picking
        ? back
          ? subYears(month, 1)
          : addYears(month, 1)
        : back
          ? subMonths(month, 1)
          : addMonths(month, 1),
    )

  return (
    <div className={cn('rounded-xl border p-3 [background-color:var(--ds-color-bg-surface)]', className)}>
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setPicking(!picking)}
          className="flex cursor-pointer items-center gap-1 rounded px-1 py-0.5 text-sm font-semibold hover:[background-color:var(--ds-color-bg-muted)]"
        >
          {format(month, 'MMMM yyyy')}
          <ChevronDown className={cn('size-3.5 transition-transform', picking && 'rotate-180')} />
        </button>

        <div className="flex items-center gap-0.5">
          <button
            type="button"
            aria-label={picking ? 'Previous year' : 'Previous month'}
            onClick={() => step(true)}
            className="grid size-6 cursor-pointer place-items-center rounded [color:var(--ds-color-text-secondary)] hover:[background-color:var(--ds-color-bg-muted)]"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            aria-label={picking ? 'Next year' : 'Next month'}
            onClick={() => step(false)}
            className="grid size-6 cursor-pointer place-items-center rounded [color:var(--ds-color-text-secondary)] hover:[background-color:var(--ds-color-bg-muted)]"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      {picking ? (
        <div className="grid grid-cols-3 gap-1.5">
          {MONTHS.map((name, index) => (
            <button
              key={name}
              type="button"
              onClick={() => {
                onMonthChange(setMonthOf(month, index))
                setPicking(false)
              }}
              className={cn(
                'h-9 cursor-pointer rounded-md text-sm transition-colors',
                month.getMonth() === index
                  ? '[background-color:var(--ds-color-brand)] font-semibold [color:var(--ds-color-brand-fg)]'
                  : 'hover:[background-color:var(--ds-color-bg-muted)]',
              )}
            >
              {name}
            </button>
          ))}
        </div>
      ) : (
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
                  : inRange(day)
                    ? 'rounded-md [background-color:var(--ds-color-brand-subtle)] [color:var(--ds-color-brand)]'
                    : 'hover:[background-color:var(--ds-color-bg-muted)]',
              )}
            >
              {format(day, 'd')}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default MiniCalendar
