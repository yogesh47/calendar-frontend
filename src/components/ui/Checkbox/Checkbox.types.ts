import * as React from 'react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';

export interface CheckboxProps
  extends React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> {
  label?: React.ReactNode;
  /** Error message; when set, applies the danger state. */
  error?: string;
}
