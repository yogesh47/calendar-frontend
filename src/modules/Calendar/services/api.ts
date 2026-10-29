import { API_BASE_URL } from '@/modules/Auth/constants'
import { readSession } from '@/modules/Auth/services'
import axiosInstance from '@/api/axiosInstance'
import { browserZone, instantIn, wallClockIn } from '@/lib/timeZone'
import type { WallClock } from '@/lib/timeZone'
import type { CalendarSyncSettings } from '@/calendar'
import { CANCEL_REASON_LABEL, EMPTY_DRAFT } from '../constants/tpo'
import { rulesFor } from '../helpers/tpo'
import type { Audience, CancelReason, TpoDraft, TpoEvent } from '../types/tpo'

export type ApiNotification = {
  notification_id: string
  event_id: string
  message: string
  created_at: string
  is_read: boolean
  kind: string
}

type ApiEvent = {
  event_id: string
  event_type: string
  title: string
  company: string | null
  event_date: string
  end_date: string | null
  start_time: string | null
  end_time: string | null
  mode: string | null
  venue: string | null
  online_platform: string | null
  description: string | null
  note: string | null
  status: string
  cancel_reason: string | null
  cancel_note: string | null
  cancelled_at: string | null
  created_by: string
  created_by_name: string
  created_at: string
  updated_at: string
  notified_count: number
  audience: {
    opportunity_type: string
    courses: string[]
    batches: number[]
    departments: string[]
  } | null
  linked_job: { kind: string; campus_job: string | null; url: string | null; title: string | null } | null
  remind_before: string | null
  linked_type: string | null
  linked_id: string | null
  is_owner: boolean
  applies_to_me: boolean
  removed_reason: string | null
  change_summary: string | null
  change_reason: string | null
  deadline_counts: { eligible: number; applied: number; not_applied: number } | null
  series_id?: string | null
  recurrence?: string | null
  image_url?: string | null
  /** The same start and end as instants (UTC), and the zone the times were typed in. */
  starts_at?: string | null
  ends_at?: string | null
  time_zone?: string | null
}

// Every call goes through the app's axios client: token, errors and sign-out live there.
const ask = async <T,>(path: string, init: { method?: 'GET' | 'POST' | 'PUT' | 'DELETE'; data?: unknown } = {}): Promise<T> =>
  (await axiosInstance.request<T>({ url: path, method: init.method ?? 'GET', data: init.data })).data

// "Offline · Hall A", "Online · Zoom", or a meeting link as it is.
const locationOf = (entry: ApiEvent): string | undefined => {
  if (entry.mode === 'offline' && entry.venue) return `Offline · ${entry.venue}`
  if (entry.mode === 'online' && entry.online_platform) {
    return /^https?:\/\//.test(entry.online_platform) ? entry.online_platform : `Online · ${entry.online_platform}`
  }

  return undefined
}

const cancelNoteOf = (entry: ApiEvent): string | undefined => {
  const label = entry.cancel_reason ? CANCEL_REASON_LABEL[entry.cancel_reason as CancelReason] : ''
  const note = [label, entry.cancel_note].filter(Boolean).join(' — ')

  return note || undefined
}

/*
  Times on screen are always the browser's own. The API sends each timed item's
  instants, so a London viewer sees a Sydney campus's 10 AM as their 11 PM; on the
  way back the browser's times are turned into the item's own zone again.
*/
const browserClock = (moment: Date): WallClock => ({
  day: `${moment.getFullYear()}-${String(moment.getMonth() + 1).padStart(2, '0')}-${String(moment.getDate()).padStart(2, '0')}`,
  time: `${String(moment.getHours()).padStart(2, '0')}:${String(moment.getMinutes()).padStart(2, '0')}`,
})

const shownTimes = (entry: ApiEvent) => {
  if (!entry.start_time || !entry.starts_at) {
    return {
      eventDate: entry.event_date,
      endDate: entry.end_date ?? entry.event_date,
      startTime: entry.start_time ?? '',
      endTime: entry.end_time ?? '',
    }
  }

  const start = browserClock(new Date(entry.starts_at))
  const end = entry.ends_at ? browserClock(new Date(entry.ends_at)) : null

  return { eventDate: start.day, endDate: end?.day ?? start.day, startTime: start.time, endTime: end?.time ?? '' }
}

/** The zone a new item's times are kept in: a reminder is the user's own, an event is the campus's. */
const zoneFor = (draft: TpoDraft): string =>
  draft.timeZone ||
  (draft.eventType === 'my_reminder' ? browserZone() : readSession()?.user.org_time_zone || browserZone())

// The browser's date and time as the same instant on a clock in `zone`.
const inZone = (day: string, time: string, zone: string): WallClock =>
  wallClockIn(instantIn(day, time, browserZone()), zone)

// The API's event, in the calendar's shape plus the TPO's own fields.
const toEvent = (entry: ApiEvent): TpoEvent => ({
  id: entry.event_id,
  isOwner: entry.is_owner,
  // Who it reaches — reminders reach nobody but their owner, so they carry none.
  reach: entry.event_type === 'my_reminder' || entry.event_type === 'nudge' ? undefined : entry.notified_count,
  location: locationOf(entry),
  notifiedCount: entry.notified_count,
  createdBy: entry.is_owner ? 'me' : entry.created_by,
  createdByName: entry.is_owner ? 'you' : entry.created_by_name,
  createdAt: entry.created_at,
  updatedAt: entry.updated_at > entry.created_at ? entry.updated_at : undefined,
  cancelledAt: entry.cancelled_at ?? undefined,
  cancelReason: (entry.cancel_reason as TpoEvent['cancelReason']) ?? undefined,
  cancelNote: cancelNoteOf(entry),
  appliesToMe: entry.applies_to_me,
  removedReason: entry.removed_reason ?? undefined,
  changeSummary: entry.change_summary ?? undefined,
  changeReason: entry.change_reason ?? undefined,
  deadlineCounts: entry.deadline_counts ?? undefined,
  seriesId: entry.series_id ?? undefined,
  recurrence: entry.recurrence ?? undefined,
  draft: {
    ...EMPTY_DRAFT,
    eventType: entry.event_type as TpoDraft['eventType'],
    title: entry.title,
    company: entry.company ?? '',
    ...shownTimes(entry),
    timeZone: entry.time_zone ?? undefined,
    mode: (entry.mode as TpoDraft['mode']) ?? '',
    venue: entry.venue ?? '',
    onlinePlatform: entry.online_platform ?? '',
    description: entry.description ?? '',
    note: entry.note ?? '',
    audience: entry.audience
      ? {
          opportunityType: entry.audience.opportunity_type as TpoDraft['audience']['opportunityType'],
          courses: entry.audience.courses,
          batches: entry.audience.batches,
          departments: entry.audience.departments,
        }
      : EMPTY_DRAFT.audience,
    remindBefore: (entry.remind_before as TpoDraft['remindBefore']) ?? 'none',
    linkedType: entry.linked_type ?? null,
    linkedId: entry.linked_id ?? null,
    imageUrl: entry.image_url ?? '',
    linkedJob: entry.linked_job
      ? {
          kind: entry.linked_job.kind as 'campus' | 'external',
          campusJob: entry.linked_job.campus_job ?? '',
          url: entry.linked_job.url ?? '',
          title: entry.linked_job.title ?? '',
        }
      : null,
  },
})

// The draft's dates and times, moved from the browser's clock to the item's zone.
// An all-day item has no clock, so its dates go as they are.
const timesFor = (draft: TpoDraft, zone: string) => {
  const endDay = draft.endDate || draft.eventDate
  if (!draft.startTime) {
    return { event_date: draft.eventDate, end_date: endDay, start_time: null, end_time: null }
  }

  const start = inZone(draft.eventDate, draft.startTime, zone)
  const end = draft.endTime ? inZone(endDay, draft.endTime, zone) : null

  return { event_date: start.day, end_date: end?.day ?? start.day, start_time: start.time, end_time: end?.time ?? null }
}

const toPayload = (draft: TpoDraft) => ({
  event_type: draft.eventType,
  title: draft.title,
  company: draft.company || null,
  ...timesFor(draft, zoneFor(draft)),
  time_zone: zoneFor(draft),
  // An online test or a deadline has no mode — not even the form's default.
  mode: rulesFor(draft.eventType).needsMode ? draft.mode || null : null,
  venue: draft.venue || null,
  online_platform: draft.onlinePlatform || null,
  description: draft.description || null,
  note: draft.note || null,
  // The audience is picked after publishing, so an event goes out without one
  // until then — an empty selection is "not chosen yet", not "nobody".
  audience:
    draft.eventType === 'my_reminder' || !draft.audience.courses.length
      ? null
      : {
          opportunity_type: draft.audience.opportunityType,
          courses: draft.audience.courses,
          batches: draft.audience.batches,
          departments: draft.audience.departments,
        },
  remind_before: draft.remindBefore,
  linked_type: draft.linkedType,
  linked_id: draft.linkedId,
  change_summary: draft.changeSummary || null,
  change_reason: draft.changeReason || null,
  notify_on_change: draft.notifyOnChange ?? true,
  recurrence: draft.recurrence,
  image_url: draft.imageUrl || null,
  linked_job: draft.linkedJob
    ? {
        kind: draft.linkedJob.kind,
        campus_job: draft.linkedJob.campusJob || null,
        url: draft.linkedJob.url || null,
        title: draft.linkedJob.title || null,
      }
    : null,
})

export const fetchEvents = (): Promise<TpoEvent[]> =>
  share('events', async () => (await ask<ApiEvent[]>('/calendar/events')).map(toEvent))

export const applyToJob = (jobId: string): Promise<{ application_id: string }> =>
  ask<{ application_id: string }>(`/calendar/jobs/${jobId}/apply`, { method: 'POST' })

export const fetchComingUp = async (limit = 3): Promise<TpoEvent[]> =>
  (await ask<ApiEvent[]>(`/calendar/coming-up?limit=${limit}`)).map(toEvent)

// No separate call on the web — the count comes from the same list the bell uses.
export const fetchUnreadCount = async (): Promise<number> =>
  (await fetchNotifications()).filter((entry) => !entry.is_read).length

export const createEvent = async (draft: TpoDraft): Promise<TpoEvent> =>
  toEvent(await ask<ApiEvent>('/calendar/events', { method: 'POST', data: (toPayload(draft)) }))

export const updateEvent = async (eventId: string, draft: TpoDraft): Promise<TpoEvent> =>
  toEvent(
    await ask<ApiEvent>(`/calendar/events/${eventId}`, { method: 'PUT', data: (toPayload(draft)) }),
  )

export const cancelEvent = async (
  eventId: string,
  reason: string,
  note: string,
  scope: 'one' | 'series' = 'one',
): Promise<TpoEvent> =>
  toEvent(
    await ask<ApiEvent>(`/calendar/events/${eventId}/cancel`, {
      method: 'POST',
      data: ({ reason, note: note || null, scope }),
    }),
  )

/** Who a published event reaches. Saving notifies them; a series gets it from this date on. */
export const setEventAudience = async (eventId: string, audience: Audience): Promise<TpoEvent> =>
  toEvent(
    await ask<ApiEvent>(`/calendar/events/${eventId}/audience`, {
      method: 'PUT',
      data: ({
        audience: {
          opportunity_type: audience.opportunityType,
          courses: audience.courses,
          batches: audience.batches,
          departments: audience.departments,
        },
      }),
    }),
  )

export const uploadImage = async (dataUrl: string): Promise<string> =>
  (
    await ask<{ image_url: string }>('/calendar/images', {
      method: 'POST',
      data: ({ data_url: dataUrl }),
    })
  ).image_url

/** The stored path is relative to the API, not to this app. */
export const imageSrc = (imageUrl: string): string => (imageUrl ? `${API_BASE_URL}${imageUrl}` : '')

type ApiFeedSettings = {
  past_days: number
  future_days: number
  events: boolean
  deadlines: boolean
  reminders: boolean
  cancelled: boolean
}

const toSyncSettings = (entry: ApiFeedSettings): CalendarSyncSettings => ({
  pastDays: entry.past_days,
  futureDays: entry.future_days,
  events: entry.events,
  deadlines: entry.deadlines,
  reminders: entry.reminders,
  cancelled: entry.cancelled,
})

/** What the user's calendar sync carries: their own choices over the college's defaults. */
export const fetchSyncSettings = async (): Promise<CalendarSyncSettings> =>
  toSyncSettings(await ask<ApiFeedSettings>('/calendar/feed/settings'))

export const saveSyncSettings = async (settings: CalendarSyncSettings): Promise<CalendarSyncSettings> =>
  toSyncSettings(
    await ask<ApiFeedSettings>('/calendar/feed/settings', {
      method: 'PUT',
      data: {
        past_days: settings.pastDays,
        future_days: settings.futureDays,
        events: settings.events,
        deadlines: settings.deadlines,
        reminders: settings.reminders,
        cancelled: settings.cancelled,
      },
    }),
  )

/** The signed-in user's private .ics subscription URL. */
export const fetchFeedLink = async (): Promise<string> =>
  (await ask<{ url: string }>('/calendar/feed/link')).url

export const deleteReminder = (eventId: string, scope: 'one' | 'series' = 'one'): Promise<void> =>
  ask<void>(`/calendar/events/${eventId}?scope=${scope}`, { method: 'DELETE' })

export const deleteAllEvents = (): Promise<{ count: number }> =>
  ask<{ count: number }>('/calendar/events?confirm=yes', { method: 'DELETE' })

export const fetchNotifications = (): Promise<ApiNotification[]> =>
  share('notifications', () => ask<ApiNotification[]>('/calendar/notifications'))

export const readNotification = (notificationId: string): Promise<void> =>
  ask<void>(`/calendar/notifications/${notificationId}/read`, { method: 'POST' })

export const readAllNotifications = (): Promise<void> =>
  ask<void>('/calendar/notifications/read-all', { method: 'POST' })

// One SSE connection for the whole app. Each component used to open its own
// EventSource, so a single page ran four streams and four copies of each fetch.
let stream: EventSource | null = null

const listeners = new Set<() => void>()

const fanOut = () => listeners.forEach((listener) => listener())

export const openCalendarStream = (onChange: () => void): (() => void) => {
  const session = readSession()
  if (!session) return () => undefined

  listeners.add(onChange)

  if (!stream) {
    stream = new EventSource(`${API_BASE_URL}/calendar/stream?token=${encodeURIComponent(session.token)}`)
    stream.addEventListener('calendar', fanOut)
  }

  return () => {
    listeners.delete(onChange)
    if (listeners.size === 0 && stream) {
      stream.close()
      stream = null
    }
  }
}

// A request already in flight is not sent again — every caller shares that answer.
const share = <T,>(key: string, call: () => Promise<T>): Promise<T> => {
  const running = inFlight.get(key) as Promise<T> | undefined
  if (running) return running

  const started = call().finally(() => inFlight.delete(key))
  inFlight.set(key, started)

  return started
}

const inFlight = new Map<string, Promise<unknown>>()
