import * as React from 'react';

/**
 * Textarea — ported to match the original (non-shadcn) design system.
 * Supports label / hint / error, three sizes and a hover border highlight.
 * Colors/hover/focus use the same `--ds-*` tokens as the original.
 */

export type TextareaSize = 'sm' | 'md' | 'lg';

export interface TextareaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'> {
  size?: TextareaSize;
  label?: React.ReactNode;
  hint?: React.ReactNode;
  /** Error message; when set, applies the danger state. */
  error?: string;
  /** Highlight the field border on hover. */
  hover?: boolean;
  /** Show a live character counter. Pairs with maxLength to render "N/max". */
  showCount?: boolean;
  /**
   * Only keep characters matching this regex. Applied to typed input AND to
   * incoming controlled/backend values.
   */
  allow?: RegExp;
}
