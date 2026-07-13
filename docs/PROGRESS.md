# motoo — Progress Tracker

_Last updated: 2026-07-12_

Living status of the build. Update the checkboxes as work lands. See
[`DECISIONS.md`](./DECISIONS.md) for why things are the way they are and
[`DEPLOYMENT.md`](./DEPLOYMENT.md) for infra state.

## Current focus

1. **Phase 2 mochi-marketplace** ✅ — creator issuance + Studio + user buy/spend, verified locally.
2. **Phase 4 accounts** ✅ — auth-aware app, fan onboarding (본인인증 gate), and the **additive creator model** (a user who *also* owns a Studio). See below.
3. **Deployment** (blocked) — Supabase (Seoul) + Vercel (icn1); needs the Supabase DB password to push schema + import to Vercel.
4. **Next** — `/explore` as the real consumer home (still the Phase-1 trust-ranking grid); real PG + real 본인인증 (both need a business registration + contract).

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

### Creator side (the **Studio**, `/studio`)
- [x] Studio shell + guard (owns a Streamer) → `/studio`
- [x] Mochi issuance controls: price + soft-goal quantity + pause → `/studio/mochi`
- [x] Marketplace item CRUD (title, price in mochi, type, stock, active) → `/studio/items`
- [x] Order view + mark-fulfilled / cancel-refund (fulfillment off-platform) → `/studio/orders`
- [x] Become-a-creator setup (add-on to a signed-in user) → `/creator/onboarding`, entered via `/api/become-creator`

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

### Phase 3 follow-ups ✅
- [x] User order/redemption history — a "주문 내역" section on `/me/mochi` (`getOrdersForBacker`)
- [x] User self-signup — real `/signup` form + action
- [x] Automated tests — `pnpm test` runs 10 money-logic integration tests (node:test via tsx) incl. the two concurrency guards

---

## Phase 4 — Auth, onboarding, accounts ✅ (built, verified locally)

### Auth
- [x] Real credentials login (`/login`) + self-signup (`/signup`) — split-layout, **social-first** (Kakao/Naver/Google) with email/password below a divider; password policy (8+ chars, letter+number) + confirm field
- [x] **Auth-aware app**: `Nav` is a server component reading the session; signed-in shows name + logout (+ Studio link for creators)
- [x] **OAuth**: **Google + Naver live in dev** (creds in `.env`, gitignored). Kakao stays a "준비 중" badge — blocked on business registration. Buttons activate the moment creds appear (`getEnabledOAuthProviders`)
- [x] Auth config split for edge middleware: `auth.config.ts` (session + `authorized`, no Prisma) vs `auth.ts` (providers + Prisma `jwt`); `src/proxy.ts` = the middleware
- [x] Stale-session self-heal: a cookie for a deleted account signs out via `/api/session-reset` instead of looping

### Onboarding (every new user, redirect-enforced by `proxy.ts`)
- [x] `/onboarding` — confirm nickname, pick a unique public `@handle` (live availability), **본인인증** (identity/age gate), agree to terms (필수) + marketing (선택)
- [x] **`VerificationProvider` abstraction + mock** (`VERIFICATION_PROVIDER`) — real 본인인증 = 본인확인기관 contract + business reg (like the PG). Mock simulates a verified adult, persisted server-side
- [x] `/terms` + `/privacy` placeholder pages

### Accounts — the additive creator model
- [x] **A creator is a USER who also owns a Studio** — not a separate account or a mode. Dropped `role: streamer` from routing; creator status = owns a `Streamer`, surfaced as `session.user.creator` (handle or null)
- [x] **Role-aware home**: logged-out → marketing landing `/`; every signed-in user → `/explore`; creators reach the Studio via a nav link
- [x] **Become a creator**: `/api/become-creator` — signed-in user → creator setup; logged-out → signup, remembering the intent (cookie) so the combined flow (signup → onboarding → creator setup) continues; `/signup` shows a creator-mode banner
- [x] Nav: **스튜디오** link for creators, subtle **크리에이터 되기** for users; marketing links only when logged out
- Dev logins: fan `demo@motoo.dev / motoo`, **creator `creator@motoo.dev / motoo`** (a user who owns `@creatorA`)

### Not built (need a business registration + paid contract — same blocker class)
- [ ] Real Korean PG (Toss/NICE / PortOne) — needs credentials **and** a redirect+confirm flow (see "Real payments" below)
- [ ] Real 본인인증 (NICE/PASS/간편인증) — ~₩40/verification + 사업자등록. PortOne aggregates PG + 간편인증 in one integration
- [ ] On-platform fulfillment; admin console; guardian-consent flow for minors

## Real payments — what a live PG needs (not built)

The current `PaymentProvider` is synchronous (`purchaseMochi` charges inline in a
server action) and only the **mock** adapter exists. A real Toss/NICE integration
is not a drop-in adapter — it needs:
1. **Merchant credentials** (secret key / sub-merchant onboarding) in env, not repo.
2. **A redirect-based flow**: create a payment → redirect the buyer to the PG →
   handle the success/fail callback → **server-side confirm** → then credit mochi.
   This replaces the current "charge inline, credit in the same request" shape.
3. **Webhook + reconciliation** for async settlement and refunds/voids (the
   `voidCharge` compensation hook exists but is a mock no-op today).
Until then, `PAYMENT_PROVIDER=mock` grants mochi without moving real money.

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
