# Campus Calendar — install and run (local)

Do repo hain, ek hi folder me rakho:

```
calendar/
├── calendar-backend/     FastAPI + Postgres   → port 8001
└── calendar-frontend/    React + Vite         → port 5180
```

Chahiye: **Python 3.10+**, **Node 20+**, **Docker**.

---

## 1. Database

```bash
cd calendar-backend

make db-init      # sirf pehli baar — Postgres container (port 5440)
make db-start     # uske baad har baar
```

Kaam khatam hone par: `make db-stop`

---

## 2. Backend

```bash
cd calendar-backend

python3 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env

make db-check                      # DB hai ya nahi
make db-up                         # na ho to bana lo; ho to naye migrations chala do
                                   # (jaise calendar_event.other_type — har pull ke baad chalao)
make run                           # API chalu
```

Check: `curl http://127.0.0.1:8001/health` → `{"status":"ok","database":"up"}`

Detail: [`setup/README.md`](setup/README.md)

---

## 3. Frontend

Naya terminal (backend chalta rehne do):

```bash
cd calendar-frontend

npm install
cp .env.example .env               # VITE_API_BASE_URL=http://127.0.0.1:8001

npm run dev -- --port 5180 --strictPort
```

Kholo: **http://localhost:5180**

> Port 5180 hi rakhna — backend ke `.env` me CORS isi port ke liye khula hai.

### Calendar package (`src/calendar`)

Calendar ka component **headless** hai — sirf dikhata hai aur callbacks se batata hai
(`onViewEvent`, `onCreateRequest`, `onDeleteAllRequest`, `onSyncRequest`, `onNotice`).
Koi modal, API call ya toast uske andar nahi; saare modals app ke apne hain
(`src/modules/Calendar/components/`, `pages/CalendarPage` se khulte hain).

`npm install` me sab aa jaata hai. Doosre repo me copy karo to package ko sirf ye
chahiye: `react`, `date-fns`, `lucide-react`, `clsx`, `tailwind-merge`,
`class-variance-authority`, `@radix-ui/react-popover`, `@radix-ui/react-slot`
(+ dev: `tailwindcss@3`, `tailwindcss-animate`, `postcss`, `autoprefixer`).
`formik`, `yup`, Tiptap, `react-hot-toast` waghaira **app** ke modals ke liye hain,
package ke liye nahi.

Poora use: [`src/calendar/README.md`](src/calendar/README.md) (= `docs/calendar-usage.md`).

---

## 4. Data saaf karna ho (kabhi bhi)

```bash
make db-drop     # database delete
make db-up       # database + saari tables + settings row, data khali
```

Detail: [`setup/db-drop-up.md`](setup/db-drop-up.md)

---

## 5. Login

| Role | Email | Password |
|---|---|---|
| TPO | `tpo@campus.test` | `tpo@1234` |
| TPO (doosra) | `tpo2@campus.test` | `tpo2@1234` |
| Student | `student@campus.test` | `student@1234` |
| Super Admin | `admin@campus.test` | `admin@1234` |
