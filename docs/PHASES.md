# SwipeWise Admin — Build Phases (single Question dashboard)

**This supersedes `plan/phase-1..5.md`.** Those describe the old multi-section admin, which the
owner has replaced. Do not implement them.

## Why this rebuild

The admin is being collapsed into **one focused tool**: the admin uploads the **question master
Excel**, then manages questions from a single screen — **publish/unpublish, edit, update, delete,
save, search**, and **change a question with AI**. Everything is **mobile / PWA friendly**.

The owner's master file (`SwipeWise_Question_Upload_Template_3_1.xlsx`) is the schema contract:
its `Questions` sheet has **21 columns** and drops `Regulator`, `Question_ID`, `Scenario_Context`,
`Tags`, `Created_By` versus the earlier build.

---

## Phase 1 — Schema realignment + backend CRUD
- Trim `src/constants/enums.js` to the 21-column `QUESTION_COLUMNS` + required set.
- Update `src/utils/parseQuestions.js` and `src/utils/excelTemplate.js` to the 21-column master.
- `api/_lib/services/content.js`: add `updateContent(id, fields)` and `deleteContent(id)`.
- `api/_lib/router.js`: `content/:id` **PATCH** + **DELETE**; `content/ai-edit` **POST**.
- `api/_lib/gemini.js`: add `reviseQuestion(question, instruction)`.
- **Exit check:** owner's `Template_3_1.xlsx` parses with 0 "missing Regulator" errors; PATCH/DELETE work.

## Phase 2 — Single Question dashboard (Excel + list + CRUD + search)
- New `src/pages/QuestionsDashboard.jsx`: UploadBar, search + filter chips (status / jurisdiction /
  format), responsive list (table ≥ md, cards < md), EditQuestionDrawer, publish, delete.
- `src/App.jsx` / `constants/routes.js` / `components/Layout.jsx` trimmed; `Sidebar.jsx` removed.
- `src/services/contentService.js`: add `updateQuestion`, `deleteQuestion`.
- **Exit check:** upload → search → edit/save → publish → delete, on desktop and at 375px width.

## Phase 3 — Modify with AI (per question)
- `src/services/contentService.js`: `aiEditQuestion(fields, instruction)`.
- Inline AI instruction box in the edit drawer → `/api/content/ai-edit`; revised fields land in the
  form for the admin to review before Save.
- **Exit check:** an instruction ("make it harder", "simplify") returns sensible edited fields.

## Phase 4 — Remove all other sections
- Delete pages/services/utils/backend for Scripts, QOTD, Jurisdictions (config/data/registry/
  translations), and the separate Generate/Review/Overview screens; clean `router.js` imports/cases.
- Update `docs/PROJECT_PLAN.md` + SOW to the single-dashboard model; delete/supersede `plan/`.
- **Exit check:** `npm run build` clean; only Login + dashboard remain; 2 serverless functions.

## Phase 5 — Generate from PDF ✅ (URL dropped)
- `api/generate-from-pdf.js` + `gemini.generateCardsFromPdf` realigned to the 21-col schema and
  **wired into the dashboard**: a "Generate from PDF" modal (params + PDF → LLM drafts → import as
  Draft → review/publish from the list).
- **Website-URL-as-source is out of scope** per owner: supported inputs are **Excel + PDF only**.

---

## Guardrails (unchanged)
- All secrets server-side (Vercel env); client never holds `MONGODB_URI`.
- Nothing auto-publishes — import writes `status: "Draft"`.
- Stay within Vercel Hobby's 12 serverless functions (currently 2).
- Single admin, JWT; no RBAC.
