import { cn } from '../../../../lib/utils'
import { CALENDAR_ITEM_STYLE, CANCELLED_STYLE } from '../../../../constants'
import type { CalendarItemKind } from '../../../../types'

export interface LegendProps {
  selected: string[]
  onToggle: (kind: string) => void
}

const SHOWN_KINDS: CalendarItemKind[] = ['event', 'deadline', 'reminder']

const ENTRIES = [
  ...SHOWN_KINDS.map((kind) => ({ key: kind as string, ...CALENDAR_ITEM_STYLE[kind] })),
  { key: 'cancelled', ...CANCELLED_STYLE },
]

const Legend = ({ selected, onToggle }: LegendProps) => (
  <ul className="flex flex-wrap items-center gap-x-[1rem] gap-y-[0.5rem]">
    {ENTRIES.map((entry) => {
      const isOn = selected.length === 0 || selected.includes(entry.key)

      return (
        <li key={entry.key}>
          <button
            type="button"
            aria-pressed={selected.includes(entry.key)}
            onClick={() => onToggle(entry.key)}
            className={cn('flex min-h-[1.75rem] cursor-pointer items-center gap-[0.375rem] sm:min-h-0', !isOn && 'opacity-40')}
          >
            <span
              aria-hidden="true"
              className="size-[0.625rem] rounded-[0.125rem]"
              style={{ backgroundColor: entry.accent }}
            />
            <span className="text-[0.75rem] text-muted-foreground">{entry.label}</span>
          </button>
        </li>
      )
    })}
  </ul>
)

export default Legend
