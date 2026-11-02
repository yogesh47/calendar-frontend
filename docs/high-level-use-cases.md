# Campus Calendar: Main Use Cases

This is the list of things the Campus Calendar must do.

- **Part A (1–60):** the 60 use cases from the original list.
- **Part B (61–80):** 20 more that are important but were missing.

We checked each one against the code on 2 Nov 2026.

**Status:**
- ✅ **Done:** built and working in the calendar POC (`calendar-frontend` + `calendar-backend`). These parts are the calendar's own and do not need the real project.
- ❌ **Half done:** part of it works in the POC; the note says what is missing.
- ❌ **Needs real project:** it depends on Student 2.0, TPO 2.0, the Jobs service or the mobile app, so the POC alone cannot finish it.
- ❌ **Not done:** can be built in the POC, but is not built yet.

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
| **External** | A student's own outside event (not built yet) |
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
- **External:** a student's own outside event, e.g. an off-campus interview. Until it is built, a student can add one as a **My Reminder** (title, date, time, note, alert).
- **Job Round:** a job's interview round or test.
- **Offer / Joining:** offer reply date and joining date.

## Summary

| | ✅ Done | ❌ Half done | ❌ Needs real project | ❌ Not done | Total |
|---|---|---|---|---|---|
| Part A | 36 | 15 | 7 | 2 | 60 |
| Part B | 7 | 1 | 10 | 2 | 20 |
| **Total** | **43** | **16** | **17** | **4** | **80** |

---

## Part A: The 60 use cases

| # | Use case | Example | Who | Type | Status |
|---|---|---|---|---|---|
| 1 | TPO and student open the calendar from the side menu | Click "Calendar" | TPO, Student | Calendar | ✅ Done |
| 2 | Show the calendar by month, by week, or as a list | Switch from Month to List | TPO, Student | Calendar | ✅ Done |
| 3 | TPO hides some events to see only the ones needed | Show only Deloitte's events | TPO | Event | ✅ Done |
| 4 | TPO creates an event for students | "Deloitte PPT, 5 Nov, 10 AM" | TPO | Event | ✅ Done |
| 5 | TPO creates an event that is not about a job | A placement orientation | TPO | Event | ✅ Done |
| 6 | TPO creates an event about a job | An Infosys PPT for the Infosys job | TPO | Event | ✅ Done |
| 7 | TPO creates an event about an internship | An Amazon internship talk | TPO | Event | ✅ Done |
| 8 | TPO adds a new event type to the list | Add "Hackathon" | TPO | Event | ❌ Half done: list is fixed; "Other" lets you type a name |
| 9 | TPO chooses which students the event is for | B.Tech · 2027 batch · CSE | TPO | Event | ✅ Done |
| 10 | Before publishing, TPO sees how many students will be told | "120 students will be notified" | TPO | Event | ✅ Done |
| 11 | While creating an event, TPO sees that company's other events | "Deloitte already has a test on 2 Oct" | TPO | Event | ✅ Done |
| 12 | When a job is posted, its last date to apply appears on the calendar by itself | "Infosys: applications close 30 Sep" | System | Deadline | ✅ Done: uses sample jobs in the POC; the real Jobs service plugs in later |
| 13 | TPO sees events made by the other TPOs of the college too | Ravi's PPT shows on Priya's calendar | TPO | Event | ✅ Done |
| 14 | TPO clicks an event to see all its details | Date, time, place, which students | TPO | Event | ✅ Done |
| 15 | TPO changes an event | Move it to 3 PM | TPO | Event | ✅ Done |
| 16 | When an event is changed, its students get a message | "Deloitte PPT moved to 3 PM" | TPO | Event | ❌ Half done: bell 🔔 works; phone notification and email need the real project (mobile app, mail service) |
| 17 | TPO cancels an event and gives the reason | "Company withdrew" | TPO | Event | ✅ Done |
| 18 | TPO can still see cancelled events | Shown greyed out, with the reason | TPO | Event | ✅ Done |
| 19 | TPO adds a reminder that only they can see | "Call Infosys HR at 4 PM" | TPO | Reminder | ✅ Done |
| 20 | TPO changes their reminder | Move it to 5 PM | TPO | Reminder | ✅ Done |
| 21 | TPO deletes their reminder | — | TPO | Reminder | ✅ Done |
| 22 | Student opens their own calendar | — | Student | Calendar | ✅ Done |
| 23 | Student sees their next events on the website home page | The "Coming Up" box | Student | Calendar | ❌ Needs real project: the "Coming Up" box works in the POC; Student 2.0's Home page is in the real project |
| 24 | Student sees their next events on the mobile app home screen | — | Student | Calendar | ❌ Needs real project: the Student mobile app |
| 25 | Student sees only the events for their batch and department | Other batches' events are not shown | Student | Calendar | ✅ Done |
| 26 | Student sees a label when an event was changed or cancelled | "Updated", "Cancelled", "No longer applicable" | Student | Event | ✅ Done |
| 27 | Student sees calendar news as cards on their Home page | "New event: Deloitte PPT" | Student | Feed | ❌ Needs real project: the cards work in the POC; Student 2.0's Home feed is in the real project |
| 28 | Student clicks an event on the website to see all its details | — | Student | Event | ✅ Done |
| 29 | Student taps an event in the mobile app to see all its details | — | Student | Event | ❌ Needs real project: the Student mobile app |
| 30 | Student adds a reminder that only they can see | "Revise DBMS at 6 PM" | Student | Reminder | ✅ Done |
| 31 | Student changes their reminder | — | Student | Reminder | ✅ Done |
| 32 | Student deletes their reminder | — | Student | Reminder | ✅ Done |
| 33 | Student gets an alert at the time they set on their reminder | 1 hour before | Student | Reminder | ❌ Half done: bell 🔔 works; phone notification needs the real project (mobile app) |
| 34 | After login, a pop-up asks the student about upcoming outside events | "Any interview coming up?" | Student | External | ❌ Not done: can be built in the POC; not built yet |
| 35 | Student adds an event from outside the college | A hackathon, an exam, an outside interview | Student | External | ❌ Half done: works today as a My Reminder; no end time, event kind or place / link yet |
| 36 | Student changes their outside event | — | Student | External | ❌ Half done: works today as a My Reminder; its own type can still be built in the POC |
| 37 | Student deletes their outside event | — | Student | External | ❌ Half done: works today as a My Reminder; its own type can still be built in the POC |
| 38 | Student sees their outside events on the calendar | — | Student | External | ❌ Half done: shows as a My Reminder, not with its own colour and label yet |
| 39 | Student gets a message when a new event is made for them | "New event: Deloitte PPT" | Student | Bell | ❌ Half done: bell 🔔 works; phone notification and email need the real project (mobile app, mail service) |
| 40 | Student gets a message when their event is changed | "Time changed to 3 PM" | Student | Bell | ❌ Half done: bell 🔔 works; phone notification and email need the real project (mobile app, mail service) |
| 41 | Student gets a message when their event is cancelled | "Cancelled: company withdrew" | Student | Bell | ❌ Half done: bell 🔔 works; phone notification and email need the real project (mobile app, mail service) |
| 42 | Student gets a message when a job's last date to apply is near | "Infosys closes in 2 days" | Student | Bell | ❌ Half done: bell 🔔 works; phone notification needs the real project (mobile app) |
| 43 | Student gets an automatic reminder before an event | 1 day before and 1 hour before | Student | Nudge | ❌ Half done: bell 🔔 works; phone notification needs the real project (mobile app) |
| 44 | Student gets an automatic reminder before a job's last date to apply | 2 days before and on the last day | Student | Nudge | ❌ Half done: bell 🔔 works; phone notification needs the real project (mobile app) |
| 45 | Student gets an automatic reminder on the morning of an online test | 8 AM on the test day | Student | Nudge | ❌ Half done: bell 🔔 works; phone notification needs the real project (mobile app) |
| 46 | Student gets a reminder before their outside event | — | Student | External | ❌ Half done: works today as a My Reminder; its own type can still be built in the POC |
| 47 | Student sees calendar messages in the mobile app's Notifications screen | — | Student | Bell | ❌ Needs real project: the Student mobile app |
| 48 | Admin sets how early automatic reminders are sent | 1 day and 1 hour before | Admin | Settings | ✅ Done |
| 49 | Admin sets how many automatic reminders a student can get in one day | At most 3 a day | Admin | Settings | ✅ Done |
| 50 | Admin sets night hours when no reminders are sent | 10 PM to 7 AM | Admin | Settings | ✅ Done |
| 51 | Admin turns the after-login pop-up on or off | — | Admin | Settings | ❌ Not done: can be built in the POC; not built yet |
| 52 | Admin sets the rules for automatic reminders | Daily limit, night hours, which goes first | Admin | Settings | ✅ Done |
| 53 | When an event's date changes, its automatic reminders move to the new date | 5 Nov → 7 Nov | System | Nudge | ✅ Done |
| 54 | When an event is cancelled, its automatic reminders are not sent | — | System | Nudge | ✅ Done |
| 55 | Student and TPO see a job's last date to apply; TPO also sees who applied | "40 applied · 20 not applied" | TPO, Student | Deadline | ✅ Done: uses sample jobs in the POC; the real Jobs service plugs in later |
| 56 | Student clicks a job's last date on the calendar to open that job | "View & Apply" button | Student | Deadline | ❌ Needs real project: opens the POC's Jobs list; a job's own page is in Student 2.0 |
| 57 | Student applies for the job right inside the calendar | An "Apply" button in the event | Student | Deadline | ❌ Needs real project: applying happens in Student 2.0's Jobs |
| 58 | TPO sees who created an event and what was changed later | "Created by Ravi on 2 Oct" | TPO | Event | ✅ Done |
| 59 | Each person sees only the events meant for them, checked on the server | Other batches' events and others' reminders are never sent to the browser | System | Calendar | ✅ Done |
| 60 | Only the TPO who created an event can change or cancel it | Other TPOs can only view it | System | Event | ✅ Done |

---

## Part B: Important use cases we added

| # | Use case | Example | Who | Type | Status |
|---|---|---|---|---|---|
| 61 | TPO or student makes an event or reminder repeat | Every Monday at 10 AM | TPO, Student | Event, Reminder | ✅ Done |
| 62 | TPO deletes a cancelled event forever | — | TPO | Event | ✅ Done |
| 63 | TPO gets a warning when the new event is at the same time as another | "2 events at this time" | TPO | Event | ✅ Done |
| 64 | When a job changes, its last date on the calendar changes too | New last date, or job closed | System | Deadline | ✅ Done: uses sample jobs in the POC; the real Jobs service plugs in later |
| 65 | Students get a message when a new job is posted | "New job: Infosys" | TPO → Student | Bell | ❌ Needs real project: job posting is in TPO 2.0 |
| 66 | A job's interview rounds show on the calendar of the students in that round | "Infosys Technical Round, 12 Nov" | TPO → Student | Event (new) | ❌ Needs real project: hiring rounds are in the real Jobs service |
| 67 | Student sees their offer reply date and joining date on the calendar | "Join on 1 July" | Student | Event (new) | ❌ Needs real project: offers and joining dates are in the real Jobs service |
| 68 | Student adds an event for a job, course or mock interview on 7Seers | "Mock interview for TCS, 6 PM" | Student | External | ❌ Needs real project: jobs, courses, cohorts and mock interviews are in Student 2.0 |
| 69 | An "Add to calendar" button on the job, course, cohort, mock interview and test pages | — | Student | External | ❌ Needs real project: the buttons go on Student 2.0's pages |
| 70 | Student clicks the event to open that job, course or mock interview, and sees their progress | "Course 60% done" | Student | External | ❌ Needs real project: jobs, courses, cohorts and mock interviews are in Student 2.0 |
| 71 | The event is ticked by itself when the student finishes the work | Mock interview finished ✓ | Student | External | ❌ Needs real project: jobs, courses, cohorts and mock interviews are in Student 2.0 |
| 72 | Interview rounds, cohort dates and course dates appear on the student's calendar by themselves | "Cohort test closes 15 Nov" | System | External | ❌ Needs real project: jobs, courses, cohorts and mock interviews are in Student 2.0 |
| 73 | Admin turns outside events on or off and sets how many a student can add | — | Admin | Settings | ❌ Not done: can be built in the POC; not built yet |
| 74 | TPO or student sees the 7Seers calendar inside Google Calendar or Outlook | Using a private link | TPO, Student | Calendar | ✅ Done |
| 75 | Everyone sees times in their own time zone | A student in the US sees US time | TPO, Student | Calendar | ✅ Done |
| 76 | Students added to or removed from an event get a message | "No longer applicable" | TPO | Bell | ❌ Half done: bell 🔔 works; phone notification and email need the real project (mobile app, mail service) |
| 77 | If a message fails to send, the system tries again and tells the support team | — | System | Bell | ❌ Not done: can be built in the POC; not built yet |
| 78 | Student sees automatic reminders on the calendar and can open them | A purple "Reminder" | Student | Nudge | ✅ Done |
| 79 | Student sees automatic reminders as cards on their Home page | "Event Tomorrow" | Student | Feed | ❌ Needs real project: the cards work in the POC; Student 2.0's Home feed is in the real project |
| 80 | Student sees automatic reminders in the mobile app | On the calendar, in Notifications, as a phone alert | Student | Nudge | ❌ Needs real project: the Student mobile app |

---

## System reminder ("nudge") screens in `docs/requirements/`

A **nudge** is a reminder the system sends by itself, for example "Deloitte PPT starts in 1 hour".
This table lists every screen in the UI spec that shows a nudge.

| Screen | What you see | Use case | Status |
|---|---|---|---|
| S-03 Home feed | Cards: "Event Tomorrow", "In 1 Hour", "Applications Closing", "Last Day", "Online Test Today" | #79 | ❌ Needs real project (Student 2.0 Home) |
| S-04 Month view | A purple "Reminder" on the day it was sent | #78 | ✅ Done |
| S-04a List view | A "Reminder" row, e.g. "Deloitte PPT in 1 hour" | #78 | ✅ Done |
| S-05c Nudge details | The message, the event or job it is about, and a button to open it | #78 | ✅ Done |
| S-08 Bell | Nudges in the bell | #43–45 | ✅ Done |
| M-03 / M-03a Mobile calendar | Nudges in the mobile list and month view | #80 | ❌ Needs real project (mobile app) |
| M-04 Mobile details | Nudge details on mobile | #80 | ❌ Needs real project (mobile app) |
| M-06 Mobile notifications | Nudges in the mobile notifications screen | #47, #80 | ❌ Needs real project (mobile app) |
| M-07 Push | A push message on the phone | #43–45, #80 | ❌ Needs real project (mobile app) |
| A-01 Admin settings | When nudges are sent, how many per day, quiet hours | #48–50 | ✅ Done |

The nudge rules (daily limit, quiet hours, moving or stopping nudges when an event changes) are in #52–54. All are ✅ Done.
