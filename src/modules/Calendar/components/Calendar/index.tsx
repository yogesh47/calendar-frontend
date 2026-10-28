import { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { addDays, addMonths, addWeeks, endOfWeek, format, startOfWeek, subDays, subMonths, subWeeks } from 'date-fns'
import { CalendarDays, Plus } from 'lucide-react'
import { useIsMobile } from '@/modules/Shared/hooks/useIsMobile'
import { messageOf, showError, showInfo, showSuccess } from '@/lib/toast'
import ListView from '../ListView'
import DaysGrid from '../DaysGrid'
import MonthGrid from '../MonthGrid'
import WeekStrip from '../WeekStrip'
import CalendarEntryDialog from '../CalendarEntryDialog'
import CalendarDialogs from './components/CalendarDialogs'
import CalendarSidebar from './components/CalendarSidebar'
import CalendarToolbar from './components/CalendarToolbar'
import { CalendarError, CalendarSkeleton } from '../CalendarState'
import ReviewChangesDialog from '../ReviewChangesDialog'
import SyncDialog from '../SyncDialog'
import { countAudience, diffAudience } from '../../services/audience'
import { newDraftOn, newReminderOn } from '../../services/tpoEvents'
import { onOpenEventRequest, onWindowFocus } from '../../services/store'
import {
  cancelEvent,
  createEvent,
  deleteAllEvents,
  deleteReminder,
  fetchEvents,
  openCalendarStream,
  updateEvent,
} from '../../services/api'
import { changedSummary, itemFromEvent, onlyMinorChanged, rulesFor } from '../../helpers/tpo'
import { CALENDAR_STATE_COPY, LIMITS, REMINDER_LIMIT_MESSAGE } from '../../constants'
import { EMPTY_DRAFT, EMPTY_FILTERS, SIGNED_IN_TPO } from '../../constants/tpo'
import type { DayEntry } from '../DayPreview'
import type { CalendarView } from '../../types'
import type { CalendarFilters, CancelReason, EventDraft, TpoEvent } from '../../types/tpo'

const ALL_VIEWS: CalendarView[] = ['day', 'week', 'month', 'list']

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
  /** Events dobara laao — jab bahar ka koi dialog kuch badal de. */
  refresh: () => Promise<void>
}

/** What a host's event buttons get to work with. */
export interface EventActionContext {
  /** The panel's own buttons — Edit, Cancel Event, Remind me… — to keep, drop or reorder. */
  defaults: ReactNode
  /** Close the detail panel, e.g. before opening the host's own dialog. */
  close: () => void
  /** Reload the calendar after the host changed something. */
  refresh: () => Promise<void>
}

interface CalendarProps {
  title?: string
  role?: 'tpo' | 'student'
  /** TPO ka pehla modal bhar kar aage — baaki sab calendar ke bahar hota hai. */
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
  /** TPO ka filter bar. */
  showFilter?: boolean
  /** "Delete all". */
  showDeleteAll?: boolean
  /**
    Event detail ke neeche ke buttons. Calendar apne buttons `defaults` me deta
    hai; route unke saath apne jod sakta hai (jaise TPO ka "Audience"), hata
    sakta hai ya kram badal sakta hai. Na do to sirf calendar ke apne.
  */
  eventActions?: (event: TpoEvent, context: EventActionContext) => ReactNode
}

const Calendar = forwardRef<CalendarHandle, CalendarProps>((
  {
    title = 'Campus Calendar',
    role = 'student',
    onNext,
    onDayEntries,
    views = ALL_VIEWS,
    defaultView,
    showSidebar = true,
    showCreate = true,
    createLabel,
    showFilter = true,
    showDeleteAll = true,
    eventActions,
  },
  ref,
) => {
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const [month, setMonth] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState(new Date())
  const [dayCount, setDayCount] = useState(1)
  const [view, setView] = useState<CalendarView>(defaultView ?? (views.includes('month') ? 'month' : views[0]))
  const [events, setEvents] = useState<TpoEvent[]>([])
  const [filters, setFilters] = useState<CalendarFilters>(EMPTY_FILTERS)
  const [drawer, setDrawer] = useState<{ open: boolean; draft: EventDraft; editing: TpoEvent | null }>({
    open: false,
    draft: EMPTY_DRAFT,
    editing: null,
  })
  const [pendingDraft, setPendingDraft] = useState<EventDraft | null>(null)
  const [notifyMinor, setNotifyMinor] = useState(false)
  const [openedId, setOpenedId] = useState<string | null>(null)
  const [cancelling, setCancelling] = useState<TpoEvent | null>(null)
  const [deleting, setDeleting] = useState<TpoEvent | null>(null)
  const [purging, setPurging] = useState<TpoEvent | null>(null)
  const [wiping, setWiping] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [loadFailed, setLoadFailed] = useState(false)

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

  const isTpo = role === 'tpo'

  useEffect(() => {
    refresh()
    return openCalendarStream(refresh)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => onOpenEventRequest((eventId) => setOpenedId(eventId)), [])

  useEffect(() => onWindowFocus(refresh), [])

  const refresh = async () => {
    try {
      setEvents(await fetchEvents())
      setLoadFailed(false)
    } catch (error) {
      setLoadFailed(true)
      showError(messageOf(error))
    }
    setIsLoading(false)
  }

  const retry = () => {
    setIsLoading(true)
    refresh()
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

  const upcomingReminders = events.filter(
    (event) => event.draft.eventType === 'my_reminder' && event.draft.eventDate >= format(new Date(), 'yyyy-MM-dd'),
  ).length

  const atReminderLimit = !isTpo && upcomingReminders >= LIMITS.studentUpcomingReminders

  const opened = events.find((event) => event.id === openedId) ?? null

  const linkedOf = (event: TpoEvent | null): TpoEvent | null =>
    event && event.draft.linkedType === 'event' && event.draft.linkedId
      ? (events.find((entry) => entry.id === event.draft.linkedId) ?? null)
      : null

  const moveReminder = async (reminder: TpoEvent) => {
    const linked = linkedOf(reminder)
    if (!linked) return

    try {
      await updateEvent(reminder.id, {
        ...reminder.draft,
        eventDate: linked.draft.eventDate,
        endDate: linked.draft.eventDate,
        startTime: linked.draft.startTime || reminder.draft.startTime,
      })
      await refresh()
      showSuccess('Reminder moved to the new date.')
    } catch (error) {
      showError(messageOf(error))
    }
  }

  const visible = useMemo(() => {
    const fromEvents = events
      .filter((event) => event.draft.eventType !== 'nudge')
      .filter((event) => !filters.createdByMe || event.draft.eventType !== 'deadline')
      .filter((event) => isTpo || event.cancelReason !== 'created_by_mistake')
      .filter((event) => event.draft.eventType !== 'my_reminder' || event.createdBy === SIGNED_IN_TPO)
      .filter(
        (event) =>
          event.draft.eventType === 'my_reminder' ||
          ((!filters.types.length || filters.types.includes(event.draft.eventType)) &&
            (!filters.opportunityTypes.length ||
              filters.opportunityTypes.includes(event.draft.audience.opportunityType))),
      )
      .filter(
        (event) =>
          event.draft.eventType === 'my_reminder' ||
          ((!filters.companies.length || filters.companies.includes(event.draft.company)) &&
            (!filters.createdByMe || event.createdBy === SIGNED_IN_TPO) &&
            (!filters.courses.length ||
              event.draft.audience.courses.some((course) => filters.courses.includes(course))) &&
            (!filters.batches.length ||
              event.draft.audience.batches.some((batch) => filters.batches.includes(batch))) &&
            (!filters.departments.length ||
              event.draft.audience.departments.some((department) => filters.departments.includes(department)))),
      )
      .map(itemFromEvent)

    const all = fromEvents

    if (!filters.kinds.length) return all

    return all.filter((item) =>
      item.status === 'cancelled'
        ? filters.kinds.includes('cancelled')
        : filters.kinds.includes(item.kind),
    )
  }, [events, filters, isTpo])

  const openCreate = (eventDate: string) =>
    setDrawer({
      open: true,
      draft: isTpo ? newDraftOn(eventDate) : newReminderOn(eventDate),
      editing: null,
    })

  const remindMe = (event: TpoEvent) => {
    setOpenedId(null)
    setDrawer({
      open: true,
      editing: null,
      draft: {
        ...EMPTY_DRAFT,
        mode: '',
        eventType: 'my_reminder',
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

  const openEdit = (event: TpoEvent) => {
    setOpenedId(null)
    setDrawer({ open: true, draft: event.draft, editing: event })
  }

  const notifiedFor = (draft: EventDraft): number =>
    rulesFor(draft.eventType).needsAudience ? countAudience(draft.audience) : 0

  const publish = async (draft: EventDraft) => {
    try {
      const created = await createEvent(draft)
      await refresh()
      setDrawer({ open: false, draft: EMPTY_DRAFT, editing: null })
      /*
        Audience publish modal me hi chuni ja sakti hai, ya khali chhod kar baad
        me event ke "Choose audience" se. Khali ho to abhi kisi tak nahi pahuncha.
      */
      if (draft.eventType === 'my_reminder') {
        showSuccess('Reminder saved.')
        return
      }

      const repeats = draft.recurrence ? ' Every occurrence is on the calendar.' : ''

      if (rulesFor(draft.eventType).needsAudience && !draft.audience.courses.length) {
        showSuccess(`Event published.${repeats} No students see it yet — choose an audience from the event.`)

        return
      }

      showSuccess(
        rulesFor(draft.eventType).needsAudience
          ? `Event published.${repeats} ${created.notifiedCount} students notified.`
          : `Event published.${repeats}`,
      )
    } catch (error) {
      showError(messageOf(error))
    }
  }

  const applyEdit = async (draft: EventDraft, notified: number, reason = '') => {
    const editing = drawer.editing as TpoEvent
    try {
      await updateEvent(editing.id, {
        ...draft,
        changeSummary: changedSummary(editing.draft, draft),
        changeReason: reason,
        notifyOnChange: notified > 0,
      })
      await refresh()
      setDrawer({ open: false, draft: EMPTY_DRAFT, editing: null })
      setPendingDraft(null)
      showSuccess(
        draft.eventType === 'my_reminder'
          ? 'Reminder updated.'
          : notified
            ? `Changes saved. ${notified} students notified.`
            : 'Changes saved.',
      )
    } catch (error) {
      setPendingDraft(null)
      showError(messageOf(error))
    }
  }

  const save = (draft: EventDraft) => {
    if (!drawer.editing) {
      publish(draft)
      return
    }

    const diff = diffAudience(drawer.editing.draft.audience, draft.audience)
    if (diff.added || diff.removed) {
      setPendingDraft(draft)
      return
    }

    applyEdit(draft, onlyMinorChanged(drawer.editing.draft, draft) && !notifyMinor ? 0 : notifiedFor(draft))
  }

  /*
    The publish dialog lives outside this component — the calendar is shared
    across routes and knows nothing about audiences or venues. It still has to
    save through here, because the event list, the refresh and the toasts are
    all here. This is the one door it gets.
  */
  useImperativeHandle(ref, () => ({
    save,
    openEntry: (draft: EventDraft) => setDrawer({ open: true, draft, editing: null }),
    closeEntry: () => setDrawer({ open: false, draft: EMPTY_DRAFT, editing: null }),
    refresh,
  }))

  useEffect(() => {
    onDayEntries?.(dayEntries)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events, drawer.editing?.id])

  const confirmCancel = async (reason: CancelReason, note: string, scope: 'one' | 'series' = 'one') => {
    const event = cancelling as TpoEvent
    try {
      await cancelEvent(event.id, reason, note, scope)
      await refresh()
      setCancelling(null)
      setOpenedId(null)
      showSuccess(
        scope === 'series'
          ? 'This and the later occurrences are cancelled. Students were notified.'
          : `Event cancelled. ${event.notifiedCount} students notified.`,
      )
    } catch (error) {
      showError(messageOf(error))
    }
  }

  const confirmWipe = async () => {
    try {
      const { count } = await deleteAllEvents()
      await refresh()
      setWiping(false)
      setOpenedId(null)
      showSuccess(count ? `${count} items deleted permanently.` : 'Nothing to delete.')
    } catch (error) {
      showError(messageOf(error))
    }
  }

  const confirmPurge = async () => {
    const event = purging as TpoEvent
    try {
      await deleteReminder(event.id)
      await refresh()
      setPurging(null)
      setOpenedId(null)
      showSuccess('Event deleted permanently.')
    } catch (error) {
      showError(messageOf(error))
    }
  }

  const confirmDelete = async () => {
    const event = deleting as TpoEvent
    try {
      await deleteReminder(event.id)
      await refresh()
      setDeleting(null)
      setOpenedId(null)
      showSuccess('Reminder deleted.')
    } catch (error) {
      showError(messageOf(error))
    }
  }

  return (
    <div className="flex w-full flex-col gap-[1rem] p-3 sm:p-[1.5rem]">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <CalendarDays className="size-5 [color:var(--ds-color-brand)]" />
          <h1 className="text-lg font-semibold sm:text-xl">{title}</h1>
        </div>

      </header>

      <div className="flex flex-col gap-4 lg:flex-row">
        {showSidebar && (
          <CalendarSidebar
            month={month}
            selectedDay={selectedDay}
            view={view}
            dayCount={dayCount}
            filters={filters}
            onMonthChange={setMonth}
            onPickDay={(day) => {
              setSelectedDay(day)
              setMonth(day)
            }}
            onFiltersChange={setFilters}
          />
        )}

        <section className="order-1 flex min-w-0 flex-1 flex-col gap-3 lg:order-none">
          <CalendarToolbar
            isTpo={isTpo}
            isMobile={isMobile}
            view={view}
            views={views}
            viewLabels={VIEW_LABELS}
            selectedDay={selectedDay}
            dayCount={dayCount}
            rangeLabel={rangeLabel}
            stepName={stepName}
            filters={filters}
            showCreate={showCreate}
            showFilter={showFilter}
            showDeleteAll={showDeleteAll}
            createLabel={createLabel}
            onCreate={() =>
              atReminderLimit
                ? showInfo(REMINDER_LIMIT_MESSAGE)
                : openCreate(format(selectedDay, 'yyyy-MM-dd'))
            }
            onBack={goBack}
            onForward={goForward}
            onViewChange={setView}
            onDayCountChange={setDayCount}
            onMonthChange={setMonth}
            onPickDay={setSelectedDay}
            onFiltersChange={setFilters}
            onWipe={() => setWiping(true)}
            onSync={() => setSyncing(true)}
          />

          {isLoading ? (
            <CalendarSkeleton />
          ) : loadFailed ? (
            <CalendarError message={CALENDAR_STATE_COPY.loadFailed} onRetry={retry} />
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

      <button
        type="button"
        aria-label={createLabel ?? (isTpo ? 'New Event' : 'Add Reminder')}
        onClick={() =>
          atReminderLimit ? showInfo(REMINDER_LIMIT_MESSAGE) : openCreate(format(selectedDay, 'yyyy-MM-dd'))
        }
        className="fixed bottom-4 right-4 z-40 grid size-11 cursor-pointer place-items-center rounded-full [background-color:var(--ds-color-brand)] [box-shadow:0_6px_18px_rgba(15,23,42,0.24)] [color:var(--ds-color-brand-fg)] sm:hidden"
      >
        <Plus className="size-5" />
      </button>

      <CalendarEntryDialog
        open={drawer.open}
        initial={drawer.draft}
        isEdit={Boolean(drawer.editing)}
        reminderOnly={!isTpo}
        canCancelEvent={Boolean(
          drawer.editing &&
            !drawer.editing.cancelledAt &&
            drawer.editing.draft.eventType !== 'my_reminder' &&
            drawer.editing.createdBy === SIGNED_IN_TPO,
        )}
        canDeleteReminder={Boolean(
          drawer.editing && drawer.editing.draft.eventType === 'my_reminder' && drawer.editing.createdBy === SIGNED_IN_TPO,
        )}
        onDeleteReminder={() => {
          const editing = drawer.editing
          setDrawer({ open: false, draft: EMPTY_DRAFT, editing: null })
          setDeleting(editing)
        }}
        onCancelEvent={() => {
          const editing = drawer.editing
          setDrawer({ open: false, draft: EMPTY_DRAFT, editing: null })
          setCancelling(editing)
        }}
        dayEntries={dayEntries}
        onClose={() => setDrawer({ open: false, draft: EMPTY_DRAFT, editing: null })}
        onSave={save}
        /*
          Ek samay ek hi dialog. Next par ye chhup jaata hai — par apna draft
          pakde rehta hai, isliye Back dabane par wahi form wapas milta hai,
          bhara hua. Do dialog ek saath dikhane se dono ke header aur footer
          aapas me takra rahe the.
        */
        onNext={isTpo && onNext ? (draft) => {
          setDrawer((current) => ({ ...current, open: false }))
          onNext(draft)
        } : undefined}
        notifyMinor={notifyMinor}
        onNotifyMinorChange={setNotifyMinor}
      />


      {pendingDraft && drawer.editing && (
        <ReviewChangesDialog
          open
          changed={changedSummary(drawer.editing.draft, pendingDraft)}
          diff={diffAudience(drawer.editing.draft.audience, pendingDraft.audience)}
          notifyCount={notifiedFor(pendingDraft)}
          onBack={() => setPendingDraft(null)}
          onSave={(reason: string) => applyEdit(pendingDraft, notifiedFor(pendingDraft), reason)}
        />
      )}

      <SyncDialog open={syncing} onClose={() => setSyncing(false)} />

      <CalendarDialogs
        isTpo={isTpo}
        opened={opened}
        linked={linkedOf(opened)}
        cancelling={cancelling}
        deleting={deleting}
        purging={purging}
        wiping={wiping}
        totalCount={events.length}
        onOpenJobs={() => navigate(`/${role}/jobs`)}
        onOpenEvent={setOpenedId}
        renderActions={
          eventActions
            ? (event, defaults) => eventActions(event, { defaults, close: () => setOpenedId(null), refresh })
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
  )
})

Calendar.displayName = 'Calendar'

export default Calendar
