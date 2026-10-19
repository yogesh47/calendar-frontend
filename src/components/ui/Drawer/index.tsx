import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DrawerContentProps } from './Drawer.types';
import { SIDE } from './Drawer.constants';

export type { DrawerSide, DrawerContentProps } from './Drawer.types';
export * from './Drawer.constants';

/**
 * Drawer — an off-canvas panel that slides in from an edge (right by default).
 * Built on the Radix Dialog primitive, token-styled to match the design system.
 */

const Drawer = DialogPrimitive.Root;
const DrawerTrigger = DialogPrimitive.Trigger;
const DrawerClose = DialogPrimitive.Close;
const DrawerPortal = DialogPrimitive.Portal;

const DrawerOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-50 bg-foreground/40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      className,
    )}
    {...props}
  />
));
DrawerOverlay.displayName = 'DrawerOverlay';

const DrawerContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  DrawerContentProps
>(({ side = 'right', className, overlayClassName, children, onInteractOutside, ...props }, ref) => (
  <DrawerPortal>
    <DrawerOverlay className={overlayClassName} />
    <DialogPrimitive.Content
      ref={ref}
      /**
       * A product-tour / nudge tooltip portals to <body>, OUTSIDE this modal
       * content — Radix would read a click on its buttons as an outside
       * interaction and close the drawer under the nudge. Those elements are
       * part of the experience, not "outside".
       *
       * The last selector is the "Open in the 7Seers app" banner, which sits over
       * the top of a drawer on a phone. Dismissing the banner was closing the
       * drawer under it and losing the student's place. It is matched on its own
       * `aria-label` — that component is left untouched.
       */
      onInteractOutside={(event) => {
        const target = event.target as Element | null
        if (
          target?.closest(
            '.__floater, .react-joyride__overlay, [aria-label="Open in the 7Seers app"]',
          )
        ) {
          event.preventDefault()
          return
        }
        onInteractOutside?.(event)
      }}
      className={cn(
        'fixed z-50 flex flex-col gap-4 p-4 sm:p-6 [background-color:var(--ds-color-bg-surface)] [border-color:var(--ds-color-border-default)] [box-shadow:var(--ds-shadow-xl)] transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:duration-300 data-[state=closed]:duration-200 focus:outline-none',
        SIDE[side],
        className,
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 inline-flex size-8 items-center justify-center rounded-md [color:var(--ds-color-text-tertiary)] transition-colors hover:[background-color:var(--ds-color-bg-muted)] hover:[color:var(--ds-color-text-primary)] focus-visible:outline-none focus-visible:[box-shadow:var(--ds-shadow-focus)]">
        <X className="size-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DrawerPortal>
));
DrawerContent.displayName = 'DrawerContent';

const DrawerHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col gap-1.5', className)} {...props} />
);
DrawerHeader.displayName = 'DrawerHeader';

const DrawerFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('mt-auto flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', className)} {...props} />
);
DrawerFooter.displayName = 'DrawerFooter';

const DrawerTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn('text-lg font-semibold [color:var(--ds-color-text-primary)]', className)}
    {...props}
  />
));
DrawerTitle.displayName = 'DrawerTitle';

const DrawerDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn('text-sm [color:var(--ds-color-text-secondary)]', className)}
    {...props}
  />
));
DrawerDescription.displayName = 'DrawerDescription';

export {
  Drawer,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
};
