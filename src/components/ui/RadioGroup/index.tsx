import * as React from 'react';
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';
import { cn } from '@/lib/utils';

/**
 * RadioGroup — restyled to match the original (non-shadcn) design system:
 * 18px circle, 8px dot, `--ds-*` tokens, hover border and a token focus ring.
 * Built on Radix RadioGroup — `value` / `defaultValue` / `onValueChange` and
 * per-item `value` keep working.
 */
const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(({ className, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Root
      className={cn('flex flex-col gap-2', className)}
      {...props}
      ref={ref}
    />
  );
});
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName;

const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>
>(({ className, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Item
      ref={ref}
      className={cn(
        'inline-grid h-[1.125rem] w-[1.125rem] shrink-0 place-items-center rounded-full border [border-color:var(--ds-color-border-strong)] [background-color:var(--ds-color-bg-surface)] transition-[background-color,border-color,box-shadow] duration-[120ms] [transition-timing-function:var(--ds-ease-standard)]',
        'hover:[border-color:var(--ds-color-border-focus)]',
        'focus:outline-none focus-visible:[box-shadow:var(--ds-shadow-focus)]',
        'disabled:cursor-not-allowed disabled:opacity-[0.55]',
        'data-[state=checked]:[background-color:var(--ds-color-brand)] data-[state=checked]:[border-color:var(--ds-color-brand)]',
        className,
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
        <span className="h-2 w-2 rounded-full [background-color:var(--ds-color-brand-fg)]" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  );
});
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName;

export { RadioGroup, RadioGroupItem };
