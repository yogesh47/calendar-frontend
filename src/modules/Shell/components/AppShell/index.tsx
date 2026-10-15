import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { Briefcase, CalendarDays, ExternalLink, LayoutDashboard } from 'lucide-react'
import AccountMenu from '../AccountMenu'
import NotificationBell from '../NotificationBell'
import type { AuthUser } from '@/modules/Auth/types'
import { cn } from '@/lib/utils'

interface AppShellProps {
  role: 'tpo' | 'student'
  user: AuthUser
  children: ReactNode
  onSignOut?: () => void
}

const NAV_BY_ROLE = {
  tpo: [
    { to: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: 'jobs', label: 'Job Listings', icon: Briefcase },
    { to: 'calendar', label: 'Campus Calendar', icon: CalendarDays },
    { to: 'external-jobs', label: 'External Jobs', icon: ExternalLink },
  ],
  student: [
    { to: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { to: 'jobs', label: 'Jobs', icon: Briefcase },
    { to: 'calendar', label: 'Campus Calendar', icon: CalendarDays },
    { to: 'external-jobs', label: 'External Jobs', icon: ExternalLink },
  ],
} as const

const AppShell = ({ role, user, children, onSignOut }: AppShellProps) => (
  <div className="flex min-h-screen [background-color:var(--ds-color-bg-app)]">
    <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col gap-1 px-3 py-4 [background-color:var(--ds-color-brand)] [color:var(--ds-color-brand-fg)]">
      <div className="mb-4 flex items-center gap-2 px-2">
        <span className="grid size-9 place-items-center rounded-lg text-base font-extrabold [background-color:var(--ds-color-brand-fg)] [color:var(--ds-color-brand)]">
          7
        </span>
        <span className="text-base font-bold">7Seers</span>
      </div>

      {NAV_BY_ROLE[role].map((item) => (
        <NavLink
          key={item.to}
          to={`/${role}/${item.to}`}
          className={({ isActive }) =>
            cn(
              'flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              isActive ? 'bg-white/20 [color:var(--ds-color-brand-fg)]' : 'text-white/75 hover:bg-white/10',
            )
          }
        >
          <item.icon className="size-[1.125rem] shrink-0" />
          {item.label}
        </NavLink>
      ))}
    </aside>

    <div className="flex min-w-0 flex-1 flex-col">
      <header className="sticky top-0 z-30 flex h-14 items-center justify-end gap-3 border-b px-5 [background-color:var(--ds-color-bg-surface)]">
        <NotificationBell />
        <AccountMenu user={user} onSignOut={onSignOut} />
      </header>

      <main className="min-w-0 flex-1">{children}</main>
    </div>
  </div>
)

export default AppShell
