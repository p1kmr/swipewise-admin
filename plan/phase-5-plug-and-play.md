# Phase 5 — Plug-and-Play Jurisdiction + Translation (Go Live: IN / ES / FR)

> Part of **SwipeWise Admin**. Overview: [../docs/PROJECT_PLAN.md](../docs/PROJECT_PLAN.md) · Spec §6: [../docs/SwipeWise_Admin_Panel_SOW.md](../docs/SwipeWise_Admin_Panel_SOW.md)

**Goal:** Onboard a jurisdiction with **zero code changes** (SOW §6). Prototype: India, Spain, France.
**Depends on:** Phases 1–4 (there must be content/scripts to serve a jurisdiction).
**Platform:** Vercel `/api` + MongoDB Atlas.

## Build — Config (Plug-and-Play)
- [x] `config` document shape: jurisdiction code, languages, timezone, branding, QOTD interval, `active`.
- [x] `api/config/*` routes + `services/configService.js`.
- [x] **Jurisdictions page** — config form + activate/deactivate toggle.

## Build — Jurisdiction data & registry
- [x] `jurisdiction_data` + `jurisdiction_registry` shapes.
- [x] Client-side Excel/CSV parse → `POST /api/jurisdiction-data`, `/api/jurisdiction-registry`.

## Build — Translation import
- [x] Upload Google-Sheet export → language content + coverage report.
- [x] `api/i18n/import` route.

## API operations
```
GET/POST /api/config                    # list + upsert jurisdiction config
POST /api/config/set-active             # go-live toggle (preferred over dynamic PATCH)
POST /api/jurisdiction-data             # bulk import
POST /api/jurisdiction-registry         # bulk import
GET/POST /api/i18n/import               # translation import + coverage report
```

## Collections
`config`, `jurisdiction_data`, `jurisdiction_registry`.

## Done when
- [x] Create config + upload data + set `active = true` → jurisdiction available with no deploy.
- [x] **IN, ES, FR** onboarded through the panel.
- [x] Translation import shows coverage report with per-language gaps.
