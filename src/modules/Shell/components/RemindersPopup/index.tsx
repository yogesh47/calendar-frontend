import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { differenceInDays, differenceInHours, differenceInMinutes, format } from 'date-fns'
import { CalendarDays, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { fetchEvents, fetchNotifications, openCalendarStream } from '@/modules/Calendar/services/api'
import { onWindowFocus, requestOpenEvent } from '@/modules/Calendar/services/store'
import { NUDGE_KINDS, REMINDERS_COPY, REMINDERS_TICK_MS } from '../../constants'
import type { Role } from '@/modules/Auth/types'

const agoLabel = (sentAt: string, now: Date): string => {
  const sent = new Date(sentAt)
  const minutes = differenceInMinutes(now, sent)
  if (minutes < 1) return REMINDERS_COPY.now
  if (minutes < 60) return `${minutes} min ago`

  const hours = differenceInHours(now, sent)
  if (hours < 24) return `${hours} hr ago`

  const days = differenceInDays(now, sent)

  return days === 1 ? 'Yesterday' : `${days} days ago`
}

type ReminderRow = {
  id: string
  eventId: string
  title: string
  line: string
  sentAt: string
}

const RemindersPopup = ({ role }: { role: Role }) => {
  const navigate = useNavigate()
  const seen = useRef<Set<string>>(new Set())
  const ready = useRef(false)
  const [rows, setRows] = useState<ReminderRow[]>([])
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), REMINDERS_TICK_MS)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    const check = async () => {
      const notifications = await fetchNotifications().catch(() => [])
      const nudges = notifications.filter((entry) => NUDGE_KINDS.includes(entry.kind))

      if (!ready.current) {
        nudges.forEach((entry) => seen.current.add(entry.notification_id))
        ready.current = true
        return
      }

      const fresh = nudges.filter((entry) => !seen.current.has(entry.notification_id))
      if (!fresh.length) return

      const events = await fetchEvents().catch(() => [])

      setRows((current) => [
        ...fresh.map((entry) => {
          seen.current.add(entry.notification_id)
          const event = events.find((item) => item.id === entry.event_id)
          const clock = event?.draft.startTime
            ? format(new Date(`2000-01-01T${event.draft.startTime}:00`), 'h:mm a')
            : ''
          const where = event ? event.draft.venue || event.draft.onlinePlatform || event.draft.company : ''

          return {
            id: entry.notification_id,
            eventId: entry.event_id,
            title: event?.draft.title ?? entry.message,
            line: [clock, where].filter(Boolean).join('  ') || entry.message,
            sentAt: entry.created_at,
          }
        }),
        ...current,
      ])
    }

    check()
    const closeStream = openCalendarStream(check)
    const stopFocus = onWindowFocus(check)

    return () => {
      closeStream()
      stopFocus()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!rows.length) return null

  const open = (row: ReminderRow) => {
    setRows((current) => current.filter((entry) => entry.id !== row.id))
    navigate(`/${role}/calendar`)
    window.setTimeout(() => requestOpenEvent(row.eventId), 300)
  }

  return (
    <div
      role="region"
      aria-label={REMINDERS_COPY.title}
      className="fixed inset-x-[0.5rem] top-[3.75rem] z-[130] overflow-hidden rounded-[0.75rem] bg-white shadow-[0_18px_48px_rgba(15,23,42,0.18)] sm:inset-x-auto sm:right-[1.25rem] sm:top-[4rem] sm:w-[23rem] sm:max-w-[calc(100vw-2.5rem)]"
    >
      <div className="flex items-center justify-between gap-2 px-[1rem] py-[0.75rem]">
        <p className="text-[0.9375rem] font-semibold">{REMINDERS_COPY.title}</p>

        <span className="flex items-center gap-1">
          <Button
            variant="link"
            className="h-auto p-0 text-[0.8125rem] font-medium [color:var(--ds-color-brand)]"
            onClick={() => setRows([])}
          >
            {REMINDERS_COPY.dismissAll}
          </Button>
          <button
            type="button"
            aria-label={REMINDERS_COPY.close}
            onClick={() => setRows([])}
            className="grid size-[1.5rem] cursor-pointer place-items-center rounded-full transition-colors hover:[background-color:var(--ds-color-bg-muted)]"
          >
            <X className="size-3.5 [color:var(--ds-color-text-secondary)]" />
          </button>
        </span>
      </div>

      <ul className="max-h-[16rem] overflow-y-auto border-t sm:max-h-[22rem]">
        {rows.map((row) => (
          <li key={row.id}>
            <button
              type="button"
              onClick={() => open(row)}
              className="flex w-full cursor-pointer items-start gap-[0.75rem] px-[1rem] py-[0.75rem] text-left transition-colors hover:[background-color:var(--ds-color-bg-muted)]"
            >
              <span
                className="mt-0.5 grid size-[2rem] shrink-0 place-items-center rounded-[0.5rem]"
                style={{ backgroundColor: 'var(--ds-color-calendar-nudge-subtle)' }}
              >
                <CalendarDays className="size-4" style={{ color: 'var(--ds-color-calendar-nudge)' }} />
              </span>

              <span className="min-w-0 flex-1">
                <span className="block truncate text-[0.875rem] font-semibold">{row.title}</span>
                <span className="block truncate text-[0.8125rem] [color:var(--ds-color-text-secondary)]">
                  {row.line}
                </span>
              </span>

              <span className="shrink-0 pt-0.5 text-[0.75rem] [color:var(--ds-color-text-secondary)]">
                {agoLabel(row.sentAt, now)}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default RemindersPopup
