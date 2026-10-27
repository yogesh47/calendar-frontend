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

export type RemindBefore = 'none' | 'at_time' | '15_min' | '1_hour' | '1_day'

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

export type RepeatFrequency = 'daily' | 'weekly' | 'monthly'

/** One row per occurrence is written on create; this is the rule they come from. */
export type Recurrence = {
  freq: RepeatFrequency
  interval: number
  until: string
}

export type EventDraft = {
  eventType: TpoEventType
  title: string
  company: string
  eventDate: string
  endDate: string
  startTime: string
  endTime: string
  mode: EventMode
  venue: string
  onlinePlatform: string
  description: string
  note: string
  remindBefore: RemindBefore
  audience: Audience
  linkedJob: LinkedJob | null
  linkedType: 'event' | 'job_deadline' | null
  linkedId: string | null
  /** Only on create — an existing occurrence is edited on its own. */
  recurrence: Recurrence | null
  /** A path from uploadImage(), e.g. /calendar/images/<id>.png */
  imageUrl: string
  changeSummary?: string
  changeReason?: string
  notifyOnChange?: boolean
}

export type TpoEvent = {
  id: string
  draft: EventDraft
  notifiedCount: number
  createdBy: string
  createdByName: string
  createdAt: string
  updatedAt?: string
  cancelledAt?: string
  cancelReason?: CancelReason
  cancelNote?: string
  appliesToMe: boolean
  removedReason?: string
  changeSummary?: string
  changeReason?: string
  deadlineCounts?: { eligible: number; applied: number; not_applied: number }
  /** Shared by every occurrence of a recurring event. */
  seriesId?: string
  /** As stored by the backend: "weekly;1;2026-12-31". */
  recurrence?: string
}

export type AudienceDiff = {
  kept: number
  added: number
  removed: number
  keptGroups: string[]
  addedGroups: string[]
  removedGroups: string[]
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
