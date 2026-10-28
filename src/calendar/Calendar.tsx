import './styles/calendar.css'
import { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { addDays, addMonths, addWeeks, endOfWeek, format, startOfWeek, subDays, subMonths, subWeeks } from 'date-fns'
import { CalendarDays, Plus } from './icons'
import { useIsMobile } from './hooks/useIsMobile'
import ListView from './components/ListView'
import DaysGrid from './components/DaysGrid'
import MonthGrid from './components/MonthGrid'
import WeekStrip from './components/WeekStrip'
import CalendarEntryDialog from './components/CalendarEntryDialog'
import CalendarDialogs from './components/CalendarDialogs'
import CalendarSidebar from './components/CalendarSidebar'
import CalendarToolbar from './components/CalendarToolbar'
import { CalendarError, CalendarSkeleton } from './components/CalendarState'
import SyncDialog from './components/SyncDialog'
import { EMPTY_DRAFT, newDraftOn, newReminderOn } from './helpers/drafts'
import { onOpenEventRequest, takePendingOpen } from './services/store'
import CalendarProvider from './CalendarProvider'
import { DEFAULT_LABELS } from './labels'
import type { CalendarLabels } from './labels'
import type { CalendarIcons } from './icons'
import { itemFromEvent, kindOf } from './helpers'
import { LIMITS } from './constants'
import { CALENDAR_STATE_COPY } from './Calendar.constants'
import { DEFAULT_CANCEL_REASONS } from './Calendar.constants'
import type { DayEntry } from './Calendar.types'
import type { CalendarView } from './types'
import { REMINDER_TYPE } from './types'
import type { CalendarEvent, CalendarEventType, EventDraft } from './types'
import type { CancelReasonOption } from './components/CalendarDialogs/components/CancelDialog'

const ALL_VIEWS: CalendarView[] = ['day', 'week', 'month', 'list']

const VIEW_WORD = { day: 'viewDay', week: 'viewWeek', month: 'viewMonth', list: 'viewList' } as const

const VIEW_LABELS: { id: CalendarView; label: string }[] = [
  { id: 'day', label: 'Day' },
  { id: 'week', label: 'Week' },
  { id: 'month', label: 'Month' },
  { id: 'list', label: 'List' },
]

export interface CalendarHandle {
  /** Jo draft publish dialog se poora hua, use yahin save kiya jaata hai. */
  save: (draft: EventDraft) => void
  /** Publish dialog se "Back" — wahi draft le kar calendar ka apna modal wapas kholo. */
  openEntry: (draft: EventDraft) => void
  /** Dono modal ek saath band karne ke liye. */
  closeEntry: () => void
}

/*
  Things the calendar itself notices, with no words attached — the app decides
  what to say, in its own toast. Outcomes of the app's own callbacks (saved,
  failed…) are the app's to report: it knows them before the calendar does.
*/
export type CalendarNotice =
  | { type: 'reminder-limit'; limit: number }
  | { type: 'feed-link-copied' }
  | { type: 'feed-link-copy-failed' }

export type CalendarPermissions = {
  /** Create events (and reminders). Default: no. */
  createEvents?: boolean
  /** Create one's own reminders. Default: yes. Both off is view-only. */
  createReminders?: boolean
}


/** What a host's event buttons get to work with. */
export interface EventActionContext {
  /** The panel's own buttons — Edit, Cancel Event, Remind me… — to keep, drop or reorder. */
  defaults: ReactNode
  /** Close the detail panel, e.g. before opening the host's own dialog. */
  close: () => void
}

export interface CalendarProps {
  /*
    Data aur kaam, dono bahar se. Calendar khud koi API nahi bulata — app apni
    API se events laati hai aur yahan deti hai, aur jo kuch badalna ho wo inhi
    callbacks se karti hai. Isliye ye folder kisi bhi repo me, kisi bhi API ke
    saath chal jaata hai.
  */
  /** Everything to draw: events, reminders, deadlines, nudges. */
  events: CalendarEvent[]
  /** First load still running — shows the skeleton. */
  isLoading?: boolean
  /** The load failed; shown with a Retry that calls `onRetry`. */
  loadError?: string | null
  onRetry?: () => void
  /** Save a new event or reminder. Resolves with what was saved. */
  onCreate: (draft: EventDraft) => Promise<CalendarEvent>
  /** Save changes to one. */
  /** Save changes to one. `notify` — the user ticked "Notify about this change". */
  onUpdate: (eventId: string, draft: EventDraft, options: { notify: boolean }) => Promise<CalendarEvent>
  /** Cancel an event — this date, or this and every later one of its series. */
  onCancel: (eventId: string, reason: string, note: string, scope: 'one' | 'series') => Promise<unknown>
  /** Delete a reminder, or a cancelled event, for good. `series` — this date and every later one. */
  onDelete: (eventId: string, options: { scope: 'one' | 'series' }) => Promise<unknown>
  /** "Delete all". Leave out to hide the button. */
  onDeleteAll?: () => Promise<{ count: number }>
  /** The user's calendar-subscription link. Leave out to hide "Sync". */
  getFeedLink?: () => Promise<string>
  /** Turns an event's stored image path into a URL the browser can load. */
  resolveImageUrl?: (path: string) => string
  /** Something the user should hear about — the app words it and shows it its own way. */
  onNotice?: (notice: CalendarNotice) => void
  /** The app's own icons, by name; any left out stay the calendar's defaults (lucide). */
  icons?: Partial<CalendarIcons>
  /** The app's own words for the calendar's buttons and titles; any left out keep the defaults. */
  labels?: Partial<CalendarLabels>
  title?: string
  /**
    What this user may do. An app turns its own roles into these. Editing,
    cancelling and deleting an item follow its `isOwner`.
  */
  permissions?: CalendarPermissions
  /** The app's event types. The calendar adds "My Reminder" itself. */
  eventTypes?: CalendarEventType[]
  /** The app's own draft fields, spread over every new draft. */
  draftDefaults?: Partial<EventDraft> & Record<string, unknown>
  /** Reasons offered when cancelling an event. */
  cancelReasons?: CancelReasonOption[]
  /** Who an event reaches, in the app's words — "people", "attendees". */
  audienceNoun?: string
  /** The app's rows in the event panel (below the calendar's own). */
  renderEventDetails?: (event: CalendarEvent) => ReactNode
  /** The app's controls in the toolbar — its filter, say. */
  toolbarExtras?: ReactNode
  /** "Fill Data" sample values. Leave out to hide the button. */
  fillSample?: (draft: EventDraft) => Partial<EventDraft>
  /** Upcoming reminders one person may keep, when they cannot create events. */
  maxUpcomingReminders?: number
  /** Pehla modal bhar kar aage — app ka agla step (uska apna dialog). */
  onNext?: (draft: EventDraft) => void
  /** Us din ke baaki events, taaki bahar wala dialog bhi wahi din dikha sake. */
  onDayEntries?: (entries: DayEntry[]) => void
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
  /**
    Event detail ke neeche ke buttons. Calendar apne buttons `defaults` me deta
    hai; app unke saath apne jod sakta hai (jaise apna koi button), hata
    sakta hai ya kram badal sakta hai. Na do to sirf calendar ke apne.
  */
  eventActions?: (event: CalendarEvent, context: EventActionContext) => ReactNode
}

const Calendar = forwardRef<CalendarHandle, CalendarProps>((
  {
    title,
    permissions = {},
    eventTypes = [],
    draftDefaults,
    cancelReasons = DEFAULT_CANCEL_REASONS,
    audienceNoun = 'people',
    renderEventDetails,
    toolbarExtras,
    fillSample,
    maxUpcomingReminders = LIMITS.upcomingReminders,
    onNext,
    onDayEntries,
    views = ALL_VIEWS,
    defaultView,
    showSidebar = true,
    showCreate = true,
    createLabel,
    showDeleteAll = true,
    eventActions,
    events,
    isLoading = false,
    loadError = null,
    onRetry,
    onCreate,
    onUpdate,
    onCancel,
    onDelete,
    onDeleteAll,
    getFeedLink,
    resolveImageUrl = (path: string) => path,
    onNotice = () => undefined,
    icons,
    labels,
  },
  ref,
) => {
  const isMobile = useIsMobile()
  const [month, setMonth] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState(new Date())
  const [dayCount, setDayCount] = useState(1)
  const [view, setView] = useState<CalendarView>(defaultView ?? (views.includes('month') ? 'month' : views[0]))
  // The legend's toggles: kinds hidden from the grid. Anything finer is the app's to filter.
  const [kinds, setKinds] = useState<string[]>([])
  const canCreateEvents = Boolean(permissions.createEvents)
  const canCreate = canCreateEvents || permissions.createReminders !== false
  const words = useMemo<CalendarLabels>(() => ({ ...DEFAULT_LABELS, ...labels }), [labels])
  // A new event opens on the app's first type unless the app says otherwise.
  const blank = useMemo<EventDraft>(
    () => ({ ...EMPTY_DRAFT, eventType: eventTypes[0]?.value ?? '', ...draftDefaults }) as EventDraft,
    [draftDefaults, eventTypes],
  )
  const [drawer, setDrawer] = useState<{ open: boolean; draft: EventDraft; editing: CalendarEvent | null }>({
    open: false,
    draft: blank,
    editing: null,
  })
  const [notifyMinor, setNotifyMinor] = useState(false)
  const [openedId, setOpenedId] = useState<string | null>(null)
  const [cancelling, setCancelling] = useState<CalendarEvent | null>(null)
  const [deleting, setDeleting] = useState<CalendarEvent | null>(null)
  const [purging, setPurging] = useState<CalendarEvent | null>(null)
  const [wiping, setWiping] = useState(false)
  const [syncing, setSyncing] = useState(false)
  /*
    Every change goes through the app's callback. If it resolves, the dialog
    that asked for it closes; if it throws, the dialog stays open — the app has
    already told the user why.
  */
  const attempt = async (work: () => Promise<unknown>, after: () => void) => {
    try {
      await work()
      after()
    } catch {
      // The app reported the failure; leave the dialog as it is.
    }
  }

  const askForCreate = (eventDate: string) =>
    atReminderLimit ? onNotice({ type: 'reminder-limit', limit: maxUpcomingReminders }) : openCreate(eventDate)

  // The day panel in both dialogs draws the same day; the event being edited is
  // left out so it does not clash with itself.
  const dayEntries = events
    .filter((event) => !event.cancelledAt && event.id !== drawer.editing?.id)
    .map((event) => ({
      id: event.id,
      title: event.draft.title,
      eventDate: event.draft.eventDate,
      startTime: event.draft.startTime,
      endTime: event.draft.endTime,
    }))


  useEffect(() => {
    // Asked for before this calendar was on screen, e.g. from a bell on another page.
    const waiting = takePendingOpen()
    if (waiting) setOpenedId(waiting)

    return onOpenEventRequest((eventId) => setOpenedId(eventId))
  }, [])

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

  const opened = events.find((event) => event.id === openedId) ?? null

  const linkedOf = (event: CalendarEvent | null): CalendarEvent | null =>
    event && event.draft.linkedType === 'event' && event.draft.linkedId
      ? (events.find((entry) => entry.id === event.draft.linkedId) ?? null)
      : null

  const moveReminder = (reminder: CalendarEvent) => {
    const linked = linkedOf(reminder)
    if (!linked) return

    attempt(
      () =>
        onUpdate(
          reminder.id,
          {
            ...reminder.draft,
            eventDate: linked.draft.eventDate,
            endDate: linked.draft.eventDate,
            startTime: linked.draft.startTime || reminder.draft.startTime,
          },
          { notify: false },
        ),
      () => undefined,
    )
  }

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
    canCreate &&
    setDrawer({
      open: true,
      draft: canCreateEvents ? newDraftOn(eventDate, blank) : newReminderOn(eventDate, blank),
      editing: null,
    })

  const remindMe = (event: CalendarEvent) => {
    setOpenedId(null)
    setDrawer({
      open: true,
      editing: null,
      draft: {
        ...blank,
        eventType: REMINDER_TYPE,
        title: event.draft.title,
        eventDate: event.draft.eventDate,
        endDate: event.draft.eventDate,
        startTime: event.draft.startTime,
        remindBefore: '1_hour',
        linkedType: 'event',
        linkedId: event.id,
      },
    })
  }

  const openEdit = (event: CalendarEvent) => {
    setOpenedId(null)
    setDrawer({ open: true, draft: event.draft, editing: event })
  }

  const publish = (draft: EventDraft) =>
    attempt(() => onCreate(draft), () => setDrawer({ open: false, draft: blank, editing: null }))

  // Whether to tell people is the user's tick; which changes always notify is the app's rule.
  const applyEdit = (draft: EventDraft, notify: boolean) =>
    attempt(
      () => onUpdate((drawer.editing as CalendarEvent).id, draft, { notify }),
      () => setDrawer({ open: false, draft: blank, editing: null }),
    )

  const save = (draft: EventDraft) => {
    if (!drawer.editing) {
      publish(draft)
      return
    }

    applyEdit(draft, notifyMinor)
  }

  /*
    The publish dialog lives outside this component — the calendar is shared
    across apps and knows nothing of their extra fields. It still saves
    through here, so the create dialog closes and the message is said in one
    place. This is the one door it gets.
  */
  useImperativeHandle(ref, () => ({
    save,
    openEntry: (draft: EventDraft) => setDrawer({ open: true, draft, editing: null }),
    closeEntry: () => setDrawer({ open: false, draft: blank, editing: null }),
  }))

  useEffect(() => {
    onDayEntries?.(dayEntries)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events, drawer.editing?.id])

  const confirmCancel = (reason: string, note: string, scope: 'one' | 'series' = 'one') =>
    attempt(
      () => onCancel((cancelling as CalendarEvent).id, reason, note, scope),
      () => {
        setCancelling(null)
        setOpenedId(null)
      },
    )

  const confirmWipe = () =>
    attempt(
      () => (onDeleteAll as NonNullable<typeof onDeleteAll>)(),
      () => {
        setWiping(false)
        setOpenedId(null)
      },
    )

  const confirmPurge = () =>
    attempt(
      () => onDelete((purging as CalendarEvent).id, { scope: 'one' }),
      () => {
        setPurging(null)
        setOpenedId(null)
      },
    )

  const confirmDelete = (scope: 'one' | 'series') =>
    attempt(
      () => onDelete((deleting as CalendarEvent).id, { scope }),
      () => {
        setDeleting(null)
        setOpenedId(null)
      },
    )

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
            viewLabels={VIEW_LABELS.map((entry) => ({ ...entry, label: words[VIEW_WORD[entry.id]] }))}
            selectedDay={selectedDay}
            dayCount={dayCount}
            rangeLabel={rangeLabel}
            stepName={stepName}
            showCreate={showCreate && canCreate}
            showDeleteAll={showDeleteAll && Boolean(onDeleteAll)}
            createLabel={createLabel}
            onCreate={() => askForCreate(format(selectedDay, 'yyyy-MM-dd'))}
            onBack={goBack}
            onForward={goForward}
            onViewChange={setView}
            onDayCountChange={setDayCount}
            onMonthChange={setMonth}
            onPickDay={setSelectedDay}
            onWipe={() => setWiping(true)}
            onSync={getFeedLink ? () => setSyncing(true) : undefined}
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
                  onOpen={(item) => setOpenedId(item.id)}
                  onPickDate={(day) => {
                    setSelectedDay(day)
                    openCreate(format(day, 'yyyy-MM-dd'))
                  }}
                />
              )}
              {view === 'month' && (
                <MonthGrid
                  month={month}
                  items={visible}
                  selected={selectedDay}
                  onOpen={(item) => setOpenedId(item.id)}
                  onPickDate={(day) => {
                    setSelectedDay(day)
                    openCreate(format(day, 'yyyy-MM-dd'))
                  }}
                />
              )}
              {view === 'list' && <ListView month={month} items={visible} onOpen={(item) => setOpenedId(item.id)} />}
            </>
          )}
        </section>
      </div>

      {showCreate && canCreate && (
      <button
        type="button"
        aria-label={createLabel ?? (canCreateEvents ? words.newEvent : words.addReminder)}
        onClick={() =>
          askForCreate(format(selectedDay, 'yyyy-MM-dd'))
        }
        className="fixed bottom-4 right-4 z-40 grid size-11 cursor-pointer place-items-center rounded-full [background-color:var(--ds-color-brand)] [box-shadow:0_6px_18px_rgba(15,23,42,0.24)] [color:var(--ds-color-brand-fg)] sm:hidden"
      >
        <Plus className="size-5" />
      </button>
      )}

      <CalendarEntryDialog
        open={drawer.open}
        initial={drawer.draft}
        isEdit={Boolean(drawer.editing)}
        reminderOnly={!canCreateEvents}
        eventTypes={eventTypes}
        audienceNoun={audienceNoun}
        fillSample={fillSample}
        canCancelEvent={Boolean(
          drawer.editing &&
          !drawer.editing.cancelledAt &&
          drawer.editing.draft.eventType !== REMINDER_TYPE &&
          drawer.editing.isOwner,
        )}
        canDeleteReminder={Boolean(
          drawer.editing && drawer.editing.draft.eventType === REMINDER_TYPE && drawer.editing.isOwner,
        )}
        onDeleteReminder={() => {
          const editing = drawer.editing
          setDrawer({ open: false, draft: blank, editing: null })
          setDeleting(editing)
        }}
        onCancelEvent={() => {
          const editing = drawer.editing
          setDrawer({ open: false, draft: blank, editing: null })
          setCancelling(editing)
        }}
        dayEntries={dayEntries}
        onClose={() => setDrawer({ open: false, draft: blank, editing: null })}
        onSave={save}
        /*
          Ek samay ek hi dialog. Next par ye chhup jaata hai — par apna draft
          pakde rehta hai, isliye Back dabane par wahi form wapas milta hai,
          bhara hua. Do dialog ek saath dikhane se dono ke header aur footer
          aapas me takra rahe the.
        */
        onNext={canCreateEvents && onNext ? (draft) => {
          setDrawer((current) => ({ ...current, open: false }))
          onNext(draft)
        } : undefined}
        notifyMinor={notifyMinor}
        onNotifyMinorChange={setNotifyMinor}
        notifyCount={drawer.editing?.reach ?? 0}
      />


      {getFeedLink && (
        <SyncDialog
          open={syncing}
          getFeedLink={getFeedLink}
          onNotice={onNotice}
          calendarName={title ?? words.title}
          onClose={() => setSyncing(false)}
        />
      )}

      <CalendarDialogs
        resolveImageUrl={resolveImageUrl}
        canCreateEvents={canCreateEvents}
        canRemind={permissions.createReminders !== false}
        eventTypes={eventTypes}
        cancelReasons={cancelReasons}
        audienceNoun={audienceNoun}
        renderDetails={renderEventDetails}
        opened={opened}
        linked={linkedOf(opened)}
        cancelling={cancelling}
        deleting={deleting}
        purging={purging}
        wiping={wiping}
        totalCount={events.length}
        onOpenEvent={setOpenedId}
        renderActions={
          eventActions
            ? (event, defaults) => eventActions(event, { defaults, close: () => setOpenedId(null) })
            : undefined
        }
        onEdit={openEdit}
        onRemindMe={remindMe}
        onMoveReminder={moveReminder}
        onAskCancel={setCancelling}
        onAskDelete={setDeleting}
        onAskPurge={setPurging}
        onAskWipe={setWiping}
        onConfirmCancel={confirmCancel}
        onConfirmDelete={confirmDelete}
        onConfirmPurge={confirmPurge}
        onConfirmWipe={confirmWipe}
      />

    </div>
    </CalendarProvider>
  )
})

Calendar.displayName = 'Calendar'

export default Calendar
