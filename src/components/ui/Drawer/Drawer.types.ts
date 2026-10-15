import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';

export type DrawerSide = 'right' | 'left' | 'top' | 'bottom';

export interface DrawerContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  /** Edge the drawer slides in from. Default 'right'. */
  side?: DrawerSide;
  /** Extra classes for the dimmed backdrop, e.g. a stronger tint or a blur. */
  overlayClassName?: string;
}
