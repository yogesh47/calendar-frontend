import type { CalendarLabels } from '@/calendar'

/*
  Every word the calendar shows on a button or a title, in this app's wording.
  The calendar has its own defaults; change a word here and it changes
  everywhere the calendar uses it.
*/
export const CALENDAR_LABELS: Partial<CalendarLabels> = {
  // Create button — "New Event" for whoever may publish events, "Add Reminder" for everyone else
  newEvent: 'New Event',
  addReminder: 'Add Reminder',
  myReminder: 'My Reminder',
  // Dialog titles
  createEventTitle: 'Create New Event',
  editEventTitle: 'Edit Event',
  addReminderTitle: 'Add Reminder',
  editReminderTitle: 'Edit Reminder',
  // Toolbar
  today: 'Today',
  sync: 'Sync',
  deleteAll: 'Delete all',
  viewDay: 'Day',
  viewWeek: 'Week',
  viewMonth: 'Month',
  viewList: 'List',
  // Create / edit dialog
  fillData: 'Fill Data',
  next: 'Next',
  cancel: 'Cancel',
  close: 'Close',
  publishEvent: 'Publish Event',
  saveReminder: 'Save Reminder',
  saveChanges: 'Save Changes',
  // Event panel
  edit: 'Edit',
  editEvent: 'Edit Event',
  cancelEvent: 'Cancel Event',
  delete: 'Delete',
  deletePermanently: 'Delete permanently',
  deleteRepeatsToo: 'This and later',
  remindMe: 'Remind me',
  goToEvent: 'Go to the event',
  openLink: 'Open link',
  updateReminder: 'Update reminder',
  // Confirmations and states
  confirmCancelEvent: 'Yes, Cancel Event',
  editDateInstead: 'Edit date instead',
  goBack: 'Go Back',
  done: 'Done',
  retry: 'Retry',
}
