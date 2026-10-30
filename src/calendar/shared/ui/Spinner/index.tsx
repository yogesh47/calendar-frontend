import { cn } from '../../../lib/utils';
import type { SpinnerProps } from './Spinner.types';
import { DEFAULT_TRAIL_THICKNESS, SIZES, TRAIL_SIZES } from './Spinner.constants';

export type { SpinnerProps, SpinnerSize, SpinnerVariant } from './Spinner.types';

/** Indeterminate loading spinner — inherits currentColor (matches the original). */
export function Spinner({
  size = 'md',
  variant = 'border',
  thickness = DEFAULT_TRAIL_THICKNESS,
  className,
  label = 'Loading',
}: SpinnerProps) {
  // 'trail': a conic sweep from currentColor to transparent, with the middle
  // masked out so only a ring of `thickness` remains.
  if (variant === 'trail') {
    return (
      <span
        role="status"
        aria-label={label}
        style={{
          background: 'conic-gradient(from 90deg, currentColor 0deg, transparent 360deg)',
          mask: `radial-gradient(farthest-side, transparent calc(100% - ${thickness}px), #000 0)`,
          WebkitMask: `radial-gradient(farthest-side, transparent calc(100% - ${thickness}px), #000 0)`,
        }}
        className={cn(
          'inline-block animate-spin rounded-full [animation-duration:0.9s]',
          TRAIL_SIZES[size],
          className,
        )}
      />
    );
  }

  return (
    <span
      role="status"
      aria-label={label}
      className={cn(
        'inline-block animate-spin rounded-full border-current border-t-transparent [animation-duration:0.32s]',
        SIZES[size],
        className,
      )}
    />
  );
}
