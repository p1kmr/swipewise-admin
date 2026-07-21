# Phase 1 — Foundation, Auth & Vercel Wiring

> Part of **SwipeWise Admin**. Overview & locked stack/rules: [../docs/PROJECT_PLAN.md](../docs/PROJECT_PLAN.md) · Spec: [../docs/SwipeWise_Admin_Panel_SOW.md](../docs/SwipeWise_Admin_Panel_SOW.md)

**Goal:** A deployed admin shell you can log into, backed by **Vercel + MongoDB Atlas**.
**Depends on:** nothing (start here).
**Platform:** Vercel (SPA + `/api`) · MongoDB Atlas · env-based admin auth.

## Build

### Project & design foundation
- [x] Scaffold Vite + React.
- [x] **Tailwind** — design-system colours, `darkMode: "class"`, lucide-react (no emojis).
- [x] Folders: `constants/`, `utils/`, `context/`, `hooks/`, `services/`, `components/`, `pages/`, `assets/`.
- [x] Logo in `src/assets/`; PWA icons in `public/`.

### Vercel + MongoDB wiring
- [x] `api/_lib/mongodb.js` — cached Atlas connection.
- [x] `api/_lib/auth.js` — JWT sign/verify, `requireAuth`, env credential check.
- [x] `api/auth/login.js` — `POST` login against `ADMIN_EMAIL` / `ADMIN_PASSWORD`.
- [x] `api/auth/me.js` — `GET` session validation.
- [x] `vercel.json` — SPA rewrites + build config.
- [x] `.env.example` — `MONGODB_URI`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `GEMINI_API_KEY`, optional `VITE_ADMIN_EMAIL`.

### State — Context + `useReducer`
- [x] `context/ThemeContext.jsx` — light/dark, persisted.
- [x] `context/AuthContext.jsx` — `/api/auth/login` + token in `sessionStorage`.
- [x] `services/apiClient.js` — fetch wrapper with auth header.

### Auth, shell & deploy
- [x] Login page — email/password → JWT.
- [x] App shell: sidebar + top bar; React Router + protected routes.
- [x] **Deploy:** push to GitHub → Vercel project → set env vars → deploy.

## Rules
- Secrets live in Vercel env / `.env.local` only — never `VITE_` except login email pre-fill.
- Local dev: **`vercel dev`** so `/api` routes work.

## Done when
- [x] App deploys to Vercel.
- [x] Admin login works via `/api/auth/login`.
- [x] Light/dark toggle persists; logo on login + sidebar.
