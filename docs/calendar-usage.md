# Calendar — how to use it

A self-contained React calendar. Copy the `calendar/` folder into any React + Vite +
Tailwind app and it runs. It:

- **only draws and tells** — it shows the events it is given and reports what the user
  asked for (open this, create on that day, delete all, sync). It **opens no modal and
  calls no API**: every modal and every operation is the app's own, so each project
  brings its own (see [section 10](#10-your-modals-and-operations));
- **shows no toast** — the app words and shows every message in its own way;
- **knows no domain** — nothing about TPOs, students, jobs or audiences; the app adds
  those through extra draft fields and its own modals;
- **imports nothing from outside itself** except npm packages; inside, every import is relative;
- lets the app replace **every icon** and **every button text**.

Contents

1. [Install](#1-install)
2. [Minimal example](#2-minimal-example)
3. [Data model](#3-data-model)
4. [`<Calendar />` props](#4-calendar--props)
5. [Callbacks — what the user asked for](#5-callbacks--what-the-user-asked-for)
6. [Permissions and ownership](#6-permissions-and-ownership)
7. [Labels — every word, per part of the screen](#7-labels--every-word-per-part-of-the-screen)
8. [Icons](#8-icons)
9. [Slots — adding the app's own UI](#9-slots--adding-the-apps-own-ui)
10. [Your modals and operations](#10-your-modals-and-operations)
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
npm i date-fns lucide-react clsx tailwind-merge class-variance-authority \
  @radix-ui/react-popover @radix-ui/react-slot
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
  // Which of the app's own modals is open.
  const [viewing, setViewing] = useState<CalendarEvent | null>(null)
  const [creating, setCreating] = useState<EventDraft | null>(null)

  const load = () =>
    api.list()
      .then((list) => { setEvents(list); setError(null) })
      .catch(() => setError('Could not load the calendar.'))
      .finally(() => setIsLoading(false))

  useEffect(() => { load() }, [])

  return (
    <>
      <Calendar
        title="Team calendar"
        events={events}
        isLoading={isLoading}
        loadError={error}
        onRetry={load}
        permissions={{ createEvents: true }}
        eventTypes={[{ value: 'meeting', label: 'Meeting', timed: true }]}
        allowPastDates={false}            // no create on a day already gone
        onViewEvent={setViewing}          // a tile was clicked
        onCreateRequest={setCreating}     // "New Event" / an empty day — with a draft for it
        onNotice={(notice) => notice.type === 'past-date' && toast.info('Pick today or later.')}
      />

      {/* The app's own modals — and its own API calls inside them. */}
      <MyEventModal event={viewing} onClose={() => setViewing(null)} />
      <MyCreateModal
        draft={creating}
        onSave={async (draft) => { await api.create(draft); await load(); setCreating(null) }}
        onClose={() => setCreating(null)}
      />
    </>
  )
}
```

That is all that is required: `events` and `onViewEvent`. Without `onCreateRequest` the
create button is hidden; without `onDeleteAllRequest` / `onSyncRequest` those buttons are.

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
| `description` | `string` | HTML from the app's rich-text editor |
| `note` | `string` | A reminder's private note |
| `remindBefore` | `'none' \| 'at_time' \| '15_min' \| '1_hour' \| '1_day'` | Reminder alert |
| `linkedType` / `linkedId` | `string \| null` | What a reminder or nudge points at, e.g. `'event'` + its id |
| `recurrence` | `{ freq: 'daily'\|'weekly'\|'monthly', interval: number, until: string } \| null` | Only on create |
| `imageUrl` | `string` | Stored image path; the app turns it into a URL in its own modal |
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
| `changeSummary?`, `changeReason?` | `string` | For the app's view modal after an edit |
| `reach?` | `number` | How many it reaches — for the app's own "N people will be notified" |
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

### 4.2 What the user asked for (callbacks) — details in [section 5](#5-callbacks--what-the-user-asked-for)

| Prop | Type | Required |
|---|---|---|
| `onViewEvent` | `(event) => void` | **yes** |
| `onCreateRequest` | `(draft) => void` | no — leave out to hide create |
| `onDeleteAllRequest` | `() => void` | no — leave out to hide "Delete all" |
| `onSyncRequest` | `() => void` | no — leave out to hide "Sync" |
| `onNotice` | `(notice: CalendarNotice) => void` | no |

### 4.3 What the user may do

| Prop | Type | Default | What it does |
|---|---|---|---|
| `permissions` | `{ createEvents?: boolean; createReminders?: boolean }` | `{}` → reminders only | See [section 6](#6-permissions-and-ownership) |
| `maxUpcomingReminders` | `number` | `50` | Cap on upcoming reminders for someone who cannot create events; hitting it sends `onNotice({ type: 'reminder-limit', limit })` |
| `allowPastDates` | `boolean` | `true` | Off: a click on a past day, or the create button while a past day is in view, opens nothing and sends `onNotice({ type: 'past-date', date })` |

### 4.4 The app's vocabulary

| Prop | Type | Default | What it does |
|---|---|---|---|
| `title` | `string` | `labels.title` (`"Calendar"`) | Heading |
| `eventTypes` | `CalendarEventType[]` | `[]` | The app's event types — their colour and label on the grid |
| `draftDefaults` | `Partial<EventDraft> & Record<string, unknown>` | — | The app's own draft fields, spread over the draft `onCreateRequest` hands over |

### 4.5 Appearance

| Prop | Type | Default | What it does |
|---|---|---|---|
| `labels` | `CalendarLabelsInput` | English defaults | Every word, grouped per part of the screen — [section 7](#7-labels--every-word-per-part-of-the-screen) |
| `icons` | `Partial<CalendarIcons>` | lucide | Every icon — [section 8](#8-icons) |
| `views` | `('day' \| 'week' \| 'month' \| 'list')[]` | all four | Which views, in this order |
| `defaultView` | same | `'month'` (or the first of `views`) | Opening view |
| `showSidebar` | `boolean` | `true` | Mini calendar + legend on the left |
| `showCreate` | `boolean` | `true` | The create button |
| `createLabel` | `string` | `labels.newEvent` / `labels.addReminder` | Text of the create button only (shortcut for `labels`) |
| `showDeleteAll` | `boolean` | `true` | "Delete all" (also needs `onDeleteAllRequest`) |

### 4.6 Slots

| Prop | Type | What it does |
|---|---|---|
| `toolbarExtras` | `ReactNode` | The app's controls in the toolbar, e.g. a Filter button |

---

## 5. Callbacks — what the user asked for

None of them returns anything and none opens anything: the app shows its own modal.

| Callback | Called when | Gets |
|---|---|---|
| `onViewEvent` | A tile or list row is clicked | the `CalendarEvent` (with the app's own draft fields) |
| `onCreateRequest` | "New Event" / "Add Reminder", the mobile "+" button, or a click on an empty day / time slot | a new draft for that day: an event draft with `createEvents`, else a reminder draft — `draftDefaults` spread in |
| `onDeleteAllRequest` | "Delete all" in the toolbar | — |
| `onSyncRequest` | "Sync" in the toolbar | — |
| `onRetry` | Retry on the error state | — |
| `onNotice` | Something the calendar noticed (see below) | `CalendarNotice` |

The calendar still keeps two rules before `onCreateRequest`: past `maxUpcomingReminders`
it sends `onNotice({ type: 'reminder-limit' })`, and with `allowPastDates={false}` a past
day sends `onNotice({ type: 'past-date', date })` — no create is asked for in either case.
The app's own create form should follow the same setting.

### 5.1 `onNotice` — the calendar's own messages, without words

```ts
type CalendarNotice =
  | { type: 'reminder-limit'; limit: number }   // one more reminder than allowed
  | { type: 'past-date'; date: string }         // a past day picked, allowPastDates is off
```

```tsx
onNotice={(notice) => {
  if (notice.type === 'reminder-limit') toast.info(`You can keep ${notice.limit} upcoming reminders.`)
  if (notice.type === 'past-date') toast.info('Pick today or a later date.')
}}
```

Everything else the user is told — saved, cancelled, failed — comes from the app's own
modals and API calls, so the app says it there.

## 6. Permissions and ownership

| `permissions` | Create button | Can create |
|---|---|---|
| `{ createEvents: true }` | "New Event" | events (all `eventTypes`) and reminders |
| `{}` or `{ createReminders: true }` | "Add Reminder" | reminders only |
| `{ createEvents: false, createReminders: false }` | hidden | nothing — view only |

What may be done to one item is decided in the app's own modals, from the item's
`isOwner` (and the app's roles). A usual split:

| Item | `isOwner: true` | `isOwner: false` |
|---|---|---|
| Event, not ended | Edit Event, Cancel Event | Remind me (a linked reminder — the campus portal's `helpers/drafts.ts` `reminderFor`) |
| Event, cancelled | Delete permanently | — |
| Reminder | Edit, Delete | — |
| Nudge | Go to the event | Go to the event |

An app maps its roles to these, e.g. `permissions={{ createEvents: role === 'tpo' }}`.

---

## 7. Labels — every word, per part of the screen

Words are grouped by where they appear — `toolbar`, `dayJump`, `state` — plus the
`title`. Pass any group, and any words in it; everything left out keeps its default.

```tsx
<Calendar
  labels={{
    title: 'Team calendar',
    toolbar: { newEvent: 'Add meeting', viewWeek: 'Hafta' },
    dayJump: { today: 'Aaj' },
  }}
/>
```

Type: `CalendarLabelsInput` (what you pass) → `CalendarLabels` (all words, after defaults).

| Group | Key | Default |
|---|---|---|
| — | `title` | Calendar |
| `toolbar` | `newEvent` / `addReminder` | New Event / Add Reminder (create button, by permission) |
| | `sync`, `deleteAll` | Sync, Delete all |
| | `viewDay`, `viewWeek`, `viewMonth`, `viewList` | Day, Week, Month, List |
| `dayJump` | `today` | Today |
| `state` | `retry` | Retry |

`createLabel` overrides only the create button, whichever text it would show.

These are only the calendar's own words. The words of an app's modals are the app's:
the TPO app keeps the calendar's in `modules/Calendar/constants/labels.ts`
(`CALENDAR_LABELS`, passed as `labels={CALENDAR_LABELS}`) and its modals' in
`MODAL_LABELS` beside them.

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

The app's controls in the toolbar, e.g. a Filter button. Everything else the app adds
lives in its own modals ([section 10](#10-your-modals-and-operations)).

---

## 10. Your modals and operations

The calendar never opens a modal and never calls an API. Each project shows its own
modals and runs its own operations, from the calendar's callbacks:

```
<Calendar onViewEvent onCreateRequest onDeleteAllRequest onSyncRequest />   ← draws and tells
<YourModals modal=… />                                                       ← the project's
   View · Create / Edit (one step or several) · Cancel · Delete · Delete all · Sync
```

A pattern that keeps "Back" and "Go Back" right: one `modal` state, and each modal
remembers the one it was opened from.

```tsx
type Modal =
  | { kind: 'view'; eventId: string }
  | { kind: 'edit'; draft: MyDraft; editing: MyEvent | null }
  | { kind: 'cancel'; event: MyEvent; back: Modal | null }
  | { kind: 'delete'; event: MyEvent; back: Modal | null }
  | { kind: 'sync' } | { kind: 'deleteAll' }

const [modal, setModal] = useState<Modal | null>(null)

<Calendar
  events={events}
  onViewEvent={(event) => setModal({ kind: 'view', eventId: event.id })}
  onCreateRequest={(draft) => setModal({ kind: 'edit', draft: draft as MyDraft, editing: null })}
  onSyncRequest={() => setModal({ kind: 'sync' })}
/>

// "Cancel Event" from the view modal remembers where it came from…
setModal({ kind: 'cancel', event, back: modal })
// …and "Go Back" returns exactly there, with what had been filled in.
<MyCancelModal onBack={() => setModal(modal.back)} onConfirm={async (answer) => { await api.cancel(…); await load(); setModal(null) }} />
```

The package gives the app's modals what it already has — the same rules, so no copies:

| From `@/calendar` | What it is |
|---|---|
| `newDraftOn(date, base)`, `newReminderOn(date, base)`, `EMPTY_DRAFT` | A draft for a day, a reminder draft, a blank one |
| `isTimed`, `kindOf`, `typeFor`, `itemFromEvent`, `isRecentlyUpdated`, `styleOf`, `itemsOn` | Helpers |
| `LIMITS`, `CALENDAR_ITEM_STYLE`, `CANCELLED_STYLE`, `REMINDER_TYPE`, `DEADLINE_TYPE`, `NUDGE_TYPE` | Limits, colours, built-in kinds |
| `DEFAULT_LABELS`, `mergeLabels(labels)` | The calendar's words, with the app's over them |
| `DayPreview`, `overlaps`, `DayJump` and the views in [section 13](#13-pieces-on-their-own) | Pieces to reuse inside a modal or a page — a day's timeline with clashes, a clash check |

Everything a modal needs beyond that (its frame, form fields, validation) is the app's.

The 7Seers campus portal is a full example: `modules/Calendar/pages/CalendarPage` shows
each modal itself, from the calendar's callbacks. Its modals are in
`modules/Calendar/components/` (`EventEntryDialog`, `PublishEventDialog`,
`EventDetailModal`, `CancelEventDialog`, `ConfirmDialog`, `SyncDialog`, `AudienceDialog`),
with their own frame (`Modal`), form fields (`TimeSelect`, `RepeatField`) and rules
(`services/eventSchema`); the day timeline beside the form is the calendar's `DayPreview`.

---

## 11. Opening an item from outside (bell, feed, push)

The item opens in the app's own view modal, so the app does it: the bell (or a feed, or
a push) tells the calendar page which item to open, and the page shows it once it is
loaded. The calendar is not involved. In the campus portal, `modules/Calendar/services/openEvent`
(`requestOpenEvent(id)` from anywhere, `takePendingOpen` / `onOpenEventRequest` on the page).

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
| `DayPreview` | `date`, `startTime`, `endTime`, `title`, `entries: DayEntry[]`, `onDateChange(date)`, `onTimeChange?(start, end)` | One day's timeline beside a form; drag / resize the block; shows clashes |
| `ItemTile` | `item`, `onOpen?(item)`, `showTime?`, `className?` | One item as the grids draw it |
| `Legend` | `selected: string[]` (hidden kinds), `onToggle(kind)` | Colour key, each kind toggleable |
| `CalendarSkeleton` | — | Loading state |
| `CalendarError` | `message`, `onRetry()` | Failed state with Retry |
| `CalendarProvider` | `icons?`, `labels?`, `children` | Words and icons for pieces used on their own |

---

## 14. Helpers and constants

| Export | What it does |
|---|---|
| `itemFromEvent(event, eventTypes)` | `CalendarEvent` → `CalendarItem` (what the grids draw) |
| `itemsOn(items, day)` | Items on that day, sorted |
| `isTimed(eventTypes, value)` | Does this type have start + end times |
| `typeFor(eventTypes, value)` | The app's entry for a type |
| `styleOf(item)` | Colours and label for a tile (cancelled / not applicable aware) |
| `EMPTY_DRAFT`, `newDraftOn(date, base)`, `newReminderOn(date, base)` | A blank draft; a draft for a day; a reminder draft |
| `kindOf`, `isRecentlyUpdated` | Which kind? Changed in the last 48 hours (`LIMITS.updatedBadgeHours`)? |
| `LIMITS`, `mergeLabels(labels)` | Limits; the default words with the app's over them |
| `REMINDER_TYPE`, `DEADLINE_TYPE`, `NUDGE_TYPE` | Built-in `eventType` values |
| `CALENDAR_ITEM_STYLE`, `CANCELLED_STYLE` | Colours per kind |
| `DEFAULT_LABELS`, `DEFAULT_ICONS` | The defaults, to build on |
| `overlaps(startA, endA, startB, endB)` | Do two `HH:mm` ranges clash |

Types: `CalendarProps`, `CalendarNotice`, `CalendarPermissions`, `CalendarEvent`,
`EventDraft`, `CalendarItem`, `CalendarItemKind`, `CalendarEventType`, `CalendarView`,
`CalendarSyncSettings`, `Recurrence`, `RemindBefore`, `RepeatFrequency`, `DayEntry`,
`CalendarLabels`, `CalendarLabelsInput`, `CalendarIcons`, and each piece's `…Props`.

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
  constants/ helpers/ types/   shared by more than one component (no API calls)
  hooks/ lib/           useIsMobile, cn()
  shared/ui             the design-system pieces it uses (Button, Popover, Spinner)
  styles/               calendar.css (always), tokens.css (blank app only)
  tailwind.preset.ts    the Tailwind theme its classes are written against
```

---

## 16. Checklist for a new repo

1. Copy `src/calendar`, install the packages, add the Tailwind preset and `content` glob.
2. Blank app only: import `styles/tokens.css`.
3. Map the API's items to `CalendarEvent` (times → browser-local) and pass them as `events`.
4. Give `onViewEvent` (and `onCreateRequest`, `onDeleteAllRequest`, `onSyncRequest` for
   the buttons you want), and show **your own modals** for them — section 10.
5. In those modals, call your API, refresh `events`, show your toasts.
6. Set `permissions` from the app's roles; give `eventTypes`, `draftDefaults`.
7. Optional: `labels`, `icons`, `views`, `showSidebar`, `showCreate`, `createLabel`, `toolbarExtras`.
8. Bell / notifications: your page opens its view modal for the item (section 11).
9. Time zones: convert at the API edge — see `docs/timezone.md`.
