import type { AvatarShape, AvatarSize } from './Avatar.types';

export const SIZE: Record<AvatarSize, string> = {
  sm: 'h-6 w-6 text-xs',
  md: 'h-8 w-8 text-sm',
  lg: 'h-10 w-10 text-base',
  xl: 'h-14 w-14 text-lg',
};

export const SHAPE: Record<AvatarShape, string> = {
  circle: 'rounded-full',
  square: 'rounded-md',
};

/** Deterministic token-backed tone buckets, keyed off the name. */
export const TONES = [
  '[background-color:var(--ds-color-brand-subtle)] [color:var(--ds-color-brand)]',
  '[background-color:var(--ds-color-accent-subtle)] [color:var(--ds-color-accent)]',
  '[background-color:var(--ds-color-success-subtle)] [color:var(--ds-color-success-text)]',
  '[background-color:var(--ds-color-warning-subtle)] [color:var(--ds-color-warning-text)]',
  '[background-color:var(--ds-color-danger-subtle)] [color:var(--ds-color-danger-text)]',
  '[background-color:var(--ds-color-info-subtle)] [color:var(--ds-color-info)]',
];
