import { useEffect } from 'react'
import { format } from 'date-fns'
import { AlignLeft, Bell, CalendarPlus, Clock, Repeat, StickyNote, Trash2, Type, Wand2 } from 'lucide-react'
import { useFormik, validateYupSchema, yupToFormErrors } from 'formik'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import TiptapEditor from '@/components/custom/TiptapEditor'
import { DatePicker } from '@/components/custom/DatePicker'
import TimeSelect from '@/modules/Calendar/components/TimeSelect'
import { addDaysTo, dayShift, plusHour } from '@/modules/Calendar/components/TimeSelect'
import { Checkbox } from '@/components/ui/Checkbox'
import { Combobox } from '@/components/ui/MultiSelect'
import { Dialog, DialogContent } from '@/components/ui/Dialog'
import { ModalBody, ModalFooter, ModalHeader, modalContentClass } from '@/modules/Calendar/components/Modal'
import { DayPreview } from '@/calendar'
import { LIMITS } from '@/calendar'
import { overlaps } from '@/calendar'
import { isTimed } from '@/calendar'
import { eventSchema, recurrenceError } from '@/modules/Calendar/services/eventSchema'
import RepeatField from '@/modules/Calendar/components/RepeatField'
import ClashWarning from '../ClashWarning'
import { useLabels } from '../../constants/words'
import { FieldError, Row } from '@/modules/Calendar/components/parts'
import { REMIND_BEFORE_OPTIONS } from './CalendarEntryDialog.constants'
import type { DayEntry } from '@/calendar'
import { REMINDER_TYPE } from '@/calendar'
import type { CalendarEventType, EventDraft } from '@/calendar'

interface CalendarEntryDialogProps {
  open: boolean
  notifyMinor?: boolean
  onNotifyMinorChange?: (value: boolean) => void
  /** People the event already reached — told about an edit. */
  notifyCount?: number
  /** "people", "attendees" — who `notifyCount` counts. */
  audienceNoun: string
  /** The app's event types; the calendar adds "My Reminder" itself. */
  eventTypes: CalendarEventType[]
  /** "Fill Data": the app's sample values for a demo. Leave out to hide the button. */
  fillSample?: (draft: EventDraft) => Partial<EventDraft>
  initial: EventDraft
  isEdit: boolean
  reminderOnly?: boolean
  canCancelEvent?: boolean
  canDeleteReminder?: boolean
  dayEntries: DayEntry[]
  onClose: () => void
  /** Given what the form holds now, so Go Back can return to it as it was. */
  onCancelEvent?: (draft: EventDraft) => void
  onDeleteReminder?: (draft: EventDraft) => void
  onSave: (draft: EventDraft) => void
  /** The app's next step for an event (its own dialog), on create and on edit. Without it, the event is saved here. */
  onNext?: (draft: EventDraft) => void
  /** May the date be in the past? Off, the form asks for today or later. */
  allowPastDates?: boolean
}

const CalendarEntryDialog = ({
  open,
  notifyMinor = false,
  onNotifyMinorChange,
  notifyCount = 0,
  initial,
  isEdit,
  reminderOnly,
  allowPastDates = false,
  audienceNoun,
  eventTypes,
  fillSample,
  canCancelEvent,
  canDeleteReminder,
  dayEntries,
  onClose,
  onCancelEvent,
  onDeleteReminder,
  onSave,
  onNext,
}: CalendarEntryDialogProps) => {
  const labels = useLabels()

  const form = useFormik<EventDraft>({
    initialValues: initial,
    enableReinitialize: true,
    validateOnChange: true,
    validateOnBlur: true,
    validate: (values) => {
      try {
        validateYupSchema(values, eventSchema, true, {
          isTimed: (eventType: string) => isTimed(eventTypes, eventType),
          ownReminder: reminderOnly,
          allowPastDates,
        })
      } catch (error) {
        return yupToFormErrors(error)
      }

      // Who it reaches is picked on the next step, or later from the event, so
      // an event with none of its extra fields yet is still valid here.
      const repeat = recurrenceError(values)

      return repeat ? { recurrence: repeat } : {}
    },
    onSubmit: (values) => onSave(values),
  })

  const draft = form.values
  const timed = isTimed(eventTypes, draft.eventType)
  const isReminder = draft.eventType === REMINDER_TYPE
  /*
  /*
    This dialog is always the generic one — a title, a date, an optional time, a
    reminder lead and a note. Someone without events saves it as a reminder; an organiser hands
    it on with `onNext`, and everything an event needs beyond this is asked for
    outside, where the calendar does not reach.
  */
  /*
    Organiser ka item agle modal tak jaata hai — wahi kism (event type, ya
    "My Reminder") dikhti hai aur event ki baaki fields bhi. Naya item har baar
    "Next" se aage jaata hai; event ka edit bhi, taaki company, venue, linked
    job wagairah badle ja sakein. Reminder ka edit, aur sirf-reminder wala
    calendar, ek hi modal me rehte hain — unki koi aur field hai hi nahi.
  */
  const handsOn = !reminderOnly && Boolean(onNext) && !(isEdit && isReminder)
  const count = isEdit && !isReminder ? notifyCount : 0
  // The day panel on the right stays for everyone — reminder and
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

  // A time an hour out, then whatever sample the app gives for the rest.
  const fillDummy = () => {
    const start = new Date(Date.now() + 61 * 60000)
    // Late at night the end lands on the next day, and its date has to say so.
    const end = new Date(start.getTime() + 90 * 60000)
    const clock = (moment: Date) =>
      `${String(moment.getHours()).padStart(2, '0')}:${String(moment.getMinutes()).padStart(2, '0')}`

    form.setValues({
      ...draft,
      eventDate: format(start, 'yyyy-MM-dd'),
      endDate: format(timed ? end : start, 'yyyy-MM-dd'),
      startTime: clock(start),
      endTime: timed ? clock(end) : draft.endTime,
      remindBefore: '1_hour',
      ...fillSample?.(draft),
    })
  }

  const clashes = timed
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

  const saveLabel = isEdit ? labels.entryDialog.saveChanges : isReminder ? labels.entryDialog.saveReminder : labels.entryDialog.publishEvent

  /*
    Only the fields the first step actually draws are checked before moving on.
    An event's start and end times are required, but they are asked for on the
    second step — validating them here would block the user at a field that
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
          // With the day preview beside the form the modal is wider than the frame's widths.
          className={modalContentClass('md', showPreview ? 'w-[min(68rem,96vw)]' : undefined)}
          onInteractOutside={(event) => event.preventDefault()}
        >
          <form onSubmit={form.handleSubmit} noValidate className="contents">
            <ModalHeader
              icon={<CalendarPlus />}
              title={
                reminderOnly
                  ? isEdit
                    ? labels.entryDialog.editReminderTitle
                    : labels.entryDialog.addReminderTitle
                  : isEdit
                    ? labels.entryDialog.editEventTitle
                    : labels.entryDialog.createEventTitle
              }
              srDescription="Event details"
              actions={
                !isEdit &&
                fillSample && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    title={labels.entryDialog.fillData}
                    aria-label="Fill Data"
                    className="px-2 sm:px-3"
                    onClick={fillDummy}
                  >
                    <Wand2 className="size-3.5" />
                    <span className="hidden sm:inline">{labels.entryDialog.fillData}</span>
                  </Button>
                )
              }
            />

            {/* The form and the day preview scroll on their own, so the body itself does not. */}
            <ModalBody className={cn('grid gap-3 space-y-0 overflow-hidden', showPreview && 'lg:grid-cols-[1fr_24rem]')}>
              <div className="min-h-0 min-w-0 overflow-y-auto rounded-xl border [background-color:var(--ds-color-bg-surface)]">
                {/* The title is the event's name, so it leads — large and unboxed, as in a calendar app. */}
                <div role="group" aria-label="Title" className="grid grid-cols-[1.25rem_minmax(0,1fr)] items-start gap-3 px-4 pb-3 pt-4">
                  <Type aria-hidden className="mt-2 size-4 [color:var(--ds-color-text-secondary)]" />
                  <div className="min-w-0">
                  <input
                    name="title"
                    aria-label="Title"
                    autoComplete="off"
                    placeholder={isReminder ? 'Add a reminder title' : 'Add title'}
                    maxLength={LIMITS.titleLength}
                    value={draft.title}
                    onChange={form.handleChange}
                    onBlur={form.handleBlur}
                    className={cn(
                      'w-full border-0 border-b-2 bg-transparent pb-1.5 text-xl font-semibold outline-none transition-colors',
                      'placeholder:font-normal placeholder:[color:var(--ds-color-text-tertiary)]',
                      '[border-color:var(--ds-color-border-default)] focus:[border-color:var(--ds-color-brand)]',
                      errorFor('title')
                        ? '[border-color:var(--ds-color-danger)]'
                        : 'hover:[border-color:var(--ds-color-border-focus)]',
                    )}
                  />
                  {/* The counter only matters near the limit; before that it is noise. */}
                  {(errorFor('title') || draft.title.length > LIMITS.titleLength - 20) && (
                    <div className="mt-1 flex items-start justify-between gap-2 text-xs [&>p]:!mt-0">
                      <FieldError message={errorFor('title')} />
                      <span className="ml-auto shrink-0 [color:var(--ds-color-text-tertiary)]">
                        {draft.title.length}/{LIMITS.titleLength}
                      </span>
                    </div>
                  )}
                  </div>
                </div>

                {/* No rule between rows — the icons and the spacing already separate them. */}
                <div className="pb-2">
                  {/*
                    The date and both times read as one sentence — "Wed 28 Oct,
                    12:00 PM – 1:00 PM" — because they are one fact.
                  */}
                  <Row icon={Clock} label="Date and time">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="w-full sm:w-44">
                        <DatePicker
                          id="eventDate"
                          className="w-full"
                          aria-label={isReminder ? 'Date' : 'Start date'}
                          showMonthPicker
                          showYearPicker
                          yearRange={{ from: new Date().getFullYear() - 1, to: new Date().getFullYear() + 5 }}
                          value={draft.eventDate}
                          hasError={Boolean(errorFor('eventDate'))}
                          onChange={setStartDate}
                        />
                      </div>

                      <div className="min-w-0 flex-1 sm:w-36 sm:flex-none">
                        <TimeSelect
                          value={draft.startTime}
                          onChange={(value) => {
                            form.setFieldValue('startTime', value)
                            if (!timed) return
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

                      {timed && (
                        <>
                          <span aria-hidden className="[color:var(--ds-color-text-secondary)]">–</span>
                          <div className="min-w-0 flex-1 sm:w-36 sm:flex-none">
                            <TimeSelect
                              value={draft.endTime}
                              after={draft.startTime}
                              onChange={(value) => set('endTime', value)}
                            />
                          </div>
                        </>
                      )}
                    </div>
                    {isReminder && !draft.startTime && (
                      <p className="text-xs [color:var(--ds-color-text-tertiary)]">No time — it stays all day.</p>
                    )}
                    <FieldError message={errorFor('eventDate') ?? errorFor('startTime') ?? errorFor('endTime')} />
                  </Row>
                  {/* Events and reminders both repeat; an existing occurrence is edited on its own. */}
                  {!isEdit && (
                    <Row icon={Repeat} label="Repeat">
                      <RepeatField
                        eventDate={draft.eventDate}
                        value={draft.recurrence}
                        error={errorFor('recurrence')}
                        onChange={(value) => {
                          form.setFieldTouched('recurrence', true, false)
                          form.setFieldValue('recurrence', value)
                        }}
                      />
                    </Row>
                  )}

                  <Row icon={Bell} label="Remind me">
                    <div className="sm:w-44">
                      <Combobox
                        searchable={false}
                        value={draft.remindBefore}
                        valueLabel={draft.remindBefore === 'none' ? 'No reminder' : undefined}
                        placeholder="No reminder"
                        options={REMIND_BEFORE_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
                        onChange={(value) => set('remindBefore', value)}
                      />
                    </div>
                  </Row>

                  {clashes.length > 0 && (
                    // Same gutter as the rows above, so the warning lines up with the fields, not the icons.
                    <div className="grid grid-cols-[1.25rem_minmax(0,1fr)] gap-3 px-4 py-2">
                      <span aria-hidden />
                      <ClashWarning clashes={clashes} />
                    </div>
                  )}

                  {/*
                    A reminder keeps a private note; an event has details that the
                    people read. They were both shown as "Note" here, and an
                    event's note was never saved — the backend has nowhere for it.
                  */}
                  {isReminder ? (
                    <Row icon={StickyNote} label="Note">
                      <TiptapEditor
                        placeholder="Add a note"
                        value={draft.note}
                        maxLength={LIMITS.reminderNoteLength}
                        error={errorFor('note')}
                        onChange={(html) => form.setFieldValue('note', html)}
                      />
                    </Row>
                  ) : (
                    <Row icon={AlignLeft} label="Description">
                      <TiptapEditor
                        placeholder="Add a description"
                        value={draft.description}
                        maxLength={LIMITS.descriptionLength}
                        error={errorFor('description')}
                        onChange={(html) => form.setFieldValue('description', html)}
                      />
                    </Row>
                  )}
                </div>
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
            </ModalBody>

            <ModalFooter
              start={
                isEdit && !isReminder && onNotifyMinorChange ? (
                  <label className="flex min-w-0 cursor-pointer items-center gap-2">
                    <Checkbox checked={notifyMinor} onCheckedChange={(value: boolean | 'indeterminate') => onNotifyMinorChange(value === true)} />
                    Notify {audienceNoun} about this change
                  </label>
                ) : count > 0 ? (
                  `${count} ${audienceNoun} will be notified`
                ) : undefined
              }
            >
                {isEdit && canCancelEvent && !isReminder && (
                  <Button type="button" variant="outline" onClick={() => onCancelEvent?.(draft)}>
                    {labels.entryDialog.cancelEvent}
                  </Button>
                )}

                {isEdit && canDeleteReminder && isReminder && (
                  <Button type="button" variant="outline" onClick={() => onDeleteReminder?.(draft)}>
                    <Trash2 className="size-4" />
                    {labels.entryDialog.delete}
                  </Button>
                )}
                <Button type="button" variant="outline" onClick={close}>
                  {isEdit ? labels.entryDialog.close : labels.entryDialog.cancel}
                </Button>
                {handsOn ? (
                  <Button type="button" onClick={goToStepTwo}>
                    {labels.entryDialog.next}
                  </Button>
                ) : (
                  <Button type="submit">{saveLabel}</Button>
                )}
            </ModalFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default CalendarEntryDialog
