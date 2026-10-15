import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';

export type DialogAnimation =
  | 'fade'
  | 'zoom'
  | 'slide-up'
  | 'slide-down'
  | 'slide-left'
  | 'slide-right'
  | 'flip';

export interface DialogContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  /** Enter/exit animation. Default 'zoom'. */
  animation?: DialogAnimation;
}
