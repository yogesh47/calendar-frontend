import * as React from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { cn } from '@/lib/utils';
import type { RichTooltipContentProps, HoverTooltipProps } from './Tooltip.types';
export * from './Tooltip.constants';

export type {
  TooltipSide,
  HoverTooltipProps,
  RichTooltipContentProps,
} from './Tooltip.types';

/**
 * Tooltips open the moment the pointer lands on the control — a hint that arrives
 * half a second late has already been read as "nothing here". The delay lives here
 * only, so every tooltip in the app behaves the same.
 */
const TOOLTIP_DELAY_MS = 0;

const TooltipProvider = ({
  delayDuration = TOOLTIP_DELAY_MS,
  skipDelayDuration = TOOLTIP_DELAY_MS,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) => (
  <TooltipPrimitive.Provider
    delayDuration={delayDuration}
    skipDelayDuration={skipDelayDuration}
    {...props}
  />
);

/**
 * Tooltip root. It brings its own `Provider`, so a tooltip works in any tree —
 * Radix throws without one, and a hover hint must never take a screen down. An
 * app-level provider (for shared delays) still applies; this one nests under it.
 */
const Tooltip = ({
  delayDuration = TOOLTIP_DELAY_MS,
  children,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Root>) => (
  <TooltipProvider>
    <TooltipPrimitive.Root delayDuration={delayDuration} {...props}>
      {children}
    </TooltipPrimitive.Root>
  </TooltipProvider>
);
const TooltipTrigger = TooltipPrimitive.Trigger;

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, collisionPadding = 8, ...props }, ref) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      // The bubble follows the space it has: it flips to the opposite side when the
      // requested one does not fit and slides along the edge otherwise, always keeping
      // `collisionPadding` away from the viewport.
      avoidCollisions
      collisionPadding={collisionPadding}
      className={cn(
        // Tooltips are dark app-wide — a hover hint reads as a bubble over the UI,
        // not as another surface. Colours come from --ds-color-tooltip-*.
        'z-50 overflow-hidden rounded-md border border-transparent px-3 py-1.5 text-sm shadow-md',
        // Never wider than the room Radix reports, so a long label wraps instead of
        // being pushed off the screen.
        'max-w-[min(20rem,var(--radix-tooltip-content-available-width,20rem))] break-words [background-color:var(--ds-color-tooltip-bg)] [color:var(--ds-color-tooltip-fg)] animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
        className,
      )}
      {...props}
    />
  </TooltipPrimitive.Portal>
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

/**
 * Rich tooltip content that renders a {title, description} pair.
 * Pass children instead for the plain content usage.
 */
const RichTooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipContent>,
  RichTooltipContentProps
>(({ className, title, description, children, ...props }, ref) => (
  <TooltipContent
    ref={ref}
    className={cn('max-w-xs px-3 py-2', className)}
    {...props}
  >
    {title || description ? (
      <div className="space-y-1">
        {title ? <p className="font-semibold leading-none">{title}</p> : null}
        {description ? (
          <p className="text-xs text-muted-foreground">{description}</p>
        ) : null}
      </div>
    ) : (
      children
    )}
  </TooltipContent>
));
RichTooltipContent.displayName = 'RichTooltipContent';

/**
 * Reusable helper: conditionally wraps a single element in a hover tooltip.
 * Returns the child untouched when disabled or when there is no label — so any
 * component can offer an opt-in tooltip with almost no extra code. Kept for
 * reuse, e.g.:
 *   <HoverTooltip show={showTooltip} label={tooltip ?? ariaLabel} side="top">
 *     {control}
 *   </HoverTooltip>
 */
export function HoverTooltip({
  show,
  label,
  side = 'top',
  contentClassName,
  children,
}: HoverTooltipProps) {
  if (!show || label == null || label === '') return children;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side={side} className={contentClassName}>
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

export {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
  RichTooltipContent,
};
