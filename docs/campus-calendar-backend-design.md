# Campus Calendar — Backend Design

Poora backend architecture: layers, DB design, tables, models, services, routes,
scheduler, validation, libraries, env variables, aur date/time ka faisla.

> **Ye ek INDEPENDENT service hai.** Apna database, apni tables, apni
> migrations, apne models — sab naya aur alag. `7Seers-SkillsBridge` ke andar
> kuch nahi joda jaa raha.

Stack wahi rakha hai jo team already jaanti hai — **FastAPI + SQLAlchemy +
Alembic + Pydantic v2** — aur patterns bhi `7Seers-SkillsBridge` jaise hi, taaki
koi naya tareeka seekhna na pade. Par **code, DB aur deployment alag hai**.

Iska ek bada natija hai: students aur jobs ka data **hamare DB me nahi hai**.
Wo API se aayega. §1a padhna zaroori hai.

---

## Contents

1. [Conventions — SkillsBridge se udhaar, code nahi](#1-conventions--skillsbridge-se-udhaar-code-nahi)
   - [**1a. Kya hamara hai, kya bahar se aayega**](#1a-kya-hamara-hai-kya-bahar-se-aayega)
   - [**1b. Roles aur permissions**](#1b-roles-aur-permissions)
2. [Architecture — layers](#2-architecture--layers)
3. [Date aur time — sabse pehle ye padho](#3-date-aur-time--sabse-pehle-ye-padho)
4. [DB design](#4-db-design)
5. [Tables — poori definition](#5-tables--poori-definition)
6. [SQLAlchemy models](#6-sqlalchemy-models)
7. [Pydantic models](#7-pydantic-models)
8. [Services — business logic](#8-services--business-logic)
9. [Routes — API endpoints](#9-routes--api-endpoints)
10. [Validation rules](#10-validation-rules)
11. [Notifications](#11-notifications)
12. [Nudge scheduler](#12-nudge-scheduler)
13. [Libraries](#13-libraries)
14. [Env variables](#14-env-variables)
15. [Migrations](#15-migrations)
16. [Step by step — build order](#16-step-by-step--build-order)
17. [Performance aur indexes](#17-performance-aur-indexes)
18. [Security checklist](#18-security-checklist)

---

## 1. Conventions — SkillsBridge se udhaar, code nahi

Service alag hai, par **likhne ka tareeka wahi** — isse review aasan rehta hai
aur log ek repo se doosre me aaram se ghoom sakte hain:

| Cheez | Kahan | Pattern |
|---|---|---|
| SQLAlchemy models | `app/stateful_services/db_schema.py` | `Base = declarative_base()`, ek hi file me saari tables |
| Tenant tables | wahi file | `__table_args__ = ({"schema": "tenant"},)` |
| Public tables | wahi file | koi `schema` arg nahi |
| Pydantic request | `app/models/request_model.py` | `BaseModel`, `Field`, `field_validator` |
| Pydantic response | `app/models/response_model.py` | `BaseModel` |
| Business logic | `app/services/<area>_service.py` | plain functions |
| Endpoints | `app/routes/<area>.py` | FastAPI `APIRouter` |
| DB session | `app/stateful_services/session.py` | `Depends(get_tenant_session)` / `get_public_session` |
| Auth | token se | `Depends(get_userinfo_from_token)` → `user_info["user_id"]`, `["org"]`, `["role"]` |
| Background kaam | FastAPI ka apna | `background_task: BackgroundTasks` → `add_task(...)` — **Celery nahi hai** |
| Config | `conf.py` (root) | `environ.get("NAME")`, module-level constants |
| Logs | `python-json-logger` | `log.info("action", extra={"event_type": "db_event", "payload": {...}})` |
| Migrations | `migrations/tenant-migrations` + `public-migrations` | do alag alembic.ini |

### Multi-tenancy — ab humare apne haath me

SkillsBridge me har college ka data `tenant` schema me alag hota hai, aur
`get_tenant_session` wo sambhalta hai. **Hamari service ke paas wo nahi hai**, to
isolation hum khud karenge:

| Tareeka | Faisla |
|---|---|
| Schema-per-tenant | ❌ nahi — ek nayi service ke liye bahut bhaari, aur migrations har tenant par chalani padengi |
| **`org_id` har row par + har query me filter** | ✅ **yahi** — simple, ek migration, ek connection pool |

Iska matlab ek niyam jo kabhi na toote:

```python
# har query me, bina exception
.filter(CalendarEvent.org_id == user_info["org_id"])
```

Isko bhoolna hi sabse bada risk hai. Do bachav:

1. **Base query helper** — har service `_scoped(db, org_id)` se shuru kare, raw
   `db.query(Model)` kahin na likhe
2. **Test** — ek test jo do org ka data banaye aur check kare ki cross-org
   kabhi na dikhe

```python
def _scoped(db, model, org_id):
    """Har calendar query yahin se shuru hoti hai. org_id kabhi optional nahi."""
    return db.query(model).filter(model.org_id == org_id)
```

### `calendar_settings` alag hai

Baaki sab tables par `org_id` hai. **`calendar_settings` platform-wide hai**
(FR-CAL-27: per-college v1 me nahi), to uspar `org_id` nahi — ek hi row rahegi.

---

## 1a. Kya hamara hai, kya bahar se aayega

Ye sabse important section hai. Independent DB ka matlab hai ki **students aur
jobs ka data hamare paas nahi hai** — uske bina audience aur deadlines ban hi
nahi sakte.

### Hamara apna data

| Cheez | Kahan |
|---|---|
| Events, audience, recipients | hamara DB |
| Reminders (TPO + student) | hamara DB |
| Nudges (schedule + status) | hamara DB |
| Settings | hamara DB |

### Bahar se aane wala data

| Chahiye | Kahan se | Kis kaam me |
|---|---|---|
| Students (org + course + batch + department se) | `USER_MANAGEMENT_IDENTITY_LIST` | audience resolve + live count |
| Ek student ki profile (course/batch/department) | user management | student ka calendar banate waqt |
| Active jobs + `application_expiration_date` | SkillsBridge jobs API | **deadlines derive karna** |
| Job ki eligibility (FR-JP-17) | SkillsBridge | student ko deadline dikhani hai ya nahi |
| Kisne apply kiya | SkillsBridge applications | apply karne par deadline hatana |
| Companies ki list | SkillsBridge companies | Create Event ka dropdown + company hint |
| Jobs ka search (company / title) | SkillsBridge jobs API | **Link a Job** picker (T-03e) |
| Bell / email / push | notification service | FR-CAL-24 |

### Iska asar — teen cheezein badal jaati hain

**1. Deadline ab SQL join nahi, API call hai**

```python
# ❌ ye ab nahi ho sakta — jobs hamare DB me hain hi nahi
db.query(JobDescription).filter(JobDescription.status == "active")

# ✅ API se
jobs = jobs_client.active_jobs(org_id, date_from, date_to)
```

Har calendar request par jobs API call hogi. Isliye:

- **short-TTL cache** rakho (60–120 second) — ek hi TPO mahine badal-badal kar
  dekhta hai, har baar jobs maangna bekaar hai
- jobs API down ho to **calendar phir bhi khulna chahiye** — events dikha do,
  deadlines ki jagah ek chhoti line: *"Deadlines could not be loaded."*

**2. Audience resolve bhi API call hai**

```python
students = identity_client.list_students(
    org_id=org_id, courses=[...], batches=[...], departments=[...]
)
```

Live count har keystroke par chal sakta hai, to **debounce frontend par** aur
**rate limit backend par** — dono zaroori hain.

**3. Student ka `student_id` sirf ek reference hai**

`calendar_event_recipient.student_id` par koi FK nahi lag sakta — wo table
hamare DB me hai hi nahi. Iska matlab:

- **FK ka bharosa nahi** — student delete ho jaye to hamari row reh jaayegi;
  cleanup job ya "student not found" ko gracefully handle karna padega
- Naam, email waghairah **store mat karna** — sirf `student_id`. Naam chahiye to
  dikhate waqt API se lao, warna purana naam dikhta rahega

### Clients ka ek layer

Har external call ek jagah se jaaye, routes/services me bikhri hui `requests`
calls nahi:

```
app/clients/
├── identity_client.py       # students, TPO ka naam
├── jobs_client.py           # active jobs, eligibility, applications
└── notification_client.py   # bell / email / push
```

Har client me: timeout, retry, aur fail hone par **saaf fallback** — kyunki ab
har feature kisi doosri service par tika hai.

---

## 1b. Roles aur permissions

Service ke apne roles honge — **tpo, teacher, student** — aur aage aur bhi
aayenge. Isliye role ko kahin bhi `if role == "tpo"` likh kar hardcode **nahi**
karna. Ek capability matrix banega, aur har route usi se poochega.

### Role kahan se aata hai

| Source | Kab |
|---|---|
| **Token** (`user_info["role"]`) | pehli pasand — platform pehle se bhejta hai |
| Hamari `calendar_user_role` table | tabhi jab calendar ka apna role chahiye ho jo platform ke role se alag ho |

**Sujhav:** token ka role hi sach maano, apni table mat banao. Do jagah role
rakhne par wo kabhi na kabhi alag ho jaayenge, aur phir "kis par bharosa karein"
wala sawaal khada hoga. Agar kabhi calendar-only role chahiye (jaise "calendar
admin"), tab ek `calendar_user_role` table jodna — tab tak nahi.

### Capability matrix

```python
# app/auth/permissions.py

class Role(str, Enum):
    tpo = "tpo"
    teacher = "teacher"
    student = "student"
    # aage: admin, publisher, placement_coordinator …


class Capability(str, Enum):
    VIEW_ORG_EVENTS      = "calendar.view_org_events"       # college ke saare events
    VIEW_TARGETED_EVENTS = "calendar.view_targeted_events"  # sirf apne liye targeted
    VIEW_ALL_DEADLINES   = "calendar.view_all_deadlines"
    VIEW_MY_DEADLINES    = "calendar.view_my_deadlines"     # eligible + un-applied
    CREATE_EVENT         = "calendar.create_event"
    EDIT_OWN_EVENT       = "calendar.edit_own_event"
    CANCEL_OWN_EVENT     = "calendar.cancel_own_event"
    MANAGE_OWN_REMINDER  = "calendar.manage_own_reminder"
    MANAGE_SETTINGS      = "calendar.manage_settings"


ROLE_CAPABILITIES: dict[Role, set[Capability]] = {
    Role.tpo: {
        Capability.VIEW_ORG_EVENTS,
        Capability.VIEW_ALL_DEADLINES,
        Capability.CREATE_EVENT,
        Capability.EDIT_OWN_EVENT,
        Capability.CANCEL_OWN_EVENT,
        Capability.MANAGE_OWN_REMINDER,
    },
    Role.teacher: {
        Capability.VIEW_ORG_EVENTS,        # read-only — PM se confirm karna (neeche)
        Capability.VIEW_ALL_DEADLINES,
        Capability.MANAGE_OWN_REMINDER,
    },
    Role.student: {
        Capability.VIEW_TARGETED_EVENTS,
        Capability.VIEW_MY_DEADLINES,
        Capability.MANAGE_OWN_REMINDER,
    },
}


def can(role: str, capability: Capability) -> bool:
    try:
        return capability in ROLE_CAPABILITIES[Role(role)]
    except ValueError:          # anjaan role → kuch nahi
        return False
```

**Naya role jodna = ek entry.** Routes, services, queries — kahin kuch nahi
badalta.

### Route par kaise lagta hai

```python
# app/auth/deps.py
def require(capability: Capability):
    def _check(user_info: dict = Depends(get_userinfo_from_token)) -> dict:
        if not can(user_info.get("role"), capability):
            raise HTTPException(status_code=403, detail="Not allowed")
        return user_info
    return _check


# app/routes/calendar.py
@router.post("/calendar/events")
def create_event(
    payload: EventCreate,
    user_info: dict = Depends(require(Capability.CREATE_EVENT)),   # ← yahi gate
    db: Session = Depends(get_db),
):
    ...
```

Ownership (sirf creator edit kare) alag cheez hai — wo capability se nahi,
service me `event.created_by == user_info["user_id"]` se tay hoti hai.
**Capability kehti hai "ye kaam kar sakte ho", ownership kehti hai "is row par
kar sakte ho".** Dono chahiye.

### Visibility — role ke hisaab se alag query

Ek hi `GET /calendar/events`, par role ke hisaab se alag scope:

```python
def list_items(db, user_info, date_from, date_to, filters):
    role, org_id, user_id = user_info["role"], user_info["org_id"], user_info["user_id"]

    if can(role, Capability.VIEW_ORG_EVENTS):
        events = _scoped(db, CalendarEvent, org_id)                  # poora college
    elif can(role, Capability.VIEW_TARGETED_EVENTS):
        events = (_scoped(db, CalendarEvent, org_id)                 # sirf apne
                  .join(CalendarEventRecipient)
                  .filter(CalendarEventRecipient.student_id == user_id))
    else:
        return []                                                     # koi access nahi

    # deadlines — alag scope
    if can(role, Capability.VIEW_ALL_DEADLINES):
        deadlines = deadline_service.derive(org_id, date_from, date_to)
    elif can(role, Capability.VIEW_MY_DEADLINES):
        deadlines = deadline_service.derive(org_id, date_from, date_to, student_id=user_id)
    else:
        deadlines = []

    # reminders — har role ke apne, hamesha
    reminders = _scoped(db, CalendarReminder, org_id).filter(
        CalendarReminder.owner_id == user_id
    )
    ...
```

### Capability × role — ek nazar me

Nishaan padhne ka tarika: **✅** haq hai (API 200), **❌** haq nahi (API **403**,
aur query me data hi nahi aata), **⚠️** PM ka faisla pending, **—** lagoo nahi
hota kyunki us role ke paas iska bada wala haq pehle se hai. Master doc §3a me
har row ka plain matlab likha hai — wahi table hai, wahi naam.

| Capability | tpo | teacher | student |
|---|---|---|---|
| College ke saare events dekhna | ✅ | ⚠️ | ❌ |
| Sirf apne liye targeted events | — | — | ✅ |
| Saari deadlines | ✅ | ⚠️ | ❌ |
| Sirf apni eligible deadlines | ❌ | ❌ | ✅ |
| Event banana | ✅ | ❌ | ❌ |
| Apna event edit / cancel | ✅ | ❌ | ❌ |
| Apne reminders | ✅ | ✅ | ✅ |
| Settings | ❌ | ❌ | ❌ |

> **Settings** kisi bhi role ke paas nahi — wo Super Admin ka hai, jo abhi hamare
> role list me hai hi nahi. Jab aaye, bas `Role.super_admin:
> {MANAGE_SETTINGS}` jod dena.

### ⚠️ Teacher par faisla pending

BRD §5 saaf kehta hai:

> *Admin / Teacher / Publisher — **No Campus Calendar access in v1.***

Par ab teacher hamare roles me hai. Do me se ek chunna padega:

| Option | Matlab | Asar |
|---|---|---|
| **A — BRD ke hisaab se** | teacher ko koi access nahi; `ROLE_CAPABILITIES[teacher] = set()` | calendar login par khulega hi nahi |
| **B — read-only viewer** | college ke events aur deadlines dekh sakta hai, bana/badal nahi sakta; apne reminders rakh sakta hai | upar wali matrix yahi maankar likhi hai |

Matrix me ⚠️ wahi do cells hain jo is faisle par tike hain. **PM se confirm
karke ek line badalni hai** — baaki kuch nahi.

### Testing

Role-based cheezein chup-chaap tootti hain, isliye ye teen test pakka:

```python
def test_student_cannot_create_event(): ...        # 403
def test_teacher_cannot_cancel_event(): ...        # 403
def test_student_sees_only_targeted_events(): ...  # doosre ke event na dikhein
def test_unknown_role_gets_nothing(): ...          # naya role aaya, default deny
```

Aakhri wala sabse zaroori hai: **anjaan role ko by default kuch nahi milna
chahiye.** `can()` `ValueError` par `False` deta hai — yahi chahiye.

---

## 2. Architecture — layers

```
┌─────────────────────────────────────────────────────────┐
│ ROUTES          app/routes/calendar.py                  │
│                 app/routes/calendar_settings.py         │
│  • auth + role check                                    │
│  • request validate (Pydantic)                          │
│  • service ko call                                      │
│  • response model me wrap                               │
└───────────────────────┬─────────────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────────────┐
│ SERVICES        app/services/calendar_service.py        │
│                 app/services/calendar_audience_service  │
│                 app/services/calendar_deadline_service  │
│                 app/services/calendar_nudge_service     │
│  • saari business logic yahan                           │
│  • ownership, timing, audience diff, derive             │
│  • koi HTTP cheez nahi (HTTPException route me)         │
└───────────────────────┬─────────────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────────────┐
│ DB              app/stateful_services/db_schema.py      │
│  • SQLAlchemy models                                    │
└─────────────────────────────────────────────────────────┘

        ┌──────────────────────────────────────────────────────┐
        │ BACKGROUND                                           │
        │  BackgroundTasks  →  notification service (HTTP)     │
        │                      bell + email + push wahi bhejti │
        │  nudge scheduler  →  har 15 min  (ABHI NAHI HAI,     │
        │                      Phase 0 me tay karna hai)       │
        └──────────────────────────────────────────────────────┘
```

**Ek niyam:** services me `HTTPException` mat raise karna. Service `None` ya
domain error lautaye, route use HTTP me badle. Isse service scheduler se bhi
call ho sakti hai, jahan HTTP hai hi nahi.

---

## 3. Date aur time — sabse pehle ye padho

Ye decision baaki sab kuch tay karta hai. Galat chuna to nudges galat waqt par
jaayenge, "today" galat dikhega, aur baad me theek karna poora data migrate
karna ho jaayega.

### Faisla: **DB me UTC, render user ke timezone me**

Ye industry standard hai, aur global product ke liye yahi ek sahi raasta hai.

```
Browser/App  ──ISO 8601 with offset──►  API  ──convert──►  DB (UTC)
2026-09-28T10:00:00+05:30                                  2026-09-28T04:30:00Z

DB (UTC)  ──►  API (UTC + org timezone)  ──►  Frontend renders in local tz
```

### Teen tarah ke time, teen alag treatment

| Kism | Misaal | Column type | Kyun |
|---|---|---|---|
| **Instant** (ek pal) | event ka start/end, notification ka waqt, nudge ka `scheduled_at` | `TIMESTAMP WITH TIME ZONE` (UTC me store) | duniya me kahin bhi ho, ek hi pal hai |
| **Calendar date** (poora din) | Deadline, all-day item, My Reminder bina time ke | `DATE` | "30 Sep" ka matlab us **college ke din** se hai, kisi instant se nahi |
| **Wall-clock time** | quiet hours "10 PM – 7 AM" | `TIME` + org ka timezone | "10 baje" har jagah local 10 baje hai |

> **Sabse badi galti jo log karte hain:** all-day deadline ko `timestamp` me
> store karna. `2026-09-30T00:00:00Z` IST me `30 Sep 5:30 AM` hai — aur agar
> kabhi UTC+X se UTC−X me gaye to date hi badal jaayegi. **Date ko DATE hi
> rakho.**

### Org ka timezone

Org ka timezone **hamare DB me nahi hai** — organisation doosri service ke paas
hai. Do raaste:

| Raasta | Kab |
|---|---|
| **Identity/org API se lao aur cache karo** | ✅ pehli pasand — sach ek hi jagah rahega |
| Apni `calendar_org_config` table me copy rakho | tabhi jab org API har request par mehnga pade |

```python
# jo bhi raasta ho, value IANA naam hi honi chahiye
org_timezone = "Asia/Kolkata"          # ✅
org_timezone = "+05:30"                # ❌ DST par toot jaayega
```

**IANA name hi rakhna**, offset nahi — offset DST ke saath badalta hai, naam
nahi badalta. Na mile to `DEFAULT_ORG_TIMEZONE` (§14).

Ye column kahan use hota hai:

1. **Nudge ka waqt nikalte waqt** — "event se 1 din pehle" org ke din ke hisaab se
2. **Quiet hours** — 10 PM college ka 10 PM hai
3. **"Aaj" ka matlab** — deadline aaj hai ya nahi, ye org ke din se tay hoga
4. **8:00 AM wala assessment nudge** — N-S3 org ke subah 8 baje

### Code me kaise

```python
from datetime import datetime, timezone
from zoneinfo import ZoneInfo        # Python 3.9+, koi library nahi chahiye

# ❌ kabhi mat likho
datetime.now()           # naive, server ka timezone pakad lega
datetime.utcnow()        # naive, aur Python 3.12 me deprecated

# ✅ hamesha
datetime.now(timezone.utc)

# org ke local waqt se UTC instant
local = datetime(2026, 9, 28, 10, 0, tzinfo=ZoneInfo("Asia/Kolkata"))
stored = local.astimezone(timezone.utc)          # 04:30 UTC

# UTC instant se org ka local waqt
shown = stored.astimezone(ZoneInfo(org.timezone))

# "aaj" org ke hisaab se
today_local = datetime.now(ZoneInfo(org.timezone)).date()
```

### Maujooda repo me ek gap

Abhi `db_schema.py` me saare timestamps aise hain:

```python
created_at = Column(DateTime, default=func.now())      # timezone-naive
```

**Nayi calendar tables me `DateTime(timezone=True)` use karo:**

```python
created_at = Column(DateTime(timezone=True), server_default=func.now())
updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
```

Purani tables ko chhedne ki zaroorat nahi — par nayi tables me pehle din se sahi
karo, warna 6 mahine baad migrate karna padega.

### API par

- **Request:** ISO 8601 with offset — `2026-09-28T10:00:00+05:30`.
  Pydantic `datetime` isko apne aap parse karta hai.
- **Response:** hamesha UTC with `Z`, plus org ka timezone alag field me, taaki
  frontend convert kar sake:

```json
{
  "start_at": "2026-09-28T04:30:00Z",
  "end_at":   "2026-09-28T06:00:00Z",
  "deadline_date": "2026-09-30",
  "org_timezone": "Asia/Kolkata"
}
```

- **All-day items:** `date` bhejo (`"2026-09-30"`), `datetime` nahi.

### Frontend par

```js
// backend se UTC aaya, browser apne aap local me dikha dega
new Date("2026-09-28T04:30:00Z").toLocaleString("en-IN", { timeZone: orgTimezone })
```

Frontend par **kabhi bhi** date string ko haath se cut-paste mat karna
(`.slice(0, 10)`) — wo timezone ko ignore kar deta hai aur din badal jaata hai.

---

## 4. DB design

```
                    ┌──────────────────────┐
                    │  calendar_event      │
                    │  (org_id par scoped) │
                    └──────────┬───────────┘
                               │ 1
                 ┌─────────────┼─────────────┐
                 │ 1           │ N           │ N
     ┌───────────▼──────┐  ┌───▼──────────┐  │
     │ calendar_event_  │  │ calendar_    │  │
     │ audience         │  │ event_       │  │
     │ (1 row per event)│  │ recipient    │  │
     └──────────────────┘  └──────────────┘  │
                                             │
                               ┌─────────────▼──────┐
                               │ calendar_nudge     │
                               └────────────────────┘

     ┌──────────────────┐      ┌────────────────────┐
     │ calendar_reminder│      │ calendar_settings  │
     │ (org_id)         │      │ (platform-wide,    │
     └──────────────────┘      │  ek hi row)        │
                               └────────────────────┘

     Application Deadline ki KOI table nahi —
     SkillsBridge jobs API se derive hoti hai (§1a)
```

### Do design decisions jo baad me nahi badle ja sakte

**1. Deadline derive hoti hai, store nahi**

Job ka `application_expiration_date` hi sach hai. Uski copy banate hi do sach ho
jaate hain, aur job badalte hi calendar jhooth bolne lagta hai. Har calendar
query me active jobs se deadline items banao.

**2. Recipients publish par freeze hote hain**

Event publish karte waqt audience se students nikal kar
`calendar_event_recipient` me likh do. Baad me student ka department badal jaye
to bhi wo audience me rahega, aur "X students notified" sach rahega. Audience
sirf edit par dobara nikalti hai.

---

## 5. Tables — poori definition

### `calendar_event`

| Column | Type | Null | Note |
|---|---|---|---|
| `event_id` | UUID | PK | `default=uuid.uuid4` |
| `org_id` | UUID | no | index |
| `event_type` | String | no | `ppt` / `company_visit` / `online_assessment` / `training` / `orientation` / `practice_test` / `deadline` / `other` — edit par doosre event type me badal sakta hai (nudges reschedule), par **`my_reminder` me kabhi nahi** (403) |
| `other_type` | String(80) | yes | TPO ka apna naam jab `event_type = other` (wahan required, non-blank); baaki har type par `null` |
| `title` | String(120) | no | |
| `company_id` | UUID | yes | SkillsBridge ka id — **FK nahi**, naam dikhate waqt API se |
| `event_date` | Date | no | org ke timezone ka din |
| `start_at` | DateTime(tz) | yes | all-day par null |
| `end_at` | DateTime(tz) | yes | all-day par null |
| `mode` | String | yes | `offline` / `online` |
| `venue` | String(200) | yes | mode=offline par required |
| `online_platform` | String(200) | yes | mode=online par required |
| `description` | Text | yes | max 1000 |
| `linked_job_kind` | String | yes | `campus` / `external` / null |
| `linked_job_id` | UUID | yes | `campus` par — SkillsBridge ka job id, **FK nahi** |
| `linked_job_url` | String(2048) | yes | `external` par — `https://` se shuru |
| `linked_job_title` | String(200) | yes | `external` par required |
| `status` | String | no | `published` / `cancelled` |
| `cancel_reason` | String | yes | `postponed` / `company_withdrew` / `created_by_mistake` / `other` |
| `cancel_note` | String(200) | yes | reason=other par required |
| `cancelled_by` | UUID | yes | |
| `cancelled_at` | DateTime(tz) | yes | |
| `created_by` | UUID | no | **sirf yahi edit/cancel kar sakta hai** |
| `created_at` | DateTime(tz) | no | |
| `updated_at` | DateTime(tz) | no | |

> **`is_all_day` column nahi rakha.** Drawer me "All day" ka koi option nahi hai —
> TPO sirf type chunta hai, aur sirf `deadline` par time poochha nahi jaata. Response
> me `event_type == "deadline"` se bana kar bhej dete hain.

> **"X students notified" ka number yahan nahi rakha.** Wo us event ki
> `calendar_event_recipient` rows gin kar aata hai — alag column rakhne par
> count aur asli list alag ho sakte the.

### `calendar_event_audience`

Ek event ka ek hi row.

| Column | Type | Note |
|---|---|---|
| `audience_id` | UUID | PK |
| `event_id` | UUID FK | unique |
| `opportunity_type` | String | `job` / `internship` / `general` |
| `courses` | ARRAY(String) | kam se kam 1 |
| `batches` | ARRAY(Integer) | passing years |
| `departments` | ARRAY(String) | kam se kam 1 |

### `calendar_event_recipient`

| Column | Type | Note |
|---|---|---|
| `recipient_id` | UUID | PK |
| `org_id` | UUID | index |
| `event_id` | UUID FK | index |
| `student_id` | UUID | index |
| `state` | String | `active` / `removed` |
| `removed_reason` | String | yes |
| `seen_at` | DateTime(tz) | red dot ke liye |
| `created_at` | DateTime(tz) | |

**Unique:** `(event_id, student_id)`

> `removed` state hi "No longer applicable" dikhane ka zariya hai. Row delete
> kar doge to student ko kabhi pata nahi chalega ki event hata diya gaya.

### `calendar_reminder`

TPO aur student dono ke My Reminders.

| Column | Type | Note |
|---|---|---|
| `reminder_id` | UUID | PK |
| `org_id` | UUID | index |
| `owner_id` | UUID | index |
| `owner_role` | String | `tpo` / `student` |
| `title` | String(120) | |
| `reminder_date` | Date | |
| `reminder_time` | Time | yes — null = poora din |
| `remind_before` | String | `none` / `at_time` / `15_min` / `1_hour` / `1_day` |
| `alert_at` | DateTime(tz) | yes — nikala hua instant |
| `note` | String(500) | yes |
| `linked_type` | String | yes — `event` / `job_deadline` |
| `linked_id` | UUID | yes |
| `created_at` / `updated_at` | DateTime(tz) | |

### `calendar_nudge`

| Column | Type | Note |
|---|---|---|
| `nudge_id` | UUID | PK |
| `org_id` | UUID | index |
| `student_id` | UUID | index |
| `nudge_type` | String | `event_reminder` / `deadline_reminder` / `assessment_day` |
| `item_type` | String | `event` / `job` |
| `item_id` | UUID | |
| `scheduled_at` | DateTime(tz) | index — UTC instant |
| `sent_at` | DateTime(tz) | yes |
| `status` | String | `scheduled` / `sent` / `skipped` / `cancelled` |
| `skip_reason` | String | yes |

**Unique:** `(student_id, nudge_type, item_id, scheduled_at)` — yahi double-send
rokta hai.

### `calendar_settings`

Poore platform ke liye **ek hi row** (FR-CAL-27) — isi liye ispar `org_id` nahi.

| Column | Type | Default | Range |
|---|---|---|---|
| `settings_id` | UUID | PK | |
| `event_reminder_days_before` | Integer | 1 | 1–30 |
| `event_reminder_hours_before` | Integer | 1 | 1–12 |
| `deadline_reminder_days_before` | Integer | 2 | 1–30 |
| `deadline_reminder_same_day` | Boolean | true | |
| `daily_nudge_limit` | Integer | 3 | 1–10 |
| `quiet_hours_start` | Time | 22:00 | |
| `quiet_hours_end` | Time | 07:00 | |
| `updated_by` | UUID | | |
| `updated_at` | DateTime(tz) | | |

---

## 6. SQLAlchemy models

Apni service ke `app/db/models.py` me. Style SkillsBridge jaisi, par
**koi `schema` arg nahi** (apna DB hai) aur **doosri service ke id par FK nahi**:

```python
from sqlalchemy import (
    Column, String, Integer, Boolean, Date, Time, DateTime, Text,
    ForeignKey, UniqueConstraint, Index, func,
)
from sqlalchemy.dialects.postgresql import UUID, ARRAY
import uuid


class CalendarEvent(Base):
    __tablename__ = "calendar_event"
    __table_args__ = (
        Index("ix_calendar_event_org_date", "org_id", "event_date"),
    )

    event_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    org_id = Column(UUID(as_uuid=True), nullable=False)
    event_type = Column(String, nullable=False)
    other_type = Column(String(80), nullable=True)            # sirf event_type == "other" par — TPO ka apna naam
    title = Column(String(120), nullable=False)
    company_id = Column(UUID(as_uuid=True), nullable=True)   # SkillsBridge ka id — FK nahi, wo DB alag hai

    event_date = Column(Date, nullable=False)
    start_at = Column(DateTime(timezone=True), nullable=True)
    end_at = Column(DateTime(timezone=True), nullable=True)

    mode = Column(String, nullable=True)
    venue = Column(String(200), nullable=True)
    online_platform = Column(String(200), nullable=True)
    description = Column(Text, nullable=True)

    # Linked Job (UI Spec v2) — campus job ya bahar ka link, dono nahi
    linked_job_kind = Column(String, nullable=True)        # campus | external
    linked_job_id = Column(UUID(as_uuid=True), nullable=True)   # SkillsBridge ka id, FK nahi
    linked_job_url = Column(String(2048), nullable=True)
    linked_job_title = Column(String(200), nullable=True)

    status = Column(String, nullable=False, default="published")
    cancel_reason = Column(String, nullable=True)
    cancel_note = Column(String(200), nullable=True)
    cancelled_by = Column(UUID(as_uuid=True), nullable=True)
    cancelled_at = Column(DateTime(timezone=True), nullable=True)

    created_by = Column(UUID(as_uuid=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class CalendarEventAudience(Base):
    __tablename__ = "calendar_event_audience"

    audience_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    event_id = Column(UUID(as_uuid=True), ForeignKey("calendar_event.event_id", ondelete="CASCADE"), unique=True, nullable=False)
    opportunity_type = Column(String, nullable=False)
    courses = Column(ARRAY(String), nullable=False)
    batches = Column(ARRAY(Integer), nullable=False)
    departments = Column(ARRAY(String), nullable=False)


class CalendarEventRecipient(Base):
    __tablename__ = "calendar_event_recipient"
    __table_args__ = (
        UniqueConstraint("event_id", "student_id", name="uq_calendar_recipient"),
        Index("ix_calendar_recipient_student", "org_id", "student_id", "state"),
    )

    recipient_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    org_id = Column(UUID(as_uuid=True), nullable=False)
    event_id = Column(UUID(as_uuid=True), ForeignKey("calendar_event.event_id", ondelete="CASCADE"), nullable=False)
    student_id = Column(UUID(as_uuid=True), nullable=False)   # doosri service ka id — FK nahi
    state = Column(String, nullable=False, default="active")
    removed_reason = Column(String, nullable=True)
    seen_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class CalendarReminder(Base):
    __tablename__ = "calendar_reminder"
    __table_args__ = (
        Index("ix_calendar_reminder_owner", "org_id", "owner_id", "reminder_date"),
    )

    reminder_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    org_id = Column(UUID(as_uuid=True), nullable=False)
    owner_id = Column(UUID(as_uuid=True), nullable=False)
    owner_role = Column(String, nullable=False)
    title = Column(String(120), nullable=False)
    reminder_date = Column(Date, nullable=False)
    reminder_time = Column(Time, nullable=True)
    remind_before = Column(String, nullable=True)
    alert_at = Column(DateTime(timezone=True), nullable=True)
    note = Column(String(500), nullable=True)
    linked_type = Column(String, nullable=True)
    linked_id = Column(UUID(as_uuid=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class CalendarNudge(Base):
    __tablename__ = "calendar_nudge"
    __table_args__ = (
        UniqueConstraint("student_id", "nudge_type", "item_id", "scheduled_at",
                         name="uq_calendar_nudge_once"),
        Index("ix_calendar_nudge_due", "status", "scheduled_at"),
    )

    nudge_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    org_id = Column(UUID(as_uuid=True), nullable=False)
    student_id = Column(UUID(as_uuid=True), nullable=False)
    nudge_type = Column(String, nullable=False)
    item_type = Column(String, nullable=False)
    item_id = Column(UUID(as_uuid=True), nullable=False)
    scheduled_at = Column(DateTime(timezone=True), nullable=False)
    sent_at = Column(DateTime(timezone=True), nullable=True)
    status = Column(String, nullable=False, default="scheduled")
    skip_reason = Column(String, nullable=True)


class CalendarSettings(Base):
    """Public schema — platform-wide, ek hi row (FR-CAL-27)."""
    __tablename__ = "calendar_settings"

    settings_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    event_reminder_days_before = Column(Integer, nullable=False, default=1)
    event_reminder_hours_before = Column(Integer, nullable=False, default=1)
    deadline_reminder_days_before = Column(Integer, nullable=False, default=2)
    deadline_reminder_same_day = Column(Boolean, nullable=False, default=True)
    daily_nudge_limit = Column(Integer, nullable=False, default=3)
    quiet_hours_start = Column(Time, nullable=False)
    quiet_hours_end = Column(Time, nullable=False)
    updated_by = Column(UUID(as_uuid=True), nullable=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
```

---

## 7. Pydantic models

`app/models/request_model.py` me:

```python
from datetime import date, datetime, time
from enum import Enum
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel, Field, field_validator, model_validator


class EventType(str, Enum):
    ppt = "ppt"
    company_visit = "company_visit"
    online_assessment = "online_assessment"
    training = "training"
    orientation = "orientation"
    practice_test = "practice_test"
    deadline = "deadline"
    other = "other"


class EventMode(str, Enum):
    offline = "offline"
    online = "online"


class OpportunityType(str, Enum):
    job = "job"
    internship = "internship"
    general = "general"


class CancelReason(str, Enum):
    postponed = "postponed"
    company_withdrew = "company_withdrew"
    created_by_mistake = "created_by_mistake"
    other = "other"


class AudienceIn(BaseModel):
    opportunity_type: OpportunityType
    courses: List[str] = Field(..., min_length=1)
    batches: List[int] = Field(..., min_length=1)
    departments: List[str] = Field(..., min_length=1)


class LinkedJobKind(str, Enum):
    campus = "campus"
    external = "external"


class LinkedJobIn(BaseModel):
    """Linked Job (UI Spec v2) — campus job YA pasted link, dono nahi."""
    kind: LinkedJobKind
    job_id: Optional[UUID] = None                 # campus
    url: Optional[str] = None                     # external
    title: Optional[str] = Field(None, max_length=200)

    @model_validator(mode="after")
    def check_kind(self):
        if self.kind == LinkedJobKind.campus:
            if not self.job_id:
                raise ValueError("Pick a campus job")
            self.url = self.title = None          # doosre kind ke fields saaf
        else:
            if not (self.url or "").startswith("https://"):
                raise ValueError("Enter a valid link starting with https://")
            if not (self.title or "").strip():
                raise ValueError("Job title is required for a pasted link")
            self.job_id = None
        return self


class EventCreate(BaseModel):
    event_type: EventType
    other_type: Optional[str] = Field(None, max_length=80)   # "Other" ka naam
    title: str = Field(..., min_length=1, max_length=120)
    company_id: Optional[UUID] = None
    event_date: date
    start_at: Optional[datetime] = None          # ISO 8601 with offset
    end_at: Optional[datetime] = None
    mode: Optional[EventMode] = None
    venue: Optional[str] = Field(None, max_length=200)
    online_platform: Optional[str] = Field(None, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    audience: Optional[AudienceIn] = None
    linked_job: Optional[LinkedJobIn] = None       # optional — har event ke liye

    @model_validator(mode="after")
    def check_by_type(self):
        # "Other" akela kuch nahi batata — uska naam chahiye; baaki type par naam drop.
        if self.event_type == EventType.other:
            self.other_type = (self.other_type or "").strip()
            if not self.other_type:
                raise ValueError("Specify the event type")   # 422, field other_type ("Event type name")
        else:
            self.other_type = None

        all_day = self.event_type == EventType.deadline

        if not all_day:
            if not self.start_at or not self.end_at:
                raise ValueError("Start and end time are required for this event type")
            if self.end_at <= self.start_at:
                raise ValueError("End time must be after start time")

        needs_mode = self.event_type not in (EventType.deadline, EventType.online_assessment)
        if needs_mode:
            if not self.mode:
                raise ValueError("Mode is required for this event type")
            if self.mode == EventMode.offline and not self.venue:
                raise ValueError("Venue is required when mode is offline")
            if self.mode == EventMode.online and not self.online_platform:
                raise ValueError("Online platform is required when mode is online")

        if not self.audience:
            raise ValueError("Target audience is required")

        return self


class EventCancel(BaseModel):
    reason: CancelReason
    note: Optional[str] = Field(None, max_length=200)

    @model_validator(mode="after")
    def note_needed_for_other(self):
        if self.reason == CancelReason.other and not (self.note or "").strip():
            raise ValueError("A short explanation is required when the reason is Other")
        return self


class ReminderCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=120)
    reminder_date: date
    reminder_time: Optional[time] = None
    remind_before: Optional[str] = None
    note: Optional[str] = Field(None, max_length=500)
    linked_type: Optional[str] = None
    linked_id: Optional[UUID] = None
```

`app/models/response_model.py` me:

```python
class CalendarItemOut(BaseModel):
    """Teeno kism ke items ek hi shape me — frontend ko ek hi renderer chahiye."""
    item_id: UUID
    item_kind: str                 # tpo_event | deadline | my_reminder | nudge
    event_type: Optional[str]
    other_type: Optional[str]      # "Other" ka naam; baaki type par null
    title: str
    event_date: date
    start_at: Optional[datetime]   # UTC, 'Z' ke saath
    end_at: Optional[datetime]
    is_all_day: bool               # column nahi — event_type == 'deadline' se banta hai
    mode: Optional[str]
    venue: Optional[str]
    company_name: Optional[str]
    status: str                    # published | cancelled | removed
    badge: Optional[str]           # updated | cancelled | no_longer_applicable
    is_owner: bool
    created_by_name: Optional[str]


class CalendarListOut(BaseModel):
    items: List[CalendarItemOut]
    org_timezone: str              # "Asia/Kolkata"
    range_from: date
    range_to: date


class AudienceCountOut(BaseModel):
    count: int
```

> **`org_timezone` har list response me bhejo.** Frontend ko render karne ke
> liye chahiye, aur isse har screen par alag se config fetch nahi karni padti.

---

## 8. Services — business logic

### `calendar_audience_service.py`

```python
def resolve_students(db, org_id, audience) -> list[UUID]:
    """Audience se active students nikalo.

    Rules (FR-CAL-07):
      - sirf active students
      - course, batch (passing year), department teeno match hone chahiye
      - jiski profile me batch ya department nahi hai, wo bahar
    """

def count_students(db, org_id, audience) -> int:
    """Live count — wahi query, sirf COUNT."""

def batch_options(db, org_id, opportunity_type) -> list[int]:
    """job → sirf final-year batch
       internship → pre-final + final
       general → saari batches"""
```

### `calendar_deadline_service.py`

```python
def derive_deadlines(db, org_id, date_from, date_to, student_id=None):
    """Active jobs se deadline items banao — kabhi store nahi karte.

    student_id diya ho to:
      - sirf wahi jobs jinke liye wo eligible hai (FR-JP-17)
      - aur jisme usne apply nahi kiya
    """
```

### `calendar_service.py`

```python
def list_items(db, org_id, viewer_id, viewer_role, date_from, date_to, filters):
    """TPO events + derived deadlines + viewer ke apne reminders — ek hi list.

    TPO: college ke saare events
    Student: sirf wahi events jinme uska recipient row 'active' ya 'removed' hai
    """

def create_event(db, org_id, tpo_id, payload) -> tuple[CalendarEvent, int]:
    """Event banao, audience save karo, recipients freeze karo,
       notification job queue karo, nudges schedule karo.
       Doosra value = kitne recipient bane, 'X students notified' ke liye."""

def update_event(db, event, tpo_id, payload):
    """Ownership check. Cancelled event block.
       event_type doosre event type me badal sakta hai (nudges reschedule),
       par `my_reminder` me nahi → 403 "An event cannot be changed into a reminder".
       audience diff nikalo → added / removed / kept.
       payload.notify_on_change (frontend: !onlyMinorChanged || ticked):
         True  → students ke liye phir unread, "<title> has been updated: <summary>."
         False → jinhone padh li thi unki read hi rahe (seen_at bump),
                 message "<title> details have been updated."; jinhone nahi padhi, unread hi."""

def cancel_event(db, event, tpo_id, reason, note):
    """Ownership + end_at se pehle ka check.
       status='cancelled'. 'created_by_mistake' par recipients ko
       'removed' kar do. pending nudges cancel karo."""

def audience_diff(old_recipients, new_recipients):
    """→ (added_ids, removed_ids, kept_ids)"""
```

### `calendar_nudge_service.py`

```python
def schedule_for_event(db, event, settings): ...
def schedule_for_deadline(db, job, students, settings): ...
def reschedule(db, item_type, item_id): ...      # date badalne par
def cancel_pending(db, item_type, item_id): ...  # cancel par
def due_nudges(db, now_utc): ...                 # scheduler ke liye
def should_send(db, nudge) -> tuple[bool, str]:  # bhejne se pehle dobara check
```

---

## 9. Routes — API endpoints

`app/routes/calendar.py`

### TPO

| Method | Path | Kya | FR |
|---|---|---|---|
| GET | `/calendar/events` | list — events + deadlines + apne reminders | 02, 03, 04 |
| POST | `/calendar/audience/count` | live count | 05, 07 |
| GET | `/calendar/audience/options` | course / batch / department | 07 |
| GET | `/calendar/company-hint?company_id=` | us company ke pehle se plan events | 05 |
| POST | `/calendar/events` | create | 05, 06 |
| GET | `/calendar/events/{id}` | detail | 13 |
| PATCH | `/calendar/events/{id}` | edit (sirf creator) | 10 |
| POST | `/calendar/events/{id}/preview-changes` | audience diff, save se pehle — *nahi bana; frontend ka ReviewChanges dialog bhi hata diya. Audience alag `PUT /calendar/events/{id}/audience` se (`AudienceDialog`)* | 10 |
| POST | `/calendar/events/{id}/cancel` | cancel (sirf creator) | 11 |

### Student

| Method | Path | Kya | FR |
|---|---|---|---|
| GET | `/calendar/student/events` | sirf apne items | 14, 15 |
| GET | `/calendar/student/events/{id}` | detail — bahar ka ho to **403** | 15, 16 |
| GET | `/calendar/student/coming-up` | agle 3 items | 14 |
| POST | `/calendar/student/seen` | red dot clear | 14 |

### Reminders (dono roles)

| Method | Path | Kya |
|---|---|---|
| POST | `/calendar/reminders` | create (student par 50 ki limit) |
| PATCH | `/calendar/reminders/{id}` | edit — sirf owner |
| DELETE | `/calendar/reminders/{id}` | delete — sirf owner |

### Settings — `app/routes/calendar_settings.py`

| Method | Path | Role |
|---|---|---|
| GET | `/calendar/settings` | super admin |
| PUT | `/calendar/settings` | super admin |

---

## 10. Validation rules

| Kya | Rule | Kahan |
|---|---|---|
| Title | 1–120 chars | Pydantic |
| Description | ≤ 1000 | Pydantic |
| Venue / platform | ≤ 200 | Pydantic |
| Note (reminder) | ≤ 500 | Pydantic |
| Cancel note | ≤ 200, reason=other par required | Pydantic |
| End > Start | pakka | Pydantic |
| Date aaj ya aage | **org ke timezone me "aaj"** | Service (timezone chahiye) |
| Mode / venue / platform | type ke hisaab se | Pydantic |
| Audience | teeno list me ≥ 1 | Pydantic |
| Count > 0 | 0 par publish mana | Service |
| Other ka naam | `event_type = other` par `other_type` required (≤ 80, non-blank) → 422 "Specify the event type"; baaki type par drop | Pydantic |
| Event → reminder | edit par `my_reminder` me nahi badal sakta → 403; event type aapas me badal sakte hain | Service |
| Ownership | edit / cancel sirf creator | Service |
| Past event | edit / cancel nahi | Service |
| Reminder limit | student ke 50 upcoming | Service |
| Student visibility | bahar ka item → 403 | Service |
| **Linked job — `https://`** | pasted link par | Pydantic |
| **Linked job — title** | pasted link par required | Pydantic |
| **Linked job — campus job sach me hai?** | SkillsBridge se confirm | Service (API call) |
| Settings range | har field ki apni range | Pydantic |

**Niyam:** jo baat **sirf request dekh kar** tay ho jaye wo Pydantic me; jiske
liye **DB ya org** chahiye wo service me. "Date aaj se aage" service me hai
kyunki "aaj" org ke timezone par nirbhar hai.

---

## 11. Notifications

**Naya kuch nahi banana.** Platform me pehle se ek notification service hai jo
bell, email aur push teeno sambhalti hai. Calendar bas usi ko call karega, bilkul
usi tarah jaise job posting karti hai
(`app/services/job_description_service.py` → `add_job_notifications`).

### Maujooda pattern

```python
# 1. kis-kis ko bhejna hai, wo list lao
user_info_response = requests.get(
    url=f"{conf.USER_MANAGEMENT_IDENTITY_LIST}?role=student",
    params={"department": ..., "org": user_info["org"]},
    headers={"cookie": request.headers.get("cookie")},
)

# 2. notification service ko de do — bell, email, push wahi sambhalti hai
payload = {"user_info": json.loads(user_info_response.content), "message": message}
params = {"run_async": True, "email_notification": True, "mobile_notification": True}

requests.post(
    f"{conf.ADD_NOTIFICATION_URL}/{user_info['user_id']}",
    json=payload,
    params=params,
    headers={"cookie": request.headers.get("cookie")},
)
```

Teen params hi channel tay karte hain:

| Param | Kya karta hai |
|---|---|
| `run_async=True` | service khud queue karti hai — hum wait nahi karte |
| `email_notification` | email bhejna hai ya nahi |
| `mobile_notification` | push bhejna hai ya nahi |

Bell hamesha jaati hai (wahi to notification record hai).

### Calendar ke liye channel matrix (FR-CAL-24)

| Trigger | `email_notification` | `mobile_notification` |
|---|---|---|
| Event created | `True` | `True` |
| Important update | `True` | `True` |
| **Minor update** (TPO chahe to) | `True` | **`False`** |
| Audience me joda gaya | `True` | `True` |
| Audience se hataya gaya | `True` | `True` |
| Cancelled | `True` | `True` |
| **Cancelled — created by mistake** | `True` | **`False`** |

Do rows me push band hai — BRD me yahi likha hai, aur wahi sahi hai: "purani
notification ignore karo" wali baat phone buzz karne layak nahi.

**Minor update ka bell par asar — `notify_on_change`.** Edit par frontend
`notify_on_change = !onlyMinorChanged || ticked` bhejta hai (minor = sirf title,
description, company; ticked = "Notify students about this change"). Column
`calendar_event.notify_on_change` me rehta hai:

| `notify_on_change` | Jinhone notification padh li thi | Jinhone nahi padhi | Message |
|---|---|---|---|
| `true` | phir **unread** | unread | `<title> has been updated: <summary>.` |
| `false` | **read hi rehti hai** (`seen_at` bump) | unread hi | `<title> details have been updated.` |

### Calendar ka message shape

Job wale pattern se milta-julta rakho, taaki notification service ki
templating badalni na pade:

```python
message = {
    "event_id": str(event.event_id),
    "event_title": event.title,
    "event_type": event.event_type,
    "event_date": event.event_date.isoformat(),      # "2026-09-28"
    "start_at": event.start_at.isoformat() if event.start_at else None,
    "venue": event.venue or event.online_platform,
    "company_name": company.name if company else None,
    "deep_link": f"{conf.CALENDAR_LINK}/{event.event_id}",
    "event_status": "new_calendar_event",            # naya / updated / cancelled
}
```

### Route me kaise

Maujooda code `BackgroundTasks` use karta hai, Celery nahi. Calendar bhi wahi
kare:

```python
@router.post("/calendar/events")
def create_event(
    request: Request,
    background_task: BackgroundTasks,
    payload: EventCreate,
    user_info: dict = Depends(get_userinfo_from_token),
    db: Session = Depends(get_db),                                   # apni service ka session
):
    event, notified_count = calendar_service.create_event(db, user_info, payload)   # commit yahin
    background_task.add_task(                                        # notification baad me
        calendar_notification_service.notify_created, request, event, user_info
    )
    return {"event_id": event.event_id, "notified_count": notified_count}
```

**Pakka niyam:** DB commit pehle, `add_task` baad me. Notification service band
bhi ho to **event save rahega** — `add_job_notifications` bhi apne andar hi
`try/except` karta hai, wahi pattern rakho.

### Batching aur retry

- Audience badi ho to `user_info` list ko **500 ke chunk** me bhejo
- `requests` khud retry nahi karta — `NOTIFICATION_MAX_RETRIES` ke saath simple
  backoff loop likho
- Har attempt log karo usi structured style me jo pehle se hai:

```python
log.info("calendar_notification_sent", extra={
    "event_type": "db_event",
    "payload": {"tag": "analytics_calendar", "action": "calendar_notification_sent",
                "event_id": str(event.event_id), "recipient_count": len(recipients)},
})
```

## 12. Nudge scheduler

> **Pehle ye jaan lo:** repo me abhi **koi scheduler nahi hai** — na Celery, na
> RQ, na APScheduler, na Redis. `BackgroundTasks` hai, par wo sirf "request ke
> baad turant kuch karo" ke liye hai; "3 din baad 8 baje karo" uske bas ki baat
> nahi. Ye Phase 0 ka faisla hai.

### Teen options

| Option | Kab theek hai | Kya lagega |
|---|---|---|
| **Cron + management command** | sabse simple; aur nudge ka kaam hai bhi simple — har 15 min ek query | ek script + k8s CronJob / system cron. Koi nayi dependency nahi |
| **APScheduler** | app ke andar hi scheduler chahiye | `apscheduler` add karna; **multi-replica par double-run ka khatra** — DB lock chahiye |
| **Celery beat** | aage aur bhi background kaam aane wale hon | `celery` + `redis` — poora naya infra |

**Mera sujhav: cron + ek command.** Nudge ka pattern "due rows nikalo aur
bhejo" hai, jo ek plain query hai. `calendar_nudge` par jo unique constraint hai
wo double-send pehle hi rok deta hai, to distributed lock ki zaroorat bhi nahi.
Celery tab laana jab doosre features ko bhi uski zaroorat ho.

```bash
# k8s CronJob / crontab — har 15 minute
*/15 * * * * python -m app.jobs.run_due_nudges
```

### Teen nudges (FR-CAL-25)

| ID | Kab | Kiske liye |
|---|---|---|
| N-S1 | settings ke days + hours pehle | event ki audience |
| N-S2 | settings ke days pehle + (same_day on ho to) us din | eligible, jinhone apply nahi kiya |
| N-S3 | **org ke timezone me subah 8:00** | online assessment ki audience |

### Worker

```
har 15 min:
  due = SELECT * FROM calendar_nudge
        WHERE status='scheduled' AND scheduled_at <= now()

  har nudge par:
    1. should_send() — abhi bhi relevant hai?
         event cancel? student audience se bahar? apply kar chuka?
         job inactive? → status='skipped', skip_reason
    2. quiet hours? → scheduled_at aage badha do (7 AM)
         exception: 1-hour event reminder, agar event hi quiet hours me hai
    3. daily limit? → priority: deadline > assessment > event
         bache hue → status='skipped'
    4. bhejo → status='sent', sent_at=now()
```

### Scheduling ka ganit

```python
# N-S1 — event se 1 din pehle, org ke local waqt me
org_tz = ZoneInfo(org.timezone)
start_local = event.start_at.astimezone(org_tz)
one_day = (start_local - timedelta(days=settings.event_reminder_days_before))
scheduled_at = one_day.astimezone(timezone.utc)      # DB me UTC

# N-S3 — us din org ke subah 8:00
local_8am = datetime.combine(event.event_date, time(8, 0), tzinfo=org_tz)
scheduled_at = local_8am.astimezone(timezone.utc)
```

**Beet chuka waqt:** agar `scheduled_at` already nikal chuka hai to nudge mat
banao (FR-CAL-25).

**Student ke apne reminders in rules se bahar hain** — na daily limit, na quiet
hours. Unka `alert_at` seedha worker se jaata hai.

---

## 13. Libraries

`requirements.txt` padh kar banayi hui list. **Lagbhag sab kuch pehle se hai** —
ek hi cheez missing hai, aur wo scheduler hai.

### Pehle se hai, seedha use karo

| Library | Version | Kaam |
|---|---|---|
| `fastapi` | 0.115.2 | routes, `Depends`, `BackgroundTasks` |
| `sqlalchemy` | 2.0.36 | ORM |
| `alembic` | 1.13.3 | migrations |
| `pydantic` | 2.10.3 | validation — **v2**, to `model_validator` / `field_validator` use karo |
| `psycopg2-binary` | 2.9.10 | postgres driver (**sync**) |
| `PyJWT` | 2.8.0 | token padhna (`get_userinfo_from_token`) |
| `requests` | 2.32.3 | doosri services ko call karna — notification isi se jaati hai |
| `httpx` | 0.27.2 | async HTTP, jahan chahiye |
| `python-dotenv` | 1.0.1 | env load |
| `python-json-logger` | 2.0.7 | structured logs |
| `pytest`, `pytest-asyncio` | 8.3.3 / 0.24.0 | tests |
| `python-dateutil` | 2.9.0 | date arithmetic |
| `tzdata` | 2024.2 | IANA timezone database — `zoneinfo` isi ko padhta hai |

### Stdlib — install kuch nahi karna

| Module | Kaam |
|---|---|
| `zoneinfo` | **timezone** — `ZoneInfo("Asia/Kolkata")` |
| `datetime` | `datetime.now(timezone.utc)` |
| `uuid` | primary keys |

### `pytz` ke baare me

`pytz==2024.2` requirements me hai, aur purane code me use hua hai. **Naye
calendar code me `zoneinfo` use karo** — wo Python 3.9+ me stdlib hai, aur
`pytz` ka `localize()` wala API aasani se galat lag jaata hai.

```python
# ❌ purana tareeka
import pytz
pytz.timezone("Asia/Kolkata").localize(naive_dt)

# ✅ naya
from zoneinfo import ZoneInfo
naive_dt.replace(tzinfo=ZoneInfo("Asia/Kolkata"))
```

`tzdata` pehle se hai, to `zoneinfo` ko IANA database mil jaayega — Docker image
me alag se kuch nahi chahiye.

### Ye NAHI hai — Phase 0 me tay karna hai

| Cheez | Haal | Kya karna hoga |
|---|---|---|
| **Celery / RQ / APScheduler** | **koi nahi hai** | Nudges ke liye kuch chahiye — neeche §12 dekho |
| **Redis** | nahi hai | agar Celery chuna to chahiye hoga |
| Email library | nahi hai, **aur zaroorat bhi nahi** | notification service khud email bhejti hai |
| FCM / push SDK | nahi hai, **zaroorat nahi** | wahi service `mobile_notification=True` par push bhejti hai |

> Notification ke liye koi nayi library mat jodna. Ek HTTP call kaafi hai —
> §11 dekho.

## 14. Env variables

`conf.py` ka pattern follow karo — module-level constant, `environ.get("NAME")`:

```python
# conf.py me jodo
CALENDAR_LINK = environ.get("CALENDAR_LINK")
DEFAULT_ORG_TIMEZONE = environ.get("DEFAULT_ORG_TIMEZONE", "Asia/Kolkata")
NUDGE_SCHEDULER_INTERVAL_MINUTES = int(environ.get("NUDGE_SCHEDULER_INTERVAL_MINUTES", 15))
NOTIFICATION_BATCH_SIZE = int(environ.get("NOTIFICATION_BATCH_SIZE", 500))
NOTIFICATION_MAX_RETRIES = int(environ.get("NOTIFICATION_MAX_RETRIES", 5))
STUDENT_REMINDER_LIMIT = int(environ.get("STUDENT_REMINDER_LIMIT", 50))
CALENDAR_MAX_RANGE_DAYS = int(environ.get("CALENDAR_MAX_RANGE_DAYS", 62))
CAMPUS_CALENDAR_ENABLED = environ.get("CAMPUS_CALENDAR_ENABLED", "true").lower() == "true"
```

| Variable | Default | Kaam |
|---|---|---|
| `CALENDAR_LINK` | — | deep link ka base, notification me jaata hai (`APPLY_LINK` jaisa) |
| `DEFAULT_ORG_TIMEZONE` | `Asia/Kolkata` | jab org par timezone set na ho |
| `NUDGE_SCHEDULER_INTERVAL_MINUTES` | 15 | worker kitni der me ek baar chale |
| `NOTIFICATION_BATCH_SIZE` | 500 | ek call me kitne recipients |
| `NOTIFICATION_MAX_RETRIES` | 5 | fail hone par kitni baar |
| `STUDENT_REMINDER_LIMIT` | 50 | FR-CAL-19 |
| `CALENDAR_MAX_RANGE_DAYS` | 62 | ek request me kitna range |
| `CAMPUS_CALENDAR_ENABLED` | true | feature flag (HLD: default ON) |

**Pehle se hain, inhe dobara mat banana:**

| Variable | Kaam |
|---|---|
| `ADD_NOTIFICATION_URL` | notification service — bell + email + push |
| `USER_MANAGEMENT_IDENTITY_LIST` | role/org/department se users ki list |
| `POSTGRES_*` | DB connection |

**Hardcode mat karna** — BRD me ye saari values "configurable" kahi gayi hain.

## 15. Migrations

Apni service ka apna Alembic — **ek hi DB, ek hi migration chain**. SkillsBridge
wala tenant/public ka do-alag-alembic jhanjhat yahan nahi hai.

> Abhi ki aakhri migration: `setup/migrations/versions/a1c4e7f2b905_other_event_type_name.py`
> (revises `b8f6d0e2a475`) — `calendar_event.other_type` (varchar 80) jodta hai.
> Lagane ke liye: `make db-up`.

```bash
# pehli baar
alembic init migrations

# har change par
alembic revision --autogenerate -m "campus calendar: events, audience, recipients"
alembic upgrade head
```

**Checklist har migration par:**

- [ ] `upgrade` aur `downgrade` dono likhe hain
- [ ] local par up → down → up chala kar dekha
- [ ] indexes migration me hain, baad ke liye nahi chhode
- [ ] `calendar_settings` ki default row seed ho rahi hai
- [ ] `DateTime(timezone=True)` hai, plain `DateTime` nahi
- [ ] `org_id` har table par hai (`calendar_settings` ko chhod kar)
- [ ] doosri service ke id (`student_id`, `company_id`, job ids) par **FK nahi** lagaya

### Project ka dhaancha

```
campus-calendar-service/
├── app/
│   ├── main.py                  FastAPI app
│   ├── conf.py                  environ.get(...) — SkillsBridge jaisa
│   ├── db/
│   │   ├── models.py            6 tables
│   │   └── session.py           engine, SessionLocal, get_db
│   ├── models/
│   │   ├── request_model.py     Pydantic in
│   │   └── response_model.py    Pydantic out
│   ├── services/
│   │   ├── calendar_service.py
│   │   ├── calendar_audience_service.py
│   │   ├── calendar_deadline_service.py
│   │   └── calendar_nudge_service.py
│   ├── clients/                 §1a — bahar ki services
│   │   ├── identity_client.py
│   │   ├── jobs_client.py
│   │   └── notification_client.py
│   ├── routes/
│   │   ├── calendar.py
│   │   └── calendar_settings.py
│   └── jobs/
│       └── run_due_nudges.py    cron isko chalayega (§12)
├── migrations/
├── requirements.txt
└── Dockerfile
```

## 16. Step by step — build order

| # | Kaam | Done when |
|---|---|---|
| **B1** | Phase 0 ke sawaal — timezone, student fields, eligibility, notif service, scheduler | sab likhe hue hain |
| **B2** | 6 models `db_schema.py` me | import ho rahe hain, koi circular FK nahi |
| **B3** | Tenant + public migrations | up/down dono chale, settings ki row seed hui |
| **B4** | Pydantic request/response models | type-level validation test se pass |
| **B5** | `calendar_audience_service` — resolve + count + options | alag combinations par sahi count |
| **B6** | `POST /calendar/audience/count` | drawer isse live count dikha sakta hai |
| **B7** | `calendar_deadline_service` — derive | job badalne par apne aap sahi |
| **B8** | `GET /calendar/events` — teeno kism ek saath | TPO ko poora mahina ek call me |
| **B9** | `POST /calendar/events` + recipients freeze | event bana, recipients bhare |
| **B10** | `PATCH` + `preview-changes` + audience diff | added/removed/kept sahi |
| **B11** | `POST /cancel` + reason rules | created_by_mistake alag behave kare |
| **B12** | Reminder CRUD + 50 ki limit | owner ke alawa koi na dekh paye |
| **B13** | `GET /calendar/student/events` + 403 | doosre ki item par 403 |
| **B14** | Notification worker | service band ho to bhi event save |
| **B15** | Nudge scheduling (3 types) | sahi UTC instant bana |
| **B16** | Nudge worker + rules | limit, quiet hours, relevance, no-repeat |
| **B17** | Settings GET/PUT | sirf aage ke nudges par asar |
| **B18** | Indexes + load test | 2000 students wale event par response theek |

---

## 17. Performance aur indexes

| Query | Index |
|---|---|
| mahine ka calendar | `(org_id, event_date)` |
| student ka calendar | `(student_id, state)` recipients par |
| due nudges | `(status, scheduled_at)` |
| owner ke reminders | `(owner_id, reminder_date)` |

**Teen cheezein dhyan rakhna:**

1. **Date range cap** — ek request me `CALENDAR_MAX_RANGE_DAYS` se zyada nahi,
   warna koi poora saal maang lega
2. **Deadlines har call par derive hoti hain** — active jobs ki query par index
   zaroori; zyada load lage to short-TTL cache
3. **Recipients bulk insert** — 2000 rows ek-ek karke nahi, `bulk_insert_mappings`

---

## 18. Security checklist

- [ ] Har endpoint par `Depends(require(Capability.X))` — koi route bina gate ke na ho
- [ ] Anjaan role → default **deny** (`can()` False deta hai)
- [ ] Capability ≠ ownership — dono alag se check hon
- [ ] `org_id` **hamesha session se**, kabhi request body se nahi
- [ ] Student ke har item par visibility check → bahar ka ho to **403**
- [ ] Edit / cancel par `created_by == current_user` ka check **service me**
- [ ] Settings sirf super admin
- [ ] Reminder par `owner_id` check
- [ ] Rate limit audience-count par (drawer har keystroke par maar sakta hai)
- [ ] Event IDs UUID — sequential nahi, to guess nahi ho sakte
- [ ] Cancelled events kabhi hard delete nahi (audit)
