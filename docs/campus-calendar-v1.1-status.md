# Campus Calendar v1.1 — what is done, what is not

> **Note (2026-10-30):** this is a historical report and is kept as written. The
> `<Calendar onNext … onDayEntries />` / ref second-step design it shows (the
> calendar opening `CalendarEntryDialog` and `CalendarDialogs` itself) has since
> been replaced by the **headless calendar**: `src/calendar` only draws and tells
> through callbacks (`onViewEvent`, `onCreateRequest`, `onDeleteAllRequest`,
> `onSyncRequest`, `onNotice`), and every modal is the app's own
> (`src/modules/Calendar/components/` — `EventEntryDialog`, `PublishEventDialog`,
> `EventDetailModal`, `CancelEventDialog`, `ConfirmDialog`, `SyncDialog`, `AudienceDialog`),
> shown by `pages/CalendarPage`. Current usage: `src/calendar/README.md`
> (= `docs/calendar-usage.md`).

The demo review agreed seven changes. This is where each one stands today, with
the code that carries it, so the next person can pick up the unfinished ones
without reading the whole repo first.

| | Decision | Status |
|---|---|---|
| 1 | Audience out of the create pop-up | ✅ Done — "Who should see this?" is its own section on the Publish step; leave it empty to publish now and pick later from the event (`AudienceDialog`) |
| 2 | Recurring events | ✅ Done — Repeat (daily / weekly / monthly, every N, until) on the first modal; one row per occurrence sharing `series_id`; cancel "only this" or "this and later" |
| 3 | Sync / link with other calendars | ✅ Done (one-way) — personal `.ics` feed (`/calendar/feed.ics?token=`) + Google / Outlook buttons in the Sync dialog |
| 4 | Attach an image to an event | ✅ Done — `ImageField` on the Publish step, `/calendar/images` upload (PNG/JPG/GIF/WebP, 2 MB, magic-byte checked), shown in the detail panel |
| 5 | Event creation generic, not TPO-specific | ✅ Done |
| 6 | Calendars for Teacher / Industry / Admin portals | ❌ To explore |
| 7 | Student side as the main focus | ❌ To discuss |

Times: the TPO enters IST wall-clock; the backend stores UTC (`to_utc` with
`DEFAULT_ORG_TIMEZONE`) per occurrence, and the `.ics` feed emits UTC (`…Z`), so
10:00 IST lands as 04:30 UTC in Google / Outlook. All-day items use `VALUE=DATE`.

Not yet: editing a whole series at once (edit is per occurrence), recurring
reminders, two-way Google / Outlook sync, revoking a leaked feed link (it
expires after `FEED_TOKEN_DAYS`). Migration `b7e2f0c4a913` adds `series_id`,
`recurrence`, `image_url` to `calendar_event`.

---

## 5. Event creation is generic ✅

The create dialog no longer belongs to the TPO. One dialog serves both sides and
asks only what every calendar entry needs.

**`components/CalendarEntryDialog/`** — the generic first step

```
Event Type (TPO only)
Title
Start date  ·  Start time  ·  End time        one row, stacked on mobile
Remind me
Note
```

A student under "Add Reminder" sees the same form without the type picker. A
reminder ends here on **Save Reminder**; an event carries on with **Next**.

**`components/Calendar/`** — the calendar itself, reusable on any route

```tsx
<Calendar
  role="tpo"            // tpo | student
  views={['day', 'week', 'month', 'list']}
  defaultView="month"
  showSidebar
  showCreate
  createLabel="New Event"
  showFilter
  showDeleteAll
  onNext={…}            // the host decides what follows the first step
  onDayEntries={…}
/>
```

Nothing is passed and everything is on, exactly as it is today. Each piece can
be switched off for a route that does not want it.

It was one 728-line page and one 796-line drawer. It is now:

```
pages/CalendarPage/index.tsx                   48   <Calendar /> + <PublishEventDialog />
components/Calendar/index.tsx                 618   state + composition
components/Calendar/components/
    CalendarToolbar/index.tsx                 208   create · nav · day/week/month/list · filter
    CalendarDialogs/index.tsx                 148   detail panel + cancel + 3 confirms
    CalendarSidebar/index.tsx                  57   mini calendar + legend
components/CalendarEntryDialog/index.tsx      437   the generic first step
components/PublishEventDialog/index.tsx       706   everything only an event needs
components/parts.tsx                           34   Section / InfoNote / Required
```

---

## 1. Audience selection ⚠️

**What was agreed:** publish the event first, then pick the audience on a
separate **page**.

**What exists:** the audience is out of the create dialog, but it sits in a
second **dialog** that opens on **Next**, and the event is published at the end
of it.

```
agreed    create → PUBLISH → audience page → notify
built     create → audience dialog → PUBLISH
```

So the event is still not published until the audience is chosen. To match the
decision, three things have to change:

- `PublishEventDialog` keeps the event fields (type is on step one, company,
  venue, description, linked job) and loses the Target Audience section
- The publish call runs without an audience, and the event is saved unpublished
  to anyone
- A new route, e.g. `/tpo/events/:id/audience`, carries the audience form and
  the "X students will be notified" count, and sends the notifications

The audience form itself is ready to move: Opportunity Type, Course, Batch and
Department with their validation live together in `PublishEventDialog`, and the
count comes from `services/audience.ts` → `countAudience()`.

---

## 2. Recurring events ❌

Nothing exists. `EventDraft` has a single `eventDate`, and the backend's
`calendar_event` row has one date too. This needs, at least:

- a recurrence rule on the draft and the row (RRULE is the usual shape)
- the grid and the list to expand a rule into occurrences
- a decision on editing: this occurrence, or all of them
- cancel / delete to answer the same question
- nudges per occurrence rather than per row

---

## 3. Calendar sync ❌

Nothing exists. Needs a direction first: an `.ics` feed the student subscribes
to (read-only, simple), or OAuth into Google / Outlook (two-way, far bigger).
The nudge scheduler already knows each event's UTC moment, so an `.ics` export
is the smaller first step.

---

## 4. Image attachment ❌

Nothing exists. Needs an upload path on the backend, a field on the draft and
the row, the picker in the create dialog, and the image shown in the detail
panel. `ProfilePhotoPicker` in the Ory repo is the nearest pattern, including
its size and type checks.

---

## 6. Other portals ❌

Teacher, Industry and Admin have no calendar today. `<Calendar />` is now
mountable anywhere and its pieces can be switched off, so the question is no
longer technical — it is what each portal should see and create.

---

## 7. Student side ❌

Open for discussion. What exists today: the calendar tab, the Coming Up card,
home feed cards, My Reminder, the external-event pop-up at login, nudges, and
the mobile app calendar.

---

## Fixed along the way, outside the list

- **Reminder opened the second dialog.** A reminder has no type, audience or
  venue, so the second step opened empty. It now ends on **Save Reminder**.
- **Reminder nudges never fired.** A TPO starts from an event draft, where
  "Remind me" is empty. Switching the type to My Reminder left it empty, and the
  backend schedules nothing without `remind_before`. It now defaults to
  `1 hour before` (`DEFAULT_REMIND_BEFORE`).
- **End time could be before the start.** The end dropdown now offers only later
  times, clearing the start clears the end, and changing the start moves the end
  an hour on.
- **The second dialog overflowed its own box** and the close button sat on top
  of "Fill Data". Both fixed; no overflow at 1440, 820 or 390 px.
- **"Fill Data" filled the other step's fields.** Each dialog now fills only
  what it shows.
