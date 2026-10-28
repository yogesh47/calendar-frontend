const OPEN_EVENT = 'calendar:open-event'

// A request made while no calendar is on screen (from a bell on another page)
// waits here, and the next calendar to mount opens it.
let pending: string | null = null

export const requestOpenEvent = (eventId: string): void => {
  pending = eventId
  window.dispatchEvent(new CustomEvent(OPEN_EVENT, { detail: eventId }))
}

/** The request no calendar has taken yet, if any — taking it clears it. */
export const takePendingOpen = (): string | null => {
  const eventId = pending
  pending = null
  return eventId
}

export const onOpenEventRequest = (listener: (eventId: string) => void): (() => void) => {
  const handler = (event: Event) => {
    pending = null
    listener((event as CustomEvent<string>).detail)
  }
  window.addEventListener(OPEN_EVENT, handler)
  return () => window.removeEventListener(OPEN_EVENT, handler)
}
