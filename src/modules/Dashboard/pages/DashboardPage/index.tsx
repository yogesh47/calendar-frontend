import { useEffect, useState } from 'react'
import { CAMPUS_JOBS, EXTERNAL_JOBS } from '@/modules/Calendar/services/jobs'
import { fetchEvents } from '@/modules/Calendar/services/api'
import type { TpoEvent } from '@/modules/Calendar/types/tpo'

interface DashboardPageProps {
  role: 'tpo' | 'student'
  userName: string
}

const DashboardPage = ({ role, userName }: DashboardPageProps) => {
  const [events, setEvents] = useState<TpoEvent[]>([])

  useEffect(() => {
    fetchEvents().then(setEvents).catch(() => setEvents([]))
  }, [])

  const upcoming = events.filter((event) => !event.cancelledAt && event.draft.eventDate >= new Date().toISOString().slice(0, 10))

  const cards = [
    { label: role === 'tpo' ? 'Events you can see' : 'Your calendar items', value: events.length },
    { label: 'Upcoming', value: upcoming.length },
    { label: 'Campus jobs', value: CAMPUS_JOBS.length },
    { label: 'External jobs', value: EXTERNAL_JOBS.length },
  ]

  return (
    <div className="flex w-full flex-col gap-4 p-6">
      <div>
        <h1 className="text-xl font-semibold">Hello, {userName}</h1>
        <p className="text-sm [color:var(--ds-color-text-secondary)]">Yahan se poora placement ka haal dikhta hai</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-xl border p-4 [background-color:var(--ds-color-bg-surface)]">
            <p className="text-sm [color:var(--ds-color-text-secondary)]">{card.label}</p>
            <p className="text-2xl font-bold">{card.value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default DashboardPage
