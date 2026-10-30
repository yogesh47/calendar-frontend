import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';

import { Spinner } from '../Spinner';
import { cn } from '../../../lib/utils';
import type { ButtonProps } from './Button.types';
import { buttonVariants, ICON_ONLY, HOVER_EFFECT, SPINNER_SIZE } from './Button.constants';

export * from './Button.constants';
export type { ButtonHoverEffect, ButtonProps } from './Button.types';

interface Ripple {
  x: number;
  y: number;
  size: number;
  id: number;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      asChild = false,
      leftIcon,
      rightIcon,
      iconOnly = false,
      loading = false,
      fullWidth = false,
      hoverEffect = 'none',
      ripple = false,
      disabled,
      type,
      children,
      onPointerDown,
      ...props
    },
    ref,
  ) => {
    const [ripples, setRipples] = React.useState<Ripple[]>([]);
    const rippleId = React.useRef(0);

    const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
      if (ripple && !disabled && !loading) {
        const rect = e.currentTarget.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        setRipples((r) => [
          ...r,
          {
            id: (rippleId.current += 1),
            size,
            x: e.clientX - rect.left - size / 2,
            y: e.clientY - rect.top - size / 2,
          },
        ]);
      }
      onPointerDown?.(e);
    };

    const classes = cn(
      buttonVariants({ variant, size }),
      iconOnly && size && size !== 'icon' && ICON_ONLY[size],
      fullWidth && 'w-full',
      HOVER_EFFECT[hoverEffect],
      ripple && 'relative overflow-hidden',
      loading && 'relative',
      className,
    );

    if (asChild) {
      return <Slot ref={ref} className={classes} {...props}>{children}</Slot>;
    }

    return (
      <button
        ref={ref}
        type={type ?? 'button'}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        className={classes}
        onPointerDown={handlePointerDown}
        {...props}
      >
        {ripple &&
          ripples.map((r) => (
            <span
              key={r.id}
              aria-hidden
              className="pointer-events-none absolute rounded-full [background-color:currentColor]"
              style={{
                left: r.x,
                top: r.y,
                width: r.size,
                height: r.size,
                animation: 'ds-ripple 600ms var(--ds-ease-standard) forwards',
              }}
              onAnimationEnd={() => setRipples((list) => list.filter((x) => x.id !== r.id))}
            />
          ))}
        {loading && (
          <span className="absolute inline-grid place-items-center">
            <Spinner size={SPINNER_SIZE[size ?? 'md']} />
          </span>
        )}
        <span className={cn('inline-flex items-center justify-center gap-2', loading && 'invisible')}>
          {leftIcon && <span className="inline-grid place-items-center">{leftIcon}</span>}
          {!iconOnly && children}
          {iconOnly && !leftIcon && !rightIcon && (
            <span className="inline-grid place-items-center">{children}</span>
          )}
          {rightIcon && <span className="inline-grid place-items-center">{rightIcon}</span>}
        </span>
      </button>
    );
  },
);
Button.displayName = 'Button';

export { Button };
