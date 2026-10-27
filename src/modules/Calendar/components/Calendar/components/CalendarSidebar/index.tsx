import { startOfWeek } from 'date-fns'
import MiniCalendar from '../../../MiniCalendar'
import Legend from '../../../Legend'
import type { CalendarView } from '../../../../types'
import type { CalendarFilters } from '../../../../types/tpo'

interface CalendarSidebarProps {
  month: Date
  selectedDay: Date
  view: CalendarView
  dayCount: number
  filters: CalendarFilters
  onMonthChange: (month: Date) => void
  onPickDay: (day: Date) => void
  onFiltersChange: (filters: CalendarFilters) => void
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
  filters,
  onMonthChange,
  onPickDay,
  onFiltersChange,
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
      selected={filters.kinds}
      onToggle={(kind) =>
        onFiltersChange({
          ...filters,
          kinds: filters.kinds.includes(kind)
            ? filters.kinds.filter((entry) => entry !== kind)
            : [...filters.kinds, kind],
        })
      }
    />
  </aside>
)

export default CalendarSidebar
