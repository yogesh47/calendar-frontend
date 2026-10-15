import type { Size } from './MultiSelect.types';

export const TRIGGER_SIZE: Record<Size, string> = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-3 text-sm',
  lg: 'h-12 px-4 text-base',
};

export const triggerBase =
  'flex w-full items-center justify-between gap-2 rounded-md border [background-color:var(--ds-color-bg-surface)] [border-color:var(--ds-color-border-strong)] [color:var(--ds-color-text-primary)] transition-[border-color,box-shadow] duration-[120ms] [transition-timing-function:var(--ds-ease-standard)] enabled:hover:[border-color:var(--ds-color-border-focus)] focus-visible:outline-none focus-visible:[border-color:var(--ds-color-border-focus)] focus-visible:[box-shadow:var(--ds-shadow-focus)] disabled:[background-color:var(--ds-color-bg-subtle)] disabled:cursor-not-allowed disabled:opacity-70';

export const rowBase =
  'flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-left [color:var(--ds-color-text-primary)] hover:bg-accent focus-visible:bg-accent focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50';

export const chipClass =
  'inline-flex max-w-[10rem] shrink-0 items-center gap-1 rounded-full [background-color:var(--ds-color-brand-subtle)] [color:var(--ds-color-brand)] px-2 py-0.5 text-xs font-medium';
