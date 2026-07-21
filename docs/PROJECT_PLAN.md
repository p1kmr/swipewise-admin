# SwipeWise Admin — Project Plan

**Platform:** **Vercel** (React SPA + serverless `/api`) + **MongoDB Atlas** — **no Firebase, no Blaze**

Document version: v3.0 — Vercel + MongoDB POC stack; mobile-first PWA (July 2026)

---

## 1. What this is

Standalone admin panel for SwipeWise content: swipe cards, AI generation, scripts, QOTD, jurisdiction config.
Built as a **POC** on free-tier Vercel Hobby + Atlas M0.

| Layer | Choice |
|---|---|
| Hosting | **Vercel** — SPA (`dist/`) + `/api/*` serverless |
| Database | **MongoDB Atlas** (`swipewise_admin` database) |
| Auth | **Single admin** — `ADMIN_EMAIL` + `ADMIN_PASSWORD` in server env |
| AI | **`POST /api/generate-from-pdf`** — Gemini key server-side |
| Excel | **Client-side** SheetJS (unchanged) |
| Billing | **Free** — Vercel Hobby + Atlas free tier |

---

## 2. Architecture

```
Browser (React SPA)
  → POST /api/auth/login          (JWT in sessionStorage)
  → GET/POST /api/content         (MongoDB content collection)
  → POST /api/generate-from-pdf   (Gemini + inline PDF base64)
  → POST /api/generation/lineage  (raw_data + generation_logs)

Vercel /api/*  →  MongoDB Atlas (swipewise_admin)
              →  Gemini API (GEMINI_API_KEY)
```

The user app (future rebuild) can read the same MongoDB collections or migrate later.
Admin and user app are **separate codebases**; MongoDB is the shared contract via `swipewise_schema.json`.

---

## 3. Rules of the road

1. **All secrets server-side** in Vercel env — never `VITE_` except optional login email pre-fill.
2. **All DB access through `/api/*`** — client never holds `MONGODB_URI`.
3. **Single admin account** — no registration, no RBAC in POC.
4. **PDF inline to `/api/generate-from-pdf`** — under ~4 MB (Vercel Hobby limit).
5. **Nothing auto-publishes** — human review required (`approval.published = false` on import).
6. **Local dev:** `vercel dev` (not `npm run dev` alone) so `/api` routes work.

---

## 4. Folder structure

```
swipe-wise-admin/
├── api/
│   ├── _lib/           # mongodb.js, auth.js, gemini.js
│   ├── auth/           # login.js, me.js
│   ├── content/        # index.js, [id].js, publish-batch.js
│   ├── generation/     # lineage.js
│   └── generate-from-pdf.js
├── src/
│   ├── constants/      # routes, MongoDB collection names, enums
│   ├── context/        # AuthContext, ThemeContext
│   ├── hooks/          # useAuth, useTheme
│   ├── services/       # apiClient, contentService, generationService
│   ├── utils/          # parseCards, excelTemplate
│   ├── components/     # shell, ProtectedRoute
│   └── pages/          # Login, Dashboard, Upload, Review, Generate
├── docs/               # PROJECT_PLAN, SOW
├── plan/               # phase-1 … phase-5
├── vercel.json
├── .env.example
└── package.json
```

---

## 5. Phases (summary)

| Phase | Goal | Key routes |
|---|---|---|
| **1 — Foundation** | Auth shell, deploy, theme | `/api/auth/login`, `/api/auth/me` |
| **2 — Swipe cards** | Excel upload → review → publish | `/api/content` |
| **3 — AI generation** | PDF → Gemini drafts → import | `/api/generate-from-pdf`, `/api/generation/lineage` |
| **4 — Scripts + QOTD** | Same review/publish pattern | `/api/scripts`, `/api/qotd` (future) |
| **5 — Plug-and-play** | Jurisdiction config + i18n | `/api/config`, etc. (future) |

Phase details: [plan/phase-1-foundation.md](../plan/phase-1-foundation.md) through [phase-5](../plan/phase-5-plug-and-play.md).

---

## 6. MongoDB collections

| Collection | Purpose |
|---|---|
| `content` | Swipe cards (`approval.published` gate) |
| `raw_data` | Source PDF metadata (no file stored in POC) |
| `generation_logs` | AI run lineage |
| `scripts` | WiseBot dialogues (Phase 4) |
| `qotd` | Question of the day (Phase 4) |
| `config` | Jurisdiction plug-and-play (Phase 5) |
| `jurisdiction_data` | Regulatory/scam data (Phase 5) |
| `jurisdiction_registry` | Intermediary registry (Phase 5) |

Document shapes match **`swipewise_schema.json`**.

Index on `content`: `{ "approval.published": 1, createdAt: -1 }`.

---

## 7. Environment variables

**Server-only (Vercel + `.env.local`):**

| Variable | Purpose |
|---|---|
| `MONGODB_URI` | Atlas connection string |
| `MONGODB_DB_NAME` | Database name (default `swipewise_admin`) |
| `ADMIN_EMAIL` | Single admin login email |
| `ADMIN_PASSWORD` | Single admin login password |
| `GEMINI_API_KEY` | Gemini API key |
| `JWT_SECRET` | JWT signing secret (optional; falls back to ADMIN_PASSWORD in dev) |

**Client (optional):**

| Variable | Purpose |
|---|---|
| `VITE_ADMIN_EMAIL` | Pre-fill login form email only |

---

## 8. Local development

```bash
cd swipe-wise-admin
cp .env.example .env.local
# Fill MONGODB_URI, ADMIN_EMAIL, ADMIN_PASSWORD, GEMINI_API_KEY

npm install
vercel dev          # SPA + /api on localhost:3000
```

Use `npm run dev` for UI-only work (no `/api`).

---

## 9. Deploy

Push to GitHub → connect Vercel project → set env vars in dashboard → deploy.
No Firebase CLI required.

---

## 10. Out of scope (POC)

- Multi-admin / RBAC
- PDF archival to blob storage
- Migrating old SwipeWise `Card` documents
- User app integration (future rebuild)
