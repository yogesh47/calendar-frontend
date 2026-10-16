import { format, isSameMonth } from 'date-fns'
import ItemTile from '../ItemTile'
import StatusBadge from '../StatusBadge'
import type { CalendarItem } from '../../types'

/**
 * The same items as a flat agenda, grouped by day.
 *
 * Only days that have something are listed — an empty row tells the reader
 * nothing and makes a quiet month unreadable.
 */
const ListView = ({ month, items, onOpen }: {
  month: Date
  items: CalendarItem[]
  onOpen?: (item: CalendarItem) => void
}) => {
  const byDay = new Map<string, CalendarItem[]>()
  for (const item of items) {
    const day = new Date(item.startsAt)
    if (!isSameMonth(day, month)) continue
    const key = format(day, 'yyyy-MM-dd')
    byDay.set(key, [...(byDay.get(key) ?? []), item])
  }

  const days = [...byDay.entries()].sort(([a], [b]) => a.localeCompare(b))

  if (!days.length) {
    return (
      <div className="rounded-[0.75rem] border bg-card p-[2rem] text-center text-sm text-muted-foreground">
        Nothing scheduled this month.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-[1rem]">
      {days.map(([key, dayItems]) => (
        <div key={key} className="rounded-[0.75rem] border bg-card p-[0.75rem]">
          <div className="mb-[0.5rem] flex items-baseline gap-[0.5rem]">
            <span className="text-sm font-semibold">{format(new Date(key), 'EEE, MMM d, yyyy')}</span>
            <span className="text-[0.75rem] text-muted-foreground">{dayItems.length} item(s)</span>
          </div>

          <div className="flex flex-col gap-[0.375rem]">
            {dayItems.map((item) => (
              <div key={item.id} className="flex items-center gap-[0.5rem]">
                <span className="w-[3.5rem] shrink-0 text-[0.75rem] tabular-nums text-muted-foreground">
                  {item.isAllDay ? 'All day' : format(new Date(item.startsAt), 'HH:mm')}
                </span>
                <ItemTile item={item} onOpen={onOpen} className="flex-1" />
                <StatusBadge item={item} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export default ListView
