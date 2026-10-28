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
  Repeat,
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
import { isRecentlyUpdated } from '../../helpers'
import { audienceLine, itemFromEvent, labelFor, rulesFor } from '../../helpers/tpo'
import { hasText, safeHtml } from '../../helpers/richText'
import { imageSrc } from '../../services/api'
import { REPEAT_OPTIONS } from '../../constants/tpo'
import {
  ASSESSMENT_EMAIL_NOTE,
  CALENDAR_ITEM_STYLE,
  CANCELLED_STYLE,
  LINKED_EVENT_CANCELLED,
  LINKED_EVENT_MOVED,
} from '../../constants'
import { CANCEL_REASON_LABEL, SIGNED_IN_TPO } from '../../constants/tpo'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import type { TpoEvent } from '../../types/tpo'

interface EventDetailPanelProps {
  event: TpoEvent | null
  onOpenJob: () => void
  onOpenLinked?: () => void
  onOpenJobForDeadline?: () => void
  linkedEvent?: TpoEvent | null
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

const Row = ({ icon: Icon, label, children }: { icon: LucideIcon; label: string; children?: ReactNode }) => {
  if (!children) return null

  return (
    <div className="flex gap-3 text-sm">
      <span className="flex w-[5.25rem] shrink-0 items-center gap-2 self-start text-[0.75rem] font-semibold leading-[1.25rem] [color:var(--ds-color-text-secondary)] sm:w-[6.75rem] sm:text-[0.8125rem]">
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
  onOpenLinked,
  onOpenJobForDeadline,
  linkedEvent,
  onUpdateReminderDate,
  onClose,
  onEdit,
  onCancel,
  onDelete,
  onDeleteForever,
  onRemindMe,
  renderActions,
}: EventDetailPanelProps) => {
  if (!event) return null

  const { draft } = event
  const rules = rulesFor(draft.eventType)
  const isMine = event.createdBy === SIGNED_IN_TPO
  const isReminder = draft.eventType === 'my_reminder'
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
    rules.needsTime && draft.startTime && draft.endTime
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

  const isNudge = draft.eventType === 'nudge'
  const isGone = !event.appliesToMe
  const kind = isNudge
    ? 'nudge'
    : isReminder
      ? 'reminder'
      : draft.eventType === 'deadline'
        ? 'deadline'
        : 'event'
  const chip = isCancelled || isGone ? CANCELLED_STYLE : CALENDAR_ITEM_STYLE[kind]
  const wasUpdated = !isCancelled && !isGone && isRecentlyUpdated(itemFromEvent(event))

  const dateLine = day
    ? lastDay
      ? `${format(day, 'EEE, MMM d, yyyy')} → ${format(lastDay, 'EEE, MMM d, yyyy')}`
      : format(day, 'EEE, MMM d, yyyy')
    : undefined

  const linkedMoved =
    isReminder && linkedEvent && !linkedEvent.cancelledAt && linkedEvent.draft.eventDate !== draft.eventDate

  const isAutoDeadline = draft.eventType === 'deadline' && draft.linkedType === 'job_deadline'

  const hasAudience = draft.audience.courses.length > 0

  const subtitle = isNudge
    ? CALENDAR_ITEM_STYLE.nudge.label
    : [labelFor(draft.eventType), draft.company].filter(Boolean).join(' · ')

  const defaults = isNudge ? (
    draft.linkedId ? (
      <Button variant="outline" onClick={onOpenLinked}>
        {draft.linkedType === 'job_deadline' ? 'View & Apply' : 'Go to the event'}
      </Button>
    ) : null
  ) : isCancelled ? (
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
  ) : onRemindMe || onOpenJobForDeadline ? (
    <>
      {onRemindMe && (
        <Button variant="outline" onClick={onRemindMe}>
          <BellPlus className="size-4" />
          Remind me
        </Button>
      )}
      {onOpenJobForDeadline && <Button onClick={onOpenJobForDeadline}>View &amp; Apply</Button>}
    </>
  ) : isMine && !hasEnded ? (
    <>
      <Button variant="outline" onClick={onCancel}>
        Cancel Event
      </Button>
      <Button onClick={onEdit}>Edit Event</Button>
    </>
  ) : null

  const footer = renderActions ? renderActions(defaults) : defaults

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50" aria-hidden />
      <Dialog open modal={false} onOpenChange={(next) => !next && onClose()}>
        <DialogContent className="max-h-[90vh] w-[min(34rem,94vw)] max-w-none gap-0 p-0 sm:p-0 [background-color:var(--ds-color-bg-surface)]">
          <DialogHeader className="space-y-1.5 border-b px-5 pb-4 pr-12 pt-5">
            <DialogTitle
              className={cn(
                'text-[1.125rem] leading-[1.625rem]',
                isCancelled && 'line-through [color:var(--ds-color-text-tertiary)]',
              )}
            >
              {draft.title}
            </DialogTitle>

            <div className="flex flex-wrap items-center gap-2">
              <span
                aria-hidden="true"
                className="size-[0.625rem] shrink-0 rounded-sm"
                style={{ backgroundColor: chip.accent }}
              />
              <DialogDescription className="text-[0.8125rem]">{subtitle}</DialogDescription>

              {isGone && !isCancelled && (
                <span
                  className="rounded-full px-[0.5rem] py-[0.0625rem] text-[0.6875rem] font-semibold"
                  style={{ backgroundColor: CANCELLED_STYLE.surface, color: CANCELLED_STYLE.accent }}
                >
                  No longer applicable
                </span>
              )}

              {isAutoDeadline && (
                <span
                  className="rounded-full px-[0.5rem] py-[0.0625rem] text-[0.6875rem] font-semibold"
                  style={{ backgroundColor: chip.surface, color: chip.accent }}
                >
                  Auto from job
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
            </div>
          </DialogHeader>

          <div className="max-h-[60vh] space-y-2.5 overflow-y-auto px-5 py-4">
            {draft.imageUrl && (
              <img
                src={imageSrc(draft.imageUrl)}
                alt=""
                className="mb-3.5 max-h-56 w-full rounded-md border object-cover"
              />
            )}

            {isMine && !isCancelled && rules.needsAudience && !isAutoDeadline && !hasAudience && (
              <p className="mb-3.5 rounded-md px-3 py-2 text-sm [background-color:var(--ds-color-warning-subtle)] [color:var(--ds-color-warning-text)]">
                Published, but no students see it yet. Choose who it reaches.
              </p>
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
                {event.cancelReason ? ` · ${CANCEL_REASON_LABEL[event.cancelReason]}` : ''}
                {event.cancelNote ? ` — ${event.cancelNote}` : ''}
              </p>
            )}

            <Row icon={CalendarDays} label="Date">{dateLine}</Row>
            <Row icon={Clock} label="Time">
              {isNudge ? clock(draft.startTime) : isReminder && !draft.startTime ? 'All day' : timeLine}
            </Row>
            <Row icon={Repeat} label="Repeats">{repeatLine(event.recurrence)}</Row>
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
            {isAutoDeadline && event.deadlineCounts && (
              <Row icon={Users} label="Students">
                {`${event.deadlineCounts.eligible} eligible · ${event.deadlineCounts.applied} applied · ${event.deadlineCounts.not_applied} not applied`}
              </Row>
            )}

            {!isNudge && !isAutoDeadline && rules.needsAudience && (
              <Row icon={Users} label="Audience">{hasAudience ? audienceLine(draft) : 'Not chosen yet'}</Row>
            )}
            {!isNudge && !isAutoDeadline && rules.needsAudience && (
              <Row icon={BellRing} label="Notified">{`${event.notifiedCount} students`}</Row>
            )}

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
                    Update reminder
                  </Button>
                )}
              </p>
            )}

            {isReminder && draft.linkedType && linkedEvent && (
              <Row icon={Link2} label="Linked item">
                {linkedEvent.draft.title}
              </Row>
            )}

            {draft.eventType === 'online_assessment' && !isMine && (
              <p className="rounded-md px-3 py-2 text-sm [background-color:var(--ds-color-info-subtle)] [color:var(--ds-color-info)]">
                {ASSESSMENT_EMAIL_NOTE}
              </p>
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
              {isNudge ? (
                <p>Sent by 7Seers · {format(new Date(event.createdAt), 'd MMM, h:mm a')}</p>
              ) : (
              <p>
                Created by {isMine ? 'you' : `${event.createdByName} (TPO)`} ·{' '}
                {format(new Date(event.createdAt), 'd MMM, h:mm a')}
                {event.updatedAt ? ` · updated ${format(new Date(event.updatedAt), 'd MMM, h:mm a')}` : ''}
              </p>
              )}
              {!isNudge && !isMine && !isReminder && !isCancelled && (
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
