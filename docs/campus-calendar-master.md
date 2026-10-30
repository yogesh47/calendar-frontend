# Campus Calendar — Master Document

Sab kuch ek jagah: feature kya hai, kyun hai, kaun use karta hai, kaun si screen
kahan banegi, backend kaise banega, aur kis order me banega.

Ye teen documents ka nichod hai — `requirements/campus-calendar-hld.md`,
`requirements/campus-calendar-brd.md`, `requirements/campus-calendar-ui-spec.md`. Jahan detail chahiye,
wahan link diya hai. Backend ka poora architecture alag file me hai:
`campus-calendar-backend-design.md`.

---

## Contents

1. [Feature ek line me](#1-feature-ek-line-me)
2. [Kyun bana rahe hain](#2-kyun-bana-rahe-hain)
3. [Kaun use karta hai aur kya kar sakta hai](#3-kaun-use-karta-hai-aur-kya-kar-sakta-hai)
   - [3a. Roles — hamare DB me](#3a-roles--hamare-db-me)
4. [Calendar par kya-kya aata hai](#4-calendar-par-kya-kya-aata-hai)
5. [Poora flow — end to end](#5-poora-flow--end-to-end)
6. [Screens — saare 40](#6-screens--saare-40)
7. [Backend ka khaka](#7-backend-ka-khaka)
8. [Step by step — kya pehle, kya baad me](#8-step-by-step--kya-pehle-kya-baad-me)
   - [Repos aur unka role](#repos-aur-unka-role)
   - [Abhi kaise bana hai — `calendar-frontend`](#abhi-kaise-bana-hai--calendar-frontend-2026-10-30)
   - [Screen → kahan banega → kaun sa FR](#screen--kahan-banega--kaun-sa-fr)
8b. [Exact numbers — jo aasani se chhoot jaate hain](#8b-exact-numbers--jo-aasani-se-chhoot-jaate-hain)
9. [Rules jo kahin na toote](#9-rules-jo-kahin-na-toote)
10. [QA checklist](#10-qa-checklist)
11. [Risks aur open questions](#11-risks-aur-open-questions)
12. [Conclusion](#12-conclusion)

---

## 1. Feature ek line me

Ek shared jagah jahan **TPO placement events plan aur publish karta hai**, aur
**har student ko sirf wahi dikhta hai jo uske liye hai** — web aur mobile dono
par. Dono apne private reminders bhi rakh sakte hain.

Ye WhatsApp groups, email chains aur notice boards ki jagah leta hai.

---

## 2. Kyun bana rahe hain

| Aaj | Campus Calendar ke baad |
|---|---|
| Event WhatsApp aur email me dab jaata hai | Har event seedha sahi student ke calendar par |
| Course/batch/department ke hisaab se targeting nahi | Event sirf un students tak jinke liye hai |
| Application deadline job ke andar chhupi hai | Deadline apne aap calendar par |
| Change ya cancel student tak nahi pahunchta | Turant pata chal jaata hai |
| TPO ek doosre ke plans nahi dekh sakte | Ek shared calendar, sab dekhte hain |
| Personal follow-up ki koi jagah nahi | TPO aur student dono private reminder rakh sakte hain |

---

## 3. Kaun use karta hai aur kya kar sakta hai

| Actor | Portal | Kya kar sakta hai |
|---|---|---|
| **TPO** | TPO Portal | Poore college ka calendar dekhta hai. Har kism ka event banata hai. **Edit/cancel sirf apne** banaye event ka. Apne private reminders. |
| **Doosre TPO** | TPO Portal | Sab events dekh sakte hain, par **view-only**. Doosre ke My Reminders kabhi nahi dikhte. |
| **Student** | Student Portal + Mobile | Sirf apne liye targeted events aur apni eligible deadlines. Read-only. Apne reminders bana/badal/mita sakta hai. Notifications aur nudges milte hain. |
| **Super Admin** | Super Admin Portal | Sirf nudge timings, daily limit, quiet hours. **Event content par koi access nahi.** |
| **Teacher** | TPO Portal | ⚠️ **faisla pending** — BRD kehta hai v1 me access nahi, par ab teacher hamare roles me hai. Dekho §3a |
| Admin / Publisher | — | v1 me koi access nahi |

### 3a. Roles — hamare DB me

Service ke apne teen role honge: **`tpo`, `teacher`, `student`** — aur aage aur
bhi aayenge. Isliye kahin bhi `if role == "tpo"` likh kar hardcode nahi karna;
ek **capability matrix** banegi aur har screen + har API usi se poochegi.

#### Iska matlab kya hai

Do tarike hote hain access likhne ke:

```
// (1) role ka naam poochna — yehi nahi karna
if (role === 'tpo') showNewEventButton()

// (2) kaam poochna — yehi karna hai
if (can('calendar.create_event')) showNewEventButton()
```

Pehla tarika har naye role par tootta hai. Kal `hod` ya `placement_coordinator`
aayega jise event banane do — tab poore codebase me `role === 'tpo'` dhoondh kar
`role === 'tpo' || role === 'hod'` karna padega. 40 screens aur ~20 endpoints me
ye chuk jaana pakka hai: ek jagah chhut gayi, aur wahan naya role ya to andheRe
me rahega ya use wo dikh jayega jo nahi dikhna chahiye.

Doosra tarika ek hi jagah todta hai. **Capability matrix** matlab ek table jo
kehti hai *"is role ke paas ye-ye kaam karne ka haq hai"* — aur baaki poora code
sirf **kaam ka naam** poochta hai, role ka naam kabhi nahi:

```
ROLE_CAPABILITIES = {
  tpo:     [ view_org_events, view_all_deadlines, create_event,
             edit_own_event, cancel_own_event, manage_own_reminder ],
  teacher: [ view_org_events, view_all_deadlines, manage_own_reminder ],
  student: [ view_targeted_events, view_my_deadlines, manage_own_reminder ],
}
```

Naya role aaya → upar ek line. Screens, queries, routes, components — kuch nahi
chhua jaata. **Role ek badalne wali cheez hai, capability ek pakki cheez.** Code
hamesha pakki cheez se bandhna chahiye.

#### Capability kya hoti hai

Capability = ek chhota sa kaam jiska jawab haan/na me hai. Role nahi, screen
nahi, feature nahi — **ek kaam**. Naam hamesha `calendar.<kaam>` format me, aur
**bilkul wahi naam frontend aur backend dono me** — taaki do jagah rules alag na
ho jaayein.

| Capability | Matlab |
|---|---|
| `calendar.view_org_events` | poore college ka calendar khol sakta hai — har TPO ka banaya event dikhega |
| `calendar.view_targeted_events` | sirf wo events jinme **ye banda audience me hai** |
| `calendar.view_all_deadlines` | college ki saari active job deadlines |
| `calendar.view_my_deadlines` | sirf wo deadlines jinke liye **ye khud eligible hai** aur abhi tak apply nahi kiya |
| `calendar.create_event` | "+ New Event" / Create Event form |
| `calendar.edit_own_event` | **apne** banaye event ko edit karna (doosre ka kabhi nahi) |
| `calendar.cancel_own_event` | **apne** event ko cancel karna |
| `calendar.manage_own_reminder` | apne private reminders banana / badalna / mitana |

> **"own" ka matlab yahan do alag check hain.** Capability sirf itna kehti hai
> *"is role ko edit karne ka haq hai"*. Uske baad **ownership check alag se**
> hoti hai — `event.created_by == current_user_id`. Ek TPO ke paas
> `edit_own_event` hai, par doosre TPO ka event phir bhi 403 dega. Dono check
> pass honge tabhi edit milega.

#### Table kaise padhni hai

| Nishaan | Matlab |
|---|---|
| ✅ | **haq hai** — capability us role ke set me hai, UI dikhega, API 200 dega |
| ❌ | **haq nahi** — UI me button hi nahi banta, aur API seedha **403** deti hai |
| ⚠️ | **abhi faisla nahi hua** — PM ke jawab par depend karta hai (neeche Teacher wala note) |
| — | **lagoo hi nahi hota** — role ko uska ulta/bada wala haq pehle se mila hua hai, isliye ye capability uske liye bemaani hai |

| Kaam | tpo | teacher | student |
|---|---|---|---|
| College ke saare events dekhna | ✅ | ⚠️ | ❌ |
| Sirf apne liye targeted events | — | — | ✅ |
| Saari deadlines | ✅ | ⚠️ | ❌ |
| Sirf apni eligible deadlines | ❌ | ❌ | ✅ |
| Event banana | ✅ | ❌ | ❌ |
| Apna event edit / cancel | ✅ | ❌ | ❌ |
| Apne reminders | ✅ | ✅ | ✅ |
| Settings | ❌ | ❌ | ❌ *(Super Admin ka)* |

#### Har row ka matlab, line by line

| Row | Padho aise |
|---|---|
| **College ke saare events dekhna** | TPO college ka poora calendar dekhta hai — kisi ne bhi banaya ho. Student ko ❌ isliye hai ki use sab kuch nahi dikhna, sirf apne kaam ka dikhna hai (agli row). |
| **Sirf apne liye targeted events** | Student ko wahi event dikhega jiske audience filter (course / batch / department) me wo aata hai. TPO/Teacher par `—` isliye hai ki unke paas **saare** events ka haq pehle se hai — chhote daayre wali capability dene ka koi matlab nahi. |
| **Saari deadlines** | College me chal rahi har active job ki last date calendar par — TPO ke liye poori list. |
| **Sirf apni eligible deadlines** | Student ko sirf wo job deadlines jinke eligibility criteria wo poora karta hai **aur** jinme abhi tak apply nahi kiya. Apply karte hi uske calendar se hat jaati hai. |
| **Event banana** | Sirf TPO. Teacher/Student ke portal me "+ New Event" button render hi nahi hoga — disabled nahi, **gayab**. |
| **Apna event edit / cancel** | Sirf TPO, aur usme bhi sirf apna banaya hua (upar wala ownership note). Cancel ka matlab delete nahi — event "Cancelled" ban kar usi audience ko dikhta rehta hai. |
| **Apne reminders** | Teeno ko. Reminder private hai — banane wale ke alawa kisi ko kabhi nahi dikhta, TPO ko bhi doosre TPO ka nahi. |
| **Settings** | Nudge timing, daily limit, quiet hours — ye **Super Admin portal** ka kaam hai, isliye hamare teeno role ke liye ❌. |

#### Ye lagu kahan-kahan hoga

Ek hi matrix teen jagah chalegi, teeno me:

1. **API par (asli taala)** — har route par `require('calendar.create_event')`
   jaisi dependency. Capability nahi → **403**, chahe request kahin se bhi aaye.
2. **Query par (data ka daayra)** — capability ye bhi decide karti hai ki
   `list_items()` kitna data laayegi: `view_org_events` wale ko poore org ka,
   `view_targeted_events` wale ko sirf apna targeted. Matlab student ki API
   response me doosron ka data kabhi **aata hi nahi** — filter frontend par
   nahi hai.
3. **UI par (sirf saaf-safai)** — button/tab chhupane ke liye.

```
// frontend par bhi wahi naam
can('calendar.create_event')   →  "+ New Event" dikhana hai ya nahi
can('calendar.edit_own_event') →  detail panel me Edit / Cancel
```

> **UI wala check security nahi hai.** Browser me kuchh bhi badla ja sakta hai,
> isliye UI sirf *shakal* theek rakhta hai — rokta backend hai. Par naam dono
> jagah **ek hi** rakhna zaroori hai: alag-alag rules likhe to ek din UI button
> dikhayega aur API 403 dega, aur user ko lagega feature toota hua hai.

**Naya role aane par:** ek entry jodni hai (backend ki `ROLE_CAPABILITIES`, aur
frontend ka wahi map). Screens, queries, routes — kuch nahi badalta.

**Default deny:** anjaan role ko kuch nahi dikhna chahiye — na backend se, na UI
par. Agar token me `role: "hod"` aaya aur hamari matrix me `hod` hai hi nahi, to
jawab **khaali calendar + 403** hoga, galti se "sab kuch dikha do" nahi. Code me
iska matlab: lookup fail ho to `False` lautao, exception mat khao aur
`True` to bilkul mat karo.

> ⚠️ **Teacher ka faisla PM se lena hai.** BRD §5 kehta hai *"Admin / Teacher /
> Publisher — No Campus Calendar access in v1"*, par ab teacher hamara role hai.
> Do options: **(A)** BRD ke hisaab se koi access nahi, ya **(B)** read-only
> viewer — college ke events aur deadlines dekhe, bana/badal na sake, apne
> reminders rakh sake. Upar ki ⚠️ wali cells yahi faisla hain. Poora detail
> backend design §1b me.
---

## 4. Calendar par kya-kya aata hai

| Item | Kahan se | Colour | Label | Kisko dikhta hai |
|---|---|---|---|---|
| **TPO Event** | TPO banata hai | Blue | event type ("PPT") | college ke saare TPO; targeted students |
| **Application Deadline** | **apne aap** — active job ki expiry date se | Red outline | "Deadline" | saare TPO; eligible students jinhone apply nahi kiya |
| **My Reminder** | TPO ya student khud | Slate, dashed | "My Reminder" | **sirf banane wala** |
| **Nudge** | system bhejta hai | Purple | "Reminder" | sirf wahi ek student |
| **Cancelled** | cancel kiya hua event | Muted, struck | "Cancelled" | wahi audience jo original ki thi |

**Colour ke saath text label hamesha.** Sirf colour par kabhi mat chhodna.

---

## 5. Poora flow — end to end

```
┌────────────────────────────────────────────────┐
│ TPO PORTAL — Campus Calendar                   │
│  Create Event   ·   Campus job   ·  My Reminder│
│  (ek hi form)       (deadline,       (private) │
│                      automatic)                │
└───────────────────────┬────────────────────────┘
                        ▼
┌────────────────────────────────────────────────┐
│ 7SEERS PLATFORM                                │
│  • sahi students dhoondho (targeting)          │
│  • notifications bhejo (Bell · Push · Email)   │
│  • nudges schedule karo                        │
└───────────────────────┬────────────────────────┘
                        ▼
┌────────────────────────────────────────────────┐
│ STUDENT PORTAL  ·  STUDENT MOBILE APP          │
│  Calendar · Coming Up · Feed cards ·           │
│  Notifications · My Reminders                  │
└────────────────────────────────────────────────┘
```

### TPO ka raasta

1. Sidebar se **Campus Calendar** kholta hai — **yahi ek entry point hai**
2. **Ek hi Create Event form** se koi bhi activity banata hai (Company optional)
3. Audience chunta hai: **Opportunity Type → Course → Batch → Department**, aur
   live count dekhta hai — *"142 students will be notified"*
4. Job ki application deadline **apne aap** calendar par aa jaati hai
5. Apna event edit ya cancel kar sakta hai
6. Usi form se private **My Reminder** bhi bana sakta hai

### Student ka raasta

1. **Calendar tab** kholta hai — unseen changes ke liye red dot
2. Home par **Coming Up** card — agle 3 items
3. Home feed me updates cards ki shakal me
4. Detail dekhta hai, deadline par **View & Apply**
5. **+ Add Reminder** ya kisi bhi item par **Remind me**

### Mobile

Bottom nav me **naya tab nahi** — bell ke baayein Calendar icon. Dashboard par
Coming Up card. Calendar screen List (default) ya Month. Detail full-screen.

---

## 6. Screens — saare 40

Wireframe, states aur exact copy `requirements/campus-calendar-ui-spec.md` me hain. Yahan
sirf naksha hai.

### TPO Portal (17) — `7Seers-TPO-2.0`

| ID | Screen | FR |
|---|---|---|
| T-01 | Sidebar item (Job Listings ke baad) | 01 |
| T-02 / a / b / c | Calendar page — Month / Week / List / states | 02, 03, 04 |
| T-03 / a / b / c / d | Create Event drawer + 4 variants | 05, 06, 07, 12 |
| T-03e | **Link a Job picker** — campus job ya pasted link | *(BRD me nahi — UI Spec addition)* |
| T-04 / a / b / c / d | Detail panel — creator / other TPO / cancelled / deadline / reminder | 08, 09, 11, 12, 13 |
| T-05 | Edit — review changes | 10 |
| T-06 | Cancel dialog | 11 |

### Student Portal (14) — `7Seers-Student-2.0`

| ID | Screen | FR |
|---|---|---|
| S-01 | Calendar tab + red dot | 14 |
| S-02 | Home — Coming Up card | 14 |
| S-03 | Home — 7 naye feed cards | 18 |
| S-04 / a / b | Calendar — Month / List / states | 14 |
| S-05 / a / b / c | Detail — event / assessment / deadline / nudge | 16 |
| S-06 | Status badges + banners | 17 |
| S-07 / a | Add Reminder drawer + detail | 19 |
| S-08 | Bell me calendar notifications | 24 |

### Mobile (8) — *repo pending*

M-01 … M-07 — Calendar icon, Coming Up, Calendar screen (List/Month), full-screen
detail, Add Reminder, Notifications, Push. **FR 19, 20, 21, 22, 23**

### Super Admin (1)

A-01 — Calendar & Nudges settings. **FR 27**

---

## 7. Backend ka khaka

Poora design `campus-calendar-backend-design.md` me hai. Yahan sirf 6 lines:

| Layer | Kya | Kahan |
|---|---|---|
| Roles / permissions | capability matrix, default deny | `app/auth/permissions.py` |
| ORM models | 6 nayi tables | `app/db/models.py` |
| Pydantic | request/response schemas | `app/models/request_model.py`, `response_model.py` |
| Services | targeting, diff, deadline derive, nudge rules | `app/services/calendar_service.py` |
| Routes | TPO + student + settings endpoints | `app/routes/calendar.py` |
| Migrations | tenant schema | `migrations/tenant-migrations` |
| Scheduler | nudges, notifications | background worker |

**Chaar cheezein jo backend me pakki hain:**

1. **Deadline kabhi store nahi hogi** — job se derive hogi, warna job badla aur
   calendar purana reh gaya
2. **Event kabhi chupchaap delete nahi hota** — pehle soft cancel (audit ke liye, students ko "Cancelled" dikhta hai). Cancel ke baad hi uska maalik TPO use **hamesha ke liye delete** kar sakta hai ("Delete permanently"); "Delete all" bhi hai.
3. **Har permission server par** — UI par button chhupana kaafi nahi
4. **Role-based access capability matrix se** — naya role = ek entry, baaki kuch
   nahi badalta

---

## 8. Step by step — kya pehle, kya baad me

Poora build plan. Har step me likha hai **kya banana hai**, **kahan**,
**kaun se FR / kaun si screen**, aur **kab done maanein**.

### Order ek nazar me

```
Phase 0   decisions + API contract      ← ye kiye bina aage mat badho
   │
Phase 1   DB tables + migrations
   │
Phase 2   backend TPO APIs ─────────────┐
   │                                    │ frontend + backend
Phase 3   TPO calendar (sirf dikhana)   │ yahan se parallel
   │                                    │
Phase 4   TPO create / edit / cancel ───┘
   │
Phase 5   notifications (bell + push + email)
   │
Phase 6   student portal
   │
Phase 7   nudges + scheduler
   │
Phase 8   super admin settings
   │
Phase 9   QA round
   │
Phase 10  mobile app                    ← repo milne par
```

**Order ki wajah:**

- **Phase 0 pehle** — timezone aur student ka course/batch/department kahan hai,
  ye jaane bina schema do baar likhna padega
- **Backend pehle** — frontend ko kuch chahiye to hoga dikhane ke liye
- **Read pehle, write baad me** — Phase 3 me calendar dikhna shuru ho jaata hai,
  demo ke layak ho jaata hai; Phase 4 me usi par actions lagte hain
- **Notifications student portal se pehle** — Phase 6 me student ko wahi dikhana
  hai jo Phase 5 bhejta hai
- **Nudges sabse baad me** — unhe real events chahiye test karne ke liye

**Order ki wajah:**

- **Phase 0 pehle** — timezone aur student ka course/batch/department kahan hai,
  ye jaane bina schema do baar likhna padega
- **Backend pehle** — frontend ko kuch chahiye to hoga dikhane ke liye
- **Read pehle, write baad me** — Phase 3 me calendar dikhna shuru ho jaata hai,
  demo ke layak ho jaata hai; Phase 4 me usi par actions lagte hain
- **Notifications student portal se pehle** — Phase 6 me student ko wahi dikhana
  hai jo Phase 5 bhejta hai
- **Nudges sabse baad me** — unhe real events chahiye test karne ke liye

### Har phase ka "done" ka matlab

| Phase | Done tab jab |
|---|---|
| 0 | saaton sawaalon ke jawab likhe hain, API contract approved hai |
| 1 | migration up aur down dono chal gaye |
| 2 | har endpoint par ownership aur timing ke rules server par lag gaye |
| 3 | TPO poora mahina teeno views me dekh sakta hai, filter laga sakta hai |
| 4 | event ban raha hai, badal raha hai, cancel ho raha hai; doosre TPO ko view-only |
| 5 | notification service band karke bhi event save hota hai |
| 6 | do alag batch ke students ko log in karke alag-alag sahi items dikhte hain |
| 7 | time aage badha kar test kiya — sahi waqt, sahi student, priority + quiet hours lagte hue |
| 8 | settings save hoti hain, aur sirf aage ke nudges par asar daalti hain |

---

---

### Repos aur unka role

| Kya | Repo | Stack |
|---|---|---|
| Backend (saari API, DB, scheduler) | `backend/7Seers-SkillsBridge` | FastAPI + SQLAlchemy + Alembic |
| TPO Portal | `7Seers-TPO-2.0` | React + TS + Vite (`src/pages`, `src/api`, `src/shared`) |
| Student Portal | `7Seers-Student-2.0` | React + TS (`src/modules/*`) |
| Super Admin Portal | `7Seers-SuperAdminFE-Presentation` / `7Seers-RemoteFE-Admin` | React (JSX) |
| Student Mobile App | **local repo me nahi hai** | — |
| **Abhi ka chalta build** — frontend | `calendar/calendar-frontend` | React + TS + Vite — `src/calendar` (calendar package) + `src/modules/Calendar` (campus app) |
| **Abhi ka chalta build** — backend | `calendar/calendar-backend` | FastAPI + Postgres (alag service — `campus-calendar-backend-design.md`) |

> Mobile repo abhi machine par nahi hai. Phase 10 tab tak hold rahega jab tak
> repo na mile — baaki kaam uske bina chalta rahega.

### Abhi kaise bana hai — `calendar-frontend` (2026-10-30)

Neeche ke phases plan hain; asli code me frontend do hisson me hai:

| Hissa | Kahan | Kya karta hai |
|---|---|---|
| **Calendar package** (headless) | `src/calendar` (`index.ts`, `Calendar.tsx`) | **Sirf dikhata aur batata hai.** Koi modal, API call ya toast nahi. Sirf npm packages import karta hai (react, date-fns, lucide-react, clsx, tailwind-merge, class-variance-authority, `@radix-ui/react-popover`, `@radix-ui/react-slot`). Callbacks: `onViewEvent` (required), `onCreateRequest`, `onDeleteAllRequest`, `onSyncRequest`, `onNotice`. Views, `DayPreview` (din ki timeline — overlap wale items lanes me side-by-side, clash warning colour me), helpers, `LIMITS`, words export karta hai. Poora use: `src/calendar/README.md` (= `docs/calendar-usage.md`) |
| **App ke modals + operations** | `src/modules/Calendar/pages/CalendarPage/index.tsx` | Ek `modal` state (`CalendarPage.types.ts`: `entry` / `publish` / `view` / `cancel` / `delete` / `deleteAll` / `sync`). Har modal yaad rakhta hai kahan se khula (`back`), to **Back / Go Back** wahin le jaata hai, bhare hue data ke saath. Saari API calls aur toasts yahin |
| Modals | `src/modules/Calendar/components/` | `EventEntryDialog` (pehla step — title, date/time, repeat, remind, description/note; **event type nahi**), `PublishEventDialog` (doosra step — event type incl. My Reminder, "Other" + naam, company, venue/mode, audience (sirf create), image, linked job; edit me "Edit Event" / "Save Changes"), `EventDetailModal` (view), `CancelEventDialog`, `ConfirmDialog`, `SyncDialog`, `AudienceDialog`, `ClashWarning`; frame `Modal`, fields `TimeSelect`, `RepeatField`, `parts` |
| Rules / helpers | `services/eventSchema.ts`, `services/openEvent.ts`, `helpers/drafts.ts`, `constants/{tpo,labels,words}.ts` | form ke rules (`allowPastDates` context me); bell se kholna; `reminderFor` / `dayEntriesOf`; `ALLOW_PAST_DATES = false`; `CALENDAR_LABELS` (calendar ke words) + `MODAL_LABELS` (modals ke words) |

**Flow jo abhi chalta hai:**

- **New Event** → pehla step → **Next** → doosra step (type chuno) → **Publish Event**. Doosre step ka **Back** sab bhara hua rakhta hai.
- **Edit:** view → **Edit Event** (pehla step) → **Next** → doosra step → **Save Changes**. Reminder ka edit ek hi step.
- **Cancel / Delete** view ya edit se → **Go Back** wahin laut-ta hai (edit ka unsaved input bacha rehta hai).
- **Sync** toolbar se → app ka `SyncDialog` (`.ics` feed link, Google / Outlook).
- **Bell / dashboard / reminders popup se kholna** → `requestOpenEvent(id)` (`services/openEvent.ts`) → page ka view modal khulta hai; page abhi khula na ho to load hone par.
- **Past date:** `ALLOW_PAST_DATES = false` — past din par click ya create button kuch nahi kholta, calendar `onNotice({ type: 'past-date' })` bhejta hai; form bhi aaj ya aage ki date maangta hai (events aur reminders dono).

---

### PHASE 0 — Code likhne se PEHLE (decisions)

Ye sab tay kiye bina aage mat badhna. Har ek backend schema ya API shape ko
badal deta hai.

#### Step 0.1 — In sawaalon ke jawab le lo

| # | Sawaal | Kyun zaroori hai |
|---|---|---|
| 1 | Timezone — sab kuch IST me store hoga ya UTC me, aur render kahan convert hoga? | Nudge timing, quiet hours, "today" ka matlab — sab isi par |
| 2 | Student ka `course`, `batch`, `department` kis table/field me hai? | Targeting aur live count isi par chalega (FR-CAL-07) |
| 3 | Job eligibility ka maujooda logic kahan hai (FR-JP-17)? | Deadline student ko dikhani hai ya nahi, wahi decide karega (FR-CAL-08) |
| 4 | Notification service (bell/push/email) abhi kaun sa hai, uska interface kya hai? | FR-CAL-24 usi ke upar banega, naya nahi banana |
| 5 | Scheduler/queue kya hai — Celery, cron, kuch aur? | Nudges (FR-CAL-25) ke liye chahiye |
| 6 | Push notification ka provider (FCM?) aur device token kahan store hote hain? | Mobile push ke liye |
| 7 | Super Admin settings kis table me jaati hain abhi? | FR-CAL-27 wahin add hoga |

**Done when:** har sawaal ka jawab likha hua hai, aur jahan "abhi hai hi nahi"
hai wahan uska alag ticket ban chuka hai.

#### Step 0.2 — API contract pehle likho, code baad me

Ek `campus-calendar-api.md` banao jisme har endpoint ka request/response shape
ho. Frontend aur backend dono isi par kaam karenge, parallel me.

**Done when:** TPO aur Student dono ke developers ne contract padh kar haan
bola ho.

---

### PHASE 1 — Backend: Data Model

#### Step 1.1 — Tables banao

| Table | Kya rakhta hai | FR |
|---|---|---|
| `calendar_event` | TPO ka event — type, title, company, date, start/end time, mode, venue/platform, description, org, created_by, status (published/cancelled), cancel_reason, cancel_note, timestamps | FR-CAL-05, 06, 09, 11 |
| `calendar_event_audience` | Event ka target — opportunity_type, courses[], batches[], departments[] | FR-CAL-07 |
| `calendar_event_recipient` | Kaun sa student kis event ki audience me hai, aur uska state (active / removed) | FR-CAL-10, 15, 17 |
| `calendar_reminder` | TPO aur student dono ke My Reminders — owner_id, owner_role, title, date, time, note, remind_before, linked_item | FR-CAL-12, 19 |
| `calendar_nudge` | Bheja gaya ya schedule kiya gaya nudge — student, type (N-S1/2/3), item ref, scheduled_at, sent_at, status | FR-CAL-25, 26 |
| `calendar_settings` | Super Admin ki nudge settings (platform-wide, ek hi row) | FR-CAL-27 |

**Dhyan rakhna:**
- `calendar_event` me pehle **soft cancel** hota hai (FR-CAL-11) — row rehti
  hai aur students ko "Cancelled" dikhta hai. Cancel ke baad maalik TPO use
  "Delete permanently" se hata sakta hai (aur "Delete all" bhi hai).
- `calendar_event_recipient` me "removed" wala state rakhna zaroori hai, warna
  "No longer applicable" (FR-CAL-17) dikha hi nahi paoge.
- Application Deadline ki **koi table nahi hogi** — wo job se derive hota hai
  (Step 1.2).

**Done when:** Alembic migration likh kar local par up/down dono chal gaye.

#### Step 1.2 — Deadline ko derive karo, store mat karo

Application Deadline job ke `application_expiration_date` se banta hai. Uski
copy mat banana — job badla to copy purani ho jayegi.

**Done when:** ek service function hai jo (org, date range) leta hai aur active
jobs se deadline items banata hai.

**FR:** FR-CAL-08

---

### PHASE 2 — Backend: TPO APIs

#### Step 2.1 — Audience ka live count

```
POST /calendar/audience/count
     { opportunity_type, courses[], batches[], departments[] }
  →  { count: 142 }
```

Sirf **active** students ginno, aur jinki profile me batch ya department nahi
hai unhe **mat** ginno (FR-CAL-07).

**Done when:** alag-alag combinations par count sahi aata hai, aur khali
audience par `0` aata hai.

#### Step 2.2 — Audience ke options

Course / Batch / Department ki list students ki profile se aani chahiye, hardcode
nahi. Batch ki list `opportunity_type` par badalti hai:

| Opportunity Type | Kaun si batches |
|---|---|
| Job | sirf final-year passing batch |
| Internship | pre-final + final year |
| General | koi bhi batch |

**FR:** FR-CAL-07

#### Step 2.2a — Roles aur capability matrix

`app/auth/permissions.py` — `Role`, `Capability`, `ROLE_CAPABILITIES`, aur
`require(capability)` dependency. Har route ispar lagega.

**Done when:** teeno role ke test pass hain, aur **anjaan role ko kuch nahi
milta**.

**FR:** §3a *(BRD me explicit FR nahi — hamara design faisla)*

#### Step 2.3 — Calendar list API (TPO)

```
GET /calendar/events?from=&to=&view=month|week|list&filters…
```

Ek hi response me teen cheezein aani chahiye: TPO events + derived deadlines +
us TPO ke apne reminders. Frontend ko teen call nahi karni chahiye.

**Filters (FR-CAL-04):** opportunity_type, course, batch, department,
event_type, company, created_by_me.

**Zaroori rule:** filter chahe jo lage, **TPO ke apne My Reminders hamesha
dikhenge**.

#### Step 2.4 — Create / Edit / Cancel

| Endpoint | Rule |
|---|---|
| `POST /calendar/events` | audience se recipients nikal kar `calendar_event_recipient` bhar do |
| `PATCH /calendar/events/{id}` | sirf creator; `event_type` doosre event type me badal sakta hai (nudges reschedule), par **My Reminder me nahi → 403**; `other` par `other_type` (naam) required; past event edit nahi ho sakta |
| `POST /calendar/events/{id}/cancel` | sirf creator; reason mandatory; end time ke baad nahi |

Edit par **audience diff** nikalna hai — kaun bacha (updated), kaun naya aaya
(added), kaun nikal gaya (removed). Yahi teen cheezein notification decide
karengi (FR-CAL-10).

**Done when:** har endpoint par ownership aur timing ke rules server-side lag
chuke hain. Frontend par bharosa nahi karna.

#### Step 2.5 — My Reminder APIs

CRUD — par sirf owner apna reminder dekh/badal sakta hai. Student ke liye 50
upcoming ki limit bhi yahin lagegi (FR-CAL-19).

---

### PHASE 3 — TPO Portal: Calendar dikhao (read-only)

Yahan se frontend shuru. Pehle sirf **dikhana**, banane-badalne ka kaam Phase 4
me.

#### Step 3.1 — Sidebar me entry  ·  `T-01`

`7Seers-TPO-2.0/src/shared/components/Sidebar` me naya item, **Job Listings ke
baad**. Route `/tpo/calendar`, `src/app/routes/TpoRoutes.tsx` me.

Top bar, Dashboard, Job Listings — kisi aur page par kuch nahi jodna.

**FR:** FR-CAL-01

#### Step 3.1a — Capability map frontend par

Wahi capability naam jo backend me hain, ek shared map me. Har button aur har
screen `can(...)` se poochega — apna alag `if role === 'tpo'` kahin nahi.

**Done when:** TPO, teacher aur student teeno se login karke dekha — har ek ko
sirf apne allowed controls dikhte hain.

#### Step 3.2 — Page ka dhaancha  ·  `T-02`

`src/pages/Calendar/` — header (title + "+ New Event"), view toggle
(Month / Week / List), Previous / Today / Next, filters row, aur neeche legend.

#### Step 3.3 — Teeno views  ·  `T-02`, `T-02a`, `T-02b`

| View | Screen | Kya chahiye |
|---|---|---|
| Month (default) | `T-02` | Mon–Sun grid, har date par max 3 items + "+N more" |
| Week | `T-02a` | time grid, upar all-day row, default 8 AM – 7 PM, baaki scroll par |
| List | `T-02b` | mahine ke saare items, date ke hisaab se group |

**Tile ka design (FR-CAL-03):** coloured **left border**, poora fill nahi. Har
tile par colour ke saath **text label** bhi — sirf colour par kabhi mat chhodna.

#### Step 3.4 — Saare states  ·  `T-02c`

Ye chaar states shuru me hi bana lo, baad me add karne me hamesha chhoot jaate
hain:

- Loading → skeleton
- Empty month → "No events this month." + "+ New Event"
- Filter se khali → "No events match these filters." + "Clear filters"
- Error → "Couldn't load the calendar." + Retry

**FR:** FR-CAL-02

#### Step 3.5 — Filters  ·  `T-02`

Saat filters (FR-CAL-04). Active filters ka count dikhana hai, aur view badalne
par filters bache rehne chahiye.

#### Step 3.6 — Detail panel  ·  `T-04`, `T-04a`, `T-04b`, `T-04c`, `T-04d`

Item par click → right side panel, calendar left me dikhta rahe. Paanch
variants: apna event, doosre TPO ka event, cancelled event, deadline, my
reminder (FR-CAL-13).

> **Abhi:** detail ek modal hai — `EventDetailModal` (app ka). Calendar sirf
> `onViewEvent` deta hai; campus wali rows (Campus time, "Other" ka naam, company,
> audience, linked job) `CalendarPage` ka `eventDetails` deta hai.

**Done when:** ek TPO apne college ka poora mahina teeno views me dekh sakta
hai, filter laga sakta hai, aur kisi bhi item ka detail khol sakta hai.

---

### PHASE 4 — TPO Portal: Create / Edit / Cancel

#### Step 4.1 — Create Event drawer  ·  `T-03`, `T-03a`, `T-03b`, `T-03d`

Right se slide-in drawer. **Ek hi drawer, 9 types** — type badalne par sirf
fields badalte hain (FR-CAL-05, FR-CAL-06).

Kaun sa field kab:

| Type | Time | Mode/Venue | Audience |
|---|---|---|---|
| PPT, Company Visit, Training, Orientation, Practice Test | Start + End | chahiye | chahiye |
| Other | Start + End | chahiye | chahiye — **aur apna naam mandatory** (≤ 80) |
| Online Assessment | Start + End | nahi | chahiye |
| Deadline | sirf date (all-day) | nahi | chahiye |
| My Reminder | date + optional time | nahi | **nahi** |

> **Abhi kaise bana:** drawer nahi, **do-step modal**. Pehla step (`EventEntryDialog`)
> generic hai — title, date/time, repeat, remind, description; type nahi. **Next** →
> doosra step (`PublishEventDialog`) me type (My Reminder bhi), "Other" ka naam,
> company, venue/mode, audience, image, linked job. Form ke bagal me calendar ka
> `DayPreview` din ki timeline dikhata hai; clash hone par `ClashWarning` —
> "N events clash", har line par naam + time, pehle 3 phir "+N more".

#### Step 4.2 — Audience builder  ·  `T-03`

Opportunity Type → Course → Batch → Department, isi order me. Har change par
count API (Step 2.1) chalegi aur "X students will be notified" update hoga.

Count `0` ho to **Publish disable** ho jaye.

#### Step 4.3 — Company hint  ·  `T-03`

Company chunne par us company ke pehle se plan kiye events dikhao — sirf
jaankari ke liye, rokna nahi hai (FR-CAL-05).

#### Step 4.4 — Edit  ·  `T-05`

- Sirf creator. `event_type` doosre event type me badal sakta hai, par **My
  Reminder me kabhi nahi** (edit par type picker me My Reminder hai hi nahi; backend 403).
- **Important change** (date/time/mode/venue/audience) → notification pakka.
- **Minor change** (title/description/company) → checkbox "Notify students about
  this change", default **off**.
- Audience edit form me nahi badalti — event ke view se alag **Audience** dialog
  (`AudienceDialog`, `PUT /calendar/events/{id}/audience`) kaun judega / kaun hatega
  dikhata hai aur wahi notify karta hai. (Alag "review changes" dialog bana tha,
  kabhi use nahi hua — hata diya.)
- Edit ka raasta: view → **Edit Event** (pehla step) → **Next** → doosra step →
  **Save Changes**. Reminder ka edit ek hi step.
- Frontend `notify_on_change = !onlyMinorChanged || ticked` bhejta hai. Off par
  jinhone notification padh li thi unki read hi rehti hai ("… details have been
  updated."); on par sabko phir unread ("… has been updated: <summary>.").
  Change summary description/note ko unke text se compare karti hai.

**FR:** FR-CAL-10

#### Step 4.5 — Cancel  ·  `T-06`

Reason mandatory (Postponed / Company Withdrew / Created by Mistake / Other).
"Postponed" chunne par tip dikhao ki date edit kar lo — par rokna nahi.

**Created by Mistake** alag behave karta hai: student ke calendar se hat jaata
hai, TPO ke calendar par Cancelled dikhta rahega (FR-CAL-11).

**Abhi:** `CancelEventDialog` (app ka; header / body / footer config se) view ya
edit dono se khulta hai; **Go Back** wahin laut-ta hai, edit ka unsaved input
bacha rehta hai. "Postponed" wali tip edit kholti hai. Repeating event par
"only this" ya "this and later". Cancelled event ko owner view se **Delete
permanently** kar sakta hai (`ConfirmDialog`).

#### Step 4.5a — Link a Job  ·  `T-03e`  *(naya)*

Create Event drawer me Description ke neeche **"+ Link a Job"**. Do tareeke:

| Tareeka | Fields | Student ko kya milta hai |
|---|---|---|
| **Campus job** | 7Seers ke active jobs me se ek chuno (company / title se search) | job ka detail khulta hai, wahin se apply |
| **Paste a job link** | URL + Job Title (dono required) | link naye tab me khulta hai, apply wahan |

**Validation:** URL `https://` se shuru hona chahiye, warna
*"Enter a valid link starting with https://"* aur **Link Job disabled**.

Optional hai — koi bhi event bina linked job ke publish ho sakta hai.

#### Step 4.6 — My Reminder (TPO)  ·  `T-03c`, `T-04d`

Usi drawer se, type = My Reminder. Drawer par likha ho "Only you can see this.
No students are notified." Edit/Delete hai, Cancel nahi (FR-CAL-12).

**Abhi:** TPO doosre step me type = My Reminder chun kar **Save Reminder** karta
hai; student ka "Add Reminder" pehle step par hi save ho jaata hai. Kisi event par
student ka **Remind me** pehla step kholta hai, linked reminder ke saath
(`helpers/drafts.ts` → `reminderFor`).

**Done when:** ek TPO event bana sakta hai, badal sakta hai, cancel kar sakta
hai; doosre TPO ko sirf view-only dikhta hai.

---

### PHASE 5 — Notifications

#### Step 5.1 — Trigger points

FR-CAL-24 ki table ke hisaab se saat trigger. Har ek ke liye bell + push + email
ka decision alag hai — wo table hi sach hai.

#### Step 5.2 — Background me bhejo

TPO ko kabhi wait nahi karana. Request return ho jaye, notification background
me jaaye.

- 60 second ke andar nikal jaaye
- badi audience **500 ke batch** me
- fail ho to **5 baar retry**, phir bhi fail ho to ops ko flag
- notification fail hone se TPO ka save **kabhi nahi** rukna chahiye

#### Step 5.3 — Deep link

Bell ya push par tap karne se seedha usi item ka detail khule.

**Abhi:** bell, dashboard ke Coming Up / Updates feed aur reminders popup
`requestOpenEvent(id)` (`src/modules/Calendar/services/openEvent.ts`) bulaate
hain; calendar page (`takePendingOpen` / `onOpenEventRequest`) apna view modal
kholta hai — page baad me khule to bhi. Calendar package isme shaamil nahi.

**Done when:** har trigger par sahi channel par sahi text jaata hai, aur
notification service band hone par bhi event save hota hai.

---

### PHASE 6 — Student Portal

#### Step 6.1 — Visibility server par

Sabse pehle yeh. `GET /calendar/student/events` sirf wahi bheje jo student ko
dikhna chahiye. Doosre college ka ya audience se bahar ka item maangne par
**403** (FR-CAL-15).

Jis student ki profile me batch/department nahi hai use sirf General events,
apne deadlines aur apne reminders dikhenge.

#### Step 6.2 — Calendar tab  ·  `S-01`, `S-04`, `S-04a`, `S-04b`

`7Seers-Student-2.0` ke top nav me **Jobs Board ke baad** Calendar tab. Month
(default) + List. Filters **nahi** hain — student ko wahi dikhta hai jo uska hai.

#### Step 6.3 — Red dot  ·  `S-01`

Koi naya / updated / cancelled / no-longer-applicable item ho aur student ne
dekha na ho to tab par red dot. Calendar kholte hi clear (FR-CAL-14).

#### Step 6.4 — Coming Up card  ·  `S-02`

Home ke right column me sabse upar, Available Opportunities ke upar. Agle 3
items, Today / Tomorrow / date ke saath, aur "View all". Cancelled aur
no-longer-applicable items yahan **nahi** aayenge.

#### Step 6.5 — Home feed cards  ·  `S-03`

Saat kism ke cards (FR-CAL-18), newest first, maujooda cards ke saath mix hokar.
Deadline card par JRI Match strip bhi aayegi. **My Reminders ka koi card nahi
banta.**

#### Step 6.6 — Status badges  ·  `S-06`

Updated (48 ghante), Cancelled, No longer applicable, Past — chaaron ka apna
look (FR-CAL-17).

#### Step 6.7 — Student My Reminder  ·  `S-07`, `S-07a`

Teen jagah se ban sakta hai: "+ Add Reminder", khali date par click, ya kisi
event/deadline par **"Remind me"**. Teesre case me title aur linked item apne
aap bhar jaate hain, aur "1 hour before" set ho jaata hai.

Linked event badla to:
- date badli → reminder apni jagah rahega, par detail me likha aayega ki event
  khisak gaya hai, "Update reminder" link ke saath
- cancel hua → reminder rahega par alert nahi jaayega

Limit 50 upcoming (FR-CAL-19).

**Done when:** do alag batch/department ke students ko log in karke dekho — dono
ko alag-alag, sahi items dikhne chahiye.

---

### PHASE 7 — Nudges

Ye phase notifications se **alag** hai. Notification TPO ke kaam par chalti hai,
nudge **time par** chalta hai.

#### Step 7.1 — Scheduler

Teen nudge (FR-CAL-25):

| ID | Kab | Kiske liye |
|---|---|---|
| N-S1 | 1 din pehle + 1 ghanta pehle | event ki audience |
| N-S2 | 2 din pehle + deadline wale din | eligible, jinhone apply nahi kiya |
| N-S3 | test wale din subah 8 baje | Online Assessment ki audience |

#### Step 7.2 — Rules (FR-CAL-26)

- **Daily limit 3** — zyada ho to priority: Deadline > Online Assessment > Event
- **Quiet hours 10 PM – 7 AM** — push rukega, 7 AM par jaayega.
  **Exception:** 1-hour wala event reminder tab bhi jaayega agar event hi quiet
  hours me shuru ho raha ho
- **Bhejne ke waqt dobara check** — event cancel, student audience se bahar,
  apply kar chuka, job inactive → nudge drop
- **Repeat nahi** — ek item + ek time ka nudge ek hi baar
- **Date badli** → pending nudges reschedule

> Student ke apne reminders in rules se **bahar** hain — na daily limit, na quiet
> hours. Time usne khud chuna hai.

#### Step 7.3 — Nudge calendar par bhi

Jis din nudge jaata hai, us din student ke calendar par purple "Reminder" item
bhi dikhega.

**Done when:** time aage badha kar test karo — sahi waqt par, sahi student ko,
sahi message, aur priority/quiet hours ke rules lagte hue.

---

### PHASE 8 — Super Admin Settings

#### Step 8.1 — Settings page  ·  `A-01`

Platform Settings → Calendar & Nudges. Chhe settings (FR-CAL-27), har ek ki
range validate karni hai.

#### Step 8.2 — Sirf aage ke nudges par asar

Setting badalne se **pehle se schedule ho chuke** nudges nahi badlenge. Ye saaf
likh dena UI me bhi.

v1 me settings poore platform ke liye hain, per-college nahi.

---

### PHASE 9 — QA ka round

Ye khud ke liye checklist hai, test team se pehle:

- [ ] Do TPO, ek hi college — dono ko ek doosre ke events dikhte hain, par edit
      sirf apne par
- [ ] Doosre TPO ke My Reminder kabhi nahi dikhte
- [ ] Do alag batch ke student — dono ko alag-alag items
- [ ] Doosre college ke event ka ID daal kar API maarna → 403
- [ ] Job ki expiry date badlo → deadline khisak jaye, nudges reschedule ho
- [ ] Student apply kar de → deadline uske calendar se hat jaye
- [ ] Job Inactive → deadline sab jagah se hat jaye
- [ ] Event cancel → "Cancelled" badge, reason dikhe; "Created by Mistake" par
      student ke calendar se hat jaye
- [ ] Audience se nikale gaye student ko "No longer applicable" dikhe
- [ ] Notification service band karke event banao → event bachna chahiye
- [ ] Ek student ko 5 nudge due karo → sirf 3 jaayein, priority ke hisaab se
- [ ] Quiet hours me nudge due karo → 7 AM par jaaye
- [ ] 51st reminder banane ki koshish → limit ka message

---

### PHASE 10 — Mobile App

**Repo milne ke baad.** Content aur rules Student Portal jaise hi hain, sirf
dikhane ka tareeka alag (FR-CAL-20 se 23):

- Bottom nav me **naya tab nahi** — top bar me Calendar icon, bell ke baayein
- Dashboard par Coming Up card
- Calendar screen — **List default**, Month optional
- Detail **full-screen**, main action neeche fixed button me
- Notifications maujooda screen me, calendar icon ke saath
- Push par quiet hours aur daily limit lagu

---

### Screen → kahan banega → kaun sa FR

40 screens hain. Ye table hi build checklist hai — har row ek ticket ban sakti
hai.

#### TPO Portal — `7Seers-TPO-2.0`

> `Kahan` me `src/pages/Calendar/…` plan tha. Abhi ka asli code `calendar-frontend`
> me hai — har row me "Abhi:" ke baad (`components/` = `src/modules/Calendar/components/`).

| Screen | Kya | Kahan | FR | Phase |
|---|---|---|---|---|
| T-01 | Sidebar item + route | `src/shared/components/Sidebar`, `src/app/routes/TpoRoutes.tsx` | 01 | 3 |
| T-02 | Calendar page + Month view | `src/pages/Calendar/` · Abhi: `src/modules/Calendar/pages/CalendarPage` + `src/calendar` (`MonthGrid`) | 02, 03, 04 | 3 |
| T-02a | Week view | `src/pages/Calendar/views/Week` · Abhi: `src/calendar/components/DaysGrid` | 02 | 3 |
| T-02b | List view | `src/pages/Calendar/views/List` · Abhi: `src/calendar/components/ListView` | 02 | 3 |
| T-02c | Empty / loading / error | `src/pages/Calendar/states/` · Abhi: `src/calendar/components/CalendarState` | 02 | 3 |
| T-03 | Create Event drawer | `src/pages/Calendar/components/EventDrawer` · Abhi: do-step modal — `components/EventEntryDialog` → `components/PublishEventDialog` | 05, 06, 07 | 4 |
| T-03a | Online Assessment variant | wahi drawer, type-wise fields | 06 | 4 |
| T-03b | Deadline variant | wahi drawer | 06 | 4 |
| T-03c | My Reminder variant | wahi drawer | 12 | 4 |
| T-03d | Validation errors | wahi drawer | 05 | 4 |
| T-04 | Detail — creator | `src/pages/Calendar/components/DetailPanel` · Abhi: `components/EventDetailModal` (+ `CalendarPage` → `eventDetails`) | 13 | 3 |
| T-04a | Detail — other TPO | wahi panel, view-only state | 09 | 3 |
| T-04b | Detail — cancelled | wahi panel | 11, 13 | 3 |
| T-04c | Detail — deadline | wahi panel | 08, 13 | 3 |
| T-04d | Detail — my reminder | wahi panel | 12 | 3 |
| T-05 | Edit — review changes | Abhi: edit = wahi do-step modal (`isEdit`, "Save Changes"); audience badalna `components/AudienceDialog`. Alag ReviewChanges dialog **nahi** — bana tha, kabhi use nahi hua, hata diya | 10 | 4 |
| T-06 | Cancel dialog | `src/pages/Calendar/components/CancelDialog` · Abhi: `components/CancelEventDialog` (+ `ConfirmDialog` delete ke liye) | 11 | 4 |

#### Student Portal — `7Seers-Student-2.0`

| Screen | Kya | Kahan | FR | Phase |
|---|---|---|---|---|
| S-01 | Calendar tab + red dot | top nav (`src/modules/Shared/...`) | 14 | 6 |
| S-02 | Coming Up card | Home ka right column | 14 | 6 |
| S-03 | Feed cards (7 naye type) | Home feed | 18 | 6 |
| S-04 | Calendar page — Month | naya module `src/modules/Calendar/` | 14 | 6 |
| S-04a | List view | wahi module | 14 | 6 |
| S-04b | Empty / loading / error | wahi module | 14 | 6 |
| S-05 | Detail — TPO Event | `src/modules/Calendar/components/DetailPanel` | 16 | 6 |
| S-05a | Detail — Online Assessment | wahi panel | 16 | 6 |
| S-05b | Detail — Deadline | wahi panel | 16 | 6 |
| S-05c | Detail — Nudge | wahi panel | 16 | 6 |
| S-06 | Status badges + banners | tile + detail | 17 | 6 |
| S-07 | Add Reminder drawer | `src/modules/Calendar/components/ReminderDrawer` | 19 | 6 |
| S-07a | My Reminder detail | wahi panel | 19 | 6 |
| S-08 | Bell me calendar items | maujooda notifications | 24 | 5 |

#### Student Mobile App — *(repo pending)*

| Screen | Kya | FR | Phase |
|---|---|---|---|
| M-01 | Dashboard: Calendar icon + Coming Up | 20 | 10 |
| M-02 | Baaki screens par Calendar icon | 20 | 10 |
| M-03 | Calendar screen — List (default) | 21 | 10 |
| M-03a | Calendar screen — Month | 21 | 10 |
| M-04 | Event detail (full screen) | 22 | 10 |
| M-05 | Add Reminder screen | 19, 21 | 10 |
| M-06 | Notifications me calendar items | 23 | 10 |
| M-07 | Push notification | 23 | 10 |

#### Super Admin — `7Seers-SuperAdminFE-Presentation`

| Screen | Kya | FR | Phase |
|---|---|---|---|
| A-01 | Calendar & Nudges settings | 27 | 8 |

---

### Shared cheezein — ek baar banao, sab jagah use karo

In chaaron ko alag component banana, har page par dobara mat likhna:

| Cheez | Kahan use hoti hai |
|---|---|
| **Item tile** (coloured left border + type label) | T-02, T-02a, T-02b, S-02, S-04, S-04a, M-01, M-03 |
| **Legend** | T-02, S-04 |
| **Status badge** (Updated / Cancelled / No longer applicable / Past) | T-02, T-04b, S-04, S-06, M-03 |
| **Colour + label map** | sab jagah — UI Spec section 1 se, hardcode mat karna |

**Colour rule jo kahin na toote:** tile par colour ke saath **text label hamesha**
rahega. Sirf colour se kaam chalana accessibility ke liye bhi galat hai aur UI
Spec me bhi mana hai.

---

---

## 8b. Exact numbers — jo aasani se chhoot jaate hain

BRD aur UI Spec me bikhre hue ye numbers ek jagah. Code me **constant** banao,
inline mat likho.

| Kya | Value | FR |
|---|---|---|
| Title ki length | 120 | 05, 12, 19 |
| Description | 1000 | 05 |
| Venue / Online platform | 200 | 05 |
| Reminder ka note | 500 | 12, 19 |
| Cancel ka "Other" note | 200 | 11 |
| Event type "Other" ka naam (`other_type`) | 80, mandatory | 05 |
| Month tile par items | **3**, phir "+N more" | 02 |
| "Coming Up" card | agle **3** items | 14, 20 |
| **"Updated" badge** | **48 ghante** | 17 |
| Student ke upcoming reminders | **50** | 19 |
| Notification ka batch | **500** | 24 |
| Notification ki deadline | **60 second** | 24 |
| Notification retry | **5** baar | 24 |
| Default daily nudge limit | **3** (1–10) | 26, 27 |
| Quiet hours | **10:00 PM – 7:00 AM** | 26, 27 |
| **N-S3 ka waqt** | **subah 8:00**, org ke timezone me | 25 |
| N-S1 default | 1 din + 1 ghanta pehle | 25, 27 |
| N-S2 default | 2 din pehle + us din | 25, 27 |
| Week view ke ghante | 8 AM – 7 PM default | 02 |

### Chhoti baatein jo spec me hain par bhool jaati hain

- **"All departments" shortcut** — Department multi-select me ek button jo sab
  chun le (FR-CAL-07, T-03)
- **Nudge priority** — Application Deadline > Online Assessment > Event Reminder
  (FR-CAL-26)
- **Quiet hours ka exception** — 1-ghante wala event reminder tab bhi jaayega
  agar event khud quiet hours me shuru ho raha ho (FR-CAL-26)
- **Deadline card par JRI Match strip** — student ke feed me (FR-CAL-18, S-03)
- **Batch ka label** — "2027 (Final year)", sirf saal nahi (FR-CAL-07)
- **Past dates** — spec: TPO apne My Reminder past date par bana sakta hai; events
  nahi (FR-CAL-12 vs FR-CAL-05). **Abhi:** `ALLOW_PAST_DATES = false`
  (`constants/tpo.ts`) — events aur reminders dono sirf aaj ya aage; past din par
  click "Events and reminders can only be created for today or later." dikhata hai
- **Event type edit par** — spec me lock tha (FR-CAL-05). **Abhi:** ek event type
  se doosre me badal sakta hai (nudges reschedule), par event → My Reminder kabhi
  nahi (403 "An event cannot be changed into a reminder")
- **"Other" type** — apna naam mandatory (≤ 80); detail me "Event type" row me wahi
  naam dikhta hai
- **Linked Job** (UI Spec addition) — optional; campus job **ya** pasted link,
  dono nahi. Pasted link `https://` se shuru hona chahiye aur uske saath Job
  Title bhi mandatory hai

### UI Spec me aaya, BRD me abhi nahi

| Kya | Haal |
|---|---|
| **Linked Job** (T-03e) | UI Spec v2 me wireframe + validation hai, **BRD me koi FR nahi**. Student side ka "Linked Job card" S-05 me sirf heading hai, content nahi — **PM se poochna padega** |

---

## 9. Rules jo kahin na toote

Ye wo cheezein hain jo har screen, har API aur har phase me ek jaisi rehni
chahiye:

| # | Rule | Kyun |
|---|---|---|
| 1 | **Ek hi entry point** — TPO ke liye sirf sidebar ka Campus Calendar | kisi aur page par koi calendar button/widget nahi |
| 2 | **Ek hi Create form**, 9 types — sirf fields badalte hain (abhi: ek generic pehla step + ek doosra step jisme type chuna jaata hai) | 9 alag form banaoge to 9 jagah bug fix karna padega |
| 3 | **Colour + text label dono** | accessibility, aur busy days padhne layak rahein |
| 4 | **Edit/cancel sirf creator** | doosre TPO ko view-only note dikhega |
| 5 | **Deadline derive hogi, store nahi** | job badalte hi calendar apne aap sahi |
| 6 | **Soft cancel, delete kabhi nahi** | audit; "Created by Mistake" sirf student ke view se hatata hai |
| 7 | **My Reminder private** | kisi aur ko nahi dikhta, kisi ko notify nahi karta, feed card nahi banata |
| 8 | **Student ki visibility server par** | audience se bahar ka item maangne par 403 |
| 9 | **Student ke apne reminders nudge rules se bahar** | time usne khud chuna hai — na daily limit, na quiet hours |
| 10 | **Notification fail ho to bhi event save** | background + retry, TPO ka kaam kabhi na rukey |
| 11 | **Role ka faisla capability se, naam se nahi** | `if role == "tpo"` kahin nahi; UI aur API dono ek hi matrix padhein |
| 12 | **Anjaan role → default deny** | naya role aaya aur matrix me nahi hai, to use kuch na dikhe |

---

## 10. QA checklist

- [ ] Do TPO, ek college — dono ko ek doosre ke events dikhein, edit sirf apne par
- [ ] Doosre TPO ke My Reminder kabhi na dikhein
- [ ] Do alag batch ke student — dono ko alag-alag items
- [ ] Doosre college ke event ka ID daal kar API maaro → **403**
- [ ] Job ki expiry date badlo → deadline khisake, nudges reschedule hon
- [ ] Student apply kare → deadline uske calendar se hat jaye
- [ ] Job Inactive → deadline sab jagah se hat jaye
- [ ] Event cancel → "Cancelled" badge + reason; "Created by Mistake" par student ke calendar se gayab
- [ ] Audience se nikale gaye student ko "No longer applicable" dikhe
- [ ] Notification service band karke event banao → event bachna chahiye
- [ ] Ek student ko 5 nudge due karo → sirf 3 jaayein, priority ke hisaab se
- [ ] Quiet hours me nudge due karo → 7 AM par jaaye
- [ ] 51st reminder banane ki koshish → limit ka message
- [ ] Filter lagao → TPO ke apne My Reminders phir bhi dikhein
- [ ] Mahine badlo, view badlo → filters bache rahein
- [ ] New Event → Next → doosre step se **Back** → pehle step me sab bhara hua; phir Publish
- [ ] Type "Other" bina naam ke → "Enter the event type." (API: 422 "Specify the event type"); naam ke saath publish → detail me wahi naam
- [ ] Edit: view → Edit Event → Next → Save Changes; type badlo (PPT → Training) chalta hai; My Reminder picker me nahi (API par 403)
- [ ] Cancel / Delete view ya edit se kholo → **Go Back** wahin laut-e, edit ka unsaved input bacha rahe
- [ ] Sirf title/description/company badlo, "Notify students" off → jinhone padh li thi unki notification read hi rahe, "… details have been updated."
- [ ] Past din par click / create (`ALLOW_PAST_DATES = false`) → kuch na khule, "today or later" ka message
- [ ] Bell / dashboard se item kholo (calendar page band ho tab bhi) → calendar par view modal khule
- [ ] Sync → `.ics` link copy ho, Google / Outlook buttons chalein

---

## 11. Risks aur open questions

### Risks

| Risk | Kya ho sakta hai | Upaay |
|---|---|---|
| Timezone | nudge galat waqt par, "today" galat | UTC me store, org ke timezone me render — detail backend doc me |
| Audience snapshot | event ke baad student ka department badal gaya | recipients publish par freeze, edit par hi dobara |
| Badi audience | 2000 students ko notify karte waqt request atak jaye | background + 500 ke batch |
| Nudge double-send | scheduler do baar chal gaya | unique constraint (student + item + time) |
| Deadline ki copy | job badla, calendar purana | derive karo, store mat karo |
| Permission sirf UI me | button chhupa diya, API khuli rahi | har rule server par bhi |

### Open questions

1. **Timezone** — BRD me kahin nahi hai (backend doc me recommendation di hai)
2. **Mobile repo** — local machine par nahi hai
3. **FR-JP-17** (job eligibility) — reference hai, definition nahi; maujooda code se lena hoga
4. **Email template** — sirf text hai, design nahi
5. **"Final year" ka matlab** — passing year se nikalna hai ya profile me alag field hai
6. **Audit retention** — cancelled event kitne din rakhein, BRD me nahi likha

---

## 12. Conclusion

### Kya mil raha hai

| Actor | Kya badalta hai unke liye |
|---|---|
| **TPO** | Ek page se poora placement season plan, publish aur manage. Publish se pehle hi pata ki kitne students tak jaayega. Colleagues ke plans dikhte hain, to duplicate aur clash band. |
| **Student** | Ek personal calendar, web aur mobile dono par, jisme sirf unka kaam ka hai — unki batch/department ke events, aur unhi jobs ki deadlines jinke liye wo eligible hain aur apply nahi kiya. |
| **Super Admin** | Reminder behaviour poore platform ke liye, bina kisi release ke. |

### Do cheezein milkar kuch chhootne nahi deti

- **Notifications** kehti hain *"kuch badal gaya"* — TPO ke har action par
- **Nudges** kehte hain *"kuch aane wala hai"* — time par, apne aap

Dono milkar Problem Statement ke do sabse bade gaps band karte hain: changes jo
student tak pahunchte hi nahi the, aur deadlines jo chup-chaap nikal jaati thi.

### v1 ki jaan-boojh kar lagayi gayi hadein

Ye kamiyan nahi, faisle hain:

- **Ek hi entry point** — calendar ke buttons TPO ke doosre pages par bikhrenge nahi
- **Dikhta sabko, badalta sirf creator** — shared visibility, owned editing
- **Cancel soft hai** — reason ke saath dikhta rahega, taaki jisne plan banaya tha use samajh aaye
- **Edits graded hain** — important change pakka notify, minor sirf TPO chahe to; warna notification ki ahmiyat khatam ho jaati
- **My Reminders poori tarah private** — na targeting me, na kisi aur ko dikhte
- **Admin / Teacher / Publisher ko access nahi** — v1 me ye placement ka tool hai

### Safalta kaisi dikhegi

- Student kabhi event ya deadline isliye na chooke ki wo chat me dab gaya tha
- TPO ko ek hi event teen channels par dobara announce na karna pade
- Ek college ke do TPO clashing activities schedule na karein
- Super Admin bina release ke reminder behaviour tune kar sake

### Aage kya

1. **Phase 0 ke saat sawaal** — sabse pehle, kyunki inke bina schema badalna padega
2. **API contract** likh kar approve karao — uske baad frontend aur backend parallel
3. **Mobile repo** mangao, taaki Phase 10 plan me aa sake
