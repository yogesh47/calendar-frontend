export type SpinnerSize = 'sm' | 'md' | 'lg';

/**
 * 'border' — solid ring with a transparent top (the original look).
 * 'trail'  — ring that fades from currentColor to transparent as it goes round.
 */
export type SpinnerVariant = 'border' | 'trail';

export interface SpinnerProps {
  size?: SpinnerSize;
  variant?: SpinnerVariant;
  /** Ring thickness for the 'trail' variant, in px. */
  thickness?: number;
  className?: string;
  label?: string;
}
