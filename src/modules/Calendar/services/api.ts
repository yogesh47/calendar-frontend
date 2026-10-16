import { API_BASE_URL } from '@/modules/Auth/constants'
import { readSession, signOutOnExpiry } from '@/modules/Auth/services'
import { ApiError, OFFLINE_MESSAGE } from '@/lib/apiError'
import { EMPTY_DRAFT } from '../constants/tpo'
import type { EventDraft, TpoEvent } from '../types/tpo'

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
}

const authHeaders = (): Record<string, string> => {
  const session = readSession()

  return session ? { Authorization: `Bearer ${session.token}` } : {}
}

const ask = async <T,>(path: string, init?: RequestInit): Promise<T> => {
  let response: Response

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...authHeaders(), ...(init?.headers ?? {}) },
    })
  } catch {
    throw new ApiError(0, { detail: OFFLINE_MESSAGE, code: 'offline' })
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    const error = new ApiError(response.status, body)
    if (error.isAuth) signOutOnExpiry()

    throw error
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
  appliesToMe: entry.applies_to_me,
  removedReason: entry.removed_reason ?? undefined,
  changeSummary: entry.change_summary ?? undefined,
  changeReason: entry.change_reason ?? undefined,
  deadlineCounts: entry.deadline_counts ?? undefined,
  draft: {
    ...EMPTY_DRAFT,
    eventType: entry.event_type as EventDraft['eventType'],
    title: entry.title,
    company: entry.company ?? '',
    eventDate: entry.event_date,
    endDate: entry.end_date ?? entry.event_date,
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
    remindBefore: (entry.remind_before as EventDraft['remindBefore']) ?? 'none',
    linkedType: (entry.linked_type as EventDraft['linkedType']) ?? null,
    linkedId: entry.linked_id ?? null,
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
  end_date: draft.endDate || draft.eventDate,
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
  remind_before: draft.remindBefore,
  linked_type: draft.linkedType,
  linked_id: draft.linkedId,
  change_summary: draft.changeSummary || null,
  change_reason: draft.changeReason || null,
  notify_on_change: draft.notifyOnChange ?? true,
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

export const applyToJob = (jobId: string): Promise<{ application_id: string }> =>
  ask<{ application_id: string }>(`/calendar/jobs/${jobId}/apply`, { method: 'POST' })

export const fetchComingUp = async (limit = 3): Promise<TpoEvent[]> =>
  (await ask<ApiEvent[]>(`/calendar/coming-up?limit=${limit}`)).map(toEvent)

export const fetchUnreadCount = async (): Promise<number> =>
  (await ask<{ unread: number }>('/calendar/notifications/unread-count')).unread

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

export const deleteAllEvents = (): Promise<{ count: number }> =>
  ask<{ count: number }>('/calendar/events?confirm=yes', { method: 'DELETE' })

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
