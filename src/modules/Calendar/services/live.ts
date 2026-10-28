// Refetch when the user comes back to the tab — the calendar itself never fetches.
export const onWindowFocus = (listener: () => void): (() => void) => {
  const handler = () => {
    if (document.visibilityState === 'visible') listener()
  }

  window.addEventListener('focus', handler)
  document.addEventListener('visibilitychange', handler)

  return () => {
    window.removeEventListener('focus', handler)
    document.removeEventListener('visibilitychange', handler)
  }
}
