import { useFormik } from 'formik'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Button } from '@/components/ui/Button'
import { Combobox } from '@/components/ui/MultiSelect'
import { RadioGroup, RadioGroupItem } from '@/components/ui/RadioGroup'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog'
import { linkedJobSchema } from '../../services/eventSchema'
import { CAMPUS_JOB_OPTIONS } from '../../constants/tpo'
import type { LinkedJob } from '../../types/tpo'

interface LinkJobDialogProps {
  open: boolean
  initial: LinkedJob | null
  onClose: () => void
  onLink: (job: LinkedJob) => void
}

const EMPTY: LinkedJob = { kind: 'campus', campusJob: '', url: '', title: '' }

const LinkJobDialog = ({ open, initial, onClose, onLink }: LinkJobDialogProps) => {
  const form = useFormik<LinkedJob>({
    initialValues: initial ?? EMPTY,
    enableReinitialize: true,
    validationSchema: linkedJobSchema,
    onSubmit: (values) => onLink(values),
  })

  const isExternal = form.values.kind === 'external'

  const errorFor = (field: 'url' | 'title' | 'campusJob'): string | undefined =>
    form.touched[field] || form.submitCount ? form.errors[field] : undefined

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-[28rem] [background-color:var(--ds-color-bg-surface)]">
        <DialogHeader>
          <DialogTitle>Link a Job</DialogTitle>
          <DialogDescription className="sr-only">Link a campus job or paste a job link</DialogDescription>
        </DialogHeader>

        <div className="space-y-3.5">
          <RadioGroup
            className="flex flex-row gap-6"
            value={form.values.kind}
            onValueChange={(value) => form.setFieldValue('kind', value)}
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem value="campus" id="job-campus" />
              <Label htmlFor="job-campus" className="cursor-pointer font-normal">
                Campus job
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="external" id="job-external" />
              <Label htmlFor="job-external" className="cursor-pointer font-normal">
                Paste a job link
              </Label>
            </div>
          </RadioGroup>

          {isExternal ? (
            <>
              <Input
                name="url"
                label={
                  <>
                    Job Link <span className="[color:var(--ds-color-danger)]">*</span>
                  </>
                }
                placeholder="https://company-careers-site.com/jobs/12345"
                value={form.values.url}
                error={errorFor('url')}
                onChange={form.handleChange}
                onBlur={form.handleBlur}
              />
              <Input
                name="title"
                placeholder="Enter the job title"
                label={
                  <>
                    Job Title <span className="[color:var(--ds-color-danger)]">*</span>
                  </>
                }
                value={form.values.title}
                error={errorFor('title')}
                onChange={form.handleChange}
                onBlur={form.handleBlur}
              />
            </>
          ) : (
            <div className="space-y-1.5">
              <Label>Campus job</Label>
              <Combobox
                value={form.values.campusJob}
                placeholder="Select a job"
                options={CAMPUS_JOB_OPTIONS.map((job) => ({ value: job, label: job }))}
                onChange={(value) => {
                  form.setFieldTouched('campusJob', true, false)
                  form.setFieldValue('campusJob', value)
                }}
              />
              {errorFor('campusJob') && (
                <p className="text-xs [color:var(--ds-color-danger-text)]">{errorFor('campusJob')}</p>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => form.handleSubmit()}>Link Job</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default LinkJobDialog
