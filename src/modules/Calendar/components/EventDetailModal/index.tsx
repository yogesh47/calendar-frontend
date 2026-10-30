import { format } from 'date-fns'
import {
  AlignLeft,
  BellPlus,
  CalendarDays,
  Clock,
  ExternalLink,
  Link2,
  MapPin,
  Repeat,
  StickyNote,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { Dialog, DialogContent } from '@/components/ui/Dialog'
import { ModalBody, ModalCard, ModalFooter, ModalHeader, modalContentClass } from '@/modules/Calendar/components/Modal'
import { isRecentlyUpdated, isTimed, itemFromEvent, kindOf, typeFor } from '@/calendar'
import { hasText } from './EventDetailPanel.helpers'
import { safeHtml } from './EventDetailPanel.helpers'
import { REPEAT_OPTIONS } from './EventDetailPanel.constants'
import { CALENDAR_ITEM_STYLE, CANCELLED_STYLE } from '@/calendar'
import { LINKED_EVENT_CANCELLED } from './EventDetailPanel.constants'
import { LINKED_EVENT_MOVED } from './EventDetailPanel.constants'
import type { ReactNode } from 'react'
import { REMINDER_TYPE } from '@/calendar'
import type { CalendarEvent, CalendarEventType } from '@/calendar'
import { useLabels } from '../../constants/words'
import { DetailRow } from '@/modules/Calendar/components/parts'

interface EventDetailPanelProps {
  event: CalendarEvent | null
  eventTypes: CalendarEventType[]
  onOpenLinked?: () => void
  linkedEvent?: CalendarEvent | null
  onUpdateReminderDate?: () => void
  onClose: () => void
  onEdit: () => void
  onCancel: () => void
  onDelete: () => void
  onDeleteForever: () => void
  onRemindMe?: () => void
  /**
   * The footer buttons. Gets the panel's own buttons as `defaults` and returns
   * what to show — the same, more, fewer or reordered. Left out, the defaults
   * are shown as they are.
   */
  renderActions?: (defaults: ReactNode) => ReactNode
  /** The app turns the stored image path into a URL. */
  resolveImageUrl: (path: string) => string
  /** The app's own rows, drawn after the calendar's. */
  renderDetails?: (event: CalendarEvent) => ReactNode
}

// "weekly;2;2026-12-31" → "Every 2 weeks until 31 Dec 2026"
const repeatLine = (rule?: string): string | undefined => {
  if (!rule) return undefined
  const [freq, interval, until] = rule.split(';')
  const unit = REPEAT_OPTIONS.find((option) => option.value === freq)?.unit ?? freq
  const every = Number(interval) > 1 ? `Every ${interval} ${unit}s` : `Every ${unit}`

  return `${every} until ${format(new Date(`${until}T00:00:00`), 'd MMM yyyy')}`
}

const RICH_TEXT =
  '[&_strong]:font-semibold [&_em]:italic [&_u]:underline [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-5 [&_ol]:pl-5 [&_p]:mb-1 [&_p:last-child]:mb-0'


const EventDetailPanel = ({
  event,
  eventTypes,
  onOpenLinked,
  linkedEvent,
  onUpdateReminderDate,
  onClose,
  onEdit,
  onCancel,
  onDelete,
  onDeleteForever,
  onRemindMe,
  renderActions,
  resolveImageUrl,
  renderDetails,
}: EventDetailPanelProps) => {
  const labels = useLabels()
  if (!event) return null

  const { draft } = event
  const timed = isTimed(eventTypes, draft.eventType)
  const isMine = event.isOwner
  const isReminder = draft.eventType === REMINDER_TYPE
  const isCancelled = Boolean(event.cancelledAt)
  const day = draft.eventDate ? new Date(`${draft.eventDate}T00:00:00`) : null
  const lastDay = draft.endDate && draft.endDate !== draft.eventDate ? new Date(`${draft.endDate}T00:00:00`) : null
  const endsAt = draft.endDate || draft.eventDate
  const lastMoment = endsAt
    ? new Date(`${endsAt}T${draft.endTime || draft.startTime || '23:59'}:00`)
    : null
  const hasEnded = Boolean(lastMoment && lastMoment.getTime() < Date.now())

  const clock = (value: string): string => (value ? format(new Date(`2000-01-01T${value}:00`), 'h:mm a') : '')

  const timeLine =
    timed && draft.startTime && draft.endTime
      ? `${clock(draft.startTime)} – ${clock(draft.endTime)}`
      : draft.startTime
        ? clock(draft.startTime)
        : 'All day'

  const isLink = (value: string): boolean => value.startsWith('http://') || value.startsWith('https://')

  const location = event.location
  const kind = kindOf(draft.eventType)
  const isNudge = kind === 'nudge'
  const isGone = !event.appliesToMe
  const chip = isCancelled || isGone ? CANCELLED_STYLE : CALENDAR_ITEM_STYLE[kind]
  const wasUpdated = !isCancelled && !isGone && isRecentlyUpdated(itemFromEvent(event, eventTypes))

  const dateLine = day
    ? lastDay
      ? `${format(day, 'EEE, MMM d, yyyy')} → ${format(lastDay, 'EEE, MMM d, yyyy')}`
      : format(day, 'EEE, MMM d, yyyy')
    : undefined

  const linkedMoved =
    isReminder && linkedEvent && !linkedEvent.cancelledAt && linkedEvent.draft.eventDate !== draft.eventDate

  const subtitle = isNudge
    ? CALENDAR_ITEM_STYLE.nudge.label
    : (typeFor(eventTypes, draft.eventType)?.label ?? CALENDAR_ITEM_STYLE[kind].label)

  const defaults = isNudge ? (
    draft.linkedId && draft.linkedType === 'event' ? (
      <Button variant="outline" onClick={onOpenLinked}>
        {labels.eventPanel.goToEvent}
      </Button>
    ) : null
  ) : isCancelled ? (
    isMine ? (
      <Button variant="outline" onClick={onDeleteForever}>
        <Trash2 className="size-4" />
        {labels.eventPanel.deletePermanently}
      </Button>
    ) : null
  ) : isReminder ? (
    <>
      <Button variant="outline" onClick={onDelete}>
        <Trash2 className="size-4" />
        {labels.eventPanel.delete}
      </Button>
      <Button onClick={onEdit}>{labels.eventPanel.edit}</Button>
    </>
  ) : onRemindMe ? (
    <Button variant="outline" onClick={onRemindMe}>
      <BellPlus className="size-4" />
      {labels.eventPanel.remindMe}
    </Button>
  ) : isMine && !hasEnded ? (
    <>
      <Button variant="outline" onClick={onCancel}>
        {labels.eventPanel.cancelEvent}
      </Button>
      <Button onClick={onEdit}>{labels.eventPanel.editEvent}</Button>
    </>
  ) : null

  const footer = renderActions ? renderActions(defaults) : defaults

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50" aria-hidden />
      <Dialog open modal={false} onOpenChange={(next) => !next && onClose()}>
        <DialogContent className={modalContentClass('md')}>
          <ModalHeader
            wrap
            icon={<CalendarDays />}
            tone={isCancelled ? 'danger' : 'brand'}
            title={<span className={cn(isCancelled && 'line-through [color:var(--ds-color-text-tertiary)]')}>{draft.title}</span>}
            description={
              <span className="flex flex-wrap items-center gap-2 text-[0.8125rem]">
                <span aria-hidden="true" className="size-[0.625rem] shrink-0 rounded-sm" style={{ backgroundColor: chip.accent }} />
                {subtitle}

                {isGone && !isCancelled && (
                  <span
                    className="rounded-full px-[0.5rem] py-[0.0625rem] text-[0.6875rem] font-semibold"
                    style={{ backgroundColor: CANCELLED_STYLE.surface, color: CANCELLED_STYLE.accent }}
                  >
                    No longer applicable
                  </span>
                )}

                {wasUpdated && (
                  <span
                    className="rounded-full px-[0.5rem] py-[0.0625rem] text-[0.6875rem] font-semibold"
                    style={{ backgroundColor: chip.surface, color: chip.accent }}
                  >
                    Updated
                  </span>
                )}
              </span>
            }
          />

          <ModalBody>
          <ModalCard className="space-y-2.5">
            {draft.imageUrl && (
              <img
                src={resolveImageUrl(draft.imageUrl)}
                alt=""
                className="mb-3.5 max-h-56 w-full rounded-md border object-cover"
              />
            )}

            {isGone && !isCancelled && (
              <p className="mb-3.5 rounded-md px-3 py-2 text-sm [background-color:var(--ds-color-bg-subtle)] [color:var(--ds-color-text-secondary)]">
                This event no longer applies to you.
                {event.removedReason ? ` ${event.removedReason}` : ''}
              </p>
            )}

            {wasUpdated && (
              <p className="mb-3.5 text-sm [color:var(--ds-color-text-secondary)]">
                Updated on {format(new Date(event.updatedAt as string), 'd MMM, h:mm a')}
                {event.changeSummary ? `: ${event.changeSummary}` : ''}
                {event.changeReason ? ` — ${event.changeReason}` : ''}
              </p>
            )}

            {isCancelled && (
              <p className="mb-3.5 rounded-md px-3 py-2 text-sm [background-color:var(--ds-color-danger-subtle)] [color:var(--ds-color-danger-text)]">
                Cancelled by {isMine ? 'you' : event.createdByName} ·{' '}
                {format(new Date(event.cancelledAt as string), 'd MMM, h:mm a')}
                {event.cancelNote ? ` · ${event.cancelNote}` : ''}
              </p>
            )}

            <DetailRow icon={CalendarDays} label="Date">{dateLine}</DetailRow>
            <DetailRow icon={Clock} label="Time">
              {isNudge ? clock(draft.startTime) : isReminder && !draft.startTime ? 'All day' : timeLine}
            </DetailRow>
            <DetailRow icon={Repeat} label="Repeats">{repeatLine(event.recurrence)}</DetailRow>
            <DetailRow icon={MapPin} label="Where">
              {location &&
                (isLink(location) ? (
                  <Button asChild variant="link" className="h-auto gap-1 p-0 text-sm">
                    <a href={location} target="_blank" rel="noreferrer">
                      {labels.eventPanel.openLink}
                      <ExternalLink className="size-3.5" />
                    </a>
                  </Button>
                ) : (
                  location
                ))}
            </DetailRow>

            {renderDetails?.(event)}

            {isReminder && linkedEvent?.cancelledAt && (
              <p className="rounded-md px-3 py-2 text-sm [background-color:var(--ds-color-bg-subtle)] [color:var(--ds-color-text-secondary)]">
                {LINKED_EVENT_CANCELLED}
              </p>
            )}

            {linkedMoved && (
              <p className="flex flex-wrap items-center gap-2 rounded-md px-3 py-2 text-sm [background-color:var(--ds-color-warning-subtle)] [color:var(--ds-color-warning-text)]">
                {LINKED_EVENT_MOVED(format(new Date(`${linkedEvent.draft.eventDate}T00:00:00`), 'EEE, MMM d, yyyy'))}
                {onUpdateReminderDate && (
                  <Button variant="link" className="h-auto p-0 text-sm font-semibold" onClick={onUpdateReminderDate}>
                    {labels.eventPanel.updateReminder}
                  </Button>
                )}
              </p>
            )}

            {isReminder && draft.linkedType && linkedEvent && (
              <DetailRow icon={Link2} label="Linked item">
                {linkedEvent.draft.title}
              </DetailRow>
            )}

            {isReminder && draft.note && hasText(draft.note) && (
              <DetailRow icon={StickyNote} label="Note">
                <div className={cn(RICH_TEXT)} dangerouslySetInnerHTML={{ __html: safeHtml(draft.note) }} />
              </DetailRow>
            )}

            {draft.description && hasText(draft.description) && (
              <DetailRow icon={AlignLeft} label="Details">
                <div className={cn(RICH_TEXT)} dangerouslySetInnerHTML={{ __html: safeHtml(draft.description) }} />
              </DetailRow>
            )}

            <div className="pt-1.5 text-[0.75rem] [color:var(--ds-color-text-secondary)]">
              {isNudge ? (
                <p>Sent automatically · {format(new Date(event.createdAt), 'd MMM, h:mm a')}</p>
              ) : (
              <p>
                Created by {isMine ? 'you' : event.createdByName} ·{' '}
                {format(new Date(event.createdAt), 'd MMM, h:mm a')}
                {event.updatedAt ? ` · updated ${format(new Date(event.updatedAt), 'd MMM, h:mm a')}` : ''}
              </p>
              )}
              {!isNudge && !isMine && !isReminder && !isCancelled && (
                <p>View only. Only {event.createdByName} can edit or cancel this event.</p>
              )}
            </div>
          </ModalCard>
          </ModalBody>

          {footer && <ModalFooter>{footer}</ModalFooter>}
        </DialogContent>
      </Dialog>
    </>
  )
}

export default EventDetailPanel
