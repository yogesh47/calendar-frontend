export type Role = 'tpo' | 'student' | 'super_admin'

export interface AuthUser {
  user_id: string
  org_id: string
  name: string
  email: string
  role: Role
  /** Where the user is, as their browser last said. */
  time_zone?: string | null
  /** Their college's campus time. */
  org_time_zone?: string
}

export interface LoginResponse {
  access_token: string
  token_type: string
  expires_in: number
  user: AuthUser
}

export interface Session {
  token: string
  user: AuthUser
}
