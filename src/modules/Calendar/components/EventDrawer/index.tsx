import { useEffect, useState } from 'react'
import { CalendarPlus, Info, Link2, Lock, X } from 'lucide-react'
import { useFormik, validateYupSchema, yupToFormErrors } from 'formik'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'
import { DatePicker } from '@/components/custom/DatePicker'
import { TimePicker } from '@/components/custom/TimePicker'
import { Combobox, MultiSelect } from '@/components/ui/MultiSelect'
import { RadioGroup, RadioGroupItem } from '@/components/ui/RadioGroup'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/Drawer'
import LinkJobDialog from '../LinkJobDialog'
import { LIMITS } from '../../constants'
import { rulesFor } from '../../helpers/tpo'
import { batchesFor, countAudience } from '../../services/audience'
import { eventSchema } from '../../services/eventSchema'
import {
  BATCH_OPTIONS,
  COMPANY_OPTIONS,
  COURSE_OPTIONS,
  DEPARTMENT_OPTIONS,
  EVENT_TYPE_OPTIONS,
  MODE_OPTIONS,
  OPPORTUNITY_OPTIONS,
} from '../../constants/tpo'
import type { EventDraft, EventMode, LinkedJob, OpportunityType, TpoEventType } from '../../types/tpo'

interface EventDrawerProps {
  open: boolean
  initial: EventDraft
  isEdit: boolean
  onClose: () => void
  onSave: (draft: EventDraft) => void
}

const InfoNote = ({ icon, children }: { icon?: React.ReactNode; children: React.ReactNode }) => (
  <p className="flex gap-2 rounded-lg border px-3 py-2 text-sm [background-color:var(--ds-color-info-subtle)] [border-color:var(--ds-color-info)]/20 [color:var(--ds-color-text-secondary)]">
    {icon ?? <Info className="mt-0.5 size-3.5 shrink-0 [color:var(--ds-color-info)]" />}
    <span>{children}</span>
  </p>
)

const Section = ({ title, caption, children }: { title: string; caption?: string; children: React.ReactNode }) => (
  <section className="space-y-3 rounded-xl border p-4 [background-color:var(--ds-color-bg-surface)]">
    <div>
      <h3 className="text-sm font-semibold">{title}</h3>
      {caption && <p className="text-sm [color:var(--ds-color-text-secondary)]">{caption}</p>}
    </div>
    {children}
  </section>
)

const Required = () => <span className="[color:var(--ds-color-danger)]">*</span>

const EventDrawer = ({ open, initial, isEdit, onClose, onSave }: EventDrawerProps) => {
  const [linking, setLinking] = useState(false)

  const form = useFormik<EventDraft>({
    initialValues: initial,
    enableReinitialize: true,
    validateOnChange: false,
    validateOnBlur: false,
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
  const batchOptions = BATCH_OPTIONS.filter((option) => batchesFor(draft.audience.opportunityType).includes(option.year))

  useEffect(() => {
    if (!open) setLinking(false)
  }, [open])

  const showErrors = form.submitCount > 0

  const errorFor = (field: string): string | undefined => {
    if (!showErrors) return undefined
    const errors = form.errors as Record<string, unknown>
    return errors[field] as string | undefined
  }

  const audienceError = (field: 'courses' | 'batches' | 'departments'): string | undefined => {
    if (!showErrors) return undefined
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

  const close = () => {
    if (form.dirty && !window.confirm('You have unsaved changes. Close anyway?')) return
    onClose()
  }

  const saveLabel = isEdit ? 'Save Changes' : isReminder ? 'Save Reminder' : 'Publish Event'

  return (
    <Drawer open={open} modal={false} onOpenChange={(next) => !next && close()}>
      <DrawerContent
        side="right"
        className="w-full sm:max-w-[30rem]"
        onInteractOutside={(event) => event.preventDefault()}
      >
        <DrawerHeader>
          <div className="flex items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-lg [background-color:var(--ds-color-brand-subtle)] [color:var(--ds-color-brand)]">
              <CalendarPlus className="size-5" />
            </span>
            <div>
              <DrawerTitle>{isEdit ? 'Edit Event' : 'Create New Event'}</DrawerTitle>
              <DrawerDescription className="sr-only">Event details</DrawerDescription>
            </div>
          </div>
        </DrawerHeader>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4 [background-color:var(--ds-color-bg-app)]">
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
            showCount
            maxLength={LIMITS.titleLength}
            hint={`Max ${LIMITS.titleLength} characters`}
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
              {draft.company && (
                <p className="text-sm [color:var(--ds-color-text-secondary)]">
                  Existing {draft.company} events: Online Assessment, 2 Oct (Ravi Sharma)
                </p>
              )}
            </div>
          )}

          <div className={rules.needsTime ? 'grid grid-cols-3 gap-2.5' : isReminder ? 'grid grid-cols-2 gap-2.5' : ''}>
            <div className="space-y-1.5">
              <Label htmlFor="eventDate">
                Date <span className="[color:var(--ds-color-danger)]">*</span>
              </Label>
              <DatePicker
                id="eventDate"
                value={draft.eventDate}
                hasError={Boolean(errorFor('eventDate'))}
                onChange={(value) => form.setFieldValue('eventDate', value)}
              />
              {errorFor('eventDate') && (
                <p className="text-sm [color:var(--ds-color-danger-text)]">{errorFor('eventDate')}</p>
              )}
            </div>

            {rules.needsTime && (
              <>
                <TimePicker
                  label="Start Time *"
                  value={draft.startTime}
                  error={errorFor('startTime')}
                  onChange={(value) => form.setFieldValue('startTime', value)}
                />
                <TimePicker
                  label="End Time *"
                  value={draft.endTime}
                  error={errorFor('endTime')}
                  onChange={(value) => form.setFieldValue('endTime', value)}
                />
              </>
            )}

            {isReminder && (
              <TimePicker
                label="Time (optional)"
                value={draft.startTime}
                onChange={(value) => form.setFieldValue('startTime', value)}
              />
            )}
          </div>

          {rules.info && !isReminder && <InfoNote>{rules.info}</InfoNote>}
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
                  onValueChange={(value) => form.setFieldValue('mode', value as EventMode)}
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
                {errorFor('mode') && <p className="text-sm [color:var(--ds-color-danger-text)]">{errorFor('mode')}</p>}
              </div>

              {draft.mode === 'offline' && (
                <Input
                  name="venue"
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
                  placeholder="Google Meet"
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
                  onChange={(courses) => form.setFieldValue('audience', { ...draft.audience, courses })}
                />
                {audienceError('courses') && (
                  <p className="text-sm [color:var(--ds-color-danger-text)]">{audienceError('courses')}</p>
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
                  onChange={(batches) =>
                    form.setFieldValue('audience', { ...draft.audience, batches: batches.map(Number) })
                  }
                />
                {audienceError('batches') && (
                  <p className="text-sm [color:var(--ds-color-danger-text)]">{audienceError('batches')}</p>
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
                  onChange={(departments) => form.setFieldValue('audience', { ...draft.audience, departments })}
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
                  <p className="text-sm [color:var(--ds-color-danger-text)]">{audienceError('departments')}</p>
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
              hint={`Max ${LIMITS.reminderNoteLength} characters`}
              value={draft.note}
              onChange={form.handleChange}
            />
          ) : (
            <Textarea
              name="description"
              rows={3}
              label="Description (optional)"
              showCount
              maxLength={LIMITS.descriptionLength}
              hint={`Max ${LIMITS.descriptionLength} characters`}
              value={draft.description}
              onChange={form.handleChange}
            />
          )}

          {!isReminder && (
            <div className="space-y-1.5">
              <Label>Linked Job (optional)</Label>

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
                <Button type="button" variant="outline" size="sm" onClick={() => setLinking(true)}>
                  + Link a Job
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

        <DrawerFooter className="flex-row items-center justify-between">
          <span className="text-sm [color:var(--ds-color-text-secondary)]">
            {rules.needsAudience && count > 0 ? `${count} students will be notified` : ''}
          </span>
          <span className="flex gap-2">
            <Button type="button" variant="outline" onClick={close}>
              Cancel
            </Button>
            <Button type="button" onClick={() => form.handleSubmit()}>
              {saveLabel}
            </Button>
          </span>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}

export default EventDrawer
