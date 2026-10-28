import { useCallback, useEffect, useState } from 'react'
import { messageOf } from '@/lib/toast'
import { fetchEvents, openCalendarStream } from '../services/api'
import { onWindowFocus } from '../services/live'
import type { TpoEvent } from '../types/tpo'

/**
 * The calendar's data, fetched by the app. The calendar component only draws
 * what it is given; this hook is where the API, the live stream and the
 * refetch-on-focus live.
 */
export const useCalendarEvents = () => {
  const [events, setEvents] = useState<TpoEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      setEvents(await fetchEvents())
      setLoadError(null)
    } catch (error) {
      setLoadError(messageOf(error))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
    return openCalendarStream(refresh)
  }, [refresh])

  useEffect(() => onWindowFocus(refresh), [refresh])

  const retry = () => {
    setIsLoading(true)
    refresh()
  }

  return { events, isLoading, loadError, refresh, retry }
}
