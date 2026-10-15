import { useEffect, useRef, useState } from 'react'
import { format, isToday } from 'date-fns'
import { cn } from '@/lib/utils'
import ItemTile from '../ItemTile'
import { styleOf } from '../../helpers'
import { coversDay, spansDays } from '../../services'
import { WEEK_HOURS } from '../../constants'
import type { CalendarItem } from '../../types'

type DayGridProps = {
  day: Date
  items: CalendarItem[]
  onOpen?: (item: CalendarItem) => void
  onPickDate?: (day: Date) => void
}

const HOUR_HEIGHT = 3.5

const minutesOf = (value: string): number => {
  const moment = new Date(value)
  return moment.getHours() * 60 + moment.getMinutes()
}

const lanesFor = (items: CalendarItem[]): Map<string, { lane: number; lanes: number }> => {
  const sorted = [...items].sort((a, b) => minutesOf(a.startsAt) - minutesOf(b.startsAt))
  const placed = new Map<string, { lane: number; lanes: number }>()
  let cluster: CalendarItem[] = []

  const flush = () => {
    const lanes: CalendarItem[][] = []
    cluster.forEach((item) => {
      const free = lanes.findIndex(
        (lane) => minutesOf(lane[lane.length - 1].endsAt ?? lane[lane.length - 1].startsAt) <= minutesOf(item.startsAt),
      )
      if (free === -1) lanes.push([item])
      else lanes[free].push(item)
    })
    lanes.forEach((lane, index) => lane.forEach((item) => placed.set(item.id, { lane: index, lanes: lanes.length })))
    cluster = []
  }

  let clusterEnd = -1
  sorted.forEach((item) => {
    const start = minutesOf(item.startsAt)
    if (cluster.length && start >= clusterEnd) flush()
    cluster.push(item)
    clusterEnd = Math.max(clusterEnd, minutesOf(item.endsAt ?? item.startsAt))
  })
  if (cluster.length) flush()

  return placed
}

const DayGrid = ({ day, items, onOpen, onPickDate }: DayGridProps) => {
  const scroller = useRef<HTMLDivElement>(null)
  const onThisDay = items.filter((item) => coversDay(item, day))
  const allDay = onThisDay.filter((item) => item.isAllDay || spansDays(item))
  const timed = onThisDay.filter((item) => !item.isAllDay && !spansDays(item))
  const lanes = lanesFor(timed)

  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!scroller.current) return
    const anchor = isToday(day) ? Math.max(new Date().getHours() - 1, 0) : WEEK_HOURS.from
    scroller.current.scrollTop = anchor * HOUR_HEIGHT * 16
  }, [day])

  return (
    <div className="w-full overflow-hidden rounded-xl border [background-color:var(--ds-color-bg-surface)]">
      <div className="flex items-end gap-2 border-b px-4 py-3">
        <span className="text-2xl font-bold [color:var(--ds-color-brand)]">{format(day, 'd')}</span>
        <span className="pb-1 text-sm font-semibold [color:var(--ds-color-text-secondary)]">{format(day, 'EEEE')}</span>
      </div>

      <div className="flex gap-2 border-b px-4 py-2">
        <span className="w-16 shrink-0 text-xs font-semibold [color:var(--ds-color-text-secondary)]">All day</span>
        <div className="flex min-h-[1.5rem] flex-1 flex-col gap-1">
          {allDay.map((item) => (
            <ItemTile key={item.id} item={item} onOpen={onOpen} />
          ))}
        </div>
      </div>

      <div ref={scroller} className="max-h-[34rem] overflow-y-auto">
        <div className="grid grid-cols-[4rem_1fr]">
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

          <div className="relative">
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
                  className={cn(
                    'absolute overflow-hidden rounded border-l-[3px] px-2 py-1 text-left',
                    style.struck && 'line-through',
                  )}
                  style={{
                    top: `${(start / 60) * HOUR_HEIGHT}rem`,
                    height: `${Math.max(((end - start) / 60) * HOUR_HEIGHT, 1.25)}rem`,
                    left: `calc(${place.lane * width}% + 0.25rem)`,
                    width: `calc(${width}% - 0.5rem)`,
                    backgroundColor: style.surface,
                    borderColor: style.accent,
                  }}
                >
                  <span className="block text-xs font-semibold" style={{ color: style.accent }}>
                    {format(new Date(item.startsAt), 'h:mm a')}
                    {item.endsAt ? ` – ${format(new Date(item.endsAt), 'h:mm a')}` : ''}
                  </span>
                  <span className={cn('block truncate text-sm font-medium', style.struck && 'line-through')}>
                    {style.struck ? `Cancelled: ${item.title}` : item.title}
                  </span>
                  {item.venue && (
                    <span className="block truncate text-xs [color:var(--ds-color-text-secondary)]">{item.venue}</span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DayGrid
