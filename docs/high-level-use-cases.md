# Campus Calendar: Main Use Cases

This is the list of things the Campus Calendar must do: 86 use cases, grouped by what they are about.

We checked each one against the code on 2 Nov 2026.

**Status:**
- ✅ **Done:** built and working in the calendar POC (`calendar-frontend` + `calendar-backend`). These parts are the calendar's own and do not need the real project.
- ❌ **Half done:** part of it works in the POC; the note says what is missing.
- ❌ **Needs real project:** it depends on Student 2.0, TPO 2.0, the Jobs service or the mobile app, so the POC alone cannot finish it.
- ❌ **Not done:** can be built in the POC, but is not built yet.
- 🕒 **Future scope:** not in BRD v1. **External events** (a student's own events, and events linked to a job, learning path, course, cohort, mock interview or assessment) will be added once the requirements are confirmed. Draft design: `calendar-backend/docs/external-events-design.md`. They are not counted as "Not done".

**Roles:** the calendar has three roles: TPO, Student and Super Admin. There is no Teacher role in the BRD.

**Where messages go:** the BRD says a message reaches the student in up to 3 places: the **bell** 🔔 on the website, a **phone notification** (mobile push) and **email**. Today only the bell is built.

**Who:**
- **TPO:** the placement officer.
- **Student:** the student.
- **Admin:** the Super Admin.
- **System:** happens on its own.

**Type** (what the use case is about):

| Type | What it means |
|---|---|
| **Event** | An event a TPO creates (PPT, Company Visit, Online Assessment and the rest; see "Event types" below) |
| **Deadline** | A job's last date to apply, added by itself |
| **Reminder** | A private reminder a TPO or student sets for themselves (My Reminder) |
| **Nudge** | An automatic reminder the system sends, e.g. "Deloitte PPT starts in 1 hour" |
| **Bell** | A message to the student, e.g. "New event: Deloitte PPT" (bell 🔔 today; phone and email later) |
| **Feed** | A card on the student's Home page |
| **External** | A student's own outside event (future scope: added once the requirements are confirmed) |
| **Settings** | The Super Admin's settings |
| **Calendar** | The calendar as a whole (opening it, views, who sees what) |
| **Event (new)** | A new kind of event that does not exist yet (job interview rounds, offer and joining dates) |

More detail:
- `use-cases-status.md`: a note on each use case.
- `use-cases.md`: the full detailed list (213).

## Event types

Every kind of item that can be on the calendar.

**The 8 TPO event types.** A TPO picks one of these when creating an event. In the tables they are all **"Event"**.

| # | Event type | What it is | Example |
|---|---|---|---|
| 1 | PPT (Pre-Placement Talk) | A company talks to students about the company and the job | "Deloitte PPT" |
| 2 | Company Visit | A company comes to the campus | "Infosys campus visit" |
| 3 | Online Assessment | An online test from a company; the test link goes to the student's email | "TCS online test" |
| 4 | Training / Workshop | A training session or workshop | "Resume writing workshop" |
| 5 | Orientation / Info Session | A talk that gives information | "Placement orientation" |
| 6 | Practice Test | A practice test before the real one | "Aptitude practice test" |
| 7 | Deadline | A last date the TPO sets; all-day, no time | "Submit documents by 5 Nov" |
| 8 | Other | Anything else; the TPO types its name | "Alumni Talk" |

**Other types.** Nobody picks these from the list of 8.

| Event type | What it is | Who makes it | Who sees it |
|---|---|---|---|
| My Reminder | A private reminder | TPO or student, for themselves | Only the person who made it |
| Job Deadline | A job's last date to apply | Added by itself when a job is posted | TPO; students who can apply and have not applied yet |
| Nudge | An automatic reminder, e.g. "Deloitte PPT starts in 1 hour" | Sent by the system | Only that student |

**Not built yet:**
- **External (future scope):** a student's own outside event, e.g. an off-campus interview, or one linked to a job, course or mock interview. It will be added once the requirements are confirmed. Until then a student can add one as a **My Reminder** (title, date, time, note, alert).
- **Job Round:** a job's interview round or test.
- **Offer / Joining:** offer reply date and joining date.

## Summary

| Group | ✅ Done | ❌ Half done | ❌ Needs real project | ❌ Not done | 🕒 Future scope | Total |
|---|---|---|---|---|---|---|
| Calendar and views | 8 | 2 | — | — | — | 10 |
| Creating an event (TPO) | 9 | 1 | — | 1 | — | 11 |
| Changing and cancelling an event (TPO) | 8 | — | — | 2 | — | 10 |
| What the student sees | 2 | — | 4 | — | — | 6 |
| Messages to students | — | 6 | 2 | 1 | — | 9 |
| Job deadlines and hiring | 3 | — | 4 | — | — | 7 |
| Private reminders (My Reminder) | 6 | 1 | — | — | — | 7 |
| Automatic reminders (nudges) | 3 | 3 | 2 | — | — | 8 |
| Admin settings | 4 | — | — | — | — | 4 |
| Access and permissions | 1 | — | — | — | — | 1 |
| External events (future scope) | — | — | — | — | 13 | 13 |
| **Total** | **44** | **13** | **12** | **4** | **13** | **86** |

🕒 **External events are future scope.** They are not in BRD v1 and will be added once the requirements are confirmed. The feature is planned to be generic: the calendar only shows a new "external" item; what it links to (job, course, cohort, mock interview, assessment, or something new later) is handled outside the calendar, one small piece per type.

---

## Use cases

### 1. Calendar and views

| # | Use case | Example | Who | Type | Status |
|---|---|---|---|---|---|
| 1 | TPO and student open the calendar from the side menu | Click "Calendar" | TPO, Student | Calendar | ✅ Done |
| 2 | Show the calendar by month, by week, or as a list | Switch from Month to List | TPO, Student | Calendar | ✅ Done |
| 3 | TPO hides some events to see only the ones needed | Show only Deloitte's events | TPO | Event | ✅ Done |
| 4 | TPO sees events made by the other TPOs of the college too | Ravi's PPT shows on Priya's calendar | TPO | Event | ✅ Done |
| 5 | Student opens their own calendar | — | Student | Calendar | ✅ Done |
| 6 | Student sees only the events for their batch and department | Other batches' events are not shown | Student | Calendar | ✅ Done |
| 7 | Student sees a red dot on Calendar when something new or changed is waiting | Dot on the Calendar menu item | Student | Calendar | ❌ Half done: the dot shows for unread messages; the BRD wants it to clear when the calendar is opened |
| 8 | Calendar shows a clear message when a month is empty, a loader while loading, and Retry on error | "No events this month. Your TPO will add placement events here." | TPO, Student | Calendar | ❌ Half done: loader and Retry work; the empty-month message is missing |
| 9 | TPO or student sees the 7Seers calendar inside Google Calendar or Outlook | Using a private link | TPO, Student | Calendar | ✅ Done |
| 10 | Everyone sees times in their own time zone | A student in the US sees US time | TPO, Student | Calendar | ✅ Done |

### 2. Creating an event (TPO)

| # | Use case | Example | Who | Type | Status |
|---|---|---|---|---|---|
| 11 | TPO creates an event for students | "Deloitte PPT, 5 Nov, 10 AM" | TPO | Event | ✅ Done |
| 12 | TPO creates an event that is not about a job | A placement orientation | TPO | Event | ✅ Done |
| 13 | TPO creates an event about a job | An Infosys PPT for the Infosys job | TPO | Event | ✅ Done |
| 14 | TPO creates an event about an internship | An Amazon internship talk | TPO | Event | ✅ Done |
| 15 | TPO adds a new event type to the list | Add "Hackathon" | TPO | Event | ❌ Half done: list is fixed; "Other" lets you type a name |
| 16 | TPO chooses which students the event is for | B.Tech · 2027 batch · CSE | TPO | Event | ✅ Done |
| 17 | Before publishing, TPO sees how many students will be told | "120 students will be notified" | TPO | Event | ✅ Done |
| 18 | While creating an event, TPO sees that company's other events | "Deloitte already has a test on 2 Oct" | TPO | Event | ✅ Done |
| 19 | TPO gets a warning when the new event is at the same time as another | "2 events at this time" | TPO | Event | ✅ Done |
| 20 | TPO or student makes an event or reminder repeat | Every Monday at 10 AM | TPO, Student | Event, Reminder | ✅ Done |
| 21 | TPO is asked before closing the event form with unsaved changes | "Discard your changes?" | TPO | Event | ❌ Not done: can be built in the POC; not built yet |

### 3. Changing and cancelling an event (TPO)

| # | Use case | Example | Who | Type | Status |
|---|---|---|---|---|---|
| 22 | TPO clicks an event to see all its details | Date, time, place, which students | TPO | Event | ✅ Done |
| 23 | TPO changes an event | Move it to 3 PM | TPO | Event | ✅ Done |
| 24 | When TPO changes who an event is for, TPO sees who stays, who is added and who is removed, and can give a reason | "+40 added · 25 removed"; reason goes into the message | TPO | Event | ❌ Not done: can be built in the POC; not built yet |
| 25 | When saving a change, the button and message say how many students will be told | "Save & Notify 120", "Changes saved. 120 students notified." | TPO | Event | ❌ Not done: can be built in the POC; not built yet |
| 26 | TPO cancels an event and gives the reason | "Company withdrew" | TPO | Event | ✅ Done |
| 27 | TPO can still see cancelled events | Shown greyed out, with the reason | TPO | Event | ✅ Done |
| 28 | TPO deletes a cancelled event forever | — | TPO | Event | ✅ Done |
| 29 | A past event cannot be changed or cancelled | Edit and Cancel are hidden after the event ends | TPO | Event | ✅ Done |
| 30 | TPO sees who created an event and what was changed later | "Created by Ravi on 2 Oct" | TPO | Event | ✅ Done |
| 31 | Only the TPO who created an event can change or cancel it | Other TPOs can only view it | System | Event | ✅ Done |

### 4. What the student sees

| # | Use case | Example | Who | Type | Status |
|---|---|---|---|---|---|
| 32 | Student clicks an event on the website to see all its details | — | Student | Event | ✅ Done |
| 33 | Student taps an event in the mobile app to see all its details | — | Student | Event | ❌ Needs real project: the Student mobile app |
| 34 | Student sees a label when an event was changed or cancelled | "Updated", "Cancelled", "No longer applicable" | Student | Event | ✅ Done |
| 35 | Student sees their next events on the website home page | The "Coming Up" box | Student | Calendar | ❌ Needs real project: the "Coming Up" box works in the POC; Student 2.0's Home page is in the real project |
| 36 | Student sees their next events on the mobile app home screen | — | Student | Calendar | ❌ Needs real project: the Student mobile app |
| 37 | Student sees calendar news as cards on their Home page | "New event: Deloitte PPT" | Student | Feed | ❌ Needs real project: the cards work in the POC; Student 2.0's Home feed is in the real project |

### 5. Messages to students

| # | Use case | Example | Who | Type | Status |
|---|---|---|---|---|---|
| 38 | When an event is changed, its students get a message | "Deloitte PPT moved to 3 PM" | TPO | Event | ❌ Half done: bell 🔔 works; phone notification and email need the real project (mobile app, mail service) |
| 39 | Student gets a message when a new event is made for them | "New event: Deloitte PPT" | Student | Bell | ❌ Half done: bell 🔔 works; phone notification and email need the real project (mobile app, mail service) |
| 40 | Student gets a message when their event is changed | "Time changed to 3 PM" | Student | Bell | ❌ Half done: bell 🔔 works; phone notification and email need the real project (mobile app, mail service) |
| 41 | Student gets a message when their event is cancelled | "Cancelled: company withdrew" | Student | Bell | ❌ Half done: bell 🔔 works; phone notification and email need the real project (mobile app, mail service) |
| 42 | Students added to or removed from an event get a message | "No longer applicable" | TPO | Bell | ❌ Half done: bell 🔔 works; phone notification and email need the real project (mobile app, mail service) |
| 43 | Student gets a message when a job's last date to apply is near | "Infosys closes in 2 days" | Student | Bell | ❌ Half done: bell 🔔 works; phone notification needs the real project (mobile app) |
| 44 | Students get a message when a new job is posted | "New job: Infosys" | TPO → Student | Bell | ❌ Needs real project: job posting is in TPO 2.0 |
| 45 | Student sees calendar messages in the mobile app's Notifications screen | — | Student | Bell | ❌ Needs real project: the Student mobile app |
| 46 | If a message fails to send, the system tries again and tells the support team | — | System | Bell | ❌ Not done: can be built in the POC; not built yet |

### 6. Job deadlines and hiring

| # | Use case | Example | Who | Type | Status |
|---|---|---|---|---|---|
| 47 | When a job is posted, its last date to apply appears on the calendar by itself | "Infosys: applications close 30 Sep" | System | Deadline | ✅ Done: uses sample jobs in the POC; the real Jobs service plugs in later |
| 48 | When a job changes, its last date on the calendar changes too | New last date, or job closed | System | Deadline | ✅ Done: uses sample jobs in the POC; the real Jobs service plugs in later |
| 49 | Student and TPO see a job's last date to apply; TPO also sees who applied | "40 applied · 20 not applied" | TPO, Student | Deadline | ✅ Done: uses sample jobs in the POC; the real Jobs service plugs in later |
| 50 | Student clicks a job's last date on the calendar to open that job | "View & Apply" button | Student | Deadline | ❌ Needs real project: opens the POC's Jobs list; a job's own page is in Student 2.0 |
| 51 | Student applies for the job right inside the calendar | An "Apply" button in the event | Student | Deadline | ❌ Needs real project: applying happens in Student 2.0's Jobs |
| 52 | A job's interview rounds show on the calendar of the students in that round | "Infosys Technical Round, 12 Nov" | TPO → Student | Event (new) | ❌ Needs real project: hiring rounds are in the real Jobs service |
| 53 | Student sees their offer reply date and joining date on the calendar | "Join on 1 July" | Student | Event (new) | ❌ Needs real project: offers and joining dates are in the real Jobs service |

### 7. Private reminders (My Reminder)

| # | Use case | Example | Who | Type | Status |
|---|---|---|---|---|---|
| 54 | TPO adds a reminder that only they can see | "Call Infosys HR at 4 PM" | TPO | Reminder | ✅ Done |
| 55 | TPO changes their reminder | Move it to 5 PM | TPO | Reminder | ✅ Done |
| 56 | TPO deletes their reminder | — | TPO | Reminder | ✅ Done |
| 57 | Student adds a reminder that only they can see | "Revise DBMS at 6 PM" | Student | Reminder | ✅ Done |
| 58 | Student changes their reminder | — | Student | Reminder | ✅ Done |
| 59 | Student deletes their reminder | — | Student | Reminder | ✅ Done |
| 60 | Student gets an alert at the time they set on their reminder | 1 hour before | Student | Reminder | ❌ Half done: bell 🔔 works; phone notification needs the real project (mobile app) |

### 8. Automatic reminders (nudges)

| # | Use case | Example | Who | Type | Status |
|---|---|---|---|---|---|
| 61 | Student gets an automatic reminder before an event | 1 day before and 1 hour before | Student | Nudge | ❌ Half done: bell 🔔 works; phone notification needs the real project (mobile app) |
| 62 | Student gets an automatic reminder before a job's last date to apply | 2 days before and on the last day | Student | Nudge | ❌ Half done: bell 🔔 works; phone notification needs the real project (mobile app) |
| 63 | Student gets an automatic reminder on the morning of an online test | 8 AM on the test day | Student | Nudge | ❌ Half done: bell 🔔 works; phone notification needs the real project (mobile app) |
| 64 | When an event's date changes, its automatic reminders move to the new date | 5 Nov → 7 Nov | System | Nudge | ✅ Done |
| 65 | When an event is cancelled, its automatic reminders are not sent | — | System | Nudge | ✅ Done |
| 66 | Student sees automatic reminders on the calendar and can open them | A purple "Reminder" | Student | Nudge | ✅ Done |
| 67 | Student sees automatic reminders as cards on their Home page | "Event Tomorrow" | Student | Feed | ❌ Needs real project: the cards work in the POC; Student 2.0's Home feed is in the real project |
| 68 | Student sees automatic reminders in the mobile app | On the calendar, in Notifications, as a phone alert | Student | Nudge | ❌ Needs real project: the Student mobile app |

### 9. Admin settings

| # | Use case | Example | Who | Type | Status |
|---|---|---|---|---|---|
| 69 | Admin sets how early automatic reminders are sent | 1 day and 1 hour before | Admin | Settings | ✅ Done |
| 70 | Admin sets how many automatic reminders a student can get in one day | At most 3 a day | Admin | Settings | ✅ Done |
| 71 | Admin sets night hours when no reminders are sent | 10 PM to 7 AM | Admin | Settings | ✅ Done |
| 72 | Admin sets the rules for automatic reminders | Daily limit, night hours, which goes first | Admin | Settings | ✅ Done |

### 10. Access and permissions

| # | Use case | Example | Who | Type | Status |
|---|---|---|---|---|---|
| 73 | Each person sees only the events meant for them, checked on the server | Other batches' events and others' reminders are never sent to the browser | System | Calendar | ✅ Done |

### 11. External events (future scope)

| # | Use case | Example | Who | Type | Status |
|---|---|---|---|---|---|
| 74 | After login, a pop-up asks the student about upcoming outside events | "Any interview coming up?" | Student | External | 🕒 Future scope: will be added once the requirements are confirmed |
| 75 | Student adds an event from outside the college | A hackathon, an exam, an outside interview | Student | External | 🕒 Future scope: will be added once the requirements are confirmed (today a My Reminder can stand in) |
| 76 | Student changes their outside event | — | Student | External | 🕒 Future scope: will be added once the requirements are confirmed (today a My Reminder can stand in) |
| 77 | Student deletes their outside event | — | Student | External | 🕒 Future scope: will be added once the requirements are confirmed (today a My Reminder can stand in) |
| 78 | Student sees their outside events on the calendar | — | Student | External | 🕒 Future scope: will be added once the requirements are confirmed (today a My Reminder can stand in) |
| 79 | Student gets a reminder before their outside event | — | Student | External | 🕒 Future scope: will be added once the requirements are confirmed (today a My Reminder alert can stand in) |
| 80 | Student adds an event for a job, course or mock interview on 7Seers | "Mock interview for TCS, 6 PM" | Student | External | 🕒 Future scope: will be added once the requirements are confirmed |
| 81 | An "Add to calendar" button on the job, course, cohort, mock interview and test pages | — | Student | External | 🕒 Future scope: will be added once the requirements are confirmed |
| 82 | Student clicks the event to open that job, course or mock interview, and sees their progress | "Course 60% done" | Student | External | 🕒 Future scope: will be added once the requirements are confirmed |
| 83 | The event is ticked by itself when the student finishes the work | Mock interview finished ✓ | Student | External | 🕒 Future scope: will be added once the requirements are confirmed |
| 84 | Interview rounds, cohort dates and course dates appear on the student's calendar by themselves | "Cohort test closes 15 Nov" | System | External | 🕒 Future scope: will be added once the requirements are confirmed |
| 85 | Admin turns the after-login pop-up on or off | — | Admin | Settings | 🕒 Future scope: will be added once the requirements are confirmed |
| 86 | Admin turns outside events on or off and sets how many a student can add | — | Admin | Settings | 🕒 Future scope: will be added once the requirements are confirmed |

## Where the POC differs from the BRD

These are on purpose (decided while building the POC) or still open. They are not counted above.

| BRD says | POC does | Why |
|---|---|---|
| Event type cannot be changed after publishing (FR-CAL-05, FR-CAL-10) | TPO can change the type on edit, but never into a My Reminder | Asked for during the POC |
| Published events can never be deleted for good (FR-CAL-11) | After cancelling, the owner TPO can "Delete permanently"; "Delete all" also exists | Asked for during the POC |
| One "Create Event" drawer (FR-CAL-05) | Two steps: a generic first step (same for every role and project), then a TPO step with type, venue and audience | Asked for during the POC, so the first step stays generic |
| TPO reminders can be on past dates (FR-CAL-12) | Nothing can be created on a past date or time; past days and hours are greyed out (the calendar prop `allowPastDates`, off by default) | Asked for during the POC |
| "Updated" badge only after an important change (FR-CAL-17) | Badge shows after any edit | Open: can be changed to match the BRD |
| Target audience is required to publish (FR-CAL-05) | The audience can be left empty on publish and chosen later from the event | Added during the POC; the event warns "no students see it yet" |
