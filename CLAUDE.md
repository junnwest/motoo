# CLAUDE.md — start here

**motoo** is a Korean creator-support **mochi-marketplace**: each creator issues their own
mochi, users buy it and spend it in that creator's marketplace. (The original Trust Report
thesis is shelved for the demo; schema kept.)

**Accounts are additive:** everyone is a **user (fan)**; a **creator** is just a user who
*also owns a Studio* (a `Streamer`). No separate account type, no mode toggle — creator
status = `session.user.creator` (their Studio handle, or null). Signed-in users land on
`/explore`; creators reach their **Studio** (`/studio`) via a nav link. New users go
through `/onboarding` (nickname, unique `@handle`, 본인인증, terms), enforced by
`src/proxy.ts` (the edge middleware).

## Read these first (resume point)
- **[docs/PROGRESS.md](docs/PROGRESS.md)** — living status: what's done, in progress, next. **Start here.**
- **[docs/DECISIONS.md](docs/DECISIONS.md)** — why things are the way they are.
- **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)** — Vercel + Supabase (Seoul) runbook + state.
- [motoo-product-description.md](motoo-product-description.md) — original spec · [design-handoff/](design-handoff/) — visual system.

## Hard constraints
- **Not a financial product.** No investment/return vocabulary in user-facing copy (spec §2).
  Run `pnpm check:vocab` after touching copy. Mochi = prepaid marketplace credit:
  non-transferable, unspent-refundable, no resale/return.
- **Money logic is tested.** Run `pnpm test` (node:test via tsx, needs `pnpm db:up`)
  after touching `src/lib/mochi.ts` — it asserts the buy/redeem/cancel invariants
  and the concurrency guards (no oversell, no negative balance).
- Money is **integer KRW**, never floats.
- Korean-first, **no hardcoded strings** — all copy in `messages/*.json` (next-intl).

## Run locally
```bash
pnpm install
pnpm db:up && pnpm db:push && pnpm db:seed   # Postgres via docker (host port 5433)
pnpm dev                                       # http://localhost:3000
```
Dev logins: fan `demo@motoo.dev` / `motoo`; **creator `creator@motoo.dev` / `motoo`**
(a user who owns `@creatorA`). Both land on `/explore`; the creator gets a **스튜디오** nav
link. In dev, `src/lib/session.ts` falls back to the demo fan (`getCurrentBacker`) and demo
creator (`getCurrentCreator`) when nobody's signed in. New signups are forced through
`/onboarding` before the app; existing/seeded accounts are grandfathered.

`pnpm test` (money logic), `pnpm check:vocab` (banned copy), `pnpm lint`.
Google/Naver OAuth are live in dev (`.env`, gitignored); Kakao + real 본인인증 + real PG all
need a business registration (`사업자등록`) — mocks stand in until then.

## Deploy
Vercel (region `icn1`) + Supabase Pro Postgres (Seoul, project `nrfhwhefabahsfzuyxqu`).
Secrets (DB password, `AUTH_SECRET`, connection strings) are **not in the repo** — they
live in `.env` (gitignored) and Vercel env vars. See docs/DEPLOYMENT.md for the current
blockers and the env-var list.

## Stack
Next.js 16 (App Router) · TypeScript · Tailwind v4 · Prisma 6 + Postgres · next-intl ·
Auth.js v5 (credentials + Google/Naver live, Kakao scaffold; edge `auth.config.ts` +
Node `auth.ts` split, `src/proxy.ts` middleware) · `PaymentProvider` + `VerificationProvider`
abstractions (both `mock` in dev, swap via `PAYMENT_PROVIDER` / `VERIFICATION_PROVIDER`).
