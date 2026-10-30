import { EMPTY_DRAFT as CALENDAR_EMPTY_DRAFT } from '@/calendar'
import type { CalendarEventType, CancelReasonOption } from '@/calendar'
import type { Audience, CalendarFilters, CancelReason, OpportunityType, TpoDraft, TpoEventType } from '../types/tpo'

export const FINAL_YEAR_BATCH = 2027

export const PRE_FINAL_BATCH = 2028

export const EVENT_TYPE_OPTIONS: {
  value: TpoEventType
  label: string
  needsTime: boolean
  needsMode: boolean
  needsAudience: boolean
  needsCompany: boolean
  info?: string
}[] = [
  { value: 'ppt', label: 'Pre-Placement Talk (PPT)', needsTime: true, needsMode: true, needsAudience: true, needsCompany: true },
  { value: 'company_visit', label: 'Company Visit', needsTime: true, needsMode: true, needsAudience: true, needsCompany: true },
  {
    value: 'online_assessment',
    label: 'Online Assessment',
    needsTime: true,
    needsMode: false,
    needsAudience: true,
    needsCompany: true,
    info: 'No test link is needed here. Students see: "The test link will be sent to your registered email."',
  },
  { value: 'training', label: 'Training / Workshop', needsTime: true, needsMode: true, needsAudience: true, needsCompany: true },
  { value: 'orientation', label: 'Orientation / Info Session', needsTime: true, needsMode: true, needsAudience: true, needsCompany: true },
  { value: 'practice_test', label: 'Practice Test', needsTime: true, needsMode: true, needsAudience: true, needsCompany: true },
  {
    value: 'deadline',
    label: 'Deadline',
    needsTime: false,
    needsMode: false,
    needsAudience: true,
    needsCompany: true,
    info: 'All-day item. No time, mode or venue needed.',
  },
  { value: 'other', label: 'Other', needsTime: true, needsMode: true, needsAudience: true, needsCompany: true },
  {
    value: 'my_reminder',
    label: 'My Reminder',
    needsTime: false,
    needsMode: false,
    needsAudience: false,
    needsCompany: false,
  },
]

export const REMINDER_PRIVACY = 'Only you can see this. No students are notified.'

export const OPPORTUNITY_OPTIONS: { value: OpportunityType; label: string }[] = [
  { value: 'job', label: 'Job' },
  { value: 'internship', label: 'Internship' },
  { value: 'general', label: 'General' },
]

export const COURSE_OPTIONS = ['BTech', 'MBA', 'MCA', 'BSc']

export const DEPARTMENT_OPTIONS = [
  'Computer Science',
  'Information Technology',
  'Electronics',
  'Mechanical',
  'Civil',
  'MBA',
]

export const BATCH_OPTIONS: { year: number; label: string }[] = [
  { year: 2027, label: '2027 (Final year)' },
  { year: 2028, label: '2028 (Pre-final year)' },
  { year: 2029, label: '2029 (Second year)' },
  { year: 2030, label: '2030 (First year)' },
]

/** The backend caps a series at a year and at this many occurrences. */
export const REPEAT_MAX_OCCURRENCES = 52

export const MINOR_FIELDS: (keyof TpoDraft)[] = ['title', 'description', 'company']

export const IMPORTANT_FIELD_LABEL: Partial<Record<keyof TpoDraft, string>> = {
  eventType: 'Event Type',
  eventDate: 'Date',
  startTime: 'Start Time',
  endTime: 'End Time',
  mode: 'Mode',
  venue: 'Venue',
  onlinePlatform: 'Platform',
  audience: 'Target Audience',
  title: 'Title',
  otherType: 'Event Type',
  description: 'Description',
  company: 'Company',
  linkedJob: 'Linked Job',
}

export const EMPTY_AUDIENCE: Audience = {
  opportunityType: 'general',
  courses: [],
  batches: [],
  departments: [],
}

/** The calendar's blank draft plus the TPO's own fields. */
export const EMPTY_DRAFT: TpoDraft = {
  ...CALENDAR_EMPTY_DRAFT,
  eventType: 'ppt',
  otherType: '',
  company: '',
  mode: 'offline',
  venue: '',
  onlinePlatform: '',
  audience: EMPTY_AUDIENCE,
  linkedJob: null,
}

/** What only a TPO draft has — handed to the calendar as `draftDefaults`. */
export const TPO_DRAFT_DEFAULTS = {
  eventType: EMPTY_DRAFT.eventType,
  otherType: '',
  company: '',
  mode: EMPTY_DRAFT.mode,
  venue: '',
  onlinePlatform: '',
  audience: EMPTY_AUDIENCE,
  linkedJob: null,
}

// The tile labels the calendar shows for each type; the rest read "Event".
const SHORT_LABEL: Partial<Record<TpoEventType, string>> = {
  ppt: 'PPT',
  company_visit: 'Drive',
  online_assessment: 'Online Assessment',
  training: 'Workshop',
}

/** The TPO's event types, in the shape the calendar takes. "My Reminder" is the calendar's own. */
export const TPO_EVENT_TYPES: CalendarEventType[] = EVENT_TYPE_OPTIONS.filter(
  (option) => option.value !== 'my_reminder',
).map((option) => ({
  value: option.value,
  label: option.label,
  shortLabel: SHORT_LABEL[option.value] ?? 'Event',
  timed: option.needsTime,
  info: option.info,
}))

export const CANCEL_REASON_LABEL: Record<CancelReason, string> = {
  postponed: 'Postponed',
  company_withdrew: 'Company withdrew',
  created_by_mistake: 'Created by mistake',
  other: 'Other',
}

export const CANCEL_REASONS: CancelReasonOption[] = [
  { value: 'postponed', label: 'Postponed', suggestsEdit: true },
  { value: 'company_withdrew', label: 'Company Withdrew' },
  { value: 'created_by_mistake', label: 'Created by Mistake' },
  { value: 'other', label: 'Other', needsNote: true },
]

export const ASSESSMENT_EMAIL_NOTE = 'The test link will be sent to your registered email.'

export const VENUE_LENGTH = 200

export const OTHER_TYPE_LENGTH = 80

export const EMPTY_FILTERS: CalendarFilters = {
  types: [],
  courses: [],
  batches: [],
  departments: [],
  kinds: [],
  companies: [],
  opportunityTypes: [],
  createdByMe: false,
}
