# Pre-launch checklist — everything NOT blocked by 사업자등록

_Compiled 2026-08-11 by sweeping the codebase, not from memory. Each item was
verified against the source; where something was already tracked elsewhere it
says so._

**The question this answers:** the product loop is built and works — signup →
onboarding → donate → mochi granted → spend in a creator's market → order
fulfilled or cancelled, plus follows, notifications, leaderboards, the Studio,
profile/settings, account deletion, data export, rate limiting, and 26 tests on
the money invariants. So what is left that a **business registration would not
unblock**?

Genuinely blocked by 사업자등록 (and therefore *not* in this list): the real PG,
real 본인인증, Kakao login, real refund execution, and creator payouts.

---

## Tier 1 — a real user cannot complete a normal lifecycle without these

| # | Item | Evidence |
| --- | --- | --- |
| 1 | **Password reset / forgot-password.** No route, no token model, nothing. Signup is credentials-based, so a forgotten password is a permanent lockout with no self-service path. | no `forgot`/`reset-password` match anywhere in `src/` |
| 2 | **Email delivery. There is none.** No `nodemailer`/`resend`/`sendgrid`/SES anywhere. This is the dependency under #1, and also under every receipt, order update and deletion warning. | no mail dependency in `package.json` or `src/` |
| 3 | **Email verification at signup.** Nothing proves the address belongs to the person signing up, so an account can be created on someone else's email and a later "reset" flow would inherit that weakness. | no `emailVerified` field or check |
| 4 | **Change email in settings.** `/settings` covers avatar, nickname, handle and password only. A user whose email changes has no route back into their account. | `src/app/settings/` — three forms, none for email |
| 5 | **`CRON_SECRET` unset in Vercel**, so `/api/cron/purge-accounts` refuses to run. The UI promises deletion after a 30-day grace period; in production that purge has never executed. Config-only fix. | `vercel env ls` — five vars, no `CRON_SECRET` |

## Tier 2 — legal / compliance surface you are already asserting

| # | Item | Evidence |
| --- | --- | --- |
| 6 | **`/terms` and `/privacy` are one-line placeholders**, and onboarding makes users tick a box agreeing to them. Blocked on counsel, not registration. Drafts exist in `docs/legal/`. | `legal.placeholder` in `ko.json` |
| 7 | **Marketing consent cannot be withdrawn.** `marketingConsent` is captured at onboarding and stored, but nothing in `/settings` can change it. 개인정보보호법 expects withdrawal to be as easy as consent. | `prisma/schema.prisma:155`, absent from settings |
| 8 | **No refund intake.** `/refund` states real positions (7-day 청약철회, the 법령 carve-out) with no way to *request* one in-product. The money leg needs the PG; the request and its audit trail do not. | no refund route or action |
| 9 | **No 청소년보호정책.** Commonly expected of KR platforms that admit minors at all — and this one has a minor/guardian-consent code path. | no such page |
| 10 | **Consent/cookie banner** — not required today (no analytics, no third-party scripts), but becomes required the moment item #14 lands. Noting it so it is not forgotten *with* analytics. | — |

## Tier 3 — trust & safety, currently absent entirely

| # | Item | Evidence |
| --- | --- | --- |
| 11 | **Creator registration auto-approves.** `status: "approved"` is set inline at the end of creator onboarding — no review, no impersonation check. Anyone can be "@your-favourite-streamer" and start taking donations within a minute. | `src/app/creator/onboarding/actions.ts:71` |
| 12 | **No report/abuse flow** for a creator, an item, or an update. No 신고 string exists in the copy catalogue. | `grep 신고 messages/ko.json` → none |
| 13 | **No block or mute.** | — |
| 14 | **No admin console.** There is no way to suspend a creator, hide an item, refund out-of-band, or answer a support mail with any authority. Today the only lever is a SQL client against production. | `docs/PROGRESS.md` lists it as not built |
| 15 | **No moderation of user content.** Uploaded images are validated for format and byte size only (`parseImageDataUrl`); item titles, updates and order notes are free text with no review. | `src/lib/imageUpload.ts` |

## Tier 4 — operations: you cannot see the product failing

| # | Item | Evidence |
| --- | --- | --- |
| 16 | **No error tracking.** Server actions log to `console`; a failing donation is invisible in production. For a money product this belongs *before* real payments, not after. | already in PROGRESS |
| 17 | **No analytics** — no funnel, no idea where signup or donation drops off. | already in PROGRESS |
| 18 | **No uptime or health monitoring**, no alerting. | — |
| 19 | **No CI.** `.github/workflows/` does not exist, so `tsc`, `lint`, `check:vocab`, `check:emoji` and the money suite only ever run when someone remembers locally. | `ls .github/workflows` → none |
| 20 | **Tests are money-only.** 26 tests over `mochi.ts`; no component tests, no e2e, nothing covering auth, onboarding, the Studio or the middleware. | `test/` contains one file |
| 21 | **Preview deploys have no database** (env scoped Production-only on 2026-08-10 to stop a preview migrating prod). Correct as a stopgap, but it means no working preview until Preview gets its own Supabase branch. | DEPLOYMENT.md |
| 22 | **No staging environment.** | — |
| 23 | **Backups never restore-tested.** Supabase PITR exists; nobody has proven a restore. | DEPLOYMENT.md |

## Tier 5 — product completeness

| # | Item | Evidence |
| --- | --- | --- |
| 24 | **No pagination anywhere.** Explore caps at 60, orders 50, notifications 30 — bounded, but with no "load more", so the 61st creator is unreachable. | already in PROGRESS |
| 25 | **No loading states.** Zero `loading.tsx` in the app; every navigation waits on the server render with no skeleton. | `find src/app -name loading.tsx` → 0 |
| 26 | **Follow list is desktop-only.** | already in PROGRESS |
| 27 | **Search is explore-scoped only** — no global search across creators, items or updates. | `ExploreFilters` only |
| 28 | **No notification preferences.** Every event type is on, with no per-type mute and no channel choice. | no preference model |
| 29 | **No creator payout/settlement view.** Real numbers need the PG, but the surface — what is owed, what settled, when — does not exist at all. | no `정산`/`payout` in `src/app/studio` |
| 30 | **No fan↔creator messaging or dispute path.** An order that goes wrong has no in-product recourse; the order note is one-way at redemption. | — |
| 31 | **Guardian-consent capture UI.** The money path already blocks a minor without recorded consent, and `guardianConsent` exists in the schema — the *collection* flow is what is missing. Real verification needs 본인인증, but the consent UI does not. | `assertCanPurchase` in `mochi.ts` |
| 32 | **No fulfillment SLA** — creator-set promised-by window, shown publicly. PROGRESS's own growth idea, and the cheapest trust primitive available. | PROGRESS |

## Tier 6 — quality bar

| # | Item | Evidence |
| --- | --- | --- |
| 33 | **No screen-reader or Axe pass.** Focus, landmarks and names were verified programmatically; no real AT run, heading order unaudited. | already in PROGRESS |
| 34 | **CSP is still Report-Only.** Enforcing needs a per-request nonce, since Next injects inline scripts and Tailwind inline styles. The font is no longer the blocker (self-hosted 2026-08-11). | `next.config.ts` |
| 35 | **Query counts.** `/home` now issues 7 parallel queries after the 2026-08-11 sections; `/s/[handle]` ~19. Parallel and narrow, but the number moved. | PROGRESS tracks this |

---

## Suggested order

1. **#2 → #1 → #3 → #4** (email, then password reset, then verification, then
   email change). One dependency chain, and it is the only thing on this list
   that makes the product unusable for a real person today.
2. **#5** — one env var, and it makes a promise in the UI true again.
3. **#16 + #19** — error tracking and CI. Cheap, and everything after this is
   safer to ship with them in place.
4. **#11 + #14** — creator approval and a minimal admin console. These are the
   difference between "a friend signs up" and "strangers can sign up".
5. **#6** — terms and privacy, whenever counsel returns them.
6. The rest, in tier order.
