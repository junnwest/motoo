# motoo — Progress Tracker

_Last updated: 2026-09-09_

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

**사업자등록 is done (2026-09-10).** 주식회사 모투 · 대표 이상윤 · 299-87-03781 ·
경기도 화성시 동탄구 동탄중심상가1길 36, 8층 801-211에이호. That unblocks the real PG, real
본인인증, and every `[ ]` the legal drafts were holding open. **통신판매업 신고 is a separate
filing and is still in progress** — the footer already claims 통신판매중개업자, so that wording
is ahead of the filing until the 신고번호 lands.

**A5 (email) is no longer the blocker — the approach changed (2026-09-10).** Rather than stand
up a provider before outreach, invited creators are steered to social sign-in: an OAuth account
is verified on the spot and has no password, so none of the four transactional emails apply to
it. The whole mail surface is verification, password reset, and two change-of-address notices —
**no invitation has ever been an email**; invites are links pasted into DMs. `/forgot` now
offers the support address instead of promising a link it cannot send. This holds *only if
social login actually works for strangers* — see the OAuth console item below, which is now
load-bearing rather than advisory.

## Open items — read this first when resuming

`main` is green: `pnpm build`, `pnpm test` (**125**), `check:vocab`, `check:emoji`,
`check:a11y` and `pnpm lint` all pass. Ordered by what would hurt most if ignored.

**A full test pass over the invite-only deployment ran on 2026-09-09** — the signed-out
gate on production, the whole invite pipeline locally (invite door → invitation → signup →
onboarding → Studio setup → holding page → logout → login), then production's public
surface again. Seven fixes shipped, five of them for things that were live; the reserved
Studio handle became editable and a root OG card was added. Details in CHANGELOG. **The
pipeline itself is sound** — single-use enforcement, the OAuth invite gate, `foundingAt`,
the reserved handle carrying into the Studio, and the gate's allowlist all behave. What
the pass could not cover: real OAuth signup on production, email delivery (still A5), and
Lighthouse.

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
- [ ] **`/terms` and `/privacy` are live as drafts** (2026-09-10, owner's call: a draft beats a
  placeholder while the only visitors are us). Both render as real documents — 제1조–제14조 +
  부칙, and 11항 + 부칙 — carry a 초안 notice, and are `noindex` while `legal.<doc>.draft` is
  set. Deleting that flag removes the banner and the noindex together. **Still unreviewed**, and
  creators consent to them at onboarding, so counsel review remains the open item. Published
  text is corrected against the drafts, not copied: Kakao was described as unlaunched, and
  법정대리인 정보 / 연결된 계정 / 후원 기록 were missing from the 방침 entirely.
  - `[대괄호]` marks what is genuinely undecided: 시행일, 관할, 보호책임자 성명, and the
    service-termination balance rule.
  - **A 마켓 운영정책 now exists too** (`/guidelines`, 2026-09-10). The sell/don't-sell rules
    were already enforced by the admin takedown and creator suspension but lived only in this
    file; both comparable platforms (텀블벅 프로젝트 심사 기준, 투네이션 운영정책) publish one.
  - Open: whether creator/seller terms live inside the 약관 or as a second document, and
    whether the onboarding consent checkbox should be split (이용약관 / 개인정보 separately).
- [ ] Real PG (Toss/NICE/PortOne) and real 본인인증 — **no longer blocked; 사업자등록 landed
  2026-09-10.** Mocks still stand in behind `PaymentProvider` / `VerificationProvider`.
  **Kakao login is not on this list** (2026-09-04) — live, confirmed by a real production
  signup.
  - **All four route decisions taken 2026-09-10** (see DECISIONS): PortOne 통합 본인인증;
    verification stays at onboarding for everyone; a duplicate DI is **refused**, never merged;
    and OAuth linking was fixed separately without waiting for any of this.
  - **APPLIED 2026-09-10. PG partner is KG이니시스.** Three receipts from PortOne: the PG
    가입신청서, the 바로오픈 서비스, and the 간편결제 서비스. KG이니시스 contacts the applicant
    (양준서) within 1–2 영업일 to run the 전자계약. Watch the inbox and the spam folder; they
    also call from unknown numbers.
  - **Order of operations, because it is not parallel:** 전자계약 → 일반결제(카드) 계약·심사 →
    **간편결제 goes live only after that**. Card 심사 runs separately per card company and takes
    roughly two weeks, so 간편결제 is the last thing to come alive.
  - Services selected: **본인인증 + 간편결제 + 신용카드 일반결제**. 정기결제 deliberately not
    selected — nothing in the product recurs, and access passes are redeemed with mochi rather
    than billed. **정기후원 is the feature that would need it**, and adding a method later means
    another ~2-week 카드사 심사 round.
  - **Four questions were asked in the application memo and are all still unanswered.** In
    order of how much they change the build:
    1. **하위가맹점(서브머천트) 구조가 가능한가** — the one that branches everything. If yes,
       money never touches motoo and the 중개자 structure, the footer's 자금 미보유 claim and
       the 통신판매업 conclusion all hold. If motoo must be 대표 가맹점, funds pass through us
       and 전자금융업 registration, three public statements and the settlement design all
       reopen. **Do not build the settlement side until this is answered.**
    2. 카카오 인증에서 **DI**가 반환되는가 — decides whether Kakao can stay in the 본인인증
       picker at all, given one-person-one-account.
    3. 가맹점 심사에 **통신판매업 신고번호**가 필수인가.
    4. **공유오피스(비상주)** 사업장 사진 요건.
  - **KG이니시스 being the partner changes one earlier finding.** Kakao restricts CI by policy,
    but it *is* obtainable through 이니시스 with 별도 서류 작성. So question 2 may have a
    paperwork answer rather than forcing Kakao out of the picker — worth asking for that
    document explicitly during the 전자계약.
  - **Nothing confirmed 본인인증 separately.** The three receipts cover the PG signup, 바로오픈
    and 간편결제. Confirm 본인인증 is actually in scope during the KG이니시스 call rather than
    assuming the checkbox carried.
  - The site is invite-only, so a 심사 reviewer opening themotoo.com sees the welcome page and
    nothing else. The application memo says so and offers a 심사용 초대링크; **mint a separate
    invite for them rather than spending an outreach one.**
  - **가계약 signed 2026-09-11. MID `MOI6675910`. 가계약 expires 2026-10-10.** 본계약 only
    completes at 카드사 심사요청, and **전자결제 is cut off if 본계약 is not reached inside that
    window** — so the whole integration is on a one-month clock, not an open-ended one.
  - **The five steps:** 서비스신청(가계약) ✅ → **전자계약 요청(사전심사)** ← next → 전자서명 →
    카드사 심사요청(본계약 완료) → 카드사 심사완료. Card 심사 itself is 영업일 기준 7–10일.
  - **No 원스탑, because we chose 간편결제.** Normally 가계약 grants a month of card payments
    immediately; 이니시스 states 간편결제(카카오페이) 신청 가맹점 cannot use it and must wait for
    card 심사 to complete. So there is no early payment capability to lean on.
  - **전자서명 needs a 범용공동인증서** for a 법인 (대표자 or 계약담당자). If we do not have one,
    getting it is its own errand and it blocks step 3.

  - **카드사 심사 inspects the live site, and motoo currently fails most of the checklist.**
    This is the real work item, and it is why the payment integration is not a "later" task:
    | 이니시스 요구 | 현재 |
    | --- | --- |
    | 실제 판매 가능한 상품 1~3개 이상 | ❌ invite-only; no creator has listed an item |
    | 가격 등록 (품절·0원·임의가격 불가) | ❌ items are priced in 모찌, not 원 |
    | 배송기간·교환·환불 규정 | ✅ `/refund` + `/guidelines` |
    | 하단 사업자정보 — 상호·등록번호·**연락처**·주소·대표자·**통신판매신고번호** | ⚠️ all present except **전화번호** and **통신판매신고번호** |
    | 구매 시 **이니시스 결제창 노출** (신용카드 필수) | ❌ `PAYMENT_PROVIDER=mock` — there is no 결제창 |
    | 회원 전용 사이트면 **ID/PW 제공** | ✅ solves the invite-gate problem — hand over an account rather than opening the site |

  - **The 통신판매업 신고 conclusion is commercially overridden.** Legally it still stands (제12조
    binds 통신판매업자, not a 중개업자; 거래 0건 is under the 50회 면제). But 이니시스's card-심사
    checklist requires a **통신판매신고번호 in the site footer**, which is exactly the "revisit if
    a card company demands it" condition recorded on 2026-09-10. **And it is circular:** the 신고
    needs a 구매안전서비스 확인증, which this email says is issued only **after 본계약**. Ask
    이니시스 how they expect that loop to be closed — a bank-issued 에스크로 확인증 is the usual
    way out, or they accept it as pending.
  - **정산:** 당월 거래는 익월 8일, 전월 거래는 2영업일 뒤. If 입점 불가 and we fall back to
    임의계약, 정산 한도는 월 200만원 with the excess rolling to the following month.
  - **Direction agreed 2026-09-10: 통합 본인인증 via PortOne**, 토스 first in the picker.
    Free to sign up, one contract also covering the PG, and 건당 40원 — versus 다날's 월정액
    floor of 5만원, which is the wrong shape for ~100 verifications before launch. 토스인증
    returns both `ci` and `di`; Kakao restricts CI by policy (obtainable via KG이니시스 with
    extra paperwork), which matters because the identifier is the whole point.
  - **Why it matters beyond the age gate:** a verified identity is the correct basis for
    "one person, one account", which is what the OAuth auto-link hazard below actually needs.
    **Store DI, not CI** — DI is per-person-per-service and answers the duplicate question
    completely; CI is the same value at every Korean service, so it adds correlation risk and
    breach liability for no benefit here.
  - **The logic layer is built (2026-09-10).** `Backer.verifiedDi` is unique and written by
    `verifyIdentity`; a second account for the same person is refused by the database (P2002,
    not a read-then-write two concurrent onboardings could both pass) and nothing is written
    to the refused account. The mock now models a *person* via `VERIFICATION_MOCK_PERSON`,
    without which the rule was untestable — it used to derive its identifier from `backerId`,
    so one human signing up twice came back as two people. **CI is never stored.** Verified end
    to end in the browser, not only in tests. 14 tests across `verifiedIdentity` and
    `oauthIdentity`.
  - **What is left needs the contract:** the real adapter (redirect + callback, so onboarding's
    verification step still needs restructuring from the current inline resolve), the merchant
    credentials, and a real-identity test — which needs a Korean phone and is Kenneth's.
  - A real adapter is a **redirect + callback** flow, not a drop-in: onboarding's verification
    step needs restructuring, not just a new provider class.
  - The age gate is enforced in `donateMochi`, and the **mock verifier always returns an adult**
    unless `VERIFICATION_MOCK_MINOR=1`. Guardian-consent *collection* now exists
    (`/guardian-consent`, 2026-08-18) — it records a declaration, since verifying the guardian
    needs their own 본인인증.

**Verify on the next deploy**
- [ ] **Share cards on real URLs.** Metadata and both OG images (the per-creator one and,
  since 2026-09-09, a root card covering the welcome page, the invite door and the legal
  pages) are verified locally, but Kakao/X/Facebook debuggers need a public host. Worth
  doing before the first invite goes out: an invite link pasted into a DM previews with
  the root card.
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
- [x] **~~Ordinary OAuth sign-in silently auto-links by email match~~ — fixed 2026-09-10.**
  Resolution is by `LinkedAccount` identity now; an unknown identity on an existing address is
  refused and pointed at 기존 로그인 → /settings 연결. One exception, deliberately: an account
  with no password *and* no linked identities is let through, because it can only have been
  created by OAuth before that table existed and refusing would name a door it never had. It
  heals on that sign-in, so the exception shrinks on its own. 8 tests. **This did not need
  본인인증** — the connected-accounts flow was already the right path. Original note follows.

  ~~**Ordinary OAuth sign-in silently auto-links by email match, with no re-authentication
  step**~~ — unchanged by the 2026-09-04 connected-accounts feature on purpose (see DECISIONS).
  Auth0's own account-linking guidance treats this as the pattern to avoid: a verified email is
  not proof someone can currently authenticate to *both* accounts. Predates today's work: this
  is how `auth.ts`'s `jwt()` callback has always resolved identity. Changing it affects every
  existing user's login, so it needs an owner decision, not a silent fix.

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
- **100 outreach invites are minted and unused** (2026-08-31), labelled
  `outreach-001…100`, with the links in a CSV on Kenneth's Desktop for the
  spreadsheet he and his teammate work from. None redeemed. Owner chose bulk over
  per-creator labelling knowingly: the trade is that the admin table no longer
  tells you who was approached, so the spreadsheet is the only record of who got
  which link — if it is lost, the mapping is unrecoverable.
- [ ] **Five founding test accounts are live in production and should go before
  outreach starts.** The fifth is `qa-pipeline-20260909@motoo.dev`
  (`@qa_pipeline_live`, nickname QA 파이프라인), created 2026-09-09 by running
  the invite pipeline against production on purpose; its invite is labelled
  `qa-2026-09-09` and carries a note saying it is safe to revoke. Delete the
  account and detach `redeemedByBackerId` from that invite, same as the four
  below. The original four are pipeline tests from 2026-08-31/09-03, and each carries
  a 파운딩 크리에이터 badge plus a publicly visible Studio:
  `logout-diag@example.com` (no Studio, left from a logout diagnosis),
  `test1@gmail.com` (`@test1`), `kennethjs@naver.com` (`@test_kakao`), and
  `orangeandmustard@gmail.com` (`@test_google`) — **that last one is Kenneth's real
  address**, so deleting it removes his own account, not just a fixture. Deleting a
  founding account also orphans its spent invite; detach `redeemedByBackerId` first
  or the FK blocks it.
- [ ] **Two of the four founding-creator promises are unbuilt.** The badge and the
  reserved `@handle` are already true — and as of 2026-09-09 the reserved handle is
  also *correctable*, which it was not before (the field `/studio/settings` exists to
  edit was read-only). **Discovery placement at launch** and a
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
