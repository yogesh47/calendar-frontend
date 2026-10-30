import * as React from 'react';
import type { VariantProps } from 'class-variance-authority';

import { buttonVariants } from './Button.constants';

/** Optional, prop-controlled hover animation (in addition to color hover). */
export type ButtonHoverEffect =
  | 'none'
  | 'lift'
  | 'raise'
  | 'grow'
  | 'shrink'
  | 'press'
  | 'glow'
  | 'ring'
  | 'shine'
  | 'pulse';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  iconOnly?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  /** Extra hover motion, on top of the color hover. Default 'none'. */
  hoverEffect?: ButtonHoverEffect;
  /** Material-style click ripple emanating from the pointer. Default false. */
  ripple?: boolean;
}
