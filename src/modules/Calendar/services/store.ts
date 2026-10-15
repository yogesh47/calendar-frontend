const OPEN_EVENT = 'campus-calendar-open-event'

export const requestOpenEvent = (eventId: string): void => {
  window.dispatchEvent(new CustomEvent(OPEN_EVENT, { detail: eventId }))
}

export const onOpenEventRequest = (listener: (eventId: string) => void): (() => void) => {
  const handler = (event: Event) => listener((event as CustomEvent<string>).detail)
  window.addEventListener(OPEN_EVENT, handler)
  return () => window.removeEventListener(OPEN_EVENT, handler)
}
