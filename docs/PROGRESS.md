# motoo — Progress Tracker

_Last updated: 2026-08-10_

**Read this whole file — it is short on purpose.** Everything in it is either open, blocked,
or a live constraint. Shipped history lives in [`CHANGELOG.md`](./CHANGELOG.md) and does not
need reading to resume work. Rationale lives in [`DECISIONS.md`](./DECISIONS.md) — that file
has a dated index at the top, so read the one entry you need rather than the file. Infra
state is in [`DEPLOYMENT.md`](./DEPLOYMENT.md).

A ten-stage audit ran on 2026-08-06/07 — findings and the plan are in
[`AUDIT-2026-08-06.md`](./AUDIT-2026-08-06.md), what shipped is in CHANGELOG. **The audit doc
is history now, except for its "Open questions" section, which is still live.**

## Open items — read this first when resuming

The branch is green after merging `main`'s donation pivot: `pnpm build`, `pnpm test` (26),
`check:vocab`, `check:emoji` and **`pnpm lint` all pass**. Ordered by what would hurt most if
ignored.

**Blocks a real launch**
- [ ] **Counsel sign-off on `/refund`, and on three questions it doesn't answer.** The page
  states real positions (7-day 청약철회 on a wholly unused donation, 법령 carve-out) but they
  are the owner's calls, not a lawyer's. (The 60% unused-balance path was dropped 2026-08-09 —
  never a statutory floor, just a 신유형 상품권 표준약관 convention.) Gate on
  `PAYMENT_PROVIDER` leaving `mock`. Three things to take with it:
  - [ ] **Does the donation pivot actually hold?** Mochi acquisition changed from a purchase
    to a donation bonus (DECISIONS 2026-08-09) specifically to move mochi outside
    선불전자지급수단 regulation — but whether "donate and automatically earn a bonus" still
    counts as 대가관계, and whether the 7-day 청약철회 right applies the same way to a
    donation as it did to a purchase, are both unresolved. `/refund` was reworded to stop
    asserting 구매, not to answer either question. See `docs/legal/terms-draft.md` 제6조/제8조.
  - [ ] **Unspent balances are forfeited on account deletion — get this reviewed.** Decided
    2026-08-07: no refund, and the units are not returned to the creator's supply either
    (doing both would pay the creator twice for one obligation). It is implemented, and the
    confirmation dialog states it plainly before the user commits. But forfeiting prepaid
    credit is the single most challengeable position in the product under 선불전자지급수단
    rules, and it means a user with under 60% spent now does *worse* by deleting their account
    than by requesting a refund. See DECISIONS 2026-08-07.
  - [ ] **Creator/service termination** — what happens to balances if a creator stops trading
    or motoo closes. Deliberately omitted from `/refund`; still the clause hardest to defend
    leaving out, and more exposed since the 60% path went: past the 7-day window there is now
    no voluntary refund route at all. Account deletion currently *refuses* creator accounts
    for this reason.
  - [x] **고객센터 resolves to something** (2026-08-10) — the footer support link and
    `/refund`'s "신청 방법" section point at `src/lib/support.ts`, a `mailto:` to the owner's
    personal email. Real, but **explicitly interim**: a personal Gmail as the official contact
    channel (and as the 개인정보 보호책임자 contact in `docs/legal/privacy-draft.md`) is fine
    pre-registration, not something to carry into a launch. Swap the one constant.
- [ ] **`CRON_SECRET` must be set in Vercel.** `vercel.json` schedules `/api/cron/purge-accounts`
  daily; the route refuses to run without it, so if it is unset the 30-day deletion grace period
  never expires and no account is ever actually purged.
- [ ] **`/terms` and `/privacy` are still one-line placeholders**, linked from the footer and
  agreed to at onboarding. Blocked on counsel text; the page structure is ready. Lawyer-review
  drafts exist at `docs/legal/terms-draft.md` and `docs/legal/privacy-draft.md` (2026-08-09) —
  not wired into the site; they're for counsel to mark up first.
- [ ] Real PG (Toss/NICE/PortOne), real 본인인증, Kakao login — all blocked on 사업자등록. Mocks
  stand in behind `PaymentProvider` / `VerificationProvider`.
  - Note the age gate is now enforced in `donateMochi`, but the **mock verifier always returns
    an adult** unless `VERIFICATION_MOCK_MINOR=1`. The guardian-consent *collection* flow does
    not exist, so a real minor is currently blocked outright rather than asked.

**Verify on the next deploy**
- [ ] **Share cards on real URLs.** Metadata, OG tags and the per-creator OG image were verified
  locally, but Kakao/X/Facebook debuggers need a public host.
- [ ] **Lighthouse** ≥ 90 performance / ≥ 95 SEO on `/` and `/s/[handle]` — not runnable headless
  here.
- [ ] **CSP is Report-Only.** Watch the violation reports for a week, then enforce. Enforcing
  needs a per-request nonce (Next injects inline scripts, Tailwind inline styles), and
  `style-src 'self'` additionally needs Pretendard self-hosted — see below.

**Known gaps, consciously left**
- [ ] **Pretendard still loads from a CDN `@import`** in `globals.css` — render-blocking, a
  third-party SPOF, and the reason CSP can't tighten to `style-src 'self'`. Self-hosting needs a
  font binary in the repo (Pretendard ships as many woff2 subsets); it is a real size/coverage
  decision, not a mechanical change.
- [ ] **`/home` and `/s/[handle]` still issue 22 and 19 queries** (down from 44 and 50). Getting
  materially below that means consolidating reads, not more caching.
- [ ] **The following list is desktop-only.** The mobile tab bar covers the four primary
  destinations; surfacing the follow list needs a drawer with its own focus management.
- [ ] **No screen-reader or Axe pass.** Focus behaviour, landmarks, accessible names and target
  sizes were verified programmatically; a real AT run has not happened. Heading order unaudited.
- [ ] **No error tracking and no analytics.** Server actions log to `console`; a failing purchase
  is invisible in production.
- [ ] **No pagination anywhere.** Explore is capped at 60, orders at 50, notifications at 30 —
  bounded, but with no "load more".
- [ ] Expanded rails' dividers end where their content ends (DECISIONS 2026-08-02).
- [ ] The edge middleware doesn't check `tokenVersion` — Prisma-free by design, so a revoked
  token can still satisfy the *routing* gate for one request. Every page-level `auth()` does the
  real check. **No action recommended.**

**Maintenance**
- [x] **`package.json#prisma` → `prisma.config.ts`** (2026-08-10, from `main`) — the seed
  command moved and `package.json`'s dead `pnpm.onlyBuiltDependencies` (superseded by
  `pnpm-workspace.yaml`'s `allowBuilds`) went with it. Still the classic engine, not the
  Prisma 7 driver-adapter jump. Gotcha: a `prisma.config.ts` turns off Prisma's automatic
  `.env` loading, so the config calls `process.loadEnvFile()` itself.
- [ ] **Production is three stages behind on schema, and deploying before fixing it will
  break the site.** Prod still has the six Phase-1 tables (~900 rows) and is missing
  `RateLimit` and `Backer.pendingDeletionAt`, so `getCurrentBacker` would error on every
  authenticated page. The build now runs `prisma migrate deploy`, but production needs a
  one-time baseline first — **run [`scripts/baseline-prod.md`](../scripts/baseline-prod.md)**.
  `pnpm check:drift` reports the current state, read-only.
  - **Scope `DATABASE_URL`/`DIRECT_URL` to Production in Vercel before baselining.** Preview
    builds run `prisma migrate deploy` too; sharing the connection string means that once
    prod is baselined, a preview build from any unmerged PR applies pending migrations to
    production. P3005 masks this today — the baseline is what removes the accident. Step 4
    of the runbook.
  - The donation-pivot rename (`purchasedTotal` → `mochiEarnedTotal`, `soldQuantity` →
    `grantedQuantity`, `lifetimeSold` → `lifetimeGranted`) arrived from `main` as a bare
    `db push` that never reached prod. On merge it became
    `prisma/migrations/20260810020000_donation_pivot_rename` — `ALTER TABLE … RENAME
    COLUMN`, so the lifetime totals survive. It applies with the rest once prod is
    baselined; no separate manual step, and **no `--accept-data-loss` push needed**.
- [ ] Vercel Hobby likely ignores `vercel.json`'s `icn1`, so functions run in the US while
  the DB is in Seoul (cross-Pacific latency per query). Revisit on Pro.
- [ ] Carried refactors: route-group layouts (`(marketing)`/`(app)`/`(auth)`) to stop repeating
  `<Nav/>`+`<Footer/>` across 20 pages; `EmptyState` + `PageHeader` primitives (6 and 9 real call
  sites); hardcoded Korean still in `creators/page.tsx`; `Backer` → `User` rename (high churn,
  low value — recommend continuing to defer).

## Current focus

The audit roadmap is complete through Stage 9. What is left is either **blocked on counsel /
사업자등록**, or the growth features that were explicitly scoped out of Stage 9:

1. **Fulfillment SLA** — creator-set promised-by window on items, shown publicly. The trust
   primitive the Trust Report was reaching for, at a fraction of the cost.
2. **Rank-as-narrative** — `getSupporterRank` is computed and displayed but changes nothing;
   "N mochi to the next rank" turns a static number into a loop.
3. **Guided onboarding** — first-follow prompt; the zero-state's three steps all link to
   `/explore`, so it teaches without branching.
4. **Global search**, **creator analytics**.

The design tier 2/3 pass that came in with the donation pivot (Korean eyebrows, styled
selects, 퍼크 cleanup, de-boxed landing sections) is complete — see CHANGELOG 2026-08-10.

## Not built (need a business registration + paid contract — same blocker class)

- [ ] Real Korean PG (Toss/NICE / PortOne) — needs credentials **and** a redirect+confirm flow
- [ ] Real 본인인증 (NICE/PASS/간편인증) — ~₩40/verification + 사업자등록
- [ ] Guardian-consent collection for minors; on-platform fulfillment; admin console

## Real payments — what a live PG needs (not built)

The current `PaymentProvider` is synchronous (`donate` charges inline in a server action) and
only the **mock** adapter exists. A real Toss/NICE integration is not a drop-in adapter:
1. **Merchant credentials** (secret key / sub-merchant onboarding) in env, not repo.
2. **A redirect-based flow**: create a payment → redirect the donor to the PG → handle the
   callback → **server-side confirm** → then grant the mochi bonus. This replaces "charge
   inline, credit in the same request".
3. **Webhook + reconciliation** for async settlement and refunds/voids (`voidCharge` is a mock
   no-op today — and note the account-deletion refund question above would depend on it).

Until then, `PAYMENT_PROVIDER=mock` grants mochi without moving real money.

### Marketplace item guidelines (all optional, off-platform fulfillment for v1)
- Digital/experiential · access passes · physical goods · 1:1 time slots
- Disallowed: financial return, mochi resale/transfer, lottery-for-value, regulated goods

---

## Backlog / explicitly out of scope for now

- Admin console; on-platform fulfillment for access passes; real age verification + guardian
  consent flow; creator termination flow (blocked on the same counsel question as deletion)
