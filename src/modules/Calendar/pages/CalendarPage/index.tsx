import { useEffect, useMemo, useState } from 'react'
import { addMonths, addWeeks, endOfWeek, format, startOfWeek, subMonths, subWeeks } from 'date-fns'
import { CalendarDays, ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import ListView from '../../components/ListView'
import MonthGrid from '../../components/MonthGrid'
import WeekGrid from '../../components/WeekGrid'
import Legend from '../../components/Legend'
import FilterBar from '../../components/FilterBar'
import EventDrawer from '../../components/EventDrawer'
import CancelDialog from '../../components/CancelDialog'
import ConfirmDialog from '../../components/ConfirmDialog'
import EventDetailPanel from '../../components/EventDetailPanel'
import ReviewChangesDialog from '../../components/ReviewChangesDialog'
import { fetchCalendarItems } from '../../services'
import { countAudience, diffAudience } from '../../services/audience'
import { deadlineItems } from '../../services/jobs'
import { newDraftOn } from '../../services/tpoEvents'
import { onOpenEventRequest } from '../../services/store'
import { cancelEvent, createEvent, deleteReminder, fetchEvents, openCalendarStream, updateEvent } from '../../services/api'
import { changedSummary, itemFromEvent, onlyMinorChanged, rulesFor } from '../../helpers/tpo'
import { EMPTY_DRAFT, EMPTY_FILTERS, SIGNED_IN_TPO } from '../../constants/tpo'
import type { CalendarItem, CalendarView } from '../../types'
import type { CalendarFilters, CancelReason, EventDraft, TpoEvent } from '../../types/tpo'

const VIEWS: { id: CalendarView; label: string }[] = [
  { id: 'month', label: 'Month' },
  { id: 'week', label: 'Week' },
  { id: 'list', label: 'List' },
]

interface CalendarPageProps {
  title?: string
  role?: 'tpo' | 'student'
  onSignOut?: () => void
}

const CalendarPage = ({ title = 'Campus Calendar', role = 'student', onSignOut }: CalendarPageProps) => {
  const [month, setMonth] = useState(new Date())
  const [view, setView] = useState<CalendarView>('month')
  const [items, setItems] = useState<CalendarItem[]>([])
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
  const [toast, setToast] = useState('')

  const isTpo = role === 'tpo'

  useEffect(() => {
    fetchCalendarItems().then(setItems)
  }, [])

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

    const seeded = filters.createdByMe ? [] : [...(isTpo ? [] : items), ...deadlineItems()]
    const all = [...seeded, ...fromEvents]

    return filters.kinds.length ? all.filter((item) => filters.kinds.includes(item.kind)) : all
  }, [events, items, filters, isTpo])

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
      <header className="flex flex-wrap items-center justify-between gap-[0.75rem]">
        <div className="flex items-center gap-[0.5rem]">
          <CalendarDays className="size-[1.25rem] text-brand" />
          <h1 className="text-[1.25rem] font-semibold">{title}</h1>
        </div>

        <div className="flex items-center gap-[0.5rem]">
          {isTpo && (
            <Button size="sm" onClick={() => openCreate('')}>
              <Plus className="size-[0.875rem]" />
              New Event
            </Button>
          )}
          <Button variant="outline" size="icon" aria-label="Previous month"
            onClick={() => setMonth(view === 'week' ? subWeeks(month, 1) : subMonths(month, 1))}>
            <ChevronLeft className="size-[1rem]" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setMonth(new Date())}>
            Today
          </Button>
          <Button variant="outline" size="icon" aria-label="Next month"
            onClick={() => setMonth(view === 'week' ? addWeeks(month, 1) : addMonths(month, 1))}>
            <ChevronRight className="size-[1rem]" />
          </Button>
          <span className="min-w-[12rem] text-center text-sm font-semibold">
            {view === 'week'
              ? `${format(startOfWeek(month, { weekStartsOn: 1 }), 'd MMM')} – ${format(endOfWeek(month, { weekStartsOn: 1 }), 'd MMM yyyy')}`
              : format(month, 'MMMM yyyy')}
          </span>
          {onSignOut && (
            <Button variant="ghost" size="sm" onClick={onSignOut}>
              Sign out
            </Button>
          )}
        </div>
      </header>

      <div className="flex items-center gap-[0.25rem] self-start rounded-[0.5rem] border bg-card p-[0.25rem]">
        {VIEWS.map((entry) => (
          <button
            key={entry.id}
            type="button"
            onClick={() => setView(entry.id)}
            className={cn(
              'rounded-[0.375rem] px-[0.75rem] py-[0.25rem] text-[0.8125rem] font-medium transition-colors',
              view === entry.id ? 'bg-brand text-brand-foreground' : 'text-muted-foreground hover:bg-muted',
            )}
          >
            {entry.label}
          </button>
        ))}
      </div>

      {isTpo && <FilterBar filters={filters} onChange={setFilters} />}

      {view === 'month' && (
        <MonthGrid
          month={month}
          items={visible}
          onOpen={(item) => setOpenedId(item.id)}
          onPickDate={isTpo ? (day) => openCreate(format(day, 'yyyy-MM-dd')) : undefined}
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

      <Legend />

      {toast && (
        <div className="fixed bottom-[1.5rem] left-1/2 z-[80] -translate-x-1/2 rounded-[0.5rem] bg-foreground px-[1rem] py-[0.625rem] text-[0.8125rem] font-medium text-white shadow-lg">
          {toast}
        </div>
      )}

      <EventDrawer
        open={drawer.open}
        initial={drawer.draft}
        isEdit={Boolean(drawer.editing)}
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
    </div>
  )
}

export default CalendarPage
