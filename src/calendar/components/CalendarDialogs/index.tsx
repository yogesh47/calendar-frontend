import { format } from 'date-fns'
import type { ReactNode } from 'react'
import EventDetailPanel from './components/EventDetailPanel'
import CancelDialog from './components/CancelDialog'
import ConfirmDialog from './components/ConfirmDialog'
import { useLabels } from '../../labels'
import { NUDGE_TYPE, REMINDER_TYPE } from '../../types'
import type { CalendarEvent, CalendarEventType } from '../../types'
import type { CancelReasonOption } from './components/CancelDialog'

interface CalendarDialogsProps {
  /** Creates events, so does not get "Remind me" on someone else's. */
  canCreateEvents: boolean
  /** May keep reminders of their own — offers "Remind me" on others' events. */
  canRemind: boolean
  eventTypes: CalendarEventType[]
  cancelReasons: CancelReasonOption[]
  audienceNoun: string
  renderDetails?: (event: CalendarEvent) => ReactNode
  /** The event whose detail panel is open, and the one it points at. */
  opened: CalendarEvent | null
  linked: CalendarEvent | null
  cancelling: CalendarEvent | null
  deleting: CalendarEvent | null
  purging: CalendarEvent | null
  wiping: boolean
  totalCount: number
  onOpenEvent: (eventId: string | null) => void
  /** The host's footer buttons for the opened event, given the panel's own. */
  renderActions?: (event: CalendarEvent, defaults: ReactNode) => ReactNode
  resolveImageUrl: (path: string) => string
  onEdit: (event: CalendarEvent) => void
  onRemindMe: (event: CalendarEvent) => void
  onMoveReminder: (reminder: CalendarEvent) => void
  onAskCancel: (event: CalendarEvent | null) => void
  onAskDelete: (event: CalendarEvent | null) => void
  onAskPurge: (event: CalendarEvent | null) => void
  onAskWipe: (open: boolean) => void
  onConfirmCancel: (reason: string, note: string, scope: 'one' | 'series') => void
  onConfirmDelete: (scope: 'one' | 'series') => void
  onConfirmPurge: () => void
  onConfirmWipe: () => void
}

/**
 * Everything the calendar opens on top of itself: one event's details, and the
 * four confirmations that can follow from it. None of them hold state of their
 * own — the calendar says which is open and what to do when it is answered.
 */
const CalendarDialogs = ({
  canCreateEvents,
  canRemind,
  eventTypes,
  cancelReasons,
  audienceNoun,
  renderDetails,
  opened,
  linked,
  cancelling,
  deleting,
  purging,
  wiping,
  totalCount,
  onOpenEvent,
  renderActions,
  resolveImageUrl,
  onEdit,
  onRemindMe,
  onMoveReminder,
  onAskCancel,
  onAskDelete,
  onAskPurge,
  onAskWipe,
  onConfirmCancel,
  onConfirmDelete,
  onConfirmPurge,
  onConfirmWipe,
}: CalendarDialogsProps) => {
  const labels = useLabels()

  return (
  <>
    <EventDetailPanel
      event={opened}
      eventTypes={eventTypes}
      renderDetails={renderDetails}
      linkedEvent={linked}
      onUpdateReminderDate={opened && linked ? () => onMoveReminder(opened) : undefined}
      onOpenLinked={() => {
        const draft = opened?.draft
        if (draft?.linkedId) onOpenEvent(draft.linkedId)
      }}
      onClose={() => onOpenEvent(null)}
      resolveImageUrl={resolveImageUrl}
      renderActions={opened && renderActions ? (defaults) => renderActions(opened, defaults) : undefined}
      onEdit={() => opened && onEdit(opened)}
      onCancel={() => onAskCancel(opened)}
      onDelete={() => onAskDelete(opened)}
      onDeleteForever={() => onAskPurge(opened)}
      onRemindMe={
        canRemind &&
        !canCreateEvents &&
        opened &&
        opened.draft.eventType !== REMINDER_TYPE &&
        opened.draft.eventType !== NUDGE_TYPE &&
        opened.appliesToMe &&
        !opened.cancelledAt
          ? () => onRemindMe(opened)
          : undefined
      }
    />

    <CancelDialog
      open={Boolean(cancelling)}
      title={cancelling?.draft.title ?? ''}
      dateLabel={
        cancelling?.draft.eventDate
          ? format(new Date(`${cancelling.draft.eventDate}T00:00:00`), 'd MMM')
          : ''
      }
      notifyCount={cancelling?.reach ?? 0}
      reasons={cancelReasons}
      audienceNoun={audienceNoun}
      isRecurring={Boolean(cancelling?.seriesId)}
      onBack={() => onAskCancel(null)}
      onEditDate={() => {
        const event = cancelling as CalendarEvent
        onAskCancel(null)
        onEdit(event)
      }}
      onConfirm={onConfirmCancel}
    />

    <ConfirmDialog
      open={Boolean(deleting)}
      title={deleting?.seriesId ? 'Delete this repeating reminder?' : 'Delete this reminder?'}
      confirmLabel={labels.delete}
      onBack={() => onAskDelete(null)}
      onConfirm={() => onConfirmDelete('one')}
      alternateLabel={deleting?.seriesId ? labels.deleteRepeatsToo : undefined}
      onAlternate={() => onConfirmDelete('series')}
    />

    <ConfirmDialog
      open={wiping}
      title={`Delete all ${totalCount} events and reminders permanently?`}
      confirmLabel={labels.deleteAll}
      onBack={() => onAskWipe(false)}
      onConfirm={onConfirmWipe}
    />

    <ConfirmDialog
      open={Boolean(purging)}
      title="Delete this cancelled event permanently?"
      confirmLabel={labels.deletePermanently}
      onBack={() => onAskPurge(null)}
      onConfirm={onConfirmPurge}
    />
  </>
  )
}

export default CalendarDialogs
