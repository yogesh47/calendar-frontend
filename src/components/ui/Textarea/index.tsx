import * as React from 'react';
import { useId } from 'react';
import { cn } from '@/lib/utils';
import type { TextareaProps } from './Textarea.types';
import { SIZE } from './Textarea.constants';

export type { TextareaSize, TextareaProps } from './Textarea.types';
export * from './Textarea.constants';

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      size = 'md',
      label,
      hint,
      error,
      hover = true,
      showCount = false,
      allow,
      id,
      rows = 4,
      className,
      disabled,
      maxLength,
      value,
      defaultValue,
      onChange,
      'aria-describedby': ariaDescribedBy,
      ...rest
    },
    ref,
  ) => {
    const reactId = useId();
    const fieldId = id ?? reactId;
    const hintId = `${fieldId}-hint`;
    const errorId = `${fieldId}-error`;
    const hasError = Boolean(error);
    const describedBy =
      cn(ariaDescribedBy, hint && hintId, hasError && errorId) || undefined;

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
    const controlledValue = isControlled ? sanitize(String(value ?? '')) : undefined;
    const [innerCount, setInnerCount] = React.useState(
      () => sanitize(String(defaultValue ?? '')).length,
    );
    const count = isControlled ? (controlledValue as string).length : innerCount;
    const atLimit = maxLength != null && count >= maxLength;

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const clean = sanitize(e.target.value);
      if (clean !== e.target.value) e.target.value = clean;
      if (!isControlled) setInnerCount(clean.length);
      onChange?.(e);
    };

    return (
      <div className={cn('flex flex-col gap-1 [font-family:var(--ds-font-family-sans)]', className)}>
        {label && (
          <label
            htmlFor={fieldId}
            className="text-sm font-medium [color:var(--ds-color-text-secondary)]"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={fieldId}
          rows={rows}
          disabled={disabled}
          maxLength={maxLength}
          value={controlledValue}
          defaultValue={isControlled ? undefined : defaultValue}
          onChange={handleChange}
          aria-invalid={hasError || undefined}
          aria-describedby={describedBy}
          className={cn(
            'w-full min-h-20 resize-y rounded-md border font-[inherit] [background-color:var(--ds-color-bg-surface)] [border-color:var(--ds-color-border-strong)] [color:var(--ds-color-text-primary)] [line-height:var(--ds-line-height-base)] outline-none transition-[border-color,box-shadow] duration-[120ms] [transition-timing-function:var(--ds-ease-standard)]',
            'placeholder:[color:var(--ds-color-text-placeholder)]',
            'focus-visible:[border-color:var(--ds-color-border-focus)] focus-visible:[box-shadow:var(--ds-shadow-focus)]',
            SIZE[size],
            hover &&
              !disabled &&
              !hasError &&
              'hover:[&:not(:focus-visible)]:[border-color:var(--ds-color-border-focus)]',
            hasError && '[border-color:var(--ds-color-danger)]',
            'disabled:[background-color:var(--ds-color-bg-subtle)] disabled:cursor-not-allowed disabled:opacity-70',
          )}
          {...rest}
        />
        {(hasError || hint || showCount) && (
          <div className="flex items-start justify-between gap-3">
            <span className="min-w-0 flex-1">
              {hasError ? (
                <span id={errorId} className="text-xs [color:var(--ds-color-danger-text)]">
                  {error}
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
Textarea.displayName = 'Textarea';

export { Textarea };
