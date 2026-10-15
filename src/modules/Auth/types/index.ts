export type Role = 'tpo' | 'student'

export interface AuthUser {
  user_id: string
  org_id: string
  name: string
  email: string
  role: Role
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
