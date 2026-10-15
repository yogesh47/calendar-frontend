import { CheckCircle2, Info, X, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

export type ToastTone = 'success' | 'error' | 'info'

type ToneSpec = {
  label: string
  icon: LucideIcon
  rail: string
  accent: string
  border: string
}

export const TOAST_TONES: Record<ToastTone, ToneSpec> = {
  success: {
    label: 'Success',
    icon: CheckCircle2,
    rail: 'var(--ds-color-success-subtle)',
    accent: 'var(--ds-color-success-text)',
    border: 'var(--ds-color-success)',
  },
  error: {
    label: 'Error',
    icon: XCircle,
    rail: 'var(--ds-color-danger-subtle)',
    accent: 'var(--ds-color-danger-text)',
    border: 'var(--ds-color-danger)',
  },
  info: {
    label: 'Update',
    icon: Info,
    rail: 'var(--ds-color-info-subtle)',
    accent: 'var(--ds-color-info)',
    border: 'var(--ds-color-info)',
  },
}

type AppToastProps = {
  tone: ToastTone
  message: ReactNode
  onDismiss: () => void
  className?: string
}

const AppToast = ({ tone, message, onDismiss, className }: AppToastProps) => {
  const spec = TOAST_TONES[tone]
  const Icon = spec.icon

  return (
    <div
      role="status"
      className={cn(
        'pointer-events-auto flex w-[25rem] max-w-[calc(100vw-3rem)] items-stretch overflow-hidden rounded-[0.75rem] bg-white',
        className,
      )}
      style={{ boxShadow: `inset 0 0 0 1px ${spec.border}33, 0 10px 30px rgba(15, 23, 42, 0.12)` }}
    >
      <div className="flex w-[3rem] shrink-0 items-center justify-center" style={{ backgroundColor: spec.rail }}>
        <Icon className="size-5" style={{ color: spec.accent }} />
      </div>

      <div className="flex min-w-0 flex-1 items-center justify-between gap-[0.75rem] py-[0.75rem] pl-[0.875rem] pr-[0.75rem]">
        <p className="min-w-0 text-[0.8125rem] font-medium leading-[1.125rem] [word-break:break-word]">
          <span className="font-semibold" style={{ color: spec.accent }}>
            {spec.label}
          </span>{' '}
          <span className="[color:var(--ds-color-text-primary)]">{message}</span>
        </p>

        <button
          type="button"
          aria-label="Dismiss"
          onClick={onDismiss}
          className="grid size-[1.5rem] shrink-0 cursor-pointer place-items-center rounded-full transition-colors hover:[background-color:var(--ds-color-bg-muted)]"
        >
          <X className="size-3.5 [color:var(--ds-color-text-secondary)]" />
        </button>
      </div>
    </div>
  )
}

export default AppToast
