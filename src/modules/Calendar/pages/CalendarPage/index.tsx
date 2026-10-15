import { useEffect, useState } from 'react'
import { addMonths, format, subMonths } from 'date-fns'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import ListView from '../../components/ListView'
import MonthGrid from '../../components/MonthGrid'
import Legend from '../../components/Legend'
import { fetchCalendarItems } from '../../services'
import type { CalendarItem, CalendarView } from '../../types'

const VIEWS: { id: CalendarView; label: string }[] = [
  { id: 'month', label: 'Month' },
  { id: 'week', label: 'Week' },
  { id: 'list', label: 'List' },
]

/**
 * T-02 / S-04 — the calendar page both portals get.
 *
 * One page, not two: the spec's TPO and student screens differ in what they are
 * allowed to see and do, not in how the grid is drawn, so the difference will
 * arrive as props and a capability check rather than a second copy of this.
 */
const CalendarPage = ({ title = 'Campus Calendar' }: { title?: string }) => {
  const [month, setMonth] = useState(new Date())
  const [view, setView] = useState<CalendarView>('month')
  const [items, setItems] = useState<CalendarItem[]>([])
  const [selected, setSelected] = useState<CalendarItem | null>(null)

  useEffect(() => {
    fetchCalendarItems().then(setItems)
  }, [])

  return (
    <div className="flex w-full flex-col gap-[1rem] p-[1.5rem]">
      <header className="flex flex-wrap items-center justify-between gap-[0.75rem]">
        <div className="flex items-center gap-[0.5rem]">
          <CalendarDays className="size-[1.25rem] text-brand" />
          <h1 className="text-[1.25rem] font-semibold">{title}</h1>
        </div>

        <div className="flex items-center gap-[0.5rem]">
          <Button variant="outline" size="icon" aria-label="Previous month"
            onClick={() => setMonth(subMonths(month, 1))}>
            <ChevronLeft className="size-[1rem]" />
          </Button>
          <span className="min-w-[9rem] text-center text-sm font-semibold">
            {format(month, 'MMMM yyyy')}
          </span>
          <Button variant="outline" size="icon" aria-label="Next month"
            onClick={() => setMonth(addMonths(month, 1))}>
            <ChevronRight className="size-[1rem]" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setMonth(new Date())}>
            Today
          </Button>
        </div>
      </header>

      <div className="flex items-center gap-[0.25rem] self-start rounded-[0.5rem] border bg-card p-[0.25rem]">
        {VIEWS.map((entry) => (
          <button
            key={entry.id}
            type="button"
            onClick={() => setView(entry.id)}
            className={cn(
              'rounded-[0.375rem] px-[0.75rem] py-[0.25rem] text-[0.8125rem] font-medium transition-colors',
              view === entry.id ? 'bg-brand text-brand-foreground' : 'text-muted-foreground hover:bg-muted',
            )}
          >
            {entry.label}
          </button>
        ))}
      </div>

      {view === 'month' && <MonthGrid month={month} items={items} onOpen={setSelected} />}
      {view === 'list' && <ListView month={month} items={items} onOpen={setSelected} />}
      {view === 'week' && (
        <div className="rounded-[0.75rem] border bg-card p-[2rem] text-center text-sm text-muted-foreground">
          Week view abhi banana baaki hai (T-02a).
        </div>
      )}

      <Legend />

      {selected && (
        <div className="rounded-[0.75rem] border bg-card p-[1rem]">
          <p className="text-[0.75rem] font-semibold uppercase text-muted-foreground">Selected</p>
          <p className="text-sm font-semibold">{selected.title}</p>
          <p className="text-[0.75rem] text-muted-foreground">
            {format(new Date(selected.startsAt), 'EEE, d MMM yyyy HH:mm')}
            {selected.venue ? ` · ${selected.venue}` : ''}
          </p>
        </div>
      )}
    </div>
  )
}

export default CalendarPage
