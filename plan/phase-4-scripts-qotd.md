# Phase 4 — WiseBot Scripts + Question of the Day

> Part of **SwipeWise Admin**. Overview: [../docs/PROJECT_PLAN.md](../docs/PROJECT_PLAN.md) · Spec §4.2/§4.8: [../docs/SwipeWise_Admin_Panel_SOW.md](../docs/SwipeWise_Admin_Panel_SOW.md)

**Goal:** Cover the two remaining content types — scripted dialogues and daily questions.
**Depends on:** Phase 2 (same review/publish pattern).
**Platform:** Vercel `/api` + MongoDB Atlas.

## Build — WiseBot Scripts
- [ ] `scripts` document shape: `jurisdiction`, `language_code`, `approval.{published}`, `nodes[]`.
- [ ] `utils/scriptTemplate.js` — downloadable template.
- [ ] `utils/validateScriptGraph.js` — validate node graph client-side.
- [ ] `api/scripts/*` routes + `services/scriptService.js`.
- [ ] **Scripts page** — upload, validation, review, publish.

## Build — Question of the Day
- [ ] `qotd` document shape per schema.
- [ ] `utils/qotdTemplate.js` + client-side Excel parse.
- [ ] `api/qotd/*` routes + `services/qotdService.js`.
- [ ] **QOTD page** — upload, review, publish.

## API pattern (same as content)
```
GET/POST /api/scripts       # list + import
PATCH /api/scripts/:id      # publish
GET/POST /api/qotd          # list + import
PATCH /api/qotd/:id         # publish
```

## Collections
`scripts`, `qotd` — authenticated `/api/*` routes.

## Done when
- [ ] Script upload validates graph; published scripts per-language.
- [ ] QOTD questions upload, review, and publish like swipe cards.
