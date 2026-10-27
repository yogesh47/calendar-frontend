import { CAMPUS_JOBS, EXTERNAL_JOBS, jobLabel } from '../services/jobs'
import type {
  Audience,
  CalendarFilters,
  CancelReason,
  EventDraft,
  OpportunityType,
  RemindBefore,
  RepeatFrequency,
  TpoEventType,
} from '../types/tpo'

export const SIGNED_IN_TPO = 'me'

export const SIGNED_IN_TPO_NAME = 'you'

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

export const COMPANY_OPTIONS = [...new Set([...CAMPUS_JOBS, ...EXTERNAL_JOBS].map((job) => job.company))]

export const CAMPUS_JOB_OPTIONS = CAMPUS_JOBS.map(jobLabel)

export const MODE_OPTIONS: { value: 'offline' | 'online'; label: string }[] = [
  { value: 'offline', label: 'Offline' },
  { value: 'online', label: 'Online' },
]

/*
  Reminder ki ghanti kitni pehle baje. `none` par backend kuch schedule hi nahi
  karta, isliye nayi reminder isi par khulti hai — warna banti to hai, par bajti
  kabhi nahi.
*/
export const DEFAULT_REMIND_BEFORE: RemindBefore = '1_hour'

export const REMIND_BEFORE_OPTIONS: { value: RemindBefore; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'at_time', label: 'At the time' },
  { value: '15_min', label: '15 minutes before' },
  { value: '1_hour', label: '1 hour before' },
  { value: '1_day', label: '1 day before' },
]

export const REPEAT_OPTIONS: { value: RepeatFrequency | 'none'; label: string; unit: string }[] = [
  { value: 'none', label: 'Does not repeat', unit: '' },
  { value: 'daily', label: 'Daily', unit: 'day' },
  { value: 'weekly', label: 'Weekly', unit: 'week' },
  { value: 'monthly', label: 'Monthly', unit: 'month' },
]

/** The backend caps a series at a year and at this many occurrences. */
export const REPEAT_MAX_OCCURRENCES = 52

export const IMAGE_MAX_BYTES = 2 * 1024 * 1024

export const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']

export const CANCEL_REASON_OPTIONS: { value: CancelReason; label: string }[] = [
  { value: 'postponed', label: 'Postponed' },
  { value: 'company_withdrew', label: 'Company Withdrew' },
  { value: 'created_by_mistake', label: 'Created by Mistake' },
  { value: 'other', label: 'Other' },
]

export const CANCEL_REASON_LABEL: Record<CancelReason, string> = {
  postponed: 'Postponed',
  company_withdrew: 'Company withdrew',
  created_by_mistake: 'Created by mistake',
  other: 'Other',
}

export const MINOR_FIELDS: (keyof EventDraft)[] = ['title', 'description', 'company']

export const IMPORTANT_FIELD_LABEL: Partial<Record<keyof EventDraft, string>> = {
  eventDate: 'Date',
  startTime: 'Start Time',
  endTime: 'End Time',
  mode: 'Mode',
  venue: 'Venue',
  onlinePlatform: 'Platform',
  audience: 'Target Audience',
  title: 'Title',
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

export const EMPTY_DRAFT: EventDraft = {
  eventType: 'ppt',
  title: '',
  company: '',
  eventDate: '',
  endDate: '',
  startTime: '',
  endTime: '',
  mode: 'offline',
  venue: '',
  onlinePlatform: '',
  description: '',
  note: '',
  remindBefore: 'none',
  audience: EMPTY_AUDIENCE,
  linkedJob: null,
  linkedType: null,
  linkedId: null,
  recurrence: null,
  imageUrl: '',
}

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
