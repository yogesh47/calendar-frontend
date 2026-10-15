import { Navigate, Route, Routes } from 'react-router-dom'
import AppShell from '@/modules/Shell/components/AppShell'
import LoginPage from '@/modules/Auth/pages/LoginPage'
import JobListPage from '@/modules/Jobs/pages/JobListPage'
import RequireAuth from '@/modules/Auth/components/RequireAuth'
import CalendarPage from '@/modules/Calendar/pages/CalendarPage'
import DashboardPage from '@/modules/Dashboard/pages/DashboardPage'
import ExternalJobsPage from '@/modules/Jobs/pages/ExternalJobsPage'
import { useSession } from '@/modules/Auth/hooks'
import { HOME_BY_ROLE, LOGIN_ROUTE } from '@/modules/Auth/constants'
import type { ReactNode } from 'react'
import type { Role } from '@/modules/Auth/types'

const App = () => {
  const { session, isChecking, signIn, signOut } = useSession()

  const landing = session ? HOME_BY_ROLE[session.user.role] : LOGIN_ROUTE

  const guarded = (role: Role, page: ReactNode) => (
    <RequireAuth session={session} isChecking={isChecking} role={role}>
      {session && (
        <AppShell role={role} user={session.user} onSignOut={signOut}>
          {page}
        </AppShell>
      )}
    </RequireAuth>
  )

  const pagesFor = (role: Role) => [
    { path: `/${role}/dashboard`, element: <DashboardPage role={role} userName={session?.user.name ?? ''} /> },
    { path: `/${role}/jobs`, element: <JobListPage /> },
    { path: `/${role}/calendar`, element: <CalendarPage role={role} /> },
    { path: `/${role}/external-jobs`, element: <ExternalJobsPage /> },
  ]

  return (
    <Routes>
      <Route path={LOGIN_ROUTE} element={<LoginPage session={session} onSignedIn={signIn} />} />
      <Route path="/" element={<Navigate to={landing} replace />} />

      {(['tpo', 'student'] as Role[]).flatMap((role) =>
        pagesFor(role).map((page) => (
          <Route key={page.path} path={page.path} element={guarded(role, page.element)} />
        )),
      )}

      <Route path="*" element={<Navigate to={landing} replace />} />
    </Routes>
  )
}

export default App
