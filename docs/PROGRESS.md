# motoo — Progress Tracker

_Last updated: 2026-07-09_

Living status of the build. Update the checkboxes as work lands. See
[`DECISIONS.md`](./DECISIONS.md) for why things are the way they are and
[`DEPLOYMENT.md`](./DEPLOYMENT.md) for infra state.

## Current focus

1. **Deployment pipeline** (in progress) — Supabase (Seoul) + Vercel (icn1), auto-deploy on push.
2. **Phase 2 pivot** (next) — mochi-marketplace: creator issuance + per-creator dashboard + marketplace + user pipeline.

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
- [ ] Schema pushed + seeded to Supabase _(blocked: need DB password)_
- [ ] Code pushed to GitHub `junnwest/motoo` _(blocked: session git uses a read-only deploy key — push from local terminal)_
- [ ] Vercel project imported + env vars set + first deploy
- [ ] Verify deployed site (landing/explore/profile render, DB connected)

See [`DEPLOYMENT.md`](./DEPLOYMENT.md) for the exact steps and env-var list.

---

## Phase 2 — Mochi-marketplace pivot 🧭 (planned)

The product for the demo: a creator issues their own mochi, users buy it and spend
it in that creator's marketplace. Mochi = prepaid marketplace credit, **capped as a
soft goal**, non-transferable, unspent-refundable, no resale/return (see DECISIONS).

### Creator side
- [ ] Creator signup + onboarding (name, age, gender, creator type, platform links)
- [ ] Per-creator dashboard (their own home)
- [ ] Mochi issuance controls: quantity + price (soft-goal target, e.g. 100 × ₩200 = ₩20,000)
- [ ] Marketplace setup: create/manage items (title, price in mochi, type, stock)
- [ ] Order/redemption view + mark-fulfilled (fulfillment off-platform in v1)

### User side
- [ ] Search / discover creators
- [ ] Buy a creator's mochi (per-creator balance)
- [ ] Spend mochi in a creator's marketplace (redeem items)
- [ ] "My mochi" per-creator holdings + redemption history

### Data model changes (from Phase 1)
- [ ] Creator: add gender, age, creatorType; creator auth path
- [ ] Mochi: global balance → per-creator holdings (`MochiHolding`)
- [ ] Mochi issuance config per creator (total, price, sold)
- [ ] `MarketplaceItem` + `Order`/`Redemption` models
- [ ] Decide fate of Phase-1 tiers/backing/founding-number (fold in vs retire)

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
