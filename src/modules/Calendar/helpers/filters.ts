import type { CalendarFilters, TpoEvent } from '../types/tpo'

/*
  Which events the calendar is handed. The calendar draws whatever it gets;
  who may see what, and the TPO's filter by course, batch, company and the
  rest, are decided here.
*/
export const visibleEvents = (events: TpoEvent[], filters: CalendarFilters, isTpo: boolean): TpoEvent[] =>
  events
    // A student never sees an event the TPO cancelled as a mistake.
    .filter((event) => isTpo || event.cancelReason !== 'created_by_mistake')
    // Reminders are private to whoever made them.
    .filter((event) => event.draft.eventType !== 'my_reminder' || event.isOwner)
    .filter((event) => !filters.createdByMe || event.draft.eventType !== 'deadline')
    .filter(
      (event) =>
        event.draft.eventType === 'my_reminder' ||
        ((!filters.types.length || filters.types.includes(event.draft.eventType)) &&
          (!filters.opportunityTypes.length ||
            filters.opportunityTypes.includes(event.draft.audience.opportunityType)) &&
          (!filters.companies.length || filters.companies.includes(event.draft.company)) &&
          (!filters.createdByMe || event.isOwner) &&
          (!filters.courses.length || event.draft.audience.courses.some((course) => filters.courses.includes(course))) &&
          (!filters.batches.length || event.draft.audience.batches.some((batch) => filters.batches.includes(batch))) &&
          (!filters.departments.length ||
            event.draft.audience.departments.some((department) => filters.departments.includes(department)))),
    )
    .filter((event) => {
      if (!filters.kinds.length) return true
      if (event.cancelledAt) return filters.kinds.includes('cancelled')
      const kind =
        event.draft.eventType === 'my_reminder' ? 'reminder' : event.draft.eventType === 'deadline' ? 'deadline' : 'event'
      return filters.kinds.includes(kind)
    })
