export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8001'

export const SESSION_KEY = 'campus-calendar-session'

export const LOGIN_ROUTE = '/login'

export const HOME_BY_ROLE = {
  tpo: '/tpo/calendar',
  student: '/student/calendar',
  super_admin: '/super-admin/settings',
} as const

export const LOGIN_COPY = {
  title: 'Campus Calendar',
  subtitle: 'Sign in to see your calendar',
  emailLabel: 'Email',
  emailPlaceholder: 'you@campus.test',
  passwordLabel: 'Password',
  passwordPlaceholder: 'Enter your password',
  submit: 'Sign in',
  submitting: 'Signing in…',
  genericError: 'Could not sign in. Please try again.',
} as const
