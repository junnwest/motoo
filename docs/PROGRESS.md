# motoo — Progress Tracker

_Last updated: 2026-08-06_

**Read this whole file — it is short on purpose.** Everything in it is either open, blocked,
or a live constraint. Shipped history lives in [`CHANGELOG.md`](./CHANGELOG.md) and does not
need reading to resume work. Rationale lives in [`DECISIONS.md`](./DECISIONS.md) — that file
has a dated index at the top, so read the one entry you need rather than the file. Infra
state is in [`DEPLOYMENT.md`](./DEPLOYMENT.md).

## Open items — read this first when resuming

Nothing is half-finished; `main` is green and deployed. These are the known gaps, each
deliberate. Ordered by what would hurt most if ignored.

**Needs a real answer before money moves**
- [ ] **`/refund` needs Korean counsel sign-off before `PAYMENT_PROVIDER` leaves `mock`.**
  The page now exists and states real positions (2026-08-06): 7-day 청약철회 on a wholly
  unused purchase, 60% 사용 → 잔액 환불, plus the 법령 carve-out. Those positions were the
  owner's calls, **not a lawyer's** — nobody has checked them against 전자상거래법 §17 or the
  선불전자지급수단 rules. **This is still the one open item that is a liability rather than a
  nicety.** See DECISIONS 2026-08-06.
  - [ ] **The policy is silent on creator/service termination** — what happens to an unused
    balance if a creator stops trading or motoo closes the market. Deliberately omitted (the
    owner chose the 60% rule alone over 60%+termination), but it is the clause hardest to
    defend leaving out. Take it to counsel with the rest.
  - [ ] **`/refund` tells users to contact 고객센터, which does not exist** — the footer's
    support links are still `href="#"`. The policy promises a channel the product lacks.
  - [ ] `/terms` and `/privacy` are still one-line placeholders, now linked from the footer.
- [ ] Real PG (Toss/NICE/PortOne), real 본인인증, Kakao login — all blocked on 사업자등록.
  Mocks stand in behind `PaymentProvider` / `VerificationProvider`.

**Known rough edges, consciously left**
- [ ] **Expanded rails' dividers end where their content ends**, so the left and right lines
  are different lengths when open (collapsed ones run full height). Fixing it means giving
  expanded rails a fixed height, which changes their scroll behaviour. DECISIONS 2026-08-02.
- [ ] **The edge middleware doesn't check `tokenVersion`** — it's Prisma-free by design, so a
  revoked token can still satisfy the *onboarding routing* gate for one request. Every
  page-level `auth()` does the real check, so this is routing, not authorization.
- [ ] `SignupModal` predates `src/components/ui/Modal.tsx` and still carries its own copy of
  the portal / Escape / scroll-lock logic. Works; just duplicated.
- [ ] Legacy `/s/[handle]/back` flow is still routable and orphaned (linked from nowhere),
  and its copy references retired concepts. `src/lib/grades.ts` likewise has zero imports.
- [ ] **2 pre-existing eslint errors**, constant all session — treat as the baseline, not as
  something you broke: `src/app/onboarding/OnboardingForm.tsx:37` (set-state-in-effect; the
  same rule `usePersistedCollapse` and `FollowButton` were rewritten to satisfy) and
  `design-handoff/image-slot.js:1` (parse error in a non-source asset).

**Maintenance**
- [ ] **Prisma 7 will drop `package.json#prisma`** — every `db push` warns about it. We only
  keep `{"seed": "tsx prisma/seed.ts"}` there, so migrating to `prisma.config.ts` is small.
- [ ] **Schema pushes to prod are manual** and easy to forget — the Vercel build runs
  `prisma generate` but not `db push`. Automating via `prisma migrate deploy` in the build
  would remove the footgun. See DEPLOYMENT → "Schema changes".
- [x] ~~Vercel Hobby likely ignores `icn1`~~ — **resolved 2026-08-06: the account is Pro, which
  honours single-region pinning, so functions run in `icn1` beside the Seoul DB.** There was
  never a cross-Pacific hop. (Stage 6 of the audit; the query counts it prompted were still
  worth fixing — see CHANGELOG.)

**Design tier 2/3** (unchanged, see "Current focus" below): the landing repeats one section
template five times, Latin eyebrows (`DISCOVER`, `HOW MOCHI WORKS`), English
`STRONG`/`EMERGING` badges, unstyled native `<select>`s on explore, and 퍼크 still on explore.

## Current focus

1. **Phase 2 mochi-marketplace** ✅ — creator issuance + Studio + user buy/spend, verified locally.
2. **Phase 4 accounts** ✅ — auth-aware app, fan onboarding (본인인증 gate), and the **additive creator model** (a user who *also* owns a Studio). See below.
3. **Deployment** ✅ — **live at [themotoo.com](https://themotoo.com)** (Vercel + Supabase Seoul). Custom domain wired (Squarespace DNS → Vercel), OAuth callbacks set, auto-deploy on push to `main`.
4. **Consumer home** ✅ — signed-in users land on **`/home`** (balances → pending orders → news → discovery), adaptive for users with no mochi yet. `/` stays the marketing landing; `/explore` stays the browse page.
5. **Next** — design tier 2/3: the landing still repeats one section template five times, Latin eyebrows (`DISCOVER`, `HOW MOCHI WORKS`), English `STRONG`/`EMERGING` badges, unstyled native `<select>`s on explore, and leftover Phase-1 vocabulary (퍼크) still on explore
(백커 and 트러스트 리포트 are both retired now). Then real PG + real 본인인증 (both need a business registration + contract).

## What's built

All four phases are complete, verified, and deployed. One line each:

- **Phase 1** — Next 16 + Tailwind v4 + Prisma/Postgres, design system, i18n, Auth.js
  scaffold, the two landings, `/explore`, `/s/[handle]`. (Its Trust Report thesis has since
  been retired — schema kept dormant, no UI surface.)
- **Phase 2** — the mochi-marketplace pivot: creator issuance + Studio + fan buy/spend.
  New models `MochiIssuance`, `MochiHolding`, `MarketplaceItem`, `Order`.
- **Phase 3** — order history, real self-signup, the `pnpm test` money-logic suite
  (11 tests, incl. the two concurrency guards).
- **Phase 4** — real auth (credentials + Google/Naver live), `/onboarding` behind the
  middleware gate, and the **additive creator model** (a user who also owns a Studio).
- **Deployment** — live on Vercel + Supabase Pro (Seoul), custom domain wired, auto-deploy
  on push to `main`.

Blow-by-blow in [`CHANGELOG.md`](./CHANGELOG.md).

## Not built (need a business registration + paid contract — same blocker class)

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

## Backlog / explicitly out of scope for now

- Streamer dashboard analytics, admin console, full Trust Report document + PDF
- Real Korean PG (Toss/NICE) sub-merchant integration
- On-platform fulfillment for access passes / digital perks
- Real age verification + guardian consent flow
