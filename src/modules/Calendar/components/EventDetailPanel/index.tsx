import { format } from 'date-fns'
import {
  AlignLeft,
  BellPlus,
  BellRing,
  CalendarDays,
  Clock,
  ExternalLink,
  Link2,
  MapPin,
  StickyNote,
  Trash2,
  Users,
} from 'lucide-react'
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
import { hasText, safeHtml } from '../../helpers/richText'
import { CALENDAR_ITEM_STYLE, CANCELLED_STYLE } from '../../constants'
import { CANCEL_REASON_LABEL, SIGNED_IN_TPO } from '../../constants/tpo'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import type { TpoEvent } from '../../types/tpo'

interface EventDetailPanelProps {
  event: TpoEvent | null
  onOpenJob: () => void
  onClose: () => void
  onEdit: () => void
  onCancel: () => void
  onDelete: () => void
  onDeleteForever: () => void
  onRemindMe?: () => void
}

const RICH_TEXT =
  '[&_strong]:font-semibold [&_em]:italic [&_u]:underline [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-5 [&_ol]:pl-5 [&_p]:mb-1 [&_p:last-child]:mb-0'

const Row = ({ icon: Icon, label, children }: { icon: LucideIcon; label: string; children?: ReactNode }) => {
  if (!children) return null

  return (
    <div className="flex gap-3 text-sm">
      <span className="flex w-[6.75rem] shrink-0 items-center gap-2 self-start text-[0.8125rem] font-semibold leading-[1.25rem] [color:var(--ds-color-text-secondary)]">
        <Icon className="size-4 shrink-0" />
        {label}
      </span>
      <div className="min-w-0 flex-1 leading-[1.25rem] [word-break:break-word]">{children}</div>
    </div>
  )
}

const EventDetailPanel = ({
  event,
  onOpenJob,
  onClose,
  onEdit,
  onCancel,
  onDelete,
  onDeleteForever,
  onRemindMe,
}: EventDetailPanelProps) => {
  if (!event) return null

  const { draft } = event
  const rules = rulesFor(draft.eventType)
  const isMine = event.createdBy === SIGNED_IN_TPO
  const isReminder = draft.eventType === 'my_reminder'
  const isCancelled = Boolean(event.cancelledAt)
  const day = draft.eventDate ? new Date(`${draft.eventDate}T00:00:00`) : null
  const lastDay = draft.endDate && draft.endDate !== draft.eventDate ? new Date(`${draft.endDate}T00:00:00`) : null
  const isPast = Boolean(day && day.getTime() < new Date().setHours(0, 0, 0, 0))

  const clock = (value: string): string => format(new Date(`2000-01-01T${value}:00`), 'h:mm a')

  const timeLine = rules.needsTime
    ? `${clock(draft.startTime)} – ${clock(draft.endTime)}`
    : draft.startTime
      ? clock(draft.startTime)
      : 'All day'

  const isLink = (value: string): boolean => value.startsWith('http://') || value.startsWith('https://')

  const venueLine =
    draft.mode === 'online'
      ? isLink(draft.onlinePlatform)
        ? 'Online'
        : `Online · ${draft.onlinePlatform}`
      : draft.mode === 'offline'
        ? `Offline · ${draft.venue}`
        : undefined

  const kind = isReminder ? 'reminder' : draft.eventType === 'deadline' ? 'deadline' : 'event'
  const chip = isCancelled ? CANCELLED_STYLE : CALENDAR_ITEM_STYLE[kind]

  const dateLine = day
    ? lastDay
      ? `${format(day, 'EEE, MMM d, yyyy')} → ${format(lastDay, 'EEE, MMM d, yyyy')}`
      : format(day, 'EEE, MMM d, yyyy')
    : undefined

  const subtitle = [labelFor(draft.eventType), draft.company].filter(Boolean).join(' · ')

  const footer = isCancelled ? (
    isMine ? (
      <Button variant="outline" onClick={onDeleteForever}>
        <Trash2 className="size-4" />
        Delete permanently
      </Button>
    ) : null
  ) : isReminder ? (
    <>
      <Button variant="outline" onClick={onDelete}>
        <Trash2 className="size-4" />
        Delete
      </Button>
      <Button onClick={onEdit}>Edit</Button>
    </>
  ) : onRemindMe ? (
    <Button variant="outline" onClick={onRemindMe}>
      <BellPlus className="size-4" />
      Remind me
    </Button>
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
          <DialogHeader className="space-y-1 border-b px-5 pb-4 pr-12 pt-5">
            <div className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className="size-[0.625rem] shrink-0 rounded-sm"
                style={{ backgroundColor: chip.accent }}
              />
              <DialogDescription className="text-[0.8125rem]">{subtitle}</DialogDescription>
            </div>

            <DialogTitle
              className={cn(
                'text-[1.125rem] leading-[1.625rem]',
                isCancelled && 'line-through [color:var(--ds-color-text-tertiary)]',
              )}
            >
              {draft.title}
            </DialogTitle>
          </DialogHeader>

          <div className="max-h-[60vh] space-y-2.5 overflow-y-auto px-5 py-4">
            {isCancelled && (
              <p className="mb-3.5 rounded-md px-3 py-2 text-sm [background-color:var(--ds-color-danger-subtle)] [color:var(--ds-color-danger-text)]">
                Cancelled by {isMine ? 'you' : event.createdByName} ·{' '}
                {format(new Date(event.cancelledAt as string), 'd MMM, h:mm a')}
                {event.cancelReason ? ` · ${CANCEL_REASON_LABEL[event.cancelReason]}` : ''}
                {event.cancelNote ? ` — ${event.cancelNote}` : ''}
              </p>
            )}

            <Row icon={CalendarDays} label="Date">{dateLine}</Row>
            <Row icon={Clock} label="Time">{isReminder && !draft.startTime ? 'All day' : timeLine}</Row>
            <Row icon={MapPin} label="Venue">
              {venueLine && (
                <span className="flex flex-wrap items-center gap-2">
                  {venueLine}
                  {draft.mode === 'online' && isLink(draft.onlinePlatform) && (
                    <Button asChild variant="link" className="h-auto gap-1 p-0 text-sm">
                      <a href={draft.onlinePlatform} target="_blank" rel="noreferrer">
                        Open link
                        <ExternalLink className="size-3.5" />
                      </a>
                    </Button>
                  )}
                </span>
              )}
            </Row>
            {rules.needsAudience && <Row icon={Users} label="Audience">{audienceLine(draft)}</Row>}
            {rules.needsAudience && (
              <Row icon={BellRing} label="Notified">{`${event.notifiedCount} students`}</Row>
            )}

            {isReminder && draft.note && hasText(draft.note) && (
              <Row icon={StickyNote} label="Note">
                <div className={cn(RICH_TEXT)} dangerouslySetInnerHTML={{ __html: safeHtml(draft.note) }} />
              </Row>
            )}

            {draft.description && hasText(draft.description) && (
              <Row icon={AlignLeft} label="Details">
                <div className={cn(RICH_TEXT)} dangerouslySetInnerHTML={{ __html: safeHtml(draft.description) }} />
              </Row>
            )}

            {draft.linkedJob && (
              <Row icon={Link2} label="Linked job">
                {draft.linkedJob.kind === 'campus' ? (
                  <Button
                    variant="link"
                    className="h-auto justify-start p-0 text-left text-sm font-normal"
                    onClick={onOpenJob}
                  >
                    {draft.linkedJob.campusJob}
                  </Button>
                ) : (
                  <span className="flex flex-wrap items-center gap-2">
                    {draft.linkedJob.title}
                    <Button asChild variant="link" className="h-auto gap-1 p-0 text-sm">
                      <a href={draft.linkedJob.url} target="_blank" rel="noreferrer">
                        Open job
                        <ExternalLink className="size-3.5" />
                      </a>
                    </Button>
                  </span>
                )}
              </Row>
            )}

            <div className="pt-1.5 text-[0.75rem] [color:var(--ds-color-text-secondary)]">
              <p>
                Created by {isMine ? 'you' : `${event.createdByName} (TPO)`} ·{' '}
                {format(new Date(event.createdAt), 'd MMM, h:mm a')}
                {event.updatedAt ? ` · updated ${format(new Date(event.updatedAt), 'd MMM, h:mm a')}` : ''}
              </p>
              {!isMine && !isReminder && !isCancelled && (
                <p>View only. Only {event.createdByName} can edit or cancel this event.</p>
              )}
            </div>
          </div>

          {footer && <DialogFooter className="border-t px-5 py-3">{footer}</DialogFooter>}
        </DialogContent>
      </Dialog>
    </>
  )
}

export default EventDetailPanel
