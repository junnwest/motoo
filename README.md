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

**Live at [themotoo.com](https://themotoo.com)** (consumer app) + **[studio.themotoo.com](https://studio.themotoo.com)** (creator console) — same Vercel project + codebase, host-split in `src/proxy.ts` with a session cookie shared across `.themotoo.com`. Supabase Seoul; auto-deploys on push to `main`.

**Current direction:** the **mochi-marketplace** is built and deployed — creators
issue their own mochi, users buy it and spend it in each creator's marketplace. Accounts
are **additive**: everyone is a user (fan); a **creator** is a user who *also* owns a
**Studio**. The original **Streamer Trust Report** thesis is shelved; its schema/components
stay in the tree, dormant.

## What's built

| Route | Page |
| --- | --- |
| `/` | Marketing landing (logged-out only; signed-in users are routed to `/home`) |
| `/home` | **The app home.** Two columns: mochi status (balance + rank per creator) → items you can afford right now → in-flight orders → news, beside a suggestion column (larger single-column blocks). Adaptive — holds no mochi yet → a how-it-works primer instead of the status column. The following list lives in the persistent Sidebar, not here |
| `/ranking` | Your rank among each held creator's supporters, by lifetime mochi purchased |
| `/notifications` | Full notification history (order fulfilled/cancelled, a supported creator adds an item or raises their price) — mark-all-read. A bell icon in the nav shows the unread count |
| `/profile` | Identity + mochi holdings + order history (absorbs the old `/me/mochi`, which now redirects here) |
| `/settings` | Nickname/handle + password change (apex-only; distinct from the Studio host's own `/settings`) |
| `/explore` | Creators grid — the dedicated browse page (filters, search, sort) |
| `/s/[handle]` | Creator profile: **buy mochi** module + **marketplace** (spend mochi on items) |
| `/me/mochi` | "My mochi": per-creator holdings + order/redemption history |
| `/login` · `/signup` | Real auth — social-first (Kakao/Naver/Google) + email; password policy + confirm. One **회원가입** button opens a 후원자/크리에이터 role modal (login stays unified) |
| `/onboarding` | New-user gate: nickname, unique `@handle`, **본인인증** (age/identity), terms |
| `studio.themotoo.com/` | The **Studio** (creator console, own subdomain): single-view dashboard (no sidebar) — overview + mochi issuance (ratcheting tiers) + orders + market items, with per-section ⓘ help. Internally the `/studio` route group; apex `/studio` 308s here. |
| `studio.themotoo.com/settings` | Creator-profile settings — display name, bio, type→category, platform links (handle read-only) |
| `/creators` → `/api/become-creator` | Creator pitch → become-a-creator (add-on to a user account) |

**Account model:** a creator is a `Backer` (the account/user table) that owns a `Streamer`
via `Streamer.ownerId`. Creator status = `session.user.creator` (Studio handle or null).
Signed-in users land on `/home`; a persistent **Studio pill** in the nav (always visible)
routes a creator straight to the console or a fan into the become-a-creator flow. Every
signed-in consumer page also gets a **persistent left Sidebar** (`ConsumerShell`) — 홈/
둘러보기 + the following list — that survives navigation rather than being page-local.
Onboarding is redirect-enforced by `src/proxy.ts`.

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
- **No emoji in the UI**: every user-visible glyph is a line icon from
  `src/components/ui/Icons.tsx` (`pnpm check:emoji` fails the build on any pictograph in
  `src/**` or `messages/*.json`). Emoji render in the OS emoji font, so they shift per
  platform and can't take brand color.
- Dormant Phase-1 invariants (founding number, grades) remain in the schema, unused.
- **Notifications are best-effort, never money-adjacent**: `src/lib/notify.ts` is called
  from server actions after their triggering mutation commits, not from inside
  `mochi.ts`'s transactions, and swallows its own errors — a failed insert can never
  roll back or fail the order/item/price action that triggered it.

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

Dev logins: fan `demo@motoo.dev` / `motoo` (holds mochi in 4 creators, so `/home` renders
its populated state); creator `creator@motoo.dev` / `motoo` (a user who owns `@creatorA`).
Both land on `/home`. For the zero-holdings home, use any `fan9@motoo.dev`-style pool
account. In dev, `src/lib/session.ts` falls back to the demo fan/creator when nobody's
signed in.

> `pnpm db:seed` starts with `deleteMany()` — it wipes **all** accounts, including any you
> signed up with locally. Re-seed knowingly. If you want a personal account that survives
> reseeds, add it to `prisma/seed.ts` next to `demo`/`creatorAccount` — see how
> `orangeandmustard@gmail.com` (Kenneth's) is seeded.

## Scripts

| Command | What it does |
| --- | --- |
| `pnpm dev` / `pnpm build` / `pnpm start` | Next.js dev / build / production |
| `pnpm db:up` / `pnpm db:down` | Start / stop Postgres |
| `pnpm db:push` / `pnpm db:seed` / `pnpm db:studio` | Schema push / seed / Prisma Studio |
| `pnpm test` | Money-logic integration tests (node:test via tsx; needs `db:up`) |
| `pnpm check:vocab` | Banned-vocabulary check on message catalogs (spec §2) |
| `pnpm check:emoji` | Fails on any emoji in `src/**` or `messages/*.json` (use a line icon) |
| `pnpm lint` | ESLint |
