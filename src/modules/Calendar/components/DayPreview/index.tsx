import { useEffect, useRef, useState } from 'react'
import { addDays, format, isToday, subDays } from 'date-fns'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import DayJump from '../DayJump'
import { overlaps } from '../../helpers/conflicts'

export type DayEntry = {
  id: string
  title: string
  eventDate: string
  startTime: string
  endTime: string
}

interface DayPreviewProps {
  date: string
  startTime: string
  endTime: string
  title: string
  entries: DayEntry[]
  onDateChange: (date: string) => void
  onTimeChange?: (startTime: string, endTime: string) => void
}

const HOUR_HEIGHT = 2.5

const STEP = 30

const DAY_MINUTES = 24 * 60

const minutesOf = (value: string): number => {
  const [hour, minute] = value.split(':').map(Number)
  return hour * 60 + (minute || 0)
}

const clockOf = (minutes: number): string =>
  `${String(Math.floor(minutes / 60) % 24).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`

const labelOf = (minutes: number): string =>
  format(new Date(2000, 0, 1, Math.floor(minutes / 60), minutes % 60), 'h:mm a')

const hourLabel = (hour: number): string => format(new Date(2000, 0, 1, hour), 'h a')

const shiftDay = (date: string, days: number): string =>
  format(days > 0 ? addDays(new Date(`${date}T00:00:00`), days) : subDays(new Date(`${date}T00:00:00`), -days), 'yyyy-MM-dd')

const clamp = (value: number, low: number, high: number): number => Math.min(Math.max(value, low), high)

const DayPreview = ({ date, startTime, endTime, title, entries, onDateChange, onTimeChange }: DayPreviewProps) => {
  const scroller = useRef<HTMLDivElement>(null)
  const grid = useRef<HTMLDivElement>(null)
  const edge = useRef<'start' | 'end' | null>(null)
  const dragged = useRef(false)
  const [now, setNow] = useState(new Date())
  const [hover, setHover] = useState<number | null>(null)

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!scroller.current) return
    const anchor = startTime || format(new Date(), 'HH:mm')
    scroller.current.scrollTop = Math.max(((minutesOf(anchor) - 60) / 60) * HOUR_HEIGHT * 16, 0)
  }, [startTime, date])

  const minutesAt = (clientY: number, round: boolean): number => {
    if (!grid.current) return 0
    const bounds = grid.current.getBoundingClientRect()
    const raw = ((clientY - bounds.top) / bounds.height) * DAY_MINUTES
    const snapped = round ? Math.round(raw / STEP) * STEP : Math.floor(raw / STEP) * STEP
    return clamp(snapped, 0, DAY_MINUTES)
  }

  useEffect(() => {
    if (!onTimeChange) return

    const move = (event: MouseEvent) => {
      if (!edge.current) return
      dragged.current = true
      const minutes = minutesAt(event.clientY, true)
      const start = minutesOf(startTime || '09:00')
      const end = minutesOf(endTime || clockOf(start + 60))

      if (edge.current === 'start') onTimeChange(clockOf(clamp(minutes, 0, end - STEP)), clockOf(end))
      else onTimeChange(clockOf(start), clockOf(clamp(minutes, start + STEP, DAY_MINUTES - 1)))
    }

    const stop = () => {
      if (!edge.current) return
      edge.current = null
      document.body.style.cursor = ''
      window.setTimeout(() => {
        dragged.current = false
      }, 0)
    }

    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', stop)
    return () => {
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', stop)
    }
  }, [onTimeChange, startTime, endTime])

  if (!date) return null

  const onThisDay = entries.filter((entry) => entry.eventDate === date && entry.startTime)

  const pickSlot = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!onTimeChange || dragged.current) return

    const start = minutesAt(event.clientY, false)
    const span = startTime && endTime ? Math.max(minutesOf(endTime) - minutesOf(startTime), STEP) : 60
    onTimeChange(clockOf(clamp(start, 0, DAY_MINUTES - STEP)), clockOf(clamp(start + span, STEP, DAY_MINUTES - 1)))
  }

  const grab = (which: 'start' | 'end') => (event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    edge.current = which
    document.body.style.cursor = 'ns-resize'
  }

  const block = (from: string, to: string) => {
    const start = minutesOf(from)
    const end = to ? minutesOf(to) : start
    const span = !to ? STEP : end > start ? end - start : DAY_MINUTES - start

    return {
      top: `${(start / 60) * HOUR_HEIGHT}rem`,
      height: `${Math.max((span / 60) * HOUR_HEIGHT, 1.25)}rem`,
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border [background-color:var(--ds-color-bg-surface)]">
      <div className="flex items-center justify-between gap-2 border-b px-2 py-1.5 [background-color:var(--ds-color-bg-subtle)]">
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Previous day"
            onClick={() => onDateChange(shiftDay(date, -1))}
            className="grid size-6 cursor-pointer place-items-center rounded [color:var(--ds-color-text-secondary)] hover:[background-color:var(--ds-color-bg-muted)]"
          >
            <ChevronLeft className="size-4" />
          </button>
          <CalendarDays className="size-3.5 [color:var(--ds-color-text-secondary)]" />
          <button
            type="button"
            aria-label="Next day"
            onClick={() => onDateChange(shiftDay(date, 1))}
            className="grid size-6 cursor-pointer place-items-center rounded [color:var(--ds-color-text-secondary)] hover:[background-color:var(--ds-color-bg-muted)]"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
        <DayJump date={date} onDateChange={onDateChange} />
      </div>

      <div ref={scroller} data-day-preview className="min-h-0 flex-1 overflow-y-auto">
        <div className="relative grid grid-cols-[3rem_1fr]">
          <div>
            {Array.from({ length: 24 }, (_, hour) => (
              <div
                key={hour}
                className="border-b border-r px-1.5 text-xs [color:var(--ds-color-text-tertiary)]"
                style={{ height: `${HOUR_HEIGHT}rem` }}
              >
                {hourLabel(hour)}
              </div>
            ))}
          </div>

          <div
            ref={grid}
            className={cn('relative', onTimeChange && 'cursor-pointer')}
            onClick={pickSlot}
            onMouseMove={(event) => {
              if (!onTimeChange) return
              const minutes = minutesAt(event.clientY, false)
              const start = startTime ? minutesOf(startTime) : null
              const end = endTime ? minutesOf(endTime) : null
              const inBlock = start !== null && end !== null && minutes >= start && minutes < end
              setHover(inBlock ? null : minutes)
            }}
            onMouseLeave={() => setHover(null)}
          >
            {Array.from({ length: 24 }, (_, hour) => (
              <div key={hour} className="border-b" style={{ height: `${HOUR_HEIGHT}rem` }}>
                <div className="h-1/2 border-b border-dashed [border-color:var(--ds-color-border-default)]" />
              </div>
            ))}

            {hover !== null && !edge.current && (
              <div
                className="pointer-events-none absolute left-0 right-0 flex -translate-y-1/2 items-center gap-1"
                style={{ top: `${(hover / 60) * HOUR_HEIGHT}rem` }}
              >
                <span className="rounded px-1 text-[0.625rem] font-semibold [background-color:var(--ds-color-bg-inverse)] [color:var(--ds-color-text-inverse)]">
                  {labelOf(hover)}
                </span>
                <span className="h-px flex-1 border-t border-dashed [border-color:var(--ds-color-border-strong)]" />
              </div>
            )}

            {onThisDay.map((entry) => {
              const clash = Boolean(startTime) && overlaps(startTime, endTime, entry.startTime, entry.endTime)

              return (
                <div
                  key={entry.id}
                  title={entry.title}
                  className={cn(
                    'absolute left-1 right-1 overflow-hidden rounded px-1.5 py-0.5 text-xs',
                    clash
                      ? 'border [border-color:var(--ds-color-warning)] [background-color:var(--ds-color-warning-subtle)] [color:var(--ds-color-warning-text)]'
                      : '[background-color:var(--ds-color-bg-muted)] [color:var(--ds-color-text-secondary)]',
                  )}
                  style={block(entry.startTime, entry.endTime)}
                >
                  <span className="block truncate">{entry.title}</span>
                </div>
              )
            })}

            {isToday(new Date(`${date}T00:00:00`)) && (
              <div
                className="pointer-events-none absolute left-0 right-0 z-10 flex -translate-y-1/2 items-center"
                style={{ top: `${((now.getHours() * 60 + now.getMinutes()) / 60) * HOUR_HEIGHT}rem` }}
              >
                <span className="size-1.5 rounded-full [background-color:var(--ds-color-danger)]" />
                <span className="h-px flex-1 [background-color:var(--ds-color-danger)]" />
              </div>
            )}

            {startTime && (
              <div
                className="absolute left-1 right-1 z-20 rounded px-1.5 py-0.5 text-xs font-semibold [background-color:var(--ds-color-brand)] [color:var(--ds-color-brand-fg)]"
                style={block(startTime, endTime)}
                onClick={(event) => event.stopPropagation()}
              >
                <span className="block truncate">
                  {labelOf(minutesOf(startTime))}
                  {endTime ? ` – ${labelOf(minutesOf(endTime))}` : ''}
                </span>
                <span className="block truncate">{title || 'New event'}</span>

                {onTimeChange && (
                  <>
                    <span
                      role="slider"
                      aria-label="Change start time"
                      aria-valuetext={labelOf(minutesOf(startTime))}
                      tabIndex={-1}
                      onMouseDown={grab('start')}
                      className="absolute inset-x-0 top-0 h-2 cursor-ns-resize rounded-t hover:bg-white/40"
                    />
                    <span
                      role="slider"
                      aria-label="Change end time"
                      aria-valuetext={labelOf(minutesOf(endTime || startTime))}
                      tabIndex={-1}
                      onMouseDown={grab('end')}
                      className="absolute inset-x-0 bottom-0 h-2 cursor-ns-resize rounded-b hover:bg-white/40"
                    />
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DayPreview
