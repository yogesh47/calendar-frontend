import { createContext, useContext } from 'react'

/*
  The calendar's own words, one group per part of the screen (toolbar, day
  jump, states). An app passes any of them through
  <Calendar labels={{ toolbar: { newEvent: '…' } }} /> — its own wording, or
  another language — and the rest keep these defaults. Words of the app's own
  modals are the app's, not these.
*/
export const DEFAULT_LABELS = {
  title: 'Calendar',
  toolbar: {
    newEvent: 'New Event',
    addReminder: 'Add Reminder',
    sync: 'Sync',
    deleteAll: 'Delete all',
    viewDay: 'Day',
    viewWeek: 'Week',
    viewMonth: 'Month',
    viewList: 'List',
  },
  dayJump: {
    today: 'Today',
  },
  state: {
    retry: 'Retry',
  },
}

export type CalendarLabels = typeof DEFAULT_LABELS

type LabelGroup = Exclude<keyof CalendarLabels, 'title'>

/** What an app passes: the title, and any words of any group. */
export type CalendarLabelsInput = { title?: string } & { [G in LabelGroup]?: Partial<CalendarLabels[G]> }

const GROUPS = Object.keys(DEFAULT_LABELS).filter((key) => key !== 'title') as LabelGroup[]

/** The app's words over the defaults, group by group. */
export const mergeLabels = (labels?: CalendarLabelsInput): CalendarLabels => {
  const merged = { ...DEFAULT_LABELS, title: labels?.title ?? DEFAULT_LABELS.title } as CalendarLabels
  for (const group of GROUPS) {
    ;(merged as Record<LabelGroup, unknown>)[group] = { ...DEFAULT_LABELS[group], ...labels?.[group] }
  }

  return merged
}

export const LabelsContext = createContext<CalendarLabels>(DEFAULT_LABELS)

export const useLabels = (): CalendarLabels => useContext(LabelsContext)
