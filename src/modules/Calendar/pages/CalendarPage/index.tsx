import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BellRing, Building2, ExternalLink, Globe, Link2, Tag, Users } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { messageOf, showError, showInfo, showSuccess } from '@/lib/toast'
import { Calendar } from '@/calendar'
import { DetailRow } from '@/modules/Calendar/components/parts'
import { useCalendarEvents } from '../../hooks/useCalendarEvents'
import {
  cancelEvent,
  createEvent,
  deleteAllEvents,
  deleteReminder,
  fetchFeedLink,
  fetchSyncSettings,
  saveSyncSettings,
  imageSrc,
  updateEvent,
} from '../../services/api'
import AudienceDialog from '../../components/AudienceDialog'
import FilterBar from '../../components/FilterBar'
import { format } from 'date-fns'
import { NUDGE_TYPE, REMINDER_TYPE } from '@/calendar'
import { dayEntriesOf, reminderFor } from '@/modules/Calendar/helpers/drafts'
import EventEntryDialog from '../../components/EventEntryDialog'
import PublishEventDialog from '../../components/PublishEventDialog'
import EventDetailModal from '../../components/EventDetailModal'
import CancelEventDialog from '../../components/CancelEventDialog'
import ConfirmDialog from '../../components/ConfirmDialog'
import SyncDialog from '../../components/SyncDialog'
import type { SyncNotice } from '../../components/SyncDialog'
import type { CancelDialogConfig, CancelReasonOption } from '../../components/CancelEventDialog'
import type { CalendarModal } from './CalendarPage.types'
import { onOpenEventRequest, takePendingOpen } from '../../services/openEvent'
import { audienceLine, changedSummary, onlyMinorChanged, rulesFor, timeThere } from '../../helpers/tpo'
import { visibleEvents } from '../../helpers/filters'
import {
  ALLOW_PAST_DATES,
  ASSESSMENT_EMAIL_NOTE,
  CANCEL_REASONS,
  EMPTY_DRAFT,
  EMPTY_FILTERS,
  TPO_DRAFT_DEFAULTS,
  TPO_EVENT_TYPES,
} from '../../constants/tpo'
import { COMPANY_OPTIONS } from '../../constants'
import { CALENDAR_LABELS, MODAL_LABELS } from '../../constants/labels'
import type { CalendarEvent, CalendarNotice, CalendarSyncSettings, EventDraft } from '@/calendar'
import type { CalendarFilters, TpoDraft, TpoEvent } from '../../types/tpo'

interface CalendarPageProps {
  title?: string
  role: 'tpo' | 'student'
}

const hasEnded = (event: TpoEvent): boolean => {
  const { draft } = event
  const lastDay = draft.endDate || draft.eventDate

  return new Date(`${lastDay}T${draft.endTime || draft.startTime || '23:59'}:00`).getTime() < Date.now()
}

// An event's audience can change while it is still ahead, and only by the TPO who made it.
const canChangeAudience = (event: TpoEvent): boolean =>
  event.isOwner &&
  !event.cancelledAt &&
  rulesFor(event.draft.eventType).needsAudience &&
  event.draft.linkedType !== 'job_deadline' &&
  !hasEnded(event)

// "Fill Data" — sample values for a demo, per kind of item.
const fillSample = (draft: EventDraft): Partial<EventDraft> =>
  draft.eventType === 'my_reminder'
    ? { title: 'Call the HR team for results', note: 'Ask about the shortlist date' }
    : { title: 'TCS Campus Drive — Pre-Placement Talk', description: 'Bring your resume and ID card.' }

// What the calendar noticed, in this app's words and toast.
const sayNotice = (notice: CalendarNotice | SyncNotice) => {
  if (notice.type === 'past-date') showInfo('Events and reminders can only be created for today or later.')
  if (notice.type === 'reminder-limit') showInfo(`You've reached ${notice.limit} upcoming reminders. Delete some to add more.`)
  if (notice.type === 'feed-link-copied') showSuccess('Calendar link copied.')
  if (notice.type === 'feed-link-copy-failed') showError('Could not copy. Select the link and copy it by hand.')
}

// The cancel modal's words for this portal; its frame is the calendar's.
const cancelConfig = (event: TpoEvent): CancelDialogConfig => ({
  reasonLabel: 'Why is it cancelled?',
  notePlaceholder: 'Tell the students why',
  editDateHint: 'Only the date changed? Edit it instead — students keep the event.',
  footerStart: event.reach ? `${event.reach} students will be notified` : 'No students are notified',
  notice: null,
})

const reachLine = (reach: number | undefined): string =>
  reach === undefined ? '' : reach > 0 ? ` ${reach} students notified.` : ' It does not reach any students yet.'

/**
 * The app's calendar route. <Calendar /> is the self-contained `src/calendar`
 * package and knows nothing of TPOs, students, jobs or audiences. It runs
 * headless here: it draws the calendar and says what the user asked for
 * (create, view…); every modal is this page's own (`EventModals`), built from
 * the calendar's pieces plus the campus ones — publishing, the audience, the
 * filter, and the rows and buttons of the event view.
 */
const CalendarPage = ({ title = 'Campus Calendar', role }: CalendarPageProps) => {
  const navigate = useNavigate()
  const isTpo = role === 'tpo'
  // Which modal is open — every one of them is this page's, not the calendar's.
  const [modal, setModal] = useState<CalendarModal | null>(null)
  const [audienceFor, setAudienceFor] = useState<TpoEvent | null>(null)
  const [filters, setFilters] = useState<CalendarFilters>(EMPTY_FILTERS)
  const { events, isLoading, loadError, refresh, retry } = useCalendarEvents()

  const shown = useMemo(() => visibleEvents(events, filters, isTpo), [events, filters, isTpo])

  /*
    An item opened from outside — the bell, a dashboard feed, a push — on this
    page or before it was open. The view modal shows it as soon as it is loaded.
  */
  useEffect(() => {
    const waiting = takePendingOpen()
    if (waiting) setModal({ kind: 'view', eventId: waiting })

    return onOpenEventRequest((eventId) => setModal({ kind: 'view', eventId }))
  }, [])

  /*
    Every change goes through the app's API, the list is fetched again, and the
    outcome is said here, in the app's toast — the calendar only learns whether
    it worked, so it can close its dialog or leave it open.
  */
  const andRefresh =
    <Args extends unknown[], Result>(
      call: (...args: Args) => Promise<Result>,
      success?: (result: Result, ...args: Args) => string | null,
    ) =>
    async (...args: Args): Promise<Result> => {
      try {
        const result = await call(...args)
        await refresh()
        const message = success?.(result, ...args)
        if (message) showSuccess(message)
        return result
      } catch (error) {
        showError(messageOf(error))
        throw error
      }
    }

  const isReminderId = (eventId: string) => events.find((event) => event.id === eventId)?.draft.eventType === 'my_reminder'

  const create = andRefresh(
    (draft: EventDraft) => createEvent(draft as TpoDraft),
    (created, draft) =>
      draft.eventType === 'my_reminder'
        ? 'Reminder saved.'
        : `Event published.${draft.recurrence ? ' Every occurrence is on the calendar.' : ''}${reachLine(created.reach)}`,
  )

  const cancel = andRefresh(cancelEvent, (_, eventId, _reason, _note, scope) => {
    if (scope === 'series') return 'This and the later occurrences are cancelled.'
    const reach = events.find((event) => event.id === eventId)?.notifiedCount
    return reach ? `Event cancelled. ${reach} students notified.` : 'Event cancelled.'
  })

  const remove = andRefresh(
    (eventId: string, { scope }: { scope: 'one' | 'series' }) => deleteReminder(eventId, scope),
    (_, eventId, { scope }) =>
      !isReminderId(eventId)
        ? 'Event deleted permanently.'
        : scope === 'series'
          ? 'Reminder and its later dates deleted.'
          : 'Reminder deleted.',
  )

  const removeAll = andRefresh(deleteAllEvents, ({ count }) =>
    count ? `${count} items deleted permanently.` : 'Nothing to delete.',
  )

  const feedLink = () =>
    fetchFeedLink().catch((error) => {
      showError(messageOf(error))
      throw error
    })

  const syncSettings = () =>
    fetchSyncSettings().catch((error) => {
      showError(messageOf(error))
      throw error
    })

  const changeSyncSettings = (settings: CalendarSyncSettings) =>
    saveSyncSettings(settings).catch((error) => {
      showError(messageOf(error))
      throw error
    })

  /*
    The calendar says only whether the user ticked "Notify about this change".
    Which changes always notify — the date, the venue, the audience — and what
    the students are told is the TPO's rule, so it is applied here.
  */
  const update = andRefresh(
    async (eventId: string, draft: EventDraft, { notify }: { notify: boolean }) => {
      const before = events.find((event) => event.id === eventId)
      const next = draft as TpoDraft
      const minorOnly = before ? onlyMinorChanged(before.draft, next) : false

      return updateEvent(eventId, {
        ...next,
        changeSummary: before ? changedSummary(before.draft, next) : '',
        notifyOnChange: !minorOnly || notify,
      })
    },
    (_, __, draft) => (draft.eventType === 'my_reminder' ? 'Reminder updated.' : 'Changes saved.'),
  )

  const goToJobs = (close: () => void) => {
    close()
    navigate(`/${role}/jobs`)
  }

  const eventActions = (event: TpoEvent, defaults: React.ReactNode, close: () => void) => {
    const { eventType, linkedType } = event.draft

    // A student opens the job behind a deadline, or behind a nudge about one.
    if (!isTpo && (eventType === 'deadline' || (eventType === 'nudge' && linkedType === 'job_deadline'))) {
      return (
        <>
          {defaults}
          <Button onClick={() => goToJobs(close)}>View &amp; Apply</Button>
        </>
      )
    }

    if (!isTpo || !canChangeAudience(event)) return defaults

    return (
      <>
        <Button
          variant="outline"
          onClick={() => {
            close()
            setAudienceFor(event)
          }}
        >
          <Users className="size-4" />
          {event.draft.audience.courses.length ? 'Audience' : 'Choose audience'}
        </Button>
        {defaults}
      </>
    )
  }

  // The panel rows only a campus event has.
  const eventDetails = (calendarEvent: CalendarEvent) => {
    const event = calendarEvent as TpoEvent
    const { draft } = event
    const rules = rulesFor(draft.eventType)
    const isAutoDeadline = draft.eventType === 'deadline' && draft.linkedType === 'job_deadline'
    const hasAudience = draft.audience.courses.length > 0
    const showsAudience = rules.needsAudience && !isAutoDeadline && draft.eventType !== 'nudge'
    const there = draft.eventType === 'nudge' ? null : timeThere(draft)

    return (
      <>
        {there && (
          <DetailRow icon={Globe} label={draft.eventType === 'my_reminder' ? 'Set for' : 'Campus time'}>
            {there}
          </DetailRow>
        )}

        {/* "Other" alone says nothing — the TPO's own name for it does. */}
        {draft.eventType === 'other' && draft.otherType && (
          <DetailRow icon={Tag} label="Event type">
            {draft.otherType}
          </DetailRow>
        )}

        {draft.company && (
          <DetailRow icon={Building2} label="Company">
            {draft.company}
          </DetailRow>
        )}

        {isAutoDeadline && event.deadlineCounts && (
          <DetailRow icon={Users} label="Students">
            {`${event.deadlineCounts.eligible} eligible · ${event.deadlineCounts.applied} applied · ${event.deadlineCounts.not_applied} not applied`}
          </DetailRow>
        )}

        {showsAudience && (
          <DetailRow icon={Users} label="Audience">
            {hasAudience ? audienceLine(draft) : 'Not chosen yet'}
          </DetailRow>
        )}
        {showsAudience && (
          <DetailRow icon={BellRing} label="Notified">
            {`${event.notifiedCount} students`}
          </DetailRow>
        )}

        {isTpo && event.isOwner && showsAudience && !hasAudience && !event.cancelledAt && (
          <p className="rounded-md px-3 py-2 text-sm [background-color:var(--ds-color-warning-subtle)] [color:var(--ds-color-warning-text)]">
            Published, but no students see it yet. Choose who it reaches.
          </p>
        )}

        {draft.eventType === 'online_assessment' && !event.isOwner && (
          <p className="rounded-md px-3 py-2 text-sm [background-color:var(--ds-color-info-subtle)] [color:var(--ds-color-info)]">
            {ASSESSMENT_EMAIL_NOTE}
          </p>
        )}

        {draft.linkedJob && (
          <DetailRow icon={Link2} label="Linked job">
            {draft.linkedJob.kind === 'campus' ? (
              draft.linkedJob.campusJob
            ) : (
              <span className="flex flex-wrap items-center gap-2">
                {draft.linkedJob.title}
                <Button asChild variant="link" className="h-auto gap-1 p-0 text-sm">
                  <a href={draft.linkedJob.url} target="_blank" rel="noreferrer">
                    Open job
                    <ExternalLink className="size-3.5" />
                  </a>
                </Button>
              </span>
            )}
          </DetailRow>
        )}
      </>
    )
  }

  // ── The modals: every one is this page's own, opened from the calendar's callbacks ──
  const [notifyMinor, setNotifyMinor] = useState(false)
  const close = () => setModal(null)

  // An API call that, once it worked, closes the modal. On failure the app has
  // already shown the error, and the modal stays open with what was filled in.
  const then = (work: Promise<unknown>) =>
    work.then(
      () => close(),
      () => undefined,
    )

  const byId = (eventId?: string | null) => events.find((event) => event.id === eventId) ?? null
  const isReminder = (event: TpoEvent | null) => event?.draft.eventType === REMINDER_TYPE

  const save = (draft: EventDraft, editing: TpoEvent | null) =>
    then(editing ? update(editing.id, draft, { notify: notifyMinor }) : create(draft))

  const openEdit = (event: TpoEvent, draft: TpoDraft = event.draft) => {
    setNotifyMinor(false)
    setModal({ kind: 'entry', draft, editing: event })
  }

  // ── View ────────────────────────────────────────────────────────────
  const viewed = modal?.kind === 'view' ? byId(modal.eventId) : null
  const linked =
    viewed && viewed.draft.linkedType === 'event' && viewed.draft.linkedId ? byId(viewed.draft.linkedId) : null
  const canRemind =
    !isTpo &&
    viewed &&
    !isReminder(viewed) &&
    viewed.draft.eventType !== NUDGE_TYPE &&
    viewed.appliesToMe &&
    !viewed.cancelledAt

  // ── First step (the calendar's generic form) and the second (this portal's) ──
  const entry = modal?.kind === 'entry' ? modal : null
  const publish = modal?.kind === 'publish' ? modal : null
  const editing = entry?.editing ?? publish?.editing ?? null

  // ── Cancel / delete ─────────────────────────────────────────────────
  const cancelling = modal?.kind === 'cancel' ? modal : null
  const deleting = modal?.kind === 'delete' ? modal : null
  const reasons: CancelReasonOption[] = CANCEL_REASONS

  return (
    <>
      {/* The calendar only draws and tells; every modal below and every API call is this page's own. */}
      <Calendar
        title={title}
        labels={CALENDAR_LABELS}
        permissions={{ createEvents: isTpo }}
        allowPastDates={ALLOW_PAST_DATES}
        eventTypes={TPO_EVENT_TYPES}
        draftDefaults={TPO_DRAFT_DEFAULTS}
        events={shown}
        isLoading={isLoading}
        loadError={loadError}
        onRetry={retry}
        onNotice={sayNotice}
        onViewEvent={(event) => setModal({ kind: 'view', eventId: event.id })}
        onCreateRequest={(draft) => setModal({ kind: 'entry', draft: draft as TpoDraft, editing: null })}
        onDeleteAllRequest={isTpo ? () => setModal({ kind: 'deleteAll' }) : undefined}
        onSyncRequest={() => setModal({ kind: 'sync' })}
        toolbarExtras={
          isTpo ? <FilterBar filters={filters} companies={COMPANY_OPTIONS} onChange={setFilters} /> : undefined
        }
      />

      <EventDetailModal
        event={viewed}
        eventTypes={TPO_EVENT_TYPES}
        linkedEvent={linked}
        renderDetails={eventDetails}
        resolveImageUrl={imageSrc}
        onClose={close}
        onOpenLinked={() => linked && setModal({ kind: 'view', eventId: linked.id })}
        onUpdateReminderDate={
          viewed && linked
            ? () =>
                void update(
                  viewed.id,
                  {
                    ...viewed.draft,
                    eventDate: linked.draft.eventDate,
                    endDate: linked.draft.eventDate,
                    startTime: linked.draft.startTime || viewed.draft.startTime,
                  },
                  { notify: false },
                ).catch(() => undefined)
            : undefined
        }
        onEdit={() => viewed && openEdit(viewed)}
        onCancel={() => viewed && setModal({ kind: 'cancel', event: viewed, back: modal })}
        onDelete={() => viewed && setModal({ kind: 'delete', event: viewed, mode: 'reminder', back: modal })}
        onDeleteForever={() => viewed && setModal({ kind: 'delete', event: viewed, mode: 'cancelled', back: modal })}
        onRemindMe={canRemind && viewed ? () => setModal({ kind: 'entry', draft: reminderFor(viewed, EMPTY_DRAFT), editing: null }) : undefined}
        renderActions={viewed ? (defaults) => eventActions(viewed, defaults, close) : undefined}
      />

      <EventEntryDialog
        open={Boolean(entry)}
        initial={entry?.draft ?? EMPTY_DRAFT}
        isEdit={Boolean(entry?.editing)}
        reminderOnly={!isTpo}
        allowPastDates={ALLOW_PAST_DATES}
        eventTypes={TPO_EVENT_TYPES}
        audienceNoun="students"
        fillSample={fillSample}
        notifyCount={entry?.editing?.reach ?? 0}
        notifyMinor={notifyMinor}
        onNotifyMinorChange={setNotifyMinor}
        dayEntries={dayEntriesOf(events, editing?.id)}
        canCancelEvent={Boolean(editing && editing.isOwner && !editing.cancelledAt && !isReminder(editing))}
        canDeleteReminder={Boolean(editing && editing.isOwner && isReminder(editing))}
        onCancelEvent={(draft) =>
          entry?.editing &&
          setModal({ kind: 'cancel', event: entry.editing, back: { ...entry, draft: draft as TpoDraft } })
        }
        onDeleteReminder={(draft) =>
          entry?.editing &&
          setModal({ kind: 'delete', event: entry.editing, mode: 'reminder', back: { ...entry, draft: draft as TpoDraft } })
        }
        onClose={close}
        onSave={(draft) => save(draft, entry?.editing ?? null)}
        // Only a TPO has a second step; a student's reminder saves here.
        onNext={isTpo ? (draft) => entry && setModal({ kind: 'publish', draft: draft as TpoDraft, editing: entry.editing }) : undefined}
      />

      <PublishEventDialog
        open={Boolean(publish)}
        initial={publish?.draft ?? EMPTY_DRAFT}
        isEdit={Boolean(publish?.editing)}
        dayEntries={dayEntriesOf(events, editing?.id)}
        onBack={(draft) => publish && setModal({ kind: 'entry', draft, editing: publish.editing })}
        onClose={close}
        onSave={(draft) => save(draft, publish?.editing ?? null)}
      />

      <CancelEventDialog
        open={Boolean(cancelling)}
        event={cancelling?.event ?? null}
        dateLabel={cancelling ? format(new Date(`${cancelling.event.draft.eventDate}T00:00:00`), 'd MMM') : ''}
        notifyCount={cancelling?.event.reach ?? 0}
        isRecurring={Boolean(cancelling?.event.seriesId)}
        reasons={reasons}
        audienceNoun="students"
        config={cancelling ? cancelConfig(cancelling.event) : undefined}
        onBack={() => setModal(cancelling?.back ?? null)}
        // From the edit modal: back to it as it was left. From anywhere else: open the edit.
        onEditDate={() =>
          cancelling &&
          (cancelling.back?.kind === 'entry' ? setModal(cancelling.back) : openEdit(cancelling.event))
        }
        onConfirm={(reason, note, scope) => cancelling && then(cancel(cancelling.event.id, reason, note, scope))}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        title={
          deleting?.mode === 'cancelled'
            ? 'Delete this cancelled event permanently?'
            : deleting?.event.seriesId
              ? 'Delete this repeating reminder?'
              : 'Delete this reminder?'
        }
        confirmLabel={
          deleting?.mode === 'cancelled'
            ? MODAL_LABELS.confirmDialog.deletePermanently
            : MODAL_LABELS.confirmDialog.delete
        }
        onBack={() => setModal(deleting?.back ?? null)}
        onConfirm={() => deleting && then(remove(deleting.event.id, { scope: 'one' }))}
        alternateLabel={
          deleting?.mode === 'reminder' && deleting.event.seriesId
            ? MODAL_LABELS.confirmDialog.deleteRepeatsToo
            : undefined
        }
        onAlternate={() => deleting && then(remove(deleting.event.id, { scope: 'series' }))}
      />

      <ConfirmDialog
        open={modal?.kind === 'deleteAll'}
        title={`Delete all ${events.length} events and reminders permanently?`}
        confirmLabel={MODAL_LABELS.confirmDialog.deleteAll}
        onBack={close}
        onConfirm={() => then(removeAll())}
      />

      <SyncDialog
        open={modal?.kind === 'sync'}
        calendarName={title}
        getFeedLink={feedLink}
        getSyncSettings={syncSettings}
        onSyncSettingsChange={changeSyncSettings}
        onNotice={sayNotice}
        onClose={close}
      />

      <AudienceDialog
        event={audienceFor}
        onClose={() => setAudienceFor(null)}
        onSaved={() => {
          setAudienceFor(null)
          refresh()
        }}
      />
    </>
  )
}

export default CalendarPage
