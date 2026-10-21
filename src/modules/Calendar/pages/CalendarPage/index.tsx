import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { addDays, addMonths, addWeeks, endOfWeek, format, startOfWeek, subDays, subMonths, subWeeks } from 'date-fns'
import { CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/modules/Shared/hooks/useIsMobile'
import { messageOf, showError, showInfo, showSuccess } from '@/lib/toast'
import ListView from '../../components/ListView'
import DaysGrid from '../../components/DaysGrid'
import MonthGrid from '../../components/MonthGrid'
import DayJump from '../../components/DayJump'
import MiniCalendar from '../../components/MiniCalendar'
import WeekStrip from '../../components/WeekStrip'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover'
import Legend from '../../components/Legend'
import FilterBar from '../../components/FilterBar'
import EventDrawer from '../../components/EventDrawer'
import CancelDialog from '../../components/CancelDialog'
import ConfirmDialog from '../../components/ConfirmDialog'
import EventDetailPanel from '../../components/EventDetailPanel'
import { CalendarError, CalendarSkeleton } from '../../components/CalendarState'
import ReviewChangesDialog from '../../components/ReviewChangesDialog'
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
import type { CalendarView } from '../../types'
import type { CalendarFilters, CancelReason, EventDraft, TpoEvent } from '../../types/tpo'

const VIEWS: { id: CalendarView; label: string }[] = [
  { id: 'day', label: 'Day' },
  { id: 'week', label: 'Week' },
  { id: 'month', label: 'Month' },
  { id: 'list', label: 'List' },
]

interface CalendarPageProps {
  title?: string
  role?: 'tpo' | 'student'
}

const CalendarPage = ({ title = 'Campus Calendar', role = 'student' }: CalendarPageProps) => {
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const [month, setMonth] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState(new Date())
  const [dayCount, setDayCount] = useState(1)
  const [view, setView] = useState<CalendarView>('month')
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
  const [isLoading, setIsLoading] = useState(true)
  const [loadFailed, setLoadFailed] = useState(false)

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
      showSuccess(
        draft.eventType === 'my_reminder'
          ? 'Reminder saved.'
          : `Event published. ${created.notifiedCount} students notified.`,
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

  const confirmCancel = async (reason: CancelReason, note: string) => {
    const event = cancelling as TpoEvent
    try {
      await cancelEvent(event.id, reason, note)
      await refresh()
      setCancelling(null)
      setOpenedId(null)
      showSuccess(`Event cancelled. ${event.notifiedCount} students notified.`)
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
        <aside className="order-2 flex w-full shrink-0 flex-col gap-3 lg:order-none lg:w-[16rem]">
          <MiniCalendar
            className="hidden lg:block"
            month={month}
            selected={selectedDay}
            rangeStart={view === 'week' ? startOfWeek(month, { weekStartsOn: 1 }) : selectedDay}
            rangeDays={view === 'week' ? 7 : view === 'day' ? dayCount : 1}
            onMonthChange={setMonth}
            onPick={(day) => {
              setSelectedDay(day)
              setMonth(day)
            }}
          />
          <Legend
            selected={filters.kinds}
            onToggle={(kind) =>
              setFilters({
                ...filters,
                kinds: filters.kinds.includes(kind)
                  ? filters.kinds.filter((entry) => entry !== kind)
                  : [...filters.kinds, kind],
              })
            }
          />
        </aside>

        <section className="order-1 flex min-w-0 flex-1 flex-col gap-3 lg:order-none">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border px-2 py-2 [background-color:var(--ds-color-bg-surface)] sm:gap-3 sm:px-3">
            <div className="flex min-w-0 shrink items-center gap-0.5 sm:gap-2">
              <Button
                size="sm"
                className="hidden sm:inline-flex"
                onClick={() =>
                  atReminderLimit
                    ? showInfo(REMINDER_LIMIT_MESSAGE)
                    : openCreate(format(selectedDay, 'yyyy-MM-dd'))
                }
              >
                <Plus className="size-3.5" />
                {isTpo ? 'New Event' : 'Add Reminder'}
              </Button>
              <span className="flex items-center">
                <Button
                  variant="ghost"
                  size="sm"
                  iconOnly
                  aria-label={`Previous ${stepName}`}
                  onClick={() => goBack()}
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  iconOnly
                  aria-label={`Next ${stepName}`}
                  onClick={() => goForward()}
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
                  setSelectedDay(picked)
                  setMonth(picked)
                }}
              />
            </div>

            <div className="contents sm:flex sm:flex-wrap sm:items-center sm:gap-2">
            <span className="ml-auto flex items-center gap-1.5 sm:ml-0 sm:contents">
            {isTpo && (
              <Button variant="outline" size="sm" aria-label="Delete all" onClick={() => setWiping(true)}>
                <Trash2 className="size-4" />
                <span className="hidden sm:inline">Delete all</span>
              </Button>
            )}
            {isTpo && <FilterBar filters={filters} onChange={setFilters} />}
            </span>
            <div className="flex w-full items-center gap-1 rounded-lg border p-1 sm:w-auto">
              {VIEWS.map((entry) =>
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
                          setDayCount(1)
                          setView('day')
                        }}
                        className="cursor-pointer whitespace-nowrap rounded-l-md py-1.5 pl-2.5 pr-1 text-[0.8125rem] font-medium sm:py-1 sm:pl-3 sm:text-sm"
                      >
                        {dayCount === 1 ? 'Day' : isMobile ? `${dayCount}d` : `${dayCount} days`}
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
                            setDayCount(count)
                            setView('day')
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
                    onClick={() => setView(entry.id)}
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
        aria-label={isTpo ? 'New Event' : 'Add Reminder'}
        onClick={() =>
          atReminderLimit ? showInfo(REMINDER_LIMIT_MESSAGE) : openCreate(format(selectedDay, 'yyyy-MM-dd'))
        }
        className="fixed bottom-4 right-4 z-40 grid size-11 cursor-pointer place-items-center rounded-full [background-color:var(--ds-color-brand)] [box-shadow:0_6px_18px_rgba(15,23,42,0.24)] [color:var(--ds-color-brand-fg)] sm:hidden"
      >
        <Plus className="size-5" />
      </button>

      <EventDrawer
        open={drawer.open}
        initial={drawer.draft}
        isEdit={Boolean(drawer.editing)}
        reminderOnly={!isTpo}
        onOpenJob={() => {
          setDrawer({ open: false, draft: EMPTY_DRAFT, editing: null })
          navigate(`/${role}/jobs`)
        }}
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
        dayEntries={events
          .filter((event) => !event.cancelledAt && event.id !== drawer.editing?.id)
          .map((event) => ({
            id: event.id,
            title: event.draft.title,
            eventDate: event.draft.eventDate,
            startTime: event.draft.startTime,
            endTime: event.draft.endTime,
          }))}
        onClose={() => setDrawer({ open: false, draft: EMPTY_DRAFT, editing: null })}
        onSave={save}
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

      <EventDetailPanel
        event={opened}
        linkedEvent={linkedOf(opened)}
        onUpdateReminderDate={opened && linkedOf(opened) ? () => moveReminder(opened) : undefined}
        onOpenJob={() => {
          setOpenedId(null)
          navigate(`/${role}/jobs`)
        }}
        onOpenJobForDeadline={
          !isTpo && opened?.draft.eventType === 'deadline'
            ? () => {
                setOpenedId(null)
                navigate(`/${role}/jobs`)
              }
            : undefined
        }
        onOpenLinked={() => {
          const linked = opened?.draft
          if (!linked?.linkedId) return
          if (linked.linkedType === 'job_deadline') {
            setOpenedId(null)
            navigate(`/${role}/jobs`)
            return
          }
          setOpenedId(linked.linkedId)
        }}
        onClose={() => setOpenedId(null)}
        onEdit={() => opened && openEdit(opened)}
        onCancel={() => setCancelling(opened)}
        onDelete={() => setDeleting(opened)}
        onDeleteForever={() => setPurging(opened)}
        onRemindMe={
          !isTpo &&
          opened &&
          opened.draft.eventType !== 'my_reminder' &&
          opened.draft.eventType !== 'nudge' &&
          opened.appliesToMe &&
          !opened.cancelledAt
            ? () => remindMe(opened)
            : undefined
        }
      />

      <CancelDialog
        open={Boolean(cancelling)}
        title={cancelling?.draft.title ?? ''}
        dateLabel={cancelling?.draft.eventDate ? format(new Date(`${cancelling.draft.eventDate}T00:00:00`), 'd MMM') : ''}
        notifyCount={cancelling?.notifiedCount ?? 0}
        onBack={() => setCancelling(null)}
        onEditDate={() => {
          const event = cancelling as TpoEvent
          setCancelling(null)
          openEdit(event)
        }}
        onConfirm={confirmCancel}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete this reminder?"
        confirmLabel="Delete"
        onBack={() => setDeleting(null)}
        onConfirm={confirmDelete}
      />

      <ConfirmDialog
        open={wiping}
        title={`Delete all ${events.length} events and reminders permanently?`}
        confirmLabel="Delete all"
        onBack={() => setWiping(false)}
        onConfirm={confirmWipe}
      />

      <ConfirmDialog
        open={Boolean(purging)}
        title="Delete this cancelled event permanently?"
        confirmLabel="Delete permanently"
        onBack={() => setPurging(null)}
        onConfirm={confirmPurge}
      />
    </div>
  )
}

export default CalendarPage
