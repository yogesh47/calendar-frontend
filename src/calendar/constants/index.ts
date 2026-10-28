import '../styles/calendar.css'
import type { CalendarItemKind } from '../types'

/**
 * Every number the BRD and UI Spec scatter around, in one place.
 *
 * Master doc section 8b lists these and says plainly: make them constants, never
 * inline. They are the ones that get missed in review.
 */
export const LIMITS = {
  titleLength: 120,
  descriptionLength: 1000,
  reminderNoteLength: 500,
  cancelOtherNoteLength: 200,
  /** A month tile shows this many, then "+N more". */
  monthTileItems: 3,
  /** The home "Coming Up" card. */
  comingUpItems: 3,
  /** How long an edited item wears the "Updated" badge. */
  updatedBadgeHours: 48,
  /** How many upcoming reminders one person may keep. */
  upcomingReminders: 50,
} as const

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
  event: { label: 'Event', accent: 'var(--ds-color-calendar-event)', surface: 'var(--ds-color-calendar-event-subtle)' },
  deadline: { label: 'Deadline', accent: 'var(--ds-color-calendar-deadline)', surface: 'var(--ds-color-calendar-deadline-subtle)' },
  reminder: {
    label: 'My Reminder',
    accent: 'var(--ds-color-calendar-reminder)',
    surface: 'var(--ds-color-calendar-reminder-subtle)',
    dashed: true,
  },
  nudge: { label: 'Reminder', accent: 'var(--ds-color-calendar-nudge)', surface: 'var(--ds-color-calendar-nudge-subtle)' },
}

export const CANCELLED_STYLE = {
  label: 'Cancelled',
  accent: 'var(--ds-color-calendar-cancelled)',
  surface: 'var(--ds-color-calendar-cancelled-subtle)',
} as const
