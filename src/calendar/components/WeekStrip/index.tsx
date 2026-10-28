import { addDays, format, isSameDay, isToday, startOfWeek } from 'date-fns'
import { cn } from '../../lib/utils'

export interface WeekStripProps {
  selected: Date
  onPick: (day: Date) => void
}

const WeekStrip = ({ selected, onPick }: WeekStripProps) => {
  const start = startOfWeek(selected, { weekStartsOn: 1 })
  const days = Array.from({ length: 7 }, (_, index) => addDays(start, index))

  return (
    <div className="flex items-stretch gap-0.5 rounded-xl border p-1 [background-color:var(--ds-color-bg-surface)]">
      {days.map((day) => {
        const isOn = isSameDay(day, selected)

        return (
          <button
            key={day.toISOString()}
            type="button"
            aria-label={format(day, 'EEEE, MMM d')}
            aria-pressed={isOn}
            onClick={() => onPick(day)}
            className="flex flex-1 cursor-pointer flex-col items-center gap-1 rounded-lg py-1.5"
          >
            <span className="text-[0.625rem] font-semibold [color:var(--ds-color-text-tertiary)]">
              {format(day, 'EEEEE')}
            </span>
            <span
              className={cn(
                'grid size-7 place-items-center rounded-full text-[0.8125rem] font-semibold',
                isOn
                  ? '[background-color:var(--ds-color-brand)] [color:var(--ds-color-brand-fg)]'
                  : isToday(day)
                    ? '[color:var(--ds-color-brand)]'
                    : '[color:var(--ds-color-text-primary)]',
              )}
            >
              {format(day, 'd')}
            </span>
          </button>
        )
      })}
    </div>
  )
}

export default WeekStrip
