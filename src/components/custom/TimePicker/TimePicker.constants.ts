import type { TimePickerSize } from './TimePicker.types';

export const TRIGGER_SIZE: Record<TimePickerSize, string> = {
  sm: 'min-h-8 px-2 text-sm',
  md: 'min-h-10 px-3 text-sm',
  lg: 'min-h-12 px-4 text-base',
};

export const CELL_BASE =
  'flex w-14 cursor-pointer items-center justify-center rounded-[var(--ds-radius-sm)] px-2 py-1 text-sm tabular-nums transition-colors [color:var(--ds-color-text-primary)] hover:[background-color:var(--ds-color-bg-subtle)] focus-visible:outline-none focus-visible:[box-shadow:var(--ds-shadow-focus)]';

export const CELL_SELECTED =
  '[background-color:var(--ds-color-brand)] [color:var(--ds-color-brand-fg)] font-medium hover:[background-color:var(--ds-color-brand-hover)]';
