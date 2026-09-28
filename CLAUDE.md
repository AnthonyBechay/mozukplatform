# Mozuk Platform

Internal tool for organizing the work of **one person**: clients, projects, project documents and payments.
Live at https://platform.mozuk.net. Keep everything simple — no roles, no signup, no multi-user features.

## Tech Stack
- **Monorepo**: pnpm workspaces (`backend/`, `frontend/`)
- **Backend**: Express 4 + TypeScript + Prisma 6 + PostgreSQL 16
- **Frontend**: React 19 + Vite 6 + React Router 7 + lucide-react, vanilla CSS (`frontend/src/index.css`)
- **Uploads**: multer, stored in `backend/uploads` (Docker volume `backend_data` in prod)

## Structure
```
backend/
  src/index.ts            Express app, mounts /api/* routes, serves frontend build from /app/public
  src/lib/prisma.ts       Shared Prisma client (with reconnect-and-retry on lost DB connections)
  src/middleware/auth.ts  JWT Bearer check → req.userId
  src/routes/             auth, clients, projects, documents, payments, paymentCategories
  prisma/schema.prisma    User, Client, Project, Document, Payment, PaymentCategory (+ enums)
  prisma/migrations/      Applied in prod with `prisma migrate deploy`
  prisma/seed.ts          Creates admin@mozuk.net / admin123 (dev only — not run in prod)
frontend/
  src/App.tsx             Token in localStorage → shows Login or the app routes
  src/lib/api.ts          All API calls; one `request()` helper
  src/pages/              Login, Dashboard, Clients, ClientDetail, Projects, ProjectDetail, Documents, Payments
  src/components/         Layout (sidebar), Modal, ConfirmDialog
```

## Auth (keep it this simple)
- Single user row. `POST /api/auth/login` (email + password, bcrypt) → JWT signed with `JWT_SECRET`, **30-day** expiry.
- Email is trimmed + lowercased on login.
- Frontend stores the token in `localStorage` and sends `Authorization: Bearer <token>`.
- Any 401 from an API call clears the token and redirects to `/login` — **except** `/auth/login` itself,
  where the error is shown on the form (a redirect there reloaded the page and hid "wrong password").
- No signup, no password reset flow. Password changes are done directly in the DB (bcrypt hash).

## Database connection gotcha
Idle pooled connections get dropped overnight, so the first morning login used to fail and need several
attempts. `src/lib/prisma.ts` wraps every query: on a connection error (P1001/P1002/P1008/P1017/P2024,
"closed the connection", …) it reconnects and retries once. `connectWithRetry()` also warms up the DB at boot.
Always import `prisma` from `src/lib/prisma` — never create another `PrismaClient`.

## Development
```bash
docker compose -f docker-compose.dev.yml up -d   # Postgres on 5432 (mozuk / mozuk_secret / mozukplatform)
pnpm dev:backend                                  # :3001
pnpm dev:frontend                                 # :5173, proxies /api and /uploads to :3001
pnpm db:seed                                      # admin@mozuk.net / admin123
```
`backend/.env`: `DATABASE_URL=postgresql://mozuk:mozuk_secret@localhost:5432/mozukplatform`, `JWT_SECRET=...`

## Deployment (Coolify)
- `docker-compose.yml`, single container built from `backend/Dockerfile` (builds backend + frontend,
  frontend served as static files by Express). External `coolify` network.
- Env vars: `DATABASE_URL`, `JWT_SECRET` only. Don't add new env vars unless really needed.
- Start command: `prisma migrate resolve --applied 0_init` → `prisma migrate deploy` → `node dist/index.js`.
- Healthcheck hits `/api/health` (runs `SELECT 1`).
- Dockerfile uses `npm install`, not pnpm (pnpm symlinks break in Docker COPY).

## Rules
- **Never edit existing migrations** — create new ones with `npx prisma migrate dev --name <name>`.
- Frontend build is `vite build` (no typecheck). `tsc --noEmit` in frontend has pre-existing errors; don't
  treat them as caused by your change.
- Don't test in the preview/browser unless asked.
- Don't commit or push unless asked.
