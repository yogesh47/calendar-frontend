import type { InputSize } from './Input.types';

export const FIELD_SIZE: Record<InputSize, string> = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-3 text-sm',
  lg: 'h-12 px-4 text-base',
};

/** Default upper bound for date-family inputs so the year can't exceed 4 digits. */
export const DATE_MAX: Record<string, string> = {
  date: '9999-12-31',
  'datetime-local': '9999-12-31T23:59',
  month: '9999-12',
  week: '9999-W52',
};
