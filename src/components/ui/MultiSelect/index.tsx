import * as React from 'react';
import { Check, ChevronDown, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Spinner } from '@/components/ui/Spinner';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover';
import type {
  ComboboxProps,
  MultiSelectProps,
  OptionFetcher,
  SelectOption,
} from './MultiSelect.types';
import {
  TRIGGER_SIZE,
  triggerBase,
  rowBase,
  chipClass,
} from './MultiSelect.constants';

export type {
  SelectOption,
  OptionFetcher,
  Size,
  MultiSelectProps,
  ComboboxProps,
} from './MultiSelect.types';
export * from './MultiSelect.constants';

/* ─────────────────── async / remote search hook ─────────────────── */

interface RemoteState {
  remote: boolean;
  options: SelectOption[];
  loading: boolean;
  /** Debounced query handler wired to the search input. */
  onQuery: (q: string) => void;
  /** Kick off the initial fetch (called when the popover opens). */
  prime: () => void;
}

function useOptions(staticOptions: SelectOption[], onSearch?: OptionFetcher, debounce = 300): RemoteState {
  const remote = !!onSearch;
  const [options, setOptions] = React.useState<SelectOption[]>(staticOptions);
  const [loading, setLoading] = React.useState(false);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const reqId = React.useRef(0);
  const fnRef = React.useRef(onSearch);
  fnRef.current = onSearch;
  const primed = React.useRef(false);

  // Keep static options in sync when not in remote mode.
  React.useEffect(() => {
    if (!remote) setOptions(staticOptions);
  }, [remote, staticOptions]);

  React.useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const run = React.useCallback((q: string, immediate: boolean) => {
    const fn = fnRef.current;
    if (!fn) return;
    if (timer.current) clearTimeout(timer.current);
    setLoading(true);
    const fire = () => {
      const id = ++reqId.current;
      Promise.resolve(fn(q))
        .then((res) => {
          if (id === reqId.current) {
            setOptions(res);
            setLoading(false);
          }
        })
        .catch(() => {
          if (id === reqId.current) setLoading(false);
        });
    };
    if (immediate) fire();
    else timer.current = setTimeout(fire, debounce);
  }, [debounce]);

  const onQuery = React.useCallback((q: string) => run(q, false), [run]);
  const prime = React.useCallback(() => {
    if (!remote || primed.current) return;
    primed.current = true;
    run('', true);
  }, [remote, run]);

  return React.useMemo(
    () => ({ remote, options, loading, onQuery, prime }),
    [remote, options, loading, onQuery, prime],
  );
}

/* ──────────────────────────── OptionList ─────────────────────────── */

function OptionList({
  options,
  searchable,
  loading,
  remote,
  isSelected,
  onPick,
  onQuery,
  pageSize,
}: {
  options: SelectOption[];
  searchable?: boolean;
  loading?: boolean;
  remote?: boolean;
  isSelected: (v: string) => boolean;
  onPick: (v: string) => void;
  onQuery?: (q: string) => void;
  pageSize?: number;
}) {
  const [query, setQuery] = React.useState('');
  // In remote mode the server already filtered — don't filter again locally.
  const filtered = remote || !query
    ? options
    : options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()));

  // Cap how many rows render at once. A long list (e.g. ~1000 colleges) would
  // otherwise mount thousands of nodes on open; the rest is reached by typing in
  // the search box rather than by scrolling.
  const page = pageSize ?? 50;
  const [activeIndex, setActiveIndex] = React.useState(0);
  const listRef = React.useRef<HTMLDivElement>(null);
  // Only keyboard moves scroll the list — doing it on hover makes the list jump
  // under the cursor while scrolling.
  const scrollOnActive = React.useRef(false);

  // The list keeps its own order — a menu whose rows move as you pick them reads
  // as a glitch. The selection is only pulled up when it would otherwise fall
  // outside the rows on screen.
  const selectedIndex = filtered.findIndex((o) => isSelected(o.value));
  const ordered = React.useMemo(() => {
    if (selectedIndex < page) return filtered;
    const copy = filtered.slice();
    const [picked] = copy.splice(selectedIndex, 1);
    return [picked, ...copy];
  }, [filtered, page, selectedIndex]);

  const shown = ordered.slice(0, page);
  const hiddenCount = ordered.length - shown.length;

  React.useEffect(() => {
    if (!scrollOnActive.current) return;
    scrollOnActive.current = false;
    listRef.current
      ?.querySelector<HTMLElement>('[data-active="true"]')
      ?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  const moveActive = (delta: number) => {
    scrollOnActive.current = true;
    setActiveIndex((index) => Math.min(Math.max(index + delta, 0), Math.max(shown.length - 1, 0)));
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      moveActive(1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      moveActive(-1);
    } else if (event.key === 'Home') {
      event.preventDefault();
      scrollOnActive.current = true;
      setActiveIndex(0);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const picked = shown[activeIndex];
      if (picked && !picked.disabled) onPick(picked.value);
    }
  };

  const resetWindow = () => {
    setActiveIndex(0);
    listRef.current?.scrollTo({ top: 0 });
  };

  return (
    <div className="flex flex-col" onKeyDown={handleKeyDown}>
      {searchable && (
        <div className="flex items-center gap-2 border-b px-2 pb-2 pt-1">
          <Search className="size-4 shrink-0 [color:var(--ds-color-text-tertiary)]" />
          <input
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              onQuery?.(e.target.value);
              resetWindow();
            }}
            placeholder="Search…"
            className="w-full bg-transparent py-1 text-sm outline-none placeholder:[color:var(--ds-color-text-placeholder)]"
          />
        </div>
      )}
      <div ref={listRef} className="max-h-60 overflow-y-auto overscroll-contain p-1">
        {loading && (
          <div className="flex items-center justify-center gap-2 px-2 py-6 text-sm text-muted-foreground">
            <Spinner size="sm" />
            Loading…
          </div>
        )}
        {!loading && filtered.length === 0 && (
          <p className="px-2 py-6 text-center text-sm text-muted-foreground">No results</p>
        )}
        {!loading &&
          shown.map((o, index) => (
            <button
              key={o.value}
              type="button"
              role="option"
              aria-selected={isSelected(o.value)}
              data-active={index === activeIndex || undefined}
              disabled={o.disabled}
              className={cn(rowBase, 'data-[active]:bg-accent')}
              onClick={() => onPick(o.value)}
            >
              <span className="flex size-4 shrink-0 items-center justify-center">
                {isSelected(o.value) && <Check className="size-4 [color:var(--ds-color-brand)]" />}
              </span>
              {o.icon}
              <span className="flex-1 truncate">{o.label}</span>
            </button>
          ))}
        {!loading && hiddenCount > 0 && (
          <p className="px-2 py-2 text-center text-xs text-muted-foreground">
            {hiddenCount} more — type to search
          </p>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────── MultiSelect ─────────────────────────── */

export function MultiSelect({
  options,
  value,
  onChange,
  placeholder = 'Select…',
  size = 'md',
  searchable = true,
  maxChips = 'auto',
  pageSize,
  onSearch,
  disabled,
  className,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const rowRef = React.useRef<HTMLSpanElement>(null);
  const measureRef = React.useRef<HTMLSpanElement>(null);
  const [autoCount, setAutoCount] = React.useState(99);

  const remoteState = useOptions(options, onSearch);
  const active = remoteState.options;

  // Cache label metadata so chips keep their labels even after a remote
  // search swaps the visible option list.
  const cache = React.useRef(new Map<string, SelectOption>());
  [...options, ...active].forEach((o) => cache.current.set(o.value, o));

  const toggle = (v: string) =>
    onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  const selected = value.map((v) => cache.current.get(v) ?? { label: v, value: v });

  const { prime } = remoteState;

  React.useEffect(() => {
    if (open) prime();
  }, [open, prime]);

  // Auto mode: fit as many chips as the field width allows, collapse the rest.
  React.useLayoutEffect(() => {
    if (maxChips !== 'auto') return;
    const row = rowRef.current;
    const measure = measureRef.current;
    if (!row || !measure) return;
    const compute = () => {
      const avail = row.clientWidth;
      const chips = Array.from(measure.children) as HTMLElement[];
      const GAP = 4;
      const RESERVE = 46; // room for the "+N" chip
      let used = 0;
      let count = 0;
      for (let i = 0; i < chips.length; i++) {
        const w = chips[i].offsetWidth + (i > 0 ? GAP : 0);
        const reserve = i < chips.length - 1 ? RESERVE : 0;
        if (used + w + reserve <= avail) {
          used += w;
          count += 1;
        } else break;
      }
      setAutoCount(count);
    };
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(row);
    return () => ro.disconnect();
  }, [maxChips, value, active]);

  const limit = maxChips === 'auto' ? autoCount : maxChips;
  const visible = selected.slice(0, limit);
  const overflow = selected.length - visible.length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" disabled={disabled} className={cn(triggerBase, TRIGGER_SIZE[size], className)}>
          <span ref={rowRef} className="relative flex min-w-0 flex-1 items-center gap-1 overflow-hidden">
            {selected.length === 0 && (
              <span className="[color:var(--ds-color-text-placeholder)]">{placeholder}</span>
            )}
            {visible.map((o) => (
              <span key={o.value} className={chipClass}>
                <span className="truncate">{o.label}</span>
                <X
                  className="size-3 shrink-0 cursor-pointer hover:opacity-70"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggle(o.value);
                  }}
                />
              </span>
            ))}
            {overflow > 0 && (
              <span className="inline-flex shrink-0 items-center rounded-full [background-color:var(--ds-color-bg-muted)] [color:var(--ds-color-text-secondary)] px-2 py-0.5 text-xs font-semibold">
                +{overflow}
              </span>
            )}
            {/* Hidden measurement row (all chips) for auto-fit. */}
            {maxChips === 'auto' && (
              <span
                ref={measureRef}
                aria-hidden
                className="pointer-events-none invisible absolute left-0 top-0 flex items-center gap-1"
              >
                {selected.map((o) => (
                  <span key={o.value} className={chipClass}>
                    <span className="truncate">{o.label}</span>
                    <X className="size-3 shrink-0" />
                  </span>
                ))}
              </span>
            )}
          </span>
          <ChevronDown className="size-4 shrink-0 opacity-60" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <OptionList
          options={active}
          searchable={searchable}
          loading={remoteState.loading}
          remote={remoteState.remote}
          isSelected={(v) => value.includes(v)}
          onPick={toggle}
          onQuery={remoteState.onQuery}
          pageSize={pageSize}
        />
      </PopoverContent>
    </Popover>
  );
}

/* ──────────────────────────── Combobox ───────────────────────────── */

export function Combobox({
  options,
  value,
  onChange,
  placeholder = 'Select…',
  size = 'md',
  searchable = true,
  onSearch,
  disabled,
  className,
  pageSize,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const remoteState = useOptions(options, onSearch);
  const active = remoteState.options;

  const cache = React.useRef(new Map<string, SelectOption>());
  [...options, ...active].forEach((o) => cache.current.set(o.value, o));
  const current = value ? cache.current.get(value) : undefined;

  const { prime } = remoteState;

  React.useEffect(() => {
    if (open) prime();
  }, [open, prime]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" disabled={disabled} className={cn(triggerBase, TRIGGER_SIZE[size], className)}>
          <span className={cn('flex-1 truncate text-left', !current && '[color:var(--ds-color-text-tertiary)]')}>
            {current ? (
              <span className="inline-flex items-center gap-2">
                {current.icon}
                {current.label}
              </span>
            ) : (
              placeholder
            )}
          </span>
          <ChevronDown className="size-4 shrink-0 opacity-60" />
        </button>
      </PopoverTrigger>
      {/* At least the trigger's width, but wider when a label needs it — pinned
          to the trigger's width, long options ended in an ellipsis. */}
      <PopoverContent
        className="w-max min-w-[--radix-popover-trigger-width] max-w-[22rem] p-0"
        align="end"
      >
        <OptionList
          options={active}
          searchable={searchable}
          loading={remoteState.loading}
          remote={remoteState.remote}
          isSelected={(v) => v === value}
          onPick={(v) => {
            onChange(v);
            setOpen(false);
          }}
          onQuery={remoteState.onQuery}
          pageSize={pageSize}
        />
      </PopoverContent>
    </Popover>
  );
}
