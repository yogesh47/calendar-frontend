import type * as React from 'react';
import type { TooltipContent } from './index';

export interface RichTooltipContentProps
  extends Omit<React.ComponentPropsWithoutRef<typeof TooltipContent>, 'title'> {
  title?: React.ReactNode;
  description?: React.ReactNode;
}

export type TooltipSide = 'top' | 'right' | 'bottom' | 'left';

export interface HoverTooltipProps {
  /** When true and `label` is non-empty, wraps children in a hover tooltip. */
  show?: boolean;
  label?: React.ReactNode;
  side?: TooltipSide;
  /** Extra classes for the tooltip bubble, e.g. a dark variant. */
  contentClassName?: string;
  children: React.ReactElement;
}
