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

export type EventDraft = {
  eventType: TpoEventType
  title: string
  company: string
  eventDate: string
  startTime: string
  endTime: string
  mode: EventMode
  venue: string
  onlinePlatform: string
  description: string
  note: string
  audience: Audience
  linkedJob: LinkedJob | null
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
  createdByMe: boolean
}
