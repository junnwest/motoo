# motoo — Progress Tracker

_Last updated: 2026-07-10_

Living status of the build. Update the checkboxes as work lands. See
[`DECISIONS.md`](./DECISIONS.md) for why things are the way they are and
[`DEPLOYMENT.md`](./DEPLOYMENT.md) for infra state.

## Current focus

1. **Phase 2 mochi-marketplace** ✅ — creator onboarding + dashboard + user buy/spend built and verified locally.
2. **Deployment pipeline** (blocked) — Supabase (Seoul) + Vercel (icn1); needs the Supabase DB password to push schema + import to Vercel.
3. **Frontend polish** (next) — copy/design passes on the new Phase 2 surfaces.

---

## Phase 1 — Foundation + landings + backing flow ✅ (built, verified)

- [x] Next.js 16 (App Router) + TypeScript + Tailwind v4, design tokens from the handoff
- [x] Design system: colors/fonts/mochi motif in `globals.css`, shared UI (`Nav`, `Footer`, `Button`, `GradeBadge`, `StreamerCard`, `SafetyStrip`)
- [x] i18n (next-intl): `ko` default, `en` scaffold, no hardcoded strings
- [x] Prisma + Postgres schema (integer KRW), seed script
- [x] Auth.js scaffold (dev credentials + Naver/Kakao/Google), roles `backer`/`streamer`/`admin`
- [x] `PaymentProvider` interface + mock (virtual "mochi" currency)
- [x] `/` fan landing + `/creators` creator landing (two separate pages)
- [x] `/explore` — trust-signal ranking (never money raised) + filters
- [x] `/s/[handle]` — profile + Backer Wall + Trust Report summary
- [x] `/s/[handle]/back` — age gate → tier → display → message → pay, disclosure + founding-number reveal
- [x] Banned-vocabulary check (`pnpm check:vocab`)
- [x] Verified: build passes, backing invariant holds, no 360px overflow, no banned copy

> Note: the Trust Report thesis is **shelved for the demo** (see the Phase 2 pivot).
> Its schema/components stay in the tree; they're just not the headline.

---

## Deployment — Supabase (Seoul) + Vercel 🔧 (in progress)

- [x] Prisma `directUrl` wired (pooled runtime / direct migrations)
- [x] `vercel.json` region `icn1` (co-located with Supabase Seoul)
- [x] `.env.example` documents Supabase pooled/direct strings
- [x] Supabase project created (Seoul, Data API off) — ref `nrfhwhefabahsfzuyxqu`
- [x] Code pushed to GitHub `junnwest/motoo` (main)
- [ ] Schema pushed + seeded to Supabase _(blocked: need DB password)_
- [ ] Vercel project imported + env vars set + first deploy
- [ ] Verify deployed site (landing/explore/profile render, DB connected)

See [`DEPLOYMENT.md`](./DEPLOYMENT.md) for the exact steps and env-var list.

---

## Phase 2 — Mochi-marketplace pivot ✅ (built, verified locally)

The product for the demo: a creator issues their own mochi, users buy it and spend
it in that creator's marketplace. Mochi = prepaid marketplace credit, **capped as a
soft goal**, non-transferable, unspent-refundable, no resale/return (see DECISIONS).

Verified: `pnpm db:push` + `db:seed` succeed; all Phase 2 routes render 200 with real
data; the buy → redeem → cancel-refund invariants hold end-to-end against Postgres
(buy credits, redeem debits, cancel refunds, KRW = qty × price); `tsc` clean, vocab passes.

### Creator side
- [x] Creator signup + onboarding (email/pw + name, age, gender, creator type, handle, mochi price/goal) → `/creator/onboarding`
- [x] Per-creator dashboard shell + guard → `/creator/dashboard`
- [x] Mochi issuance controls: price + soft-goal quantity + pause → `/creator/dashboard/mochi`
- [x] Marketplace item CRUD (title, price in mochi, type, stock, active) → `/creator/dashboard/items`
- [x] Order view + mark-fulfilled / cancel-refund (fulfillment off-platform) → `/creator/dashboard/orders`

### User side
- [x] Discover creators (existing `/explore`)
- [x] Buy a creator's mochi (per-creator balance) — buy module on the profile
- [x] Spend mochi in a creator's marketplace (redeem items) — marketplace section on the profile
- [x] "My mochi" per-creator holdings → `/me/mochi`

### Data model changes (from Phase 1) — all landed
- [x] Creator: added gender, age, creatorType; `ownerId` links a creator account (Backer role=streamer) to its Streamer
- [x] Mochi: per-creator holdings (`MochiHolding`, unique [streamer, backer]); Phase-1 global `currencyBalance` left dormant
- [x] Mochi issuance config per creator (`MochiIssuance`: price, goal, sold)
- [x] `MarketplaceItem` + `Order` models (+ `MarketplaceItemType`, `OrderStatus`, `Gender` enums)
- [x] Phase-1 backing/tiers/founding-number **retired from the UI** (routes/schema kept dormant); founding number dropped from the new flow

### Auth
- [x] Real credentials login form (`/login`) replacing the stub; creator onboarding creates the account + signs in
- Dev logins: fan `demo@motoo.dev / motoo`, **creator `creator@motoo.dev / motoo`** (owns flagship `@creatorA`)

### Not yet done (Phase 2 follow-ups)
- [ ] Redemption/purchase history for users (only current holdings shown today)
- [ ] User self-signup form (`/signup` still a stub; dev fallback covers the demo)
- [ ] On-platform fulfillment for access passes / digital perks

### Marketplace item guidelines (all optional, off-platform fulfillment for v1)
- Digital/experiential (Q&A slot, shout-out, song/topic request, priority chat)
- Access passes (members-only posts/streams, early access, event tickets)
- Physical goods (merch, signed items, letters — needs address + fulfillment)
- 1:1 time slots (short call/DM)
- Disallowed: financial return, mochi resale/transfer, lottery-for-value, regulated goods

---

## Frontend polish 🎨 (planned)

- [ ] Fix copy/phrasing issues (list to be provided)
- [ ] Fix design issues (list to be provided)

---

## Backlog / explicitly out of scope for now

- Streamer dashboard analytics, admin console, full Trust Report document + PDF
- Real Korean PG (Toss/NICE) sub-merchant integration
- On-platform fulfillment for access passes / digital perks
- Real age verification + guardian consent flow
