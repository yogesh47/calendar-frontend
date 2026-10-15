import { eachDayOfInterval, endOfWeek, format, isSameDay, isToday, startOfWeek } from 'date-fns'
import { cn } from '@/lib/utils'
import ItemTile from '../ItemTile'
import { styleOf } from '../../helpers'
import { coversDay, spansDays } from '../../services'
import { lanesFor } from '../../helpers/conflicts'
import { WEEK_HOURS } from '../../constants'
import type { CalendarItem } from '../../types'

type WeekGridProps = {
  week: Date
  items: CalendarItem[]
  onOpen?: (item: CalendarItem) => void
  onPickDate?: (day: Date) => void
}

const HOURS = Array.from({ length: WEEK_HOURS.to - WEEK_HOURS.from + 1 }, (_, index) => WEEK_HOURS.from + index)

const ROW_HEIGHT = 3

const hourLabel = (hour: number): string => format(new Date(2000, 0, 1, hour), 'h a')

const minutesFrom = (value: string): number => {
  const moment = new Date(value)
  return moment.getHours() * 60 + moment.getMinutes()
}

const WeekGrid = ({ week, items, onOpen, onPickDate }: WeekGridProps) => {
  const days = eachDayOfInterval({
    start: startOfWeek(week, { weekStartsOn: 1 }),
    end: endOfWeek(week, { weekStartsOn: 1 }),
  })

  const allDayOn = (day: Date) =>
    items.filter((item) => (item.isAllDay || spansDays(item)) && coversDay(item, day))

  const timedOn = (day: Date) =>
    items.filter((item) => !item.isAllDay && !spansDays(item) && isSameDay(new Date(item.startsAt), day))

  const top = (item: CalendarItem): number =>
    ((minutesFrom(item.startsAt) - WEEK_HOURS.from * 60) / 60) * ROW_HEIGHT

  const height = (item: CalendarItem): number => {
    if (!item.endsAt) return ROW_HEIGHT / 2
    const span = (minutesFrom(item.endsAt) - minutesFrom(item.startsAt)) / 60
    return Math.max(span * ROW_HEIGHT, ROW_HEIGHT / 2)
  }

  return (
    <div className="w-full overflow-hidden rounded-[0.75rem] border bg-card">
      <div className="grid grid-cols-[4rem_repeat(7,1fr)] border-b bg-muted/50">
        <div className="px-[0.5rem] py-[0.5rem] text-[0.75rem] font-semibold text-muted-foreground">Time</div>
        {days.map((day) => (
          <button
            key={day.toISOString()}
            type="button"
            onClick={() => onPickDate?.(day)}
            className="px-[0.5rem] py-[0.5rem] text-left text-[0.75rem] font-semibold text-muted-foreground hover:bg-muted"
          >
            <span className={cn(isToday(day) && 'rounded-full bg-brand px-[0.375rem] text-brand-foreground')}>
              {format(day, 'EEE d')}
            </span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-[4rem_repeat(7,1fr)] border-b">
        <div className="border-r px-[0.5rem] py-[0.375rem] text-[0.6875rem] font-semibold text-muted-foreground">
          All day
        </div>
        {days.map((day) => (
          <div key={day.toISOString()} className="flex min-h-[2.25rem] flex-col gap-[0.125rem] border-r p-[0.1875rem]">
            {allDayOn(day).map((item) => (
              <ItemTile key={item.id} item={item} onOpen={onOpen} />
            ))}
          </div>
        ))}
      </div>

      <div className="max-h-[32rem] overflow-y-auto">
        <div className="grid grid-cols-[4rem_repeat(7,1fr)]">
          <div>
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="border-b border-r px-[0.5rem] text-[0.6875rem] text-muted-foreground"
                style={{ height: `${ROW_HEIGHT}rem` }}
              >
                {hourLabel(hour)}
              </div>
            ))}
          </div>

          {days.map((day) => (
            <div key={day.toISOString()} className="relative border-r">
              {HOURS.map((hour) => (
                <div key={hour} className="border-b" style={{ height: `${ROW_HEIGHT}rem` }}>
                  <div className="h-1/2 border-b border-dashed [border-color:var(--ds-color-border-default)]" />
                </div>
              ))}

              {timedOn(day).map((item, _index, all) => {
                const style = styleOf(item)
                const place = lanesFor(all).get(item.id) ?? { lane: 0, lanes: 1 }
                const width = 100 / place.lanes

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onOpen?.(item)}
                    title={item.title}
                    className={cn(
                      'absolute overflow-hidden rounded-[0.25rem] border-l-[3px] px-[0.3125rem] py-[0.1875rem] text-left',
                      style.struck && 'line-through',
                    )}
                    style={{
                      top: `${top(item)}rem`,
                      height: `${height(item)}rem`,
                      left: `calc(${place.lane * width}% + 0.1875rem)`,
                      width: `calc(${width}% - 0.375rem)`,
                      borderLeftColor: style.accent,
                      background: style.surface,
                    }}
                  >
                    <span className="block text-[0.625rem] font-semibold uppercase" style={{ color: style.accent }}>
                      {style.label}
                    </span>
                    <span className={cn('block truncate text-[0.6875rem] font-medium', style.struck && 'line-through')}>
                      {style.struck ? `Cancelled: ${item.title}` : item.title}
                    </span>
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default WeekGrid
