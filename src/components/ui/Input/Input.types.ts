import * as React from 'react';

/**
 * Input — ported to match the original (non-shadcn) design system.
 * Supports label / hint / error, leftIcon / rightIcon, prefix / suffix,
 * three sizes (sm 32 / md 40 / lg 48) and a hover border highlight.
 * Colors/hover/focus use the same `--ds-*` tokens as the original.
 */

export type InputSize = 'sm' | 'md' | 'lg';

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'prefix'> {
  size?: InputSize;
  label?: React.ReactNode;
  hint?: React.ReactNode;
  /** Error message; when set, applies the danger state. */
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  /** Static text rendered inside the field, before the input. */
  prefix?: React.ReactNode;
  /** Static text rendered inside the field, after the input. */
  suffix?: React.ReactNode;
  /** Highlight the field border on hover. */
  hover?: boolean;
  /** Show a live character counter. Pairs with maxLength to render "N/max". */
  showCount?: boolean;
  /**
   * Only keep characters matching this regex (e.g. /[0-9]/ for digits-only).
   * Applied to typed input AND to incoming controlled/backend values.
   */
  allow?: RegExp;
  /**
   * Hide the browser's native right-side icon — the number stepper (spin
   * buttons) and the date/time calendar picker indicator.
   */
  hideNativeIcon?: boolean;
  /**
   * Built-in validation, run on blur (then live). Defaults to `true`, which
   * validates by `type` (email / url / number) and `required`. Pass `false`
   * to disable, or a function returning an error string (or null) for custom
   * rules. The explicit `error` prop always overrides this.
   */
  validate?: boolean | ((value: string) => string | null);
}
