import { format } from 'date-fns'
import { Info } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog'
import { audienceLine, labelFor, rulesFor } from '../../helpers/tpo'
import { CANCEL_REASON_LABEL, SIGNED_IN_TPO } from '../../constants/tpo'
import type { TpoEvent } from '../../types/tpo'

interface EventDetailPanelProps {
  event: TpoEvent | null
  onClose: () => void
  onEdit: () => void
  onCancel: () => void
  onDelete: () => void
}

const Line = ({ label, value }: { label: string; value?: string }) => {
  if (!value) return null

  return (
    <div className="flex gap-2 text-sm">
      <span className="w-20 shrink-0 [color:var(--ds-color-text-secondary)]">{label}</span>
      <span className="flex-1 font-medium">{value}</span>
    </div>
  )
}

const EventDetailPanel = ({ event, onClose, onEdit, onCancel, onDelete }: EventDetailPanelProps) => {
  if (!event) return null

  const { draft } = event
  const rules = rulesFor(draft.eventType)
  const isMine = event.createdBy === SIGNED_IN_TPO
  const isReminder = draft.eventType === 'my_reminder'
  const isCancelled = Boolean(event.cancelledAt)
  const day = draft.eventDate ? new Date(`${draft.eventDate}T00:00:00`) : null
  const isPast = Boolean(day && day.getTime() < new Date().setHours(0, 0, 0, 0))

  const timeLine = rules.needsTime
    ? `${draft.startTime} – ${draft.endTime}`
    : draft.startTime
      ? draft.startTime
      : 'All day'

  const venueLine =
    draft.mode === 'online'
      ? `Online · ${draft.onlinePlatform}`
      : draft.mode === 'offline'
        ? `Offline · ${draft.venue}`
        : undefined

  const footer = isCancelled ? null : isReminder ? (
    <>
      <Button variant="outline" onClick={onDelete}>
        Delete
      </Button>
      <Button onClick={onEdit}>Edit</Button>
    </>
  ) : isMine ? (
    <>
      <Button variant="outline" onClick={onCancel}>
        Cancel Event
      </Button>
      {!isPast && <Button onClick={onEdit}>Edit Event</Button>}
    </>
  ) : null

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50" aria-hidden />
    <Dialog open modal={false} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-h-[90vh] w-[min(34rem,94vw)] max-w-none gap-0 p-0 [background-color:var(--ds-color-bg-surface)]">
        <DialogHeader className="px-4 pb-3 pt-4">
          <DialogTitle>
            {labelFor(draft.eventType)}
            {isCancelled ? ' · CANCELLED' : ''}
          </DialogTitle>
          <DialogDescription>{draft.company || 'Event details'}</DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] space-y-3 overflow-y-auto px-4 pb-4">
        <h3 className={cn('text-lg font-semibold', isCancelled && '[color:var(--ds-color-text-tertiary)] line-through')}>
          {draft.title}
        </h3>

        <div className="space-y-1.5">
          <Line label="Date" value={day ? format(day, 'EEE, d MMM yyyy') : undefined} />
          <Line label="Time" value={isReminder && !draft.startTime ? 'All day' : timeLine} />
          <Line label="Venue" value={venueLine} />
          <Line label="Company" value={draft.company || undefined} />
          {rules.needsAudience && <Line label="Audience" value={audienceLine(draft)} />}
          {rules.needsAudience && (
            <Line
              label="Students"
              value={isCancelled ? `${event.notifiedCount} were notified` : `${event.notifiedCount} notified`}
            />
          )}
          {isReminder && <Line label="Note" value={draft.note || undefined} />}
        </div>

        {draft.linkedJob && (
          <div className="rounded-md border p-3">
            <p className="text-xs font-semibold uppercase [color:var(--ds-color-text-secondary)]">Linked job</p>
            <p className="text-sm font-medium">
              {draft.linkedJob.kind === 'campus' ? draft.linkedJob.campusJob : draft.linkedJob.title}
            </p>
            {draft.linkedJob.kind === 'external' && (
              <a
                href={draft.linkedJob.url}
                target="_blank"
                rel="noreferrer"
                className="text-sm underline [color:var(--ds-color-text-link)]"
              >
                {draft.linkedJob.url}
              </a>
            )}
          </div>
        )}

        {isCancelled ? (
          <div className="space-y-1.5 rounded-md border p-3">
            <Line
              label="Cancelled"
              value={`by ${isMine ? 'you' : event.createdByName} · ${format(new Date(event.cancelledAt as string), 'd MMM')}`}
            />
            <Line
              label="Reason"
              value={event.cancelReason ? `${CANCEL_REASON_LABEL[event.cancelReason]}${event.cancelNote ? ` — ${event.cancelNote}` : ''}` : undefined}
            />
          </div>
        ) : (
          <div className="text-sm [color:var(--ds-color-text-secondary)]">
            <p>
              Created by {isMine ? 'you' : `${event.createdByName} (TPO)`} ·{' '}
              {format(new Date(event.createdAt), 'd MMM, h:mm a')}
            </p>
            {event.updatedAt && <p>Last updated {format(new Date(event.updatedAt), 'd MMM, h:mm a')}</p>}
          </div>
        )}

        {draft.description && <p className="text-sm">{draft.description}</p>}

        {!isMine && !isReminder && !isCancelled && (
          <p className="flex gap-2 rounded-md border px-3 py-2 text-sm [background-color:var(--ds-color-bg-subtle)] [color:var(--ds-color-text-secondary)]">
            <Info className="mt-0.5 size-3.5 shrink-0" />
            <span>View only. Only {event.createdByName} can edit or cancel this event.</span>
          </p>
        )}
        </div>

        {footer && <DialogFooter className="px-4 py-3">{footer}</DialogFooter>}
      </DialogContent>
    </Dialog>
    </>
  )
}

export default EventDetailPanel
