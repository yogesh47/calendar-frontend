import * as React from 'react';
import { useId } from 'react';
import { cn } from '../../../lib/utils';
import type { InputProps } from './Input.types';
import { FIELD_SIZE, DATE_MAX } from './Input.constants';

export type { InputProps, InputSize } from './Input.types';
export * from './Input.constants';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_RE = /^(https?:\/\/)?([\w-]+\.)+[\w-]{2,}(\/\S*)?$/i;

/** Default, type-aware validation message (or null when valid / not applicable). */
function defaultValidate(value: string, type: string | undefined, required?: boolean): string | null {
  if (!value) return required ? 'This field is required' : null;
  if (type === 'email') return EMAIL_RE.test(value) ? null : 'Enter a valid email address';
  if (type === 'url') return URL_RE.test(value) ? null : 'Enter a valid URL';
  if (type === 'number') return Number.isNaN(Number(value)) ? 'Enter a valid number' : null;
  return null;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      size = 'md',
      label,
      hint,
      error,
      leftIcon,
      rightIcon,
      prefix,
      suffix,
      hover = true,
      showCount = false,
      allow,
      hideNativeIcon = false,
      validate = true,
      id,
      type,
      className,
      disabled,
      required,
      maxLength,
      max,
      value,
      defaultValue,
      onChange,
      onBlur,
      'aria-describedby': ariaDescribedBy,
      ...rest
    },
    ref,
  ) => {
    // Cap the year at 4 digits for date-family inputs (overridable via `max`).
    const effectiveMax = max ?? (type ? DATE_MAX[type] : undefined);
    const reactId = useId();
    const inputId = id ?? reactId;
    const hintId = `${inputId}-hint`;
    const errorId = `${inputId}-error`;

    // Non-global copy so `.test()` is stateless across characters.
    const allowRe = React.useMemo(
      () => (allow ? new RegExp(allow.source, allow.flags.replace('g', '')) : null),
      [allow],
    );
    const sanitize = React.useCallback(
      (v: string) => {
        let out = v;
        if (allowRe) out = Array.from(out).filter((ch) => allowRe.test(ch)).join('');
        if (typeof maxLength === 'number') out = out.slice(0, maxLength);
        return out;
      },
      [allowRe, maxLength],
    );

    const isControlled = value !== undefined;
    // Controlled/backend value is sanitized + truncated before display.
    const controlledValue = isControlled ? sanitize(String(value ?? '')) : undefined;
    const [innerValue, setInnerValue] = React.useState(() => sanitize(String(defaultValue ?? '')));
    const currentValue = isControlled ? (controlledValue as string) : innerValue;
    const count = currentValue.length;
    const atLimit = maxLength != null && count >= maxLength;

    // Validation: run after first blur, then live on every change.
    const [touched, setTouched] = React.useState(false);
    const autoError =
      validate === false
        ? null
        : typeof validate === 'function'
          ? validate(currentValue)
          : defaultValidate(currentValue, type, required);
    const displayError = error ?? (touched ? autoError ?? undefined : undefined);
    const hasError = Boolean(displayError);
    const describedBy =
      cn(ariaDescribedBy, hint && hintId, hasError && errorId) || undefined;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const clean = sanitize(e.target.value);
      if (clean !== e.target.value) e.target.value = clean; // fix uncontrolled DOM
      if (!isControlled) setInnerValue(clean);
      onChange?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setTouched(true);
      onBlur?.(e);
    };

    return (
      <div className={cn('flex flex-col gap-1.5 [font-family:var(--ds-font-family-sans)]', className)}>
        {label && (
          // Same type and gap as <Label>, so a text field lines up with the pickers beside it.
          <label
            htmlFor={inputId}
            className="text-sm font-medium leading-none [color:var(--ds-color-text-secondary)]"
          >
            {label}
          </label>
        )}
        <div
          className={cn(
            'flex items-center gap-2 rounded-md border [background-color:var(--ds-color-bg-surface)] [border-color:var(--ds-color-border-strong)] [color:var(--ds-color-text-primary)] transition-[border-color,box-shadow] duration-[120ms] [transition-timing-function:var(--ds-ease-standard)]',
            'focus-within:[border-color:var(--ds-color-border-focus)] focus-within:[box-shadow:var(--ds-shadow-focus)]',
            FIELD_SIZE[size],
            hover &&
              !disabled &&
              !hasError &&
              'hover:[&:not(:focus-within)]:[border-color:var(--ds-color-border-focus)]',
            hasError && '[border-color:var(--ds-color-danger)]',
            disabled && '[background-color:var(--ds-color-bg-subtle)] cursor-not-allowed opacity-70',
          )}
        >
          {leftIcon && (
            <span className="inline-grid flex-none place-items-center [color:var(--ds-color-text-tertiary)]">
              {leftIcon}
            </span>
          )}
          {prefix && (
            <span className="flex-none whitespace-nowrap [color:var(--ds-color-text-secondary)]">
              {prefix}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            type={type}
            disabled={disabled}
            required={required}
            maxLength={maxLength}
            max={effectiveMax}
            value={controlledValue}
            defaultValue={isControlled ? undefined : defaultValue}
            onChange={handleChange}
            onBlur={handleBlur}
            aria-invalid={hasError || undefined}
            aria-describedby={describedBy}
            className={cn(
              'min-w-0 flex-1 border-0 bg-transparent p-0 font-[inherit] text-[length:inherit] text-inherit outline-none placeholder:[color:var(--ds-color-text-placeholder)] disabled:cursor-not-allowed',
              hideNativeIcon &&
                '[&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-calendar-picker-indicator]:hidden [-moz-appearance:textfield]',
            )}
            {...rest}
          />
          {suffix && (
            <span className="flex-none whitespace-nowrap [color:var(--ds-color-text-secondary)]">
              {suffix}
            </span>
          )}
          {rightIcon && (
            <span className="inline-grid flex-none place-items-center [color:var(--ds-color-text-tertiary)]">
              {rightIcon}
            </span>
          )}
        </div>
        {(hasError || hint || showCount) && (
          // Sits 4px under the field, on a line no taller than its own text.
          <div className="-mt-0.5 flex items-start justify-between gap-3 text-xs leading-4">
            <span className="min-w-0 flex-1">
              {hasError ? (
                <span id={errorId} className="text-xs [color:var(--ds-color-danger-text)]">
                  {displayError}
                </span>
              ) : (
                hint && (
                  <span id={hintId} className="text-xs [color:var(--ds-color-text-secondary)]">
                    {hint}
                  </span>
                )
              )}
            </span>
            {showCount && (
              <span
                className={cn(
                  'shrink-0 text-xs tabular-nums [color:var(--ds-color-text-tertiary)]',
                  atLimit && '[color:var(--ds-color-danger-text)]',
                )}
              >
                {count}
                {maxLength != null ? `/${maxLength}` : ''}
              </span>
            )}
          </div>
        )}
      </div>
    );
  },
);
Input.displayName = 'Input';

export { Input };
