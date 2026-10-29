/*
  The calendar's own data model. Nothing here belongs to one app: an app maps
  its API into these shapes, and adds whatever else it needs to the draft — the
  calendar carries those extra fields along untouched.
*/

/** How the calendar groups items: each kind has its own colour and behaviour. */
export type CalendarItemKind = 'event' | 'deadline' | 'reminder' | 'nudge'

export type ItemStatus = 'active' | 'cancelled' | 'updated' | 'not_applicable' | 'past'

export type CalendarView = 'day' | 'month' | 'week' | 'list'

/** What one person's calendar sync carries to Google / Outlook. */
export type CalendarSyncSettings = {
  /** Days before today. */
  pastDays: number
  /** Days after today. */
  futureDays: number
  events: boolean
  deadlines: boolean
  reminders: boolean
  /** Cancelled events, titled "Cancelled: …". */
  cancelled: boolean
}

export type RemindBefore = 'none' | 'at_time' | '15_min' | '1_hour' | '1_day'

export type RepeatFrequency = 'daily' | 'weekly' | 'monthly'

/** One row per occurrence is written on create; this is the rule they come from. */
export type Recurrence = {
  freq: RepeatFrequency
  interval: number
  until: string
}

/** The calendar's built-in types. Every other type is the app's, from `eventTypes`. */
export const REMINDER_TYPE = 'my_reminder'
export const DEADLINE_TYPE = 'deadline'
export const NUDGE_TYPE = 'nudge'

/** One of the app's event types, as the create dialog offers it. */
export type CalendarEventType = {
  value: string
  label: string
  /** What its tile says, if the label is too long for one ("PPT"). */
  shortLabel?: string
  /** Has a start and an end time. Otherwise it is an all-day item. */
  timed: boolean
  /** A line of guidance shown when this type is picked. */
  info?: string
}

/** What the calendar's create and edit dialogs fill in. Apps extend it with their own fields. */
export type EventDraft = {
  eventType: string
  title: string
  eventDate: string
  endDate: string
  startTime: string
  endTime: string
  description: string
  /** A reminder's private note. */
  note: string
  remindBefore: RemindBefore
  /** What a reminder or a nudge points at, e.g. 'event' + its id. */
  linkedType: string | null
  linkedId: string | null
  /** Only on create — an existing occurrence is edited on its own. */
  recurrence: Recurrence | null
  /** The stored path of the event's image; the app's `resolveImageUrl` turns it into a URL. */
  imageUrl: string
  changeSummary?: string
  changeReason?: string
  notifyOnChange?: boolean
}

/** One item on the calendar, as the app hands it over. */
export type CalendarEvent<TDraft extends EventDraft = EventDraft> = {
  id: string
  draft: TDraft
  /** The signed-in user made it, so they may edit, cancel or delete it. */
  isOwner: boolean
  createdByName: string
  createdAt: string
  updatedAt?: string
  cancelledAt?: string
  /** Why it was cancelled, as the user should read it. */
  cancelNote?: string
  /** False when it was sent to the user once but no longer applies to them. */
  appliesToMe: boolean
  removedReason?: string
  changeSummary?: string
  changeReason?: string
  /** How many people it reaches — shown as "N people will be notified". */
  reach?: number
  /** Shared by every occurrence of a recurring event. */
  seriesId?: string
  /** As stored: "weekly;1;2026-12-31". */
  recurrence?: string
  /** Where it happens, as one line ("Offline · Hall A"). */
  location?: string
}

/** The flat shape the grids draw. Built from a `CalendarEvent` by `itemFromEvent`. */
export type CalendarItem = {
  id: string
  kind: CalendarItemKind
  title: string
  /** ISO 8601, UTC. All-day items carry a date only — see `isAllDay`. */
  startsAt: string
  endsAt?: string
  isAllDay?: boolean
  /** The event type's label, shown on the tile. */
  typeLabel?: string
  status: ItemStatus
  /** Set when the item was edited inside the "Updated" window. */
  updatedAt?: string
  location?: string
  description?: string
}
