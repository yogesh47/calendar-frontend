import { useMemo } from 'react'
import { DEFAULT_ICONS, IconsContext } from './icons'
import { LabelsContext, mergeLabels } from './labels'
import type { ReactNode } from 'react'
import type { CalendarIcons } from './icons'
import type { CalendarLabels, CalendarLabelsInput } from './labels'

export interface CalendarProviderProps {
  /** The app's own icons, by name; the rest stay the defaults. */
  icons?: Partial<CalendarIcons>
  /** The app's own words; the rest stay the defaults. */
  labels?: CalendarLabelsInput
  children: ReactNode
}

/**
 * The icons and words every calendar piece draws with. <Calendar /> sets it up
 * itself; wrap pieces used on their own — a MiniCalendar, a MonthGrid — in it
 * only to give them the app's icons or words. Without it they use the defaults.
 */
const CalendarProvider = ({ icons, labels, children }: CalendarProviderProps) => {
  const iconSet = useMemo<CalendarIcons>(() => ({ ...DEFAULT_ICONS, ...icons }), [icons])
  const words = useMemo<CalendarLabels>(() => mergeLabels(labels), [labels])

  return (
    <IconsContext.Provider value={iconSet}>
      <LabelsContext.Provider value={words}>{children}</LabelsContext.Provider>
    </IconsContext.Provider>
  )
}

export default CalendarProvider
