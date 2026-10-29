import { createContext, useContext } from 'react'

/*
  The calendar's own words, one group per part of the screen — the toolbar and
  each dialog have their own, so a word can differ between two dialogs. An app
  passes any of them through <Calendar labels={{ syncDialog: { title: '…' } }} />
  — its own wording, or another language — and the rest keep these defaults.
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
  entryDialog: {
    createEventTitle: 'Create New Event',
    editEventTitle: 'Edit Event',
    addReminderTitle: 'Add Reminder',
    editReminderTitle: 'Edit Reminder',
    myReminder: 'My Reminder',
    fillData: 'Fill Data',
    next: 'Next',
    cancel: 'Cancel',
    close: 'Close',
    publishEvent: 'Publish Event',
    saveReminder: 'Save Reminder',
    saveChanges: 'Save Changes',
    cancelEvent: 'Cancel Event',
    delete: 'Delete',
  },
  eventPanel: {
    edit: 'Edit',
    editEvent: 'Edit Event',
    cancelEvent: 'Cancel Event',
    delete: 'Delete',
    deletePermanently: 'Delete permanently',
    remindMe: 'Remind me',
    goToEvent: 'Go to the event',
    openLink: 'Open link',
    updateReminder: 'Update reminder',
  },
  cancelDialog: {
    confirmCancelEvent: 'Yes, Cancel Event',
    editDateInstead: 'Edit date instead',
    goBack: 'Go Back',
  },
  confirmDialog: {
    delete: 'Delete',
    deleteAll: 'Delete all',
    deletePermanently: 'Delete permanently',
    deleteRepeatsToo: 'This and later',
    goBack: 'Go Back',
  },
  syncDialog: {
    title: 'Sync with your calendar',
    addTo: 'Add to your calendar app',
    what: 'What to sync',
    events: 'Events',
    deadlines: 'Deadlines',
    reminders: 'My reminders',
    cancelled: 'Cancelled events',
    range: 'How far back and ahead',
    from: 'From',
    to: 'To',
    ago: 'ago',
    fromNow: 'from now',
    today: 'Today',
    copyLink: 'Copy your calendar link',
    copy: 'Copy',
    copied: 'Copied',
    addButton: 'Add to',
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
