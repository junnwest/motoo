# motoo — Progress Tracker

_Last updated: 2026-08-18_

**Read this whole file — it is short on purpose.** Everything in it is either open, blocked,
or a live constraint. Shipped history lives in [`CHANGELOG.md`](./CHANGELOG.md) and does not
need reading to resume work. Rationale lives in [`DECISIONS.md`](./DECISIONS.md) — that file
has a dated index at the top, so read the one entry you need rather than the file. Infra
state is in [`DEPLOYMENT.md`](./DEPLOYMENT.md).

A ten-stage audit ran on 2026-08-06/07 — findings and the plan are in
[`AUDIT-2026-08-06.md`](./AUDIT-2026-08-06.md), what shipped is in CHANGELOG. **The audit doc
is history now, except for its "Open questions" section, which is still live.**

**Pre-launch scope:** [`PRELAUNCH.md`](./PRELAUNCH.md) is the exhaustive list of what is left
that 사업자등록 would *not* unblock (compiled 2026-08-11 by sweeping the code, 35 items).
**20 of the 35 are now done and 3 are partial** (2026-08-11 → 08-18). What remains is almost
entirely things a developer cannot close: console access, counsel, or a vendor choice.

**[`OWNER-ACTIONS.md`](./OWNER-ACTIONS.md) is the file to open first.** Everything waiting on
Kenneth is collected there — the Vercel env vars, one SQL statement, counsel, three product
decisions — so it can be done in one sitting. Two of them are load-bearing today:
`CRON_SECRET` is unset (so the account deletion the UI promises has never run in production),
and **nobody holds `Role.admin`, so the report, refund and dispute queues are unreachable on
the live site.**

## Open items — read this first when resuming

`main` is green: `pnpm build`, `pnpm test` (**96**), `check:vocab`, `check:emoji`,
`check:a11y` and `pnpm lint` all pass. Ordered by what would hurt most if ignored.

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
- [ ] **`CRON_SECRET` must be set in Vercel** (OWNER-ACTIONS A1). `vercel.json` schedules
  `/api/cron/purge-accounts` daily; the route refuses to run without it, so the 30-day deletion
  grace period never expires and no account is ever actually purged. Once it is set, the route
  still needs `purgeStaleResetTokens` / `purgeStaleEmailTokens` wired in — both written and
  tested, neither called.
- [ ] **Nobody holds `Role.admin` in production** (OWNER-ACTIONS B1), so `/admin` — the report
  queue, refund queue, escalated disputes, suspension and takedown — 404s for everyone. There is
  deliberately no UI to grant it; it is one `UPDATE`.
- [ ] **`/terms` and `/privacy` are still one-line placeholders**, linked from the footer and
  agreed to at onboarding. Blocked on counsel text; the page structure is ready. Lawyer-review
  drafts exist at `docs/legal/terms-draft.md` and `docs/legal/privacy-draft.md` (2026-08-09) —
  not wired into the site; they're for counsel to mark up first.
- [ ] Real PG (Toss/NICE/PortOne), real 본인인증, Kakao login — all blocked on 사업자등록. Mocks
  stand in behind `PaymentProvider` / `VerificationProvider`.
  - The age gate is enforced in `donateMochi`, and the **mock verifier always returns an adult**
    unless `VERIFICATION_MOCK_MINOR=1`. Guardian-consent *collection* now exists
    (`/guardian-consent`, 2026-08-18) — it records a declaration, since verifying the guardian
    needs their own 본인인증.

**Verify on the next deploy**
- [ ] **Share cards on real URLs.** Metadata, OG tags and the per-creator OG image were verified
  locally, but Kakao/X/Facebook debuggers need a public host.
- [ ] **Lighthouse** ≥ 90 performance / ≥ 95 SEO on `/` and `/s/[handle]` — not runnable headless
  here.
- [x] ~~CSP is Report-Only~~ — **enforcing since 2026-08-18**, with a per-request nonce from
  `src/proxy.ts`. `'strict-dynamic'` was tried and rejected on evidence (Next emits one
  un-nonced chunk per shell page). Rollback is `CSP_MODE=report-only`, no code change. Verified
  on the live site.

**Known gaps, consciously left**
- [x] ~~Pretendard loads from a CDN `@import`~~ — **self-hosted 2026-08-11** as a 92-file
  dynamic subset in `public/fonts/pretendard/` (3.1MB in the repo; a page fetches only the
  unicode ranges it renders — `/s/[handle]` pulls 17). CSP dropped its jsdelivr exception in
  `style-src` and `font-src`; what still blocks enforcing is `unsafe-inline`, not the font.
- [ ] **`/home` and `/s/[handle]` issue 18 and 13 queries**, measured 2026-08-18 with
  `DEBUG_QUERIES=1` rather than remembered — the previous numbers in this file were both wrong.
  About six of each are the shell, on every signed-in page. Getting materially below that means
  consolidating reads, not more caching.
- [x] ~~The following list is desktop-only~~ — **an avatar strip at the top of `/home` below
  `lg` (2026-08-18)**, which needed no drawer and no focus management.
- [ ] **No screen-reader pass.** `pnpm check:a11y` (axe over 11 rendered pages) is clean as of
  2026-08-18 and found two missing `main` landmarks on the way. That covers about a third of
  real barriers; a human AT run is still owed, and interaction states are outside what it audits.
- [ ] **No analytics, and no error *backend*.** `reportError`/`reportWarning` exist behind
  `REPORT_PROVIDER` and are wired into the money path, but the only adapter prints JSON to the
  console — a log nobody is paged on is not monitoring. Both need a vendor choice
  (OWNER-ACTIONS F2/F3).
- [x] ~~No pagination anywhere~~ — **explore, notifications and both `/profile` lists page on
  their own query keys (2026-08-18)**. The real work was moving explore's sort and supporter-band
  filter into the database; both ran in JavaScript over a capped fetch, which is wrong the moment
  there are pages.
- [x] ~~Expanded rails' dividers end where their content ends~~ — **fixed 2026-08-11** by
  boxing all three shell columns instead of dividing them with lines. The fix everyone
  reached for (force the rails to full height) would have cost their content-sized scroll
  behaviour; a box just reads as a short box. See DECISIONS 2026-08-11.
- [ ] The edge middleware doesn't check `tokenVersion` — Prisma-free by design, so a revoked
  token can still satisfy the *routing* gate for one request. Every page-level `auth()` does the
  real check. **No action recommended.**

**Maintenance**
- [x] **`package.json#prisma` → `prisma.config.ts`** (2026-08-10, from `main`) — the seed
  command moved and `package.json`'s dead `pnpm.onlyBuiltDependencies` (superseded by
  `pnpm-workspace.yaml`'s `allowBuilds`) went with it. Still the classic engine, not the
  Prisma 7 driver-adapter jump. Gotcha: a `prisma.config.ts` turns off Prisma's automatic
  `.env` loading, so the config calls `process.loadEnvFile()` itself.
- [x] **Production baselined onto migrations and deployed** (2026-08-10). The six Phase-1
  tables and their 910 rows are dropped, `RateLimit` / `Backer.pendingDeletionAt` /
  `_prisma_migrations` are present, `0_init` is marked applied, and the build applied
  `20260810020000_donation_pivot_rename` for real — so the lifetime totals survived the
  rename instead of being reset by a drop-and-add. Live data came through intact (70
  backers, 12 streamers, 11 holdings, 5 orders) and `/s/[handle]`, `/donate` and the OG
  image all render 200 with a populated leaderboard. `pnpm check:drift` stays as the
  read-only way to ask.
- [x] **`DATABASE_URL` / `DIRECT_URL` scoped to Production only.** Preview builds run
  `prisma migrate deploy` too, so a shared connection string meant any unmerged PR's
  preview could apply migrations to production once prod had `_prisma_migrations`. P3005
  had been masking it; baselining would have removed that accident of protection.
  - **Do this in the dashboard, never `vercel env rm NAME preview`** — that CLI command
    deletes the *whole* variable rather than one target, and re-adding by piping a value
    to `vercel env add` silently stored something P1013-invalid, which failed the first
    deploy. Sensitive variables also can't be read back (`vercel env pull` returns empty
    strings for them), so the only way to verify a value is to build.
- [ ] **`CRON_SECRET` is still unset in Vercel**, so `/api/cron/purge-accounts` refuses to
  run and no account is ever actually purged after its 30-day grace period.
- [ ] **The four OAuth vars are missing from Vercel** — `AUTH_GOOGLE_ID`/`SECRET`,
  `AUTH_NAVER_ID`/`SECRET`. `src/auth.ts` only registers a provider when its credentials
  are present, so **Google and Naver login silently don't exist on production**; the
  buttons are gated by the same check, so nothing errors, they just aren't there. They work
  in dev because the credentials are in the local `.env`.
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
   "N mochi to the next rank" turns a static number into a loop. It belongs **embedded** —
   the `/home` balance card, the `/profile` holding, the creator page — not on a page of its
   own: `/ranking` was deleted on 2026-08-10 for being a duplicate destination (DECISIONS).
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
