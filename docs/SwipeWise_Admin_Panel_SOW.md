# SwipeWise — Admin Panel Scope of Work

**Use AI Responsibly to Strengthen Investor Education**
Applicant: KAARYA FACILITIES SERVICES LTD. | Project: SwipeWise | Component: **Admin / Back-Office Panel**
Document version: **v3.0 — Vercel + MongoDB Atlas POC (July 2026)**

---

## 0. How to read this document

This is a **standalone requirements document for the SwipeWise Admin Panel**. All end-user
(mobile / PWA) features are out of scope here.

**Platform decision (POC):** The admin panel runs on **Vercel** (React SPA + serverless `/api`) with
**MongoDB Atlas** as the database. A single admin account is configured via server environment variables.
There is **no Firebase**, **no Blaze billing**, and **no client-side database SDK**.

- **User app** (out of scope here; future rebuild): will read the same MongoDB collections (or migrate later).
- **Admin panel** (this document): **React + Vite**, deployed to **Vercel** with `/api/*` routes for
  auth, content CRUD, and Gemini PDF generation. Mobile-first responsive + installable **PWA**.

Both apps share **MongoDB** as their contract — same collection names and document shapes from
`swipewise_schema.json`. The admin is built first; the user app conforms later.

> **Naming note:** the master SOW's "15 MongoDB collections" map 1:1 to **MongoDB collections** in Atlas.
> `approval.published` stays a document field; the user app filters reads to `approval.published == true`.

**Delivery is split into two phases** (our build order — not terms in `SwipeWise.txt`):

| Phase | Goal |
|-------|------|
| **Phase 1 (MVP)** | Login + Excel upload + review + publish swipe cards |
| **Phase 2** | Complete remaining master SOW admin/back-office requirements |

---

## 0.1 What the master SOW says about admin

`SwipeWise.txt` Section 5 (admin panel):

> The admin panel should have the functionality to generate content **2 options**: an excel
> upload functionality and an **LLM Api** wherein the admin can attach pdf sources which the
> LLM will read and then populate the excel sheet template with questions. The admin will then
> **review the questions and then upload the questions on swipewise**.

Related master SOW rules (still honoured):

- User app reads `content` / `scripts` only where **`approval.published == true`** (§3.2)
- Plug-and-Play jurisdiction onboarding via `config`, `jurisdiction_data`, `jurisdiction_registry` (§1.3, §6.2)
- QOTD questions via Excel fields (§4.8)
- Translation via Google Sheet template (§6.2–6.3)
- Prototype jurisdictions: **India, Spain, France** (§1.4)
- No PII / anonymous users (§3.2) — user app uses anonymous UUID (future)

---

## 0.2 Our additions / platform choices

| Item | Phase | Why |
|------|-------|-----|
| Admin login (email + password) | 1 | Single admin via `ADMIN_EMAIL` / `ADMIN_PASSWORD` in Vercel env |
| JWT session token | 1 | Returned by `POST /api/auth/login`; stored in `sessionStorage` |
| **MongoDB Atlas** as the database | 1 | Collections map from the master SOW |
| **Vercel serverless `/api`** (Node) | 1–3 | Auth, DB access, Gemini key — all server-side |
| PDF posted **inline** to `/api` | 3 | Base64 PDF in request body (~4 MB POC limit); no blob storage |
| Review list + publish UI | 1 | Implements §5 review + §3.2 publish gate |
| Mobile-first responsive + **PWA** | 1 | Usable on phones; installable offline shell (`vite-plugin-pwa`) |

**Not used:** Firebase (Auth, Firestore, Functions, Storage), JWT+bcrypt user collection, Express host,
GridFS. All secrets live in Vercel environment variables only.

---

# PHASE 1 — MVP (build first)

## 1. Purpose & Scope (Phase 1)

### 1.1 What the admin can do (Phase 1)
1. **Log in** — `POST /api/auth/login` against server env credentials.
2. **Download Excel template** and **upload** swipe-card rows (master §5, Path 1).
3. **Review** imported rows in a simple list.
4. **Publish** approved rows (`approval.published = true`, master §3.2).

### 1.2 Phase 1 capabilities
| # | Capability | In `SwipeWise.txt`? |
|---|------------|---------------------|
| A | Admin login | No — our addition |
| B | Excel template download + upload | **Yes — §5 Path 1** |
| C | Review before go-live | **Yes — §5** |
| D | Publish swipe cards | **Yes — §3.2** |
| E | Simple content review list | No — minimal UI for §5 |

### 1.3 Deferred to Phase 2
PDF→LLM pipeline, WiseBot scripts, QOTD, jurisdiction config/data, translation import.

---

## 2. Technology Stack (Phase 1)

| Layer | Technology |
|-------|-----------|
| Client | **React + Vite** (Tailwind, lucide-react, Context + `useReducer`) |
| Auth | **Vercel `/api/auth/login`** — env credentials + JWT |
| Database | **MongoDB Atlas** (`swipewise_admin` database) |
| API | **Vercel serverless** `/api/content`, `/api/auth/*` |
| Excel | **SheetJS (xlsx)** — parsed in the client |
| Hosting | **Vercel** (SPA + `/api`) |

### 2.1 Architecture

```
Browser (React SPA)
  → POST /api/auth/login     → JWT
  → GET/POST /api/content    → MongoDB content collection

Vercel /api/*  →  MongoDB Atlas
```

- Client never holds `MONGODB_URI` or admin password.
- All `/api/*` routes (except login) require `Authorization: Bearer <token>`.
- Nothing auto-publishes — import sets `approval.published = false`.

---

## 3. Authentication (Phase 1)

- Single admin account: `ADMIN_EMAIL` + `ADMIN_PASSWORD` in Vercel env (and `.env.local` for dev).
- `POST /api/auth/login` { email, password } → JWT (7-day TTL).
- Client stores token in `sessionStorage`; `GET /api/auth/me` validates on load.
- **No self-registration.** No RBAC in POC.

---

## 4. Module A — Excel Upload & Review (§5, Path 1)

### 4.1 Screens
1. Login
2. Upload page — download template, upload `.xlsx`
3. Review list — unpublished rows, publish per row or batch

### 4.2 Flow
1. Download template (Appendix A).
2. Fill rows offline → upload; **SheetJS parses in the browser** and validates each row.
3. Valid rows `POST /api/content` with `approval.published = false`.
4. Admin reviews list → publishes → `PATCH /api/content/:id` or batch publish.

### 4.3 Upload feedback
- Count saved vs skipped.
- Per skipped row: row number + error reason.

---

## 5. MongoDB collections (Phase 1)

| Collection | Access | Usage |
|------------|--------|-------|
| `content` | `/api/content` (auth required) | Import + publish |

---

## 6. API operations (Phase 1)

```
POST /api/auth/login              { email, password } → { token, user }
GET  /api/auth/me                 Bearer token → { user }
GET  /api/content                 list all (newest first)
POST /api/content                 { cards: [...] } → import batch (unpublished)
PATCH /api/content/:id            publish single
POST /api/content/publish-batch   { ids: [...] } → publish many
```

---

## 7. Phase 1 acceptance checklist
- [ ] Admin login works via `/api/auth/login`.
- [ ] Excel template download + upload with row-level errors.
- [ ] Review list shows imported unpublished rows.
- [ ] Publish flips `approval.published`; user app (future) reads only published.

---

# PHASE 2 — Complete master SOW admin scope

## 10. Purpose & Scope (Phase 2)

**Goal:** Finish everything `SwipeWise.txt` expects from admin/back-office tooling.

### 10.1 Phase 2 capabilities
| # | Capability | Master reference |
|---|------------|------------------|
| F | **PDF → Gemini → draft rows** → review → import | **§5 Path 2** |
| G | Generation lineage (`raw_data`, `generation_logs`) | §3.1 |
| H | **WiseBot scripts** — upload, review, publish | §3.2, §4.2 |
| I | **Question of the Day** — Excel import, review, publish | §4.8 |
| J | **Jurisdiction config** — create/edit, go-live toggle | §1.3, §6.2 |
| K | **Jurisdiction data** upload | §1.3, §6.2 Step 2 |
| L | **Registered intermediaries** bulk upload | §1.3, §3.1 |
| M | **Translation import** (Google Sheet template) | §6.2 Step 3, §6.3 |
| N | Support prototype jurisdictions **IN, ES, FR** | §1.4 |

---

## 11. Technology additions (Phase 2)

| Layer | Addition | Used for |
|-------|----------|----------|
| LLM | **Gemini API** (`gemini-2.5-flash`) via `/api/generate-from-pdf` | PDF → question rows (§5 Path 2) |
| PDF | Inline base64 in POST body | POC — no Storage; ~4 MB limit |
| Secrets | `GEMINI_API_KEY` in Vercel env | Server-side only |
| Excel | SheetJS (from Phase 1) | QOTD + jurisdiction uploads |

LLM output is **never auto-published** — admin always reviews first.

---

## 12. Phase 2 modules

### 12.1 Module B — PDF → Gemini → review → import (§5, Path 2)
**Screens:** Upload PDF → set params → generated draft grid → review → import to `content`.

**Flow:**
1. Admin selects a PDF (≤ ~4 MB for POC).
2. Client base64-encodes PDF → `POST /api/generate-from-pdf` with params (jurisdiction, language, count, skills, difficulty range).
3. Server calls Gemini → returns draft rows matching swipe-card schema.
4. Client writes lineage via `POST /api/generation/lineage` (`raw_data` metadata + `generation_logs`).
5. Admin edits drafts in review grid → `POST /api/content` import (unpublished).

**Acceptance:** LLM never publishes without review; every run has `generation_logs` linked to `raw_data`.

### 12.2 Module C — WiseBot Scripts (§4.2)
Same upload → review → publish pattern via future `/api/scripts` routes.

### 12.3 Module D — Question of the Day (§4.8)
Excel upload → validate → review → publish via future `/api/qotd` routes.

### 12.4 Module E — Jurisdiction Plug-and-Play (§1.3, §6.2)
Config form + data/registry uploads + `active` toggle via future `/api/config` routes.

### 12.5 Module F — Translation Import (§6.2 Step 3, §6.3)
Sheet import + coverage report via future `/api/i18n` route.

---

## 13. MongoDB collections (Phase 2)

| Collection | Usage |
|------------|-------|
| `content` | Phase 1 + LLM import |
| `scripts` | Upload, review, publish |
| `config` | Jurisdiction config + go-live |
| `jurisdiction_data` | Data upload |
| `jurisdiction_registry` | Registered intermediary upload |
| `raw_data` | Source PDF metadata (no file stored in POC) |
| `generation_logs` | LLM generation lineage |

---

## 14. API operations (Phase 2)

All Phase 1 routes plus:

```
POST /api/generate-from-pdf     { pdfBase64, mimeType, params } → { cards, model }
POST /api/generation/lineage    { fileName, size, params, counts } → { rawDataId, generationLogId }
# Future: /api/scripts, /api/qotd, /api/config, /api/jurisdiction-data, /api/i18n
```

---

## 15. Phase 2 acceptance checklist
- [ ] PDF → Gemini → draft grid → import unpublished.
- [ ] `generation_logs` + `raw_data` record lineage per run.
- [ ] Scripts, QOTD, jurisdiction config/data, translation (as built in phases 4–5).

---

## Appendix A — Swipe card Excel columns
`jurisdiction`, `language_code`, `visual_type`, `scenario_text`, `verdict`, `explanation`,
`red_flags` (delimited), `action_step`, `verification_link`, `ai_under_hood_why_shown`,
`ai_under_hood_what_it_tests`, `difficulty`, `bucket`, `skill_tested`.
Confirm against **`swipewise_schema.json`**.

## Appendix B — Nine `skill_tested` values (§4.4)
Hallucination Detection · Deepfake Recognition · Source Verification · AI Explainability ·
Confidence Calibration · Market Fundamentals · Verification Behaviour · Risk Awareness · Critical Thinking.

## Appendix C — QOTD Excel columns (§4.8)
`question_description`, `answer`, `explanation`, `jurisdiction`, `difficulty_level` —
plus recommended: `options`, `language_code`, `skill_tested`, `active_from`, `active_to`.

## Appendix D — Schema source of truth
Reconcile all field names with **`swipewise_schema.json`** — the shared **MongoDB document shape**
both admin and user app build against. Schema wins if this document differs.
