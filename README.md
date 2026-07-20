# motoo

A two-sided Korean creator-support platform. **Current direction: a mochi-marketplace** —
each creator issues their own **mochi** (prepaid marketplace credit, minted on purchase),
users buy it and spend it in that creator's marketplace. Price ratchets up in tiers
(early supporters get in cheaper); mochi is never a security. See
[`motoo-product-description.md`](./motoo-product-description.md) for the original product
spec and [`design-handoff/`](./design-handoff/) for the visual system.

> **motoo is not a financial product.** Mochi is prepaid support credit, not an
> investment — non-transferable, unspent-refundable, no resale/return, no securities. See
> §2 of the product doc. A CI-style check (`pnpm check:vocab`) guards against banned
> investment vocabulary in user-facing copy.

## 📍 Where things stand

- **[docs/PROGRESS.md](./docs/PROGRESS.md)** — living status tracker (what's done, in progress, next)
- **[docs/DECISIONS.md](./docs/DECISIONS.md)** — decision log with rationale
- **[docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md)** — deploy runbook + infra state (Vercel + Supabase Seoul)

**Live at [themotoo.com](https://themotoo.com)** (Vercel + Supabase Seoul; auto-deploys on push to `main`).

**Current direction:** the **mochi-marketplace** is built and deployed — creators
issue their own mochi, users buy it and spend it in each creator's marketplace. Accounts
are **additive**: everyone is a user (fan); a **creator** is a user who *also* owns a
**Studio**. The original **Streamer Trust Report** thesis is shelved; its schema/components
stay in the tree, dormant.

## What's built

| Route | Page |
| --- | --- |
| `/` | Marketing landing (logged-out only; signed-in users are routed to `/explore`) |
| `/explore` | Creators grid — the consumer home (still the Phase-1 trust ranking; to be reworked) |
| `/s/[handle]` | Creator profile: **buy mochi** module + **marketplace** (spend mochi on items) |
| `/me/mochi` | "My mochi": per-creator holdings + order/redemption history |
| `/login` · `/signup` | Real auth — split-layout, social-first (Kakao/Naver/Google) + email; password policy + confirm |
| `/onboarding` | New-user gate: nickname, unique `@handle`, **본인인증** (age/identity), terms |
| `/studio` | The **Studio** (creator console): single-view dashboard (no sidebar) — overview + mochi issuance (ratcheting tiers) + orders + market items, with per-section ⓘ help |
| `/studio/settings` | Creator-profile settings — display name, bio, type→category, platform links (handle read-only) |
| `/creators` → `/api/become-creator` | Creator pitch → become-a-creator (add-on to a user account) |

**Account model:** a creator is a `Backer` (the account/user table) that owns a `Streamer`
via `Streamer.ownerId`. Creator status = `session.user.creator` (Studio handle or null).
Signed-in users land on `/explore`; creators get a **스튜디오** nav link. Onboarding is
redirect-enforced by `src/proxy.ts`.

Not built (all need a `사업자등록` + paid contract): real PG (Toss/NICE/PortOne),
real 본인인증 (NICE/PASS/간편인증), Kakao login. Mocks stand in behind provider abstractions.

## Stack

- **Next.js 16** (App Router) · TypeScript · **Tailwind v4** (design tokens in [`src/app/globals.css`](./src/app/globals.css))
- **Postgres + Prisma 6** — money is integer KRW, never floats
- **next-intl** — `ko` default, `en` scaffold, no hardcoded strings ([`messages/`](./messages/))
- **Auth.js v5** — credentials + **Google/Naver live** (Kakao scaffold); edge `auth.config.ts` + Node `auth.ts` split; `src/proxy.ts` middleware enforces onboarding
- **Provider abstractions** — `PaymentProvider` (mochi charges) and `VerificationProvider` (본인인증), both `mock` in dev, swapped via `PAYMENT_PROVIDER` / `VERIFICATION_PROVIDER`

## Key invariants (enforced + tested)

- **Mochi is money**: `src/lib/mochi.ts` uses row-locked conditional updates so concurrent
  redemptions can't oversell stock or drive a holding negative. `pnpm test` proves it
  (buy/redeem/cancel invariants + concurrency guards).
- **Not a financial product**: no investment vocabulary in copy (`pnpm check:vocab`).
- Dormant Phase-1 invariants (founding number, grades) remain in the schema, unused.

## Getting started

Prereqs: Node 20+, pnpm, Docker (for Postgres).

```bash
pnpm install
cp .env.example .env        # dev defaults work as-is (OAuth optional — see .env.example)
pnpm db:up                  # start Postgres (docker compose, host port 5433)
pnpm db:push                # create schema
pnpm db:seed                # sample creators, mochi issuance, items, holdings, orders
pnpm dev                    # http://localhost:3000
pnpm test                   # money-logic integration tests (needs db:up)
```

Dev logins: fan `demo@motoo.dev` / `motoo`; creator `creator@motoo.dev` / `motoo` (a user
who owns `@creatorA`). Both land on `/explore`. In dev, `src/lib/session.ts` falls back to
the demo fan/creator when nobody's signed in.

## Scripts

| Command | What it does |
| --- | --- |
| `pnpm dev` / `pnpm build` / `pnpm start` | Next.js dev / build / production |
| `pnpm db:up` / `pnpm db:down` | Start / stop Postgres |
| `pnpm db:push` / `pnpm db:seed` / `pnpm db:studio` | Schema push / seed / Prisma Studio |
| `pnpm test` | Money-logic integration tests (node:test via tsx; needs `db:up`) |
| `pnpm check:vocab` | Banned-vocabulary check on message catalogs (spec §2) |
| `pnpm lint` | ESLint |
