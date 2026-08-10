# motoo — Progress Tracker

_Last updated: 2026-08-10_

**Read this whole file — it is short on purpose.** Everything in it is either open, blocked,
or a live constraint. Shipped history lives in [`CHANGELOG.md`](./CHANGELOG.md) and does not
need reading to resume work. Rationale lives in [`DECISIONS.md`](./DECISIONS.md) — that file
has a dated index at the top, so read the one entry you need rather than the file. Infra
state is in [`DEPLOYMENT.md`](./DEPLOYMENT.md).

## 🔴 Production is currently broken — fix this first

**The donation-pivot schema rename shipped to `main` before the prod DB was migrated —
owner's explicit, informed call (see DEPLOYMENT.md's 2026-08-10 note), not an accident.**
Every mochi-related page on themotoo.com (buy/donate, leaderboards, ranking, Studio
dashboard) is 500ing right now because Supabase still has the old column names
(`purchasedTotal`/`soldQuantity`/`lifetimeSold`) and the deployed code expects the new ones
(`mochiEarnedTotal`/`grantedQuantity`/`lifetimeGranted`). Fix:
```bash
npx -y dotenv-cli -e .env.production.local -- npx prisma db push --accept-data-loss --skip-generate
```
Needs real Supabase prod credentials — nobody had `.env.production.local` this session, so
this has to be run by whoever does. See DEPLOYMENT.md → "Schema changes" for the full
context (this is the **first destructive** prod schema push; everything before it was
additive/nullable and safe by default).

## Open items — read this first when resuming

These are the known gaps, each deliberate (beyond the outage above). Ordered by what would
hurt most if ignored.

**Needs a real answer before money moves**
- [ ] **`/refund` needs Korean counsel sign-off before `PAYMENT_PROVIDER` leaves `mock`.**
  The page now exists and states real positions: 7-day 청약철회 on a wholly unused donation,
  plus the 법령 carve-out. (The 60% unused-balance refund path was dropped 2026-08-09 — it was
  never a statutory floor, just a 신유형 상품권 표준약관 convention, and going narrower reads
  as lower-risk pending review.) These positions were the owner's calls, **not a lawyer's** —
  nobody has checked them against 전자상거래법 §17 or the 선불전자지급수단 rules, and it's an
  open question whether even the 7-day right can be narrowed further. **This is still the one
  open item that is a liability rather than a nicety.** See DECISIONS 2026-08-09, 2026-08-06.
  - [ ] **The counsel review just got one question bigger.** Mochi acquisition changed from a
    purchase to a donation bonus (DECISIONS 2026-08-09, "the donation pivot") specifically to
    move mochi outside 선불전자지급수단 regulation — but whether that reframing actually holds
    (does "donate and automatically earn a bonus" still count as 대가관계?), and whether the
    7-day 청약철회 right even applies the same way to a donation as it did to a purchase, are
    both unresolved. `/refund`'s copy was reworded to stop asserting "구매," not to answer
    either question. See `docs/legal/terms-draft.md` 제6조/제8조 and review-point 6.
  - [ ] **The policy is silent on creator/service termination** — what happens to an unused
    balance if a creator stops trading or motoo closes the market. Deliberately omitted, and
    now more exposed than before: with the 60% path gone there's no voluntary refund route at
    all past the 7-day window, which makes the termination gap the more visible omission of
    the two. Take it to counsel with the rest.
  - [x] **고객센터 now resolves to something** (2026-08-10) — footer support links and
    `/refund`'s "how to request" section point to `SUPPORT_MAILTO`
    (`src/lib/support.ts`), a `mailto:` to the owner's personal email. Real, but
    **explicitly interim** — a personal Gmail as the official contact channel (and as the
    개인정보 보호책임자 contact in `docs/legal/privacy-draft.md`) is fine pre-registration,
    not something to carry into a real launch. Swap the one constant when a dedicated
    channel exists.
  - [ ] `/terms` and `/privacy` are still one-line placeholders, now linked from the footer.
    Lawyer-review drafts exist at `docs/legal/terms-draft.md` and
    `docs/legal/privacy-draft.md` (2026-08-09) — not wired into the site yet; they're for
    counsel to mark up before anything ships as real copy.
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
- [x] **`package.json#prisma` → `prisma.config.ts`** (2026-08-10) — the seed command moved;
  `package.json`'s now-dead `pnpm.onlyBuiltDependencies` (superseded by
  `pnpm-workspace.yaml`'s `allowBuilds`) was cleaned up in the same pass. Still the classic
  engine (schema.prisma's own `url`/`directUrl`), not the Prisma 7 driver-adapter jump —
  that's a separate, bigger change. One gotcha: a `prisma.config.ts` file turns off
  Prisma's automatic `.env` loading, so the config now calls `process.loadEnvFile()`
  itself (Node's native loader, no `dotenv` dependency needed).
- [ ] **Schema pushes to prod are manual** and easy to forget — the Vercel build runs
  `prisma generate` but not `db push`. Automating via `prisma migrate deploy` in the build
  would remove the footgun. See DEPLOYMENT → "Schema changes".
- [ ] Vercel Hobby likely ignores `vercel.json`'s `icn1`, so functions run in the US while
  the DB is in Seoul (cross-Pacific latency per query). Revisit on Pro.

**Design tier 2/3** (2026-08-10 pass — see "Current focus" below for what's left):
- [x] **Latin eyebrows → Korean** — `fanLanding`/`creatorLanding`/`explore`'s `eyebrow` and
  `howEyebrow` keys (rendered uppercase via `Eyebrow`'s CSS, hence `DISCOVER`/
  `HOW MOCHI WORKS`) are now Korean (발견/이용 방법/운영 방법/팬·크리에이터를 위한 motoo).
- [x] **`STRONG`/`EMERGING` badges — turned out stale, not a real item.** They live in
  `src/lib/grades.ts`, the retired Trust Report grading — confirmed **zero imports**
  anywhere in `src/`. Nothing renders them; there was nothing to fix. (The file itself
  stays, per the existing "consciously left" dead-code note below — Prisma's grade schema
  is still dormant, not deleted.)
- [x] **Native `<select>`s on explore, styled** — `ExploreFilters.tsx`'s 4 filters already
  had proper border/padding styling; what was actually missing was the OS's default
  disclosure arrow, inconsistent across browsers. New `IconChevronDown`
  (`src/components/ui/Icons.tsx`) + a local `FilterSelect` wrapper (`appearance-none` +
  the icon absolutely positioned) fixes it uniformly across all 4.
- [x] **퍼크 (leftover Phase-1 vocabulary)** — fixed the 3 spots that are actually live
  (`fanLanding.benefits.perksBody`/`.dashboardBody`, `creatorLanding.how.step2Body` →
  혜택/아이템). Left `perkTitle`/`perkBody`/`tierPerks` alone — confirmed zero imports,
  same dead-code class as `grades.ts`, not a copy problem since nothing renders them.
  **Also turned out stale**: PROGRESS said "still on explore" — no 퍼크 reference was
  actually found anywhere in the `explore` namespace or its components; the real
  instances were on the fan/creator landing pages instead.
- [x] **De-boxed the two single-item sections** — "Mochi explainer" and "Are you a
  creator?" were `rounded-[24px] border border-line-2` cards on the default background;
  now full-bleed color bands (cream-warm / dark ink), matching the Final CTA section,
  which already used this treatment and was the one section on the page that didn't feel
  repetitive. Benefits (4 distinct items) and Spotlight (a real profile chunk) kept their
  card treatment — they hold genuinely separate content, unlike the two that changed.
  Owner's call between three options; picked over "keep every section boxed, vary color"
  and "hold for a mockup." See DECISIONS 2026-08-10.

## Current focus

1. **Phase 2 mochi-marketplace** ✅ — creator issuance + Studio + user donate/spend, verified locally. (Buy → donate pivot: 2026-08-09.)
2. **Phase 4 accounts** ✅ — auth-aware app, fan onboarding (본인인증 gate), and the **additive creator model** (a user who *also* owns a Studio). See below.
3. **Deployment** ✅ — **live at [themotoo.com](https://themotoo.com)** (Vercel + Supabase Seoul). Custom domain wired (Squarespace DNS → Vercel), OAuth callbacks set, auto-deploy on push to `main`.
4. **Consumer home** ✅ — signed-in users land on **`/home`** (balances → pending orders → news → discovery), adaptive for users with no mochi yet. `/` stays the marketing landing; `/explore` stays the browse page.
5. **Design tier 2/3** ✅ (2026-08-10) — all items resolved; see "Design tier 2/3" above.
6. **Next** — real PG + real 본인인증 (both need a business registration + contract); the
counsel review (refund positions, the donation-pivot 대가관계 question, terms/privacy
drafts) in the meantime.

## What's built

All four phases are complete, verified, and deployed. One line each:

- **Phase 1** — Next 16 + Tailwind v4 + Prisma/Postgres, design system, i18n, Auth.js
  scaffold, the two landings, `/explore`, `/s/[handle]`. (Its Trust Report thesis has since
  been retired — schema kept dormant, no UI surface.)
- **Phase 2** — the mochi-marketplace pivot: creator issuance + Studio + fan donate/spend
  (donate, not buy, since 2026-08-09). New models `MochiIssuance`, `MochiHolding`,
  `MarketplaceItem`, `Order`.
- **Phase 3** — order history, real self-signup, the `pnpm test` money-logic suite
  (13 tests, incl. the two concurrency guards).
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

The current `PaymentProvider` is synchronous (`donate` charges inline in a
server action) and only the **mock** adapter exists. A real Toss/NICE integration
is not a drop-in adapter — it needs:
1. **Merchant credentials** (secret key / sub-merchant onboarding) in env, not repo.
2. **A redirect-based flow**: create a payment → redirect the donor to the PG →
   handle the success/fail callback → **server-side confirm** → then grant the mochi bonus.
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
