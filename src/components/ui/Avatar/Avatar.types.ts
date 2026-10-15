import * as React from 'react';
import * as AvatarPrimitive from '@radix-ui/react-avatar';

export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';
export type AvatarShape = 'circle' | 'square';

export type AvatarRootProps = React.ComponentPropsWithoutRef<
  typeof AvatarPrimitive.Root
>;

export interface AvatarProps extends AvatarRootProps {
  /** Convenience API: full name, used for initials fallback + alt text. */
  name?: string;
  /** Image URL (used with `name`). */
  src?: string;
  size?: AvatarSize;
  shape?: AvatarShape;
}

export interface AvatarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Max avatars to show before collapsing into a "+N" overflow chip. */
  max?: number;
  size?: AvatarSize;
}
