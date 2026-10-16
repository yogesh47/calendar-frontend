import { useEffect, useRef, useState } from 'react'
import { format, isSameDay, isToday } from 'date-fns'
import { cn } from '@/lib/utils'
import ItemTile from '../ItemTile'
import { styleOf } from '../../helpers'
import { lanesFor } from '../../helpers/conflicts'
import { coversDay, spansDays } from '../../services'
import { WEEK_HOURS } from '../../constants'
import type { CalendarItem } from '../../types'

type DaysGridProps = {
  days: Date[]
  items: CalendarItem[]
  onOpen?: (item: CalendarItem) => void
  onPickDate?: (day: Date) => void
}

const HOUR_HEIGHT = 3

const minutesOf = (value: string): number => {
  const moment = new Date(value)
  return moment.getHours() * 60 + moment.getMinutes()
}

const DaysGrid = ({ days, items, onOpen, onPickDate }: DaysGridProps) => {
  const scroller = useRef<HTMLDivElement>(null)
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!scroller.current) return
    const hasToday = days.some((day) => isToday(day))
    const anchor = hasToday ? Math.max(new Date().getHours() - 1, 0) : WEEK_HOURS.from
    scroller.current.scrollTop = anchor * HOUR_HEIGHT * 16 + 1
  }, [days])

  const allDayOn = (day: Date) => items.filter((item) => (item.isAllDay || spansDays(item)) && coversDay(item, day))

  const timedOn = (day: Date) =>
    items.filter((item) => !item.isAllDay && !spansDays(item) && isSameDay(new Date(item.startsAt), day))

  const columns = `4rem repeat(${days.length}, minmax(0, 1fr))`

  return (
    <div className="w-full overflow-hidden rounded-xl border [background-color:var(--ds-color-bg-surface)]">
      <div ref={scroller} className="max-h-[36rem] overflow-y-auto">
        <div className="sticky top-0 z-20 [background-color:var(--ds-color-bg-surface)]">
      <div className="grid border-b" style={{ gridTemplateColumns: columns }}>
        <div className="border-r px-2 py-2 text-xs font-semibold [color:var(--ds-color-text-tertiary)]">Time</div>
        {days.map((day) => (
          <button
            key={day.toISOString()}
            type="button"
            onClick={() => onPickDate?.(day)}
            className={cn(
              'flex cursor-pointer flex-col border-r px-2 py-2 text-left last:border-r-0',
              onPickDate && 'hover:[background-color:var(--ds-color-bg-muted)]',
            )}
          >
            <span
              className={cn(
                'text-xl font-bold leading-none',
                isToday(day) ? '[color:var(--ds-color-brand)]' : '[color:var(--ds-color-text-primary)]',
              )}
            >
              {format(day, 'd')}
            </span>
            <span className="mt-1 text-xs font-semibold [color:var(--ds-color-text-secondary)]">
              {format(day, 'EEEE')}
            </span>
          </button>
        ))}
      </div>

      <div
        className="grid border-b [background-color:var(--ds-color-bg-subtle)]"
        style={{ gridTemplateColumns: columns }}
      >
        <div className="border-r px-2 py-2 text-xs font-semibold [color:var(--ds-color-text-tertiary)]">
          All day
        </div>
        {days.map((day) => (
          <div key={day.toISOString()} className="flex min-h-[2.25rem] flex-col gap-1 border-r p-1 last:border-r-0">
            {allDayOn(day).map((item) => (
              <ItemTile key={item.id} item={item} onOpen={onOpen} />
            ))}
          </div>
        ))}
      </div>
        </div>

        <div className="grid" style={{ gridTemplateColumns: columns }}>
          <div>
            {Array.from({ length: 24 }, (_, hour) => (
              <div
                key={hour}
                className="border-b border-r px-2 text-xs [color:var(--ds-color-text-tertiary)]"
                style={{ height: `${HOUR_HEIGHT}rem` }}
              >
                {format(new Date(2000, 0, 1, hour), 'h a')}
              </div>
            ))}
          </div>

          {days.map((day) => {
            const timed = timedOn(day)
            const lanes = lanesFor(timed)

            return (
              <div key={day.toISOString()} className="relative border-r last:border-r-0">
                {Array.from({ length: 24 }, (_, hour) => (
                  <div
                    key={hour}
                    className={cn('border-b', onPickDate && 'cursor-pointer hover:[background-color:var(--ds-color-bg-subtle)]')}
                    style={{ height: `${HOUR_HEIGHT}rem` }}
                    onClick={() => onPickDate?.(day)}
                  >
                    <div className="h-1/2 border-b border-dashed [border-color:var(--ds-color-border-default)]" />
                  </div>
                ))}

                {isToday(day) && (
                  <div
                    className="pointer-events-none absolute left-0 right-0 z-10 flex -translate-y-1/2 items-center"
                    style={{ top: `${((now.getHours() * 60 + now.getMinutes()) / 60) * HOUR_HEIGHT}rem` }}
                  >
                    <span className="size-2 rounded-full [background-color:var(--ds-color-danger)]" />
                    <span className="h-px flex-1 [background-color:var(--ds-color-danger)]" />
                  </div>
                )}

                {timed.map((item) => {
                  const style = styleOf(item)
                  const place = lanes.get(item.id) ?? { lane: 0, lanes: 1 }
                  const start = minutesOf(item.startsAt)
                  const end = item.endsAt ? minutesOf(item.endsAt) : start + 30
                  const width = 100 / place.lanes

                  return (
                    <button
                      key={item.id}
                      type="button"
                      title={item.title}
                      onClick={() => onOpen?.(item)}
                      className="absolute overflow-hidden rounded border-l-[3px] px-1.5 py-1 text-left"
                      style={{
                        top: `${(start / 60) * HOUR_HEIGHT}rem`,
                        height: `${Math.max(((end - start) / 60) * HOUR_HEIGHT, 1.25)}rem`,
                        left: `calc(${place.lane * width}% + 0.125rem)`,
                        width: `calc(${width}% - 0.25rem)`,
                        backgroundColor: style.surface,
                        borderColor: style.accent,
                      }}
                    >
                      <span className="block text-xs font-semibold" style={{ color: style.accent }}>
                        {format(new Date(item.startsAt), 'h:mm a')}
                      </span>
                      <span className={cn('block truncate text-xs font-medium', style.struck && 'line-through')}>
                        {style.struck ? `${style.label}: ${item.title}` : item.title}
                      </span>
                    </button>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default DaysGrid
