import type { CalendarLabelsInput } from '@/calendar'

/*
  Every word the calendar shows, in this app's wording — one group per part of
  the screen, so each dialog can say things its own way. The calendar has its
  own defaults; change a word here and it changes only in that place.
*/
export const CALENDAR_LABELS: CalendarLabelsInput = {
  // The bar above the grid. The create button reads "New Event" for whoever may publish events, "Add Reminder" otherwise.
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
  // The date picker's shortcut.
  dayJump: {
    today: 'Today',
  },
  state: {
    retry: 'Retry',
  },
}

/*
  The words of this portal's own modals (create / edit, the event view, cancel,
  delete, sync). The modals are the app's, so their words are too — the
  calendar only words its own grid, toolbar and states (above).
*/
export const MODAL_LABELS = {
  // Create / edit an event or a reminder.
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
  // The panel that opens on an event.
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
  // Cancelling an event.
  cancelDialog: {
    confirmCancelEvent: 'Yes, Cancel Event',
    editDateInstead: 'Edit date instead',
    goBack: 'Go Back',
  },
  // "Are you sure?" before deleting.
  confirmDialog: {
    delete: 'Delete',
    deleteAll: 'Delete all',
    deletePermanently: 'Delete permanently',
    deleteRepeatsToo: 'This and later',
    goBack: 'Go Back',
  },
  // Sync with Google Calendar / Outlook.
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
  // Loading failed.
} as const
