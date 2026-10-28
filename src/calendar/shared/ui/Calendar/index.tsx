import * as React from 'react';
import { ChevronDown, ChevronLeft, ChevronRight } from '../../../icons';
import { DayPicker, type DropdownProps } from 'react-day-picker';
import { cn } from '../../../lib/utils';
import { buttonVariants } from '../Button';

type DayPickerProps = React.ComponentProps<typeof DayPicker>;

export type CalendarProps = DayPickerProps & {
  /** First and last year the dropdowns offer (kept from the original API). */
  fromYear?: number;
  toYear?: number;
};

/**
 * Custom month/year caption dropdown — replaces the native <select> with a
 * compact, scrollable, token-styled menu (fixes the huge native year list).
 *
 * `react-day-picker` hands the choices in as `options`; anything passed as
 * `<option>` children is read too, so the component works either way.
 */
function CalendarDropdown({
  value,
  onChange,
  options,
  children,
}: DropdownProps & { children?: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const onDoc = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('pointerdown', onDoc);
    document.addEventListener('keydown', onKey);
    // Bring the selected option into view.
    listRef.current
      ?.querySelector<HTMLElement>('[data-selected="true"]')
      ?.scrollIntoView({ block: 'center' });
    return () => {
      document.removeEventListener('pointerdown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  /** One list of choices, whichever way they arrived. */
  const items =
    options?.map((option) => ({
      value: String(option.value),
      label: option.label,
      disabled: option.disabled,
    })) ??
    (React.Children.toArray(children).filter(React.isValidElement) as React.ReactElement<{
      value: string | number;
      children: React.ReactNode;
      disabled?: boolean;
    }>[]
    ).map((option) => ({
      value: String(option.props.value),
      label: option.props.children,
      disabled: option.props.disabled,
    }));

  const select = (v: string) => {
    onChange?.({ target: { value: v } } as unknown as React.ChangeEvent<HTMLSelectElement>);
    setOpen(false);
  };

  const caption = items.find((item) => item.value === String(value))?.label;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-sm font-medium [border-color:var(--ds-color-border-default)] [color:var(--ds-color-text-primary)] hover:[background-color:var(--ds-color-bg-muted)] focus-visible:outline-none focus-visible:[border-color:var(--ds-color-border-focus)] focus-visible:[box-shadow:var(--ds-shadow-focus)]"
      >
        {caption}
        <ChevronDown className="size-3.5 opacity-60" />
      </button>
      {open && (
        <div
          ref={listRef}
          className="absolute left-0 top-full z-50 mt-1 max-h-52 min-w-[5.5rem] overflow-y-auto rounded-md border [border-color:var(--ds-color-border-default)] [background-color:var(--ds-color-bg-surface)] p-1 [box-shadow:var(--ds-shadow-lg)]"
        >
          {items.map((item) => {
            const selected = String(value) === item.value;
            return (
              <button
                key={item.value}
                type="button"
                data-selected={selected}
                disabled={item.disabled}
                onClick={() => select(item.value)}
                className={cn(
                  'flex w-full items-center rounded-sm px-2 py-1.5 text-left text-sm [color:var(--ds-color-text-primary)] hover:bg-accent disabled:pointer-events-none disabled:opacity-50',
                  selected && 'bg-accent font-medium',
                )}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * Calendar — one month of days, with an optional month / year dropdown caption.
 *
 * `captionLayout="dropdown"` is what makes a date years away reachable; the year
 * range then defaults wide (1920 → ten years out) and `fromYear` / `toYear` narrow
 * it. Everything is styled through the design system's tokens, so the calendar
 * looks the same wherever it is opened.
 */
function Calendar(props: CalendarProps) {
  const {
    className,
    classNames,
    showOutsideDays = true,
    captionLayout,
    fromYear,
    toYear,
    ...rest
  } = props;
  // When using a dropdown caption, default to a broad year range so the year
  // picker is usable out of the box (overridable via fromYear / toYear).
  const isDropdown = captionLayout === 'dropdown' || captionLayout === 'dropdown-years';
  const currentYear = new Date().getFullYear();
  const firstYear = isDropdown ? (fromYear ?? 1920) : fromYear;
  const lastYear = isDropdown ? (toYear ?? currentYear + 10) : toYear;

  // `DayPickerProps` is a union (single / multiple / range), and spreading a union
  // loses the discriminant — so the props are assembled once and handed over whole.
  const dayPickerProps = {
    ...rest,
    showOutsideDays,
    captionLayout,
    // The window the dropdowns offer, and the days the grid will render.
    startMonth: firstYear ? new Date(firstYear, 0) : undefined,
    endMonth: lastYear ? new Date(lastYear, 11) : undefined,
    className: cn('p-3', className),
    classNames: {
      months: 'flex flex-col sm:flex-row gap-4',
      month: 'flex flex-col gap-4',
      month_caption: 'flex items-center justify-center pt-1 relative',
      caption_label: 'text-sm font-medium',
      dropdowns: 'flex items-center justify-center gap-1.5',
      nav: 'flex items-center gap-1',
      button_previous: cn(
        buttonVariants({ variant: 'outline' }),
        'absolute left-1 top-1 z-10 h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100',
      ),
      button_next: cn(
        buttonVariants({ variant: 'outline' }),
        'absolute right-1 top-1 z-10 h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100',
      ),
      month_grid: 'w-full border-collapse',
      weekdays: 'flex',
      weekday: 'text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]',
      week: 'flex w-full mt-2',
      day: 'h-9 w-9 text-center text-sm p-0 relative focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md',
      day_button: cn(
        buttonVariants({ variant: 'ghost' }),
        'h-9 w-9 p-0 font-normal aria-selected:opacity-100',
      ),
      range_end: 'day-range-end',
      // The picked day is drawn entirely by the BUTTON, and the cell is cleared.
      //
      // Three things fought over it before:
      //  - these classes land on the gridcell, but the button inside carries the
      //    ghost variant's own `[color:var(--ds-color-text-primary)]`, and an
      //    explicit colour beats an inherited one — the number stayed dark;
      //  - the same variant's `enabled:hover:[background-color:…bg-muted]` covered
      //    the purple on hover, leaving a pale cell with a white number on it;
      //  - `day` gives the cell `bg-accent` via `[&:has([aria-selected])]`, whose
      //    `:has()` outranks a plain class — that light grey sat behind the
      //    button's rounded corners and read as a border on all four sides.
      //
      // `!` rather than longer selectors: both ghost rules sit on the button
      // itself, and out-specifying a `:enabled:hover` chain from the parent is
      // brittle to read and to Tailwind's variant ordering. The codebase already
      // uses important this way (`!text-white` in HubHeader, `!h-auto` in the
      // link variant).
      selected: cn(
        '!bg-transparent',
        '[&>button]:!bg-primary [&>button]:!text-primary-foreground',
      ),
      today: 'bg-accent text-accent-foreground rounded-md',
      outside: 'day-outside text-muted-foreground aria-selected:text-muted-foreground',
      disabled: 'text-muted-foreground opacity-50',
      range_middle: 'aria-selected:bg-accent aria-selected:text-accent-foreground',
      hidden: 'invisible',
      ...classNames,
    },
    components: {
      Dropdown: CalendarDropdown,
      Chevron: ({
        orientation,
        className: chevronClassName,
      }: {
        orientation?: 'up' | 'down' | 'left' | 'right';
        className?: string;
      }) =>
        orientation === 'left' ? (
          <ChevronLeft className={cn('h-4 w-4', chevronClassName)} />
        ) : (
          <ChevronRight className={cn('h-4 w-4', chevronClassName)} />
        ),
    },
  } as DayPickerProps;

  return <DayPicker {...dayPickerProps} />;
}
Calendar.displayName = 'Calendar';

export { Calendar };
export default Calendar;
