import { startOfWeek } from 'date-fns'

import Legend from './components/Legend'
import MiniCalendar from '../MiniCalendar'
import type { CalendarView } from '../../types'

interface CalendarSidebarProps {
  month: Date
  selectedDay: Date
  view: CalendarView
  dayCount: number
  /** Kinds hidden by the legend ('event', 'deadline', 'reminder', 'cancelled'). Empty shows all. */
  kinds: string[]
  onMonthChange: (month: Date) => void
  onPickDay: (day: Date) => void
  onKindsChange: (kinds: string[]) => void
}

/**
 * The column beside the grid: a month to jump by, and the legend that doubles
 * as the kind filter. Both only ever read and hand back — the calendar keeps
 * the state.
 */
const CalendarSidebar = ({
  month,
  selectedDay,
  view,
  dayCount,
  kinds,
  onMonthChange,
  onPickDay,
  onKindsChange,
}: CalendarSidebarProps) => (
  <aside className="order-2 flex w-full shrink-0 flex-col gap-3 lg:order-none lg:w-[16rem]">
    <MiniCalendar
      className="hidden lg:block"
      month={month}
      selected={selectedDay}
      rangeStart={view === 'week' ? startOfWeek(month, { weekStartsOn: 1 }) : selectedDay}
      rangeDays={view === 'week' ? 7 : view === 'day' ? dayCount : 1}
      onMonthChange={onMonthChange}
      onPick={onPickDay}
    />
    <Legend
      selected={kinds}
      onToggle={(kind) =>
        onKindsChange(kinds.includes(kind) ? kinds.filter((entry) => entry !== kind) : [...kinds, kind])
      }
    />
  </aside>
)

export default CalendarSidebar
