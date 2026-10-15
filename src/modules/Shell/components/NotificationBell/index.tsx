import { useEffect, useState } from 'react'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover'
import { cn } from '@/lib/utils'
import { requestOpenEvent } from '@/modules/Calendar/services/store'
import {
  fetchNotifications,
  openCalendarStream,
  readAllNotifications,
  readNotification,
} from '@/modules/Calendar/services/api'
import type { ApiNotification } from '@/modules/Calendar/services/api'

const timeAgo = (value: string): string => {
  const minutes = Math.round((Date.now() - new Date(value).getTime()) / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  if (minutes < 1440) return `${Math.round(minutes / 60)}h ago`
  return `${Math.round(minutes / 1440)}d ago`
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
          aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'}
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

      <PopoverContent align="end" className="w-[22rem] p-0">
        <div className="flex items-center justify-between border-b px-4 py-2.5">
          <p className="text-sm font-semibold">Notifications</p>
          {unread > 0 && (
            <Button variant="link" className="text-sm" onClick={() => readAllNotifications().then(refresh)}>
              Mark all read
            </Button>
          )}
        </div>

        <div className="max-h-[22rem] overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm [color:var(--ds-color-text-secondary)]">
              Abhi koi notification nahi hai.
            </p>
          ) : (
            notifications.map((notification) => (
              <button
                key={notification.notification_id}
                type="button"
                onClick={() => openEvent(notification)}
                className={cn(
                  'flex w-full cursor-pointer flex-col gap-0.5 border-b px-4 py-2.5 text-left last:border-b-0 hover:[background-color:var(--ds-color-bg-muted)]',
                  !notification.is_read && '[background-color:var(--ds-color-brand-subtle)]',
                )}
              >
                <span className="text-sm">{notification.message}</span>
                <span className="text-xs [color:var(--ds-color-text-secondary)]">
                  {timeAgo(notification.created_at)}
                </span>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

export default NotificationBell
