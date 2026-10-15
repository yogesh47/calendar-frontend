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
import { EXTERNAL_JOBS } from '../../services/jobs'
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
                placeholder="https://careers.deloitte.com/jobs/12345"
                value={form.values.url}
                error={form.touched.url ? form.errors.url : undefined}
                onChange={form.handleChange}
                onBlur={form.handleBlur}
              />
              <Input
                name="title"
                label={
                  <>
                    Job Title <span className="[color:var(--ds-color-danger)]">*</span>
                  </>
                }
                value={form.values.title}
                error={form.touched.title ? form.errors.title : undefined}
                onChange={form.handleChange}
                onBlur={form.handleBlur}
              />
              <p className="rounded-md px-3 py-2 text-sm [background-color:var(--ds-color-bg-subtle)] [color:var(--ds-color-text-secondary)]">
                Students will open this link in a new tab and apply on that website.
              </p>

              <div className="space-y-1.5">
                <p className="text-sm font-medium">External jobs</p>
                {EXTERNAL_JOBS.map((job) => (
                  <button
                    key={job.jobId}
                    type="button"
                    className="block w-full cursor-pointer rounded-md border px-3 py-2 text-left text-sm hover:[background-color:var(--ds-color-bg-muted)]"
                    onClick={() => {
                      form.setFieldValue('url', job.applyLink)
                      form.setFieldValue('title', `${job.company} — ${job.title}`)
                    }}
                  >
                    <span className="font-medium">{job.title}</span>
                    <span className="block [color:var(--ds-color-text-secondary)]">
                      {job.company} · {job.jobType}
                    </span>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="space-y-1.5">
              <Label>Campus job</Label>
              <Combobox
                value={form.values.campusJob}
                placeholder="Select a job"
                options={CAMPUS_JOB_OPTIONS.map((job) => ({ value: job, label: job }))}
                onChange={(value) => form.setFieldValue('campusJob', value)}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={!form.isValid} onClick={() => form.handleSubmit()}>
            Link Job
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default LinkJobDialog
