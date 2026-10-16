import toast from 'react-hot-toast'
import AppToast from '@/components/custom/AppToast'
import { createElement } from 'react'
import type { Toast } from 'react-hot-toast'
import { ApiError } from '@/lib/apiError'
import type { ToastTone } from '@/components/custom/AppToast'

const FALLBACK_MESSAGE = 'Something went wrong. Please try again.'

// Ek hi message baar-baar aaye (jaise DB down par har call fail ho) to naya toast
// nahi banta — wahi toast update ho jaata hai. Isi liye id message se banti hai.
const raise = (tone: ToastTone, duration: number) => (message: string): string =>
  toast.custom(
    (entry: Toast) =>
      createElement(AppToast, {
        tone,
        message,
        onDismiss: () => toast.dismiss(entry.id),
        className: entry.visible ? 'animate-enter' : 'animate-leave',
      }),
    { duration, id: `${tone}:${message}` },
  )

export const showSuccess = raise('success', 3000)

export const showError = raise('error', 4000)

export const showInfo = raise('info', 3000)

// Jo backend ne bheja wahi dikhana hai — fallback tabhi jab backend ne kuch na bheja ho.
export const messageOf = (error: unknown): string => {
  if (error instanceof ApiError) return error.message || FALLBACK_MESSAGE
  if (error instanceof Error && error.message) return error.message

  return FALLBACK_MESSAGE
}
