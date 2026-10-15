# High Level Document - Campus Calendar

| Field | Value |
|-------|-------|
| Feature | Campus Calendar |
| Portals | TPO Portal · Student Portal · Student Mobile App · Super Admin Portal (settings only) |
| Status | Draft |
| Date  | 2026-10-05 |
| Detailed docs | BRD - Campus Calendar v1.0 · UI Spec - Campus Calendar v1.0 |
| Reviewed by | Ritesh Saraf / Kamalpreet Saluja |
| Feature flag | Default ON for all orgs |


---

## 1. What is it?

One shared place where **TPOs plan and publish placement events**, and **every student sees only the activities meant for them**, on web and mobile. Both **TPOs and students can set their own private reminders**. It replaces WhatsApp groups, email chains and notice boards.


---

## 2. Why are we building it?

| Today | With Campus Calendar |
|-------|----------------------|
| Events get buried in WhatsApp and email | Every event lands on the right student's calendar |
| No targeting by course, batch or department | Events reach only the intended students |
| Application deadlines are hidden in job details | Deadlines appear on the calendar automatically |
| Changes and cancellations don't reach students | Students are informed instantly |
| TPOs can't see each other's plans | One shared calendar for all TPOs |
| No place for personal follow-ups | TPOs and students add private reminders to their own calendar |


---

## 3. Who uses it?

| User | Role |
|------|------|
| **TPO** | Creates and manages events, sees the whole college calendar, adds private reminders |
| **Student** | Views their calendar, adds private reminders, receives updates |
| **Super Admin** | Sets nudge timings, daily limit and quiet hours |


---

## 4. Flow

**TPO Portal**


1. TPO opens **Campus Calendar** from the sidebar (the only entry point).
2. TPO creates any activity from **one Create Event form**; Company is optional.
3. TPO targets the audience (Opportunity Type → Course → Batch → Department) and sees how many students will be notified.
4. Job application deadlines appear on the calendar **automatically**.
5. TPO can edit or cancel the event.
6. TPO adds a private **My Reminder** from the same form; only they can see it.

**Student Portal**


1. Student opens the **Calendar** tab; a dot shows unseen changes.
2. The **Coming Up** card on Home shows the next 3 items.
3. Updates appear as cards in the Home feed.
4. Student views event details and taps **View & Apply** on deadlines.
5. Student sets a private **My Reminder** with **+ Add Reminder**, or taps **Remind me** on any event or deadline.

**Student Mobile App**


1. Student taps the **Calendar icon** next to the bell (no new bottom tab).
2. **Coming Up** card on the Dashboard; Calendar screen in List or Month view.
3. Calendar updates arrive in the Notifications screen and as push notifications.
4. Student sets a private **My Reminder** with **+ Add Reminder**, or taps **Remind me** on any event or deadline.

**Super Admin Portal**


1. Super Admin sets nudge timings, the daily nudge limit and quiet hours.

**In short:** TPO creates event → right students found → calendar updated on web and mobile → students notified → nudges and personal reminders before it happens.


---

## 5. How it works (end to end)

```text
┌────────────────────────────────────────────────┐
│ TPO PORTAL — Campus Calendar                   │
├────────────────────────────────────────────────┤
│ Create Event      Campus job       My Reminder │
│ (one form)        (deadline,       (private)   │
│                    automatic)                  │
└───────────────────────┬────────────────────────┘
                        │
                        ▼
┌────────────────────────────────────────────────┐
│ 7SEERS PLATFORM                                │
├────────────────────────────────────────────────┤
│ Finds the right students                       │
│ Sends notifications (Bell · Push · Email)      │
│ Schedules nudges (reminders)                   │
└───────────────────────┬────────────────────────┘
                        │
                        ▼
┌────────────────────────────────────────────────┐
│ STUDENT PORTAL  ·  STUDENT MOBILE APP          │
├────────────────────────────────────────────────┤
│ Calendar · "Coming Up" card · Feed cards ·     │
│ Notifications · My Reminders                   │
└────────────────────────────────────────────────┘
```


---

## 

## 6. What appears on the calendar

| Item | TPO sees | Student sees (web and mobile) | Colour |
|------|----------|-------------------------------|--------|
| TPO Event | Every event created by any TPO in the college | Only the events targeted to them | Blue   |
| Application Deadline | Last date to apply for every active campus job (automatic) | Jobs they are eligible for and haven't applied to yet; disappears once they apply | Red outline |
| My Reminder | Their own private reminders | Their own private reminders, with an alert at the time they choose | Slate, dashed |
| Nudge | —        | Automatic reminders before events, deadlines and online tests | Purple |
| Cancelled | Cancelled events, kept for reference | Cancelled or no-longer-applicable events, with the reason | Muted, struck through |


---

## 7. Notifications and nudges

* **Notifications:** bell, push and email whenever a TPO creates, updates or cancels an event.
* **Nudges:** before an event, before an application deadline, and on the morning of an online test.
* **My Reminders:** a TPO's reminder shows only on their own calendar and never notifies students. A student's reminder sends a bell and push alert at the time they pick, and doesn't count towards the daily nudge limit.
* **Rules:** max 3 nudges a day, no push during quiet hours, all set by the Super Admin.
