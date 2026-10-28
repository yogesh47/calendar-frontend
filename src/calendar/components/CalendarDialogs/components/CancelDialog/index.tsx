import { Info } from '../../../../icons'
import { useFormik, validateYupSchema, yupToFormErrors } from 'formik'
import { Input } from '../../../../shared/ui/Input'
import { Label } from '../../../../shared/ui/Label'
import { Button } from '../../../../shared/ui/Button'
import { RadioGroup, RadioGroupItem } from '../../../../shared/ui/RadioGroup'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../../shared/ui/Dialog'
import { LIMITS } from '../../../../constants'
import { cancelSchema } from '../../../../services/eventSchema'
import { useLabels } from '../../../../labels'

/** One reason an app offers for cancelling. */
export type CancelReasonOption = {
  value: string
  label: string
  /** Picking it suggests editing the date instead (e.g. "Postponed"). */
  suggestsEdit?: boolean
  /** Picking it asks for a short note (e.g. "Other"). */
  needsNote?: boolean
}

interface CancelDialogProps {
  open: boolean
  title: string
  dateLabel: string
  notifyCount: number
  /** A repeating event also asks whether the later occurrences go too. */
  isRecurring?: boolean
  onBack: () => void
  onEditDate: () => void
  reasons: CancelReasonOption[]
  /** "people", "attendees" — who `notifyCount` counts. */
  audienceNoun: string
  onConfirm: (reason: string, note: string, scope: 'one' | 'series') => void
}

const CancelDialog = ({
  open,
  title,
  dateLabel,
  notifyCount,
  isRecurring,
  reasons,
  audienceNoun,
  onBack,
  onEditDate,
  onConfirm,
}: CancelDialogProps) => {
  const labels = useLabels()
  const form = useFormik({
    initialValues: { reason: '', note: '', scope: 'one' as 'one' | 'series' },
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

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onBack()}>
      <DialogContent className="sm:max-w-[30rem] [background-color:var(--ds-color-bg-surface)]">
        <DialogHeader>
          <DialogTitle>Cancel this event?</DialogTitle>
          <DialogDescription className="sr-only">Pick a reason to cancel this event</DialogDescription>
        </DialogHeader>

        <div className="space-y-3.5">
          <div>
            <p className="text-sm font-semibold">
              {title} · {dateLabel}
            </p>
            <p className="text-sm [color:var(--ds-color-text-secondary)]">
              {notifyCount} {audienceNoun} will be notified.
            </p>
          </div>

          {isRecurring && (
            <div className="space-y-2">
              <Label>This is a repeating event</Label>
              <RadioGroup
                className="space-y-2"
                value={form.values.scope}
                onValueChange={(value) => form.setFieldValue('scope', value)}
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="one" id="cancel-scope-one" />
                  <Label htmlFor="cancel-scope-one" className="cursor-pointer font-normal">
                    Only this date
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="series" id="cancel-scope-series" />
                  <Label htmlFor="cancel-scope-series" className="cursor-pointer font-normal">
                    This and all later dates
                  </Label>
                </div>
              </RadioGroup>
            </div>
          )}

          <div className="space-y-2">
            <Label>
              Reason <span className="[color:var(--ds-color-danger)]">*</span>
            </Label>

            <RadioGroup
              className="space-y-2"
              value={form.values.reason}
              onValueChange={(value) => form.setFieldValue('reason', value)}
            >
              {reasons.map((option) => (
                <div key={option.value} className="space-y-1">
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value={option.value} id={`cancel-${option.value}`} />
                    <Label htmlFor={`cancel-${option.value}`} className="cursor-pointer font-normal">
                      {option.label}
                    </Label>
                  </div>

                  {option.suggestsEdit && form.values.reason === option.value && (
                    <p className="ml-6 flex flex-wrap items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm [background-color:var(--ds-color-bg-subtle)] [color:var(--ds-color-text-secondary)]">
                      <Info className="size-3.5" />
                      You can edit the date instead of cancelling.
                      <Button variant="link" className="text-sm" onClick={onEditDate}>
                        {labels.editDateInstead}
                      </Button>
                    </p>
                  )}

                  {option.needsNote && form.values.reason === option.value && (
                    <div className="ml-6">
                      <Input
                        name="note"
                        placeholder={`Type reason (max ${LIMITS.cancelOtherNoteLength})...`}
                        maxLength={LIMITS.cancelOtherNoteLength}
                        value={form.values.note}
                        error={form.touched.note ? form.errors.note : undefined}
                        onChange={form.handleChange}
                        onBlur={form.handleBlur}
                      />
                    </div>
                  )}
                </div>
              ))}
            </RadioGroup>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onBack}>
            {labels.goBack}
          </Button>
          <Button variant="danger" disabled={!form.isValid || !form.values.reason} onClick={() => form.handleSubmit()}>
            {labels.confirmCancelEvent}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default CancelDialog
