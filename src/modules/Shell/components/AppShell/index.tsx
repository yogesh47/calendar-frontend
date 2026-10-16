import { useCallback, useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { Briefcase, CalendarDays, ExternalLink, LayoutDashboard, PanelLeft, SlidersHorizontal } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/Tooltip'
import { TooltipProvider } from '@/components/ui/TooltipProvider'
import AccountMenu from '../AccountMenu'
import RemindersPopup from '../RemindersPopup'
import NotificationBell from '../NotificationBell'
import { cn } from '@/lib/utils'
import { fetchUnreadCount, openCalendarStream } from '@/modules/Calendar/services/api'
import { onWindowFocus } from '@/modules/Calendar/services/store'
import type { ReactNode } from 'react'
import type { AuthUser, Role } from '@/modules/Auth/types'

interface AppShellProps {
  role: Role
  user: AuthUser
  children: ReactNode
  onSignOut?: () => void
}

const SIDEBAR_KEY = 'campus-calendar-sidebar'

const NAV_BY_ROLE = {
  tpo: [
    { to: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: 'calendar', label: 'Campus Calendar', icon: CalendarDays },
    { to: 'jobs', label: 'Job Listings', icon: Briefcase },
    { to: 'external-jobs', label: 'External Jobs', icon: ExternalLink },
  ],
  student: [
    { to: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { to: 'calendar', label: 'Campus Calendar', icon: CalendarDays },
    { to: 'jobs', label: 'Jobs', icon: Briefcase },
    { to: 'external-jobs', label: 'External Jobs', icon: ExternalLink },
  ],
  super_admin: [{ to: 'settings', label: 'Calendar & Nudges', icon: SlidersHorizontal }],
} as const

const readExpanded = (): boolean => {
  try {
    return localStorage.getItem(SIDEBAR_KEY) === 'expanded'
  } catch {
    return false
  }
}

const AppShell = ({ role, user, children, onSignOut }: AppShellProps) => {
  const { pathname } = useLocation()
  const basePath = role === 'super_admin' ? 'super-admin' : role
  const [unseen, setUnseen] = useState(0)

  const readUnseen = useCallback(async () => {
    if (role === 'super_admin') return
    setUnseen(await fetchUnreadCount().catch(() => 0))
  }, [role])

  useEffect(() => {
    readUnseen()
    const closeStream = openCalendarStream(readUnseen)
    const stopFocus = onWindowFocus(readUnseen)

    return () => {
      closeStream()
      stopFocus()
    }
  }, [readUnseen])
  const [expanded, setExpanded] = useState(readExpanded)

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_KEY, expanded ? 'expanded' : 'collapsed')
    } catch {
      return
    }
  }, [expanded])

  return (
    <TooltipProvider delayDuration={120}>
      {role !== 'super_admin' && <RemindersPopup role={role} />}
      <div className="flex min-h-screen [background-color:var(--ds-color-bg-app)]">
        <aside
          className={cn(
            'sticky top-0 flex h-screen shrink-0 flex-col gap-1 px-2 py-4 transition-[width] duration-200',
            '[background-color:var(--ds-color-brand)] [color:var(--ds-color-brand-fg)]',
            expanded ? 'w-60' : 'w-[4.5rem]',
          )}
        >
          <div className={cn('mb-4 flex items-center gap-2', expanded ? 'px-2' : 'justify-center')}>
            <span className="grid size-10 shrink-0 place-items-center rounded-lg text-lg font-extrabold [background-color:var(--ds-color-brand-fg)] [color:var(--ds-color-brand)]">
              7
            </span>
            {expanded && <span className="flex-1 truncate text-base font-bold">7Seers</span>}
          </div>

          {NAV_BY_ROLE[role].map((item) => {
            const path = `/${basePath}/${item.to}`
            const isActive = pathname === path

            return (
              <Tooltip key={item.to}>
                <TooltipTrigger asChild>
                  <NavLink
                    to={path}
                    className={cn(
                      'flex cursor-pointer items-center gap-3 rounded-lg py-2 text-sm font-medium transition-colors',
                      expanded ? 'w-full px-3' : 'mx-auto size-11 justify-center px-0',
                      isActive ? 'bg-white/20 [color:var(--ds-color-brand-fg)]' : 'text-white/75 hover:bg-white/10',
                    )}
                  >
                    <span className="relative shrink-0">
                      <item.icon className={cn('shrink-0', expanded ? 'size-[1.125rem]' : 'size-6')} />
                      {item.to === 'calendar' && unseen > 0 && (
                        <span
                          aria-label={`${unseen} unseen calendar updates`}
                          className="absolute -right-0.5 -top-0.5 size-[0.5rem] rounded-full [background-color:var(--ds-color-danger)]"
                        />
                      )}
                    </span>
                    {expanded && <span className="truncate">{item.label}</span>}
                  </NavLink>
                </TooltipTrigger>
                {!expanded && <TooltipContent side="right">{item.label}</TooltipContent>}
              </Tooltip>
            )
          })}

          <div className="mt-auto">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
                  onClick={() => setExpanded(!expanded)}
                  className={cn(
                    'flex cursor-pointer items-center gap-3 rounded-lg py-2 text-sm font-medium text-white/75 transition-colors hover:bg-white/10',
                    expanded ? 'w-full px-3' : 'mx-auto size-11 justify-center px-0',
                  )}
                >
                  <PanelLeft className={cn('shrink-0', expanded ? 'size-[1.125rem]' : 'size-6')} />
                  {expanded && <span className="truncate">Collapse</span>}
                </button>
              </TooltipTrigger>
              {!expanded && <TooltipContent side="right">Expand sidebar</TooltipContent>}
            </Tooltip>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-14 items-center justify-end gap-3 border-b px-5 [background-color:var(--ds-color-bg-surface)]">
            {role !== 'super_admin' && <NotificationBell />}
            <AccountMenu user={user} onSignOut={onSignOut} />
          </header>

          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </div>
    </TooltipProvider>
  )
}

export default AppShell
