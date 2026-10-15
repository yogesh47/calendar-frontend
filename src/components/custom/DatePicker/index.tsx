import { useState } from 'react';
import { format, isValid, parse } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/Calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover';
import { cn } from '@/lib/utils';
import { DEFAULT_YEAR_SPAN, DISPLAY_FORMAT, VALUE_FORMAT } from './DatePicker.constants';
import type { DatePickerProps } from './DatePicker.types';

export type { DatePickerProps } from './DatePicker.types';

/**
 * DatePicker — one date, picked from a calendar in a popover.
 *
 * The contract is the API's: the value goes in and comes out as `YYYY-MM-DD`, while
 * the box reads `dd/MM/yyyy`. The month grid is the shared `Calendar`, and
 * `showMonthPicker` / `showYearPicker` turn on its dropdown caption — which is what
 * makes a date years away (a passout year, an old start date) reachable at all.
 *
 * Anything unparseable is treated as no date rather than guessed at, so a value the
 * server sends in another shape can never crash the field.
 */
const DatePicker = ({
  id,
  value,
  onChange,
  placeholder = 'Select date',
  isDisabled = false,
  hasError = false,
  min,
  max,
  showMonthPicker = false,
  showYearPicker = false,
  yearRange,
  className,
  'aria-label': ariaLabel,
}: DatePickerProps) => {
  const [isOpen, setIsOpen] = useState(false);

  /** `YYYY-MM-DD` → Date, and undefined for anything else. */
  const toDate = (raw?: string) => {
    if (!raw) return undefined;
    const parsed = parse(raw, VALUE_FORMAT, new Date());
    return isValid(parsed) ? parsed : undefined;
  };

  const selected = toDate(value);
  const currentYear = new Date().getFullYear();
  const years = yearRange ?? {
    from: currentYear - DEFAULT_YEAR_SPAN,
    to: currentYear + DEFAULT_YEAR_SPAN,
  };

  /** Picking a day writes it back in the API's format and closes the popover. */
  const handleSelect = (date?: Date) => {
    if (date) onChange(format(date, VALUE_FORMAT));
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild disabled={isDisabled}>
        <button
          id={id}
          type="button"
          aria-label={ariaLabel}
          className={cn(
            'flex h-[2.5rem] w-full items-center gap-2 rounded-[var(--ds-radius-control)] border bg-white px-[0.875rem] text-left text-[0.875rem] font-medium leading-[1.25rem] outline-none transition-colors',
            hasError
              ? '[border-color:var(--ds-color-danger)]'
              : '[border-color:var(--ds-color-border-default)]',
            'focus-visible:[box-shadow:var(--ds-shadow-focus)]',
            isDisabled && 'cursor-not-allowed opacity-60 [background-color:var(--ds-color-bg-muted)]',
            className,
          )}
        >
          <CalendarIcon className="size-[1rem] shrink-0 [color:var(--ds-color-text-tertiary)]" />
          <span
            className={cn(
              'flex-1 truncate',
              selected ? '[color:var(--color-gray-800)]' : '[color:var(--ds-color-text-tertiary)]',
            )}
          >
            {selected ? format(selected, DISPLAY_FORMAT) : placeholder}
          </span>
        </button>
      </PopoverTrigger>

      <PopoverContent align="start" sideOffset={4} className="w-auto p-0">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={handleSelect}
          defaultMonth={selected}
          // Dropdowns in the caption, and the years they may offer.
          captionLayout={showMonthPicker || showYearPicker ? 'dropdown' : undefined}
          fromYear={years.from}
          toYear={years.to}
          disabled={(date) => {
            const from = toDate(min);
            const to = toDate(max);
            return Boolean((from && date < from) || (to && date > to));
          }}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  );
};

export { DatePicker };
export default DatePicker;
