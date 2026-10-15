import { Info } from 'lucide-react'
import { useFormik } from 'formik'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Button } from '@/components/ui/Button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/RadioGroup'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog'
import { LIMITS } from '../../constants'
import { cancelSchema } from '../../services/eventSchema'
import { CANCEL_REASON_OPTIONS } from '../../constants/tpo'
import type { CancelReason } from '../../types/tpo'

interface CancelDialogProps {
  open: boolean
  title: string
  dateLabel: string
  notifyCount: number
  onBack: () => void
  onEditDate: () => void
  onConfirm: (reason: CancelReason, note: string) => void
}

const CancelDialog = ({ open, title, dateLabel, notifyCount, onBack, onEditDate, onConfirm }: CancelDialogProps) => {
  const form = useFormik({
    initialValues: { reason: '', note: '' },
    enableReinitialize: true,
    validationSchema: cancelSchema,
    onSubmit: (values) => onConfirm(values.reason as CancelReason, values.note),
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
              {notifyCount} students will be notified.
            </p>
          </div>

          <div className="space-y-2">
            <Label>
              Reason <span className="[color:var(--ds-color-danger)]">*</span>
            </Label>

            <RadioGroup
              className="space-y-2"
              value={form.values.reason}
              onValueChange={(value) => form.setFieldValue('reason', value)}
            >
              {CANCEL_REASON_OPTIONS.map((option) => (
                <div key={option.value} className="space-y-1">
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value={option.value} id={`cancel-${option.value}`} />
                    <Label htmlFor={`cancel-${option.value}`} className="cursor-pointer font-normal">
                      {option.label}
                    </Label>
                  </div>

                  {option.value === 'postponed' && form.values.reason === 'postponed' && (
                    <p className="ml-6 flex flex-wrap items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm [background-color:var(--ds-color-bg-subtle)] [color:var(--ds-color-text-secondary)]">
                      <Info className="size-3.5" />
                      You can edit the date instead of cancelling.
                      <Button variant="link" className="text-sm" onClick={onEditDate}>
                        Edit date instead
                      </Button>
                    </p>
                  )}

                  {option.value === 'other' && form.values.reason === 'other' && (
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
            Go Back
          </Button>
          <Button variant="danger" disabled={!form.isValid || !form.values.reason} onClick={() => form.handleSubmit()}>
            Yes, Cancel Event
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default CancelDialog
