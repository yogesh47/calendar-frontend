import { useRef, useState } from 'react'
import { Users } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import Calendar from '../../components/Calendar'
import AudienceDialog from '../../components/AudienceDialog'
import PublishEventDialog from '../../components/PublishEventDialog'
import { rulesFor } from '../../helpers/tpo'
import { EMPTY_DRAFT, SIGNED_IN_TPO } from '../../constants/tpo'
import type { CalendarHandle, EventActionContext } from '../../components/Calendar'
import type { DayEntry } from '../../components/DayPreview'
import type { EventDraft, TpoEvent } from '../../types/tpo'

interface CalendarPageProps {
  title?: string
  role?: 'tpo' | 'student'
}

// An event's audience can change while it is still ahead, and only by the TPO who made it.
const canChangeAudience = (event: TpoEvent): boolean => {
  const { draft } = event
  const lastDay = draft.endDate || draft.eventDate
  const endsAt = new Date(`${lastDay}T${draft.endTime || draft.startTime || '23:59'}:00`)

  return (
    event.createdBy === SIGNED_IN_TPO &&
    !event.cancelledAt &&
    rulesFor(draft.eventType).needsAudience &&
    draft.linkedType !== 'job_deadline' &&
    endsAt.getTime() > Date.now()
  )
}

/**
 * The calendar route: the shared <Calendar /> and, beside it, the dialogs that
 * belong to the TPO — publishing an event, and choosing who it reaches.
 *
 * The two are deliberately apart. <Calendar /> is the same everywhere it is
 * mounted and stops at a title, a date and a note; deciding what kind of event
 * this is, who it reaches and where it happens belongs to whoever is using the
 * calendar — here, the TPO route. Its "Audience" button reaches the detail
 * panel through `eventActions`, the same door any route uses to add its own.
 */
const CalendarPage = ({ title, role = 'student' }: CalendarPageProps) => {
  const calendar = useRef<CalendarHandle>(null)
  const [publishing, setPublishing] = useState<EventDraft | null>(null)
  const [dayEntries, setDayEntries] = useState<DayEntry[]>([])
  const [audienceFor, setAudienceFor] = useState<TpoEvent | null>(null)

  const tpoActions = (event: TpoEvent, { defaults, close }: EventActionContext) => {
    if (!canChangeAudience(event)) return defaults

    return (
      <>
        <Button
          variant="outline"
          onClick={() => {
            close()
            setAudienceFor(event)
          }}
        >
          <Users className="size-4" />
          {event.draft.audience.courses.length ? 'Audience' : 'Choose audience'}
        </Button>
        {defaults}
      </>
    )
  }

  return (
    <>
      <Calendar
        ref={calendar}
        title={title}
        role={role}
        onNext={setPublishing}
        onDayEntries={setDayEntries}
        eventActions={role === 'tpo' ? tpoActions : undefined}
      />

      <PublishEventDialog
        open={Boolean(publishing)}
        initial={publishing ?? EMPTY_DRAFT}
        isEdit={false}
        dayEntries={dayEntries}
        /* Back — ye band, aur calendar ka modal wahi draft le kar wapas. */
        onBack={() => {
          const draft = publishing
          setPublishing(null)
          if (draft) calendar.current?.openEntry(draft)
        }}
        onClose={() => {
          setPublishing(null)
          calendar.current?.closeEntry()
        }}
        onSave={(draft) => {
          setPublishing(null)
          calendar.current?.save(draft)
        }}
      />

      <AudienceDialog
        event={audienceFor}
        onClose={() => setAudienceFor(null)}
        onSaved={() => {
          setAudienceFor(null)
          calendar.current?.refresh()
        }}
      />
    </>
  )
}

export default CalendarPage
