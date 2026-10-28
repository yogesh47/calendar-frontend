import type { SpinnerSize } from './Spinner.types';

export const SIZES: Record<SpinnerSize, string> = {
  sm: 'h-3.5 w-3.5 border-2', // 0.875rem
  md: 'h-[1.125rem] w-[1.125rem] border-2', // 1.125rem
  lg: 'h-6 w-6 border-[0.1875rem]', // 1.5rem
};

/** Sizes without the border utilities — the 'trail' ring is drawn with a mask. */
export const TRAIL_SIZES: Record<SpinnerSize, string> = {
  sm: 'h-3.5 w-3.5',
  md: 'h-[1.125rem] w-[1.125rem]',
  lg: 'h-6 w-6',
};

export const DEFAULT_TRAIL_THICKNESS = 3;
