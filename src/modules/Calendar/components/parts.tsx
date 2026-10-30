import { format } from 'date-fns'
import { Info } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { ModalCard } from './Modal'

/* Small pieces the module's dialogs share. */

/** A quiet line of guidance — never an error. */
export const InfoNote = ({ icon, children }: { icon?: React.ReactNode; children: React.ReactNode }) => (
  <p className="flex min-w-0 gap-2 rounded-lg border px-3 py-2 text-sm [background-color:var(--ds-color-info-subtle)] [border-color:var(--ds-color-info)]/20 [color:var(--ds-color-text-secondary)]">
    {icon ?? <Info className="mt-0.5 size-3.5 shrink-0 [color:var(--ds-color-info)]" />}
    <span className="min-w-0 flex-1 break-words">{children}</span>
  </p>
)

/** One titled card in a modal's body — the calendar's own modal card, so every modal matches. */
export const Section = ({
  title,
  caption,
  children,
}: {
  /** Optional — a card can stand on its fields alone. */
  title?: string
  caption?: string
  children: React.ReactNode
}) => (
  <ModalCard title={title} caption={caption}>
    {children}
  </ModalCard>
)

export const Required = () => <span className="[color:var(--ds-color-danger)]">*</span>

export const clock = (value: string): string => (value ? format(new Date(`2000-01-01T${value}:00`), 'h:mm a') : '')

/*
  One line of an editor, the way calendar apps draw it: an icon in a narrow
  gutter says what the line is, so the controls need no label above them. The
  label still reaches screen readers.
*/
export const Row = ({ icon: Icon, label, children }: { icon: LucideIcon; label: string; children: React.ReactNode }) => (
  <div role="group" aria-label={label} className="grid grid-cols-[1.25rem_minmax(0,1fr)] items-start gap-3 px-4 py-2">
    <Icon aria-hidden className="mt-3 size-4 [color:var(--ds-color-text-secondary)]" />
    <div className="min-w-0 space-y-1.5">{children}</div>
  </div>
)

export const FieldError = ({ message }: { message?: string }) =>
  message ? <p className="!mt-1 text-xs leading-4 [color:var(--ds-color-danger-text)]">{message}</p> : null

/** One labelled line of the panel. Exported so an app's own rows look the same. */
export const DetailRow = ({ icon: Icon, label, children }: { icon: LucideIcon; label: string; children?: React.ReactNode }) => {
  if (!children) return null

  return (
    <div className="flex gap-3 text-sm">
      <span className="flex w-[5.25rem] shrink-0 items-center gap-2 self-start text-[0.75rem] font-semibold leading-[1.25rem] [color:var(--ds-color-text-secondary)] sm:w-[6.75rem] sm:text-[0.8125rem]">
        <Icon className="size-4 shrink-0" />
        {label}
      </span>
      <div className="min-w-0 flex-1 leading-[1.25rem] [word-break:break-word]">{children}</div>
    </div>
  )
}
