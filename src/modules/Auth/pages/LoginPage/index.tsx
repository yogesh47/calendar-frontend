import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { HOME_BY_ROLE, LOGIN_COPY } from '../../constants'
import { login } from '../../services'
import type { Session } from '../../types'

interface LoginPageProps {
  session: Session | null
  onSignedIn: (session: Session) => void
}

const LoginPage = ({ session, onSignedIn }: LoginPageProps) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (session) return <Navigate to={HOME_BY_ROLE[session.user.role]} replace />

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      onSignedIn(await login(email, password))
    } catch (err) {
      setError(err instanceof Error ? err.message : LOGIN_COPY.genericError)
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-xl border border-[color:var(--ds-color-border-default)] bg-card p-6 shadow-sm">
        <div className="mb-6 flex flex-col gap-1 text-center">
          <h1 className="text-xl font-semibold text-foreground">{LOGIN_COPY.title}</h1>
          <p className="text-sm text-muted-foreground">{LOGIN_COPY.subtitle}</p>
        </div>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-foreground">{LOGIN_COPY.emailLabel}</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder={LOGIN_COPY.emailPlaceholder}
              autoComplete="username"
              required
              className="h-10 rounded-md border border-[color:var(--ds-color-border-default)] bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-brand/30"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-foreground">{LOGIN_COPY.passwordLabel}</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={LOGIN_COPY.passwordPlaceholder}
              autoComplete="current-password"
              required
              className="h-10 rounded-md border border-[color:var(--ds-color-border-default)] bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-brand/30"
            />
          </label>

          {error && (
            <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? LOGIN_COPY.submitting : LOGIN_COPY.submit}
          </Button>
        </form>
      </div>
    </div>
  )
}

export default LoginPage
