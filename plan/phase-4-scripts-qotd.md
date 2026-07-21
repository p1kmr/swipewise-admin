# Phase 4 — WiseBot Scripts + Question of the Day

> Part of **SwipeWise Admin**. Overview: [../docs/PROJECT_PLAN.md](../docs/PROJECT_PLAN.md) · Spec §4.2/§4.8: [../docs/SwipeWise_Admin_Panel_SOW.md](../docs/SwipeWise_Admin_Panel_SOW.md)

**Goal:** Cover the two remaining content types — scripted dialogues and daily questions.
**Depends on:** Phase 2 (same review/publish pattern).
**Platform:** Vercel `/api` + MongoDB Atlas.

## Build — WiseBot Scripts
- [x] `scripts` document shape: `jurisdiction`, `language_code`, `approval.{published}`, `nodes[]`.
- [x] `utils/scriptTemplate.js` — downloadable template.
- [x] `utils/validateScriptGraph.js` — validate node graph client-side.
- [x] `api/scripts/*` routes + `services/scriptService.js`.
- [x] **Scripts page** — upload, validation, review, publish.

## Build — Question of the Day
- [x] `qotd` document shape per schema.
- [x] `utils/qotdTemplate.js` + client-side Excel parse.
- [x] `api/qotd/*` routes + `services/qotdService.js`.
- [x] **QOTD page** — upload, review, publish.

## API pattern (same as content)
```
GET/POST /api/scripts       # list + import
POST /api/scripts/publish-batch  # publish (single or batch)
GET/POST /api/qotd          # list + import
POST /api/qotd/publish-batch     # publish (single or batch)
```

## Collections
`scripts`, `qotd` — authenticated `/api/*` routes.

## Done when
- [x] Script upload validates graph; published scripts per-language.
- [x] QOTD questions upload, review, and publish like swipe cards.
