# motoo — Progress Tracker

_Last updated: 2026-08-31_

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
**25 of 36 are done and 3 are partial** (2026-08-11 → 08-18; #36 was added on the 18th when
the dev seed turned up in the production database). What remains is almost entirely things a
developer cannot close: an API key, counsel, or an infrastructure choice.

**[`OWNER-ACTIONS.md`](./OWNER-ACTIONS.md) is the file to open first.** Everything waiting on
Kenneth is collected there. As of 2026-08-18 the console work is done — `CRON_SECRET`, OAuth,
and admin access are all live — and the three product decisions are made (Sentry, Vercel
Analytics, email required to donate).

**The one that blocks the product right now is A5.** Donating requires a confirmed email, and
production has no email provider, so the verification mail is printed to a Vercel log instead
of sent: **nobody can donate, and nobody can fix it themselves.** Tolerable while payments are
mocked and every account is a test one; not tolerable the day a real person signs up. The
Resend adapter is written and needs an account, a verified domain and two env vars.

## Open items — read this first when resuming

`main` is green: `pnpm build`, `pnpm test` (**108**), `check:vocab`, `check:emoji`,
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
  - [ ] **Font licensing for the wordmark (2026-08-28).** Bauhaus 93 (URW) ships as
    outlines, so no font software is redistributed — that part is settled. Open before
    any trademark filing: a logo licence may still be required by URW/Monotype, and the
    "only the font *software* is protected" principle is a US framing (Korean law treats
    font files as computer program works). Cheap now, expensive after filing.
  - [ ] **Creator/service termination** — what happens to balances if a creator stops trading
    or motoo closes. Deliberately omitted from `/refund`; still the clause hardest to defend
    leaving out, and more exposed since the 60% path went: past the 7-day window there is now
    no voluntary refund route at all. Account deletion currently *refuses* creator accounts
    for this reason.
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

**Known gaps, consciously left**
- [ ] **`/home` and `/s/[handle]` issue 18 and 13 queries**, measured 2026-08-18 with
  `DEBUG_QUERIES=1` rather than remembered — the previous numbers in this file were both wrong.
  About six of each are the shell, on every signed-in page. Getting materially below that means
  consolidating reads, not more caching.
- [ ] **Brand pass leftovers (2026-08-28)** — all seen and consciously left, none blocking.
  Footer tagline (`…가장 따뜻한 방법`) is still the soft register the landing moved away
  from, but it's in the `footer` namespace so it shows on every page — cross-app call.
  `StreamerCard`/`CreatorCover` still read as placeholders (owner raised it; shared with
  `/explore`, `/search`, `/home`). `Note`/`Document`/`Scroll` are three near-identical
  page-with-lines icons at 16px. `muted` `#9b8d7c` is 3.23:1, still under AA (was 2.76:1).
  `IconLink` and `IconDocument` have zero references — safe to delete.
- [ ] **No screen-reader pass.** `pnpm check:a11y` (axe over 11 rendered pages) is clean as of
  2026-08-18 and found two missing `main` landmarks on the way. That covers about a third of
  real barriers; a human AT run is still owed, and interaction states are outside what it audits.
- [ ] The edge middleware doesn't check `tokenVersion` — Prisma-free by design, so a revoked
  token can still satisfy the *routing* gate for one request. Every page-level `auth()` does the
  real check. **No action recommended.**

**Pre-launch — LIVE on themotoo.com since 2026-08-29. Obligations, not just a feature**
- **The site is private right now.** Strangers get the welcome page, the legal
  pages and the login/invite doors; everything else redirects. Admins bypass the
  gate entirely, so **a normal browser window shows you the full product — that is
  correct, not a broken gate.** Use a private window to see what a stranger sees.
- **`PRELAUNCH` changes need a REBUILD, not just a redeploy.** It is read in
  `src/proxy.ts`, which is edge middleware, and Next inlines env vars into the edge
  bundle at build time. Setting it in the same minute as a push is a race — the
  first production deploy shipped publicly open for several minutes for exactly
  this reason. Set it, confirm it, *then* trigger a build. Its value cannot be read
  back (`vercel env pull` returns empty for every user-defined variable), so the
  only real check is the deployed site: `/explore` must not answer 200 signed out.
- Unsetting the variable *is* the launch. New routes that must stay publicly
  reachable go in `PUBLIC_PREFIXES` (`src/lib/prelaunch.ts`) or they disappear;
  routes a signed-in creator needs go in `SIGNED_IN_PREFIXES`.
- [ ] **Marketing re-ask is a legal position, not just a feature.** A declined
  마케팅 수신 동의 is re-asked once after onboarding (`Backer.marketingPromptedAt`
  guarantees once). 마케팅 수신 동의 is 선택 by law and cannot be a condition of
  service; the safer alternative — a purpose-limited "출시 알림" consent, which
  reads as a service notification rather than an ad — was offered and not taken.
  Worth raising with counsel alongside the `/refund` questions, and worth
  revisiting if the launch mail is ever the thing blocked by a "no".
- [ ] **Production has zero invites.** Nothing has been minted yet, so nobody can
  sign up. Mint from `/admin` — it builds links against the request host, so they
  come out as `https://www.themotoo.com/join/…` automatically. Prefer one invite
  per creator, labelled with their name: anonymous bulk invites throw away the
  who-redeemed / who-ghosted tracking that per-invite rows exist for.
- [ ] **Two of the four founding-creator promises are unbuilt.** The badge and the
  reserved `@handle` are already true. **Discovery placement at launch** and a
  **direct line / roadmap input** are stated on the public welcome page, which
  makes them as binding as anything on `/refund`. Neither exists yet: nothing
  orders `/explore` by founding status, and there is no contact route beyond
  고객센터. Do these before the first invite goes out, or change the copy.
- [ ] **Email is still the one genuinely missing piece.** `EMAIL_PROVIDER` and
  `RESEND_API_KEY` are absent from Vercel production (confirmed 2026-08-28), so the
  provider falls back to `mock` and verification mail is only printed to a log. The
  Resend adapter itself is written and posts to the real API — this is two env vars
  and a verified domain, not code. Mitigated but not solved for outreach: a creator
  who signs up **with Google is verified on the spot** (OAuth counts as proof, see
  DECISIONS 2026-08-18), so only credentials signups are affected. Still worth
  closing before outreach — we cannot email the creators we just recruited.

**Live design constraints (2026-08-28) — quiet breakage if ignored.** Why: DECISIONS.
- **Page and `--color-card` are both `#ffffff`**, so cards separate by border, not fill.
  Every `bg-card` must keep its `border-line-2`.
- **Two-state geometry**: rectangles square-cornered, `rounded-full` round, nothing
  between; shadows are `0 0 0 1px` outlines, not blur. Token-level — `src/` has zero
  hardcoded radii and zero hardcoded shadows.
- **`Mochi` requires `width`/`height` props**; a sizing `className` is silently ignored
  (dev warns). It is an SVG filled with `currentColor` — **never give it a hard-coded
  fill**; that is what made it collide with the orange and cream surfaces. Set a text
  colour at the call site instead.
- **No `--font-mono`, zero `next/font` imports.** Pretendard only. Check Hangul coverage
  before adding a family — IBM Plex Mono had none and ten Korean call sites fell back.
- **Never claim "100% passthrough"** — the landing says `모투 수수료 0%`, matching the
  donate page's `PG 결제 수수료는 제외`.
- **Never webfont Bauhaus 93**; the wordmark is outlines in `BrandWordmark.tsx`.

**Maintenance**
  - **Do this in the dashboard, never `vercel env rm NAME preview`** — that CLI command
    deletes the *whole* variable rather than one target, and re-adding by piping a value
    to `vercel env add` silently stored something P1013-invalid, which failed the first
    deploy. Sensitive variables also can't be read back (`vercel env pull` returns empty
    strings for them), so the only way to verify a value is to build.
- **`vercel env ls production` is the only source of truth for what production has.**
  `.env.production.local` holds 2-char placeholders and is not production. Both the
  `CRON_SECRET` and OAuth entries here sat stale for ten days claiming they were unset
  when they were live — and that staleness is what let a pre-launch OAuth signup hole
  ship. Check before repeating what this file says about env state.
- [ ] Carried refactors: route-group layouts (`(marketing)`/`(app)`/`(auth)`) to stop repeating
  `<Nav/>`+`<Footer/>` across 20 pages; `EmptyState` + `PageHeader` primitives (6 and 9 real call
  sites); hardcoded Korean still in `creators/page.tsx`; `Backer` → `User` rename (high churn,
  low value — recommend continuing to defer).

## Current focus

The pre-launch sweep (PRELAUNCH.md) is done to the limit of what a developer can close.
**Fulfillment SLA and global search shipped on 2026-08-18** and are struck from this list.
What is left, in the order it is worth doing:

1. **A5 — email delivery.** Blocks donating in production today. See the top of this file.
2. **A4 — Sentry DSN**, and then alerting, which is a Sentry-side setting. `reportError` is
   already wired into the money path, including the charged-but-not-credited case.
3. **Rank-as-narrative** — `getSupporterRank` is computed and displayed but changes nothing;
   "N mochi to the next rank" turns a static number into a loop. It belongs **embedded** —
   the `/home` balance card, the `/profile` holding, the creator page — not on a page of its
   own: `/ranking` was deleted on 2026-08-10 for being a duplicate destination (DECISIONS).
4. **Guided onboarding** — first-follow prompt; the zero-state's three steps all link to
   `/explore`, so it teaches without branching.
5. **Creator analytics** — the Studio now shows money (`설정 정산`, 2026-08-18) but nothing
   about reach: which items sell, which posts are read.

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
