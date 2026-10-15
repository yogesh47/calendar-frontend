import { API_BASE_URL } from '@/modules/Auth/constants'
import { readSession } from '@/modules/Auth/services'
import { EMPTY_DRAFT } from '../constants/tpo'
import type { EventDraft, TpoEvent } from '../types/tpo'

export type ApiNotification = {
  notification_id: string
  event_id: string
  message: string
  created_at: string
  is_read: boolean
}

type ApiEvent = {
  event_id: string
  event_type: string
  title: string
  company: string | null
  event_date: string
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
  is_owner: boolean
}

const authHeaders = (): Record<string, string> => {
  const session = readSession()

  return session ? { Authorization: `Bearer ${session.token}` } : {}
}

const ask = async <T,>(path: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...authHeaders(), ...(init?.headers ?? {}) },
  })

  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new Error(typeof body?.detail === 'string' ? body.detail : 'Something went wrong. Please try again.')
  }

  return response.status === 204 ? (undefined as T) : ((await response.json()) as T)
}

const toEvent = (entry: ApiEvent): TpoEvent => ({
  id: entry.event_id,
  notifiedCount: entry.notified_count,
  createdBy: entry.is_owner ? 'me' : entry.created_by,
  createdByName: entry.is_owner ? 'you' : entry.created_by_name,
  createdAt: entry.created_at,
  updatedAt: entry.updated_at > entry.created_at ? entry.updated_at : undefined,
  cancelledAt: entry.cancelled_at ?? undefined,
  cancelReason: (entry.cancel_reason as TpoEvent['cancelReason']) ?? undefined,
  cancelNote: entry.cancel_note ?? undefined,
  draft: {
    ...EMPTY_DRAFT,
    eventType: entry.event_type as EventDraft['eventType'],
    title: entry.title,
    company: entry.company ?? '',
    eventDate: entry.event_date,
    startTime: entry.start_time ?? '',
    endTime: entry.end_time ?? '',
    mode: (entry.mode as EventDraft['mode']) ?? '',
    venue: entry.venue ?? '',
    onlinePlatform: entry.online_platform ?? '',
    description: entry.description ?? '',
    note: entry.note ?? '',
    audience: entry.audience
      ? {
          opportunityType: entry.audience.opportunity_type as EventDraft['audience']['opportunityType'],
          courses: entry.audience.courses,
          batches: entry.audience.batches,
          departments: entry.audience.departments,
        }
      : EMPTY_DRAFT.audience,
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

const toPayload = (draft: EventDraft) => ({
  event_type: draft.eventType,
  title: draft.title,
  company: draft.company || null,
  event_date: draft.eventDate,
  start_time: draft.startTime || null,
  end_time: draft.endTime || null,
  mode: draft.mode || null,
  venue: draft.venue || null,
  online_platform: draft.onlinePlatform || null,
  description: draft.description || null,
  note: draft.note || null,
  audience:
    draft.eventType === 'my_reminder'
      ? null
      : {
          opportunity_type: draft.audience.opportunityType,
          courses: draft.audience.courses,
          batches: draft.audience.batches,
          departments: draft.audience.departments,
        },
  linked_job: draft.linkedJob
    ? {
        kind: draft.linkedJob.kind,
        campus_job: draft.linkedJob.campusJob || null,
        url: draft.linkedJob.url || null,
        title: draft.linkedJob.title || null,
      }
    : null,
})

export const fetchEvents = async (): Promise<TpoEvent[]> => (await ask<ApiEvent[]>('/calendar/events')).map(toEvent)

export const createEvent = async (draft: EventDraft): Promise<TpoEvent> =>
  toEvent(await ask<ApiEvent>('/calendar/events', { method: 'POST', body: JSON.stringify(toPayload(draft)) }))

export const updateEvent = async (eventId: string, draft: EventDraft): Promise<TpoEvent> =>
  toEvent(
    await ask<ApiEvent>(`/calendar/events/${eventId}`, { method: 'PUT', body: JSON.stringify(toPayload(draft)) }),
  )

export const cancelEvent = async (eventId: string, reason: string, note: string): Promise<TpoEvent> =>
  toEvent(
    await ask<ApiEvent>(`/calendar/events/${eventId}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason, note: note || null }),
    }),
  )

export const deleteReminder = (eventId: string): Promise<void> =>
  ask<void>(`/calendar/events/${eventId}`, { method: 'DELETE' })

export const fetchNotifications = (): Promise<ApiNotification[]> => ask<ApiNotification[]>('/calendar/notifications')

export const readNotification = (notificationId: string): Promise<void> =>
  ask<void>(`/calendar/notifications/${notificationId}/read`, { method: 'POST' })

export const readAllNotifications = (): Promise<void> =>
  ask<void>('/calendar/notifications/read-all', { method: 'POST' })

export const openCalendarStream = (onChange: () => void): (() => void) => {
  const session = readSession()
  if (!session) return () => undefined

  const source = new EventSource(`${API_BASE_URL}/calendar/stream?token=${encodeURIComponent(session.token)}`)
  source.addEventListener('calendar', onChange)

  return () => source.close()
}
