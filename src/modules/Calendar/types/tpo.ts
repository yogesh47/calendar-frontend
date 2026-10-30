import type { CalendarEvent, EventDraft } from '@/calendar'

/*
  The TPO's side of the calendar: its event types, audiences and companies.
  The calendar knows none of this — these ride along on its draft and events.
*/
export type TpoEventType =
  | 'ppt'
  | 'company_visit'
  | 'online_assessment'
  | 'training'
  | 'orientation'
  | 'practice_test'
  | 'deadline'
  | 'other'
  | 'my_reminder'
  | 'nudge'

export type OpportunityType = 'job' | 'internship' | 'general'

export type EventMode = 'offline' | 'online' | ''

export type CancelReason = 'postponed' | 'company_withdrew' | 'created_by_mistake' | 'other'

export type LinkedJob = {
  kind: 'campus' | 'external'
  campusJob: string
  url: string
  title: string
}

export type Audience = {
  opportunityType: OpportunityType
  courses: string[]
  batches: number[]
  departments: string[]
}

/** The calendar's draft plus everything only a TPO event has. */
export type TpoDraft = EventDraft & {
  eventType: TpoEventType
  /** What an "other" event actually is, in the TPO's words. Empty for every other type. */
  otherType: string
  company: string
  mode: EventMode
  venue: string
  onlinePlatform: string
  audience: Audience
  linkedJob: LinkedJob | null
  /** The zone its times are kept in. Unset on a new one: see the api's `zoneFor`. */
  timeZone?: string
}

export type TpoEvent = CalendarEvent<TpoDraft> & {
  notifiedCount: number
  createdBy: string
  cancelReason?: CancelReason
  deadlineCounts?: { eligible: number; applied: number; not_applied: number }
}

export type CalendarFilters = {
  types: string[]
  courses: string[]
  batches: number[]
  departments: string[]
  kinds: string[]
  companies: string[]
  opportunityTypes: string[]
  createdByMe: boolean
}
