# UI Spec - Campus Calendar

| Field | Value |
|-------|-------|
| Companion to | BRD - Campus Calendar v1.0 |
| Portals | TPO Portal · Student Portal · Student Mobile App · Super Admin Portal (settings) |
| Status | Draft |
| Date  | 2026-09-26 |
| Prepared by | Bhoomi Rai |
| Reviewed by | Ritesh Saraf |

> **Wireframe legend:** `▌` coloured left border (event tile) · `▯` deadline outline · `┆` My Reminder (dashed) · `▪` nudge reminder · `░` cancelled / muted · `(●)` selected · `( )` unselected · `[ ]` button · `▾` dropdown · `->` opens something · `(L)` locked · `!` warning · `i` info


---

## 1. Colour and label system

| Item | Colour | Label shown | Seen by |
|------|--------|-------------|---------|
| TPO Event | Blue   | Event type (e.g. "PPT") | All TPOs; targeted students |
| Application Deadline | Red outline | "Deadline"  | All TPOs; eligible students who haven't applied |
| My Reminder | Slate, dashed | "My Reminder" | Only the creator (TPO or student) |
| Nudge | Purple | "Reminder"  | Only the individual student |
| Cancelled | Muted, struck through | "Cancelled" | Same audience as the original event |


---

## 2. TPO Portal

### 2.1 Screen index

| ID  | Screen | Type | BRD |
|-----|--------|------|-----|
| T-01 | Sidebar: Campus Calendar item | Modified | FR-CAL-01 |
| T-02 | Campus Calendar — Month view | New page | FR-CAL-02, 03, 04 |
| T-02a | Week view | New state | FR-CAL-02 |
| T-02b | List view | New state | FR-CAL-02 |
| T-02c | Empty, loading and error states | New state | FR-CAL-02 |
| T-03 | Create Event drawer | New  | FR-CAL-05, 06, 07 |
| T-03a | Online Assessment variant | New state | FR-CAL-06 |
| T-03b | Deadline variant | New state | FR-CAL-06 |
| T-03c | My Reminder variant | New state | FR-CAL-12 |
| T-03d | Validation errors | New state | FR-CAL-05 |
| T-04 | Event detail — creator | New  | FR-CAL-13 |
| T-04a | Event detail — other TPO (view only) | New state | FR-CAL-09 |
| T-04b | Cancelled event detail | New state | FR-CAL-11, 13 |
| T-04c | Application Deadline detail | New  | FR-CAL-08, 13 |
| T-04d | My Reminder detail | New  | FR-CAL-12 |
| T-05 | Edit Event — review changes | New  | FR-CAL-10 |
| T-06 | Cancel Event dialog | New  | FR-CAL-11 |

### T-01 — Sidebar: Campus Calendar item (Modified)

```text
┌────────────────────────────────────────────────┐
│                     [Post A Job]  Bell  Avatar │
├────────────────────────────────────────────────┤
│ Dashboard                                      │
│                                                │
│ Job Listings                                   │
│                                                │
│ Campus Calendar   <-- NEW (only entry point)   │
│                                                │
│ External Jobs                                  │
│                                                │
│ ...                                            │
│                                                │
│ ...                                            │
└────────────────────────────────────────────────┘
```

* The icon shows the tooltip "Campus Calendar", in the same icon-only style as the rest of the sidebar.
* **Nothing is added to the top bar, the Dashboard, Job Listings or any other TPO page.**


---

### T-02 — Campus Calendar: Month view (New page)

**Route:** `/tpo/calendar`

**Header and filters**

```text
┌────────────────────────────────────────────────┐
│ Campus Calendar                                │
│                                  [+ New Event] │
├────────────────────────────────────────────────┤
│ [<]  [Today]  [>]               September 2026 │
│                                                │
│ [Month (●)]    [Week ( )]    [List ( )]        │
├────────────────────────────────────────────────┤
│ Filters                      2 active  [Clear] │
│                                                │
│ ┌────────────┐  ┌────────────┐  ┌────────────┐ │
│ │ Type ▾     │  │ Course ▾   │  │ Batch ▾    │ │
│ └────────────┘  └────────────┘  └────────────┘ │
│ ┌────────────┐  ┌────────────┐  ┌────────────┐ │
│ │ Dept ▾     │  │ Event ▾    │  │ Company ▾  │ │
│ └────────────┘  └────────────┘  └────────────┘ │
│                                                │
│ [ ] Created by me                              │
└────────────────────────────────────────────────┘
```

**Month grid**

```text
┌──────┬──────┬──────┬──────┬──────┬──────┬──────┐
│Mon   │Tue   │Wed   │Thu   │Fri   │Sat   │Sun   │
├──────┼──────┼──────┼──────┼──────┼──────┼──────┤
│21    │22    │23    │24    │25    │26(o) │27    │
│      │▌PPT  │      │▌Visit│▌Test │▌Train│      │
│      │▌PwC  │      │▌Infy │▌TCS  │▌CV   │      │
│      │      │      │┆Remnd│      │      │      │
│      │      │      │┆Call │      │      │      │
├──────┼──────┼──────┼──────┼──────┼──────┼──────┤
│28    │29    │30    │1     │2     │3     │4     │
│▌PPT  │░Cancl│▯Due  │▌Ornt │      │      │      │
│▌Deltt│░Mango│▯Infy │▌Batch│      │      │      │
│      │      │      │▌PPT  │      │      │      │
│      │      │      │+1more│      │      │      │
└──────┴──────┴──────┴──────┴──────┴──────┴──────┘

Legend:
  ▌ Blue   = TPO Event
  ▯ Red    = Application Deadline
  ┆ Slate  = My Reminder
  ░        = Cancelled
  (o)      = Today
```

**Behaviour**

* **Tiles:** each tile has a coloured left border and a type label, so colour is never the only cue.
* **Busy days:** more than 3 items on a date shows **"+N more"**, which opens the full list for that day.
* **Clicking:** an empty date opens T-03 with that date filled in; a tile opens its detail panel (T-04 to T-04d).
* **Filters:** they combine (AND). The TPO's own My Reminders always stay visible. Filters stay applied across Month, Week and List.


---

### T-02a — Week view

```text
┌────────────────────────────────────────────────┐
│ [<]  [Today]  [>]          28 Sep – 4 Oct 2026 │
│                                                │
│ [Month ( )]    [Week (●)]    [List ( )]        │
└────────────────────────────────────────────────┘

┌─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┐
│Time │Mon  │Tue  │Wed  │Thu  │Fri  │Sat  │Sun  │
├─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┤
│AllDy│     │     │▯Infy│     │     │     │     │
│     │     │     │Due  │     │     │     │     │
├─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┤
│8 AM │     │     │     │     │     │     │     │
│9 AM │     │     │     │     │     │     │     │
│10 AM│▌Delo│     │     │▌Ornt│     │     │     │
│11 AM│▌PPT │     │     │▌    │     │     │     │
│12 PM│     │     │     │     │     │     │     │
│1 PM │     │     │     │     │     │     │     │
│...  │     │     │     │     │     │     │     │
│7 PM │     │     │     │     │     │     │     │
└─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┘
```

* **Hours:** 8 AM – 7 PM are shown by default; other hours are reached by scrolling.
* **Tile height:** follows the start and end time. Deadlines sit in the all-day row.


---

### T-02b — List view

```text
┌────────────────────────────────────────────────┐
│ [<]  [Today]  [>]               September 2026 │
│                                                │
│ [Month ( )]    [Week ( )]    [List (●)]        │
├────────────────────────────────────────────────┤
│ TUE 22 SEP                                     │
│                                                │
│ ▌PPT       PwC Pre-Placement Talk           -> │
│            10:00–11:00 · Offline               │
│            Job · 2027 · BTech · CSE, IT        │
│            142 students · by Ravi              │
│                                                │
│ THU 24 SEP                                     │
│                                                │
│ ▌Visit     Infosys Company Visit            -> │
│            14:00–17:00 · Seminar Hall          │
│ ┆Reminder  Call TCS HR for results          -> │
│            15:00                               │
│                                                │
│ TUE 29 SEP                                     │
│                                                │
│ ░Cancelled Mango Insurance PPT              -> │
│            Reason: Company withdrew            │
│                                                │
│ WED 30 SEP                                     │
│                                                │
│ ▯Deadline  Infosys SDE                      -> │
│            Applications close                  │
└────────────────────────────────────────────────┘
```


---

### T-02c — Empty, loading and error states

**Empty month**

```text
┌────────────────────────────────────────────────┐
│ [<]  [Today]  [>]                 October 2026 │
├────────────────────────────────────────────────┤
│                                                │
│   (calendar grid visible, all dates empty)     │
│                                                │
│                                                │
│             No events this month.              │
│                                                │
│                [ + New Event ]                 │
│                                                │
└────────────────────────────────────────────────┘
```

**Loading (skeleton)**

```text
┌────────────────────────────────────────────────┐
│ ░░░░░░░░   ░░░░░░░░░░░░   ░░░░░░░░             │
├────────────────────────────────────────────────┤
│                                                │
│ ░░░░  ░░░░  ░░░░  ░░░░  ░░░░  ░░░░  ░░░░       │
│                                                │
│ ░░░░        ░░░░        ░░░░                   │
│                                                │
│ ░░░░  ░░░░        ░░░░                         │
│                                                │
└────────────────────────────────────────────────┘
```

* **No filter matches:** "No events match these filters. [Clear filters]"
* **Error:** "Couldn't load the calendar. [Retry]"


---

### T-03 — Create Event drawer (right side)

One drawer is used to create every kind of event. Only the fields shown change with the Event Type.

```text
┌────────────────────────────────────────────────┐
│ Create New Event                           [X] │
├────────────────────────────────────────────────┤
│                                                │
│ Event Type *                                   │
│ ┌────────────────────────────────────────────┐ │
│ │ Orientation / Info Session               ▾ │ │
│ └────────────────────────────────────────────┘ │
│                                                │
│ Event Title                                    │
│ ┌────────────────────────────────────────────┐ │
│ │ Placement Orientation — 2027 Batch         │ │
│ └────────────────────────────────────────────┘ │
│ Max 120 characters                             │
│                                                │
│ Company (optional)                             │
│ ┌────────────────────────────────────────────┐ │
│ │ Select company                           ▾ │ │
│ └────────────────────────────────────────────┘ │
│                                                │
│ Date *          Start Time *    End Time *     │
│ ┌────────────┐  ┌────────────┐  ┌────────────┐ │
│ │ 28 Sep 26  │  │ 10:00 AM   │  │ 11:30 AM   │ │
│ └────────────┘  └────────────┘  └────────────┘ │
│                                                │
│ Mode *                                         │
│ (●) Offline        ( ) Online                  │
│                                                │
│ Venue *                                        │
│ ┌────────────────────────────────────────────┐ │
│ │ Auditorium, Block A                        │ │
│ └────────────────────────────────────────────┘ │
│                                                │
│ ── Target Audience * ────────────────────────  │
│                                                │
│ Opportunity Type *                             │
│ ( ) Job     ( ) Internship     (●) General     │
│                                                │
│ Course *                                       │
│ ┌────────────────────────────────────────────┐ │
│ │ BTech, MCA                               ▾ │ │
│ └────────────────────────────────────────────┘ │
│                                                │
│ Batch *                                        │
│ ┌────────────────────────────────────────────┐ │
│ │ 2027 (Final year)                        ▾ │ │
│ └────────────────────────────────────────────┘ │
│                                                │
│ Department *                                   │
│ ┌────────────────────────────────────────────┐ │
│ │ ☑ Computer Science     ☑ Information Tech. │ │
│ │ ☐ Electronics          ☐ Mechanical        │ │
│ │ ☐ Civil                ☐ MBA               │ │
│ │ [ All departments ]                        │ │
│ └────────────────────────────────────────────┘ │
│                                                │
│ i 142 students will be notified                │
│                                                │
│ Description (optional)                         │
│ ┌────────────────────────────────────────────┐ │
│ │ Bring your college ID. Attendance is       │ │
│ │ mandatory for all final-year students.     │ │
│ │                                            │ │
│ └────────────────────────────────────────────┘ │
│ Max 1000 characters  (78 / 1000)               │
│                                                │
│ Linked Job (optional)                 <-- NEW  │
│ [ + Link a Job ]                               │
│ i Students can open this job and apply from    │
│   the event.                                   │
├────────────────────────────────────────────────┤
│ [ Cancel ]                   [ Publish Event ] │
└────────────────────────────────────────────────┘
```

**With a company selected** (shows the company hint)

```text
│ Company (optional)                             │
│ ┌────────────────────────────────────────────┐ │
│ │ Deloitte                                 ▾ │ │
│ └────────────────────────────────────────────┘ │
│ i Existing Deloitte events:                    │
│   - Online Assessment, 2 Oct (Ravi Sharma)     │
```

**Rules**

### Link a Job picker and linked state (New)

**Opened from:** "+ Link a Job" at the bottom of the Create Event drawer (T-03), below Description.

The TPO links a job in one of two ways: by **picking a campus job** from 7Seers, or by **pasting a job link** (for example, a job on the company's careers page).

**Option 1 — Pick a campus job**

```text
┌────────────────────────────────────────────────┐
│ Link a Job                                 [X] │
├────────────────────────────────────────────────┤
│ (●) Campus job        ( ) Paste a job link     │
│                                                │
│ ┌────────────────────────────────────────────┐ │
│ │ Search by company or job title             │ │
│ └────────────────────────────────────────────┘ │
│                                                │
│ ( ) Infosys · Software Development Engineer    │
│     Full Time · Applications close 30 Sep      │
│                                                │
│ (●) Deloitte · Analyst                         │
│     Full Time · Applications close 5 Oct       │
│                                                │
│ ( ) TCS · Digital Intern                       │
│     Internship · Applications close 8 Oct      │
├────────────────────────────────────────────────┤
│ [ Cancel ]                      [ Link Job ]   │
└────────────────────────────────────────────────┘
```

### Option 2 — Paste a job link

```text
┌────────────────────────────────────────────────┐
│ Link a Job                                 [X] │
├────────────────────────────────────────────────┤
│ ( ) Campus job        (●) Paste a job link     │
│                                                │
│ Job Link *                                     │
│ ┌────────────────────────────────────────────┐ │
│ │ https://careers.deloitte.com/jobs/12345    │ │
│ └────────────────────────────────────────────┘ │
│                                                │
│ Job Title *                                    │
│ ┌────────────────────────────────────────────┐ │
│ │ Analyst — Risk Advisory                    │ │
│ └────────────────────────────────────────────┘ │
│                                                │
│ i Students will open this link in a new tab    │
│   and apply on that website.                   │
├────────────────────────────────────────────────┤
│ [ Cancel ]                      [ Link Job ]   │
└────────────────────────────────────────────────┘
```


---

### Invalid link

```text
│ Job Link *                                     │
│ ┌────────────────────────────────────────────┐ │
│ │ deloitte jobs page                         │ │
│ └────────────────────────────────────────────┘ │
│ x Enter a valid link starting with https://    │
│                                                │
│ [ Cancel ]                 [ Link Job ]  (off) │
```

### T-03a — Online Assessment variant

```text
│ Event Type *                                   │
│ ┌────────────────────────────────────────────┐ │
│ │ Online Assessment                        ▾ │ │
│ └────────────────────────────────────────────┘ │
│                                                │
│ Company (optional)                             │
│ ┌────────────────────────────────────────────┐ │
│ │ TCS                                      ▾ │ │
│ └────────────────────────────────────────────┘ │
│                                                │
│ Date *          Start Time *    End Time *     │
│ ┌────────────┐  ┌────────────┐  ┌────────────┐ │
│ │ 2 Oct 26   │  │ 10:00 AM   │  │ 06:00 PM   │ │
│ └────────────┘  └────────────┘  └────────────┘ │
│                                                │
│ ┌────────────────────────────────────────────┐ │
│ │ i No test link is needed here. Students    │ │
│ │   see: "The test link will be sent to your │ │
│ │   registered email."                       │ │
│ └────────────────────────────────────────────┘ │
```

* **No Mode or Venue fields** are shown.
* **Start and End** define the test window.


---

### T-03b — Deadline variant

```text
│ Event Type *                                   │
│ ┌────────────────────────────────────────────┐ │
│ │ Deadline                                 ▾ │ │
│ └────────────────────────────────────────────┘ │
│                                                │
│ Event Title *                                  │
│ ┌────────────────────────────────────────────┐ │
│ │ Submit documents to TPO office             │ │
│ └────────────────────────────────────────────┘ │
│                                                │
│ Date *                                         │
│ ┌────────────────────────────────────────────┐ │
│ │ 3 Oct 26                                   │ │
│ └────────────────────────────────────────────┘ │
│                                                │
│ i All-day item. No time, mode or venue needed. │
```

* Used for TPO-created deadlines (e.g. document submission). Job application deadlines appear automatically (T-04c).


---

### T-03c — My Reminder variant

```text
┌────────────────────────────────────────────────┐
│ Create New Event                           [X] │
├────────────────────────────────────────────────┤
│                                                │
│ Event Type *                                   │
│ ┌────────────────────────────────────────────┐ │
│ │ My Reminder                              ▾ │ │
│ └────────────────────────────────────────────┘ │
│                                                │
│ (L) Only you can see this. No students are     │
│     notified.                                  │
│                                                │
│ Title *                                        │
│ ┌────────────────────────────────────────────┐ │
│ │ Call TCS HR for results                    │ │
│ └────────────────────────────────────────────┘ │
│                                                │
│ Date *                  Time (optional)        │
│ ┌────────────────────┐  ┌────────────────────┐ │
│ │ 24 Sep 26          │  │ 03:00 PM           │ │
│ └────────────────────┘  └────────────────────┘ │
│                                                │
│ Note (optional)                                │
│ ┌────────────────────────────────────────────┐ │
│ │                                            │ │
│ │                                            │ │
│ └────────────────────────────────────────────┘ │
│ Max 500 characters                             │
├────────────────────────────────────────────────┤
│ [ Cancel ]                   [ Save Reminder ] │
└────────────────────────────────────────────────┘
```

* Audience, Mode and Venue are hidden. Past dates are allowed.


---

### T-03d — Validation errors

```text
│ Event Title *                                  │
│ ┌────────────────────────────────────────────┐ │
│ │                                            │ │
│ └────────────────────────────────────────────┘ │
│ x Title is required.                           │
│                                                │
│ Date *          Start Time *    End Time *     │
│ ┌────────────┐  ┌────────────┐  ┌────────────┐ │
│ │ 20 Sep 26  │  │ 11:00 AM   │  │ 10:00 AM   │ │
│ └────────────┘  └────────────┘  └────────────┘ │
│ x Date must be today or later.                 │
│ x End time must be after start time.           │
│                                                │
│ Department *                                   │
│ ┌────────────────────────────────────────────┐ │
│ │ Select departments                         │ │
│ └────────────────────────────────────────────┘ │
│ x Select at least one department.              │
│                                                │
│ ! 0 students match this audience.              │
│                                                │
│ [ Cancel ]            [ Publish Event ]  (off) │
```

* Errors show under each field. Publish Event stays disabled until every error is fixed, and while the audience has 0 students.


---

### T-04 — Event detail panel: creator

```text
┌────────────────────────────────────────────────┐
│ ▌PPT                                       [X] │
│ Deloitte Pre-Placement Talk                    │
├────────────────────────────────────────────────┤
│                                                │
│ Date:      Mon, 28 Sep 2026                    │
│ Time:      10:00 – 11:30 AM                    │
│ Venue:     Offline · Auditorium, Block A       │
│ Company:   Deloitte                            │
│ Audience:  Job · 2027 · BTech · CSE, IT        │
│ Students:  142 notified                        │
│                                                │
│ Created by you · 20 Sep, 4:10 PM               │
│ Last updated 22 Sep, 11:02 AM                  │
│                                                │
│ Bring your resume and ID card.                 │
├────────────────────────────────────────────────┤
│ [ Cancel Event ]                [ Edit Event ] │
└────────────────────────────────────────────────┘
```

* Sections without content (e.g. no company or description) are hidden.

### T-04a — Event detail: other TPO (view only)

```text
│ Created by Ravi Sharma (TPO)                   │
│                                                │
│ i View only. Only Ravi Sharma can edit or      │
│   cancel this event.                           │
├────────────────────────────────────────────────┤
│ (no action buttons)                            │
```

### T-04b — Cancelled event detail

```text
┌────────────────────────────────────────────────┐
│ ░PPT · CANCELLED                           [X] │
│ Mango Insurance PPT (struck through)           │
├────────────────────────────────────────────────┤
│                                                │
│ Date:      29 Sep 2026 · 10:00–11:30 AM        │
│ Cancelled by you · 25 Sep                      │
│ Reason:    Company withdrew                    │
│ Students:  142 were notified                   │
└────────────────────────────────────────────────┘
```

* No action buttons.

### T-04c — Application Deadline detail (auto from job)

```text
┌────────────────────────────────────────────────┐
│ ▯Deadline                   Auto from job  [X] │
│ Infosys SDE — Applications close               │
├────────────────────────────────────────────────┤
│                                                │
│ Date:      Wed, 30 Sep 2026 · end of day       │
│ Students:  140 eligible · 86 applied           │
│            54 not applied yet                  │
├────────────────────────────────────────────────┤
│                               [ Go to Job -> ] │
└────────────────────────────────────────────────┘
```

* The deadline comes from the job's Application Expiration Date. To change it, the TPO edits the job.

### T-04d — My Reminder detail

```text
┌────────────────────────────────────────────────┐
│ ┆My Reminder                               [X] │
│ Call TCS HR for results                        │
├────────────────────────────────────────────────┤
│                                                │
│ Date:      Thu, 24 Sep 2026 · 3:00 PM          │
│ Note:      Ask about the shortlist date        │
├────────────────────────────────────────────────┤
│ [ Delete ]                            [ Edit ] │
└────────────────────────────────────────────────┘

┌────────────────────────────────────────────────┐
│ Delete this reminder?                          │
├────────────────────────────────────────────────┤
│ [ Go Back ]                         [ Delete ] │
└────────────────────────────────────────────────┘
```


---

### T-05 — Edit Event: review changes

**When the audience changes** (shown when the TPO clicks Save)

```text
┌────────────────────────────────────────────────┐
│ Review changes before saving                   │
├────────────────────────────────────────────────┤
│                                                │
│ Changed: Date (28 -> 29 Sep), Department       │
│                                                │
│ Updated   BTech -> CSE, IT                 120 │
│ Added     BTech -> ECE                      22 │
│ Removed   BTech -> ME                        8 │
│                                                │
│ Reason for change (optional, sent to students) │
│ ┌────────────────────────────────────────────┐ │
│ │ Company asked to include ECE               │ │
│ └────────────────────────────────────────────┘ │
├────────────────────────────────────────────────┤
│ [ Go Back ]              [ Save & Notify 150 ] │
└────────────────────────────────────────────────┘
```

**When only the Title, Description or Company changes**

```text
│ ☐ Notify students about this change            │
├────────────────────────────────────────────────┤
│ [ Cancel ]                    [ Save Changes ] │
```

* **Edit drawer:** the same as T-03, already filled in, with Event Type locked.
* **Important changes** (date, time, mode, venue/platform, audience) always notify students.
* **Confirmation:** a toast reads "Changes saved. X students notified."
* **Past events:** the Edit button is hidden once the event's end time has passed.


---

### T-06 — Cancel Event dialog

```text
┌────────────────────────────────────────────────┐
│ Cancel this event?                             │
├────────────────────────────────────────────────┤
│                                                │
│ Deloitte Pre-Placement Talk · 28 Sep           │
│ 142 students will be notified.                 │
│                                                │
│ Reason *                                       │
│                                                │
│ (●) Postponed                                  │
│     i You can edit the date instead of         │
│       cancelling.  [Edit date instead]         │
│ ( ) Company Withdrew                           │
│ ( ) Created by Mistake                         │
│ ( ) Other                                      │
│ ┌────────────────────────────────────────────┐ │
│ │ Type reason (max 200)...                   │ │
│ └────────────────────────────────────────────┘ │
├────────────────────────────────────────────────┤
│ [ Go Back ]              [ Yes, Cancel Event ] │
└────────────────────────────────────────────────┘
```

* **Created by Mistake:** the event is removed from students' calendars, and they're told "Please ignore the earlier notification about [Title]."
* **Other reasons:** the event stays visible to everyone, muted, with a "Cancelled" badge.
* **Confirmation:** a toast reads "Event cancelled. 142 students notified."


---

## 3. Student Portal

### 3.1 Screen index

| ID  | Screen | Type | BRD |
|-----|--------|------|-----|
| S-01 | Top nav: Calendar tab | Modified | FR-CAL-14 |
| S-02 | Home: "Coming Up" card | Modified | FR-CAL-14 |
| S-03 | Home: calendar feed cards | Modified (new card types) | FR-CAL-18 |
| S-04 | Calendar — Month view | New page | FR-CAL-14 |
| S-04a | List view | New state | FR-CAL-14 |
| S-04b | Empty, loading and error states | New state | FR-CAL-14 |
| S-05 | Detail: TPO Event | New  | FR-CAL-16 |
| S-05a | Detail: Online Assessment | New state | FR-CAL-16 |
| S-05b | Detail: Application Deadline | New  | FR-CAL-16 |
| S-05c | Detail: Nudge | New  | FR-CAL-16 |
| S-06 | Status states | New states | FR-CAL-17 |
| S-07 | Add Reminder drawer | New  | FR-CAL-19 |
| S-07a | My Reminder detail | New  | FR-CAL-19 |
| S-08 | Bell: calendar notifications | Modified (new types) | FR-CAL-24 |

### S-01 — Top nav: Calendar tab (Modified)

```text
┌────────────────────────────────────────────────┐
│ 7Seers  Home  Jobs Board  Calendar•  Profile   │
│                                                │
│               [Learning Hub]  Bell(15)  Avatar │
└────────────────────────────────────────────────┘
                           ^
                           └─ NEW (• = red dot)
```

* **Red dot:** shown when there's an unseen new, updated, cancelled or no-longer-applicable item. It clears when the student opens the calendar.


---

### S-02 — Home: "Coming Up" card (Modified)

Placed at the top of the right column on Home, above Available Opportunities.

```text
┌────────────────────────────────────────┐
│ Coming Up                  View all -> │
├────────────────────────────────────────┤
│                                        │
│ TODAY                                  │
│ ▌PPT   Deloitte Pre-Placement          │
│ ▌10:00 AM · Auditorium                 │
│                                        │
│ TOMORROW                               │
│ ┆My Reminder  Revise DBMS              │
│ ┆6:00 PM                               │
│                                        │
│ WED 30 SEP                             │
│ ▯Deadline   Infosys SDE                │
│ ▯Applications close                    │
└────────────────────────────────────────┘
```

* **Shows:** the next 3 items, labelled Today, Tomorrow or with the date. My Reminders are included.
* **Not shown:** cancelled and no-longer-applicable items.
* **Empty:** "Nothing coming up. Your TPO will add placement events here."


---

### S-03 — Home: calendar feed cards (Modified — new card types)

These appear in **"Updates, personalised for you"**, in the same style as the Interview Feedback and Bookmarked Jobs cards, newest first.

**New Event**

```text
┌────────────────────────────────────────────────┐
│ New Event                               2h ago │
│                                                │
│ Deloitte Pre-Placement Talk                    │
│ Mon, 28 Sep · 10:00–11:30 AM                   │
│ Auditorium, Block A                            │
│                                                │
│                            View on Calendar -> │
└────────────────────────────────────────────────┘
```

**Event Updated**

```text
┌────────────────────────────────────────────────┐
│ Event Updated                           1d ago │
│                                                │
│ Deloitte Pre-Placement Talk                    │
│ Date changed: 28 Sep -> 29 Sep                 │
│                                                │
│                            View on Calendar -> │
└────────────────────────────────────────────────┘
```

**Event Cancelled**

```text
┌────────────────────────────────────────────────┐
│ Event Cancelled                         1d ago │
│                                                │
│ Mango Insurance PPT · 29 Sep                   │
│ Reason: Company withdrew                       │
└────────────────────────────────────────────────┘
```

**Applications Closing (nudge N-S2)**

```text
┌────────────────────────────────────────────────┐
│ Applications close in 2 days             Today │
│                                                │
│ Infosys · Software Development Engineer        │
│ Closing: 30 Sep                                │
│ ┌────────────────────────────────────────────┐ │
│ │ ✓ 41% JRI Match          [View & Apply ->] │ │
│ └────────────────────────────────────────────┘ │
└────────────────────────────────────────────────┘
```

**Online Test Today (nudge N-S3)**

```text
┌────────────────────────────────────────────────┐
│ Online Test Today                      8:00 AM │
│                                                │
│ TCS Online Assessment                          │
│ Today · 10:00 AM – 6:00 PM                     │
│ Check your email for the test link.            │
│                                                │
│                            View on Calendar -> │
└────────────────────────────────────────────────┘
```

**Feed card types**

| Card label | Source | CTA |
|------------|--------|-----|
| New Event  | Event created, or student added to the audience | View on Calendar |
| Event Updated | Important change (shows what changed) | View on Calendar |
| Event Cancelled | Cancelled (not Created by Mistake), with reason | —   |
| No Longer Applicable | Student removed from the audience | —   |
| Event Tomorrow / In 1 Hour | Nudge N-S1 | View on Calendar |
| Applications Closing / Last Day | Nudge N-S2 | View & Apply |
| Online Test Today | Nudge N-S3 | View on Calendar |

* **Deadline cards** show the existing JRI Match strip.
* **Created by Mistake:** the original "New Event" card is removed, and no new card is added.
* **My Reminders** never create feed cards.


---

### S-04 — Calendar: Month view (New page)

**Route:** `/student/calendar`

```text
┌────────────────────────────────────────────────┐
│ My Campus Calendar                             │
│                               [+ Add Reminder] │
│                                                │
│ [<]  [Today]  [>]               September 2026 │
│                                                │
│ [Month (●)]    [List ( )]                      │
└────────────────────────────────────────────────┘
```

**Month grid**

```text
┌──────┬──────┬──────┬──────┬──────┬──────┬──────┐
│Mon   │Tue   │Wed   │Thu   │Fri   │Sat   │Sun   │
├──────┼──────┼──────┼──────┼──────┼──────┼──────┤
│21    │22    │23    │24    │25    │26(o) │27    │
│      │▌PPT  │      │      │▌Test │      │      │
│      │▌PwC  │      │      │▌TCS  │      │      │
│      │      │      │      │┆DBMS │      │      │
│      │      │      │      │┆Revis│      │      │
├──────┼──────┼──────┼──────┼──────┼──────┼──────┤
│28    │29    │30    │1     │2     │3     │4     │
│▪Remnd│░Cancl│▯Due  │▌Ornt │      │      │      │
│▪Deltt│░Mango│▯Infy │▌UPDTD│      │      │      │
│▌PPT  │      │      │      │      │      │      │
│▌Deltt│      │      │      │      │      │      │
└──────┴──────┴──────┴──────┴──────┴──────┴──────┘

Legend:
  ▌ Blue    = TPO Event
  ▯ Red     = Deadline
  ▪ Purple  = Reminder (nudge)
  ┆ Slate   = My Reminder
  ░         = Cancelled / No longer applicable
```

* **No filters:** each student automatically sees only what applies to them.
* **Status badges** (UPDATED, Cancelled, No longer applicable) show on the tile.
* **Nudge tiles** (purple) appear on the day the nudge is sent.
* **Clicking:** an empty date opens S-07 with that date filled in; a tile opens its detail panel on the right.


---

### S-04a — List view

```text
┌────────────────────────────────────────────────┐
│ [<]  [Today]  [>]               September 2026 │
│                                                │
│ [Month ( )]    [List (●)]                      │
├────────────────────────────────────────────────┤
│ TODAY · SAT 26 SEP                             │
│   Nothing scheduled                            │
│                                                │
│ MON 28 SEP                                     │
│                                                │
│ ▪Reminder  Deloitte PPT in 1 hour           -> │
│                                                │
│ ▌PPT       Deloitte Pre-Placement Talk      -> │
│            10:00–11:30 AM · Offline            │
│            Auditorium, Block A                 │
│                                                │
│ WED 30 SEP                                     │
│                                                │
│ ▯Deadline  Infosys · SDE            [Apply ->] │
│            Applications close                  │
│                                                │
│ THU 1 OCT                                      │
│                                                │
│ ▌Orient    Placement Orientation            -> │
│            UPDATED · 2:00–3:00 PM · Online     │
└────────────────────────────────────────────────┘
```


---

### S-04b — Empty, loading and error states

```text
┌────────────────────────────────────────────────┐
│ [<]  [Today]  [>]                 October 2026 │
├────────────────────────────────────────────────┤
│                                                │
│                                                │
│             No events this month.              │
│                                                │
│   Your TPO will add placement events here.     │
│                                                │
└────────────────────────────────────────────────┘
```

* **Loading:** a skeleton grid, the same as T-02c.
* **Error:** "Couldn't load your calendar. [Retry]"


---

### S-05 — Detail: TPO Event

```text
┌────────────────────────────────────────────────┐
│ <- Back to Calendar                        [X] │
├────────────────────────────────────────────────┤
│                                                │
│ ▌PPT                                           │
│ Deloitte Pre-Placement Talk                    │
│                                                │
│ Date:     Mon, 28 Sep 2026                     │
│ Time:     10:00 – 11:30 AM                     │
│ Venue:    Offline · Auditorium, Block A        │
│ Company:  Deloitte                             │
│ By:       Priya Menon (TPO)                    │
├────────────────────────────────────────────────┤
│                                                │
│ Bring your resume and ID card.                 │
├────────────────────────────────────────────────┤
│                                  [ Remind me ] │
└────────────────────────────────────────────────┘
```

* **Remind me** opens S-07 with the title and linked event filled in.
* ### Sections without content are hidden.

### Linked Job card — pasted link:


### S-05a — Detail: Online Assessment

```text
│ ▌Online Assessment                             │
│ TCS Online Assessment                          │
│                                                │
│ Date:     Fri, 2 Oct 2026                      │
│ Window:   10:00 AM – 6:00 PM                   │
│                                                │
│ ┌────────────────────────────────────────────┐ │
│ │ i The test link will be sent to your       │ │
│ │   registered email.                        │ │
│ └────────────────────────────────────────────┘ │
├────────────────────────────────────────────────┤
│                                  [ Remind me ] │
```

### S-05b — Detail: Application Deadline

```text
┌────────────────────────────────────────────────┐
│ ▯Deadline                                  [X] │
│ Infosys · Software Development Engineer        │
├────────────────────────────────────────────────┤
│                                                │
│ Applications close on Wed, 30 Sep 2026         │
├────────────────────────────────────────────────┤
│ [ Remind me ]              [ View & Apply -> ] │
└────────────────────────────────────────────────┘
```

* **After the student applies,** the deadline disappears from their calendar.

### S-05c — Detail: Nudge

```text
┌────────────────────────────────────────────────┐
│ ▪Reminder                                  [X] │
│ Applications close in 2 days                   │
├────────────────────────────────────────────────┤
│                                                │
│ Infosys · Software Development Engineer        │
│ Last date to apply: Wed, 30 Sep 2026           │
├────────────────────────────────────────────────┤
│                               [ Go to Job -> ] │
└────────────────────────────────────────────────┘
```

* The button opens the related event or job.


---

### S-06 — Status states (tile + detail)

**Tiles**

```text
UPDATED (shown for 48 hrs)
┌──────────────────────────┐
│ ▌Orient      [UPDATED]   │
│ ▌Placement Orientation   │
└──────────────────────────┘

CANCELLED
┌──────────────────────────┐
│ ░ Mango PPT (struck)     │
│ ░ [CANCELLED]            │
└──────────────────────────┘

NO LONGER APPLICABLE
┌──────────────────────────┐
│ ░ Wipro PPT (struck)     │
│ ░ [NO LONGER APPLICABLE] │
└──────────────────────────┘
```

**Detail banners**

```text
┌────────────────────────────────────────────────┐
│ Updated on 26 Sep: Date changed 28 Sep ->      │
│ 1 Oct; Mode now Online.                        │
└────────────────────────────────────────────────┘

┌────────────────────────────────────────────────┐
│ x This event was cancelled on 24 Sep.          │
│   Reason: Company withdrew.                    │
└────────────────────────────────────────────────┘

┌────────────────────────────────────────────────┐
│ i This event no longer applies to you.         │
│   Reason: Only for ECE students.               │
└────────────────────────────────────────────────┘
```

* **Past events** are shown muted once their end time has passed.


---

### S-07 — Add Reminder drawer (student)

**Opened from:** "+ Add Reminder", an empty date, or "Remind me" on an event or deadline.

```text
┌────────────────────────────────────────────────┐
│ Add Reminder                               [X] │
├────────────────────────────────────────────────┤
│                                                │
│ Title *                                        │
│ ┌────────────────────────────────────────────┐ │
│ │ Deloitte Pre-Placement Talk                │ │
│ └────────────────────────────────────────────┘ │
│                                                │
│ Date *                  Time (optional)        │
│ ┌────────────────────┐  ┌────────────────────┐ │
│ │ 28 Sep 26          │  │ 10:00 AM           │ │
│ └────────────────────┘  └────────────────────┘ │
│                                                │
│ Remind me                                      │
│ ┌────────────────────────────────────────────┐ │
│ │ 1 hour before                            ▾ │ │
│ └────────────────────────────────────────────┘ │
│                                                │
│ Note (optional)                                │
│ ┌────────────────────────────────────────────┐ │
│ │ Carry 2 copies of resume                   │ │
│ │                                            │ │
│ └────────────────────────────────────────────┘ │
│                                                │
│ Linked to:  Deloitte Pre-Placement Talk        │
│                                                │
│ i Only you can see this reminder.              │
├────────────────────────────────────────────────┤
│ [ Cancel ]                   [ Save Reminder ] │
└────────────────────────────────────────────────┘
```

* **"Remind me" options:** None / At the time / 15 min before / 1 hour before / 1 day before.
* **Defaults:** 1 hour before if a time is set; 9:00 AM on the day if not.
* **Linked to:** shown only when opened from "Remind me", which also fills in the title.
* **Limit reached:** "+ Add Reminder" shows "You've reached 50 upcoming reminders. Delete some to add more."

### S-07a — My Reminder detail

```text
┌────────────────────────────────────────────────┐
│ ┆My Reminder                               [X] │
│ Deloitte Pre-Placement Talk                    │
├────────────────────────────────────────────────┤
│                                                │
│ Date:      Mon, 28 Sep 2026 · 10:00 AM         │
│ Alert:     1 hour before                       │
│ Note:      Carry 2 copies of resume            │
│ Linked:    Deloitte Pre-Placement Talk         │
│                                                │
│ ┌────────────────────────────────────────────┐ │
│ │ i The linked event has moved to 1 Oct.     │ │
│ │   [Update reminder]                        │ │
│ └────────────────────────────────────────────┘ │
├────────────────────────────────────────────────┤
│ [ Delete ]                            [ Edit ] │
└────────────────────────────────────────────────┘
```

* **Linked event moved:** the banner above is shown, with an "Update reminder" link.
* **Linked event cancelled:** the banner reads "The linked event was cancelled." and the alert is not sent.
* **Delete** asks "Delete this reminder?"


---

### S-08 — Bell: calendar notifications (existing bell, new types)

```text
┌────────────────────────────────────────────────┐
│ Notifications                  [Mark all read] │
├────────────────────────────────────────────────┤
│                                                │
│ Reminder: Revise DBMS                       1h │
│   Your reminder                                │
│                                                │
│ New event                                   2h │
│   Deloitte PPT · Mon 28 Sep, 10 AM             │
│                                                │
│ Event updated                               1d │
│   Orientation · Date changed to 1 Oct          │
│                                                │
│ Event cancelled                             1d │
│   Mango PPT · Company withdrew                 │
│                                                │
│ Applications close in 2 days                2d │
│   Infosys SDE                                  │
└────────────────────────────────────────────────┘
```

* Clicking a notification opens the related item on the calendar, with its detail panel open.


---

## 4. Student Mobile App

### 4.1 Screen index

| ID  | Screen | Type | BRD |
|-----|--------|------|-----|
| M-01 | Dashboard: Calendar icon + "Coming Up" card | Modified | FR-CAL-20 |
| M-02 | Other main screens: Calendar icon | Modified | FR-CAL-20 |
| M-03 | Calendar screen — List view | New  | FR-CAL-21 |
| M-03a | Calendar screen — Month view | New state | FR-CAL-21 |
| M-04 | Event detail (full screen) | New  | FR-CAL-22 |
| M-05 | Add Reminder screen | New  | FR-CAL-19, 21 |
| M-06 | Notifications screen with calendar items | Modified | FR-CAL-23 |
| M-07 | Push notification | New  | FR-CAL-23 |

### M-01 — Dashboard: Calendar icon + "Coming Up" card (Modified)

```text
┌──────────────────────────────────┐
│ Good afternoon         Cal• Bell │
│ mahika                           │
├──────────────────────────────────┤
│ ┌────────────────────────────┐   │
│ │ (43%)  Job Readiness Score │   │
│ │        Prep Required       │   │
│ └────────────────────────────┘   │
│ [11 Tests] [4 Applied] [7 Mocks] │
│                                  │
│ Coming Up            View all -> │
│ ┌────────────────────────────┐   │
│ │ ▌PPT · Deloitte PPT        │   │
│ │ ▌Today · 10:00 AM · Audi.  │   │
│ │ ┆My Reminder · Revise DBMS │   │
│ │ ┆Tomorrow · 6:00 PM        │   │
│ │ ▯Deadline · Infosys SDE    │   │
│ │ ▯Wed 30 Sep                │   │
│ └────────────────────────────┘   │
│                                  │
│ [ Your Next Career Move ... ]    │
├──────────────────────────────────┤
│ Dash  Jobs  Intern Learn  Resume │
└──────────────────────────────────┘
```

* **Calendar icon** ("Cal") sits to the left of the bell, with a red dot (•) for unseen changes.
* **Coming Up card** sits below the stats tiles and above "Your Next Career Move".
* **Empty card:** "Nothing coming up. Your TPO will add placement events here."
* **No new tab** is added to the bottom navigation.

### M-02 — Other main screens: Calendar icon (Modified)

```text
┌──────────────────────────────────┐
│ Jobs                   Cal• Bell │
│ Find jobs which suits you best!  │
├──────────────────────────────────┤
│ [Campus (8)] [Off-Campus (1575)] │
│ ...                              │
├──────────────────────────────────┤
│ Dash  Jobs  Intern Learn  Resume │
└──────────────────────────────────┘
```

* The Calendar icon appears in the same place on Dashboard, Jobs, Internships, Learn and Resumes.


---

### M-03 — Calendar screen: List view (default)

```text
┌──────────────────────────────────┐
│ <  Calendar                 Bell │
├──────────────────────────────────┤
│ ‹  September 2026  ›             │
│ [List (●)]   [Month ( )]         │
├──────────────────────────────────┤
│ TODAY                            │
│ ▌PPT · Deloitte PPT              │
│   10:00 AM · Auditorium       -> │
│ ┆My Reminder · Revise DBMS       │
│   6:00 PM                     -> │
│                                  │
│ WED 30 SEP                       │
│ ▯Deadline · Infosys SDE          │
│   Applications close     [Apply] │
│                                  │
│ THU 1 OCT                        │
│ ▌Orient · UPDATED                │
│   2:00 PM · Online            -> │
├──────────────────────────────────┤
│               [ + Add Reminder ] │
└──────────────────────────────────┘
```

* **Date headers** (TODAY, then each date) use the same style as the Notifications screen.
* **Opens at today's date** for the current month.
* **Deadline rows** have an **Apply** button.
* **Status badges** (Updated, Cancelled, No longer applicable) show the same way as S-06.
* **Empty month:** "No events this month. Your TPO will add placement events here."
* **Loading and errors:** a skeleton loader while loading; "Couldn't load your calendar." with a Retry button if loading fails.

### M-03a — Calendar screen: Month view

```text
┌──────────────────────────────────┐
│ <  Calendar                 Bell │
├──────────────────────────────────┤
│ ‹  September 2026  ›             │
│ [List ( )]   [Month (●)]         │
└──────────────────────────────────┘
┌────┬────┬────┬────┬────┬────┬────┐
│M   │T   │W   │T   │F   │S   │S   │
├────┼────┼────┼────┼────┼────┼────┤
│28  │29  │30  │1   │2   │3   │4   │
│●   │░   │▯   │●   │    │    │    │
└────┴────┴────┴────┴────┴────┴────┘

Tapped: Mon 28 Sep
▌PPT · Deloitte PPT · 10:00 AM
▪Reminder · PPT in 1 hour
```

* **Dots:** up to 3 coloured dots under each date that has items.
* **Tapping a date** lists that day's items below the grid.


---

### M-04 — Event detail (full screen)

```text
┌──────────────────────────────────┐
│ <                                │
├──────────────────────────────────┤
│                                  │
│ ▌PPT                             │
│ Deloitte Pre-Placement Talk      │
│                                  │
│ Mon, 28 Sep 2026                 │
│ 10:00 – 11:30 AM                 │
│ Offline · Auditorium, Block A    │
│ Company: Deloitte                │
│ By: Priya Menon (TPO)            │
│                                  │
│ Bring your resume and ID card.   │
│                                  │
│                                  │
├──────────────────────────────────┤
│ ┌────────────────────────────┐   │
│ │         Remind me          │   │
│ └────────────────────────────┘   │
└──────────────────────────────────┘
```

* **Fixed bottom button:** **Remind me** for events; **View & Apply** for deadlines.
* **Back arrow** returns to the same view, month and scroll position.
* **Created by Mistake:** the screen shows "This event is no longer available."

### M-05 — Add Reminder screen

```text
┌──────────────────────────────────┐
│ <  Add Reminder                  │
├──────────────────────────────────┤
│                                  │
│ Title *                          │
│ ┌──────────────────────────────┐ │
│ │ Revise DBMS                  │ │
│ └──────────────────────────────┘ │
│                                  │
│ Date *           Time            │
│ ┌─────────────┐  ┌─────────────┐ │
│ │ 27 Sep 26   │  │ 6:00 PM     │ │
│ └─────────────┘  └─────────────┘ │
│                                  │
│ Remind me                        │
│ ┌──────────────────────────────┐ │
│ │ 1 hour before              ▾ │ │
│ └──────────────────────────────┘ │
│                                  │
│ Note (optional)                  │
│ ┌──────────────────────────────┐ │
│ │ Units 3 and 4                │ │
│ └──────────────────────────────┘ │
│                                  │
│ i Only you can see this.         │
├──────────────────────────────────┤
│ ┌────────────────────────────┐   │
│ │       Save Reminder        │   │
│ └────────────────────────────┘   │
└──────────────────────────────────┘
```

* Same fields and rules as S-07.


---

### M-06 — Notifications screen with calendar items (Modified)

```text
┌──────────────────────────────────┐
│ <      Notifications             │
├──────────────────────────────────┤
│ [Recent]  [All]    Mark all read │
├──────────────────────────────────┤
│ TODAY                            │
│ [Cal] Deloitte Pre-Placement   • │
│       Talk is scheduled on Mon,  │
│       28 Sep, 10:00 AM.          │
│       2:15 pm                    │
│                                  │
│ [Cal] Reminder: Revise DBMS    • │
│       6:00 pm                    │
│                                  │
│ SEP 28, 2026                     │
│ [Mock] Your Mock Interview       │
│       Report for QA is ready.    │
│       5:31 pm                    │
└──────────────────────────────────┘
```

* **Same layout as today:** Recent / All tabs, date groups, unread dot (•) and "Mark all as read".
* **Calendar icon** ([Cal]) separates calendar items from mock interview and job items.
* **Highlighted item:** the event name is highlighted, as in existing messages.
* **Tapping** opens the related detail (M-04) and marks it as read.

### M-07 — Push notification

```text
┌────────────────────────────────────────────┐
│ 7Seers                                 now │
│ New event: Deloitte PPT                    │
│ Mon 28 Sep · 10:00 AM · Auditorium         │
└────────────────────────────────────────────┘
Tap -> opens the event detail (M-04)
```

* Push wording matches FR-CAL-24 and FR-CAL-25. Quiet hours and the daily nudge limit apply.


---

## 5. Super Admin Portal

### A-01 — Calendar & Nudge Settings

**Location:** Super Admin Portal → Platform Settings → Calendar & Nudges

```text
┌────────────────────────────────────────────────┐
│ Calendar & Nudges                              │
├────────────────────────────────────────────────┤
│                                                │
│ Event Reminder (N-S1)                          │
│ Days before             Hours before           │
│ ┌────────────────────┐  ┌────────────────────┐ │
│ │ 1                  │  │ 1                  │ │
│ └────────────────────┘  └────────────────────┘ │
│                                                │
│ Application Deadline Reminder (N-S2)           │
│ Days before             Same day               │
│ ┌────────────────────┐  ┌────────────────────┐ │
│ │ 2                  │  │ On ▾               │ │
│ └────────────────────┘  └────────────────────┘ │
│                                                │
│ Daily nudge limit per student                  │
│ ┌────────────────────────────────────────────┐ │
│ │ 3                                          │ │
│ └────────────────────────────────────────────┘ │
│                                                │
│ Quiet hours from        Quiet hours to         │
│ ┌────────────────────┐  ┌────────────────────┐ │
│ │ 10:00 PM           │  │ 07:00 AM           │ │
│ └────────────────────┘  └────────────────────┘ │
│                                                │
│ i Changes apply only to nudges not yet         │
│   scheduled.                                   │
├────────────────────────────────────────────────┤
│                              [ Save Settings ] │
└────────────────────────────────────────────────┘
```

* Values must be whole numbers within the allowed ranges (FR-CAL-27).
* A toast confirms: "Settings saved."
