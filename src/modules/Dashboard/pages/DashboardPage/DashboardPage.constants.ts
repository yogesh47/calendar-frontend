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
