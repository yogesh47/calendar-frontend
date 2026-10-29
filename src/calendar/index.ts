/*
  Everything an app uses from the calendar, in one place — the whole calendar,
  or any piece of it on its own. Every piece takes its data and actions through
  props: none calls an API, shows a toast or imports anything from outside this
  folder except npm packages.
*/
import './styles/calendar.css'

// ── The whole calendar ──────────────────────────────────────────────
export { default as Calendar } from './Calendar'
export type {
  CalendarHandle,
  CalendarNotice,
  CalendarPermissions,
  CalendarProps,
  EventActionContext,
} from './Calendar'

// ── Icons and words, for the calendar or for pieces used on their own ──
export { default as CalendarProvider } from './CalendarProvider'
export type { CalendarProviderProps } from './CalendarProvider'
export { DEFAULT_ICONS } from './icons'
export type { CalendarIconName, CalendarIcons, IconComponent, IconProps } from './icons'
export { DEFAULT_LABELS } from './labels'
export type { CalendarLabels, CalendarLabelsInput } from './labels'

// ── Pieces, each usable on its own ──────────────────────────────────
/** The small month in the sidebar. */
export { default as MiniCalendar } from './components/MiniCalendar'
export type { MiniCalendarProps } from './components/MiniCalendar'
/** A date button that opens a day / month / year picker with "Today". */
export { default as DayJump } from './components/DayJump'
export type { DayJumpProps } from './components/DayJump'
/** The month view. */
export { default as MonthGrid } from './components/MonthGrid'
export type { MonthGridProps } from './components/MonthGrid'
/** The day and week views — a time grid for the days given. */
export { default as DaysGrid } from './components/DaysGrid'
export type { DaysGridProps } from './components/DaysGrid'
/** The list view, grouped by day. */
export { default as ListView } from './components/ListView'
export type { ListViewProps } from './components/ListView'
/** A week of days to pick from (mobile day view). */
export { default as WeekStrip } from './components/WeekStrip'
export type { WeekStripProps } from './components/WeekStrip'
/** One item as the grids draw it. */
export { default as ItemTile } from './components/ItemTile'
export type { ItemTileProps } from './components/ItemTile'
/** The colour key, each kind toggleable. */
export { default as Legend } from './components/CalendarSidebar/components/Legend'
export type { LegendProps } from './components/CalendarSidebar/components/Legend'
/** One day's timeline beside a form, showing what clashes. */
export { default as DayPreview } from './components/CalendarEntryDialog/components/DayPreview'
export type { DayPreviewProps } from './components/CalendarEntryDialog/components/DayPreview'
/** Half-hour time picker. */
export { default as TimeSelect } from './components/CalendarEntryDialog/components/TimeSelect'
export type { TimeSelectProps } from './components/CalendarEntryDialog/components/TimeSelect'
/** "Does not repeat / Every week … until". */
export { default as RepeatField } from './components/CalendarEntryDialog/components/RepeatField'
export type { RepeatFieldProps } from './components/CalendarEntryDialog/components/RepeatField'
/** Loading and failed states. */
export { CalendarError, CalendarSkeleton } from './components/CalendarState'
/** One labelled row of the event panel, for an app's own rows. */
export { DetailRow } from './components/CalendarDialogs/components/EventDetailPanel'
export type { CancelReasonOption } from './components/CalendarDialogs/components/CancelDialog'

// ── Data model and helpers ──────────────────────────────────────────
export type * from './types'
export type { DayEntry } from './Calendar.types'
export { REMINDER_TYPE, DEADLINE_TYPE, NUDGE_TYPE } from './types'
export { EMPTY_DRAFT } from './helpers/drafts'
/** Turn your events into the `items` the grids draw. */
export { itemFromEvent, isTimed, styleOf, typeFor } from './helpers'
export { itemsOn } from './helpers/dates'
export { overlaps } from './helpers/conflicts'
export { CALENDAR_ITEM_STYLE, CANCELLED_STYLE } from './constants'
/** Ask an open calendar to show one event's panel — from a bell, a feed, anywhere. */
export { requestOpenEvent } from './services/store'
