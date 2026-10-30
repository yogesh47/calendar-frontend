import type { ReactNode } from 'react'
import { Bell, Info, TriangleAlert } from 'lucide-react'
import { useFormik, validateYupSchema, yupToFormErrors } from 'formik'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Button } from '@/components/ui/Button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/RadioGroup'
import { Dialog, DialogContent } from '@/components/ui/Dialog'
import { ModalBody, ModalCard, ModalFooter, ModalHeader, modalContentClass } from '@/modules/Calendar/components/Modal'
import type { ModalTone, ModalWidth } from '@/modules/Calendar/components/Modal'
import { LIMITS } from '@/calendar'
import { cancelSchema } from '@/modules/Calendar/services/eventSchema'
import { useLabels } from '../../constants/words'
import type { CalendarEvent } from '@/calendar'

/** One reason an app offers for cancelling. */
export type CancelReasonOption = {
  value: string
  label: string
  /** Picking it suggests editing the date instead (e.g. "Postponed"). */
  suggestsEdit?: boolean
  /** Picking it asks for a short note (e.g. "Other"). */
  needsNote?: boolean
}

export type CancelScope = 'one' | 'series'

/**
 * What a project's own header, body or footer gets: the event, the calendar's
 * answers so far (if it uses them), and the two ways out. `confirm` and `back`
 * end in the project's own `onCancel` / `onCancelBack`.
 */
export interface CancelDialogContext {
  event: CalendarEvent
  notifyCount: number
  audienceNoun: string
  reasons: CancelReasonOption[]
  isRecurring: boolean
  reason: string
  setReason: (reason: string) => void
  note: string
  setNote: (note: string) => void
  scope: CancelScope
  setScope: (scope: CancelScope) => void
  /** A reason is picked, and its note written when it needs one. */
  canConfirm: boolean
  /** Confirm with the picked reason — or with the project's own values. */
  confirm: (answer?: { reason?: string; note?: string; scope?: CancelScope }) => void
  back: () => void
  editDate: () => void
}

type Slot = ReactNode | ((context: CancelDialogContext) => ReactNode)

/**
 * The cancel modal is the calendar's frame; what is inside it is each
 * project's. Every piece can come from the project — leave one out for the
 * calendar's own, `null` hides it. `body` and `footer` replace the whole
 * middle or the whole button row: a project can put anything there.
 */
export interface CancelDialogConfig {
  width?: ModalWidth
  icon?: ReactNode | null
  tone?: ModalTone
  title?: Slot
  /** The line under the title. Default: "<event title> · <date>". */
  description?: Slot
  /** The whole middle. Default: who is told, the repeat scope and the reasons. */
  body?: Slot
  /** Pieces of the default body, when the body itself is not replaced. */
  notice?: Slot | null
  scopeLabel?: ReactNode
  scopeOneLabel?: ReactNode
  scopeSeriesLabel?: ReactNode
  reasonLabel?: ReactNode
  notePlaceholder?: string
  editDateHint?: ReactNode
  before?: Slot
  after?: Slot
  /** The whole button row. Default: Go Back and the confirm button. */
  footer?: Slot
  /** Pieces of the default footer. */
  footerStart?: Slot
  backLabel?: ReactNode
  confirmLabel?: ReactNode
}

interface CancelDialogProps {
  open: boolean
  event: CalendarEvent | null
  dateLabel: string
  notifyCount: number
  /** A repeating event also asks whether the later occurrences go too. */
  isRecurring?: boolean
  onBack: () => void
  onEditDate: () => void
  reasons: CancelReasonOption[]
  /** "people", "attendees" — who `notifyCount` counts. */
  audienceNoun: string
  config?: CancelDialogConfig
  onConfirm: (reason: string, note: string, scope: CancelScope) => void
}

const fill = (slot: Slot | undefined, context: CancelDialogContext): ReactNode =>
  typeof slot === 'function' ? slot(context) : slot

const CancelDialog = ({
  open,
  event,
  dateLabel,
  notifyCount,
  isRecurring = false,
  reasons,
  audienceNoun,
  config = {},
  onBack,
  onEditDate,
  onConfirm,
}: CancelDialogProps) => {
  const labels = useLabels()
  const form = useFormik({
    initialValues: { reason: '', note: '', scope: 'one' as CancelScope },
    enableReinitialize: true,
    validate: (values) => {
      try {
        validateYupSchema(values, cancelSchema, true, {
          needsNote: (reason: string) => Boolean(reasons.find((entry) => entry.value === reason)?.needsNote),
        })
      } catch (error) {
        return yupToFormErrors(error)
      }
      return {}
    },
    onSubmit: (values) => onConfirm(values.reason, values.note, values.scope),
  })

  if (!event) return null

  const picked = reasons.find((entry) => entry.value === form.values.reason)
  const context: CancelDialogContext = {
    event,
    notifyCount,
    audienceNoun,
    reasons,
    isRecurring,
    reason: form.values.reason,
    setReason: (value) => form.setFieldValue('reason', value),
    note: form.values.note,
    setNote: (value) => form.setFieldValue('note', value),
    scope: form.values.scope,
    setScope: (value) => form.setFieldValue('scope', value),
    canConfirm: form.isValid && Boolean(form.values.reason),
    // A project's own body may collect its answer itself and hand it straight over.
    confirm: (answer) =>
      answer
        ? onConfirm(answer.reason ?? form.values.reason, answer.note ?? form.values.note, answer.scope ?? form.values.scope)
        : form.handleSubmit(),
    back: onBack,
    editDate: onEditDate,
  }

  /*
    Ek option ek chhota card — poora card dabane layak, chuna hua brand rang me.
    Radio button andar hi rehta hai, taaki keyboard aur screen reader wahi
    samjhein jo pehle samajhte the.
  */
  const optionCard = (selected: boolean) =>
    cn(
      'flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2.5 text-sm font-normal transition-colors',
      selected
        ? '[background-color:var(--ds-color-brand-subtle)] [border-color:var(--ds-color-brand)]'
        : '[border-color:var(--ds-color-border-default)] hover:[background-color:var(--ds-color-bg-subtle)]',
    )

  const notice =
    config.notice === null
      ? null
      : config.notice !== undefined
        ? fill(config.notice, context)
        : notifyCount > 0 && (
            <p className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm [background-color:var(--ds-color-bg-subtle)] [color:var(--ds-color-text-secondary)]">
              <Bell className="size-4 shrink-0" />
              <span>
                <span className="font-semibold [color:var(--ds-color-text-primary)]">
                  {notifyCount} {audienceNoun}
                </span>{' '}
                will be told it is cancelled.
              </span>
            </p>
          )

  const defaultBody = (
    <ModalCard>
      {fill(config.before, context)}
      {notice}

      {isRecurring && (
        <div className="space-y-2">
          <Label>{config.scopeLabel ?? 'This is a repeating event'}</Label>
          <RadioGroup
            className="grid grid-cols-1 gap-2 sm:grid-cols-2"
            value={form.values.scope}
            onValueChange={(value) => form.setFieldValue('scope', value)}
          >
            <Label htmlFor="cancel-scope-one" className={optionCard(form.values.scope === 'one')}>
              <RadioGroupItem value="one" id="cancel-scope-one" />
              {config.scopeOneLabel ?? 'Only this date'}
            </Label>
            <Label htmlFor="cancel-scope-series" className={optionCard(form.values.scope === 'series')}>
              <RadioGroupItem value="series" id="cancel-scope-series" />
              {config.scopeSeriesLabel ?? 'This and all later dates'}
            </Label>
          </RadioGroup>
        </div>
      )}

      <div className="space-y-2">
        <Label>
          {config.reasonLabel ?? 'Reason'} <span className="[color:var(--ds-color-danger)]">*</span>
        </Label>

        <RadioGroup
          className="grid grid-cols-1 gap-2 sm:grid-cols-2"
          value={form.values.reason}
          onValueChange={(value) => form.setFieldValue('reason', value)}
        >
          {reasons.map((option) => (
            <Label
              key={option.value}
              htmlFor={`cancel-${option.value}`}
              className={optionCard(form.values.reason === option.value)}
            >
              <RadioGroupItem value={option.value} id={`cancel-${option.value}`} />
              {option.label}
            </Label>
          ))}
        </RadioGroup>

        {/* What the picked reason asks for comes under all of them, full width. */}
        {picked?.suggestsEdit && (
          <p className="flex flex-wrap items-center gap-1.5 rounded-lg px-3 py-2 text-sm [background-color:var(--ds-color-info-subtle)] [color:var(--ds-color-text-secondary)]">
            <Info className="size-3.5 shrink-0 [color:var(--ds-color-info)]" />
            {config.editDateHint ?? 'You can edit the date instead of cancelling.'}
            <Button variant="link" className="h-auto p-0 text-sm" onClick={onEditDate}>
              {labels.cancelDialog.editDateInstead}
            </Button>
          </p>
        )}

        {picked?.needsNote && (
          <Input
            name="note"
            autoFocus
            placeholder={config.notePlaceholder ?? 'Tell them why'}
            hint={`${form.values.note.length}/${LIMITS.cancelOtherNoteLength}`}
            maxLength={LIMITS.cancelOtherNoteLength}
            value={form.values.note}
            error={form.touched.note ? form.errors.note : undefined}
            onChange={form.handleChange}
            onBlur={form.handleBlur}
          />
        )}
      </div>

      {fill(config.after, context)}
    </ModalCard>
  )

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onBack()}>
      <DialogContent className={modalContentClass(config.width ?? 'md')}>
        <ModalHeader
          icon={config.icon === null ? undefined : (config.icon ?? <TriangleAlert />)}
          tone={config.tone ?? 'danger'}
          title={config.title !== undefined ? fill(config.title, context) : 'Cancel this event?'}
          description={
            config.description !== undefined ? fill(config.description, context) : `${event.draft.title} · ${dateLabel}`
          }
        />

        <ModalBody>{config.body !== undefined ? fill(config.body, context) : defaultBody}</ModalBody>

        {config.footer !== undefined ? (
          fill(config.footer, context)
        ) : (
          <ModalFooter start={fill(config.footerStart, context)}>
            <Button variant="outline" onClick={onBack}>
              {config.backLabel ?? labels.cancelDialog.goBack}
            </Button>
            <Button variant="danger" disabled={!context.canConfirm} onClick={() => context.confirm()}>
              {config.confirmLabel ?? labels.cancelDialog.confirmCancelEvent}
            </Button>
          </ModalFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default CancelDialog
