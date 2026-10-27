import { useEffect } from 'react'
import { format } from 'date-fns'
import { CalendarPlus, Info, Lock, Trash2, TriangleAlert, Wand2 } from 'lucide-react'
import { useFormik, validateYupSchema, yupToFormErrors } from 'formik'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Button } from '@/components/ui/Button'
import TiptapEditor from '@/components/custom/TiptapEditor'
import { DatePicker } from '@/components/custom/DatePicker'
import TimeSelect, { addDaysTo, dayShift, plusHour } from '../TimeSelect'
import { Checkbox } from '@/components/ui/Checkbox'
import { Combobox } from '@/components/ui/MultiSelect'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog'
import DayPreview from '../DayPreview'
import { LIMITS } from '../../constants'
import { overlaps } from '../../helpers/conflicts'
import { rulesFor } from '../../helpers/tpo'
import { countAudience } from '../../services/audience'
import { eventSchema, recurrenceError } from '../../services/eventSchema'
import RepeatField from '../RepeatField'
import {
  EVENT_TYPE_OPTIONS,
  DEFAULT_REMIND_BEFORE,
  REMIND_BEFORE_OPTIONS,
  REMINDER_PRIVACY,
} from '../../constants/tpo'
import type { DayEntry } from '../DayPreview'
import type { EventDraft, TpoEventType } from '../../types/tpo'

interface CalendarEntryDialogProps {
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
  onCancelEvent?: () => void
  onDeleteReminder?: () => void
  onSave: (draft: EventDraft) => void
  /** TPO ke liye: pehla step bhar kar aage. Student ke liye diya hi nahi jaata. */
  onNext?: (draft: EventDraft) => void
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

const CalendarEntryDialog = ({
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
  onCancelEvent,
  onDeleteReminder,
  onSave,
  onNext,
}: CalendarEntryDialogProps) => {

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

      // Who it reaches is picked on the next step, or later from the event, so
      // an event with no audience yet is still valid here.
      const repeat = values.eventType === 'my_reminder' ? undefined : recurrenceError(values)

      return repeat ? { recurrence: repeat } : {}
    },
    onSubmit: (values) => onSave(values),
  })

  const draft = form.values
  const rules = rulesFor(draft.eventType)
  const isReminder = draft.eventType === 'my_reminder'
  /*
  /*
    This dialog is always the generic one — a title, a date, an optional time, a
    reminder lead and a note. A student saves it as their reminder; a TPO hands
    it on with `onNext`, and everything an event needs beyond this is asked for
    outside, where the calendar does not reach.
  */
  /*
    Reminder yahin khatam ho jaata hai. Uske paas na kism hai, na audience, na
    venue — agla modal uske liye khali hi khulta, isliye wo bhejna hi nahi.
    Sirf asli event aage jaata hai.
  */
  const handsOn = !isEdit && !reminderOnly && !isReminder && Boolean(onNext)
  const count = rules.needsAudience ? countAudience(draft.audience) : 0
  // The day panel on the right stays for everyone — student reminder and TPO
  // event, first step and second. A date is all it needs.
  const showPreview = Boolean(draft.eventDate)

  useEffect(() => {
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

  /*
    Kaunsi kism ka item hai — yahi tay karta hai ki aage kya poocha jayega.
    Kism badalne par uski apni fields saaf kar di jaati hain, taaki ek kism ka
    bacha hua data doosri me na chala jaye.
  */
  const pickType = (eventType: TpoEventType) => {
    const next = rulesFor(eventType)
    /*
      TPO ka draft event ka hota hai, aur usme "Remind me" khali rehta hai.
      Kism badal kar reminder karne par wo khali hi reh jaata tha, aur backend
      bina `remind_before` ke koi nudge schedule hi nahi karta — isliye reminder
      banta to tha, par uski ghanti kabhi bajti hi nahi thi.
    */
    const becameReminder = eventType === 'my_reminder'
    form.setValues({
      ...draft,
      eventType,
      remindBefore:
        becameReminder && (!draft.remindBefore || draft.remindBefore === 'none')
          ? DEFAULT_REMIND_BEFORE
          : draft.remindBefore,
      startTime: next.needsTime ? draft.startTime : '',
      endTime: next.needsTime ? draft.endTime : '',
      mode: next.needsMode ? draft.mode : '',
      venue: next.needsMode ? draft.venue : '',
      onlinePlatform: next.needsMode ? draft.onlinePlatform : '',
    })
  }

  /*
    Sirf wahi bharo jo is modal me dikh raha hai. Event ki baaki cheezen —
    company, venue, audience — agle modal ka kaam hain, aur unka apna Fill Data
    hai; yahan se bhar dete to wo chup-chaap bhar jaatin aur banda dekhta hi
    nahi ki usne kya publish kiya.
  */
  const fillDummy = () => {
    const start = new Date(Date.now() + 61 * 60000)
    const clock = (moment: Date) =>
      `${String(moment.getHours()).padStart(2, '0')}:${String(moment.getMinutes()).padStart(2, '0')}`

    form.setValues({
      ...draft,
      title: isReminder ? 'Call the HR team for results' : 'TCS Campus Drive — Pre-Placement Talk',
      eventDate: format(start, 'yyyy-MM-dd'),
      startTime: clock(start),
      endTime: rules.needsTime ? clock(new Date(start.getTime() + 90 * 60000)) : draft.endTime,
      note: isReminder ? 'Ask about the shortlist date' : draft.note,
      description: isReminder ? draft.description : 'Bring your resume and ID card.',
      remindBefore: '1_hour',
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

  /*
    Only the fields the first step actually draws are checked before moving on.
    An event's start and end times are required, but they are asked for on the
    second step — validating them here would block the student at a field that
    is not on screen.
  */
  const STEP_ONE_FIELDS = ['title', 'eventDate', 'startTime', 'endTime', 'description', 'recurrence'] as const

  const goToStepTwo = async () => {
    const errors = (await form.validateForm()) as Record<string, unknown>
    const blocking = STEP_ONE_FIELDS.filter((field) => errors[field])
    if (blocking.length) {
      blocking.forEach((field) => form.setFieldTouched(field, true, false))
      return
    }
    onNext?.(draft)
  }

  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-black/50" aria-hidden />}
      <Dialog open={open} modal={false} onOpenChange={(next) => !next && close()}>
        <DialogContent
          className={cn(
            'max-h-[92vh] max-w-none gap-0 p-0 sm:p-0 [background-color:var(--ds-color-bg-surface)]',
            '[&>button]:top-5',
            showPreview ? 'w-[min(68rem,96vw)]' : 'w-[min(34rem,94vw)]',
          )}
          onInteractOutside={(event) => event.preventDefault()}
        >
          <form onSubmit={form.handleSubmit} noValidate className="contents">
            <DialogHeader className="px-3 pb-3 pt-4 sm:px-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-lg [background-color:var(--ds-color-brand-subtle)] [color:var(--ds-color-brand)]">
                    <CalendarPlus className="size-5" />
                  </span>
                  <div className="min-w-0">
                    <DialogTitle className="whitespace-nowrap">
                      {reminderOnly ? (isEdit ? 'Edit Reminder' : 'Add Reminder') : isEdit ? 'Edit Event' : 'Create New Event'}
                    </DialogTitle>
                    <DialogDescription className="sr-only">Event details</DialogDescription>
                  </div>
                </div>

                {!isEdit && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    title="Fill Data"
                    aria-label="Fill Data"
                    className="mr-11 px-2 sm:mr-16 sm:px-3"
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
                'grid max-h-[70vh] gap-3 overflow-hidden px-3 pb-4 pt-3 [background-color:var(--ds-color-bg-app)] sm:px-4',
                showPreview && 'lg:grid-cols-[1fr_24rem]',
              )}
            >
              <div className="min-h-0 space-y-3 overflow-y-auto pr-1">
                <Section title={isReminder ? 'Reminder' : 'Event basics'}>

                  {!reminderOnly && (
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
                  )}

                  {isReminder && !reminderOnly && (
                    <InfoNote icon={<Lock className="mt-0.5 size-3.5 shrink-0" />}>{REMINDER_PRIVACY}</InfoNote>
                  )}

                  <Input
                    label={
                      <>
                        Title <span className="[color:var(--ds-color-danger)]">*</span>
                      </>
                    }
                    name="title"
                    placeholder="Enter a short reminder title"
                    showCount
                    maxLength={LIMITS.titleLength}
                    value={draft.title}
                    error={errorFor('title')}
                    onChange={form.handleChange}
                    onBlur={form.handleBlur}
                  />

                  {/* Start date, start time aur end time — ek hi pankti me, kyunki wo ek hi baat ke teen hisse hain. */}
                  <div
                    className={
                      rules.needsTime
                        ? 'grid grid-cols-2 gap-2.5 sm:grid-cols-3'
                        : 'grid grid-cols-1 gap-2.5 sm:grid-cols-2'
                    }
                  >
                    <div className={rules.needsTime ? 'col-span-2 space-y-1.5 sm:col-span-1' : 'space-y-1.5'}>
                      <Label htmlFor="eventDate">
                        {isReminder ? 'Date' : 'Start date'} <Required />
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

                    {/*
                      Reminder ke liye waqt marzi ki baat hai; event ke liye
                      nahi. Dono waqt yahin saath me poochhe jaate hain —
                      shuruaat aur ant ek doosre ke bina adhoore hain, unhe do
                      screen par baantna sirf aage-peeche karne par majboor
                      karta.
                    */}
                    <div className="space-y-1.5">
                      <Label>
                        {isReminder ? 'Time (optional)' : <>Start time <Required /></>}
                      </Label>
                      <TimeSelect
                        value={draft.startTime}
                        onChange={(value) => {
                          form.setFieldValue('startTime', value)
                          if (!rules.needsTime) return
                          /*
                            Shuruaat hat gayi to ant ka koi matlab nahi bachta —
                            wo bhi hat jaata hai. Warna end time ek aise waqt se
                            bandha reh jaata jo ab kahin likha hi nahi.
                          */
                          if (!value) {
                            form.setFieldValue('endTime', '')
                            return
                          }
                          // Ant shuruaat se pehle na reh jaye — ek ghanta aage kar do.
                          if (!draft.endTime || draft.endTime <= value) {
                            form.setFieldValue('endTime', plusHour(value))
                          }
                        }}
                      />
                    </div>

                    {rules.needsTime && (
                      <div className="space-y-1.5">
                        <Label>
                          End time <Required />
                        </Label>
                        <TimeSelect
                          value={draft.endTime}
                          after={draft.startTime}
                          onChange={(value) => set('endTime', value)}
                        />
                        {errorFor('endTime') && (
                          <p className="text-xs [color:var(--ds-color-danger-text)]">{errorFor('endTime')}</p>
                        )}
                      </div>
                    )}
                  </div>

                  {(
                    <div className="space-y-1.5">
                      <Label>Remind me</Label>
                      <Combobox
                        searchable={false}
                        value={draft.remindBefore}
                        placeholder="None"
                        options={REMIND_BEFORE_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
                        onChange={(value) => set('remindBefore', value)}
                      />
                    </div>
                  )}

                  {/*
                    Repeat sits with the date it repeats from. Only a new event
                    gets it: a reminder cannot repeat, and an existing occurrence
                    is edited on its own.
                  */}
                  {!isEdit && !isReminder && !reminderOnly && (
                    <RepeatField
                      eventDate={draft.eventDate}
                      value={draft.recurrence}
                      error={errorFor('recurrence')}
                      onChange={(value) => {
                        form.setFieldTouched('recurrence', true, false)
                        form.setFieldValue('recurrence', value)
                      }}
                    />
                  )}



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

                {/*
                  A reminder keeps a private note; an event has details that the
                  students read. They were both shown as "Note" here, and an
                  event's note was never saved — the backend has nowhere for it.
                */}
                <Section title={isReminder ? 'Note' : 'Details'}>
                  {isReminder ? (
                    <TiptapEditor
                      label="Note (optional)"
                      value={draft.note}
                      maxLength={LIMITS.reminderNoteLength}
                      error={errorFor('note')}
                      onChange={(html) => form.setFieldValue('note', html)}
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

                </Section>

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

            <DialogFooter className="flex-row items-center justify-between gap-2 px-3 py-2 sm:gap-3 sm:px-4 sm:py-3">
              {isEdit && !isReminder && onNotifyMinorChange ? (
                <label className="flex min-w-0 cursor-pointer items-center gap-2 text-xs [color:var(--ds-color-text-secondary)] sm:text-sm">
                  <Checkbox checked={notifyMinor} onCheckedChange={(value: boolean | 'indeterminate') => onNotifyMinorChange(value === true)} />
                  Notify students about this change
                </label>
              ) : (
                <span className="min-w-0 truncate text-xs [color:var(--ds-color-text-secondary)] sm:text-sm">
                  {rules.needsAudience && count > 0 ? `${count} students will be notified` : ''}
                </span>
              )}

              <span className="flex shrink-0 justify-end gap-2">
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
                {handsOn ? (
                  <Button type="button" onClick={goToStepTwo}>
                    Next
                  </Button>
                ) : (
                  <Button type="submit">{saveLabel}</Button>
                )}
              </span>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default CalendarEntryDialog
