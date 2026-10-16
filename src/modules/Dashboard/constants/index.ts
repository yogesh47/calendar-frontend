export const DASHBOARD_COPY = {
  subtitle: 'Everything about your placements, in one place',
  thisMonth: 'Events this month',
  upcoming: 'Upcoming events',
  deadlines: 'Application deadlines',
  myReminders: 'My reminders',
  studentReminders: 'Your reminders',
  oneUpdate: '1 new update',
  manyUpdates: (count: number): string => `${count} new updates`,
} as const

export const COMING_UP_COPY = {
  title: 'Coming Up',
  viewAll: 'View all',
  empty: 'Nothing coming up. Your TPO will add placement events here.',
} as const

export const FEED_COPY = {
  title: 'Updates, personalised for you',
  empty: 'Nothing new right now. New events, changes and reminders will show up here.',
  viewOnCalendar: 'View on Calendar',
  viewAndApply: 'View & Apply',
} as const

type FeedCard = { label: string; cta?: string; accent: string; surface: string }

export const FEED_CARDS: Record<string, FeedCard> = {
  new_event: {
    label: 'New Event',
    cta: FEED_COPY.viewOnCalendar,
    accent: 'var(--ds-color-calendar-event)',
    surface: 'var(--ds-color-calendar-event-subtle)',
  },
  event_updated: {
    label: 'Event Updated',
    cta: FEED_COPY.viewOnCalendar,
    accent: 'var(--ds-color-warning-text)',
    surface: 'var(--ds-color-warning-subtle)',
  },
  event_cancelled: {
    label: 'Event Cancelled',
    accent: 'var(--ds-color-danger-text)',
    surface: 'var(--ds-color-danger-subtle)',
  },
  not_applicable: {
    label: 'No Longer Applicable',
    accent: 'var(--ds-color-calendar-cancelled)',
    surface: 'var(--ds-color-calendar-cancelled-subtle)',
  },
  event_day_before: {
    label: 'Event Tomorrow',
    cta: FEED_COPY.viewOnCalendar,
    accent: 'var(--ds-color-calendar-nudge)',
    surface: 'var(--ds-color-calendar-nudge-subtle)',
  },
  event_hour_before: {
    label: 'In 1 Hour',
    cta: FEED_COPY.viewOnCalendar,
    accent: 'var(--ds-color-calendar-nudge)',
    surface: 'var(--ds-color-calendar-nudge-subtle)',
  },
  assessment_day: {
    label: 'Online Test Today',
    cta: FEED_COPY.viewOnCalendar,
    accent: 'var(--ds-color-calendar-nudge)',
    surface: 'var(--ds-color-calendar-nudge-subtle)',
  },
  deadline_days_before: {
    label: 'Applications Closing',
    cta: FEED_COPY.viewAndApply,
    accent: 'var(--ds-color-calendar-deadline)',
    surface: 'var(--ds-color-calendar-deadline-subtle)',
  },
  deadline_last_day: {
    label: 'Last Day',
    cta: FEED_COPY.viewAndApply,
    accent: 'var(--ds-color-calendar-deadline)',
    surface: 'var(--ds-color-calendar-deadline-subtle)',
  },
}
