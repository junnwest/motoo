# motoo — Decision Log

Why the project is the way it is. Newest first. Keep entries short: decision,
rationale, and any constraint it creates.

## 2026-07-12 — Additive creator model (user base + Studio)
A creator is **a user who also owns a Studio** (`Streamer`), not a separate account
or a mode. Dropped `role: streamer` from all routing; creator status is derived from
Streamer ownership and surfaced as `session.user.creator` (handle or null).
- Rationale: how YouTube/Twitch/Patreon work — one identity, additive capability. A
  creator naturally wants to support other creators, which a role-toggle blocks.
- Constraint: `session.user.creator` lives in the JWT; the become-a-creator action calls
  `unstable_update()` so a new Studio shows up without re-login. `role` keeps only
  user/admin meaning. `/creator/dashboard` renamed to **`/studio`** ("Studio" — works for
  all creator types, not just streamers).
- **Become a creator = combined flow**: `/api/become-creator` routes a signed-in user to
  creator setup, or a logged-out visitor to signup while remembering the intent (cookie),
  so signup → onboarding → creator setup chains automatically.

## 2026-07-11 — Role-aware home; marketing demoted, not deleted
Logged-out visitors get the marketing landing `/`; every signed-in user is redirected to
`/explore` (the consumer home). The creator marketing page (`/creators`) stays public but
demoted (footer link), so creator acquisition still works without shoving it at everyone.
- Rationale: real products send signed-in users to their app home, not the pitch.

## 2026-07-11 — Fan onboarding + identity verification as an abstraction
Every new user completes `/onboarding` (nickname, unique `@handle`, 본인인증, terms),
enforced by `proxy.ts`. Age is a real **본인인증 step** behind a `VerificationProvider`
(mirrors `PaymentProvider`); the **mock** simulates a verified adult, persisted server-side.
- Rationale: a self-reported birthdate is theater; real age = 본인확인기관 (NICE/PASS/
  간편인증), which needs a `사업자등록` + paid contract (~₩40/verification) — same blocker
  class as the PG. Build the flow now, swap the adapter later (`VERIFICATION_PROVIDER`).
- Kakao login is blocked the same way (business verification); Google + Naver are free to
  register and are **live in dev**.

## 2026-07-11 — Auth split for edge middleware + self-healing sessions
Split Auth.js into `auth.config.ts` (edge-safe: session + `authorized` onboarding gate, no
Prisma) and `auth.ts` (providers + Prisma `jwt`); `src/proxy.ts` is the middleware (Next 16
renamed `middleware`→`proxy`). A stale cookie (deleted account, e.g. after a dev reseed)
self-heals via `/api/session-reset` instead of looping /onboarding ↔ /login.

## 2026-07-10 — Phase 3 follow-ups: order history, self-signup, tests
Built the buildable, verifiable slice of the Phase 3 backlog.
- **Order history** on `/me/mochi` (`getOrdersForBacker`) — users see redeemed
  items with status; **self-signup** (`/signup`, role=backer) + role-aware login
  redirect (creators land on the dashboard).
- **Tests**: `pnpm test` runs money-logic integration tests via Node's built-in
  runner + tsx (no new deps) against the docker Postgres, with isolated fixtures.
  Covers buy/redeem/cancel invariants and the two concurrency guards.
- **Real PG deliberately NOT built**: a faithful Toss/NICE adapter needs merchant
  credentials AND a redirect+confirm flow (an architectural change), so it's
  documented in PROGRESS.md rather than shipped as unverifiable code. Added a
  `voidCharge` compensation hook to the interface (mock no-op) for when it lands.

## 2026-07-10 — Phase 2 build: retire backing, per-creator holdings, creator auth
Built the mochi-marketplace. Key choices (user-approved):
- **Retire the Phase-1 backing flow** (tiers, `Backing`, `FoundingMembership`) from the
  UI — one clean spend path: buy a creator's mochi → redeem marketplace items. The
  models/routes stay in the tree but dormant. **Founding number dropped** from the new flow.
- **Per-creator mochi** via `MochiHolding` (unique [streamer, backer]); the Phase-1 global
  `Backer.currencyBalance` is left dormant. `MochiIssuance` holds price + soft-goal + sold.
- **Creator auth without a rename**: a creator is a `Backer` account (role=streamer) that
  **owns** a `Streamer` via `Streamer.ownerId`. Onboarding creates account + profile +
  issuance in one transaction and signs the creator in. `getCurrentCreator()` resolves the
  owned profile (dev-fallback `creator@motoo.dev` mirrors the fan dev-fallback).
- **Soft goal is not a cap**: buying past `goalQuantity` is allowed; the bar just shows
  >100%. Keeps mochi a consumable, not a scarce security (spec §2/§8).
- Constraint: fulfillment stays **off-platform** in v1 (orders record + creator marks
  done/cancels; cancel refunds the exact mochi and frees stock).

## 2026-07-09 — Pivot to the mochi-marketplace model
The demo's product is now: **a creator issues their own mochi; users buy it and
spend it in that creator's marketplace.** The Trust Report thesis from the original
handoff is shelved (schema/components kept, not featured).
- Rationale: product owner's direction for the final demo.
- Constraint: reshapes the data model (per-creator mochi holdings, marketplace items,
  orders) and adds creator auth/onboarding + dashboard.

## 2026-07-09 — Mochi supply = "capped as a soft goal"
A creator sets quantity × price as a **target** (e.g. 100 × ₩200 = ₩20,000). Mochi is
prepaid credit spendable only in that creator's marketplace. **Non-transferable,
unspent-refundable, no resale/return.**
- Rationale: keeps mochi a consumable (별풍선 pattern), NOT a security. A hard
  scarce-supply "issuance" would drift into 조각투자 / 유사수신 territory, which the
  original spec §2/§8 forbids.
- Constraint: the cap is framed creator-side ("goal/target"), never sold to users as
  "invest in a raise." Banned-vocabulary check still guards all copy.

## 2026-07-09 — Marketplace items are guidelines; fulfillment off-platform in v1
Digital/experiential, access passes, physical goods, and 1:1 slots are all allowed
item types, but none must be fulfilled through motoo. v1 records the order/redemption;
the creator fulfills off-platform and marks status. On-platform fulfillment (e.g.
access passes) can come later.
- Rationale: product owner's guidance; keeps v1 scope tractable.

## 2026-07-09 — Database: Supabase Pro (Seoul), not Neon
Chose Supabase over Neon once the user confirmed an existing **Pro** plan.
- Rationale: Pro projects don't pause (Neon free scales to zero / Supabase free pauses
  after ~1 week); **Seoul region** available (Neon has none closer than Singapore);
  Storage included for future merch/avatar images; one dashboard/billing.
- No rework: Supabase is used purely as a Postgres host. Prisma connects via the
  pooler; **Auth.js is unchanged** (we do NOT use Supabase Auth or the Data API).
- Constraint: Data API disabled (we use Prisma, not supabase-js). Vercel region set to
  `icn1` (Seoul) to co-locate app + DB.

## 2026-07-09 — Hosting: Vercel; pipeline-first sequencing
Deploy to Vercel; stand up the pipeline before building the pivot so changes
auto-deploy to preview URLs.
- Rationale: Vercel is the native home for Next.js App Router + server actions;
  pipeline-first surfaces deploy issues early and gives live previews per change.

## 2026-07-08 — Two separate landing pages
`/` is the fan landing (default); `/creators` is a standalone creator landing we send
to creators directly. Fan page links to it via "크리에이터이신가요?".
- Rationale: product owner preference; creators get a dedicated link.

## 2026-07-08 — `FoundingMembership` table for the founding-number invariant
Founding number is assigned once per (streamer, backer) via a dedicated table with two
unique constraints; `Backing.foundingNumber` is a denormalized display copy.
- Rationale: a backer who backs repeatedly keeps the SAME number, so a unique
  constraint on `Backing(streamerId, foundingNumber)` is impossible. The membership
  table makes "assigned once, never reused/reordered" DB-enforced.

## 2026-07-08 — Prisma pinned to v6 (not v7)
- Rationale: Prisma 7 removed `url` from the schema datasource and requires driver
  adapters + `prisma.config.ts`. v6 is the smoother path for now; revisit later.

## 2026-07-08 — Korean-first, i18n-ready; integer KRW; mock PG
- `ko` default with `en` scaffold, no hardcoded strings (next-intl).
- Money stored as integer KRW, never floats.
- Korean PG stubbed behind a `PaymentProvider` interface (`mock` in dev); real
  Toss/NICE adapters left as documented stubs.
