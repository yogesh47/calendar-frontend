import { format } from 'date-fns'
import type { ReactNode } from 'react'
import EventDetailPanel from '../../../EventDetailPanel'
import CancelDialog from '../../../CancelDialog'
import ConfirmDialog from '../../../ConfirmDialog'
import type { CancelReason, TpoEvent } from '../../../../types/tpo'

interface CalendarDialogsProps {
  isTpo: boolean
  /** The event whose detail panel is open, and the one it points at. */
  opened: TpoEvent | null
  linked: TpoEvent | null
  cancelling: TpoEvent | null
  deleting: TpoEvent | null
  purging: TpoEvent | null
  wiping: boolean
  totalCount: number
  onOpenJobs: () => void
  onOpenEvent: (eventId: string | null) => void
  /** The host's footer buttons for the opened event, given the panel's own. */
  renderActions?: (event: TpoEvent, defaults: ReactNode) => ReactNode
  onEdit: (event: TpoEvent) => void
  onRemindMe: (event: TpoEvent) => void
  onMoveReminder: (reminder: TpoEvent) => void
  onAskCancel: (event: TpoEvent | null) => void
  onAskDelete: (event: TpoEvent | null) => void
  onAskPurge: (event: TpoEvent | null) => void
  onAskWipe: (open: boolean) => void
  onConfirmCancel: (reason: CancelReason, note: string, scope: 'one' | 'series') => void
  onConfirmDelete: () => void
  onConfirmPurge: () => void
  onConfirmWipe: () => void
}

/**
 * Everything the calendar opens on top of itself: one event's details, and the
 * four confirmations that can follow from it. None of them hold state of their
 * own — the calendar says which is open and what to do when it is answered.
 */
const CalendarDialogs = ({
  isTpo,
  opened,
  linked,
  cancelling,
  deleting,
  purging,
  wiping,
  totalCount,
  onOpenJobs,
  onOpenEvent,
  renderActions,
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
}: CalendarDialogsProps) => (
  <>
    <EventDetailPanel
      event={opened}
      linkedEvent={linked}
      onUpdateReminderDate={opened && linked ? () => onMoveReminder(opened) : undefined}
      onOpenJob={() => {
        onOpenEvent(null)
        onOpenJobs()
      }}
      onOpenJobForDeadline={
        !isTpo && opened?.draft.eventType === 'deadline'
          ? () => {
              onOpenEvent(null)
              onOpenJobs()
            }
          : undefined
      }
      onOpenLinked={() => {
        const draft = opened?.draft
        if (!draft?.linkedId) return
        if (draft.linkedType === 'job_deadline') {
          onOpenEvent(null)
          onOpenJobs()
          return
        }
        onOpenEvent(draft.linkedId)
      }}
      onClose={() => onOpenEvent(null)}
      renderActions={opened && renderActions ? (defaults) => renderActions(opened, defaults) : undefined}
      onEdit={() => opened && onEdit(opened)}
      onCancel={() => onAskCancel(opened)}
      onDelete={() => onAskDelete(opened)}
      onDeleteForever={() => onAskPurge(opened)}
      onRemindMe={
        !isTpo &&
        opened &&
        opened.draft.eventType !== 'my_reminder' &&
        opened.draft.eventType !== 'nudge' &&
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
      notifyCount={cancelling?.notifiedCount ?? 0}
      isRecurring={Boolean(cancelling?.seriesId)}
      onBack={() => onAskCancel(null)}
      onEditDate={() => {
        const event = cancelling as TpoEvent
        onAskCancel(null)
        onEdit(event)
      }}
      onConfirm={onConfirmCancel}
    />

    <ConfirmDialog
      open={Boolean(deleting)}
      title="Delete this reminder?"
      confirmLabel="Delete"
      onBack={() => onAskDelete(null)}
      onConfirm={onConfirmDelete}
    />

    <ConfirmDialog
      open={wiping}
      title={`Delete all ${totalCount} events and reminders permanently?`}
      confirmLabel="Delete all"
      onBack={() => onAskWipe(false)}
      onConfirm={onConfirmWipe}
    />

    <ConfirmDialog
      open={Boolean(purging)}
      title="Delete this cancelled event permanently?"
      confirmLabel="Delete permanently"
      onBack={() => onAskPurge(null)}
      onConfirm={onConfirmPurge}
    />
  </>
)

export default CalendarDialogs
