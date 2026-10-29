# Calendar — how to use it

A self-contained React calendar. Copy the `calendar/` folder into any React + Vite +
Tailwind app and it runs. It:

- **calls no API** — the app passes the data in and gets every change back through a callback;
- **shows no toast** — the app words and shows every message in its own way;
- **knows no domain** — nothing about TPOs, students, jobs or audiences; the app adds
  those through extra draft fields, slots and callbacks;
- **imports nothing from outside itself** except npm packages; inside, every import is relative;
- lets the app replace **every icon** and **every button text**.

Contents

1. [Install](#1-install)
2. [Minimal example](#2-minimal-example)
3. [Data model](#3-data-model)
4. [`<Calendar />` props](#4-calendar--props)
5. [Callbacks — when each one is called](#5-callbacks--when-each-one-is-called)
6. [Permissions and ownership](#6-permissions-and-ownership)
7. [Labels — every button text](#7-labels--every-button-text)
8. [Icons](#8-icons)
9. [Slots — adding the app's own UI](#9-slots--adding-the-apps-own-ui)
10. [A second step after "Next" (`onNext` + ref)](#10-a-second-step-after-next-onnext--ref)
11. [Opening an item from outside (bell, feed, push)](#11-opening-an-item-from-outside-bell-feed-push)
12. [Time zones](#12-time-zones)
13. [Pieces on their own](#13-pieces-on-their-own)
14. [Helpers and constants](#14-helpers-and-constants)
15. [Folder layout](#15-folder-layout)
16. [Checklist for a new repo](#16-checklist-for-a-new-repo)

---

## 1. Install

### 1.1 Copy the folder

Put it at `src/calendar` (any path works — imports inside are relative).

### 1.2 Packages

```bash
npm i date-fns formik yup lucide-react clsx tailwind-merge \
  class-variance-authority react-day-picker \
  @radix-ui/react-checkbox @radix-ui/react-dialog @radix-ui/react-label \
  @radix-ui/react-popover @radix-ui/react-radio-group @radix-ui/react-slot \
  @tiptap/react @tiptap/starter-kit @tiptap/extension-placeholder @tiptap/extension-underline
npm i -D tailwindcss@3 tailwindcss-animate postcss autoprefixer
```

`lucide-react` is only the default icon set — see [Icons](#8-icons) to use another library.

### 1.3 Tailwind

```ts
// tailwind.config.ts
import calendarPreset from './src/calendar/tailwind.preset'

export default {
  presets: [calendarPreset],
  content: ['./index.html', './src/**/*.{ts,tsx}'], // must cover src/calendar
}
```

An app already on the 47B design system (TPO Portal, Student 2.0) has the same theme;
it only needs `src/calendar` inside `content`.

### 1.4 Styles

The calendar imports `styles/calendar.css` itself. A **blank app** with no design tokens
of its own also imports the tokens once:

```ts
import './calendar/styles/tokens.css' // blank app only
```

Optional, for the same font: `npm i @fontsource/work-sans` and import its 400/500/600/700 CSS.

### 1.5 Imports

```ts
import { Calendar } from '@/calendar'          // if "@" points at src
import { Calendar } from './calendar'          // or relative
```

---

## 2. Minimal example

```tsx
import { useEffect, useState } from 'react'
import { Calendar } from '@/calendar'
import type { CalendarEvent, EventDraft } from '@/calendar'

const MyCalendarPage = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = () =>
    api.list()
      .then((list) => { setEvents(list); setError(null) })
      .catch(() => setError('Could not load the calendar.'))
      .finally(() => setIsLoading(false))

  useEffect(() => { load() }, [])

  // Every change: call the app's API, refresh, return what was saved.
  const andRefresh = async <T,>(call: Promise<T>) => { const out = await call; await load(); return out }

  return (
    <Calendar
      title="Team calendar"
      events={events}
      isLoading={isLoading}
      loadError={error}
      onRetry={load}
      permissions={{ createEvents: true }}
      eventTypes={[{ value: 'meeting', label: 'Meeting', timed: true }]}
      onCreate={(draft) => andRefresh(api.create(draft))}
      onUpdate={(id, draft, { notify }) => andRefresh(api.update(id, draft, notify))}
      onCancel={(id, reason, note, scope) => andRefresh(api.cancel(id, reason, note, scope))}
      onDelete={(id, { scope }) => andRefresh(api.remove(id, scope))}
    />
  )
}
```

That is all that is required: `events`, `onCreate`, `onUpdate`, `onCancel`, `onDelete`.
Everything else is optional.

**If a callback rejects**, the calendar keeps its dialog open with the user's input, so
they can try again. The app shows the error itself (its own toast).

---

## 3. Data model

All types are exported from `@/calendar`.

### 3.1 `EventDraft` — what the create / edit dialog fills in

| Field | Type | Meaning |
|---|---|---|
| `eventType` | `string` | One of the app's `eventTypes[].value`, or the built-ins `'my_reminder'`, `'deadline'`, `'nudge'` |
| `title` | `string` | |
| `eventDate` | `string` | `yyyy-MM-dd`, **browser-local** |
| `endDate` | `string` | `yyyy-MM-dd` — later than `eventDate` when the event runs past midnight |
| `startTime` | `string` | `HH:mm` 24 h, browser-local; `''` for all-day |
| `endTime` | `string` | `HH:mm`; `''` for all-day / reminders |
| `description` | `string` | HTML from the rich-text editor |
| `note` | `string` | A reminder's private note |
| `remindBefore` | `'none' \| 'at_time' \| '15_min' \| '1_hour' \| '1_day'` | Reminder alert |
| `linkedType` / `linkedId` | `string \| null` | What a reminder or nudge points at, e.g. `'event'` + its id |
| `recurrence` | `{ freq: 'daily'\|'weekly'\|'monthly', interval: number, until: string } \| null` | Only on create |
| `imageUrl` | `string` | Stored image path; `resolveImageUrl` turns it into a URL |
| `changeSummary?`, `changeReason?`, `notifyOnChange?` | | Filled on edit |

**Extend it with the app's own fields** — the calendar carries them along untouched:

```ts
type MyDraft = EventDraft & { room: string; teamId: string }
```

Give their starting values through `draftDefaults`.

### 3.2 `CalendarEvent<TDraft>` — one item handed to the calendar

| Field | Type | Meaning |
|---|---|---|
| `id` | `string` | Unique |
| `draft` | `TDraft` | Its values, in the draft's shape |
| `isOwner` | `boolean` | The signed-in user made it → may edit / cancel / delete |
| `createdByName` | `string` | Shown as "Created by …" |
| `createdAt` | `string` | ISO |
| `updatedAt?` | `string` | ISO; shows an "Updated" badge for a while after an edit |
| `cancelledAt?` | `string` | Set → shown struck-through as Cancelled |
| `cancelNote?` | `string` | Why, as the user should read it |
| `appliesToMe` | `boolean` | `false` → "No longer applicable" |
| `removedReason?` | `string` | Shown with "No longer applicable" |
| `changeSummary?`, `changeReason?` | `string` | Shown in the panel after an edit |
| `reach?` | `number` | "N {audienceNoun} will be notified" |
| `seriesId?` | `string` | Shared by every occurrence of a repeating item |
| `recurrence?` | `string` | As stored, e.g. `"weekly;1;2026-12-31"` — shown as "Every week until …" |
| `location?` | `string` | One line, e.g. `"Offline · Hall A"`; a URL becomes an "Open link" button |

The app maps its API response into this shape (see the TPO module's `services/api.ts`).

### 3.3 Built-in item kinds

| `eventType` | Kind | Behaviour |
|---|---|---|
| any of `eventTypes` | event | Coloured by kind; `timed: false` → all-day |
| `'my_reminder'` (`REMINDER_TYPE`) | reminder | The user's own; Edit / Delete; "Add Reminder" creates it |
| `'deadline'` (`DEADLINE_TYPE`) | deadline | All-day, read-only |
| `'nudge'` (`NUDGE_TYPE`) | nudge | An alert about another item; "Go to the event" when `linkedType === 'event'` |

### 3.4 `CalendarEventType` — the app's types

```ts
{ value: 'ppt', label: 'Pre-Placement Talk (PPT)', shortLabel: 'PPT', timed: true, info: 'Optional line of guidance' }
```

| Field | Meaning |
|---|---|
| `value` | Stored in `draft.eventType` |
| `label` | Shown in the type picker and the panel |
| `shortLabel?` | Shown on tiles when `label` is too long |
| `timed` | `true` → start + end time; `false` → all-day |
| `info?` | A hint shown when this type is picked |

The first entry is the default type of a new event.

---

## 4. `<Calendar />` props

### 4.1 Data

| Prop | Type | Required | Default | What it does |
|---|---|---|---|---|
| `events` | `CalendarEvent[]` | **yes** | — | Everything to draw: events, reminders, deadlines, nudges |
| `isLoading` | `boolean` | | `false` | First load → skeleton |
| `loadError` | `string \| null` | | `null` | Shows the message with a Retry button |
| `onRetry` | `() => void` | | — | Retry button |

### 4.2 Changes (callbacks) — details in [section 5](#5-callbacks--when-each-one-is-called)

| Prop | Type | Required |
|---|---|---|
| `onCreate` | `(draft) => Promise<CalendarEvent>` | **yes** |
| `onUpdate` | `(eventId, draft, { notify }) => Promise<CalendarEvent>` | **yes** |
| `onCancel` | `(eventId, reason, note, scope: 'one' \| 'series') => Promise<unknown>` | **yes** |
| `onDelete` | `(eventId, { scope: 'one' \| 'series' }) => Promise<unknown>` | **yes** |
| `onDeleteAll` | `() => Promise<{ count: number }>` | no — leave out to hide "Delete all" |
| `getFeedLink` | `() => Promise<string>` | no — leave out to hide "Sync" |
| `resolveImageUrl` | `(path) => string` | no — default returns `path` as it is |
| `onNotice` | `(notice: CalendarNotice) => void` | no |
| `onNext` | `(draft) => void` | no — see [section 10](#10-a-second-step-after-next-onnext--ref) |
| `onDayEntries` | `(entries: DayEntry[]) => void` | no |

### 4.3 What the user may do

| Prop | Type | Default | What it does |
|---|---|---|---|
| `permissions` | `{ createEvents?: boolean; createReminders?: boolean }` | `{}` → reminders only | See [section 6](#6-permissions-and-ownership) |
| `maxUpcomingReminders` | `number` | `50` | Cap on upcoming reminders for someone who cannot create events; hitting it sends `onNotice({ type: 'reminder-limit', limit })` |

### 4.4 The app's vocabulary

| Prop | Type | Default | What it does |
|---|---|---|---|
| `title` | `string` | `labels.title` (`"Calendar"`) | Heading; also the name of the synced calendar |
| `eventTypes` | `CalendarEventType[]` | `[]` | The app's event types. "My Reminder" is added by the calendar |
| `draftDefaults` | `Partial<EventDraft> & Record<string, unknown>` | — | The app's own draft fields, spread over every new draft |
| `cancelReasons` | `CancelReasonOption[]` | Postponed, Other | Reasons in the Cancel dialog |
| `audienceNoun` | `string` | `"people"` | "N {audienceNoun} will be notified" |
| `fillSample` | `(draft) => Partial<EventDraft>` | — | Shows a "Fill Data" button that fills sample values (demos, QA). Leave out to hide |

`CancelReasonOption`:

```ts
{ value: 'postponed', label: 'Postponed', suggestsEdit: true }  // offers "Edit date instead"
{ value: 'other', label: 'Other', needsNote: true }             // asks for a short note
```

### 4.5 Appearance

| Prop | Type | Default | What it does |
|---|---|---|---|
| `labels` | `Partial<CalendarLabels>` | English defaults | Every button text and title — [section 7](#7-labels--every-button-text) |
| `icons` | `Partial<CalendarIcons>` | lucide | Every icon — [section 8](#8-icons) |
| `views` | `('day' \| 'week' \| 'month' \| 'list')[]` | all four | Which views, in this order |
| `defaultView` | same | `'month'` (or the first of `views`) | Opening view |
| `showSidebar` | `boolean` | `true` | Mini calendar + legend on the left |
| `showCreate` | `boolean` | `true` | The create button |
| `createLabel` | `string` | `labels.newEvent` / `labels.addReminder` | Text of the create button only (shortcut for `labels`) |
| `showDeleteAll` | `boolean` | `true` | "Delete all" (also needs `onDeleteAll`) |

### 4.6 Slots

| Prop | Type | What it does |
|---|---|---|
| `toolbarExtras` | `ReactNode` | The app's controls in the toolbar, e.g. a Filter button |
| `renderEventDetails` | `(event) => ReactNode` | The app's rows in the event panel, below the calendar's own |
| `eventActions` | `(event, { defaults, close }) => ReactNode` | The panel's footer buttons — keep, drop, reorder or add to `defaults` |

### 4.7 Ref (`CalendarHandle`)

```ts
const calendar = useRef<CalendarHandle>(null)
<Calendar ref={calendar} … />
```

| Method | What it does |
|---|---|
| `save(draft)` | Saves a draft the app finished in its own dialog (calls `onCreate`) |
| `openEntry(draft)` | Re-opens the calendar's create dialog with this draft ("Back") |
| `closeEntry()` | Closes the create dialog |

---

## 5. Callbacks — when each one is called

| Callback | Called when | Arguments | Must return |
|---|---|---|---|
| `onCreate` | "Publish Event" / "Save Reminder" on a new item; also `ref.save(draft)` | the full draft (with the app's own fields), browser-local times | `Promise<CalendarEvent>` — the saved item |
| `onUpdate` | "Save Changes" on an edit; "Update reminder" when a linked event moved | `eventId`, the edited draft, `{ notify }` — the "Notify about this change" choice | `Promise<CalendarEvent>` |
| `onCancel` | "Yes, Cancel Event" in the Cancel dialog | `eventId`, `reason` (a `cancelReasons[].value`), `note` (may be `''`), `scope` — `'one'` or `'series'` (this and every later occurrence) | `Promise` |
| `onDelete` | Deleting a reminder, or "Delete permanently" on a cancelled event | `eventId`, `{ scope }` — `'series'` when "This and later" was chosen on a repeating reminder | `Promise` |
| `onDeleteAll` | "Delete all" confirmed | — | `Promise<{ count }>` |
| `getFeedLink` | The Sync dialog opens | — | `Promise<string>` — a private .ics URL |
| `onRetry` | Retry on the error state | — | — |
| `onNotice` | Something the calendar noticed (see below) | `CalendarNotice` | — |
| `onNext` | "Next" in the create dialog (events only, when given) | the draft so far | — |
| `onDayEntries` | The events on the day being created change | `DayEntry[]` — `{ id, title, eventDate, startTime, endTime }` | — |
| `resolveImageUrl` | Drawing an event's image | the stored path | the URL |
| `fillSample` | "Fill Data" | the current draft | values to merge in |

### 5.1 `onNotice` — the calendar's own messages, without words

```ts
type CalendarNotice =
  | { type: 'reminder-limit'; limit: number }   // tried to add one more reminder than allowed
  | { type: 'feed-link-copied' }                // "Copy" in the Sync dialog worked
  | { type: 'feed-link-copy-failed' }           // the clipboard refused
```

```tsx
onNotice={(notice) => {
  if (notice.type === 'reminder-limit') toast.info(`You can keep ${notice.limit} upcoming reminders.`)
  if (notice.type === 'feed-link-copied') toast.success('Link copied.')
  if (notice.type === 'feed-link-copy-failed') toast.error('Could not copy. Copy it by hand.')
}}
```

Results of the app's own callbacks (saved, failed…) are the app's to show — it knows
them first. A typical pattern:

```ts
const onCreate = async (draft) => {
  try { const saved = await api.create(draft); toast.success('Event published.'); await refresh(); return saved }
  catch (error) { toast.error(messageOf(error)); throw error } // rethrow → dialog stays open
}
```

---

## 6. Permissions and ownership

| `permissions` | Create button | Can create |
|---|---|---|
| `{ createEvents: true }` | "New Event" | events (all `eventTypes`) and reminders |
| `{}` or `{ createReminders: true }` | "Add Reminder" | reminders only |
| `{ createEvents: false, createReminders: false }` | hidden | nothing — view only |

Editing, cancelling and deleting an item follow its own `isOwner`:

| Item | `isOwner: true` | `isOwner: false` |
|---|---|---|
| Event, not ended | Edit Event, Cancel Event | Remind me (creates a linked reminder) |
| Event, cancelled | Delete permanently | — |
| Reminder | Edit, Delete | — |
| Nudge | Go to the event | Go to the event |

An app maps its roles to these, e.g. `permissions={{ createEvents: role === 'tpo' }}`.

---

## 7. Labels — every button text

Pass any subset; the rest keep their defaults.

```tsx
<Calendar labels={{ newEvent: 'Add meeting', viewWeek: 'Hafta', publishEvent: 'Publish' }} … />
```

| Key | Default | Where |
|---|---|---|
| `title` | Calendar | Heading (when `title` prop is not given) |
| `newEvent` | New Event | Create button (can create events) |
| `addReminder` | Add Reminder | Create button (reminders only) |
| `myReminder` | My Reminder | The reminder type in the type picker |
| `createEventTitle` | Create New Event | Dialog title |
| `editEventTitle` | Edit Event | Dialog title |
| `addReminderTitle` | Add Reminder | Dialog title |
| `editReminderTitle` | Edit Reminder | Dialog title |
| `today` | Today | Date picker |
| `sync` | Sync | Toolbar |
| `deleteAll` | Delete all | Toolbar, confirm button |
| `viewDay` / `viewWeek` / `viewMonth` / `viewList` | Day / Week / Month / List | View switcher |
| `fillData` | Fill Data | Create dialog |
| `next` | Next | Create dialog (with `onNext`) |
| `cancel` | Cancel | Create dialog |
| `close` | Close | Edit dialog |
| `publishEvent` | Publish Event | Create dialog |
| `saveReminder` | Save Reminder | Reminder dialog |
| `saveChanges` | Save Changes | Edit dialog |
| `edit` | Edit | Reminder panel |
| `editEvent` | Edit Event | Event panel |
| `cancelEvent` | Cancel Event | Event panel, edit dialog |
| `confirmCancelEvent` | Yes, Cancel Event | Cancel dialog |
| `editDateInstead` | Edit date instead | Cancel dialog ("Postponed") |
| `delete` | Delete | Reminder panel, edit dialog, confirm |
| `deletePermanently` | Delete permanently | Cancelled event |
| `deleteRepeatsToo` | This and later | Deleting a repeating reminder |
| `remindMe` | Remind me | Someone else's event |
| `goToEvent` | Go to the event | Nudge panel |
| `openLink` | Open link | Online location |
| `updateReminder` | Update reminder | Reminder whose event moved |
| `goBack` | Go Back | Confirm and cancel dialogs |
| `done` | Done | Sync dialog |
| `retry` | Retry | Error state |
| `syncDescription` | See these events in Google Calendar or Outlook… | Sync dialog |

`createLabel` overrides only the create button, whichever text it would show.

The TPO app keeps all of its words in `modules/Calendar/constants/labels.ts`
(`CALENDAR_LABELS`) and passes them as `labels={CALENDAR_LABELS}`.

---

## 8. Icons

Every icon is looked up by name, so an app on another icon library swaps them:

```tsx
import { FiCalendar, FiPlus } from 'react-icons/fi'

<Calendar icons={{ Calendar: FiCalendar, Plus: FiPlus }} … />
```

An icon is any React component that takes SVG props (`className`, `style`, `strokeWidth`…) — the `IconProps` type.
Names (defaults are lucide): `AlignLeft`, `Bell`, `BellPlus`, `Calendar`, `CalendarDays`,
`CalendarPlus`, `Check`, `ChevronDown`, `ChevronLeft`, `ChevronRight`, `Clock`, `Copy`,
`ExternalLink`, `Info`, `Link2`, `Lock`, `MapPin`, `Minus`, `Plus`, `RefreshCw`, `Repeat`,
`Search`, `StickyNote`, `Tag`, `Trash2`, `TriangleAlert`, `Type`, `Wand2`, `X`.
`DEFAULT_ICONS` holds the full set.

---

## 9. Slots — adding the app's own UI

### 9.1 `toolbarExtras`

```tsx
toolbarExtras={<FilterButton count={active} onClick={openFilter} />}
```

### 9.2 `renderEventDetails` — rows in the event panel

```tsx
import { DetailRow } from '@/calendar'

renderEventDetails={(event) => (
  <>
    <DetailRow icon={Users} label="Audience">{audienceLine(event.draft)}</DetailRow>
    <DetailRow icon={Building2} label="Company">{event.draft.company}</DetailRow>
  </>
)}
```

### 9.3 `eventActions` — the panel's buttons

`defaults` is the calendar's own buttons for that item (Edit, Cancel Event, Remind me…).

```tsx
eventActions={(event, { defaults, close }) => (
  <>
    <Button variant="outline" onClick={() => { close(); openAudience(event) }}>Audience</Button>
    {defaults}
  </>
)}
```

Return `defaults` alone to keep them, `null` to show none.

---

## 10. A second step after "Next" (`onNext` + ref)

For an app that needs more than the calendar's dialog asks (venue, audience, image…):

1. Pass `onNext`. The create dialog for an **event** then shows "Next" instead of "Publish Event".
2. "Next" closes the calendar's dialog and calls `onNext(draft)`.
3. The app opens its own dialog with that draft.
4. From the app's dialog:
   - **Back** → `calendar.current?.openEntry(draft)` re-opens the first step, filled in.
   - **Publish** → `calendar.current?.save(draft)` → the calendar calls `onCreate(draft)`.
   - **Close** → `calendar.current?.closeEntry()`.
5. `onDayEntries(entries)` keeps the app's dialog aware of what else is on that day,
   e.g. to draw its own `DayPreview`.

```tsx
const calendar = useRef<CalendarHandle>(null)
const [step2, setStep2] = useState<MyDraft | null>(null)

<Calendar ref={calendar} onNext={(draft) => setStep2(draft as MyDraft)} onDayEntries={setDayEntries} … />
<MyPublishDialog
  draft={step2}
  onBack={(draft) => { setStep2(null); calendar.current?.openEntry(draft) }}
  onSave={(draft) => { setStep2(null); calendar.current?.save(draft) }}
  onClose={() => { setStep2(null); calendar.current?.closeEntry() }}
/>
```

Reminders never go through `onNext` — they save straight away.

---

## 11. Opening an item from outside (bell, feed, push)

```ts
import { requestOpenEvent } from '@/calendar'

requestOpenEvent(eventId)
navigate('/calendar') // if the calendar is not on this page
```

The request waits until a calendar is on screen, so it works from any page: a
notification bell, a dashboard feed, a push notification. The calendar opens that item's
panel as soon as the item is in `events`.

---

## 12. Time zones

The calendar works **only in the browser's local time**. `eventDate`, `startTime` and
`endTime` in every draft are local, and so are the days the grids draw.

The app converts at its API edge:

- **API → calendar:** turn the item's UTC instant into a browser-local date + `HH:mm`.
- **Calendar → API:** turn the local date + time into the zone the item belongs to
  (e.g. the campus zone for events, the user's zone for reminders) and send that zone too.

The TPO app's full flow — what to send at sign-up, login and create — is in
`docs/timezone.md`.

---

## 13. Pieces on their own

Every part is exported and works without `<Calendar />` — no API, only props.
Wrap them in `<CalendarProvider icons={…} labels={…}>` only to give them the app's
icons or words.

```tsx
import { itemFromEvent, MonthGrid } from '@/calendar'

const items = events.map((event) => itemFromEvent(event, eventTypes))
<MonthGrid month={month} items={items} onOpen={openItem} onPickDate={createOn} />
```

| Piece | Props | What it is |
|---|---|---|
| `MiniCalendar` | `month: Date`, `selected: Date`, `onMonthChange(month)`, `onPick(day)`, `rangeStart?: Date`, `rangeDays?: number`, `className?` | The small month in the sidebar; `rangeStart` + `rangeDays` highlight a range |
| `DayJump` | `date: string` (yyyy-MM-dd), `onDateChange(date)`, `label?`, `className?` | Date button that opens a day / month / year picker with "Today" |
| `MonthGrid` | `month: Date`, `items: CalendarItem[]`, `selected?: Date`, `onOpen?(item)`, `onPickDate?(day)` | Month view |
| `DaysGrid` | `days: Date[]`, `items`, `onOpen?(item)`, `onPickDate?(day)` | Day / week time grid — pass 1 to 7 days |
| `ListView` | `month: Date`, `items`, `onOpen?(item)` | List grouped by day |
| `WeekStrip` | `selected: Date`, `onPick(day)` | A week of days to pick from (mobile) |
| `ItemTile` | `item`, `onOpen?(item)`, `showTime?`, `className?` | One item as the grids draw it |
| `Legend` | `selected: string[]` (hidden kinds), `onToggle(kind)` | Colour key, each kind toggleable |
| `DayPreview` | `date`, `startTime`, `endTime`, `title`, `entries: DayEntry[]`, `onDateChange(date)`, `onTimeChange?(start, end)` | One day's timeline beside a form; drag / resize the block; shows clashes |
| `TimeSelect` | `value: string` (HH:mm), `onChange(value)`, `after?: string` | Half-hour picker; `after` hides times before it (for end times) |
| `RepeatField` | `eventDate`, `value: Recurrence \| null`, `onChange(value)`, `error?` | "Does not repeat / Every week … until" |
| `CalendarSkeleton` | — | Loading state |
| `CalendarError` | `message`, `onRetry()` | Failed state with Retry |
| `DetailRow` | `icon`, `label`, `children` | One labelled row of the event panel |
| `CalendarProvider` | `icons?`, `labels?`, `children` | Icons and words for pieces used on their own |

---

## 14. Helpers and constants

| Export | What it does |
|---|---|
| `itemFromEvent(event, eventTypes)` | `CalendarEvent` → `CalendarItem` (what the grids draw) |
| `itemsOn(items, day)` | Items on that day, sorted |
| `overlaps(startA, endA, startB, endB)` | Do two `HH:mm` ranges clash |
| `isTimed(eventTypes, value)` | Does this type have start + end times |
| `typeFor(eventTypes, value)` | The app's entry for a type |
| `styleOf(item)` | Colours and label for a tile (cancelled / not applicable aware) |
| `requestOpenEvent(id)` | Open an item's panel — [section 11](#11-opening-an-item-from-outside-bell-feed-push) |
| `EMPTY_DRAFT` | A blank `EventDraft` |
| `REMINDER_TYPE`, `DEADLINE_TYPE`, `NUDGE_TYPE` | Built-in `eventType` values |
| `CALENDAR_ITEM_STYLE`, `CANCELLED_STYLE` | Colours per kind |
| `DEFAULT_LABELS`, `DEFAULT_ICONS` | The defaults, to build on |

Types: `CalendarProps`, `CalendarHandle`, `CalendarNotice`, `CalendarPermissions`,
`EventActionContext`, `CalendarEvent`, `EventDraft`, `CalendarItem`, `CalendarEventType`,
`CalendarView`, `Recurrence`, `RemindBefore`, `DayEntry`, `CancelReasonOption`,
`CalendarLabels`, `CalendarIcons`, and each piece's `…Props`.

---

## 15. Folder layout

```
calendar/
  index.ts              public entry — everything an app imports
  Calendar.tsx          the component; its children are in components/
  Calendar.types.ts     Calendar.constants.ts
  CalendarProvider.tsx  icons.tsx  labels.ts
  components/           each component with its own children in its components/
                        and its config beside it (Name.constants.ts, Name.helpers.ts)
  constants/ helpers/ services/ types/   shared by more than one component (no API calls)
  hooks/ lib/           useIsMobile, cn()
  shared/ui, shared/custom               the design-system pieces it uses
  styles/               calendar.css (always), tokens.css (blank app only)
  tailwind.preset.ts    the Tailwind theme its classes are written against
```

---

## 16. Checklist for a new repo

1. Copy `src/calendar`, install the packages, add the Tailwind preset and `content` glob.
2. Blank app only: import `styles/tokens.css`.
3. Map the API's items to `CalendarEvent` (times → browser-local) and pass them as `events`.
4. Wire `onCreate`, `onUpdate`, `onCancel`, `onDelete` to the API; refresh after each; show toasts in the app.
5. Set `permissions` from the app's roles; give `eventTypes`, `cancelReasons`, `audienceNoun`.
6. Optional: `getFeedLink` (Sync), `onDeleteAll`, `resolveImageUrl`, `onNotice`.
7. Optional: `labels`, `icons`, `views`, `showSidebar`, `showCreate`, `createLabel`.
8. Optional: slots (`toolbarExtras`, `renderEventDetails`, `eventActions`) and a second step (`onNext` + ref).
9. Bell / notifications: `requestOpenEvent(id)` and navigate to the calendar page.
10. Time zones: convert at the API edge — see `docs/timezone.md`.
