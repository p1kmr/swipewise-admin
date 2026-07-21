# Phase 3 — AI Generation (PDF → Gemini → Review → Import)

> Part of **SwipeWise Admin**. Overview: [../docs/PROJECT_PLAN.md](../docs/PROJECT_PLAN.md) · Spec §12.1: [../docs/SwipeWise_Admin_Panel_SOW.md](../docs/SwipeWise_Admin_Panel_SOW.md)

**Goal:** Admin uploads a source PDF; Gemini drafts swipe cards; admin reviews and imports.
**Depends on:** Phase 2 (content import + review flow).
**Platform:** Vercel `/api/generate-from-pdf` + `/api/generation/lineage`.

## Architecture

```
Browser → POST /api/generate-from-pdf   { pdfBase64, params } → draft cards
Browser → POST /api/generation/lineage  metadata + counts → raw_data + generation_logs
Browser → POST /api/content             import reviewed rows (unpublished)
```

- Gemini key lives in `GEMINI_API_KEY` (Vercel env only).
- PDF sent inline as base64 — **~4 MB POC limit** (no blob storage).
- Nothing auto-publishes.

## Build
- [x] `api/_lib/gemini.js` — prompt, schema, `generateCardsFromPdf`.
- [x] `api/generate-from-pdf.js` — auth + size guard + Gemini call.
- [x] `api/generation/lineage.js` — write `raw_data` + `generation_logs`.
- [x] `services/generationService.js` — base64 PDF + API calls.
- [x] **Generate page** — params form, PDF picker, draft review grid, import.

## Collections
- `raw_data` — metadata only in POC (fileName, size, params, adminEmail, created_at).
- `generation_logs` — model, params, counts, rawDataId, adminEmail, created_at.

## Rules
- **No Blaze:** Gemini runs on Vercel serverless; MongoDB on Atlas free tier.
- Human review required before import.

## Done when
- [x] Upload PDF → Gemini returns drafts → edit in grid → import as unpublished.
- [x] Each run writes `raw_data` + `generation_logs` lineage.
