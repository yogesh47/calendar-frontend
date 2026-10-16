import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { format, isToday, isTomorrow } from 'date-fns'
import { Button } from '@/components/ui/Button'
import { styleOf } from '@/modules/Calendar/helpers'
import { itemFromEvent } from '@/modules/Calendar/helpers/tpo'
import { fetchComingUp, openCalendarStream } from '@/modules/Calendar/services/api'
import { onWindowFocus, requestOpenEvent } from '@/modules/Calendar/services/store'
import { COMING_UP_COPY } from '../../constants'
import type { Role } from '@/modules/Auth/types'
import type { TpoEvent } from '@/modules/Calendar/types/tpo'

const dayLabel = (day: string): string => {
  const moment = new Date(`${day}T00:00:00`)
  if (isToday(moment)) return 'Today'
  if (isTomorrow(moment)) return 'Tomorrow'

  return format(moment, 'EEE, MMM d')
}

const ComingUp = ({ role }: { role: Role }) => {
  const navigate = useNavigate()
  const [items, setItems] = useState<TpoEvent[]>([])

  const refresh = async () => setItems(await fetchComingUp(3).catch(() => []))

  useEffect(() => {
    refresh()
    return openCalendarStream(refresh)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => onWindowFocus(refresh), [])

  const open = (event: TpoEvent) => {
    navigate(`/${role}/calendar`)
    window.setTimeout(() => requestOpenEvent(event.id), 300)
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold">{COMING_UP_COPY.title}</h2>
        {items.length > 0 && (
          <Button
            variant="link"
            className="h-auto p-0 text-sm font-semibold"
            onClick={() => navigate(`/${role}/calendar`)}
          >
            {COMING_UP_COPY.viewAll}
          </Button>
        )}
      </div>

      {!items.length ? (
        <p className="rounded-xl border p-4 text-sm [background-color:var(--ds-color-bg-surface)] [color:var(--ds-color-text-secondary)]">
          {COMING_UP_COPY.empty}
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((event) => {
            const style = styleOf(itemFromEvent(event))
            const clock = event.draft.startTime
              ? format(new Date(`2000-01-01T${event.draft.startTime}:00`), 'h:mm a')
              : 'All day'
            const where = event.draft.venue || event.draft.onlinePlatform || event.draft.company

            return (
              <li key={event.id}>
                <button
                  type="button"
                  onClick={() => open(event)}
                  className="flex w-full cursor-pointer items-start gap-3 rounded-xl border p-4 text-left transition-colors hover:[background-color:var(--ds-color-bg-muted)] [background-color:var(--ds-color-bg-surface)]"
                >
                  <span
                    aria-hidden="true"
                    className="mt-0.5 h-[2.5rem] w-[0.25rem] shrink-0 rounded-full"
                    style={{ backgroundColor: style.accent }}
                  />

                  <span className="min-w-0 flex-1">
                    <span className="block text-[0.6875rem] font-bold uppercase" style={{ color: style.accent }}>
                      {style.label}
                    </span>
                    <span className="block truncate text-sm font-semibold">{event.draft.title}</span>
                    <span className="block truncate text-[0.8125rem] [color:var(--ds-color-text-secondary)]">
                      {[dayLabel(event.draft.eventDate), clock, where].filter(Boolean).join(' · ')}
                    </span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

export default ComingUp
