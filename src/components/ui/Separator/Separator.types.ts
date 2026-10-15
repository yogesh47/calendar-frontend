import * as React from 'react';
import * as SeparatorPrimitive from '@radix-ui/react-separator';

export interface SeparatorProps
  extends React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root> {
  /** Optional text centered on the line (horizontal only). */
  label?: React.ReactNode;
}
