import type { RepeatFrequency } from '@/calendar'

export const LINKED_EVENT_MOVED = (day: string): string => `The linked event has moved to ${day}.`

export const LINKED_EVENT_CANCELLED = 'The linked event was cancelled.'

export const REPEAT_OPTIONS: { value: RepeatFrequency | 'none'; label: string; unit: string }[] = [
  { value: 'none', label: 'Does not repeat', unit: '' },
  { value: 'daily', label: 'Daily', unit: 'day' },
  { value: 'weekly', label: 'Weekly', unit: 'week' },
  { value: 'monthly', label: 'Monthly', unit: 'month' },
]
