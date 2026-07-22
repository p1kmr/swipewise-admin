# SwipeWise Admin — Implementation Audit

**Question asked:** Does the code implement what the admin panel actually needs (per `SwipeWise.txt` + `SwipeWise_Admin_Panel_SOW.md`), and did any over-engineered or unnecessary "dashboard" code sneak in?

**Verdict:** The build is **well-scoped**. Every required admin capability is present in both API and frontend, and the code does **not** leak in user-app features (leaderboard, events, scorecards, awareness index, etc.). Two minor conveniences were added that aren't named in the SOW, but neither is real bloat. Details below.

**Audit date:** 2026-07-22
**Sources compared:** `docs/SwipeWise.txt` (master SOW) · `docs/SwipeWise_Admin_Panel_SOW.md` (admin SOW) · `docs/PROJECT_PLAN.md` · code under `api/` and `src/`.

---

## 1. What the admin actually needs

From `SwipeWise.txt` §5 (the only section that describes admin) plus the admin-scoped rules it references:

| # | Requirement (master SOW) | Source |
|---|--------------------------|--------|
| R1 | Excel template download + upload of swipe cards | §5 Path 1 |
| R2 | LLM path — attach PDF, LLM populates question template | §5 Path 2 |
| R3 | Admin reviews questions, then publishes to SwipeWise | §5, §3.2 |
| R4 | WiseBot scripts as content (node-based dialogue) | §4.2 |
| R5 | Question of the Day via Excel (question, answer, explanation, jurisdiction, difficulty…) | §4.8 |
| R6 | Plug-and-play jurisdiction config (no code changes to onboard) | §1.3, §6.2 |
| R7 | Jurisdiction data upload (scam cases, enforcement, rules, alerts) | §6.2 Step 2 |
| R8 | Registered intermediaries / registry data | §3.1, §1.3 |
| R9 | Translation import via sheet template | §6.2 Step 3, §6.3 |
| R10 | Content/scripts served only when `approval.published == true` | §3.2 |
| R11 | Support prototype jurisdictions IN / ES / FR | §1.4 |
| R12 | Generation lineage / audit trail (`raw_data`, `generation_logs`) | §3.1 |

---

## 2. Requirement → code coverage

| Req | API route (`api/_lib/router.js`) | Frontend | Status |
|-----|----------------------------------|----------|--------|
| R1 Excel cards | `GET/POST /api/content`, `POST /api/content/publish-batch` | `UploadPage.jsx`, `utils/parseCards.js`, `utils/excelTemplate.js` | ✅ |
| R2 PDF→LLM | `POST /api/generate-from-pdf` (`_lib/gemini.js`, `gemini-2.5-flash`) | `GeneratePage.jsx` | ✅ |
| R3 Review + publish | `publish-batch` routes + `approval.published` gate | `ReviewPage.jsx` (Cards/Scripts/QOTD tabs) | ✅ |
| R4 Scripts | `GET/POST /api/scripts`, `/api/scripts/publish-batch` | `ScriptsPage.jsx`, `utils/validateScriptGraph.js` | ✅ |
| R5 QOTD | `GET/POST /api/qotd`, `/api/qotd/publish-batch` | `QotdPage.jsx`, `utils/parseQotd.js` | ✅ |
| R6 Config / go-live | `GET/POST /api/config`, `POST /api/config/set-active` | `JurisdictionsPage.jsx` → Config tab | ✅ |
| R7 Jurisdiction data | `GET/POST /api/jurisdiction-data` | Jurisdictions → Data tab | ✅ |
| R8 Registry | `GET/POST /api/jurisdiction-registry` | Jurisdictions → Registry tab | ✅ |
| R9 Translations | `GET/POST /api/i18n/import` (+ coverage report) | Jurisdictions → Translations tab | ✅ |
| R10 Publish gate | Import sets `approval.published = false`; publish flips it | `ReviewPage.jsx` | ✅ |
| R11 IN/ES/FR | `POST /api/config` `{ seed: "prototype" }` → `PROTOTYPE_CONFIGS` | "Seed IN / ES / FR" button | ✅ |
| R12 Lineage | `POST /api/generation/lineage` → `raw_data` + `generation_logs` | called from `GeneratePage.jsx` | ✅ |

**Coverage: 12/12.** Nothing required is missing. Auth (single admin via `ADMIN_EMAIL`/`ADMIN_PASSWORD` + JWT) is present as the SOW's own addition, not a master-SOW requirement.

---

## 3. Over-engineering / scope-leak check

The real risk was **user-app features bleeding into the admin**. `SwipeWise.txt` §1.2 explicitly lists leaderboard, scorecards, personalisation engine, and regulator dashboard as user-facing — **out of admin scope**. I grepped the whole codebase for them:

| User-app feature (out of admin scope) | Found in admin code? |
|---------------------------------------|----------------------|
| `leaderboards` collection / ranking jobs | ❌ none |
| `events` / `sessions` analytics | ❌ none |
| `scorecards` / image generation | ❌ none |
| `scam_reports` / `urgent_alerts` | ❌ none |
| Awareness Index scoring / skill radar | ❌ none |
| Regulator **dashboard** (pre-calculated metrics) | ❌ none |
| Session engine / 70-20-10 personalisation | ❌ none |
| Firebase / Firestore / GridFS / bcrypt user store | ❌ none (only named in docs as *excluded*) |

- Only **8 collections** are touched (`content`, `scripts`, `qotd`, `config`, `jurisdiction_data`, `jurisdiction_registry`, `raw_data`, `generation_logs`) — exactly the plan's §13 list. The master SOW's other 7 collections (users, sessions, events, leaderboards, scam_reports, urgent_alerts, scorecards, dashboard) are correctly **absent**.
- `package.json` is lean: no chart library, no state-management library, no animation/testing libs — just React, Vite, Tailwind, lucide-react, `xlsx`, `mongodb`, `jsonwebtoken`, `@google/generative-ai`.
- No RBAC, no multi-admin, no blob storage — all correctly deferred per `PROJECT_PLAN.md` §10.

**No over-engineering found in the backend or in the data model.**

---

## 4. Two additions not named in the SOW (minor — your call)

These aren't in either requirements doc. Neither adds a dependency, a collection, or backend complexity. Flagging only because you asked.

| Item | File | Size | Assessment |
|------|------|------|------------|
| **Dashboard / Overview page** | `src/pages/DashboardPage.jsx` | 125 lines | **Not** the regulator "dashboard" from the master SOW (that's pre-calculated user metrics, out of scope). This is just a landing screen showing **draft counts** (`listContent/Scripts/Qotd`) + quick links. No charts, no aggregation, no analytics. Harmless. Rename to "Overview" if the word "dashboard" is causing confusion with the out-of-scope feature. |
| **Light/Dark theme toggle** | `src/context/ThemeContext.jsx` | ~60 lines | UI nicety, localStorage only, zero deps. Standard admin-shell polish. |

Nothing else qualifies as extra. `JurisdictionsPage.jsx` is large (739 lines) but it's a single screen tabbing over Config + Data + Registry + Translations — i.e. plan Modules E & F consolidated into one page rather than four. That's consolidation, not bloat.

---

## 5. Recommendation

- **Keep everything as is.** The implementation matches the admin SOW closely and stays out of user-app territory.
- **Optional cosmetic:** rename the "Dashboard" nav item/route to "Overview" so it can't be mistaken for the out-of-scope regulator dashboard. If even the draft-count landing page is unwanted, it can be deleted and `/` pointed at Review — but it costs nothing to keep.
- No code needs to be removed for over-engineering reasons.
