import type { ReactNode } from 'react'
import { useMemo, useState } from 'react'
import { addDays, addMonths, addWeeks, endOfWeek, format, startOfWeek, subDays, subMonths, subWeeks } from 'date-fns'

import './styles/calendar.css'
import { LIMITS } from './constants'
import { mergeLabels } from './labels'
import { REMINDER_TYPE } from './types'
import type { CalendarView } from './types'
import { CalendarDays, Plus } from './icons'
import ListView from './components/ListView'
import DaysGrid from './components/DaysGrid'
import type { CalendarIcons } from './icons'
import MonthGrid from './components/MonthGrid'
import WeekStrip from './components/WeekStrip'
import { useIsMobile } from './hooks/useIsMobile'
import CalendarProvider from './CalendarProvider'
import { itemFromEvent, kindOf } from './helpers'
import CalendarSidebar from './components/CalendarSidebar'
import CalendarToolbar from './components/CalendarToolbar'
import { CALENDAR_STATE_COPY } from './Calendar.constants'
import type { CalendarLabels, CalendarLabelsInput } from './labels'
import { EMPTY_DRAFT, newDraftOn, newReminderOn } from './helpers/drafts'
import type { CalendarEvent, CalendarEventType, EventDraft } from './types'
import { CalendarError, CalendarSkeleton } from './components/CalendarState'

const ALL_VIEWS: CalendarView[] = ['day', 'week', 'month', 'list']

const VIEW_WORD = { day: 'viewDay', week: 'viewWeek', month: 'viewMonth', list: 'viewList' } as const

const VIEW_LABELS: { id: CalendarView; label: string }[] = [
  { id: 'day', label: 'Day' },
  { id: 'week', label: 'Week' },
  { id: 'month', label: 'Month' },
  { id: 'list', label: 'List' },
]

/*
  Things the calendar itself notices, with no words attached — the app decides
  what to say, in its own toast. Outcomes of the app's own callbacks (saved,
  failed…) are the app's to report: it knows them before the calendar does.
*/
export type CalendarNotice =
  | { type: 'reminder-limit'; limit: number }
  /** A past day was picked to create on, and `allowPastDates` is off. */
  | { type: 'past-date'; date: string }

export type CalendarPermissions = {
  /** Create events (and reminders). Default: no. */
  createEvents?: boolean
  /** Create one's own reminders. Default: yes. Both off is view-only. */
  createReminders?: boolean
}


export interface CalendarProps {
  /*
    The calendar only draws and tells. It calls no API and opens no modal: it
    hands the app what the user asked for, and the app shows its own modal and
    does the work — so every project brings its own modals and operations.
  */
  /** Everything to draw: events, reminders, deadlines, nudges. */
  events: CalendarEvent[]
  /** First load still running — shows the skeleton. */
  isLoading?: boolean
  /** The load failed; shown with a Retry that calls `onRetry`. */
  loadError?: string | null
  onRetry?: () => void
  /** A tile, a list row, or an item opened from outside (bell, push) — the app shows it. */
  onViewEvent: (event: CalendarEvent) => void
  /**
   * "New Event" / "Add Reminder" or a click on an empty day — with a draft
   * for that day (the app's `draftDefaults` spread in). Leave out to hide create.
   */
  onCreateRequest?: (draft: EventDraft) => void
  /** "Delete all" in the toolbar. Leave out to hide the button. */
  onDeleteAllRequest?: () => void
  /** "Sync" in the toolbar. Leave out to hide the button. */
  onSyncRequest?: () => void
  /** Something the user should hear about — the app words it and shows it its own way. */
  onNotice?: (notice: CalendarNotice) => void
  /** The app's own icons, by name; any left out stay the calendar's defaults (lucide). */
  icons?: Partial<CalendarIcons>
  /** The app's own words for the calendar's buttons and titles; any left out keep the defaults. */
  labels?: CalendarLabelsInput
  title?: string
  /** What this user may do. An app turns its own roles into these. */
  permissions?: CalendarPermissions
  /** The app's event types — colours and labels on the grid. */
  eventTypes?: CalendarEventType[]
  /** The app's own draft fields, spread over every new draft. */
  draftDefaults?: Partial<EventDraft> & Record<string, unknown>
  /** The app's controls in the toolbar — its filter, say. */
  toolbarExtras?: ReactNode
  /** Upcoming reminders one person may keep, when they cannot create events. */
  maxUpcomingReminders?: number
  /**
   * May an item be created on a day already gone? Off: a click on a past day,
   * or the create button while a past day is in view, opens nothing — it sends
   * `onNotice({ type: 'past-date' })` instead of `onCreateRequest`. Default: on.
   */
  allowPastDates?: boolean
  /*
    Har route ko poora calendar nahi chahiye. Ek jagah sirf mahina dikhana hai,
    doosri jagah banane ka button hi nahi chahiye — isliye har tukda yahan se
    band kiya ja sakta hai. Kuch na do to sab chalu, jaisa aaj hai.
  */
  /** Kaunse views dikhane hain, aur isi kram me. */
  views?: CalendarView[]
  /** Khulte hi kaunsa view. */
  defaultView?: CalendarView
  /** Baayin taraf ka chhota calendar aur legend. */
  showSidebar?: boolean
  /** "New Event" / "Add Reminder" button. */
  showCreate?: boolean
  /** Button par apna text. */
  createLabel?: string
  /** "Delete all". */
  showDeleteAll?: boolean
}

const Calendar = ({
  title,
  permissions = {},
  eventTypes = [],
  draftDefaults,
  toolbarExtras,
  maxUpcomingReminders = LIMITS.upcomingReminders,
  allowPastDates = true,
  views = ALL_VIEWS,
  defaultView,
  showSidebar = true,
  showCreate = true,
  createLabel,
  showDeleteAll = true,
  events,
  isLoading = false,
  loadError = null,
  onRetry,
  onViewEvent,
  onCreateRequest,
  onDeleteAllRequest,
  onSyncRequest,
  onNotice = () => undefined,
  icons,
  labels,
}: CalendarProps) => {
  const isMobile = useIsMobile()
  const [month, setMonth] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState(new Date())
  const [dayCount, setDayCount] = useState(1)
  const [view, setView] = useState<CalendarView>(defaultView ?? (views.includes('month') ? 'month' : views[0]))
  // The legend's toggles: kinds hidden from the grid. Anything finer is the app's to filter.
  const [kinds, setKinds] = useState<string[]>([])
  const canCreateEvents = Boolean(permissions.createEvents)
  const canCreate = canCreateEvents || permissions.createReminders !== false
  const words = useMemo<CalendarLabels>(() => mergeLabels(labels), [labels])
  // A new event opens on the app's first type unless the app says otherwise.
  const blank = useMemo<EventDraft>(
    () => ({ ...EMPTY_DRAFT, eventType: eventTypes[0]?.value ?? '', ...draftDefaults }) as EventDraft,
    [draftDefaults, eventTypes],
  )
  const today = format(new Date(), 'yyyy-MM-dd')
  const isPastDay = (eventDate: string) => !allowPastDates && eventDate < today

  /*
    Creating on a day: never on a past one while past days are off — not from a
    click in the grid, not from the create button on a past day. The app hears
    `past-date` and may say why; no modal is asked for.
  */
  const pickDayToCreate = (eventDate: string) => {
    if (isPastDay(eventDate)) {
      onNotice({ type: 'past-date', date: eventDate })
      return
    }
    openCreate(eventDate)
  }

  // The create button, on the day in view.
  const askForCreate = (eventDate: string) =>
    atReminderLimit ? onNotice({ type: 'reminder-limit', limit: maxUpcomingReminders }) : pickDayToCreate(eventDate)



  // Opening an item is the app's: it shows its own view of it.
  const openItem = (eventId: string) => {
    const event = events.find((entry) => entry.id === eventId)
    if (event) onViewEvent(event)
  }

  const goBack = () => {
    if (view === 'day') {
      const day = subDays(selectedDay, dayCount)
      setSelectedDay(day)
      setMonth(day)
      return
    }
    setMonth(view === 'week' ? subWeeks(month, 1) : subMonths(month, 1))
  }

  const goForward = () => {
    if (view === 'day') {
      const day = addDays(selectedDay, dayCount)
      setSelectedDay(day)
      setMonth(day)
      return
    }
    setMonth(view === 'week' ? addWeeks(month, 1) : addMonths(month, 1))
  }

  const stepName = view === 'day' ? 'day' : view === 'week' ? 'week' : 'month'

  const shownDays =
    view === 'week'
      ? Array.from({ length: 7 }, (_, index) => addDays(startOfWeek(month, { weekStartsOn: 1 }), index))
      : Array.from({ length: dayCount }, (_, index) => addDays(selectedDay, index))

  const rangeLabel = isMobile
    ? view === 'day'
      ? dayCount === 1
        ? format(selectedDay, 'd MMM')
        : `${format(selectedDay, 'd')}–${format(addDays(selectedDay, dayCount - 1), 'd MMM')}`
      : view === 'week'
        ? `${format(startOfWeek(month, { weekStartsOn: 1 }), 'd')}–${format(endOfWeek(month, { weekStartsOn: 1 }), 'd MMM')}`
        : format(month, 'MMM yyyy')
    : view === 'day'
      ? dayCount === 1
        ? format(selectedDay, 'EEE, MMM d, yyyy')
        : `${format(selectedDay, 'EEE, MMM d')} – ${format(addDays(selectedDay, dayCount - 1), 'EEE, MMM d, yyyy')}`
      : view === 'week'
        ? `${format(startOfWeek(month, { weekStartsOn: 1 }), 'EEE, MMM d')} – ${format(endOfWeek(month, { weekStartsOn: 1 }), 'EEE, MMM d, yyyy')}`
        : format(month, 'MMMM yyyy')

  // A repeating reminder counts once towards the limit, however many dates it has.
  const upcomingReminders = new Set(
    events
      .filter((event) => event.draft.eventType === REMINDER_TYPE && event.draft.eventDate >= format(new Date(), 'yyyy-MM-dd'))
      .map((event) => event.seriesId ?? event.id),
  ).size

  const atReminderLimit = !canCreateEvents && upcomingReminders >= maxUpcomingReminders

  /*
    What to draw. The app decides which events the user may see and filters
    them by its own fields before handing them over; the calendar only keeps
    nudges off the grid (they live in the bell) and applies the legend.
  */
  const visible = useMemo(() => {
    const all = events
      .filter((event) => kindOf(event.draft.eventType) !== 'nudge')
      .map((event) => itemFromEvent(event, eventTypes))

    if (!kinds.length) return all

    return all.filter((item) =>
      item.status === 'cancelled' ? kinds.includes('cancelled') : kinds.includes(item.kind),
    )
  }, [events, kinds, eventTypes])

  const openCreate = (eventDate: string) =>
    canCreate && onCreateRequest?.(canCreateEvents ? newDraftOn(eventDate, blank) : newReminderOn(eventDate, blank))

  return (
    <CalendarProvider icons={icons} labels={labels}>
    <div className="flex w-full flex-col gap-[1rem] p-3 sm:p-[1.5rem]">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <CalendarDays className="size-5 [color:var(--ds-color-brand)]" />
          <h1 className="text-lg font-semibold sm:text-xl">{title ?? words.title}</h1>
        </div>

      </header>

      <div className="flex flex-col gap-4 lg:flex-row">
        {showSidebar && (
          <CalendarSidebar
            month={month}
            selectedDay={selectedDay}
            view={view}
            dayCount={dayCount}
            kinds={kinds}
            onMonthChange={setMonth}
            onPickDay={(day) => {
              setSelectedDay(day)
              setMonth(day)
            }}
            onKindsChange={setKinds}
          />
        )}

        <section className="order-1 flex min-w-0 flex-1 flex-col gap-3 lg:order-none">
          <CalendarToolbar
            canCreateEvents={canCreateEvents}
            isMobile={isMobile}
            view={view}
            views={views}
            viewLabels={VIEW_LABELS.map((entry) => ({ ...entry, label: words.toolbar[VIEW_WORD[entry.id]] }))}
            selectedDay={selectedDay}
            dayCount={dayCount}
            rangeLabel={rangeLabel}
            stepName={stepName}
            showCreate={showCreate && canCreate && Boolean(onCreateRequest)}
            showDeleteAll={showDeleteAll && Boolean(onDeleteAllRequest)}
            createLabel={createLabel}
            onCreate={() => askForCreate(format(selectedDay, 'yyyy-MM-dd'))}
            onBack={goBack}
            onForward={goForward}
            onViewChange={setView}
            onDayCountChange={setDayCount}
            onMonthChange={setMonth}
            onPickDay={setSelectedDay}
            onWipe={() => onDeleteAllRequest?.()}
            onSync={onSyncRequest}
            toolbarExtras={toolbarExtras}
          />

          {isLoading ? (
            <CalendarSkeleton />
          ) : loadError ? (
            <CalendarError message={loadError || CALENDAR_STATE_COPY.loadFailed} onRetry={() => onRetry?.()} />
          ) : (
            <>
              {isMobile && view === 'day' && (
                <WeekStrip
                  selected={selectedDay}
                  onPick={(day) => {
                    setSelectedDay(day)
                    setMonth(day)
                  }}
                />
              )}
              {(view === 'day' || view === 'week') && (
                <DaysGrid
                  days={shownDays}
                  items={visible}
                  onOpen={(item) => openItem(item.id)}
                  onPickDate={(day) => {
                    setSelectedDay(day)
                    pickDayToCreate(format(day, 'yyyy-MM-dd'))
                  }}
                />
              )}
              {view === 'month' && (
                <MonthGrid
                  month={month}
                  items={visible}
                  selected={selectedDay}
                  onOpen={(item) => openItem(item.id)}
                  onPickDate={(day) => {
                    setSelectedDay(day)
                    pickDayToCreate(format(day, 'yyyy-MM-dd'))
                  }}
                />
              )}
              {view === 'list' && <ListView month={month} items={visible} onOpen={(item) => openItem(item.id)} />}
            </>
          )}
        </section>
      </div>

      {showCreate && canCreate && onCreateRequest && (
      <button
        type="button"
        aria-label={createLabel ?? (canCreateEvents ? words.toolbar.newEvent : words.toolbar.addReminder)}
        onClick={() =>
          askForCreate(format(selectedDay, 'yyyy-MM-dd'))
        }
        className="fixed bottom-4 right-4 z-40 grid size-11 cursor-pointer place-items-center rounded-full [background-color:var(--ds-color-brand)] [box-shadow:0_6px_18px_rgba(15,23,42,0.24)] [color:var(--ds-color-brand-fg)] sm:hidden"
      >
        <Plus className="size-5" />
      </button>
      )}

    </div>
    </CalendarProvider>
  )
}

Calendar.displayName = 'Calendar'

export default Calendar
