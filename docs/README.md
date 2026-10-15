# Campus Calendar — Docs

```
docs/
├── README.md                              ← ye file
├── campus-calendar-master.md              sab kuch: feature se lekar build steps tak
├── campus-calendar-backend-design.md      backend ka poora architecture
└── requirements/                          product team ne di — AS-IS, edit mat karna
    ├── campus-calendar-hld.md
    ├── campus-calendar-brd.md
    └── campus-calendar-ui-spec.md
```

## Kaun kya padhe

| Kaun | Kya |
|---|---|
| **Naya banda / manager** | `campus-calendar-master.md` — poori kahani ek file me |
| **Frontend dev** | master ka §8 (steps + screen→repo mapping) → `requirements/campus-calendar-ui-spec.md` (wireframes) |
| **Backend dev** | master ka §7 → `campus-calendar-backend-design.md` |
| **QA** | `requirements/campus-calendar-brd.md` (acceptance criteria) + master ka §10 QA checklist |

## Do files jo humne banayi

| File | Lines | Kya hai |
|---|---|---|
| `campus-calendar-master.md` | 888 | Feature, flow, 40 screens, backend khaka, **Phase 0–10 ka poora build plan**, screen → repo mapping, rules, QA checklist, risks, conclusion |
| `campus-calendar-backend-design.md` | 1031 | Layers, DB design, 6 tables, SQLAlchemy + Pydantic models, services, routes, validation, notifications, nudge scheduler, libraries, env vars, migrations, indexes, security — aur **date/time ka faisla (§3)** |

## Teen files jo product team ne di (`requirements/`)

| File | Lines | Kya hai |
|---|---|---|
| `campus-calendar-hld.md` | 139 | High Level — kya, kyun, kaun |
| `campus-calendar-brd.md` | 622 | 27 functional requirements with acceptance criteria |
| `campus-calendar-ui-spec.md` | 1420 | 40 screens — wireframes, states, exact copy (T- / S- / M- / A-) |

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

## Teen faisle jo yaad rakhne layak hain

1. **Deadline kabhi store nahi hogi** — job ki expiry date se derive hogi
2. **Event kabhi delete nahi hoga** — sirf soft cancel, audit ke liye
3. **Time DB me UTC, render user ke timezone me** — all-day items `DATE` me,
   `timestamp` me nahi *(backend design §3)*

## Jo abhi missing hai

- **Mobile app repo** — local machine par nahi hai, Phase 10 (M-01 … M-07) hold par
- **Phase 0 ke 7 sawaal** — timezone, student ke course/batch/department fields,
  job eligibility (FR-JP-17), notification service, scheduler, push provider,
  settings table — in sabke jawab code shuru karne se pehle chahiye
