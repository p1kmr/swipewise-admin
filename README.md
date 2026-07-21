# SwipeWise Admin

Standalone admin panel for SwipeWise — Vercel + MongoDB POC stack.

## Stack

- **Frontend:** React + Vite + Tailwind + lucide-react (PWA)
- **Hosting:** Vercel (SPA + serverless `/api`)
- **Database:** MongoDB Atlas (`swipewise_admin`)
- **Auth:** Single admin via server env (`ADMIN_EMAIL`, `ADMIN_PASSWORD`) + JWT
- **AI:** Gemini via `POST /api/generate-from-pdf` (server-side key)

## Quick start (local)

### 1. Install
```bash
npm install
```

### 2. Environment
Copy `.env.example` to `.env.local` and fill:

| Variable | Purpose |
|---|---|
| `MONGODB_URI` | Atlas connection string |
| `ADMIN_EMAIL` | Admin login email |
| `ADMIN_PASSWORD` | Admin login password |
| `GEMINI_API_KEY` | Gemini API key (for AI generation) |
| `JWT_SECRET` | JWT signing secret (optional in dev) |
| `VITE_ADMIN_EMAIL` | Optional — pre-fills login email only |

**Never commit `.env.local`.** Password and DB URI are server-side only.

### 3. Run locally

**Recommended — one command (SPA + API):**
```bash
npm run dev:full    # vercel dev — open http://localhost:3000
```

**Alternative — Vite only (UI hot reload, needs API running separately):**
```bash
# Terminal 1
vercel dev --yes    # note the port (3000 or 3001 if 3000 is busy)

# Terminal 2 — set VITE_API_PROXY in .env to match terminal 1's port
npm run dev         # http://localhost:5174
```

If you open `localhost:5174` without `vercel dev` running, login will fail with **404**.

### 4. Log in
Use the `ADMIN_EMAIL` / `ADMIN_PASSWORD` from your `.env.local`.

## Deploy (Vercel)

1. Push to GitHub and connect a Vercel project.
2. Set env vars in Vercel dashboard (same as `.env.local` server vars).
3. Deploy — Vercel builds the SPA and deploys `/api` routes automatically.

No Firebase CLI required. Free tier: Vercel Hobby + Atlas M0.

## Features (current)

- Admin login (JWT session)
- Excel upload → review → publish swipe cards
- PDF → Gemini AI generation → review → import drafts
- Light/dark theme, mobile-friendly layout, PWA install

## Docs

- [Project plan](docs/PROJECT_PLAN.md)
- [Scope of work](docs/SwipeWise_Admin_Panel_SOW.md)
- Phase plans: [plan/phase-1-foundation.md](plan/phase-1-foundation.md) … [phase-5](plan/phase-5-plug-and-play.md)

## Next phases

- Phase 4: WiseBot scripts + QOTD
- Phase 5: Jurisdiction plug-and-play + translation import
