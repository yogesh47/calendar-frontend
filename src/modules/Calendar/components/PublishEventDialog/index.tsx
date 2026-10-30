import { addDays, format } from 'date-fns'
import { useEffect, useState } from 'react'
import { CalendarPlus, Link2, Lock, Trash2, Wand2, X } from 'lucide-react'
import { useFormik } from 'formik'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Button } from '@/components/ui/Button'
import { Checkbox } from '@/components/ui/Checkbox'
import { Combobox } from '@/components/ui/MultiSelect'
import { RadioGroup, RadioGroupItem } from '@/components/ui/RadioGroup'
import { Dialog, DialogContent } from '@/components/ui/Dialog'
import { ModalBody, ModalFooter, ModalHeader, modalContentClass } from '@/modules/Calendar/components/Modal'
import ClashWarning from '../ClashWarning'
import LinkJobDialog from './components/LinkJobDialog'
import { overlaps } from '@/calendar'
import { labelFor, rulesFor } from '../../helpers/tpo'
import ImageField from './components/ImageField'
import AudienceFields, { audienceIsComplete, audienceIsEmpty } from '../AudienceFields'
import { countAudience } from '../../services/audience'
import { EVENT_TYPE_OPTIONS, FINAL_YEAR_BATCH, OTHER_TYPE_LENGTH, REMINDER_PRIVACY, VENUE_LENGTH } from '../../constants/tpo'
import { COMPANY_OPTIONS } from '../../constants'
import { MODE_OPTIONS } from './PublishEventDialog.constants'
import { InfoNote, Required, Section } from '../parts'
import type { DayEntry } from '@/calendar'
import type { TpoDraft, TpoEventType, EventMode, LinkedJob } from '../../types/tpo'

interface PublishEventDialogProps {
  open: boolean
  notifyMinor?: boolean
  onNotifyMinorChange?: (value: boolean) => void
  initial: TpoDraft
  isEdit: boolean
  reminderOnly?: boolean
  canCancelEvent?: boolean
  canDeleteReminder?: boolean
  dayEntries: DayEntry[]
  onClose: () => void
  onOpenJob?: () => void
  onCancelEvent?: () => void
  onDeleteReminder?: () => void
  onSave: (draft: TpoDraft) => void
  /** Back to the first step — with what was filled in here, so Next brings it back. */
  onBack: (draft: TpoDraft) => void
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

  const form = useFormik<TpoDraft>({
    initialValues: initial,
    enableReinitialize: true,
    validateOnChange: true,
    validateOnBlur: true,
    validate: (values) => {
      // Title, date and time were checked on the calendar's own step; this one checks what it asks.
      const errors: Record<string, string> = {}
      const rules = rulesFor(values.eventType)

      if (values.eventType === 'other' && !values.otherType.trim()) errors.otherType = 'Enter the event type.'

      if (rules.needsMode) {
        if (!values.mode) errors.mode = 'Select a mode.'
        else if (values.mode === 'offline' && !values.venue.trim()) errors.venue = 'Venue is required.'
        else if (values.mode === 'online' && !values.onlinePlatform.trim()) {
          errors.onlinePlatform = 'Online platform is required.'
        }
      }

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
    // End date pehle modal se aati hai — raat 11 baje shuru hua event agle din khatam ho sakta hai.
    onSubmit: (values) => onSave({ ...values, endDate: values.endDate || values.eventDate }),
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
    Kism yahin chuni jaati hai. Badalne par uske hisaab se waqt theek kiya jaata
    hai: all-day kism (Deadline) ka koi time nahi hota, aur waapas timed kism
    par aane par pehle modal ke times laut aate hain. Reminder ki ghanti
    `none` par kabhi nahi bajti, isliye use ek ghanta pehle ki ghanti milti hai,
    aur event ki description uska note ban jaati hai.
  */
  const pickType = (value: string) => {
    const eventType = value as TpoEventType
    const nextTimed = rulesFor(eventType).needsTime
    const toReminder = eventType === 'my_reminder'

    form.setValues({
      ...draft,
      eventType,
      // The name belongs to "Other" only; switching away drops it.
      otherType: eventType === 'other' ? draft.otherType : '',
      startTime: nextTimed || toReminder ? draft.startTime || initial.startTime : '',
      endTime: nextTimed ? draft.endTime || initial.endTime : '',
      endDate: nextTimed ? draft.endDate || initial.endDate : draft.eventDate,
      remindBefore:
        toReminder && (!draft.remindBefore || draft.remindBefore === 'none') ? '1_hour' : draft.remindBefore,
      note: toReminder && !draft.note ? draft.description : draft.note,
    })
  }

  /*
    Pehle modal ne title aur din de diye hain — yahan unhe haath nahi
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
      // 90 minutes from a late start ends tomorrow.
      endDate:
        rules.needsTime && draft.eventDate && end.getDate() !== start.getDate()
          ? format(addDays(new Date(`${draft.eventDate}T00:00:00`), 1), 'yyyy-MM-dd')
          : draft.endDate || draft.eventDate,
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

  const close = () => onClose()


  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-black/50" aria-hidden />}
    <Dialog open={open} modal={false} onOpenChange={(next) => !next && close()}>
      <DialogContent
        className={modalContentClass('lg')}
        onInteractOutside={(event) => event.preventDefault()}
      >
        <form onSubmit={form.handleSubmit} noValidate className="contents">
        {/*
          Title pehle modal me likha ja chuka hai, isliye yahan wo field ban kar
          nahi aata — par dikhna chahiye, warna banda bhool jaata hai ki wo kya
          publish kar raha hai.
        */}
        <ModalHeader
          icon={<CalendarPlus />}
          title={isEdit ? 'Edit Event' : isReminder ? 'Add Reminder' : 'Publish Event'}
          description={[
            draft.title || 'Untitled',
            !isReminder && (draft.eventType === 'other' && draft.otherType.trim() ? draft.otherType.trim() : labelFor(draft.eventType)),
          ]
            .filter(Boolean)
            .join(' · ')}
          actions={
            !isEdit && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                title="Fill Data"
                aria-label="Fill Data"
                className="px-2 sm:px-3"
                onClick={fillDummy}
              >
                <Wand2 className="size-3.5" />
                <span className="hidden sm:inline">Fill Data</span>
              </Button>
            )
          }
        />

        <ModalBody className="overflow-x-hidden">
          {/* Warnings first, outside the cards — they are about the whole event. */}
          {onStepTwo && <ClashWarning clashes={clashes} />}

          {isReminder && !reminderOnly && (
            <InfoNote icon={<Lock className="mt-0.5 size-3.5 shrink-0" />}>{REMINDER_PRIVACY}</InfoNote>
          )}

          {/*
            Title, the date and the note were asked for in the calendar's own
            modal. Asking again here would be asking twice.
          */}
          <Section title="Event details">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="min-w-0 space-y-1.5">
                <Label>
                  Event type <Required />
                </Label>
                <Combobox
                  searchable={false}
                  value={draft.eventType}
                  placeholder="Select event type"
                  /*
                    Edit me event kisi aur event type me badal sakta hai, par reminder
                    nahi ban sakta — reminder backend me alag table me rehta hai.
                  */
                  options={EVENT_TYPE_OPTIONS.filter((option) => !isEdit || option.value !== 'my_reminder').map(
                    (option) => ({ value: option.value, label: option.label }),
                  )}
                  onChange={pickType}
                />
              </div>

              {draft.eventType === 'other' && (
                <Input
                  name="otherType"
                  label={
                    <>
                      Specify event type <Required />
                    </>
                  }
                  placeholder="e.g. Alumni Meet"
                  maxLength={OTHER_TYPE_LENGTH}
                  value={draft.otherType}
                  error={errorFor('otherType')}
                  onChange={form.handleChange}
                  onBlur={form.handleBlur}
                />
              )}

              {rules.needsCompany && onStepTwo && (
                <div className="min-w-0 space-y-1.5">
                  <Label>Company</Label>
                  <Combobox
                    value={draft.company}
                    placeholder="Select company"
                    options={COMPANY_OPTIONS.map((company) => ({ value: company, label: company }))}
                    onChange={(value) => form.setFieldValue('company', value)}
                  />
                </div>
              )}
            </div>

            {rules.info && !isReminder && onStepTwo && <InfoNote>{rules.info}</InfoNote>}
          </Section>

          {rules.needsMode && onStepTwo && (
            <Section title="Venue" caption="Where the students attend.">
              <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-[auto_minmax(0,1fr)]">
                <div className="space-y-1.5">
                  <Label>
                    Mode <Required />
                  </Label>
                  {/* The two modes sit as one segmented control, the same height as the input beside it. */}
                  <RadioGroup
                    className="flex h-10 w-fit flex-row items-stretch gap-1 rounded-lg border p-1"
                    value={draft.mode}
                    onValueChange={(value) => set('mode', value as EventMode)}
                  >
                    {MODE_OPTIONS.map((option) => (
                      <Label
                        key={option.value}
                        htmlFor={`mode-${option.value}`}
                        className={cn(
                          'flex cursor-pointer items-center gap-2 rounded-md px-3 text-sm font-normal focus-within:ring-2 focus-within:[--tw-ring-color:var(--ds-color-brand)]',
                          draft.mode === option.value &&
                            '[background-color:var(--ds-color-brand-subtle)] [color:var(--ds-color-brand)]',
                        )}
                      >
                        <RadioGroupItem value={option.value} id={`mode-${option.value}`} className="sr-only" />
                        {option.label}
                      </Label>
                    ))}
                  </RadioGroup>
                  {errorFor('mode') && <p className="!mt-1 text-xs leading-4 [color:var(--ds-color-danger-text)]">{errorFor('mode')}</p>}
                </div>

                {draft.mode === 'offline' && (
                  <Input
                    name="venue"
                    placeholder="e.g. Auditorium, Block A"
                    label={
                      <>
                        Venue <Required />
                      </>
                    }
                    maxLength={VENUE_LENGTH}
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
                        Online platform <Required />
                      </>
                    }
                    placeholder="e.g. Google Meet"
                    hint="No meeting link is collected"
                    value={draft.onlinePlatform}
                    error={errorFor('onlinePlatform')}
                    onChange={form.handleChange}
                    onBlur={form.handleBlur}
                  />
                )}
              </div>
            </Section>
          )}

          {/*
            Edit me audience yahan nahi badalti — uska apna "Audience" dialog hai,
            jo dikhata hai kaun judega, kaun hatega, aur unhe batata hai.
          */}
          {rules.needsAudience && onStepTwo && !isEdit && (
            <Section title="Audience" caption="Who sees it and is notified. You can also choose this later.">
              <AudienceFields
                idPrefix="publish-audience"
                value={draft.audience}
                showErrors={showErrors && !audienceIsEmpty(draft.audience)}
                onChange={(audience) => form.setFieldValue('audience', audience)}
              />
              {showErrors && (form.errors as Record<string, string>).audience && (
                <p className="!mt-1 text-xs leading-4 [color:var(--ds-color-danger-text)]">
                  {(form.errors as Record<string, string>).audience}
                </p>
              )}
            </Section>
          )}

          {/* Details and Repeat were set on the first step. */}
          {!isReminder && onStepTwo && (
            <Section title="Extras">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="min-w-0">
                  <ImageField value={draft.imageUrl} onChange={(imageUrl) => form.setFieldValue('imageUrl', imageUrl)} />
                </div>

                <div className="min-w-0 space-y-1.5">
                  <Label className="block">Linked Job</Label>

              {draft.linkedJob ? (
                <div className="flex min-w-0 items-start justify-between gap-2 rounded-md border px-3 py-2">
                  <div className="flex min-w-0 flex-1 gap-2">
                    <Link2 className="mt-0.5 size-3.5 shrink-0 [color:var(--ds-color-text-secondary)]" />
                    {/* A job title can be long; it wraps inside the half-width column instead of pushing out of it. */}
                    <div className="min-w-0 flex-1">
                      {draft.linkedJob.kind === 'campus' ? (
                        <Button
                          type="button"
                          variant="link"
                          className="h-auto justify-start whitespace-normal break-words p-0 text-left text-sm"
                          onClick={onOpenJob}
                        >
                          {draft.linkedJob.campusJob}
                        </Button>
                      ) : (
                        <Button asChild variant="link" className="h-auto justify-start whitespace-normal break-words p-0 text-left text-sm">
                          <a href={draft.linkedJob.url} target="_blank" rel="noreferrer">
                            {draft.linkedJob.title}
                          </a>
                        </Button>
                      )}
                      <p className="truncate text-sm [color:var(--ds-color-text-secondary)]">
                        {draft.linkedJob.kind === 'campus' ? 'Campus job' : draft.linkedJob.url}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    iconOnly
                    className="shrink-0"
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
              </div>
            </Section>
          )}

          <LinkJobDialog
            open={linking}
            initial={draft.linkedJob}
            onClose={() => setLinking(false)}
            onLink={(job: LinkedJob) => {
              form.setFieldValue('linkedJob', job)
              setLinking(false)
            }}
          />
        </ModalBody>

        <ModalFooter
          start={
            isEdit && !isReminder && onNotifyMinorChange ? (
              <label className="flex min-w-0 cursor-pointer items-center gap-2">
                <Checkbox checked={notifyMinor} onCheckedChange={(value: boolean | 'indeterminate') => onNotifyMinorChange(value === true)} />
                Notify students about this change
              </label>
            ) : !rules.needsAudience || !onStepTwo || isEdit ? undefined : count > 0 ? (
              `${count} students will be notified`
            ) : (
              'No audience selected yet'
            )
          }
        >
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
            <Button type="button" variant="outline" onClick={() => onBack(form.values)}>
              Back
            </Button>
            <Button type="button" variant="outline" onClick={close}>
              Cancel
            </Button>
            <Button type="submit">{isEdit ? 'Save Changes' : isReminder ? 'Save Reminder' : 'Publish Event'}</Button>
        </ModalFooter>
        </form>
      </DialogContent>
    </Dialog>
    </>
  )
}

export default PublishEventDialog
