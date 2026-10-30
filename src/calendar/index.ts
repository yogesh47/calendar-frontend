/*
  The calendar package's one door. It is self-contained: nothing inside imports
  from outside this folder (npm packages only), and nothing outside uses its
  insides except what it hands out here: the <Calendar /> component, its types,
  and the helpers, constants and words it already has, so an app's own modals use
  the same rules instead of copies. Modals and operations are the app's.
*/
import './styles/calendar.css'

export { default as Calendar } from './Calendar'
export type { CalendarNotice, CalendarPermissions, CalendarProps } from './Calendar'

// The data the calendar draws, and the words and icons an app may give it.
export type {
  CalendarEvent,
  CalendarEventType,
  CalendarItem,
  CalendarItemKind,
  CalendarSyncSettings,
  CalendarView,
  EventDraft,
  ItemStatus,
  Recurrence,
  RemindBefore,
  RepeatFrequency,
} from './types'
export type { DayEntry } from './Calendar.types'
export type { CalendarLabels, CalendarLabelsInput } from './labels'
export type { CalendarIconName, CalendarIcons, IconComponent, IconProps } from './icons'

// What the calendar already has, for the app's own modals and pages to share.
export { CALENDAR_ITEM_STYLE, CANCELLED_STYLE, LIMITS } from './constants'
export { DEADLINE_TYPE, NUDGE_TYPE, REMINDER_TYPE } from './types'
export { isRecentlyUpdated, isTimed, itemFromEvent, kindOf, styleOf, typeFor } from './helpers'
export { itemsOn } from './helpers/dates'
export { overlaps } from './helpers/conflicts'
export { EMPTY_DRAFT, newDraftOn, newReminderOn } from './helpers/drafts'
export { DEFAULT_LABELS, mergeLabels } from './labels'
export { default as DayJump } from './components/DayJump'

// The calendar's own views, each usable on its own (a dashboard's month, a
// mini calendar in a sidebar…). Wrap them in <CalendarProvider> to give them
// the app's words and icons. Props only — they call no API and open no modal.
export { default as CalendarProvider } from './CalendarProvider'
export type { CalendarProviderProps } from './CalendarProvider'
export { DEFAULT_ICONS } from './icons'
export { default as MonthGrid } from './components/MonthGrid'
export type { MonthGridProps } from './components/MonthGrid'
export { default as DaysGrid } from './components/DaysGrid'
export type { DaysGridProps } from './components/DaysGrid'
export { default as ListView } from './components/ListView'
export type { ListViewProps } from './components/ListView'
export { default as WeekStrip } from './components/WeekStrip'
export type { WeekStripProps } from './components/WeekStrip'
export { default as MiniCalendar } from './components/MiniCalendar'
export type { MiniCalendarProps } from './components/MiniCalendar'
export type { DayJumpProps } from './components/DayJump'
/** One day's timeline beside a form: other items, the new one's block (drag / resize), clashes. */
export { default as DayPreview } from './components/DayPreview'
export type { DayPreviewProps } from './components/DayPreview'
export { default as ItemTile } from './components/ItemTile'
export type { ItemTileProps } from './components/ItemTile'
export { default as Legend } from './components/CalendarSidebar/components/Legend'
export type { LegendProps } from './components/CalendarSidebar/components/Legend'
export { CalendarError, CalendarSkeleton } from './components/CalendarState'
