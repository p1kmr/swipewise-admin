# Phase 2 — Swipe Cards: Excel Upload → Review → Publish

> Part of **SwipeWise Admin**. Overview: [../docs/PROJECT_PLAN.md](../docs/PROJECT_PLAN.md) · Spec §4.1/§5: [../docs/SwipeWise_Admin_Panel_SOW.md](../docs/SwipeWise_Admin_Panel_SOW.md)

**Goal:** The core content loop — admin gets swipe cards into MongoDB and live to the user app.
**Depends on:** Phase 1 (Vercel auth + MongoDB wiring).
**Platform:** Vercel `/api/content` + MongoDB Atlas.

## Build
- [x] Define the `content` document shape per `swipewise_schema.json`.
- [x] `utils/excelTemplate.js` — generate + download the Excel template (SheetJS).
- [x] `utils/parseCards.js` — SheetJS parses `.xlsx` in browser → validate → `{ valid[], skipped[] }`.
- [x] `services/contentService.js` — `POST /api/content`, `GET /api/content`, publish single/batch.
- [x] **Upload page** — download template, xlsx dropzone, validation report.
- [x] **Review page** — table of cards, publish per-row / batch.

## API operations
```
GET  /api/content                 # list (newest first)
POST /api/content                 # import batch (approval.published=false)
PATCH /api/content/:id            # publish single
POST /api/content/publish-batch   # publish many
```

## Collections
`content` — all access via authenticated `/api/content` routes.

## Done when
- [x] Upload a filled template → valid rows appear in Review; bad rows show row # + reason.
- [x] Publish flips `approval.published`; future user app reads only published cards.
