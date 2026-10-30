import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/Dialog'

/*
  The one frame every calendar modal is drawn in — so a header, a body and a
  footer look the same whichever modal is open, here or in the app around it.

    <DialogContent className={modalContentClass('md')}>
      <ModalHeader icon={…} title="…" description="…" />
      <ModalBody><ModalCard>…fields…</ModalCard></ModalBody>
      <ModalFooter start="…">…buttons…</ModalFooter>
    </DialogContent>
*/

const WIDTHS = {
  sm: 'w-[min(28rem,calc(100vw-1rem))]',
  md: 'w-[min(34rem,calc(100vw-1rem))]',
  lg: 'w-[min(46rem,calc(100vw-1rem))]',
} as const

export type ModalWidth = keyof typeof WIDTHS

/** The classes for `<DialogContent>`: no padding of its own, the close button in line with the title. */
export const modalContentClass = (width: ModalWidth = 'md', className?: string): string =>
  cn(
    'max-h-[92vh] max-w-none gap-0 overflow-hidden p-0 sm:p-0 [background-color:var(--ds-color-bg-surface)]',
    '[&>button]:top-5',
    WIDTHS[width],
    className,
  )

const TONES = {
  brand: '[background-color:var(--ds-color-brand-subtle)] [color:var(--ds-color-brand)]',
  danger: '[background-color:var(--ds-color-danger-subtle)] [color:var(--ds-color-danger)]',
} as const

export type ModalTone = keyof typeof TONES

export interface ModalHeaderProps {
  /** Drawn in a tinted square before the title. */
  icon?: ReactNode
  tone?: ModalTone
  title: ReactNode
  /** The line under the title. Without one, `srDescription` (or the title) is read to screen readers only. */
  description?: ReactNode
  srDescription?: string
  /** Buttons on the right of the header, e.g. "Fill Data". */
  actions?: ReactNode
  /** Let a long title and its line wrap instead of being cut — for reading an item, not filling a form. */
  wrap?: boolean
}

export const ModalHeader = ({ icon, tone = 'brand', title, description, srDescription, actions, wrap }: ModalHeaderProps) => (
  <DialogHeader className="px-3 pb-3 pr-14 pt-4 text-left sm:px-4 sm:pr-16">
    <div className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        {icon && (
          <span className={cn('grid size-10 shrink-0 place-items-center rounded-lg [&>svg]:size-5', TONES[tone])}>
            {icon}
          </span>
        )}
        <div className="min-w-0">
          <DialogTitle className={wrap ? 'break-words' : 'truncate'}>{title}</DialogTitle>
          {description ? (
            <DialogDescription className={cn('mt-0.5 text-sm', wrap ? 'break-words' : 'truncate')}>{description}</DialogDescription>
          ) : (
            <DialogDescription className="sr-only">
              {srDescription ?? (typeof title === 'string' ? title : '')}
            </DialogDescription>
          )}
        </div>
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </div>
  </DialogHeader>
)

/** The app-coloured, scrolling middle. */
export const ModalBody = ({ className, children }: { className?: string; children: ReactNode }) => (
  <div
    className={cn(
      'max-h-[70vh] min-h-0 space-y-3 overflow-y-auto px-3 pb-4 pt-3 sm:px-4 [background-color:var(--ds-color-bg-app)]',
      className,
    )}
  >
    {children}
  </div>
)

/** A white card inside the body; a modal may hold one or several. */
export const ModalCard = ({ title, caption, className, children }: {
  title?: ReactNode
  caption?: ReactNode
  className?: string
  children: ReactNode
}) => (
  <section className={cn('min-w-0 space-y-4 rounded-xl border p-4 [background-color:var(--ds-color-bg-surface)]', className)}>
    {(title || caption) && (
      <div className="-mb-1.5">
        {title && <h3 className="text-sm font-semibold">{title}</h3>}
        {caption && <p className="text-sm [color:var(--ds-color-text-secondary)]">{caption}</p>}
      </div>
    )}
    {children}
  </section>
)

/** Buttons on the right; `start` is a short status line on the left ("69 students will be notified"). */
export const ModalFooter = ({ start, children }: { start?: ReactNode; children: ReactNode }) => (
  <DialogFooter className="min-w-0 flex-row flex-wrap items-center justify-between gap-x-2 gap-y-1.5 px-3 py-2 sm:gap-3 sm:px-4 sm:py-3">
    <span className="min-w-0 flex-1 text-xs [color:var(--ds-color-text-secondary)] sm:text-sm">{start}</span>
    <span className="ml-auto flex shrink-0 flex-wrap justify-end gap-2">{children}</span>
  </DialogFooter>
)
