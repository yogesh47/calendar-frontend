/**
 * FormTipTapEditor Types
 */

import type { ReactNode } from 'react'

/** Where the toolbar row sits inside the box. */
export type TiptapToolbarPlacement = 'bottom' | 'top'

export interface TiptapEditorProps {
  /** DOM id of the editable area, so validation can focus it. */
  id?: string
  /** Extra controls in the toolbar row — e.g. the resume builder's "Ask AI". */
  actions?: ReactNode
  /** Toolbar above or below the text (default: below, as the resume design has it). */
  toolbarPlacement?: TiptapToolbarPlacement
  /** Class for the bordered box, so a screen can set its own border/radius/padding. */
  boxClassName?: string
  /** Class for the editable area — type, colour, min-height. */
  contentClassName?: string
  /** Class for the character counter under the box. */
  counterClassName?: string
  /** Label text */
  label?: string
  /** Current HTML value */
  value: string
  /** Callback when content changes - returns HTML string */
  onChange: (html: string) => void
  /** Placeholder text */
  placeholder?: string
  /** Whether field is required */
  required?: boolean
  /** Error message */
  error?: string
  /** Whether field is disabled */
  disabled?: boolean
  /** Maximum character length */
  maxLength?: number
  /** Additional CSS classes */
  className?: string
  /** Minimum height of editor */
  minHeight?: string
  /** Show formatting toolbar */
  showToolbar?: boolean
  /** Called when editor loses focus */
  onBlur?: () => void
}