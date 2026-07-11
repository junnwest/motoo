# motoo

A two-sided Korean creator-support platform. **Current direction: a mochi-marketplace** —
each creator issues their own **mochi** (prepaid marketplace credit, capped as a soft
goal), users buy it and spend it in that creator's marketplace. See
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

**Current direction:** the **mochi-marketplace pivot** (Phase 2) is the product for the
demo — creators issue their own mochi, users buy it and spend it in each creator's
marketplace. It's **planned, not yet built** — see PROGRESS.md for the plan. The original
**Streamer Trust Report** thesis is shelved for the demo; its schema and components stay
in the tree. What's live today is the Phase 1 foundation below.

## What's built so far (Phase 1 — landing + core backing flow)

| Route | Page |
| --- | --- |
| `/` | Fan landing (default) |
| `/creators` | Creator landing (link sent to creators; reachable from the fan page's "크리에이터이신가요?") |
| `/explore` | Streamer grid — ranked by **trust signals, never money raised** — with filters |
| `/s/[handle]` | Streamer profile + tiers + **Backer Wall** + Trust Report summary |
| `/s/[handle]/back` | Backing flow: age gate → tier → display → message → pay, with the non-financial disclosure and **founding-number reveal** |
| `/login` `/signup` `/apply` `/s/[handle]/report` | Placeholders (out of Phase-1 scope) |

Out of scope for now: streamer dashboard, admin, full Trust Report document/PDF, real PG.
The schema and design system already support them.

## Stack

- **Next.js 16** (App Router) · TypeScript · **Tailwind v4** (design tokens in [`src/app/globals.css`](./src/app/globals.css))
- **Postgres + Prisma 6** — money is integer KRW, never floats
- **next-intl** — `ko` default, `en` scaffold, no hardcoded strings ([`messages/`](./messages/))
- **Auth.js v5** — dev credentials + Naver/Kakao/Google scaffold, roles `backer`/`streamer`/`admin`
- **Payments** — Korean virtual-currency ("모찌"/cookies) model behind a `PaymentProvider` interface; `MockPaymentProvider` in dev, Toss/NICE adapters stubbed

## Key invariants (enforced in code)

- **Founding number** is assigned once per (streamer, backer) via the `FoundingMembership`
  table (two DB unique constraints), never reused/reordered, never released on refund.
  See [`src/lib/backing.ts`](./src/lib/backing.ts).
- **`PerkDelivery` rows** (not `Perk.status`) are the source of truth for the Execution grade.
- **Grades** are words only — `Emerging` / `Strong` / `Excellent` — never a numeric score.

## Getting started

Prereqs: Node 20+, pnpm, Docker (for Postgres).

```bash
pnpm install
cp .env.example .env        # dev defaults work as-is
pnpm db:up                  # start Postgres (docker compose, host port 5433)
pnpm db:push                # create schema
pnpm db:seed                # sample streamers, tiers, backers, reports
pnpm dev                    # http://localhost:3000
```

Dev login: `demo@motoo.dev` / `motoo`. In dev, the backing flow falls back to this
demo backer when no one is signed in (see [`src/lib/session.ts`](./src/lib/session.ts)).

## Scripts

| Command | What it does |
| --- | --- |
| `pnpm dev` / `pnpm build` / `pnpm start` | Next.js dev / build / production |
| `pnpm db:up` / `pnpm db:down` | Start / stop Postgres |
| `pnpm db:push` / `pnpm db:seed` / `pnpm db:studio` | Schema push / seed / Prisma Studio |
| `pnpm check:vocab` | Banned-vocabulary check on message catalogs (spec §2) |
| `pnpm lint` | ESLint |
