import { useEffect, useState } from 'react'
import { CalendarPlus, Link2, Lock, Trash2, TriangleAlert, Wand2, X } from 'lucide-react'
import { useFormik, validateYupSchema, yupToFormErrors } from 'formik'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Button } from '@/components/ui/Button'
import { addDaysTo, dayShift } from '../TimeSelect'
import { Checkbox } from '@/components/ui/Checkbox'
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
import DayPreview from '../DayPreview'
import LinkJobDialog from '../LinkJobDialog'
import { LIMITS } from '../../constants'
import { overlaps } from '../../helpers/conflicts'
import { labelFor, rulesFor } from '../../helpers/tpo'
import { eventSchema } from '../../services/eventSchema'
import ImageField from '../ImageField'
import AudienceFields, { audienceIsComplete, audienceIsEmpty } from '../AudienceFields'
import { countAudience } from '../../services/audience'
import {
  COMPANY_OPTIONS,
  FINAL_YEAR_BATCH,
  MODE_OPTIONS,
  REMINDER_PRIVACY,
} from '../../constants/tpo'
import { InfoNote, Required, Section, clock } from '../parts'
import type { DayEntry } from '../DayPreview'
import type { EventDraft, EventMode, LinkedJob } from '../../types/tpo'

interface PublishEventDialogProps {
  open: boolean
  notifyMinor?: boolean
  onNotifyMinorChange?: (value: boolean) => void
  initial: EventDraft
  isEdit: boolean
  reminderOnly?: boolean
  canCancelEvent?: boolean
  canDeleteReminder?: boolean
  dayEntries: DayEntry[]
  onClose: () => void
  onOpenJob?: () => void
  onCancelEvent?: () => void
  onDeleteReminder?: () => void
  onSave: (draft: EventDraft) => void
  onBack: () => void
}

const PublishEventDialog = ({
  open,
  notifyMinor = false,
  onNotifyMinorChange,
  initial,
  isEdit,
  reminderOnly,
  canCancelEvent,
  canDeleteReminder,
  dayEntries,
  onClose,
  onOpenJob,
  onCancelEvent,
  onDeleteReminder,
  onSave,
  onBack,
}: PublishEventDialogProps) => {
  const [linking, setLinking] = useState(false)

  const form = useFormik<EventDraft>({
    initialValues: initial,
    enableReinitialize: true,
    validateOnChange: true,
    validateOnBlur: true,
    validate: (values) => {
      try {
        validateYupSchema(values, eventSchema, true, { eventType: values.eventType, studentReminder: reminderOnly })
      } catch (error) {
        return yupToFormErrors(error)
      }

      const errors: Record<string, string> = {}

      /*
        Who sees it can be picked right here, or left empty and picked later from
        the event itself. Half a selection is the one thing not allowed — it
        would reach nobody while looking like it reaches someone.
      */
      if (rulesFor(values.eventType).needsAudience && !audienceIsEmpty(values.audience)) {
        if (!audienceIsComplete(values.audience)) errors.audience = 'Pick a course, a batch and a department.'
        else if (countAudience(values.audience) === 0) errors.audience = '0 students match this audience.'
      }

      return errors
    },
    // Ek hi din ka event — end date alag se nahi poocha jaata, wahi din jaata hai.
    onSubmit: (values) => onSave({ ...values, endDate: values.eventDate }),
  })

  const draft = form.values
  const rules = rulesFor(draft.eventType)
  const isReminder = draft.eventType === 'my_reminder'
  /*
    Creating from the TPO side happens in two steps. The first is the very form a
    student sees under "Add Reminder" — a title, a date, an optional time, a
    reminder lead and a note — and it knows nothing about event types. What kind
    of thing this is gets picked on the second step, along with everything only
    an event needs: its real start and end, the company, where it happens, who it
    goes to, the job it links. "Publish Event" lives there.

    A reminder has no second step, and editing stays on one screen: the whole
    event already exists, so there is nothing to lead the user through.
  */
  // Yahan har cheez event ki hai — koi step nahi, koi reminder shakl nahi.
  const onStepTwo = true
  const basicsLikeReminder = false
  // The day panel on the right stays for everyone — student reminder and TPO
  // event, first step and second. A date is all it needs.
  // Day panel calendar ke modal me hai; yahan dobara nahi.
  const showPreview = false

  useEffect(() => {
    if (!open) setLinking(false)
  }, [open])



  const showErrors = form.submitCount > 0
  const count = rules.needsAudience && audienceIsComplete(draft.audience) ? countAudience(draft.audience) : 0

  const set = (field: string, value: unknown) => {
    form.setFieldTouched(field, true, false)
    form.setFieldValue(field, value)
  }

  const errorFor = (field: string): string | undefined => {
    const touched = form.touched as Record<string, unknown>
    if (!showErrors && !touched[field]) return undefined
    const errors = form.errors as Record<string, unknown>

    return errors[field] as string | undefined
  }

  /*
    Pehle modal ne title, kism aur din de diye hain — yahan unhe haath nahi
    lagaya jaata. Ye sirf wahi bharta hai jo is screen par poocha ja raha hai.
  */
  const fillDummy = () => {
    const start = draft.startTime ? new Date(`2000-01-01T${draft.startTime}:00`) : new Date()
    const end = new Date(start.getTime() + 90 * 60000)
    const clock = (moment: Date) =>
      `${String(moment.getHours()).padStart(2, '0')}:${String(moment.getMinutes()).padStart(2, '0')}`

    form.setValues({
      ...draft,
      company: rules.needsCompany ? COMPANY_OPTIONS[0] : draft.company,
      endDate: draft.endDate || draft.eventDate,
      endTime: rules.needsTime ? clock(end) : draft.endTime,
      mode: rules.needsMode ? 'offline' : draft.mode,
      venue: rules.needsMode ? 'Auditorium, Block A' : draft.venue,
      audience: rules.needsAudience
        ? {
            opportunityType: 'job',
            courses: ['BTech'],
            batches: [FINAL_YEAR_BATCH],
            departments: ['Computer Science', 'Information Technology'],
          }
        : draft.audience,
    })
  }

  const clashes = rules.needsTime
    ? dayEntries.filter(
        (entry) =>
          entry.eventDate === draft.eventDate &&
          entry.startTime &&
          draft.startTime &&
          overlaps(draft.startTime, draft.endTime, entry.startTime, entry.endTime),
      )
    : []

  const setStartDate = (value: string) => {
    const shift = dayShift(draft.eventDate, draft.endDate)
    set('eventDate', value)
    set('endDate', addDaysTo(value, shift))
  }

  const close = () => onClose()


  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-black/50" aria-hidden />}
    <Dialog open={open} modal={false} onOpenChange={(next) => !next && close()}>
      <DialogContent
        className={cn(
          'max-h-[92vh] max-w-none grid-cols-[minmax(0,1fr)] gap-0 overflow-hidden p-0 sm:p-0 [background-color:var(--ds-color-bg-surface)]',
          '[&>button]:top-5',
          'w-[min(40rem,calc(100vw-1rem))]',
        )}
        onInteractOutside={(event) => event.preventDefault()}
      >
        <form onSubmit={form.handleSubmit} noValidate className="contents">
        <DialogHeader className="px-3 pb-3 pr-16 pt-4 sm:px-4 sm:pr-16">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-lg [background-color:var(--ds-color-brand-subtle)] [color:var(--ds-color-brand)]">
                <CalendarPlus className="size-5" />
              </span>
              <div className="min-w-0">
                <DialogTitle className="whitespace-nowrap">Publish Event</DialogTitle>
                {/*
                  Title aur kism pehle modal me chuni ja chuki hain, isliye yahan
                  wo field ban kar nahi aatin — par dikhni chahiye, warna banda
                  bhool jaata hai ki wo kya publish kar raha hai.
                */}
                <DialogDescription asChild>
                  <span className="flex min-w-0 items-center gap-2 text-sm">
                    <span className="truncate font-medium [color:var(--ds-color-text-primary)]">
                      {draft.title || 'Untitled'}
                    </span>
                    {!isReminder && (
                      <span className="hidden max-w-[50%] shrink-0 truncate rounded-full border px-2 py-0.5 text-xs [color:var(--ds-color-text-secondary)] sm:inline">
                        {labelFor(draft.eventType)}
                      </span>
                    )}
                  </span>
                </DialogDescription>
              </div>
            </div>

            {!isEdit && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                title="Fill Data"
                aria-label="Fill Data"
                className="shrink-0 px-2 sm:px-3"
                onClick={fillDummy}
              >
                <Wand2 className="size-3.5" />
                <span className="hidden sm:inline">Fill Data</span>
              </Button>
            )}
          </div>
        </DialogHeader>

        <div
          className={cn(
            'grid min-w-0 grid-cols-[minmax(0,1fr)] max-h-[70vh] gap-3 overflow-hidden px-3 pb-4 pt-3 [background-color:var(--ds-color-bg-app)] sm:px-4',
            showPreview && 'lg:grid-cols-[1fr_24rem]',
          )}
        >
          <div className="min-h-0 min-w-0 space-y-3 overflow-y-auto pr-1">
          <Section title={basicsLikeReminder ? 'Reminder' : 'Event basics'}>


          {isReminder && !reminderOnly && (
            <InfoNote icon={<Lock className="mt-0.5 size-3.5 shrink-0" />}>{REMINDER_PRIVACY}</InfoNote>
          )}

          {/*
            Title, the date and the note were asked for in the calendar's own
            modal. Asking again here would be asking twice.
          */}
          {rules.needsCompany && onStepTwo && (
            <div className="space-y-1.5">
              <Label>Company (optional)</Label>
              <Combobox
                value={draft.company}
                placeholder="Select company"
                options={COMPANY_OPTIONS.map((company) => ({ value: company, label: company }))}
                onChange={(value) => form.setFieldValue('company', value)}
              />
            </div>
          )}

          {rules.info && !isReminder && onStepTwo && <InfoNote>{rules.info}</InfoNote>}

          {clashes.length > 0 && onStepTwo && (
            <p className="flex min-w-0 gap-2 rounded-lg border px-3 py-2 text-sm [background-color:var(--ds-color-warning-subtle)] [border-color:var(--ds-color-warning)] [color:var(--ds-color-warning-text)]">
              <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
              <span>
                {clashes.length === 1
                  ? '1 event clashes with this time'
                  : `${clashes.length} events clash with this time`}
                {': '}
                {clashes
                  .map((entry) => `${entry.title} (${clock(entry.startTime)} – ${clock(entry.endTime)})`)
                  .join(', ')}
              </span>
            </p>
          )}

          </Section>

          {rules.needsMode && onStepTwo && (
            <Section title="Where it happens">
              <div className="space-y-1.5">
                <Label>
                  Mode <Required />
                </Label>
                <RadioGroup
                  className="flex flex-row flex-wrap gap-4 sm:gap-6"
                  value={draft.mode}
                  onValueChange={(value) => set('mode', value as EventMode)}
                >
                  {MODE_OPTIONS.map((option) => (
                    <div key={option.value} className="flex items-center gap-2">
                      <RadioGroupItem value={option.value} id={`mode-${option.value}`} />
                      <Label htmlFor={`mode-${option.value}`} className="cursor-pointer font-normal">
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
                {errorFor('mode') && <p className="text-xs [color:var(--ds-color-danger-text)]">{errorFor('mode')}</p>}
              </div>

              {draft.mode === 'offline' && (
                <Input
                  name="venue"
                  placeholder="Enter the venue"
                  label={
                    <>
                      Venue <span className="[color:var(--ds-color-danger)]">*</span>
                    </>
                  }
                  maxLength={LIMITS.venueLength}
                  value={draft.venue}
                  error={errorFor('venue')}
                  onChange={form.handleChange}
                  onBlur={form.handleBlur}
                />
              )}

              {draft.mode === 'online' && (
                <Input
                  name="onlinePlatform"
                  label={
                    <>
                      Online Platform <span className="[color:var(--ds-color-danger)]">*</span>
                    </>
                  }
                  placeholder="Enter the meeting platform"
                  hint="No meeting link is collected"
                  value={draft.onlinePlatform}
                  error={errorFor('onlinePlatform')}
                  onChange={form.handleChange}
                  onBlur={form.handleBlur}
                />
              )}
            </Section>
          )}

          {rules.needsAudience && onStepTwo && (
            <Section
              title="Target Audience"
              caption="Leave it empty to publish now and choose later from the event."
            >
              <AudienceFields
                idPrefix="publish-audience"
                value={draft.audience}
                showErrors={showErrors && !audienceIsEmpty(draft.audience)}
                onChange={(audience) => form.setFieldValue('audience', audience)}
              />
              {showErrors && (form.errors as Record<string, string>).audience && (
                <p className="text-xs [color:var(--ds-color-danger-text)]">
                  {(form.errors as Record<string, string>).audience}
                </p>
              )}
            </Section>
          )}

          {/* Details and Repeat were set on the first step; asking again would be asking twice. */}
          <Section title="Extras">
          {!isReminder && (
            <ImageField value={draft.imageUrl} onChange={(imageUrl) => form.setFieldValue('imageUrl', imageUrl)} />
          )}

          {!isReminder && onStepTwo && (
            <div className="space-y-1.5">
              <Label className="block">Linked Job (optional)</Label>

              {draft.linkedJob ? (
                <div className="flex items-start justify-between gap-2 rounded-md border px-3 py-2">
                  <div className="flex gap-2">
                    <Link2 className="mt-0.5 size-3.5 shrink-0 [color:var(--ds-color-text-secondary)]" />
                    <div>
                      {draft.linkedJob.kind === 'campus' ? (
                        <Button
                          type="button"
                          variant="link"
                          className="h-auto justify-start p-0 text-sm"
                          onClick={onOpenJob}
                        >
                          {draft.linkedJob.campusJob}
                        </Button>
                      ) : (
                        <Button asChild variant="link" className="h-auto justify-start p-0 text-sm">
                          <a href={draft.linkedJob.url} target="_blank" rel="noreferrer">
                            {draft.linkedJob.title}
                          </a>
                        </Button>
                      )}
                      <p className="text-sm [color:var(--ds-color-text-secondary)]">
                        {draft.linkedJob.kind === 'campus' ? 'Campus job' : draft.linkedJob.url}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    iconOnly
                    aria-label="Remove linked job"
                    onClick={() => form.setFieldValue('linkedJob', null)}
                  >
                    <X className="size-3.5" />
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-center"
                  onClick={() => setLinking(true)}
                >
                  <Link2 className="size-4" />
                  Link a Job
                </Button>
              )}

            </div>
          )}
          </Section>

          <LinkJobDialog
            open={linking}
            initial={draft.linkedJob}
            onClose={() => setLinking(false)}
            onLink={(job: LinkedJob) => {
              form.setFieldValue('linkedJob', job)
              setLinking(false)
            }}
          />
          </div>

          {showPreview && (
            <div className="hidden min-h-0 lg:block lg:h-full">
              <DayPreview
                date={draft.eventDate}
                startTime={draft.startTime}
                endTime={draft.endTime}
                title={draft.title}
                entries={dayEntries}
                onDateChange={setStartDate}
                onTimeChange={(start, end) => {
                  form.setFieldValue('startTime', start)
                  form.setFieldValue('endTime', end)
                }}
              />
            </div>
          )}
        </div>

        <DialogFooter className="min-w-0 flex-row flex-wrap items-center justify-between gap-x-2 gap-y-1.5 px-3 py-2 sm:gap-3 sm:px-4 sm:py-3">
          {isEdit && !isReminder && onNotifyMinorChange ? (
            <label className="flex min-w-0 cursor-pointer items-center gap-2 text-xs [color:var(--ds-color-text-secondary)] sm:text-sm">
              <Checkbox checked={notifyMinor} onCheckedChange={(value: boolean | 'indeterminate') => onNotifyMinorChange(value === true)} />
              Notify students about this change
            </label>
          ) : (
          <span className="min-w-0 basis-full text-xs [color:var(--ds-color-text-secondary)] sm:flex-1 sm:basis-0 sm:text-sm">
            {!rules.needsAudience || !onStepTwo
              ? ''
              : count > 0
                ? `${count} students will be notified`
                : 'No audience yet — you can choose it later'}
          </span>
          )}

          <span className="ml-auto flex shrink-0 justify-end gap-2">
            {isEdit && canCancelEvent && !isReminder && (
              <Button type="button" variant="outline" onClick={onCancelEvent}>
                Cancel Event
              </Button>
            )}

            {isEdit && canDeleteReminder && isReminder && (
              <Button type="button" variant="outline" onClick={onDeleteReminder}>
                <Trash2 className="size-4" />
                Delete
              </Button>
            )}
            <Button type="button" variant="outline" onClick={onBack}>
              Back
            </Button>
            <Button type="button" variant="outline" onClick={close}>
              Cancel
            </Button>
            <Button type="submit">Publish Event</Button>
          </span>
        </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
    </>
  )
}

export default PublishEventDialog
