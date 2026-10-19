import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DialogContentProps } from './Dialog.types';

export type { DialogAnimation, DialogContentProps } from './Dialog.types';

/**
 * Radix's Root, with one guard on top.
 *
 * A modal dialog puts `pointer-events: none` on <body> while it is open and
 * takes it off on close. If the two ever miss each other the style stays, and
 * from then on EVERY click anywhere on the page is swallowed — the page is
 * fully rendered and completely dead, which reads as "the browser hung".
 *
 * The case that hits it here: the profile photo picker lives inside the Edit
 * Profile dialog, and opening a native file picker takes focus out of the page
 * and back. Nothing lands in the console and no request goes out, so there is
 * nothing to see — the page simply stops responding. Before the redesign that
 * picker sat on the profile card, outside any dialog, which is why this never
 * happened.
 *
 * So: once no dialog is open anywhere in the document, the style is cleared.
 * Nothing else in this app writes `body.style.pointerEvents`, and the check runs
 * after paint, so this is inert every time Radix cleans up properly.
 */
const Dialog = ({ children, ...props }: React.ComponentProps<typeof DialogPrimitive.Root>) => {
  const releaseBody = React.useCallback(() => {
    // A frame later: Radix removes the style during its own close, and racing it
    // would clear a lock another dialog still needs.
    requestAnimationFrame(() => {
      if (document.querySelector('[data-radix-dialog-content][data-state="open"]')) return
      if (document.querySelector('[role="dialog"][data-state="open"]')) return
      if (document.body.style.pointerEvents === 'none') document.body.style.pointerEvents = '';
    });
  }, []);

  // Covers the dialog being unmounted while open — the other way the cleanup is
  // skipped — as well as every ordinary close.
  React.useEffect(() => releaseBody, [releaseBody]);

  return (
    <DialogPrimitive.Root
      {...props}
      onOpenChange={(open) => {
        props.onOpenChange?.(open);
        if (!open) releaseBody();
      }}
    >
      {children}
    </DialogPrimitive.Root>
  );
};
const DialogTrigger = DialogPrimitive.Trigger;
const DialogPortal = DialogPrimitive.Portal;
const DialogClose = DialogPrimitive.Close;

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      className,
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  DialogContentProps
>(({ className, children, animation = 'zoom', ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      data-dlg-anim={animation}
      className={cn(
        'fixed left-1/2 top-1/2 z-50 grid w-full max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 border bg-background p-4 shadow-lg sm:rounded-lg sm:p-6',
        className,
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-3 top-3 grid size-8 place-items-center rounded-md opacity-70 sm:right-5 sm:top-5 ring-offset-background transition-opacity hover:bg-accent hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none">
        <X className="size-5" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex flex-col space-y-1.5 text-center sm:text-left',
      className,
    )}
    {...props}
  />
);
DialogHeader.displayName = 'DialogHeader';

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2',
      className,
    )}
    {...props}
  />
);
DialogFooter.displayName = 'DialogFooter';

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      'text-lg font-semibold leading-none tracking-tight',
      className,
    )}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
