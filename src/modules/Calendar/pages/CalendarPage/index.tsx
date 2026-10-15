import { useEffect, useMemo, useState } from 'react'
import { addDays, addMonths, addWeeks, endOfWeek, format, startOfWeek, subDays, subMonths, subWeeks } from 'date-fns'
import { CalendarDays, ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import ListView from '../../components/ListView'
import DayGrid from '../../components/DayGrid'
import MonthGrid from '../../components/MonthGrid'
import MiniCalendar from '../../components/MiniCalendar'
import WeekGrid from '../../components/WeekGrid'
import Legend from '../../components/Legend'
import FilterBar from '../../components/FilterBar'
import EventDrawer from '../../components/EventDrawer'
import CancelDialog from '../../components/CancelDialog'
import ConfirmDialog from '../../components/ConfirmDialog'
import EventDetailPanel from '../../components/EventDetailPanel'
import ReviewChangesDialog from '../../components/ReviewChangesDialog'
import { countAudience, diffAudience } from '../../services/audience'
import { deadlineItems } from '../../services/jobs'
import { newDraftOn } from '../../services/tpoEvents'
import { onOpenEventRequest } from '../../services/store'
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
  const [month, setMonth] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState(new Date())
  const [view, setView] = useState<CalendarView>('month')
  const [events, setEvents] = useState<TpoEvent[]>([])
  const [filters, setFilters] = useState<CalendarFilters>(EMPTY_FILTERS)
  const [drawer, setDrawer] = useState<{ open: boolean; draft: EventDraft; editing: TpoEvent | null }>({
    open: false,
    draft: EMPTY_DRAFT,
    editing: null,
  })
  const [pendingDraft, setPendingDraft] = useState<EventDraft | null>(null)
  const [openedId, setOpenedId] = useState<string | null>(null)
  const [cancelling, setCancelling] = useState<TpoEvent | null>(null)
  const [deleting, setDeleting] = useState<TpoEvent | null>(null)
  const [purging, setPurging] = useState<TpoEvent | null>(null)
  const [wiping, setWiping] = useState(false)
  const [toast, setToast] = useState('')

  const isTpo = role === 'tpo'

  useEffect(() => {
    refresh()
    return openCalendarStream(refresh)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => onOpenEventRequest((eventId) => setOpenedId(eventId)), [])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(''), 4000)
    return () => window.clearTimeout(timer)
  }, [toast])

  const refresh = async () => setEvents(await fetchEvents())

  const goBack = () => {
    if (view === 'day') {
      const day = subDays(selectedDay, 1)
      setSelectedDay(day)
      setMonth(day)
      return
    }
    setMonth(view === 'week' ? subWeeks(month, 1) : subMonths(month, 1))
  }

  const goForward = () => {
    if (view === 'day') {
      const day = addDays(selectedDay, 1)
      setSelectedDay(day)
      setMonth(day)
      return
    }
    setMonth(view === 'week' ? addWeeks(month, 1) : addMonths(month, 1))
  }

  const stepName = view === 'day' ? 'day' : view === 'week' ? 'week' : 'month'

  const rangeLabel =
    view === 'day'
      ? format(selectedDay, 'MMMM d, yyyy')
      : view === 'week'
        ? `${format(startOfWeek(month, { weekStartsOn: 1 }), 'd MMM')} – ${format(endOfWeek(month, { weekStartsOn: 1 }), 'd MMM yyyy')}`
        : format(month, 'MMMM yyyy')

  const opened = events.find((event) => event.id === openedId) ?? null

  const visible = useMemo(() => {
    const fromEvents = events
      .filter((event) => (isTpo ? true : event.draft.eventType !== 'my_reminder'))
      .filter((event) => isTpo || event.cancelReason !== 'created_by_mistake')
      .filter((event) => event.createdBy === SIGNED_IN_TPO || event.draft.eventType !== 'my_reminder')
      .filter((event) => !filters.types.length || filters.types.includes(event.draft.eventType))
      .filter((event) => !filters.companies.length || filters.companies.includes(event.draft.company))
      .filter((event) => !filters.createdByMe || event.createdBy === SIGNED_IN_TPO)
      .filter(
        (event) =>
          !filters.courses.length || event.draft.audience.courses.some((course) => filters.courses.includes(course)),
      )
      .filter(
        (event) =>
          !filters.batches.length || event.draft.audience.batches.some((batch) => filters.batches.includes(batch)),
      )
      .filter(
        (event) =>
          !filters.departments.length ||
          event.draft.audience.departments.some((department) => filters.departments.includes(department)),
      )
      .map(itemFromEvent)

    const seeded = filters.createdByMe ? [] : deadlineItems()
    const all = [...seeded, ...fromEvents]

    if (!filters.kinds.length) return all

    return all.filter((item) =>
      item.status === 'cancelled'
        ? filters.kinds.includes('cancelled')
        : filters.kinds.includes(item.kind),
    )
  }, [events, filters, isTpo])

  const openCreate = (eventDate: string) =>
    setDrawer({ open: true, draft: newDraftOn(eventDate), editing: null })

  const openEdit = (event: TpoEvent) => {
    setOpenedId(null)
    setDrawer({ open: true, draft: event.draft, editing: event })
  }

  const notifiedFor = (draft: EventDraft): number =>
    rulesFor(draft.eventType).needsAudience ? countAudience(draft.audience) : 0

  const publish = async (draft: EventDraft) => {
    const created = await createEvent(draft)
    await refresh()
    setDrawer({ open: false, draft: EMPTY_DRAFT, editing: null })
    setToast(
      draft.eventType === 'my_reminder'
        ? 'Reminder saved.'
        : `Event published. ${created.notifiedCount} students notified.`,
    )
  }

  const applyEdit = async (draft: EventDraft, notified: number) => {
    const editing = drawer.editing as TpoEvent
    await updateEvent(editing.id, draft)
    await refresh()
    setDrawer({ open: false, draft: EMPTY_DRAFT, editing: null })
    setPendingDraft(null)
    setToast(notified ? `Changes saved. ${notified} students notified.` : 'Changes saved.')
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

    applyEdit(draft, onlyMinorChanged(drawer.editing.draft, draft) ? 0 : notifiedFor(draft))
  }

  const confirmCancel = async (reason: CancelReason, note: string) => {
    const event = cancelling as TpoEvent
    await cancelEvent(event.id, reason, note)
    await refresh()
    setCancelling(null)
    setOpenedId(null)
    setToast(`Event cancelled. ${event.notifiedCount} students notified.`)
  }

  const confirmWipe = async () => {
    const { count } = await deleteAllEvents()
    await refresh()
    setWiping(false)
    setOpenedId(null)
    setToast(count ? `${count} items deleted permanently.` : 'Nothing to delete.')
  }

  const confirmPurge = async () => {
    const event = purging as TpoEvent
    await deleteReminder(event.id)
    await refresh()
    setPurging(null)
    setOpenedId(null)
    setToast('Event deleted permanently.')
  }

  const confirmDelete = async () => {
    const event = deleting as TpoEvent
    await deleteReminder(event.id)
    await refresh()
    setDeleting(null)
    setOpenedId(null)
    setToast('Reminder deleted.')
  }

  return (
    <div className="flex w-full flex-col gap-[1rem] p-[1.5rem]">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <CalendarDays className="size-5 [color:var(--ds-color-brand)]" />
          <h1 className="text-xl font-semibold">{title}</h1>
        </div>

      </header>

      <div className="flex flex-col gap-4 lg:flex-row">
        <aside className="flex w-full shrink-0 flex-col gap-3 lg:w-[16rem]">
          <MiniCalendar
            month={month}
            selected={selectedDay}
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

        <section className="flex min-w-0 flex-1 flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border px-3 py-2 [background-color:var(--ds-color-bg-surface)]">
            <div className="flex items-center gap-2">
              {isTpo && (
                <Button size="sm" onClick={() => openCreate(format(selectedDay, 'yyyy-MM-dd'))}>
                  <Plus className="size-3.5" />
                  New Event
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setMonth(new Date())
                  setSelectedDay(new Date())
                }}
              >
                Today
              </Button>
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
              <span className="text-base font-semibold">{rangeLabel}</span>
            </div>

            <div className="flex items-center gap-2">
            {isTpo && (
              <Button variant="ghost" size="sm" onClick={() => setWiping(true)}>
                <Trash2 className="size-3.5" />
                Delete all
              </Button>
            )}
            {isTpo && <FilterBar filters={filters} onChange={setFilters} />}
            <div className="flex items-center gap-1 rounded-lg border p-1">
              {VIEWS.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => setView(entry.id)}
                  className={cn(
                    'cursor-pointer rounded-md px-3 py-1 text-sm font-medium transition-colors',
                    view === entry.id
                      ? '[background-color:var(--ds-color-brand)] [color:var(--ds-color-brand-fg)]'
                      : '[color:var(--ds-color-text-secondary)] hover:[background-color:var(--ds-color-bg-muted)]',
                  )}
                >
                  {entry.label}
                </button>
              ))}
            </div>
            </div>
          </div>

          {view === 'day' && (
            <DayGrid
              day={selectedDay}
              items={visible}
              onOpen={(item) => setOpenedId(item.id)}
              onPickDate={isTpo ? (day) => openCreate(format(day, 'yyyy-MM-dd')) : undefined}
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
                if (isTpo) openCreate(format(day, 'yyyy-MM-dd'))
              }}
            />
          )}
          {view === 'list' && <ListView month={month} items={visible} onOpen={(item) => setOpenedId(item.id)} />}
          {view === 'week' && (
            <WeekGrid
              week={month}
              items={visible}
              onOpen={(item) => setOpenedId(item.id)}
              onPickDate={isTpo ? (day) => openCreate(format(day, 'yyyy-MM-dd')) : undefined}
            />
          )}
        </section>
      </div>

      {toast && (
        <div className="fixed bottom-[1.5rem] left-1/2 z-[80] -translate-x-1/2 rounded-[0.5rem] bg-foreground px-[1rem] py-[0.625rem] text-[0.8125rem] font-medium text-white shadow-lg">
          {toast}
        </div>
      )}

      <EventDrawer
        open={drawer.open}
        initial={drawer.draft}
        isEdit={Boolean(drawer.editing)}
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
      />

      {pendingDraft && drawer.editing && (
        <ReviewChangesDialog
          open
          changed={changedSummary(drawer.editing.draft, pendingDraft)}
          diff={diffAudience(drawer.editing.draft.audience, pendingDraft.audience)}
          notifyCount={notifiedFor(pendingDraft)}
          onBack={() => setPendingDraft(null)}
          onSave={() => applyEdit(pendingDraft, notifiedFor(pendingDraft))}
        />
      )}

      <EventDetailPanel
        event={opened}
        onClose={() => setOpenedId(null)}
        onEdit={() => opened && openEdit(opened)}
        onCancel={() => setCancelling(opened)}
        onDelete={() => setDeleting(opened)}
        onDeleteForever={() => setPurging(opened)}
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
