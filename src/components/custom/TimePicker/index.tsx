import {
  forwardRef,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover';
import type {
  Period,
  TimeFormat,
  TimeParts,
  TimePickerProps,
} from './TimePicker.types';
import { CELL_BASE, CELL_SELECTED, TRIGGER_SIZE } from './TimePicker.constants';

export type {
  TimeParts,
  Period,
  TimeFormat,
  TimePickerSize,
  TimePickerProps,
} from './TimePicker.types';
export * from './TimePicker.constants';

/* -------------------------------------------------------------------------- */
/* Time helpers (canonical value is a 24-hour "HH:mm" string).                */
/* -------------------------------------------------------------------------- */

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function parseTime(value: string | undefined): TimeParts | null {
  if (!value) return null;
  const match = /^(\d{1,2}):(\d{1,2})$/.exec(value.trim());
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return { hour, minute };
}

function formatCanonical(parts: TimeParts): string {
  return `${pad2(clamp(parts.hour, 0, 23))}:${pad2(clamp(parts.minute, 0, 59))}`;
}

function formatDisplay(parts: TimeParts, format: TimeFormat): string {
  if (format === '24h') return `${pad2(parts.hour)}:${pad2(parts.minute)}`;
  const period = parts.hour < 12 ? 'AM' : 'PM';
  const h12 = parts.hour % 12 === 0 ? 12 : parts.hour % 12;
  return `${h12}:${pad2(parts.minute)} ${period}`;
}

function periodOf(hour: number): Period {
  return hour < 12 ? 'AM' : 'PM';
}

function to24Hour(h12: number, period: Period): number {
  const base = h12 % 12; // 12 -> 0
  return period === 'PM' ? base + 12 : base;
}

function to12Hour(hour: number): number {
  const h = hour % 12;
  return h === 0 ? 12 : h;
}

function hourOptions(format: TimeFormat): number[] {
  if (format === '24h') return Array.from({ length: 24 }, (_, i) => i);
  return Array.from({ length: 12 }, (_, i) => (i === 0 ? 12 : i));
}

function minuteOptions(step: number): number[] {
  const safeStep = clamp(Math.floor(step) || 1, 1, 60);
  const out: number[] = [];
  for (let m = 0; m < 60; m += safeStep) out.push(m);
  return out;
}

/* -------------------------------------------------------------------------- */

export const TimePicker = forwardRef<HTMLButtonElement, TimePickerProps>(
  (
    {
      value,
      onChange,
      format = '12h',
      minuteStep = 5,
      placeholder = 'Select time',
      size = 'md',
      disabled = false,
      hover = true,
      label,
      hint,
      error,
      className,
      'aria-label': ariaLabel,
    },
    ref,
  ) => {
    const [open, setOpen] = useState(false);
    const hourColRef = useRef<HTMLUListElement>(null);
    const minuteColRef = useRef<HTMLUListElement>(null);
    const fieldId = useId();
    const hintId = useId();

    const parsed = parseTime(value);

    // Scroll the selected cells into view when the panel opens.
    useEffect(() => {
      if (!open) return;
      const scrollSelected = (col: HTMLUListElement | null) => {
        const el = col?.querySelector<HTMLElement>('[aria-selected="true"]');
        el?.scrollIntoView({ block: 'center' });
      };
      // Defer until the popover content is mounted.
      const id = window.setTimeout(() => {
        scrollSelected(hourColRef.current);
        scrollSelected(minuteColRef.current);
      }, 0);
      return () => window.clearTimeout(id);
    }, [open]);

    const emit = (parts: TimeParts) => onChange?.(formatCanonical(parts));

    const currentPeriod: Period = parsed ? periodOf(parsed.hour) : 'AM';

    const handleHourSelect = (h: number) => {
      const minute = parsed?.minute ?? 0;
      const hour24 = format === '24h' ? h : to24Hour(h, parsed ? periodOf(parsed.hour) : 'AM');
      emit({ hour: hour24, minute });
    };

    const handleMinuteSelect = (m: number) => {
      const hour = parsed?.hour ?? 0;
      emit({ hour, minute: m });
    };

    const handlePeriodSelect = (period: Period) => {
      const h12 = parsed ? to12Hour(parsed.hour) : 12;
      const hour = to24Hour(h12, period);
      emit({ hour, minute: parsed?.minute ?? 0 });
    };

    const hours = hourOptions(format);
    const minutes = minuteOptions(minuteStep);

    const hourIsSelected = (h: number) => {
      if (!parsed) return false;
      return format === '24h' ? parsed.hour === h : to12Hour(parsed.hour) === h;
    };
    const minuteIsSelected = (m: number) => parsed?.minute === m;

    // Arrow/Enter navigation inside a column list.
    const handleColumnKey = (
      e: KeyboardEvent<HTMLUListElement>,
      items: number[],
      isSelected: (v: number) => boolean,
      onPick: (v: number) => void,
    ) => {
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp' && e.key !== 'Enter') return;
      e.preventDefault();
      const currentIndex = items.findIndex(isSelected);
      if (e.key === 'Enter') {
        if (currentIndex >= 0) onPick(items[currentIndex]);
        return;
      }
      const from = currentIndex < 0 ? 0 : currentIndex;
      const delta = e.key === 'ArrowDown' ? 1 : -1;
      const next = clamp(from + delta, 0, items.length - 1);
      onPick(items[next]);
    };

    const displayValue = parsed ? formatDisplay(parsed, format) : undefined;
    const describedBy = error || hint ? hintId : undefined;

    return (
      <div className={cn('flex w-full flex-col gap-1 [font-family:var(--ds-font-family-sans)]', className)}>
        {label && (
          <label htmlFor={fieldId} className="text-sm font-medium [color:var(--ds-color-text-secondary)]">
            {label}
          </label>
        )}

        <Popover open={open} onOpenChange={disabled ? undefined : setOpen}>
          <PopoverTrigger asChild>
            <button
              ref={ref}
              id={fieldId}
              type="button"
              className={cn(
                'flex w-full items-center justify-between gap-2 rounded-md border py-1 text-left font-normal [background-color:var(--ds-color-bg-surface)] [border-color:var(--ds-color-border-default)] [color:var(--ds-color-text-primary)] transition-[border-color,box-shadow] duration-[120ms] [transition-timing-function:var(--ds-ease-standard)] focus-visible:outline-none focus-visible:[border-color:var(--ds-color-border-focus)] focus-visible:[box-shadow:var(--ds-shadow-focus)] disabled:cursor-not-allowed disabled:opacity-55',
                TRIGGER_SIZE[size],
                hover &&
                  !disabled &&
                  !error &&
                  'hover:[&:not(:focus-visible)]:[border-color:var(--ds-color-border-focus)]',
                error && '[border-color:var(--ds-color-danger)]',
              )}
              disabled={disabled}
              aria-invalid={error ? true : undefined}
              aria-describedby={describedBy}
              aria-label={ariaLabel ?? (label ? undefined : placeholder)}
            >
              <span className={cn('min-w-0 flex-1 truncate', !displayValue && '[color:var(--ds-color-text-tertiary)]')}>
                {displayValue ?? placeholder}
              </span>
              <Clock className="h-[1.125rem] w-[1.125rem] shrink-0 [color:var(--ds-color-text-tertiary)]" aria-hidden />
            </button>
          </PopoverTrigger>

          <PopoverContent className="w-auto rounded-[var(--ds-radius-lg)] p-2" align="start" aria-label="Choose time">
            <div className="flex gap-1">
              <ul
                ref={hourColRef}
                className="flex max-h-52 flex-col gap-0.5 overflow-y-auto border-r [border-color:var(--ds-color-border-default)] pr-1"
                role="listbox"
                aria-label="Hours"
                tabIndex={0}
                onKeyDown={(e) => handleColumnKey(e, hours, hourIsSelected, handleHourSelect)}
              >
                {hours.map((h) => {
                  const selected = hourIsSelected(h);
                  return (
                    <li
                      key={h}
                      role="option"
                      aria-selected={selected}
                      className={cn(
                        CELL_BASE,
                        selected && CELL_SELECTED,
                      )}
                      onClick={() => handleHourSelect(h)}
                    >
                      {pad2(h)}
                    </li>
                  );
                })}
              </ul>

              <ul
                ref={minuteColRef}
                className={cn(
                  'flex max-h-52 flex-col gap-0.5 overflow-y-auto pl-1',
                  format === '12h' && 'border-r [border-color:var(--ds-color-border-default)] pr-1',
                )}
                role="listbox"
                aria-label="Minutes"
                tabIndex={0}
                onKeyDown={(e) => handleColumnKey(e, minutes, minuteIsSelected, handleMinuteSelect)}
              >
                {minutes.map((m) => {
                  const selected = minuteIsSelected(m);
                  return (
                    <li
                      key={m}
                      role="option"
                      aria-selected={selected}
                      className={cn(
                        CELL_BASE,
                        selected && CELL_SELECTED,
                      )}
                      onClick={() => handleMinuteSelect(m)}
                    >
                      {pad2(m)}
                    </li>
                  );
                })}
              </ul>

              {format === '12h' && (
                <ul
                  className="flex max-h-52 flex-col gap-0.5 overflow-y-auto pl-1"
                  role="listbox"
                  aria-label="AM or PM"
                  tabIndex={0}
                >
                  {(['AM', 'PM'] as const).map((period) => {
                    const selected = currentPeriod === period && parsed != null;
                    return (
                      <li
                        key={period}
                        role="option"
                        aria-selected={selected}
                        className={cn(
                          CELL_BASE,
                          selected && 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground',
                        )}
                        onClick={() => handlePeriodSelect(period)}
                      >
                        {period}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div className="mt-2 flex justify-end border-t [border-color:var(--ds-color-border-default)] pt-2">
              <button
                type="button"
                className="rounded-[var(--ds-radius-sm)] px-3 py-1 text-sm font-medium [color:var(--ds-color-brand)] transition-colors hover:[background-color:var(--ds-color-brand-subtle)] focus-visible:outline-none focus-visible:[box-shadow:var(--ds-shadow-focus)]"
                onClick={() => setOpen(false)}
              >
                Done
              </button>
            </div>
          </PopoverContent>
        </Popover>

        {(error || hint) && (
          <p id={hintId} className={cn('m-0 text-xs [color:var(--ds-color-text-secondary)]', error && '[color:var(--ds-color-danger-text)]')}>
            {error ?? hint}
          </p>
        )}
      </div>
    );
  },
);
TimePicker.displayName = 'TimePicker';
