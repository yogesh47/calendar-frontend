import toast from 'react-hot-toast'
import AppToast from '@/components/custom/AppToast'
import { createElement } from 'react'
import type { Toast } from 'react-hot-toast'
import type { ToastTone } from '@/components/custom/AppToast'

const FALLBACK_MESSAGE = 'Something went wrong. Please try again.'

const raise = (tone: ToastTone, duration: number) => (message: string): string =>
  toast.custom(
    (entry: Toast) =>
      createElement(AppToast, {
        tone,
        message,
        onDismiss: () => toast.dismiss(entry.id),
        className: entry.visible ? 'animate-enter' : 'animate-leave',
      }),
    { duration },
  )

export const showSuccess = raise('success', 3000)

export const showError = raise('error', 4000)

export const showInfo = raise('info', 3000)

export const messageOf = (error: unknown): string =>
  error instanceof Error && error.message ? error.message : FALLBACK_MESSAGE
