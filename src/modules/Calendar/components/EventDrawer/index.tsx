import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { CalendarPlus, Info, Link2, Lock, Trash2, TriangleAlert, Wand2, X } from 'lucide-react'
import { useFormik, validateYupSchema, yupToFormErrors } from 'formik'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'
import TiptapEditor from '@/components/custom/TiptapEditor'
import { DatePicker } from '@/components/custom/DatePicker'
import TimeSelect, { addDaysTo, dayShift, plusHour } from '../TimeSelect'
import { Combobox, MultiSelect } from '@/components/ui/MultiSelect'
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
import { rulesFor } from '../../helpers/tpo'
import { batchesFor, countAudience } from '../../services/audience'
import { eventSchema } from '../../services/eventSchema'
import {
  BATCH_OPTIONS,
  COMPANY_OPTIONS,
  FINAL_YEAR_BATCH,
  COURSE_OPTIONS,
  DEPARTMENT_OPTIONS,
  EVENT_TYPE_OPTIONS,
  MODE_OPTIONS,
  OPPORTUNITY_OPTIONS,
} from '../../constants/tpo'
import type { DayEntry } from '../DayPreview'
import type { EventDraft, EventMode, LinkedJob, OpportunityType, TpoEventType } from '../../types/tpo'

interface EventDrawerProps {
  open: boolean
  initial: EventDraft
  isEdit: boolean
  canCancelEvent?: boolean
  canDeleteReminder?: boolean
  dayEntries: DayEntry[]
  onClose: () => void
  onCancelEvent?: () => void
  onDeleteReminder?: () => void
  onSave: (draft: EventDraft) => void
}

const InfoNote = ({ icon, children }: { icon?: React.ReactNode; children: React.ReactNode }) => (
  <p className="flex gap-2 rounded-lg border px-3 py-2 text-sm [background-color:var(--ds-color-info-subtle)] [border-color:var(--ds-color-info)]/20 [color:var(--ds-color-text-secondary)]">
    {icon ?? <Info className="mt-0.5 size-3.5 shrink-0 [color:var(--ds-color-info)]" />}
    <span>{children}</span>
  </p>
)

const Section = ({ title, caption, children }: { title: string; caption?: string; children: React.ReactNode }) => (
  <section className="space-y-2.5 rounded-xl border p-3 [background-color:var(--ds-color-bg-surface)]">
    <div>
      <h3 className="text-sm font-semibold">{title}</h3>
      {caption && <p className="text-sm [color:var(--ds-color-text-secondary)]">{caption}</p>}
    </div>
    {children}
  </section>
)

const Required = () => <span className="[color:var(--ds-color-danger)]">*</span>

const clock = (value: string): string =>
  value ? format(new Date(`2000-01-01T${value}:00`), 'h:mm a') : ''

const EventDrawer = ({
  open,
  initial,
  isEdit,
  canCancelEvent,
  canDeleteReminder,
  dayEntries,
  onClose,
  onCancelEvent,
  onDeleteReminder,
  onSave,
}: EventDrawerProps) => {
  const [linking, setLinking] = useState(false)

  const form = useFormik<EventDraft>({
    initialValues: initial,
    enableReinitialize: true,
    validateOnChange: true,
    validateOnBlur: true,
    validate: (values) => {
      try {
        validateYupSchema(values, eventSchema, true, { eventType: values.eventType })
      } catch (error) {
        return yupToFormErrors(error)
      }

      if (rulesFor(values.eventType).needsAudience && countAudience(values.audience) === 0) {
        return { title: undefined, audienceCount: '0 students match this audience.' } as never
      }

      return {}
    },
    onSubmit: (values) => onSave(values),
  })

  const draft = form.values
  const rules = rulesFor(draft.eventType)
  const isReminder = draft.eventType === 'my_reminder'
  const count = rules.needsAudience ? countAudience(draft.audience) : 0
  const allDepartments = draft.audience.departments.length === DEPARTMENT_OPTIONS.length
  const showPreview = rules.needsTime && Boolean(draft.eventDate)
  const batchOptions = BATCH_OPTIONS.filter((option) => batchesFor(draft.audience.opportunityType).includes(option.year))

  useEffect(() => {
    if (!open) setLinking(false)
  }, [open])

  const showErrors = form.submitCount > 0

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

  const audienceError = (field: 'courses' | 'batches' | 'departments'): string | undefined => {
    const touched = form.touched.audience as Record<string, boolean> | undefined
    if (!showErrors && !touched?.[field]) return undefined
    const errors = form.errors.audience as Record<string, string> | undefined

    return errors?.[field]
  }

  const pickType = (eventType: TpoEventType) => {
    const next = rulesFor(eventType)
    form.setValues({
      ...draft,
      eventType,
      startTime: next.needsTime ? draft.startTime : '',
      endTime: next.needsTime ? draft.endTime : '',
      mode: next.needsMode ? draft.mode : '',
      venue: next.needsMode ? draft.venue : '',
      onlinePlatform: next.needsMode ? draft.onlinePlatform : '',
    })
  }

  const pickOpportunity = (opportunityType: OpportunityType) => {
    const allowed = batchesFor(opportunityType)
    form.setFieldValue('audience', {
      ...draft.audience,
      opportunityType,
      batches: draft.audience.batches.filter((batch) => allowed.includes(batch)),
    })
  }

  const fillDummy = () => {
    const day = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)

    form.setValues({
      ...draft,
      title: isReminder ? 'Call the HR team for results' : 'Pre-Placement Talk',
      company: rules.needsCompany ? COMPANY_OPTIONS[0] : '',
      eventDate: day,
      endDate: day,
      startTime: rules.needsTime ? '10:00' : isReminder ? '15:00' : '',
      endTime: rules.needsTime ? '11:30' : '',
      mode: rules.needsMode ? 'offline' : '',
      venue: rules.needsMode ? 'Auditorium, Block A' : '',
      onlinePlatform: '',
      description: rules.needsAudience ? 'Bring your resume and ID card.' : '',
      note: isReminder ? 'Ask about the shortlist date' : '',
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

  const saveLabel = isEdit ? 'Save Changes' : isReminder ? 'Save Reminder' : 'Publish Event'

  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-black/50" aria-hidden />}
    <Dialog open={open} modal={false} onOpenChange={(next) => !next && close()}>
      <DialogContent
        className={cn(
          'max-h-[92vh] max-w-none gap-0 p-0 [background-color:var(--ds-color-bg-surface)]',
          showPreview ? 'w-[min(68rem,96vw)]' : 'w-[min(34rem,94vw)]',
        )}
        onInteractOutside={(event) => event.preventDefault()}
      >
        <DialogHeader className="px-4 pb-3 pt-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-lg [background-color:var(--ds-color-brand-subtle)] [color:var(--ds-color-brand)]">
                <CalendarPlus className="size-5" />
              </span>
              <div>
                <DialogTitle>{isEdit ? 'Edit Event' : 'Create New Event'}</DialogTitle>
                <DialogDescription className="sr-only">Event details</DialogDescription>
              </div>
            </div>

            {!isEdit && (
              <Button type="button" variant="outline" size="sm" className="mr-16" onClick={fillDummy}>
                <Wand2 className="size-3.5" />
                Fill Data
              </Button>
            )}
          </div>
        </DialogHeader>

        <div
          className={cn(
            'grid max-h-[70vh] gap-3 overflow-hidden px-4 pb-4 pt-3 [background-color:var(--ds-color-bg-app)]',
            showPreview && 'lg:grid-cols-[1fr_24rem]',
          )}
        >
          <div className="min-h-0 space-y-3 overflow-y-auto pr-1">
          <Section title="Event basics">
          <div className="space-y-1.5">
            <Label>
              Event Type <Required />
            </Label>
            <Combobox
              searchable={false}
              disabled={isEdit}
              value={draft.eventType}
              placeholder="Select event type"
              options={EVENT_TYPE_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
              onChange={(value) => pickType(value as TpoEventType)}
            />
          </div>

          {isReminder && <InfoNote icon={<Lock className="mt-0.5 size-3.5 shrink-0" />}>Only you can see this. No students are notified.</InfoNote>}

          <Input
            label={
              <>
                {isReminder ? 'Title' : 'Event Title'} <span className="[color:var(--ds-color-danger)]">*</span>
              </>
            }
            name="title"
            placeholder={isReminder ? 'Enter a short reminder title' : 'Enter the event title'}
            showCount
            maxLength={LIMITS.titleLength}
            value={draft.title}
            error={errorFor('title')}
            onChange={form.handleChange}
            onBlur={form.handleBlur}
          />

          {rules.needsCompany && (
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

          <div className={rules.needsTime ? 'grid grid-cols-2 gap-2.5' : isReminder ? 'grid grid-cols-2 gap-2.5' : ''}>
            <div className="space-y-1.5">
              <Label htmlFor="eventDate">
                {rules.needsTime ? 'Start date' : 'Date'} <Required />
              </Label>
              <DatePicker
                id="eventDate"
                className="w-full"
                showMonthPicker
                showYearPicker
                yearRange={{ from: new Date().getFullYear() - 1, to: new Date().getFullYear() + 5 }}
                value={draft.eventDate}
                hasError={Boolean(errorFor('eventDate'))}
                onChange={setStartDate}
              />
              {errorFor('eventDate') && (
                <p className="text-xs [color:var(--ds-color-danger-text)]">{errorFor('eventDate')}</p>
              )}
            </div>

            {rules.needsTime && (
              <>
                <div className="space-y-1.5">
                  <Label>
                    Start Time <Required />
                  </Label>
                  <TimeSelect
                    value={draft.startTime}
                    onChange={(value) => {
                      const end = plusHour(value)
                      set('startTime', value)
                      set('endTime', end)
                      set('endDate', addDaysTo(draft.eventDate, end < value ? 1 : 0))
                    }}
                  />
                  {errorFor('startTime') && (
                    <p className="text-xs [color:var(--ds-color-danger-text)]">{errorFor('startTime')}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="endDate">
                    End date <Required />
                  </Label>
                  <DatePicker
                    id="endDate"
                    className="w-full"
                    showMonthPicker
                    showYearPicker
                    yearRange={{ from: new Date().getFullYear() - 1, to: new Date().getFullYear() + 5 }}
                    value={draft.endDate || draft.eventDate}
                    hasError={Boolean(errorFor('endDate'))}
                    onChange={(value) => set('endDate', value)}
                  />
                  {errorFor('endDate') && (
                    <p className="text-xs [color:var(--ds-color-danger-text)]">{errorFor('endDate')}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label>
                    End Time <Required />
                  </Label>
                  <TimeSelect value={draft.endTime} onChange={(value) => set('endTime', value)} />
                  {errorFor('endTime') && (
                    <p className="text-xs [color:var(--ds-color-danger-text)]">{errorFor('endTime')}</p>
                  )}
                </div>
              </>
            )}

            {isReminder && (
              <div className="space-y-1.5">
                <Label>Time (optional)</Label>
                <TimeSelect value={draft.startTime} onChange={(value) => form.setFieldValue('startTime', value)} />
              </div>
            )}
          </div>

          {rules.info && !isReminder && <InfoNote>{rules.info}</InfoNote>}

          {clashes.length > 0 && (
            <p className="flex gap-2 rounded-lg border px-3 py-2 text-sm [background-color:var(--ds-color-warning-subtle)] [border-color:var(--ds-color-warning)] [color:var(--ds-color-warning-text)]">
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

          {rules.needsMode && (
            <Section title="Where it happens">
              <div className="space-y-1.5">
                <Label>
                  Mode <Required />
                </Label>
                <RadioGroup
                  className="flex flex-row gap-6"
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

          {rules.needsAudience && (
            <Section title="Target Audience">

              <div className="space-y-1.5">
                <Label>
                  Opportunity Type <Required />
                </Label>
                <RadioGroup
                  className="flex flex-row gap-5"
                  value={draft.audience.opportunityType}
                  onValueChange={(value) => pickOpportunity(value as OpportunityType)}
                >
                  {OPPORTUNITY_OPTIONS.map((option) => (
                    <div key={option.value} className="flex items-center gap-2">
                      <RadioGroupItem value={option.value} id={`opportunity-${option.value}`} />
                      <Label htmlFor={`opportunity-${option.value}`} className="cursor-pointer font-normal">
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="space-y-1.5">
                <Label>
                  Course <Required />
                </Label>
                <MultiSelect
                  placeholder="Select courses"
                  options={COURSE_OPTIONS.map((course) => ({ value: course, label: course }))}
                  value={draft.audience.courses}
                  onChange={(courses) => set('audience.courses', courses)}
                />
                {audienceError('courses') && (
                  <p className="text-xs [color:var(--ds-color-danger-text)]">{audienceError('courses')}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>
                  Batch <Required />
                </Label>
                <MultiSelect
                  placeholder="Select batches"
                  options={batchOptions.map((option) => ({ value: String(option.year), label: option.label }))}
                  value={draft.audience.batches.map(String)}
                  onChange={(batches) => set('audience.batches', batches.map(Number))}
                />
                {audienceError('batches') && (
                  <p className="text-xs [color:var(--ds-color-danger-text)]">{audienceError('batches')}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>
                  Department <Required />
                </Label>
                <MultiSelect
                  searchable
                  placeholder="Select departments"
                  options={DEPARTMENT_OPTIONS.map((department) => ({ value: department, label: department }))}
                  value={draft.audience.departments}
                  onChange={(departments) => set('audience.departments', departments)}
                />
                <Button
                  type="button"
                  variant="link"
                  className="text-sm"
                  onClick={() =>
                    form.setFieldValue('audience', {
                      ...draft.audience,
                      departments: allDepartments ? [] : [...DEPARTMENT_OPTIONS],
                    })
                  }
                >
                  {allDepartments ? 'Clear departments' : 'All departments'}
                </Button>
                {audienceError('departments') && (
                  <p className="text-xs [color:var(--ds-color-danger-text)]">{audienceError('departments')}</p>
                )}
              </div>

              {count > 0 ? (
                <p className="flex items-center gap-2 text-sm font-semibold [color:var(--ds-color-brand)]">
                  <Info className="size-3.5" />
                  {count} students will be notified
                </p>
              ) : showErrors ? (
                <p className="flex items-center gap-2 text-sm font-semibold [color:var(--ds-color-danger-text)]">
                  <Info className="size-3.5" />
                  0 students match this audience.
                </p>
              ) : null}
            </Section>
          )}

          <Section title={isReminder ? 'Note' : 'Details'}>
          {isReminder ? (
            <Textarea
              name="note"
              rows={3}
              label="Note (optional)"
              showCount
              maxLength={LIMITS.reminderNoteLength}
              value={draft.note}
              onChange={form.handleChange}
            />
          ) : (
            <TiptapEditor
              label="Description (optional)"
              value={draft.description}
              maxLength={LIMITS.descriptionLength}
              error={errorFor('description')}
              onChange={(html) => form.setFieldValue('description', html)}
            />
          )}

          {!isReminder && (
            <div className="space-y-1.5">
              <Label className="block">Linked Job (optional)</Label>

              {draft.linkedJob ? (
                <div className="flex items-start justify-between gap-2 rounded-md border px-3 py-2">
                  <div className="flex gap-2">
                    <Link2 className="mt-0.5 size-3.5 shrink-0 [color:var(--ds-color-text-secondary)]" />
                    <div>
                      <p className="text-sm font-medium">
                        {draft.linkedJob.kind === 'campus' ? draft.linkedJob.campusJob : draft.linkedJob.title}
                      </p>
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
            <div className="min-h-0 lg:h-full">
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

        <DialogFooter className="flex-row items-center justify-between px-4 py-3">
          <span className="text-sm [color:var(--ds-color-text-secondary)]">
            {rules.needsAudience && count > 0 ? `${count} students will be notified` : ''}
          </span>

          <span className="flex gap-2">
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
            <Button type="button" variant="outline" onClick={close}>
              {isEdit ? 'Close' : 'Cancel'}
            </Button>
            <Button type="button" onClick={() => form.handleSubmit()}>
              {saveLabel}
            </Button>
          </span>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  )
}

export default EventDrawer
