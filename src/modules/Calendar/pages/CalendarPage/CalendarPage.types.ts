import type { TpoDraft, TpoEvent } from '../../types/tpo'

/*
  Every modal of the calendar page, shown by the page itself (the calendar runs
  headless: it only says what the user asked for). Each modal remembers the one
  it was opened from in `back`, so "Go Back" and "Back" return exactly there —
  with whatever had been filled in.
*/
export type CalendarModal =
  | { kind: 'entry'; draft: TpoDraft; editing: TpoEvent | null }
  | { kind: 'publish'; draft: TpoDraft; editing: TpoEvent | null }
  | { kind: 'view'; eventId: string }
  | { kind: 'cancel'; event: TpoEvent; back: CalendarModal | null }
  | { kind: 'delete'; event: TpoEvent; mode: 'reminder' | 'cancelled'; back: CalendarModal | null }
  | { kind: 'deleteAll' }
  | { kind: 'sync' }
