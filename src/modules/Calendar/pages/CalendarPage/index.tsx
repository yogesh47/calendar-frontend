import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BellRing, Building2, ExternalLink, Globe, Link2, Users } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { messageOf, showError, showInfo, showSuccess } from '@/lib/toast'
import { Calendar, DetailRow } from '@/calendar'
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
import PublishEventDialog from '../../components/PublishEventDialog'
import { audienceLine, changedSummary, onlyMinorChanged, rulesFor, timeThere } from '../../helpers/tpo'
import { visibleEvents } from '../../helpers/filters'
import {
  ASSESSMENT_EMAIL_NOTE,
  CANCEL_REASONS,
  EMPTY_DRAFT,
  EMPTY_FILTERS,
  TPO_DRAFT_DEFAULTS,
  TPO_EVENT_TYPES,
} from '../../constants/tpo'
import { COMPANY_OPTIONS } from '../../constants'
import { CALENDAR_LABELS } from '../../constants/labels'
import type {
  CalendarEvent,
  CalendarHandle,
  CalendarNotice,
  CalendarSyncSettings,
  DayEntry,
  EventActionContext,
  EventDraft,
} from '@/calendar'
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
const sayNotice = (notice: CalendarNotice) => {
  if (notice.type === 'reminder-limit') showInfo(`You've reached ${notice.limit} upcoming reminders. Delete some to add more.`)
  if (notice.type === 'feed-link-copied') showSuccess('Calendar link copied.')
  if (notice.type === 'feed-link-copy-failed') showError('Could not copy. Select the link and copy it by hand.')
}

const reachLine = (reach: number | undefined): string =>
  reach === undefined ? '' : reach > 0 ? ` ${reach} students notified.` : ' It does not reach any students yet.'

/**
 * The app's calendar route. <Calendar /> is the self-contained `src/calendar`
 * package and knows nothing of TPOs, students, jobs or audiences. This page
 * hands it the data, the event types and the permissions, and adds everything
 * campus-specific around it: publishing, the audience, the filter, and the rows
 * and buttons in the event panel.
 */
const CalendarPage = ({ title = 'Campus Calendar', role }: CalendarPageProps) => {
  const navigate = useNavigate()
  const calendar = useRef<CalendarHandle>(null)
  const isTpo = role === 'tpo'
  const [publishing, setPublishing] = useState<TpoDraft | null>(null)
  const [dayEntries, setDayEntries] = useState<DayEntry[]>([])
  const [audienceFor, setAudienceFor] = useState<TpoEvent | null>(null)
  const [filters, setFilters] = useState<CalendarFilters>(EMPTY_FILTERS)
  const { events, isLoading, loadError, refresh, retry } = useCalendarEvents()

  const shown = useMemo(() => visibleEvents(events, filters, isTpo), [events, filters, isTpo])

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

  const eventActions = (calendarEvent: CalendarEvent, { defaults, close }: EventActionContext) => {
    const event = calendarEvent as TpoEvent
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

  return (
    <>
      <Calendar
        ref={calendar}
        title={title}
        labels={CALENDAR_LABELS}
        permissions={{ createEvents: isTpo }}
        eventTypes={TPO_EVENT_TYPES}
        draftDefaults={TPO_DRAFT_DEFAULTS}
        cancelReasons={CANCEL_REASONS}
        audienceNoun="students"
        fillSample={fillSample}
        events={shown}
        isLoading={isLoading}
        loadError={loadError}
        onRetry={retry}
        onCreate={create}
        onUpdate={update}
        onCancel={cancel}
        onDelete={remove}
        onDeleteAll={isTpo ? removeAll : undefined}
        getFeedLink={feedLink}
        getSyncSettings={syncSettings}
        onSyncSettingsChange={changeSyncSettings}
        resolveImageUrl={imageSrc}
        onNotice={sayNotice}
        onNext={(draft) => setPublishing(draft as TpoDraft)}
        onDayEntries={setDayEntries}
        eventActions={eventActions}
        renderEventDetails={eventDetails}
        toolbarExtras={
          isTpo ? <FilterBar filters={filters} companies={COMPANY_OPTIONS} onChange={setFilters} /> : undefined
        }
      />

      <PublishEventDialog
        open={Boolean(publishing)}
        initial={publishing ?? EMPTY_DRAFT}
        isEdit={false}
        dayEntries={dayEntries}
        /* Back — ye band, aur calendar ka modal wahi draft le kar wapas. */
        onBack={() => {
          const draft = publishing
          setPublishing(null)
          if (draft) calendar.current?.openEntry(draft)
        }}
        onClose={() => {
          setPublishing(null)
          calendar.current?.closeEntry()
        }}
        onSave={(draft) => {
          setPublishing(null)
          calendar.current?.save(draft)
        }}
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
