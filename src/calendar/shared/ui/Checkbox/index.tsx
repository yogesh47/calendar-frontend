import * as React from 'react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { Check, Minus } from '../../../icons';
import { cn } from '../../../lib/utils';
import type { CheckboxProps } from './Checkbox.types';

export type { CheckboxProps } from './Checkbox.types';

/**
 * Checkbox — restyled to match the original (non-shadcn) design system:
 * 18px box, `--ds-*` tokens, rounded-sm, hover border and a token focus ring.
 * Built on Radix Checkbox, so `checked` / `defaultChecked` / `onCheckedChange`
 * keep working (indeterminate via `checked="indeterminate"`). Optional
 * `label` and `error` slots match the original API.
 */
const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  CheckboxProps
>(({ className, label, error, id, disabled, ...props }, ref) => {
  const reactId = React.useId();
  const inputId = id ?? reactId;
  const errorId = `${inputId}-error`;
  const hasError = Boolean(error);

  const control = (
    <CheckboxPrimitive.Root
      ref={ref}
      id={inputId}
      disabled={disabled}
      aria-invalid={hasError || undefined}
      aria-describedby={hasError ? errorId : undefined}
      className={cn(
        'inline-grid h-[1.125rem] w-[1.125rem] shrink-0 place-items-center rounded-[var(--ds-radius-sm)] border [border-color:var(--ds-color-border-strong)] [background-color:var(--ds-color-bg-surface)] [color:var(--ds-color-brand-fg)] transition-[background-color,border-color,box-shadow] duration-[120ms] [transition-timing-function:var(--ds-ease-standard)]',
        'hover:[border-color:var(--ds-color-border-focus)]',
        'focus-visible:outline-none focus-visible:[box-shadow:var(--ds-shadow-focus)]',
        'disabled:cursor-not-allowed',
        'data-[state=checked]:[background-color:var(--ds-color-brand)] data-[state=checked]:[border-color:var(--ds-color-brand)]',
        'data-[state=indeterminate]:[background-color:var(--ds-color-brand)] data-[state=indeterminate]:[border-color:var(--ds-color-brand)]',
        hasError && '[border-color:var(--ds-color-danger)]',
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator className="flex items-center justify-center text-current">
        {props.checked === 'indeterminate' ? (
          <Minus className="h-3.5 w-3.5" strokeWidth={3} />
        ) : (
          <Check className="h-3.5 w-3.5" strokeWidth={3} />
        )}
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );

  if (!label && !hasError) return control;

  return (
    <label
      htmlFor={inputId}
      className={cn(
        'inline-grid grid-cols-[auto_1fr] items-center gap-2 [font-family:var(--ds-font-family-sans)] select-none',
        disabled ? 'cursor-not-allowed opacity-[0.55]' : 'cursor-pointer',
      )}
    >
      {control}
      {label && <span className="text-sm [color:var(--ds-color-text-primary)]">{label}</span>}
      {hasError && (
        <span id={errorId} className="col-start-2 text-xs [color:var(--ds-color-danger-text)]">
          {error}
        </span>
      )}
    </label>
  );
});
Checkbox.displayName = 'Checkbox';

export { Checkbox };
