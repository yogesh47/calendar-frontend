import { useRef, useState } from 'react'
import Calendar from '../../components/Calendar'
import PublishEventDialog from '../../components/PublishEventDialog'
import { EMPTY_DRAFT } from '../../constants/tpo'
import type { CalendarHandle } from '../../components/Calendar'
import type { DayEntry } from '../../components/DayPreview'
import type { EventDraft } from '../../types/tpo'

interface CalendarPageProps {
  title?: string
  role?: 'tpo' | 'student'
}

/**
 * The calendar route: the shared <Calendar /> and, beside it, the dialog that
 * turns a calendar entry into a published event.
 *
 * The two are deliberately apart. <Calendar /> is the same everywhere it is
 * mounted and stops at a title, a date and a note; deciding what kind of event
 * this is, who it reaches and where it happens belongs to whoever is using the
 * calendar — here, the TPO route.
 */
const CalendarPage = ({ title, role = 'student' }: CalendarPageProps) => {
  const calendar = useRef<CalendarHandle>(null)
  const [publishing, setPublishing] = useState<EventDraft | null>(null)
  const [dayEntries, setDayEntries] = useState<DayEntry[]>([])

  return (
    <>
      <Calendar ref={calendar} title={title} role={role} onNext={setPublishing} onDayEntries={setDayEntries} />

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
    </>
  )
}

export default CalendarPage
