import { cva } from 'class-variance-authority';

export const labelVariants = cva(
  'block text-sm font-medium leading-none [color:var(--ds-color-text-secondary)] peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
);
