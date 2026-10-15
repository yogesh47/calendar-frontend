import * as React from 'react';
import * as SeparatorPrimitive from '@radix-ui/react-separator';
import { cn } from '@/lib/utils';
import type { SeparatorProps } from './Separator.types';

export type { SeparatorProps } from './Separator.types';

/**
 * Separator — shadcn/Radix separator extended with the original Divider's
 * optional centered label (horizontal orientation only).
 */
const Separator = React.forwardRef<
  React.ElementRef<typeof SeparatorPrimitive.Root>,
  SeparatorProps
>(({ className, orientation = 'horizontal', decorative = true, label, ...props }, ref) => {
  const isHorizontal = orientation === 'horizontal';

  if (label != null && isHorizontal) {
    return (
      <div
        ref={ref as React.Ref<HTMLDivElement>}
        role="separator"
        aria-orientation="horizontal"
        className={cn('flex items-center gap-3', className)}
      >
        <span className="h-px flex-1 bg-border" />
        <span className="flex-none whitespace-nowrap text-sm [color:var(--ds-color-text-secondary)]">
          {label}
        </span>
        <span className="h-px flex-1 bg-border" />
      </div>
    );
  }

  return (
    <SeparatorPrimitive.Root
      ref={ref}
      decorative={decorative}
      orientation={orientation}
      className={cn(
        'shrink-0 bg-border',
        isHorizontal ? 'h-px w-full' : 'h-full w-px',
        className,
      )}
      {...props}
    />
  );
});
Separator.displayName = SeparatorPrimitive.Root.displayName;

export { Separator };
