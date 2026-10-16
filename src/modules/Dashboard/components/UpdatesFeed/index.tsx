import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { format, isToday, isYesterday } from 'date-fns'
import { Button } from '@/components/ui/Button'
import { messageOf, showError } from '@/lib/toast'
import { fetchNotifications, openCalendarStream } from '@/modules/Calendar/services/api'
import { onWindowFocus, requestOpenEvent } from '@/modules/Calendar/services/store'
import { FEED_CARDS, FEED_COPY } from '../../constants'
import type { ApiNotification } from '@/modules/Calendar/services/api'
import type { Role } from '@/modules/Auth/types'

const stamp = (value: string): string => {
  const moment = new Date(value)
  if (isToday(moment)) return format(moment, 'h:mm a')
  if (isYesterday(moment)) return `Yesterday, ${format(moment, 'h:mm a')}`

  return format(moment, 'd MMM, h:mm a')
}

const UpdatesFeed = ({ role }: { role: Role }) => {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState<ApiNotification[]>([])

  const refresh = async () => {
    try {
      setNotifications(await fetchNotifications())
    } catch (error) {
      showError(messageOf(error))
    }
  }

  useEffect(() => {
    refresh()
    return openCalendarStream(refresh)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => onWindowFocus(refresh), [])

  const cards = notifications
    .filter((entry) => FEED_CARDS[entry.kind])
    .sort((one, two) => two.created_at.localeCompare(one.created_at))

  const open = (entry: ApiNotification) => {
    const card = FEED_CARDS[entry.kind]
    if (card.cta === FEED_COPY.viewAndApply) {
      navigate(`/${role}/jobs`)
      return
    }

    navigate(`/${role}/calendar`)
    window.setTimeout(() => requestOpenEvent(entry.event_id), 300)
  }

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-base font-semibold">{FEED_COPY.title}</h2>

      {!cards.length ? (
        <p className="rounded-xl border p-4 text-sm [background-color:var(--ds-color-bg-surface)] [color:var(--ds-color-text-secondary)]">
          {FEED_COPY.empty}
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {cards.map((entry) => {
            const card = FEED_CARDS[entry.kind]

            return (
              <li
                key={entry.notification_id}
                className="flex items-start justify-between gap-4 rounded-xl border p-4 [background-color:var(--ds-color-bg-surface)]"
              >
                <div className="min-w-0 space-y-1">
                  <span
                    className="inline-flex rounded-full px-[0.625rem] py-[0.125rem] text-[0.6875rem] font-semibold"
                    style={{ backgroundColor: card.surface, color: card.accent }}
                  >
                    {card.label}
                  </span>
                  <p className="text-sm font-medium [word-break:break-word]">{entry.message}</p>
                  <p className="text-xs [color:var(--ds-color-text-secondary)]">{stamp(entry.created_at)}</p>
                </div>

                {card.cta && (
                  <Button variant="outline" size="sm" onClick={() => open(entry)}>
                    {card.cta}
                  </Button>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

export default UpdatesFeed
