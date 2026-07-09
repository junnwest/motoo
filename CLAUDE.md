# CLAUDE.md — start here

**motoo** is a two-sided Korean creator-support platform. **Current direction: a pivot
to a mochi-marketplace** — creators issue their own mochi, users buy it and spend it in
each creator's marketplace. (The original Trust Report thesis is shelved for the demo;
schema kept.)

## Read these first (resume point)
- **[docs/PROGRESS.md](docs/PROGRESS.md)** — living status: what's done, in progress, next. **Start here.**
- **[docs/DECISIONS.md](docs/DECISIONS.md)** — why things are the way they are.
- **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)** — Vercel + Supabase (Seoul) runbook + state.
- [motoo-product-description.md](motoo-product-description.md) — original spec · [design-handoff/](design-handoff/) — visual system.

## Hard constraints
- **Not a financial product.** No investment/return vocabulary in user-facing copy (spec §2).
  Run `pnpm check:vocab` after touching copy. Mochi = prepaid marketplace credit:
  non-transferable, unspent-refundable, no resale/return.
- Money is **integer KRW**, never floats.
- Korean-first, **no hardcoded strings** — all copy in `messages/*.json` (next-intl).

## Run locally
```bash
pnpm install
pnpm db:up && pnpm db:push && pnpm db:seed   # Postgres via docker (host port 5433)
pnpm dev                                       # http://localhost:3000
```
Dev login: `demo@motoo.dev` / `motoo`. In dev, the backing flow falls back to this demo
backer when nobody's signed in (`src/lib/session.ts`).

## Deploy
Vercel (region `icn1`) + Supabase Pro Postgres (Seoul, project `nrfhwhefabahsfzuyxqu`).
Secrets (DB password, `AUTH_SECRET`, connection strings) are **not in the repo** — they
live in `.env` (gitignored) and Vercel env vars. See docs/DEPLOYMENT.md for the current
blockers and the env-var list.

## Stack
Next.js 16 (App Router) · TypeScript · Tailwind v4 · Prisma 6 + Postgres · next-intl ·
Auth.js v5 (credentials + Naver/Kakao/Google scaffold) · `PaymentProvider` abstraction (mock).
