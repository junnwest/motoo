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
| ~~1~~ | ✅ **Password reset — shipped 2026-08-11.** `/forgot` → mailed link → `/reset/[token]`. Hash-only storage, single use, 30 min, no account enumeration, revokes every session on completion. 13 tests. | `src/lib/passwordReset.ts` |
| ~~2~~ | ✅ **Email delivery — shipped 2026-08-11.** `EmailProvider` behind the same abstraction as payments/verification, mock default that prints the message. Swapping in Resend or SES is one adapter + `EMAIL_PROVIDER`. | `src/lib/email/` |
| ~~3~~ | ✅ **Email verification — shipped 2026-08-13.** Sent on signup (best-effort, never fails the signup), resend from `/settings`, `emailVerifiedAt` on `Backer`. Surfaced, deliberately **not** enforced — gating money on an email click is a product call nobody has made. | `src/lib/emailVerification.ts` |
| ~~4~~ | ✅ **Change email — shipped 2026-08-13.** Password-gated, confirmation to the new address, security notice to the old, and the account does not move until the new owner clicks. 12 tests including the claimed-in-between race. | `src/app/settings/EmailForm.tsx` |
| 5 | **`CRON_SECRET` unset in Vercel**, so `/api/cron/purge-accounts` refuses to run. The UI promises deletion after a 30-day grace period; in production that purge has never executed. Config-only fix. **Now also sweeps the two token tables** (`purgeStaleResetTokens`, `purgeStaleEmailTokens`) — wire those into the route when the secret lands. | `vercel env ls` — five vars, no `CRON_SECRET` |

## Tier 2 — legal / compliance surface you are already asserting

| # | Item | Evidence |
| --- | --- | --- |
| 6 | **`/terms` and `/privacy` are one-line placeholders**, and onboarding makes users tick a box agreeing to them. Blocked on counsel, not registration. Drafts exist in `docs/legal/`. | `legal.placeholder` in `ko.json` |
| ~~7~~ | ✅ **Withdrawable — 2026-08-18.** A checkbox in `/settings` that saves on change, no password gate and no save button: withdrawal has to be at least as easy as the single tick that granted it, so friction here would be the thing 개인정보보호법 prohibits. Optimistic, reverting if the write fails. | `src/app/settings/MarketingConsentForm.tsx` |
| 8 | **No refund intake.** `/refund` states real positions (7-day 청약철회, the 법령 carve-out) with no way to *request* one in-product. The money leg needs the PG; the request and its audit trail do not. | no refund route or action |
| 9 | **No 청소년보호정책.** Commonly expected of KR platforms that admit minors at all — and this one has a minor/guardian-consent code path. | no such page |
| 10 | **Consent/cookie banner** — not required today (no analytics, no third-party scripts), but becomes required the moment item #14 lands. Noting it so it is not forgotten *with* analytics. | — |

## Tier 3 — trust & safety, currently absent entirely

| # | Item | Evidence |
| --- | --- | --- |
| ~11~ | ◐ **Suspension enforced — 2026-08-16.** Registration still auto-approves (owner's call: keep self-serve, moderate after), but `suspended` is now a real state. `donateMochi` refuses anything but `approved`, so a suspension stops new money even from a page that was already open. **Still open:** nothing prevents impersonation at registration time; the strongest fix is gating on real 본인인증, which needs 사업자등록. | `src/lib/mochi.ts` |
| ~~12~~ | ✅ **Report flow — shipped 2026-08-18.** 신고 on a creator profile (signed-in only), five reasons plus free text, one report per person per target enforced by a unique index so volume stays a usable triage signal. Lands in an `/admin` queue, oldest first, with actioned/dismissed and who reviewed it. Reports outlive their target on purpose — deleting an item must not erase the evidence. 5 tests. | `src/app/report-actions.ts` |
| 13 | **No block or mute.** | — |
| ~~14~~ | ✅ **Admin console — shipped 2026-08-16.** `/admin`, gated on `Role.admin` (a manual DB update — there is deliberately no UI to grant it), 404 rather than 403 for everyone else. Lists creators, suspends with a required reason, restores. Suspension is audited on the row (`suspendedAt/Reason/By`) and reported to the log. | `src/app/admin/` |
| ~15~ | ◐ **Item takedown — 2026-08-18.** An admin can hide a single item, written to `hiddenAt` rather than the creator's own `active` switch (a takedown they can undo is not one). Excluded from every listing query and refused by `redeemItem`, both tested. **Still open:** no review of text or images at upload time, and no takedown for updates. | `src/app/admin/actions.ts` |

## Tier 4 — operations: you cannot see the product failing

| # | Item | Evidence |
| --- | --- | --- |
| ~16~ | ◐ **Error reporting — shipped 2026-08-15, half done.** `reportError` / `reportWarning` behind a `REPORT_PROVIDER` abstraction; the console adapter emits one line of JSON, which is what a log drain wants. Wired into the money-path catch sites, including the charged-but-not-credited case that was previously invisible. **Still open:** a real backend (the Sentry adapter is a commented stub) and alerting — a log nobody is paged on is not monitoring. | `src/lib/report.ts` |
| 17 | **No analytics** — no funnel, no idea where signup or donation drops off. | already in PROGRESS |
| 18 | **No uptime or health monitoring**, no alerting. | — |
| ~~19~~ | ✅ **CI — shipped 2026-08-15.** `.github/workflows/ci.yml` runs typecheck, lint, `check:vocab`, `check:emoji`, the 51-test suite against a real Postgres service, and the production build — on every push to `main` and every PR. Migrations are applied with `migrate deploy`, the same path production takes, so a broken migration fails in CI rather than at deploy. | `.github/workflows/ci.yml` |
| 20 | **Thin test coverage.** 60 tests — money (30), password reset (13), email verification (12), reports (5) — but still no component tests, no e2e, and nothing covering onboarding, the Studio or the middleware. | `test/` |
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

1. ~~**#2 → #1 → #3 → #4**~~ — **done 2026-08-11/13.** The whole account-access
   chain: email delivery, password reset, verification, email change.
2. **#5** — one env var, and it makes a promise in the UI true again.
3. **#16 + #19** — error tracking and CI. Cheap, and everything after this is
   safer to ship with them in place.
4. **#11 + #14** — creator approval and a minimal admin console. These are the
   difference between "a friend signs up" and "strangers can sign up".
5. **#6** — terms and privacy, whenever counsel returns them.
6. The rest, in tier order.
