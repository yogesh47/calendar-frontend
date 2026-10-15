import * as React from 'react';
import * as AvatarPrimitive from '@radix-ui/react-avatar';
import { cn } from '@/lib/utils';
import type { AvatarGroupProps, AvatarProps } from './Avatar.types';
import { SIZE, SHAPE, TONES } from './Avatar.constants';

export type {
  AvatarSize,
  AvatarShape,
  AvatarProps,
  AvatarGroupProps,
} from './Avatar.types';
export * from './Avatar.constants';

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function toneFor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return TONES[hash % TONES.length];
}

/**
 * Avatar — extends the shadcn/Radix avatar with the original design system's
 * convenience API. Pass `name` (and optionally `src`) for a self-contained
 * avatar with deterministic initials fallback + token tone. Or compose with
 * <AvatarImage>/<AvatarFallback> children as usual.
 */
const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  AvatarProps
>(({ className, name, src, size = 'md', shape = 'circle', children, ...props }, ref) => {
  const sized = cn(
    'relative flex shrink-0 select-none items-center justify-center overflow-hidden font-semibold [font-family:var(--ds-font-family-sans)]',
    SIZE[size],
    SHAPE[shape],
    className,
  );

  // Convenience mode: `name` drives initials + tone, `src` the image.
  if (name != null && !children) {
    return (
      <AvatarPrimitive.Root ref={ref} className={sized} {...props}>
        {src && (
          <AvatarPrimitive.Image
            src={src}
            alt={name}
            className="aspect-square h-full w-full object-cover"
          />
        )}
        <AvatarPrimitive.Fallback
          className={cn('flex h-full w-full items-center justify-center uppercase', toneFor(name))}
        >
          {initials(name)}
        </AvatarPrimitive.Fallback>
      </AvatarPrimitive.Root>
    );
  }

  return (
    <AvatarPrimitive.Root ref={ref} className={sized} {...props}>
      {children}
    </AvatarPrimitive.Root>
  );
});
Avatar.displayName = AvatarPrimitive.Root.displayName;

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn('aspect-square h-full w-full', className)}
    {...props}
  />
));
AvatarImage.displayName = AvatarPrimitive.Image.displayName;

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      'flex h-full w-full items-center justify-center rounded-full [background-color:var(--ds-color-bg-muted)] [color:var(--ds-color-text-secondary)]',
      className,
    )}
    {...props}
  />
));
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;

/** Stacked, overlapping collection of avatars with a "+N" overflow chip. */
const AvatarGroup = React.forwardRef<HTMLDivElement, AvatarGroupProps>(
  ({ className, max, size = 'md', children, ...props }, ref) => {
    const items = React.Children.toArray(children).filter(Boolean);
    const shown = typeof max === 'number' ? items.slice(0, max) : items;
    const overflow = items.length - shown.length;

    return (
      <div ref={ref} className={cn('flex items-center', className)} {...props}>
        {shown.map((child, i) => (
          <span
            key={i}
            className="inline-flex rounded-full ring-2 [--tw-ring-color:var(--ds-color-bg-surface)] [&:not(:first-child)]:-ml-2"
          >
            {child}
          </span>
        ))}
        {overflow > 0 && (
          <span className="inline-flex rounded-full ring-2 [--tw-ring-color:var(--ds-color-bg-surface)] -ml-2">
            <span
              className={cn(
                'flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full font-semibold [background-color:var(--ds-color-bg-muted)] [color:var(--ds-color-text-secondary)]',
                SIZE[size],
              )}
            >
              +{overflow}
            </span>
          </span>
        )}
      </div>
    );
  },
);
AvatarGroup.displayName = 'AvatarGroup';

export { Avatar, AvatarImage, AvatarFallback, AvatarGroup };
