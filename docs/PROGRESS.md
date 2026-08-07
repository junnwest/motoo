# motoo — Progress Tracker

_Last updated: 2026-08-07_

**Read this whole file — it is short on purpose.** Everything in it is either open, blocked,
or a live constraint. Shipped history lives in [`CHANGELOG.md`](./CHANGELOG.md) and does not
need reading to resume work. Rationale lives in [`DECISIONS.md`](./DECISIONS.md) — that file
has a dated index at the top, so read the one entry you need rather than the file. Infra
state is in [`DEPLOYMENT.md`](./DEPLOYMENT.md).

A ten-stage audit ran on 2026-08-06/07 — findings and the plan are in
[`AUDIT-2026-08-06.md`](./AUDIT-2026-08-06.md), what shipped is in CHANGELOG. **The audit doc
is history now, except for its "Open questions" section, which is still live.**

## Open items — read this first when resuming

`main` is green: `pnpm build`, `pnpm test` (24), `check:vocab`, `check:emoji` and **`pnpm lint`
all pass**. Ordered by what would hurt most if ignored.

**Blocks a real launch**
- [ ] **Counsel sign-off on `/refund`, and on two questions it doesn't cover.** The page states
  real positions (7-day 청약철회, 60% 사용 → 잔액 환불, 법령 carve-out) but they are the owner's
  calls, not a lawyer's. Gate on `PAYMENT_PROVIDER` leaving `mock`. Two clauses to take with it:
  - [ ] **What happens to an unspent balance when a purged account is finally deleted.** The
    units return to the creator's supply (decided); whether the *money* is refunded is not.
    Payment settles directly to the creator, so "return only" pays them twice for one
    obligation — and it contradicts the 60% rule. Isolated in `releaseUnspentMochi`
    (`src/lib/accountDeletion.ts`) so it can be answered late. See DECISIONS 2026-08-07.
  - [ ] **Creator/service termination** — what happens to balances if a creator stops trading
    or motoo closes. Deliberately omitted from `/refund`; still the clause hardest to defend
    leaving out. Account deletion currently *refuses* creator accounts for this reason.
- [ ] **`CRON_SECRET` must be set in Vercel.** `vercel.json` schedules `/api/cron/purge-accounts`
  daily; the route refuses to run without it, so if it is unset the 30-day deletion grace period
  never expires and no account is ever actually purged.
- [ ] **`/terms` and `/privacy` are still one-line placeholders**, linked from the footer and
  agreed to at onboarding. Blocked on counsel text; the page structure is ready.
- [ ] Real PG (Toss/NICE/PortOne), real 본인인증, Kakao login — all blocked on 사업자등록. Mocks
  stand in behind `PaymentProvider` / `VerificationProvider`.
  - Note the age gate is now enforced in `buyMochi`, but the **mock verifier always returns an
    adult** unless `VERIFICATION_MOCK_MINOR=1`. The guardian-consent *collection* flow does not
    exist, so a real minor is currently blocked outright rather than asked.

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
- [ ] **Prisma 7 will drop `package.json#prisma`** — every `db push` warns. We only keep
  `{"seed": ...}` there, so migrating to `prisma.config.ts` is small.
- [ ] **Schema pushes to prod are still manual.** The Vercel build runs `prisma generate` but not
  `db push`/`migrate deploy`. Stage 8 dropped six models and added two — that gap is now more
  dangerous than it was. See DEPLOYMENT → "Schema changes".
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

## Not built (need a business registration + paid contract — same blocker class)

- [ ] Real Korean PG (Toss/NICE / PortOne) — needs credentials **and** a redirect+confirm flow
- [ ] Real 본인인증 (NICE/PASS/간편인증) — ~₩40/verification + 사업자등록
- [ ] Guardian-consent collection for minors; on-platform fulfillment; admin console

## Real payments — what a live PG needs (not built)

The current `PaymentProvider` is synchronous (`purchaseMochi` charges inline in a server action)
and only the **mock** adapter exists. A real Toss/NICE integration is not a drop-in adapter:
1. **Merchant credentials** in env, not repo.
2. **A redirect-based flow**: create a payment → redirect to the PG → handle the callback →
   **server-side confirm** → then credit mochi. This replaces "charge inline, credit in the same
   request".
3. **Webhook + reconciliation** for async settlement and refunds/voids (`voidCharge` is a mock
   no-op today — and note the account-deletion refund question above would depend on it).

### Marketplace item guidelines (all optional, off-platform fulfillment for v1)
- Digital/experiential · access passes · physical goods · 1:1 time slots
- Disallowed: financial return, mochi resale/transfer, lottery-for-value, regulated goods

---

## Backlog / explicitly out of scope for now

- Admin console; on-platform fulfillment for access passes; real age verification + guardian
  consent flow; creator termination flow (blocked on the same counsel question as deletion)
