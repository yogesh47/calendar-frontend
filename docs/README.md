# Campus Calendar — Docs

```
docs/
├── README.md                              ← ye file
├── campus-calendar-master.md              sab kuch: feature se lekar build steps tak
├── campus-calendar-backend-design.md      backend ka poora architecture
├── campus-calendar-v1.1-status.md         v1.1 demo ke 7 faisle — kya bana, kya nahi (purani report)
├── timezone.md                            time zones: login, signup, event create — kya bhejna hai
├── calendar-usage.md                      headless <Calendar /> kaise use karein: har prop, callback, label, icon, piece
│                                          (= src/calendar/README.md, byte-for-byte same)
└── requirements/                          product team ne di — AS-IS, edit mat karna
    ├── campus-calendar-hld.md
    ├── campus-calendar-brd.md
    └── campus-calendar-ui-spec.md
```

## Kaun kya padhe

| Kaun | Kya |
|---|---|
| **Naya banda / manager** | `campus-calendar-master.md` — poori kahani ek file me |
| **Frontend dev** | master ka §8 (steps, "Abhi kaise bana hai", screen→repo mapping) → `calendar-usage.md` (calendar package) → `requirements/campus-calendar-ui-spec.md` (wireframes) |
| **Backend dev** | master ka §7 → `campus-calendar-backend-design.md` |
| **QA** | `requirements/campus-calendar-brd.md` (acceptance criteria) + master ka §10 QA checklist |

## Files jo humne banayi

| File | Lines | Kya hai |
|---|---|---|
| `campus-calendar-master.md` | 1194 | Feature, flow, 40 screens, backend khaka, **Phase 0–10 ka poora build plan**, abhi kaise bana hai (headless calendar + app ke modals, flow), screen → repo mapping, rules, QA checklist, risks, conclusion |
| `campus-calendar-backend-design.md` | 1612 | Layers, DB design, 6 tables, SQLAlchemy + Pydantic models, services, routes, validation, notifications (incl. `notify_on_change`), nudge scheduler, libraries, env vars, migrations, indexes, security — aur **date/time ka faisla (§3)** |
| `campus-calendar-v1.1-status.md` | 184 | v1.1 ke 7 faisle aur unka haal — purani report; upar 2026-10-30 ka note ki `onNext`/ref design ab headless calendar se badal gaya |
| `timezone.md` | 534 | Zone kab, kahan, kaise — sign-in, event / reminder save, nudges, notifications, "Campus time" row, tests |
| `calendar-usage.md` | 569 | Calendar package ka poora use — props, callbacks, labels, icons, app ke modals ka pattern, pieces, helpers |

## Teen files jo product team ne di (`requirements/`)

| File | Lines | Kya hai |
|---|---|---|
| `campus-calendar-hld.md` | 139 | High Level — kya, kyun, kaun |
| `campus-calendar-brd.md` | 622 | 27 functional requirements with acceptance criteria |
| `campus-calendar-ui-spec.md` | 1496 | 40 screens — wireframes, states, exact copy (T- / S- / M- / A-) |

> Ye teen **jaisi mili thi waisi** hain. Inme koi badlav nahi kiya. Naya version
> aaye to poori file replace karna, patch nahi — warna source of truth hil
> jaayega.

## Kaun sa document kis cheez ka sach hai

| Sawaal | Kahan |
|---|---|
| Behaviour kya hona chahiye? | `requirements/…-brd.md` |
| Dikhega kaisa? | `requirements/…-ui-spec.md` |
| DB, API, scheduler kaise banega? | `campus-calendar-backend-design.md` |
| Kya banana hai, kis order me? | `campus-calendar-master.md` §8 |
| Calendar component kaise lagayein / kya deta hai? | `calendar-usage.md` (= `src/calendar/README.md`) |

## Teen faisle jo yaad rakhne layak hain

1. **Deadline kabhi store nahi hogi** — job ki expiry date se derive hogi
2. **Event kabhi chupchaap delete nahi hota** — pehle soft cancel (audit ke liye, students ko "Cancelled" dikhta hai). Cancel ke baad hi uska maalik TPO use **hamesha ke liye delete** kar sakta hai ("Delete permanently"); "Delete all" bhi hai.
3. **Time DB me UTC, render user ke timezone me** — all-day items `DATE` me,
   `timestamp` me nahi *(backend design §3)*

## Jo abhi missing hai

- **Mobile app repo** — local machine par nahi hai, Phase 10 (M-01 … M-07) hold par
- **Phase 0 ke 7 sawaal** — timezone, student ke course/batch/department fields,
  job eligibility (FR-JP-17), notification service, scheduler, push provider,
  settings table — in sabke jawab code shuru karne se pehle chahiye
