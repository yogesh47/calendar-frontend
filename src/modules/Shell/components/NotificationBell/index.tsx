import { useEffect, useState } from 'react'
import { format, isSameDay, isToday, isYesterday } from 'date-fns'
import { Bell, CalendarDays, CalendarX2, CheckCheck } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover'
import { cn } from '@/lib/utils'
import { onWindowFocus, requestOpenEvent } from '@/modules/Calendar/services/store'
import {
  fetchNotifications,
  openCalendarStream,
  readAllNotifications,
  readNotification,
} from '@/modules/Calendar/services/api'
import type { ApiNotification } from '@/modules/Calendar/services/api'

const TITLE = 'Notifications'

const EMPTY_TITLE = 'No notifications yet'

const EMPTY_DESCRIPTION = 'Campus events you are invited to will show up here.'

const relativeTime = (value: string): string => {
  const moment = new Date(value)
  const minutes = Math.floor((Date.now() - moment.getTime()) / 60000)

  return minutes < 1 ? 'Just now' : format(moment, 'h:mm a')
}

const headingFor = (value: string): string => {
  const moment = new Date(value)
  if (isToday(moment)) return 'Today'
  if (isYesterday(moment)) return 'Yesterday'

  return format(moment, 'MMM d, yyyy')
}

const groupByDay = (notifications: ApiNotification[]): { heading: string; rows: ApiNotification[] }[] => {
  const groups: { heading: string; rows: ApiNotification[] }[] = []

  notifications.forEach((entry) => {
    const last = groups[groups.length - 1]
    if (last && isSameDay(new Date(last.rows[0].created_at), new Date(entry.created_at))) {
      last.rows.push(entry)
      return
    }
    groups.push({ heading: headingFor(entry.created_at), rows: [entry] })
  })

  return groups
}

const NotificationBell = () => {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<ApiNotification[]>([])

  const refresh = async () => setNotifications(await fetchNotifications())

  useEffect(() => {
    refresh()
    return openCalendarStream(refresh)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => onWindowFocus(refresh), [])

  const unread = notifications.filter((entry) => !entry.is_read).length

  const openEvent = async (notification: ApiNotification) => {
    await readNotification(notification.notification_id)
    await refresh()
    requestOpenEvent(notification.event_id)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={unread ? `${TITLE}, ${unread} unread` : TITLE}
          className="relative grid size-9 cursor-pointer place-items-center rounded-lg [color:var(--ds-color-text-secondary)] hover:[background-color:var(--ds-color-bg-muted)]"
        >
          <Bell className="size-5" />
          {unread > 0 && (
            <span className="absolute right-1 top-1 grid min-w-4 place-items-center rounded-full px-1 text-[0.625rem] font-bold [background-color:var(--ds-color-danger)] [color:var(--ds-color-danger-fg)]">
              {unread}
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent
        hideWhenDetached
        collisionPadding={8}
        align="end"
        className="w-[24rem] overflow-hidden p-0 [background-color:var(--ds-color-bg-surface)]"
      >
        <div className="flex shrink-0 flex-col gap-[0.875rem] border-b px-[1.25rem] pb-[0.875rem] pt-[1.125rem]">
          <h2 className="text-[1.125rem] font-semibold leading-[1.625rem] [color:var(--color-gray-800)]">
            {TITLE}
          </h2>

          {notifications.length > 0 && (
            <div className="flex items-center justify-between gap-[0.75rem]">
              <span className="text-[0.8125rem] [color:var(--color-gray-600)]">
                {unread ? `${unread} unread` : 'All caught up'}
              </span>

              {unread > 0 && (
                <Button
                  variant="link"
                  onClick={() => readAllNotifications().then(refresh)}
                  className="h-auto gap-[0.375rem] p-0 text-[0.8125rem] font-semibold [color:var(--ds-color-brand)]"
                >
                  <CheckCheck className="size-4" strokeWidth={2} />
                  Mark all as read
                </Button>
              )}
            </div>
          )}
        </div>

        <div className="flex max-h-[24rem] min-h-0 w-full flex-1 flex-col overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center gap-[0.625rem] px-[1.5rem] py-[2rem] text-center">
              <span className="grid size-12 place-items-center rounded-full [background-color:var(--ds-color-brand-subtle)]">
                <Bell className="size-6 [color:var(--ds-color-brand)]" strokeWidth={1.8} />
              </span>
              <p className="text-[0.9375rem] font-semibold [color:var(--color-gray-800)]">{EMPTY_TITLE}</p>
              <p className="text-[0.8125rem] [color:var(--color-gray-600)]">{EMPTY_DESCRIPTION}</p>
            </div>
          ) : (
            groupByDay(notifications).map((group) => (
              <div key={group.heading}>
                <p className="w-full px-[1.25rem] py-[0.5rem] text-[0.75rem] font-medium uppercase tracking-[0.025rem] [background-color:var(--color-gray-100)] [color:var(--color-gray-600)]">
                  {group.heading}
                </p>

                {group.rows.map((notification) => {
                  const isCancelled = /cancelled|ignore the earlier/i.test(notification.message)

                  return (
                    <button
                      key={notification.notification_id}
                      type="button"
                      onClick={() => openEvent(notification)}
                      className={cn(
                        'flex w-full cursor-pointer items-start gap-[0.75rem] border-b px-[1.25rem] py-[0.75rem] text-left',
                        'hover:[background-color:var(--color-gray-50)]',
                        !notification.is_read && '[background-color:var(--color-blue-50)]',
                      )}
                    >
                      <span
                        aria-hidden
                        className="mt-[0.125rem] grid size-[2.25rem] shrink-0 place-items-center rounded-full"
                        style={{
                          backgroundColor: isCancelled ? 'var(--color-red-50)' : 'var(--color-blue-50)',
                        }}
                      >
                        {isCancelled ? (
                          <CalendarX2
                            className="size-[1.125rem]"
                            strokeWidth={1.8}
                            style={{ color: 'var(--color-red-600)' }}
                          />
                        ) : (
                          <CalendarDays
                            className="size-[1.125rem]"
                            strokeWidth={1.8}
                            style={{ color: 'var(--color-blue-600)' }}
                          />
                        )}
                      </span>

                      <span className="flex min-w-0 flex-1 flex-col gap-[0.125rem]">
                        <span
                          className={cn(
                            'whitespace-normal text-[0.875rem] font-normal leading-[1.25rem]',
                            notification.is_read
                              ? '[color:var(--color-gray-700)]'
                              : '[color:var(--color-gray-800)]',
                          )}
                        >
                          {notification.message}
                        </span>
                        <span className="mt-[0.125rem] text-[0.75rem] font-medium [color:var(--color-gray-500)]">
                          {relativeTime(notification.created_at)}
                        </span>
                      </span>
                    </button>
                  )
                })}
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

export default NotificationBell
