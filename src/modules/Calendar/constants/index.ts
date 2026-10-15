import type { CalendarItemKind, EventType, ItemStatus } from '../types'

/**
 * Every number the BRD and UI Spec scatter around, in one place.
 *
 * Master doc section 8b lists these and says plainly: make them constants, never
 * inline. They are the ones that get missed in review.
 */
export const LIMITS = {
  titleLength: 120,
  descriptionLength: 1000,
  venueLength: 200,
  reminderNoteLength: 500,
  cancelOtherNoteLength: 200,
  /** A month tile shows this many, then "+N more". */
  monthTileItems: 3,
  /** The home "Coming Up" card. */
  comingUpItems: 3,
  /** How long an edited item wears the "Updated" badge. */
  updatedBadgeHours: 48,
  studentUpcomingReminders: 50,
  notificationBatch: 500,
  notificationDeadlineSeconds: 60,
  notificationRetries: 5,
  dailyNudgeLimit: { default: 3, min: 1, max: 10 },
} as const

/** Wall-clock, read in the org's own timezone — never UTC. */
export const QUIET_HOURS = { from: '22:00', to: '07:00' } as const

/** The week grid's default window. */
export const WEEK_HOURS = { from: 8, to: 19 } as const

/**
 * The item table from UI Spec section 1.
 *
 * `label` is not decoration. The spec and the master doc both say the colour
 * never travels alone: a tile shows the label as text as well, so the meaning
 * survives colour blindness, a greyscale print and a dark background.
 */
export const CALENDAR_ITEM_STYLE: Record<
  CalendarItemKind,
  { label: string; accent: string; surface: string; dashed?: boolean }
> = {
  event: { label: 'Event', accent: 'var(--cal-event)', surface: 'var(--cal-event-soft)' },
  deadline: { label: 'Deadline', accent: 'var(--cal-deadline)', surface: 'var(--cal-deadline-soft)' },
  reminder: {
    label: 'My Reminder',
    accent: 'var(--cal-reminder)',
    surface: 'var(--cal-reminder-soft)',
    dashed: true,
  },
  nudge: { label: 'Reminder', accent: 'var(--cal-nudge)', surface: 'var(--cal-nudge-soft)' },
}

export const CANCELLED_STYLE = {
  label: 'Cancelled',
  accent: 'var(--cal-cancelled)',
  surface: 'var(--cal-cancelled-soft)',
} as const

/** An event's own type is what its tile says, in place of the generic "Event". */
export const EVENT_TYPE_LABEL: Record<EventType, string> = {
  ppt: 'PPT',
  drive: 'Drive',
  assessment: 'Online Assessment',
  interview: 'Interview',
  workshop: 'Workshop',
  other: 'Event',
}

export const STATUS_BADGE: Partial<Record<ItemStatus, string>> = {
  updated: 'Updated',
  cancelled: 'Cancelled',
  not_applicable: 'No longer applicable',
  past: 'Past',
}
