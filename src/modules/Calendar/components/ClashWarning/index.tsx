import { useState } from 'react'
import { TriangleAlert } from 'lucide-react'

import { clock } from '../parts'

/** How many clashing items show before "+N more". */
const SHOWN = 3

interface ClashWarningProps {
  /** What else is on at that time. */
  clashes: { id: string; title: string; startTime: string; endTime: string }[]
}

/*
  "N events clash with this time", then one line per clash — its name on the
  left, its time on the right, earliest first — so the list reads at a glance
  instead of one long sentence. A busy day shows the first few and "+N more".
*/
const ClashWarning = ({ clashes }: ClashWarningProps) => {
  const [showAll, setShowAll] = useState(false)
  if (!clashes.length) return null

  const sorted = [...clashes].sort((a, b) => a.startTime.localeCompare(b.startTime))
  const shown = showAll ? sorted : sorted.slice(0, SHOWN)
  const hidden = sorted.length - SHOWN

  return (
    <div
      role="alert"
      className="min-w-0 rounded-lg border px-3 py-2 text-sm [background-color:var(--ds-color-warning-subtle)] [border-color:var(--ds-color-warning)] [color:var(--ds-color-warning-text)]"
    >
      <p className="flex items-center gap-2 font-semibold">
        <TriangleAlert className="size-3.5 shrink-0" />
        {clashes.length === 1 ? '1 event clashes with this time' : `${clashes.length} events clash with this time`}
      </p>

      <ul className="mt-1.5 space-y-1 pl-5">
        {shown.map((entry) => (
          <li key={entry.id} className="flex min-w-0 items-baseline gap-2">
            <span aria-hidden className="size-1 shrink-0 translate-y-[-0.15rem] rounded-full [background-color:currentColor]" />
            <span className="min-w-0 flex-1 truncate" title={entry.title}>
              {entry.title}
            </span>
            <span className="shrink-0 tabular-nums opacity-80">
              {clock(entry.startTime)}
              {entry.endTime ? ` – ${clock(entry.endTime)}` : ''}
            </span>
          </li>
        ))}
      </ul>

      {hidden > 0 && (
        <button
          type="button"
          className="mt-1.5 cursor-pointer pl-5 text-xs font-semibold underline-offset-2 hover:underline"
          onClick={() => setShowAll((value) => !value)}
        >
          {showAll ? 'Show less' : `+${hidden} more`}
        </button>
      )}
    </div>
  )
}

export default ClashWarning
