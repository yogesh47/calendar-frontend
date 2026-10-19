import { cva } from 'class-variance-authority';
import type { SpinnerSize } from '@/components/ui/Spinner';
import type { ButtonHoverEffect } from './Button.types';

/**
 * Button — ported 1:1 from the original (non-shadcn) design system.
 * Same variants (primary/secondary/outline/ghost/link/danger), sizes
 * (sm 32 / md 40 / lg 48), and props (leftIcon/rightIcon/iconOnly/loading/
 * fullWidth). Colors/hover/focus use the same `--ds-*` tokens as the original.
 */
export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md border border-transparent font-semibold select-none cursor-pointer transition-[background-color,color,border-color,box-shadow,transform] duration-[120ms] [transition-timing-function:var(--ds-ease-standard)] focus-visible:outline-none focus-visible:[box-shadow:var(--ds-shadow-focus)] disabled:cursor-not-allowed disabled:opacity-[0.55] [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary:
          '[background-color:var(--ds-color-brand)] [color:var(--ds-color-brand-fg)] enabled:hover:[background-color:var(--ds-color-brand-hover)] enabled:active:[background-color:var(--ds-color-brand-active)]',
        secondary:
          '[background-color:var(--ds-color-bg-muted)] [color:var(--ds-color-text-primary)] enabled:hover:[background-color:var(--ds-color-border-default)]',
        outline:
          'bg-transparent [border-color:var(--ds-color-border-strong)] [color:var(--ds-color-text-primary)] enabled:hover:[background-color:var(--ds-color-bg-muted)]',
        ghost:
          'bg-transparent [color:var(--ds-color-text-primary)] enabled:hover:[background-color:var(--ds-color-bg-muted)]',
        link: 'bg-transparent [color:var(--ds-color-text-link)] !h-auto !p-0 enabled:hover:underline',
        danger:
          '[background-color:var(--ds-color-danger)] [color:var(--ds-color-danger-fg)] enabled:hover:[background-color:var(--ds-color-danger-hover)]',
      },
      size: {
        sm: 'h-8 px-2.5 text-[0.8125rem] sm:px-3 sm:text-sm',
        md: 'h-9 px-3 text-[0.8125rem] sm:h-10 sm:px-4 sm:text-sm',
        lg: 'h-11 px-4 text-sm sm:h-12 sm:px-5 sm:text-base',
        icon: 'h-9 w-9 p-0 sm:h-10 sm:w-10',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

export const ICON_ONLY: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'w-8 px-0',
  md: 'w-9 px-0 sm:w-10',
  lg: 'w-11 px-0 sm:w-12',
};

export const HOVER_EFFECT: Record<ButtonHoverEffect, string> = {
  none: '',
  // Nudges up.
  lift: 'enabled:hover:-translate-y-0.5 enabled:active:translate-y-0',
  // Elevates: lifts + casts a shadow (Material-style).
  raise: 'enabled:hover:-translate-y-0.5 enabled:hover:[box-shadow:var(--ds-shadow-md)] enabled:active:translate-y-0 enabled:active:[box-shadow:var(--ds-shadow-sm)]',
  // Scales up / down.
  grow: 'enabled:hover:scale-[1.04] enabled:active:scale-100',
  shrink: 'enabled:hover:scale-[0.96] enabled:active:scale-[0.94]',
  // Tactile press-in on click.
  press: 'enabled:hover:[box-shadow:var(--ds-shadow-sm)] enabled:active:scale-[0.97] enabled:active:[box-shadow:var(--ds-shadow-xs)]',
  // Soft outer glow.
  glow: 'enabled:hover:[box-shadow:var(--ds-shadow-lg)]',
  // Expanding halo ring.
  ring: 'enabled:hover:[box-shadow:0_0_0_0.1875rem_var(--ds-color-brand-subtle)]',
  // Light sheen sweeping across (premium CTA look).
  shine:
    "relative overflow-hidden isolate before:pointer-events-none before:absolute before:inset-0 before:content-[''] before:-translate-x-full before:skew-x-[-20deg] before:bg-gradient-to-r before:from-transparent before:via-white/25 before:to-transparent before:transition-transform before:duration-700 enabled:hover:before:translate-x-full",
  // Attention pulse.
  pulse: 'enabled:hover:animate-pulse',
};

export const SPINNER_SIZE: Record<'sm' | 'md' | 'lg' | 'icon', SpinnerSize> = {
  sm: 'sm',
  md: 'sm',
  lg: 'md',
  icon: 'sm',
};
