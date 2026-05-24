<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# EcoSítio v3 — Sítio Micrantha

Farm management system in **Portuguese (pt-BR)**. All UI, schema, and messages are in Portuguese.

## Stack

- **Next.js 16.2.6** (App Router, Turbopack), React 19.2.4, TypeScript 5, Tailwind CSS v4
- **shadcn/ui** (style `base-nova`): CSS via `@import "tailwindcss"` + `@import "shadcn/tailwind.css"` in `src/app/globals.css`
- **Drizzle ORM** + **Neon (serverless PostgreSQL)**: schema in `src/db/schema.ts` (835 lines), connection in `src/db/index.ts`
- **Auth.js (NextAuth v5 beta)**: Credentials provider, single admin via `process.env.ADMIN_EMAIL` / `ADMIN_PASSWORD`
- Form: **react-hook-form** + **zod** via `@hookform/resolvers`
- Charts: **recharts** | Notifications: **sonner** | Icons: **lucide-react** | Theme: **next-themes**
- Path alias: `@/` → `./src/`

## Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Dev server (no DB env needed until you hit a page) |
| `npm run build` | Production build — **requires `.env.local` with real `DATABASE_URL`** |
| `npm run lint` | ESLint (Next.js core-web-vitals + TS) |
| `npm run db:generate` | Generate Drizzle migration after schema changes |
| `npm run db:migrate` | Apply pending migrations |
| `npm run db:push` | Push schema directly (dev only, no migration file) |
| `npm run db:studio` | Open Drizzle Studio UI |

No tests exist in this repo.

## Build requirement

`npm run build` **requires a live database** because several server components eagerly import and query the DB at build time (`/p/lote/[token]` and all dashboard pages under `/(dashboard)`). Without `.env.local` containing a valid `DATABASE_URL`, the build fails.

For dev (`npm run dev`), page-level errors appear only when you navigate to a page that queries the DB.

## Next.js 16 deprecations

- **`src/middleware.ts`** is deprecated — Next.js 16 wants `src/proxy.ts` instead. The current `middleware.ts` works but emits a build warning.

## Auth & routing

- `src/middleware.ts` (soon `proxy.ts`) protects all routes except `/api`, `/_next/*`, `/favicon.ico`, `/login`
- Login at `/login` with `ADMIN_EMAIL` / `ADMIN_PASSWORD` from env
- After schema/seed changes, call `router.refresh()` or reload to pick up new module data
- Public page: `/p/lote/[token]` — batch traceability with QR code

## DB & migrations

- Config in `drizzle.config.ts` — reads `DATABASE_URL` from `.env.local` (via `dotenv`)
- Migrations in `drizzle/` directory (numbered SQL files + JSON snapshots)
- Workflow: edit `src/db/schema.ts` → `npm run db:generate` → `npm run db:migrate`
- Seed: "Seed Database" button in dashboard footer (calls `src/actions/seed.ts` — deletes all data and recreates)
- Clear: "Zerar DB" button (same location — deletes everything including system_modules)

## Architecture

- **Server Actions** in `src/actions/` (21 files) — all use `"use server"`, return `ActionResult<T>` = `{success: true, data: T}` | `{success: false, error: string}`
- Dashboard layout (`src/app/(dashboard)/layout.tsx`) calls `ensureDefaultModules()` on every render to auto-create module entries
- Sidebar (`dashboard-sidebar.tsx`) reads active modules from DB; disabled modules are greyed out with "Em breve" label
- Module schema: `id` (string key), `name`, `description`, `isActive` — seeded defaults: `vegetal`, `avicultura` (active), `criatorio`, `prv` (inactive)
- Adding a new module requires: DB row in `system_modules` + sidebar accordion in `dashboard-sidebar.tsx` + routes under `(dashboard)`
- Components: reusable UI in `src/components/ui/` (shadcn), domain components in `src/components/{crm,finance,campo,avicultura}/`
- Dashboard route group `(dashboard)` requires auth; single-page route `/login` is public
