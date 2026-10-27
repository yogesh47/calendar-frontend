import { format } from 'date-fns'
import { Info } from 'lucide-react'

/** A quiet line of guidance — never an error, so it never wears the danger colour. */
export const InfoNote = ({ icon, children }: { icon?: React.ReactNode; children: React.ReactNode }) => (
  <p className="flex min-w-0 gap-2 rounded-lg border px-3 py-2 text-sm [background-color:var(--ds-color-info-subtle)] [border-color:var(--ds-color-info)]/20 [color:var(--ds-color-text-secondary)]">
    {icon ?? <Info className="mt-0.5 size-3.5 shrink-0 [color:var(--ds-color-info)]" />}
    <span className="min-w-0 flex-1 break-words">{children}</span>
  </p>
)

/** One titled card in either modal. */
export const Section = ({
  title,
  caption,
  children,
}: {
  title: string
  caption?: string
  children: React.ReactNode
}) => (
  <section className="min-w-0 space-y-2.5 rounded-xl border p-3 [background-color:var(--ds-color-bg-surface)]">
    <div>
      <h3 className="text-sm font-semibold">{title}</h3>
      {caption && <p className="text-sm [color:var(--ds-color-text-secondary)]">{caption}</p>}
    </div>
    {children}
  </section>
)

export const Required = () => <span className="[color:var(--ds-color-danger)]">*</span>

export const clock = (value: string): string =>
  value ? format(new Date(`2000-01-01T${value}:00`), 'h:mm a') : ''
