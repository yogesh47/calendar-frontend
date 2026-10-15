import { CALENDAR_ITEM_STYLE, CANCELLED_STYLE } from '../../constants'

/** The key under the grid, built from the same map the tiles read. */
const Legend = () => {
  const entries = [...Object.values(CALENDAR_ITEM_STYLE), CANCELLED_STYLE]

  return (
    <ul className="flex flex-wrap items-center gap-x-[1rem] gap-y-[0.5rem]">
      {entries.map((entry) => (
        <li key={entry.label} className="flex items-center gap-[0.375rem]">
          <span
            aria-hidden="true"
            className="size-[0.625rem] rounded-[0.125rem]"
            style={{ backgroundColor: entry.accent }}
          />
          <span className="text-[0.75rem] text-muted-foreground">{entry.label}</span>
        </li>
      ))}
    </ul>
  )
}

export default Legend
