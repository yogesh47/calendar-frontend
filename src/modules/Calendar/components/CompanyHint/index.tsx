import { format } from 'date-fns'
import { useState } from 'react'
import { Building2 } from 'lucide-react'

/** How many events show before "+N more". */
const SHOWN = 3

interface CompanyHintProps {
  company: string
  /** That company's events still ahead, with the type already in words. */
  events: { id: string; typeLabel: string; eventDate: string; repeats: boolean; createdByName: string }[]
}

/*
  BRD FR-CAL-05: once a company is picked, the events already planned for it
  by any TPO — "Existing Deloitte events: Online Assessment — 2 Oct (Ravi Sharma)" —
  so the same visit is not planned twice. Only for information; it never stops a save.
*/
const CompanyHint = ({ company, events }: CompanyHintProps) => {
  const [showAll, setShowAll] = useState(false)
  if (!company || !events.length) return null

  const sorted = [...events].sort((a, b) => a.eventDate.localeCompare(b.eventDate))
  const shown = showAll ? sorted : sorted.slice(0, SHOWN)
  const hidden = sorted.length - SHOWN

  return (
    <div
      role="status"
      className="min-w-0 rounded-lg border px-3 py-2 text-sm [background-color:var(--ds-color-info-subtle)] [border-color:var(--ds-color-info)]/20 [color:var(--ds-color-text-secondary)]"
    >
      <p className="flex items-center gap-2 font-semibold [color:var(--ds-color-text-primary)]">
        <Building2 className="size-3.5 shrink-0 [color:var(--ds-color-info)]" />
        Existing {company} events
      </p>

      <ul className="mt-1.5 space-y-1 pl-5">
        {shown.map((event) => (
          <li key={event.id} className="flex min-w-0 items-baseline gap-2">
            <span aria-hidden className="size-1 shrink-0 translate-y-[-0.15rem] rounded-full [background-color:currentColor]" />
            <span className="min-w-0 flex-1 truncate">
              {event.typeLabel} — {format(new Date(`${event.eventDate}T00:00:00`), 'd MMM')}
              {event.repeats && ', repeats'}
            </span>
            <span className="shrink-0 truncate opacity-80">({event.createdByName})</span>
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

export default CompanyHint
