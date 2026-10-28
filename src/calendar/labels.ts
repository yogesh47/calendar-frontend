import { createContext, useContext } from 'react'

/*
  The calendar's own words. An app passes any of them through
  <Calendar labels={{…}} /> — its own wording, or another language — and the
  rest keep these defaults.
*/
export const DEFAULT_LABELS = {
  title: 'Calendar',
  newEvent: 'New Event',
  addReminder: 'Add Reminder',
  myReminder: 'My Reminder',
  createEventTitle: 'Create New Event',
  editEventTitle: 'Edit Event',
  addReminderTitle: 'Add Reminder',
  editReminderTitle: 'Edit Reminder',
  deleteRepeatsToo: 'This and later',
  // Buttons
  today: 'Today',
  sync: 'Sync',
  deleteAll: 'Delete all',
  viewDay: 'Day',
  viewWeek: 'Week',
  viewMonth: 'Month',
  viewList: 'List',
  fillData: 'Fill Data',
  next: 'Next',
  cancel: 'Cancel',
  close: 'Close',
  done: 'Done',
  retry: 'Retry',
  goBack: 'Go Back',
  publishEvent: 'Publish Event',
  saveReminder: 'Save Reminder',
  saveChanges: 'Save Changes',
  edit: 'Edit',
  editEvent: 'Edit Event',
  cancelEvent: 'Cancel Event',
  confirmCancelEvent: 'Yes, Cancel Event',
  editDateInstead: 'Edit date instead',
  delete: 'Delete',
  deletePermanently: 'Delete permanently',
  remindMe: 'Remind me',
  goToEvent: 'Go to the event',
  openLink: 'Open link',
  updateReminder: 'Update reminder',
  syncDescription: 'See these events in Google, Outlook or Apple Calendar. Changes and cancellations follow automatically.',
}

export type CalendarLabels = typeof DEFAULT_LABELS

export const LabelsContext = createContext<CalendarLabels>(DEFAULT_LABELS)

export const useLabels = (): CalendarLabels => useContext(LabelsContext)
