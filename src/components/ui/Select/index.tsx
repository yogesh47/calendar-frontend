import * as React from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

const Select = SelectPrimitive.Root;
const SelectGroup = SelectPrimitive.Group;
const SelectValue = SelectPrimitive.Value;

const TRIGGER_SIZE = {
  sm: 'min-h-8 px-2 text-sm',
  md: 'min-h-10 px-3 text-sm',
  lg: 'min-h-12 px-4 text-base',
} as const;

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger> & {
    size?: keyof typeof TRIGGER_SIZE;
  }
>(({ className, children, size = 'md', ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      'group flex w-full items-center justify-between gap-2 rounded-md border py-1 [background-color:var(--ds-color-bg-surface)] [border-color:var(--ds-color-border-default)] [color:var(--ds-color-text-primary)] transition-[border-color,box-shadow] duration-[120ms] [transition-timing-function:var(--ds-ease-standard)]',
      'hover:[&:not(:focus-visible)]:[border-color:var(--ds-color-border-focus)]',
      'focus:outline-none focus:[border-color:var(--ds-color-border-focus)] focus:[box-shadow:var(--ds-shadow-focus)]',
      'disabled:cursor-not-allowed disabled:opacity-55',
      // The value span truncates with `truncate`, not `line-clamp-1`: the latter
      // sets `display:-webkit-box`, and as a flex item in this `justify-between`
      // row that box stopped filling the space once the label was long enough to
      // clip — so a truncated value drifted off the left edge towards the middle.
      // `flex-1 min-w-0 text-left` is what the searchable trigger already uses.
      'data-[placeholder]:[color:var(--ds-color-text-tertiary)]',
      '[&>span]:min-w-0 [&>span]:flex-1 [&>span]:truncate [&>span]:text-left',
      TRIGGER_SIZE[size],
      className,
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="h-[1.125rem] w-[1.125rem] flex-none [color:var(--ds-color-text-tertiary)] transition-transform duration-[120ms] [transition-timing-function:var(--ds-ease-standard)] group-data-[state=open]:rotate-180" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

const SelectScrollUpButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    className={cn('flex cursor-default items-center justify-center py-1', className)}
    {...props}
  >
    <ChevronUp className="h-4 w-4" />
  </SelectPrimitive.ScrollUpButton>
));
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName;

const SelectScrollDownButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    className={cn('flex cursor-default items-center justify-center py-1', className)}
    {...props}
  >
    <ChevronDown className="h-4 w-4" />
  </SelectPrimitive.ScrollDownButton>
));
SelectScrollDownButton.displayName = SelectPrimitive.ScrollDownButton.displayName;

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = 'popper', ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        'relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border [background-color:var(--ds-color-bg-surface)] [border-color:var(--ds-color-border-default)] [color:var(--ds-color-text-primary)] [box-shadow:var(--ds-shadow-lg)] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
        position === 'popper' &&
          'data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1',
        className,
      )}
      position={position}
      {...props}
    >
      <SelectScrollUpButton />
      <SelectPrimitive.Viewport
        className={cn(
          'p-1',
          position === 'popper' &&
            'h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]',
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
      <SelectScrollDownButton />
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
SelectContent.displayName = SelectPrimitive.Content.displayName;

const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn('py-1.5 pl-8 pr-2 text-sm font-semibold', className)}
    {...props}
  />
));
SelectLabel.displayName = SelectPrimitive.Label.displayName;

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      'relative flex w-full cursor-pointer select-none items-center rounded-sm py-2 pl-8 pr-2 text-sm outline-none [color:var(--ds-color-text-primary)] focus:[background-color:var(--ds-color-bg-muted)] data-[highlighted]:[background-color:var(--ds-color-bg-muted)] data-[disabled]:pointer-events-none data-[disabled]:[color:var(--ds-color-text-disabled)] data-[disabled]:cursor-not-allowed',
      className,
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
));
SelectItem.displayName = SelectPrimitive.Item.displayName;

const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn('-mx-1 my-1 h-px bg-muted', className)}
    {...props}
  />
));
SelectSeparator.displayName = SelectPrimitive.Separator.displayName;

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
};
