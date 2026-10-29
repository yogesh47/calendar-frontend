import { CalendarDays, Plus, RefreshCw, TriangleAlert } from '../../icons'
import { Button } from '../../shared/ui/Button'
import { useLabels } from '../../labels'

const Shell = ({ children }: { children: React.ReactNode }) => (
  <div className="grid min-h-[22rem] flex-1 place-items-center rounded-xl border [background-color:var(--ds-color-bg-surface)]">
    <div className="flex max-w-[26rem] flex-col items-center gap-3 px-6 py-10 text-center">{children}</div>
  </div>
)

export const CalendarSkeleton = () => (
  <div className="flex min-h-[22rem] flex-1 flex-col gap-2 rounded-xl border p-3 [background-color:var(--ds-color-bg-surface)]">
    <div className="h-8 w-full animate-pulse rounded-md [background-color:var(--ds-color-bg-muted)]" />
    <div className="grid flex-1 grid-cols-7 gap-2">
      {Array.from({ length: 28 }, (_, cell) => (
        <div key={cell} className="h-16 animate-pulse rounded-md [background-color:var(--ds-color-bg-muted)]" />
      ))}
    </div>
  </div>
)

export const CalendarError = ({ message, onRetry }: { message: string; onRetry: () => void }) => {
  const labels = useLabels()

  return (
  <Shell>
    <TriangleAlert className="size-6 [color:var(--ds-color-danger)]" />
    <p className="text-sm font-semibold">{message}</p>
    <Button variant="outline" size="sm" onClick={onRetry}>
      <RefreshCw className="size-4" />
      {labels.state.retry}
    </Button>
  </Shell>
  )
}

export const CalendarNotice = ({
  message,
  actionLabel,
  onAction,
}: {
  message: string
  actionLabel?: string
  onAction?: () => void
}) => (
  <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 [background-color:var(--ds-color-bg-surface)]">
    <p className="flex items-center gap-2 text-sm [color:var(--ds-color-text-secondary)]">
      <CalendarDays className="size-4 shrink-0 [color:var(--ds-color-text-tertiary)]" />
      {message}
    </p>

    {actionLabel && onAction && (
      <Button variant="outline" size="sm" onClick={onAction}>
        {actionLabel === 'Clear filters' ? null : <Plus className="size-3.5" />}
        {actionLabel}
      </Button>
    )}
  </div>
)

