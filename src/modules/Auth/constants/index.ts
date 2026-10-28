export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8001'

export const SESSION_KEY = 'campus-calendar-session'

export const LOGIN_ROUTE = '/login'

export const HOME_BY_ROLE = {
  tpo: '/tpo/calendar',
  student: '/student/calendar',
  super_admin: '/super-admin/settings',
} as const

