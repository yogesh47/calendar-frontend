import type { RemindBefore } from '@/calendar'

export const REMIND_BEFORE_OPTIONS: { value: RemindBefore; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'at_time', label: 'At the time' },
  { value: '15_min', label: '15 minutes before' },
  { value: '1_hour', label: '1 hour before' },
  { value: '1_day', label: '1 day before' },
]
