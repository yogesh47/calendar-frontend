# Campus Calendar

## 1. Document Control

| Field | Value |
|-------|-------|
| Version | 1\.0  |
| Status | Draft |
| Date  | 2026-09-26 |
| Sprint Target | \--   |
| Author | Product Team |
| Reviewers | \--   |
| Feature Flags | Default ON for all orgs |
| Portals | TPO Portal + Student Portal + Student Mobile App + Super Admin Portal (settings only) (7Seers) |

### Document Version History

| Document Name: | Campus Calendar |
|----------------|-----------------|
| **Brief Description** | This document defines the Campus Calendar feature of 7Seers. It covers how TPOs create and manage placement events on the TPO Portal, how the application deadline of every campus job is placed on the calendar automatically, how students view their calendar on the Student Portal and the Student Mobile App, private reminders for TPOs and students, event notifications, student nudges, and nudge settings on the Super Admin Portal. |
| **Classification:** | Confidential    |
| **Current Edition:** | Draft           |
| **Document Prepared/Modified By:** | Bhoomi Rai      |
| **Document Review/Approved By:** | Ritesh Saraf    |

**Revision History**

| S. No. | Description of Change | Date of Change | Revision No. |
|--------|-----------------------|----------------|--------------|
| 1      | Initial Draft.        | 2026-09-26     | V1.0         |


---

## 2. Executive Summary

The Campus Calendar gives TPOs a single place inside the TPO Portal to plan, publish and manage every placement event for their college. On the other side, it gives each student one personal calendar, available on both the Student Portal and the Student Mobile App, that brings together every placement activity relevant to them.

Today, TPOs share pre-placement talks, company visits, online assessments, trainings and orientations through WhatsApp groups, email chains and notice boards. Important messages get buried under other conversations, and students miss events they were expected to attend. TPOs also have no dependable way to make sure an announcement reaches only the right batch and department.

The calendar brings together three kinds of items:

* **TPO events:** TPOs create every kind of activity — PPTs, company visits, online assessments, trainings, orientations, practice tests and more — from one **Create Event** form.
* **Application deadlines:** when a TPO posts a campus job, its last date to apply is placed on the calendar automatically. Eligible students who haven't applied yet can see at a glance when each application closes, without the TPO creating anything extra.
* **My Reminders:** private reminders that TPOs and students can add to their own calendars for personal follow-ups.

Every TPO event is targeted through **Opportunity Type → Course → Batch → Department**, and the TPO sees a live count of how many students will be notified before publishing. Whenever a TPO creates, updates or cancels an event, the targeted students see the change on their calendar straight away and are informed through the in-app bell, a mobile push notification and email.

To make sure nothing slips through, the platform also sends students **nudges**: timely, automatic reminders before an event, before an application deadline, and on the morning of an online test. A Super Admin can adjust the timing of these nudges at any time, without any help from engineering.

Because all TPOs in a college share the same calendar, everyone can see what their colleagues have already planned, which avoids duplicate or clashing events.


---

## 3. Problem Statement

### Current State (before this feature)

* TPOs have no way inside the platform to announce placement events such as PPTs, company visits, online assessments, trainings or orientations.
* Event details are shared through WhatsApp groups, email chains and notice boards, where messages are easily buried and students miss events.
* Announcements cannot be targeted by batch, course or department, so some students receive messages that don't concern them while the students who need them miss out.
* The last date to apply for a job is visible only inside the job details. Students get no reminder as the date approaches, and many miss the deadline.
* When an event changes or is cancelled, there is no structured way to tell the affected students, and outdated messages remain in group chats.
* A college usually has 2–3 TPOs who cannot see each other's plans, which leads to duplicate or clashing events.

### Desired State (with this feature)

* TPOs create, edit and cancel placement events from one dedicated Campus Calendar page in the TPO Portal.
* Each event reaches only the students it is meant for, and the TPO sees exactly how many students will be notified before publishing.
* Application deadlines from campus jobs appear on the calendar automatically, so students always know when applications close.
* Students see one clear, colour-coded calendar, on both web and mobile, showing only what is relevant to them.
* Every time an event is created, updated or cancelled, the affected students are informed instantly by bell, push and email.
* Students receive timely reminders before events, deadlines and online tests, and can add reminders of their own.
* All TPOs in a college work from one shared calendar, so plans stay visible and duplicates are avoided.


---

## 4. Scope

### In Scope

* **Campus Calendar page (TPO Portal):** a new sidebar item that opens a calendar with Month, Week and List views, filters, and a colour legend.
* **Single entry point (TPO Portal):** every calendar action happens inside the Campus Calendar page. No calendar buttons or widgets are added to other TPO pages.
* **Create Event:** one form for creating every kind of event, with 8 event types (PPT, Company Visit, Online Assessment, Training/Workshop, Orientation/Info Session, Practice Test, Deadline, Other) plus My Reminder.
* **Target audience:** Opportunity Type (Job / Internship / General) → Course → Batch → Department, with a live count of students who will be notified.
* **Application deadlines on the calendar:** the last date to apply for every active campus job is shown on the calendar automatically.
* **Shared calendar across TPOs:** all TPOs in a college see every event, but only the TPO who created an event can edit or cancel it.
* **Edit Event:** important changes notify students automatically, while minor changes notify them only if the TPO chooses.
* **Cancel Event:** a soft cancel with a mandatory reason. Cancelled events remain visible with a "Cancelled" badge.
* **TPO My Reminder:** a private reminder that appears only on the TPO's own calendar.
* **Student Campus Calendar (Student Portal):** a Calendar tab, a "Coming Up" card on Home, and calendar updates in the Home feed.
* **Student My Reminder:** private reminders on the student's own calendar, with an optional alert.
* **Student Mobile App:** a Calendar icon, a "Coming Up" card on the Dashboard, a Calendar screen, full-screen event details, and calendar updates in the app's Notifications screen.
* **Event notifications:** in-app bell, mobile push and email for every TPO action that affects students.
* **Student nudges:** Event Reminder, Application Deadline Reminder and Online Assessment Day Reminder.
* **Super Admin settings:** nudge timings, the daily nudge limit and quiet hours.


---

## 5. Actors and Access

| Actor | Portal | Campus Calendar Permissions |
|-------|--------|-----------------------------|
| TPO   | TPO Portal | Views all events and application deadlines for their college. Creates events of every type, including My Reminder. Edits and cancels **only the events they created**. Edits and deletes their own My Reminders. |
| Other TPOs (same college) | TPO Portal | View events created by other TPOs in read-only mode. Cannot see other TPOs' My Reminders. |
| Student | Student Portal, Student Mobile App | Views the events targeted to them and the application deadlines of jobs they are eligible for and haven't applied to yet. Views event details in read-only mode. Creates, edits and deletes their own My Reminders. Receives notifications and nudges. |
| Super Admin | Super Admin Portal | Configures nudge timings, the daily nudge limit and quiet hours. Has no access to event content. |
| Admin / Teacher / Publisher | \--    | No Campus Calendar access in v1. |


---

## 6. Functional Requirements

### 6.1 TPO Portal

### FR-CAL-01: Campus Calendar Entry Point

The Campus Calendar is a self-contained module with **one entry point**: the Campus Calendar item in the TPO sidebar. Everything a TPO does with the calendar happens inside this page, and no calendar buttons or widgets are added to any other TPO page.

| Action | Where | Opens |
|--------|-------|-------|
| Open Campus Calendar | Sidebar, placed after Job Listings | Campus Calendar page |
| \+ New Event | Page header | Create Event drawer |
| Click an empty date or time slot | Calendar grid | Create Event drawer with that date and time already filled in |

Acceptance Criteria:

* The sidebar icon shows the tooltip "Campus Calendar", in the same icon-only style as the existing sidebar.
* "+ New Event" is the primary button in the page header.

### FR-CAL-02: Calendar Views and Navigation

The Campus Calendar opens on the current month, and the TPO can switch between three views.

| View | Description |
|------|-------------|
| Month (default) | A 7-day grid (Mon–Sun). Each date shows up to 3 items, followed by "+N more", which opens the full list for that day. |
| Week | A 7-day time grid with an all-day row at the top. It shows 8:00 AM – 7:00 PM by default, and other hours can be reached by scrolling. |
| List | All items for the selected month, grouped by date. |

Acceptance Criteria:

* **Navigation:** Previous, Today and Next buttons, along with a Month / Week / List toggle.
* **Today:** today's date is always highlighted.
* **Clicking the grid:** clicking an empty date or time slot opens the Create Event drawer with that date and time already filled in. Clicking an item opens its detail panel (FR-CAL-13).
* **Long titles:** titles that don't fit are shortened on the tile, and the full title appears on hover.
* **Empty month:** the message "No events this month." is shown with a "+ New Event" button.
* **No filter matches:** the message "No events match these filters." is shown with a "Clear filters" link.
* **Error:** the message "Couldn't load the calendar." is shown with a Retry button.
* **Loading:** a skeleton loader is shown while the calendar loads.

### FR-CAL-03: Calendar Item Types and Colours

Each type of item has its own colour and label, so the calendar can be read at a glance.

| Item | Source | Colour | Label Shown | Visible To |
|------|--------|--------|-------------|------------|
| TPO Event | Created by a TPO | Blue   | Event type (e.g. "PPT") | All TPOs in the college; targeted students |
| Application Deadline | The last date to apply for an active campus job (FR-CAL-08) | Red outline | "Deadline"  | All TPOs in the college; eligible students who haven't applied |
| My Reminder | Created by a TPO or a student | Slate, dashed border | "My Reminder" | Only the person who created it |
| Nudge | Sent by the system (FR-CAL-25) | Purple | "Reminder"  | Only the individual student |
| Cancelled | A cancelled TPO Event | Muted, struck through | "Cancelled" | The same audience as the original event |

Acceptance Criteria:

* **Labels:** every item shows a text label as well as its colour, so colour is never the only way to tell items apart.
* **Tiles:** each tile uses a coloured left border rather than a full colour fill, which keeps busy days easy to read.
* **Legend:** a colour legend is always shown below the calendar.

### FR-CAL-04: TPO Calendar Filters

Filters help a TPO focus on the events that matter to them at a given moment.

| Filter | Type | Default |
|--------|------|---------|
| Opportunity Type | Multi-select (Job / Internship / General) | All     |
| Course | Multi-select | All     |
| Batch  | Multi-select | All     |
| Department | Multi-select | All     |
| Event Type | Multi-select (8 event types + Deadline) | All     |
| Company | Multi-select (from the company list) | All     |
| Created by me | Toggle | Off     |

Acceptance Criteria:

* Filters work together, so only items that match every selected filter are shown.
* A count of active filters is shown whenever any filter is applied.
* The TPO's own My Reminders always stay visible, whatever filters are applied.
* Selected filters stay in place when the TPO switches between Month, Week and List views.

### FR-CAL-05: Create Event

A TPO creates every kind of event — a PPT, a company visit, an orientation, a training session or anything else — from **one Create Event drawer**, which slides in from the right side of the screen.

| Field | Type | Mandatory | Rules |
|-------|------|-----------|-------|
| Event Type | Dropdown | Yes       | See FR-CAL-06. Cannot be changed after publishing. |
| Title | Text input | Yes       | Max 120 characters |
| Company | Dropdown (existing company list) | No        | Optional for every event type, since many events (such as orientations or trainings) are not tied to a company |
| Date  | Date picker | Yes       | Today or a future date |
| Start Time | Time picker | Yes (except Deadline, My Reminder) | \--   |
| End Time | Time picker | Yes (except Deadline, My Reminder) | Must be after the Start Time |
| Mode  | Radio (Offline / Online) | Yes (except Deadline, Online Assessment, My Reminder) | \--   |
| Venue | Text input | Yes if Mode = Offline | Max 200 characters |
| Online Platform | Text input (e.g. "Google Meet") | Yes if Mode = Online | No meeting link is collected |
| Target Audience | Audience builder | Yes (except My Reminder) | See FR-CAL-07 |
| Description | Rich text editor | No        | Max 1000 characters |

Acceptance Criteria:

* **Actions:** the drawer offers two actions, Cancel and Publish Event.
* **Company hint:** when the TPO selects a company, a short hint lists any events already planned for that company, for example "Existing Deloitte events: Online Assessment — 2 Oct (Ravi Sharma)". The hint is only for information and never stops the TPO from saving.
* **Live student count:** the line "X students will be notified" updates every time the audience changes.
* **No matching students:** if the selected audience has no students, the count reads "0 students match this audience." and Publish Event is disabled.
* **Missing fields:** an error appears below each required field that is left empty, and Publish Event stays disabled until all of them are filled.
* **Unsaved changes:** if the TPO closes the drawer with unsaved changes, they are asked to confirm before it closes.
* **On publishing:**
  * The event appears on the calendar straight away, in Blue.
  * The targeted students are notified (FR-CAL-24).
  * A confirmation message reads "Event published. X students notified."

### FR-CAL-06: Event Types

The event type decides which fields appear in the Create Event drawer. All types use the same drawer.

| Event Type | Timing | Mode / Venue | Notes |
|------------|--------|--------------|-------|
| Pre-Placement Talk (PPT) | Date + Start–End | Required     | \--   |
| Company Visit | Date + Start–End | Required     | \--   |
| Online Assessment | Date + Start–End (the test window) | Not shown    | No test link is collected. Students see: "The test link will be sent to your registered email." |
| Training / Workshop | Date + Start–End | Required     | \--   |
| Orientation / Info Session | Date + Start–End | Required     | \--   |
| Practice Test | Date + Start–End | Required     | A mock test run by the TPO |
| Deadline   | Date only (all-day) | Not shown    | Shown in the all-day row in Week view |
| Other      | Date + Start–End | Required     | For any activity not covered by the types above |
| My Reminder | Date + optional Time | Not shown    | Private to the TPO. See FR-CAL-12. |

Acceptance Criteria:

* Every event type is created from the same Create Event drawer (FR-CAL-05); only the fields shown change with the selected type.

### FR-CAL-07: Target Audience

The TPO chooses who should receive an event by narrowing down step by step: **Opportunity Type → Course → Batch → Department**.

| Level | Type | Rules |
|-------|------|-------|
| Opportunity Type | Radio (Job / Internship / General) | Mandatory. Decides which batches can be selected. |
| Course | Multi-select (e.g. BTech, MBA, MCA) | Mandatory; at least one must be selected |
| Batch (passing year) | Single- or multi-select | **Job:** only the final-year passing batch. **Internship:** pre-final and final-year batches. **General:** any batch. Shown as the passing year with the current year of study, e.g. "2027 (Final year)". |
| Department | Multi-select | Mandatory; at least one must be selected. An "All departments" shortcut is available. |

Acceptance Criteria:

* Events cannot be targeted by section.
* A TPO cannot add or remove individual students; the audience is defined only through these group selections.
* The Course, Batch and Department options come from the students' profiles.
* The live count includes only active students who match every selected level.
* A student whose profile has no batch or department is not included in targeted events.

### FR-CAL-08: Application Deadlines on the Calendar

Every campus job that a TPO posts already has an **Application Expiration Date** — the last date on which students can apply. The calendar picks up this date automatically and shows it as a **Deadline**, so students can see when applications close without the TPO creating a separate event.

Acceptance Criteria:

* **What appears:** for every Active job, an all-day Deadline item appears on its Application Expiration Date, titled "[Company] [Job Title] — Applications close".
* **TPO view:** TPOs see the deadlines of all jobs in their college. The detail shows how many students are eligible, how many have applied, and how many have not applied yet.
* **Student view:** a student sees a deadline only if they are eligible for the job (FR-JP-17) and have not applied yet.
* **After applying:** once a student applies, the deadline disappears from their calendar, and any pending deadline reminders for them are cancelled.
* **Date changed:** if the TPO changes the job's Application Expiration Date, the deadline moves to the new date and its reminders are rescheduled.
* **Job closed:** when a job becomes Inactive, Archived or Draft, its deadline is removed from every calendar.

### FR-CAL-09: Shared Calendar and Ownership

All TPOs in a college work from the same calendar, so everyone can see what has already been planned.

Acceptance Criteria:

* Every TPO in a college sees all TPO Events and Application Deadlines for that college.
* A TPO's My Reminders are visible only to that TPO.
* Only the TPO who created an event can edit or cancel it. Other TPOs see the event details without any action buttons, along with the note "View only. Only [Creator Name] can edit or cancel this event."
* There is no strict duplicate check. Shared visibility and the company hint (FR-CAL-05) are what help TPOs avoid duplicates.
* Every event shows "Created by [TPO Name] · [date, time]" and "Last updated [date, time]".

### FR-CAL-10: Edit Event

A TPO can update an event they created, and the affected students are kept informed.

Acceptance Criteria:

* **Who can edit:** only the TPO who created the event. Every field except Event Type can be changed.
* **Important changes:** changes to Date, Start Time, End Time, Mode, Venue / Platform or Target Audience always notify the affected students.
* **Minor changes:** changes to Title, Description or Company show an unticked checkbox, "Notify students about this change". Students are notified only if the TPO ticks it.
* **When the audience changes,** a summary appears before saving so the TPO knows exactly who will be affected:
  * **Updated:** groups that remain in the audience, with a student count.
  * **Added:** new groups, with a student count.
  * **Removed:** groups taken out, with a student count.
  * An optional "Reason for change" field; whatever the TPO writes here is included in the notification.
* **Notifications on saving:**
  * Students who remain: "[Title] has been updated: [what changed]."
  * Students who are added: "New event: [Title] on [Date], [Time]."
  * Students who are removed: "[Title] on [Date] no longer applies to you. [Reason, if given]."
* **Save button:** reads "Save & Notify X" when notifications will be sent, and "Save Changes" otherwise.
* **Confirmation:** a message reads "Changes saved. X students notified."
* **Past events:** an event cannot be edited once its end time has passed.

### FR-CAL-11: Cancel Event

A TPO can cancel an event they created, and the affected students are informed with the reason.

Acceptance Criteria:

* **Who and when:** only the TPO who created the event can cancel it, and only before its end time.
* **Cancel dialog:** shows the event title, the date, and "X students will be notified."
* **Reason (mandatory):** Postponed / Company Withdrew / Created by Mistake / Other. Choosing Other requires a short explanation (max 200 characters).
* **Postponed:** shows the tip "You can edit the date instead of cancelling." with an "Edit date instead" link. The TPO can still go ahead and cancel.
* **After cancelling (for every reason except Created by Mistake):**
  * The event stays on the calendar, muted and struck through, with a "Cancelled" badge.
  * Students are notified: "[Title] on [Date] has been cancelled. Reason: [Reason]."
* **Created by Mistake:**
  * The event is removed from students' calendars.
  * Students are notified: "Please ignore the earlier notification about [Title]."
  * TPOs still see it on their calendar, marked as Cancelled.
* **Reminders:** any pending student reminders for the event are cancelled.
* **No reactivation:** a cancelled event cannot be brought back. If the event is needed again, the TPO creates a new one.
* **Record kept:** a cancelled event is kept for audit purposes, and published events can never be permanently deleted.
* **Confirmation:** a message reads "Event cancelled. X students notified."

### FR-CAL-12: TPO My Reminder

A TPO can add private reminders to their own calendar, for example "Call TCS HR for results".

Acceptance Criteria:

* **Creating a reminder:** from the same Create Event drawer, by choosing My Reminder as the Event Type.
* **Fields:** Title (mandatory, max 120 characters), Date (mandatory), Time (optional) and Note (optional, max 500 characters).
* **Privacy message:** the drawer shows "Only you can see this. No students are notified."
* **Hidden fields:** the audience, mode and venue fields are not shown.
* **Display:** shown in Slate with a dashed border and the label "My Reminder", on the creator's calendar only.
* **Notifications:** no notification is ever sent to students.
* **Edit and delete:** the TPO can edit or delete a reminder; there is no Cancel option. Deleting asks for confirmation: "Delete this reminder?"
* **Past dates:** reminders can be created for past dates.

### FR-CAL-13: Event Detail Panel (TPO)

Clicking any item on the calendar opens a detail panel on the right, while the calendar stays visible on the left.

| Item | Details Shown | Actions |
|------|---------------|---------|
| TPO Event (creator) | Type, title, date and time, mode and venue, company (if any), audience (e.g. "Job · 2027 · BTech · CSE, IT"), number of students notified, created by and last updated, description | Edit Event, Cancel Event |
| TPO Event (other TPO) | Same as above | None (view-only note) |
| Cancelled Event | Same as above, plus "Cancelled by [Name] · [Date]" and the reason | None    |
| Application Deadline | "Auto from job" badge, job, date, and counts of eligible, applied and not-applied students | Go to Job |
| My Reminder | Title, date, time, note | Edit, Delete |

Acceptance Criteria:

* Sections without content (for example, an empty description) are hidden.
* If the event is cancelled while the panel is open, the panel refreshes to show its Cancelled state.

### 6.2 Student Portal

### FR-CAL-14: Student Campus Calendar

Students get their own calendar on the Student Portal, along with quick views on the Home page.

Acceptance Criteria:

* **Calendar tab:** a new Calendar tab is added to the top navigation, after Jobs Board (Home · Jobs Board · Calendar · Profile).
* **Red dot:** the Calendar tab shows a red dot whenever there is a new, updated, cancelled or no-longer-applicable item the student hasn't seen. The dot clears when the student opens the calendar.
* **Coming Up card:** a new card at the top of the right column on Home, above Available Opportunities. It shows the next 3 items, labelled Today, Tomorrow or with the date, and a "View all" link. Cancelled and no-longer-applicable items are not shown here.
* **Home feed:** calendar notifications and nudges also appear as cards in the Home feed (FR-CAL-18).
* **Views:** Month (default) and List.
* **Navigation:** Previous, Today and Next buttons, with today's date highlighted.
* **Legend:** always shows TPO Event, Deadline, Reminder and My Reminder, each with a text label.
* **Editing:** students cannot create, edit or delete any item, except their own My Reminders (FR-CAL-19).
* **Filters:** there are no filters for students; each student automatically sees only what applies to them (FR-CAL-15).
* **Empty month:** "No events this month. Your TPO will add placement events here."
* **Loading and errors:** a skeleton loader is shown while loading, and a Retry message appears if loading fails.

### FR-CAL-15: Student Visibility Rules

Each student's calendar is built automatically from the items that apply to them.

| Item | Shown When |
|------|------------|
| TPO Event | The student's Course, Batch and Department match the event's audience |
| Application Deadline | The student is eligible for the job, the job is Active, and the student hasn't applied yet |
| Nudge | It was generated for that student |
| My Reminder | The student created it |
| Cancelled Event | The student was in the audience when it was cancelled (except Created by Mistake) |
| No Longer Applicable | The student was removed from the event's audience |

Acceptance Criteria:

* Visibility is checked on the server. A student can never see an event from another college or outside their audience; any such attempt is blocked (403).
* A student whose profile has no batch or department sees only General events sent to all departments and batches, the application deadlines that apply to them, and their own reminders.

### FR-CAL-16: Student Event Detail

Clicking an item opens a read-only detail panel on the right.

| Item | Details Shown | Actions |
|------|---------------|---------|
| TPO Event | Type, title, date and time, mode and venue or platform, company (if any), organised by (TPO name), description | Remind me |
| Online Assessment | As above, plus "The test link will be sent to your registered email." | Remind me |
| Application Deadline | Job title, company, "Applications close on [Date]" | View & Apply, Remind me |
| Nudge | The reminder message, the related event or job, and the date | Go to the related event or job |
| My Reminder | Title, date, time, note, and linked item (if any) | Edit, Delete |

Acceptance Criteria:

* Going back returns the student to the same month and view they were on.
* Sections without content are hidden.

### FR-CAL-17: Event Status Display for Students

Students can always tell when something has changed.

| Status | How It Appears |
|--------|----------------|
| Updated | An "Updated" badge on the tile and in the detail for 48 hours after an important change. The detail explains: "Updated on [date]: [what changed]". |
| Cancelled | A muted, struck-through tile with a "Cancelled" badge; the detail shows the reason. |
| No Longer Applicable | A muted, struck-through tile with a "No longer applicable" badge; the detail shows "This event no longer applies to you." along with the reason, if one was given. |
| Past event | Shown in a muted style once its end time has passed. |

### FR-CAL-18: Home Feed Cards

Calendar notifications and nudges also appear in the Student Home feed ("Updates, personalised for you"), alongside the existing Interview Feedback, Bookmarked Jobs and Off Campus Job cards.

| Card Label | Source | CTA |
|------------|--------|-----|
| New Event  | An event was created, or the student was added to its audience | View on Calendar |
| Event Updated | An important change was made (the card shows what changed) | View on Calendar |
| Event Cancelled | The event was cancelled (not as Created by Mistake), with the reason | \-- |
| No Longer Applicable | The student was removed from the audience | \-- |
| Event Tomorrow / In 1 Hour | Nudge N-S1 | View on Calendar |
| Applications Closing / Last Day | Nudge N-S2 | View & Apply |
| Online Test Today | Nudge N-S3 | View on Calendar |

Acceptance Criteria:

* Cards are shown newest first, mixed in with the existing feed cards.
* Deadline cards show the existing JRI Match strip for the related job.
* When an event is cancelled as Created by Mistake, its original "New Event" card is removed and no new card is added.
* My Reminders do not create feed cards.

### FR-CAL-19: Student My Reminder

A student can add private reminders to their own calendar, for example "Revise DBMS before the TCS test" or "Submit documents to the TPO office".

| Field | Type | Mandatory | Rules |
|-------|------|-----------|-------|
| Title | Text input | Yes       | Max 120 characters |
| Date  | Date picker | Yes       | Today or a future date |
| Time  | Time picker | No        | If left empty, the reminder covers the whole day |
| Remind me | Dropdown (None / At the time / 15 min before / 1 hour before / 1 day before) | No        | Defaults to 1 hour before if a time is set, or 9:00 AM on the day if not |
| Note  | Text | No        | Max 500 characters |
| Linked item | Filled in automatically | No        | Set only when the reminder is created from an event or deadline |

Acceptance Criteria:

* **Ways to create a reminder:**
  * "+ Add Reminder" on the Calendar page.
  * Clicking an empty date on the calendar.
  * **"Remind me"** on any event or deadline. This fills in the title and the linked item, and sets Remind me to "1 hour before".
* **Privacy:** only the student who created the reminder can see it.
* **Display:** shown in Slate with a dashed border and the label "My Reminder", in Month and List views and in the Coming Up card.
* **Alert:** at the chosen time, the student receives a bell and push notification: "Reminder: [Title]". Tapping it opens the reminder.
* **Nudge rules:** student reminders do **not** count towards the daily nudge limit, and quiet hours don't apply to them, because the student picked the time themselves.
* **When the linked event changes:**
  * **Date changed:** the reminder stays on its original date, and its detail shows "The linked event has moved to [new date]." with an "Update reminder" link.
  * **Cancelled or no longer applicable:** the reminder stays, but its alert is not sent, and the detail shows "The linked event was cancelled."
* **Edit and delete:** the student can edit or delete a reminder at any time. Deleting asks for confirmation: "Delete this reminder?" There is no Cancel option.
* **Limit:** a student can have up to 50 upcoming reminders. At the limit, "+ Add Reminder" shows "You've reached 50 upcoming reminders. Delete some to add more."
* **Past reminders:** remain visible in a muted style and can be deleted.

### 6.3 Student Mobile App

The Student Mobile App has a bottom navigation bar (Dashboard · Jobs · Internships · Learn · Resumes) and a bell icon at the top right of each main screen. The Campus Calendar is added to the app **without adding a new tab to the bottom navigation**. The content, visibility rules and behaviour are the same as on the Student Portal (FR-CAL-14 to FR-CAL-19); this section covers only what is different on mobile.

### FR-CAL-20: Mobile Entry Points

| Entry Point | Location | Opens |
|-------------|----------|-------|
| Calendar icon | Top bar of each main screen (Dashboard, Jobs, Internships, Learn, Resumes), to the left of the bell | Calendar screen (FR-CAL-21) |
| Coming Up card | Dashboard, below the stats tiles (Assessments Taken · Jobs Applied · Mock Interviews Taken) and above "Your Next Career Move" | Shows the next 3 items; tapping an item opens its details, and "View all" opens the Calendar screen |
| Notifications | The existing Notifications screen, opened from the bell | Calendar notifications (FR-CAL-23) |
| Push notification | The phone's notification tray | The related event or reminder |

Acceptance Criteria:

* No new tab is added to the bottom navigation.
* **Red dot:** the Calendar icon shows a red dot for unseen changes, following the same rule as FR-CAL-14.
* **Coming Up card:** each item shows a coloured left bar, the type label, the title, and Today / Tomorrow or the date, along with the time and venue. Cancelled and no-longer-applicable items are not shown. When there is nothing upcoming, the card reads "Nothing coming up. Your TPO will add placement events here."

### FR-CAL-21: Mobile Calendar Screen

| Element | Behaviour |
|---------|-----------|
| Header  | Back arrow, the title "Calendar", and the bell icon |
| Month navigation | "‹ September 2026 ›" |
| View toggle | **List (default)** / Month |
| List view | Items are grouped under date headers (TODAY, then each date), in the same style as the existing Notifications screen. Each row shows the coloured left bar, type label, title, time and venue. Deadline rows include an **Apply** button. |
| Month view | A compact grid with up to 3 coloured dots under each date that has items. Tapping a date lists that day's items below the grid. |
| Add Reminder | A "+ Add Reminder" button (FR-CAL-19) |

Acceptance Criteria:

* **List view:** opens at today's date for the current month.
* **Status badges:** shown in the same way as FR-CAL-17.
* **Empty month:** "No events this month. Your TPO will add placement events here."
* **Loading and errors:** a skeleton loader is shown while loading; if loading fails, "Couldn't load your calendar." is shown with a Retry button.

### FR-CAL-22: Mobile Event Detail

Acceptance Criteria:

* Tapping an item opens a **full-screen** detail with the same information as FR-CAL-16.
* The main action sits in a button fixed to the bottom of the screen: **View & Apply** for deadlines and **Remind me** for events.
* The back arrow returns the student to the same view, month and scroll position.
* If the event was cancelled as Created by Mistake, the screen shows "This event is no longer available."

### FR-CAL-23: Mobile Notifications and Push

Acceptance Criteria:

* **Notifications screen:**
  * Calendar notifications appear in the existing Notifications screen and follow its current layout: Recent / All tabs, grouping by date, an unread dot, and "Mark all as read".
  * Each calendar notification uses a calendar icon, so it stands apart from the existing mock interview and job notifications.
  * Messages follow the existing style, with the key item highlighted, for example "**Deloitte Pre-Placement Talk** is scheduled on Mon, 28 Sep, 10:00 AM."
  * Tapping a notification opens the related details and marks it as read.
* **Push notifications:**
  * Use the same wording as FR-CAL-24 (notifications) and FR-CAL-25 (nudges).
  * Tapping one opens the related details directly.
  * Quiet hours and the daily nudge limit (FR-CAL-26) apply.

### 6.4 Notifications

### FR-CAL-24: Event Notifications

Whenever a TPO action affects students, those students are notified and see the change on their calendar.

| Trigger | Bell | Push | Email | Message |
|---------|------|------|-------|---------|
| Event created | ✓    | ✓    | ✓     | "New event: [Title] on [Date], [Time]. Check your Campus Calendar." |
| Important update | ✓    | ✓    | ✓     | "[Title] has been updated: [what changed]." |
| Minor update (if the TPO chooses to notify) | ✓    | \--  | ✓     | "[Title] details have been updated." |
| Added to audience | ✓    | ✓    | ✓     | "New event: [Title] on [Date], [Time]." |
| Removed from audience | ✓    | ✓    | ✓     | "[Title] on [Date] no longer applies to you. [Reason]" |
| Cancelled | ✓    | ✓    | ✓     | "[Title] on [Date] has been cancelled. Reason: [Reason]." |
| Cancelled — Created by Mistake | ✓    | \--  | ✓     | "Please ignore the earlier notification about [Title]." |

Acceptance Criteria:

* Tapping a bell or push notification opens the related item on the student's calendar.
* Notifications are sent in the background, so the TPO never has to wait.
* Every notification goes out within 60 seconds of the TPO's action. Large audiences are notified in batches of 500.
* If the notification service is unavailable, the TPO's change is still saved and the notifications are retried up to 5 times. If they still fail, the issue is flagged to the operations team.
* My Reminders never notify anyone other than their creator (FR-CAL-19).
* WhatsApp is not used in v1.

### 6.5 Student Nudges

### FR-CAL-25: Student Nudges

Nudges are automatic reminders sent to students at the right moment, based on time and on where the student stands. They are separate from event notifications, which are triggered by TPO actions.

| ID  | Nudge | Default Timing | Applies To | Channels | Message |
|-----|-------|----------------|------------|----------|---------|
| N-S1 | Event Reminder | 1 day before and 1 hour before the event starts | Students in the audience of a TPO Event | Bell, Push | "Reminder: [Title] tomorrow at [Time] · [Venue]" / "[Title] starts in 1 hour · [Venue]" |
| N-S2 | Application Deadline Reminder | 2 days before and on the day the applications close | Eligible students who haven't applied yet | Bell, Push | "[Company] [Job Title] applications close in 2 days" / "Last day to apply: [Company] [Job Title]" |
| N-S3 | Online Assessment Day | 8:00 AM on the day of the test | Students in the audience of an Online Assessment | Bell, Push | "Your online test is today ([Start]–[End]). Check your email for the test link." |

Acceptance Criteria:

* Nudges also appear on the student's calendar as purple "Reminder" items, on the day they are sent.
* The timings of N-S1 and N-S2 can be changed by the Super Admin (FR-CAL-27).
* If the time for a nudge has already passed by the time a student becomes eligible for it, that nudge is skipped.

### FR-CAL-26: Nudge Rules

These rules keep nudges helpful rather than overwhelming.

Acceptance Criteria:

* **Daily limit:** a student receives at most 3 nudges a day (configurable). If more are due, the order of priority is Application Deadline > Online Assessment > Event Reminder, and the lower-priority nudges are dropped.
* **Quiet hours:** no push notifications are sent between 10:00 PM and 7:00 AM (configurable). Nudges due during this time are held until 7:00 AM. The exception is the 1-hour Event Reminder, which is still sent if the event itself starts during quiet hours.
* **Only when still relevant:** a nudge is dropped at the moment it would be sent if it no longer applies, for example when:
  * the event has been cancelled;
  * the student has been removed from the audience;
  * the student has already applied (N-S2);
  * the job is no longer Active.
* **No repeats:** the same nudge is never sent twice to the same student for the same item and time.
* **Date changes:** when an event or deadline date changes, its pending nudges are rescheduled for the new date.

### 6.6 Super Admin Portal

### FR-CAL-27: Calendar and Nudge Settings

The Super Admin can fine-tune nudge timings from Super Admin Portal → Platform Settings → Calendar & Nudges.

| Setting | Default | Allowed Values |
|---------|---------|----------------|
| Event Reminder: days before | 1       | 1–30           |
| Event Reminder: hours before | 1       | 1–12           |
| Deadline Reminder: days before | 2       | 1–30           |
| Deadline Reminder: same day | On      | On / Off       |
| Daily nudge limit per student | 3       | 1–10           |
| Quiet hours | 10:00 PM – 7:00 AM | Any time range |

Acceptance Criteria:

* All values must be whole numbers within the allowed range.
* Changes apply only to nudges that haven't been scheduled yet.
* Settings apply to every college; separate settings per college are not part of v1.
* A confirmation message reads "Settings saved."
