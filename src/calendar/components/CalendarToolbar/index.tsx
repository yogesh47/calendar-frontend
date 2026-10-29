import { Check, ChevronDown, ChevronLeft, ChevronRight, Plus, RefreshCw, Trash2 } from '../../icons'
import { format } from 'date-fns'
import { cn } from '../../lib/utils'
import { Button } from '../../shared/ui/Button'
import { Popover, PopoverContent, PopoverTrigger } from '../../shared/ui/Popover'
import DayJump from '../DayJump'
import type { CalendarView } from '../../types'
import type { ReactNode } from 'react'
import { useLabels } from '../../labels'

export interface CalendarToolbarProps {
  /** Creates events (otherwise only reminders). */
  canCreateEvents: boolean
  isMobile: boolean
  stepName: string
  view: CalendarView
  views: CalendarView[]
  viewLabels: { id: CalendarView; label: string }[]
  selectedDay: Date
  dayCount: number
  rangeLabel: string
  showCreate: boolean
  showDeleteAll: boolean
  createLabel?: string
  onCreate: () => void
  onBack: () => void
  onForward: () => void
  onViewChange: (view: CalendarView) => void
  onDayCountChange: (count: number) => void
  onMonthChange: (month: Date) => void
  onPickDay: (day: Date) => void
  onWipe: () => void
  /** "Sync" — subscribe from Google Calendar or Outlook. */
  onSync?: () => void
  /** The app's own controls — its filter, say — shown beside the view switch. */
  toolbarExtras?: ReactNode
}

/**
 * The strip above the grid: what to create, where in time to stand, and which
 * shape to read it in. Every piece can be switched off, because not every route
 * that mounts the calendar wants all of them.
 */
const CalendarToolbar = (props: CalendarToolbarProps) => {
  const {
    canCreateEvents,
    view,
    views,
    viewLabels,
    selectedDay,
    dayCount,
    rangeLabel,
    showCreate,
    showDeleteAll,
    createLabel,
    onCreate,
    onBack,
    onForward,
    onViewChange,
    onDayCountChange,
    onMonthChange,
    onPickDay,
    onWipe,
    onSync,
    toolbarExtras,
  } = props
  const labels = useLabels()

  return (
  <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border px-2 py-2 [background-color:var(--ds-color-bg-surface)] sm:gap-3 sm:px-3">
    <div className="flex min-w-0 shrink items-center gap-0.5 sm:gap-2">
      {showCreate && (
      <Button
        size="sm"
        className="hidden sm:inline-flex"
        onClick={() =>
          onCreate()
        }
      >
        <Plus className="size-3.5" />
        {createLabel ?? (canCreateEvents ? labels.newEvent : labels.addReminder)}
      </Button>
      )}
      <span className="flex items-center">
        <Button
          variant="ghost"
          size="sm"
          iconOnly
          aria-label={`Previous ${props.stepName}`}
          onClick={() => onBack()}
        >
          <ChevronLeft className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          iconOnly
          aria-label={`Next ${props.stepName}`}
          onClick={() => onForward()}
        >
          <ChevronRight className="size-4" />
        </Button>
      </span>
      <DayJump
        date={format(selectedDay, 'yyyy-MM-dd')}
        label={rangeLabel}
        className="min-w-0 whitespace-nowrap text-sm sm:text-base"
        onDateChange={(value) => {
          const picked = new Date(`${value}T00:00:00`)
          onPickDay(picked)
          onMonthChange(picked)
        }}
      />
    </div>

    <div className="contents sm:flex sm:flex-wrap sm:items-center sm:gap-2">
    <span className="ml-auto flex items-center gap-1.5 sm:ml-0 sm:contents">
    {onSync && (
      <Button variant="outline" size="sm" aria-label="Sync calendar" onClick={onSync}>
        <RefreshCw className="size-4" />
        <span className="hidden sm:inline">{labels.sync}</span>
      </Button>
    )}
    {canCreateEvents && showDeleteAll && (
      <Button variant="outline" size="sm" aria-label="Delete all" onClick={() => onWipe()}>
        <Trash2 className="size-4" />
        <span className="hidden sm:inline">{labels.deleteAll}</span>
      </Button>
    )}
    {toolbarExtras}
    </span>
    <div className="flex w-full items-center gap-1 rounded-lg border p-1 sm:w-auto">
      {viewLabels.filter((entry) => views.includes(entry.id)).map((entry) =>
        entry.id === 'day' ? (
          <Popover key={entry.id}>
            <span
              className={cn(
                'flex flex-1 items-center justify-center rounded-md transition-colors sm:flex-none sm:justify-start',
                view === 'day'
                  ? '[background-color:var(--ds-color-brand)] [color:var(--ds-color-brand-fg)]'
                  : '[color:var(--ds-color-text-secondary)] hover:[background-color:var(--ds-color-bg-muted)]',
              )}
            >
              <button
                type="button"
                aria-label="Day view"
                onClick={() => {
                  onDayCountChange(1)
                  onViewChange('day')
                }}
                className="cursor-pointer whitespace-nowrap rounded-l-md py-1.5 pl-2.5 pr-1 text-[0.8125rem] font-medium sm:py-1 sm:pl-3 sm:text-sm"
              >
                {dayCount === 1 ? entry.label : props.isMobile ? `${dayCount}d` : `${dayCount} days`}
              </button>

              <PopoverTrigger asChild>
                <button
                  type="button"
                  aria-label="Choose how many days"
                  className="cursor-pointer self-stretch rounded-r-md py-1.5 pl-0.5 pr-2 sm:py-1"
                >
                  <ChevronDown className="size-3.5" />
                </button>
              </PopoverTrigger>
            </span>

            <PopoverContent align="start" className="w-40 p-1 [background-color:var(--ds-color-bg-surface)]">
              {[1, 2, 3, 4, 5, 6, 7].map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => {
                    onDayCountChange(count)
                    onViewChange('day')
                  }}
                  className={cn(
                    'flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm',
                    'hover:[background-color:var(--ds-color-bg-muted)]',
                  )}
                >
                  <Check
                    className={cn(
                      'size-4',
                      view === 'day' && dayCount === count
                        ? '[color:var(--ds-color-brand)]'
                        : 'opacity-0',
                    )}
                  />
                  {count === 1 ? '1 day' : `${count} days`}
                </button>
              ))}
            </PopoverContent>
          </Popover>
        ) : (
          <button
            key={entry.id}
            type="button"
            onClick={() => onViewChange(entry.id)}
            className={cn(
              'flex-1 cursor-pointer whitespace-nowrap rounded-md px-2 py-1.5 text-[0.8125rem] font-medium transition-colors sm:flex-none sm:px-3 sm:py-1 sm:text-sm',
              view === entry.id
                ? '[background-color:var(--ds-color-brand)] [color:var(--ds-color-brand-fg)]'
                : '[color:var(--ds-color-text-secondary)] hover:[background-color:var(--ds-color-bg-muted)]',
            )}
          >
            {entry.label}
          </button>
        ),
      )}
    </div>
    </div>
  </div>
  )
}

export default CalendarToolbar
