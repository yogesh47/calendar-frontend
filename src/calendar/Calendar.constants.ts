import type { CancelReasonOption } from './components/CalendarDialogs/components/CancelDialog'

export const CALENDAR_STATE_COPY = {
  loadFailed: "Couldn't load the calendar.",
} as const

/** Offered when the app gives no reasons of its own. */
export const DEFAULT_CANCEL_REASONS: CancelReasonOption[] = [
  { value: 'postponed', label: 'Postponed', suggestsEdit: true },
  { value: 'other', label: 'Other', needsNote: true },
]
