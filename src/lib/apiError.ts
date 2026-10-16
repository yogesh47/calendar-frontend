export type FieldError = { field: string; message: string }

export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly field?: string
  readonly errors: FieldError[]

  constructor(status: number, body: { detail?: string; code?: string; field?: string; errors?: FieldError[] }) {
    super(body.detail || 'Something went wrong. Please try again.')
    this.name = 'ApiError'
    this.status = status
    this.code = body.code || 'error'
    this.field = body.field
    this.errors = body.errors ?? []
  }

  get isAuth(): boolean {
    return this.status === 401
  }

  get isForbidden(): boolean {
    return this.status === 403
  }

  get isMissing(): boolean {
    return this.status === 404
  }

  get isOffline(): boolean {
    return this.status === 0 || this.status === 503
  }
}

export const OFFLINE_MESSAGE = "Can't reach the server. Check your connection and try again."
