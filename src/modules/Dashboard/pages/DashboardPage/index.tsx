import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { fetchEvents, fetchUnreadCount, openCalendarStream } from '@/modules/Calendar/services/api'
import { onWindowFocus } from '@/modules/Calendar/services/store'
import ComingUp from '../../components/ComingUp'
import UpdatesFeed from '../../components/UpdatesFeed'
import { DASHBOARD_COPY } from '../../constants'
import type { TpoEvent } from '@/modules/Calendar/types/tpo'

interface DashboardPageProps {
  role: 'tpo' | 'student'
  userName: string
}

const DashboardPage = ({ role, userName }: DashboardPageProps) => {
  const navigate = useNavigate()
  const [events, setEvents] = useState<TpoEvent[]>([])
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    const refresh = async () => {
      setEvents(await fetchEvents().catch(() => []))
      setUnread(await fetchUnreadCount().catch(() => 0))
    }

    refresh()
    const closeStream = openCalendarStream(refresh)
    const stopFocus = onWindowFocus(refresh)

    return () => {
      closeStream()
      stopFocus()
    }
  }, [])

  const today = format(new Date(), 'yyyy-MM-dd')
  const month = today.slice(0, 7)
  const live = events.filter((event) => event.draft.eventType !== 'nudge' && event.appliesToMe)
  const upcoming = live.filter((event) => !event.cancelledAt && event.draft.eventDate >= today)
  const isReminder = (event: TpoEvent) => event.draft.eventType === 'my_reminder'
  const isDeadline = (event: TpoEvent) => event.draft.eventType === 'deadline'

  const cards = [
    {
      label: DASHBOARD_COPY.thisMonth,
      value: live.filter((event) => !isReminder(event) && event.draft.eventDate.startsWith(month)).length,
      to: 'calendar',
    },
    {
      label: DASHBOARD_COPY.upcoming,
      value: upcoming.filter((event) => !isReminder(event) && !isDeadline(event)).length,
      to: 'calendar',
    },
    {
      label: DASHBOARD_COPY.deadlines,
      value: upcoming.filter(isDeadline).length,
      to: 'jobs',
    },
    {
      label: role === 'tpo' ? DASHBOARD_COPY.myReminders : DASHBOARD_COPY.studentReminders,
      value: upcoming.filter(isReminder).length,
      to: 'calendar',
    },
  ]

  return (
    <div className="flex w-full flex-col gap-4 p-3 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold">Hello, {userName}</h1>
          <p className="text-sm [color:var(--ds-color-text-secondary)]">{DASHBOARD_COPY.subtitle}</p>
        </div>

        {unread > 0 && (
          <p className="text-sm font-medium [color:var(--ds-color-brand)]">
            {unread === 1 ? DASHBOARD_COPY.oneUpdate : DASHBOARD_COPY.manyUpdates(unread)}
          </p>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <button
            key={card.label}
            type="button"
            onClick={() => navigate(`/${role}/${card.to}`)}
            className="cursor-pointer rounded-xl border p-4 text-left transition-colors hover:[background-color:var(--ds-color-bg-muted)] [background-color:var(--ds-color-bg-surface)]"
          >
            <p className="text-sm [color:var(--ds-color-text-secondary)]">{card.label}</p>
            <p className="text-2xl font-bold">{card.value}</p>
          </button>
        ))}
      </div>

      <ComingUp role={role} />

      {role === 'student' && <UpdatesFeed role={role} />}
    </div>
  )
}

export default DashboardPage
