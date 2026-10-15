/** The five kinds the UI spec's item table names. */
export type CalendarItemKind = 'event' | 'deadline' | 'reminder' | 'nudge'

/** An event's own type, shown as the tile's label. */
export type EventType = 'ppt' | 'drive' | 'assessment' | 'interview' | 'workshop' | 'other'

export type ItemStatus = 'active' | 'cancelled' | 'updated' | 'not_applicable' | 'past'

export type CalendarItem = {
  id: string
  kind: CalendarItemKind
  title: string
  /** ISO 8601, UTC. All-day items carry a date only — see `isAllDay`. */
  startsAt: string
  endsAt?: string
  isAllDay?: boolean
  eventType?: EventType
  status: ItemStatus
  /** Set when the item was edited inside the "Updated" window. */
  updatedAt?: string
  venue?: string
  description?: string
  /** Only the creator sees their own reminder. */
  createdBy?: string
  linkedJob?: { kind: 'campus' | 'external'; id?: string; url?: string; title?: string }
}

export type CalendarView = 'day' | 'month' | 'week' | 'list'
