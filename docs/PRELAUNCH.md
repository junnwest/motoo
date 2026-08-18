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
| ~~5~~ | ✅ **Set by the owner — 2026-08-18.** `/api/cron/purge-accounts` can now run, so the 30-day deletion `/settings` promises finally executes. The route also prunes closed rate-limit windows and expired reset/email tokens — an earlier note here claimed those were written but never called, which was **wrong**: all four have been wired since the route shipped. Verified locally: 401 unauthenticated, 401 on a wrong secret, 200 and a real prune on the right one. | `src/app/api/cron/purge-accounts/route.ts` |

## Tier 2 — legal / compliance surface you are already asserting

| # | Item | Evidence |
| --- | --- | --- |
| 6 | **`/terms` and `/privacy` are one-line placeholders**, and onboarding makes users tick a box agreeing to them. Blocked on counsel, not registration. Drafts exist in `docs/legal/`. | `legal.placeholder` in `ko.json` |
| ~~7~~ | ✅ **Withdrawable — 2026-08-18.** A checkbox in `/settings` that saves on change, no password gate and no save button: withdrawal has to be at least as easy as the single tick that granted it, so friction here would be the thing 개인정보보호법 prohibits. Optimistic, reverting if the write fails. | `src/app/settings/MarketingConsentForm.tsx` |
| ~~8~~ | ✅ **Shipped — 2026-08-18.** Bigger than it read: donations were never recorded, only summed, so the policy's "within 7 days, if not one mochi from that donation has been spent" was not *computable* and fans had no history or receipt. A `Donation` ledger now writes inside `donateMochi`'s transaction; a request form sits on each row in `/profile`; the admin queue triages them. Ineligible requests are accepted, not blocked — the 법령 carve-out overrides the window. Money leg still needs the PG. | `src/lib/refunds.ts`, `src/app/refund/request-actions.ts` |
| ~~9~~ | ✅ **Shipped — 2026-08-18.** `/youth`, linked from the footer and the sitemap. Written from what the code does rather than from a template: §2 describes the money-path block on unconsented minors, §3 admits there is no upload-time review and that moderation is report-then-act. Naming a 청소년보호책임자 needs an entity — tracked as OWNER-ACTIONS C3. | `src/app/youth/page.tsx` |
| 10 | **Consent/cookie banner** — not required today (no analytics, no third-party scripts), but becomes required the moment item #14 lands. Noting it so it is not forgotten *with* analytics. | — |

## Tier 3 — trust & safety, currently absent entirely

| # | Item | Evidence |
| --- | --- | --- |
| ~11~ | ◐ **Suspension enforced — 2026-08-16.** Registration still auto-approves (owner's call: keep self-serve, moderate after), but `suspended` is now a real state. `donateMochi` refuses anything but `approved`, so a suspension stops new money even from a page that was already open. **Still open:** nothing prevents impersonation at registration time; the strongest fix is gating on real 본인인증, which needs 사업자등록. | `src/lib/mochi.ts` |
| ~~12~~ | ✅ **Report flow — shipped 2026-08-18.** 신고 on a creator profile (signed-in only), five reasons plus free text, one report per person per target enforced by a unique index so volume stays a usable triage signal. Lands in an `/admin` queue, oldest first, with actioned/dismissed and who reviewed it. Reports outlive their target on purpose — deleting an item must not erase the evidence. 5 tests. | `src/app/report-actions.ts` |
| ~~13~~ | ✅ **Shipped — 2026-08-18.** Both directions in one table, with deliberately different effects. **Fan → creator** ("숨기기", next to 신고) is curation: gone from explore, the rail and notifications, follow dropped, undoable from `/settings` — necessary, since hiding works well enough that the creator's own page becomes unfindable. **Creator → fan** ("차단", in the Studio supporters list) is safety: no new donations, no follow, off the public leaderboard. It does **not** stop them spending mochi they already hold — blocking a supporter must not confiscate their balance — and the confirmation says so. 4 tests, mostly on that line. | `src/lib/blocks.ts` |
| ~~14~~ | ✅ **Admin console — shipped 2026-08-16.** `/admin`, gated on `Role.admin` (a manual DB update — there is deliberately no UI to grant it), 404 rather than 403 for everyone else. Lists creators, suspends with a required reason, restores. Suspension is audited on the row (`suspendedAt/Reason/By`) and reported to the log. | `src/app/admin/` |
| ~15~ | ◐ **Takedown — 2026-08-18.** An admin can hide a single item or post, written to `hiddenAt` rather than anything the creator controls (a takedown they can undo is not one). Excluded from every listing query, refused by `redeemItem`, tested both ways. Posts are now reportable too — a target an admin can act on and nobody can flag is a lever with no handle. **The controls were missing:** `hideItemAction` shipped with no caller anywhere, so takedown was unreachable from the console until this commit wired both into the report queue. **Still open:** no review of text or images at upload time. | `src/app/admin/ReportRow.tsx` |

## Tier 4 — operations: you cannot see the product failing

| # | Item | Evidence |
| --- | --- | --- |
| ~16~ | ◐ **Sentry adapter shipped — 2026-08-18.** `REPORT_PROVIDER=sentry` + `SENTRY_DSN` sends the money-path catch sites to Sentry, tagged by scope so the list reads as a worklist rather than a feed. Falls back to console (loudly) without a DSN, because silence is indistinguishable from no errors. Server-side only — the browser half needs Sentry's host in `connect-src` plus a third-party script, which would drag #10 in with it. **Still open:** the owner must create the project and set two env vars (OWNER-ACTIONS A4), and nothing pages anyone yet. | `src/lib/reporters/sentry.ts` |
| 17 | **No analytics** — no funnel, no idea where signup or donation drops off. | already in PROGRESS |
| 18 | **No uptime or health monitoring**, no alerting. | — |
| ~~19~~ | ✅ **CI — shipped 2026-08-15.** `.github/workflows/ci.yml` runs typecheck, lint, `check:vocab`, `check:emoji`, the 51-test suite against a real Postgres service, and the production build — on every push to `main` and every PR. Migrations are applied with `migrate deploy`, the same path production takes, so a broken migration fails in CI rather than at deploy. | `.github/workflows/ci.yml` |
| ~20~ | ◐ **106 tests — money, refunds, blocks and SLA (50), search (6), notification prefs (5), disputes (4), reports and takedown (6), routing (10), password reset (13), email verification (12).** Host routing and the onboarding gate are now covered: the two host predicates moved out of `proxy.ts` into `src/lib/hostRouting.ts` so they could be tested at all — the middleware drags the edge runtime in with it, and these are pure string functions. They fail silently when wrong (wrong domain, or a gate walked past), which is exactly why they needed tests. **Still open:** no component tests and no e2e — the latter needs a browser runner, which is an infrastructure choice. | `test/routing.test.ts` |
| 21 | **Preview deploys have no database** (env scoped Production-only on 2026-08-10 to stop a preview migrating prod). Correct as a stopgap, but it means no working preview until Preview gets its own Supabase branch. | DEPLOYMENT.md |
| 22 | **No staging environment.** | — |
| 23 | **Backups never restore-tested.** Supabase PITR exists; nobody has proven a restore. | DEPLOYMENT.md |

## Tier 5 — product completeness

| # | Item | Evidence |
| --- | --- | --- |
| ~~24~~ | ✅ **Shipped — 2026-08-18.** Explore, notifications and both profile lists page on their own query keys. The real work was underneath: explore sorted and range-filtered **in JavaScript after a capped fetch**, which is survivable for one list and simply wrong with a pager — "most supported" would have meant "most supported among the 60 rows this page loaded". Both moved into the database (relation-count `orderBy` with a tiebreak so the order is total; a grouped `having` query for the supporter bands). Plain links, not "load more", so a page survives refresh, back and sharing. | `src/components/Pager.tsx` |
| ~~25~~ | ✅ **Shipped — 2026-08-18.** `loading.tsx` on every consumer route plus the Studio. `ShellSkeleton` renders the real `Nav` (a cookie decode and two indexed reads — cheap, and a copy would drift) with static rails at their exact widths, so nothing moves when the page arrives. `aria-busy` and `motion-reduce:animate-none`, since a pulsing page is what that setting is for. | `src/components/ShellSkeleton.tsx` |
| ~~26~~ | ✅ **Shipped — 2026-08-18.** The Sidebar is `lg:block`, so below that the list of creators someone follows did not exist at all, and the mobile tab bar has no fifth slot. A horizontal avatar strip at the top of `/home`, `lg:hidden` so the two never show at once. Shares the Sidebar's cached query rather than adding one. | `src/components/FollowingStrip.tsx` |
| ~~27~~ | ✅ **Shipped — 2026-08-18.** `/search` across creators, items and posts, from a box in the nav (plus an icon below `sm`, where the box is hidden and the tab bar is full) and an entry in the sidebar. Three grouped result sets rather than one ranked list — a creator, a thing to buy and something someone wrote share no notion of relevance, and merging them would rank by accident. **Supporter-only posts are excluded outright, not listed-and-locked**: a title is content, and search would otherwise hand every locked headline to the people the setting exists to withhold it from. 6 tests, all on what must *not* come back. | `src/lib/search.ts` |
| ~~28~~ | ✅ **Shipped — 2026-08-18.** Per-type mute in `/settings`, enforced in `notify`/`notifyMany` rather than at the seven call sites. The split is deliberate: a creator's activity (`new_item`, `new_update`, `price_raised`) can be turned off, an outcome on *your own order* cannot — `order_cancelled` means mochi returned to your balance, and muting it would mean money moving with no record you were told. The action refuses a mandatory type and so does the filter beneath it; both are tested. Channel choice waits on notification email, which is what this table will hang off. | `src/lib/notificationPrefs.ts` |
| ~~29~~ | ✅ **Shipped — 2026-08-18.** A 후원 정산 section in the Studio: this month, last month, lifetime net, refunded, and the last 20 donations — built on the new `Donation` ledger, which is what made it possible. Two caveats are on the page rather than implied: it reports what was **donated**, not what has been **paid out** (that timing is the PG's, and it is `mock`), and the ledger only starts on 2026-08-18, so anything donated before that is surfaced as its own line instead of quietly missing. | `src/lib/settlement.ts` |
| ~~30~~ | ✅ **Shipped — 2026-08-18.** A dispute scoped to one order, not an inbox. Cancelling already covered a *pending* order; this covers a **fulfilled** one that never arrived, where the fan's only options were a public report about the creator or nothing. One statement, one reply, one escalation to `/admin` — and closing it belongs to the fan, because a creator dismissing a complaint about their own delivery is the same move that caused it. The creator's way to settle is the lever they already have: cancel, which refunds through the tested money path. 4 tests. | `src/lib/orderIssues.ts` |
| ~~31~~ | ✅ **Shipped — 2026-08-18.** `/guardian-consent` records the guardian's name, relation and a contact, gated on what 본인인증 says — never on the form, which would make it a way to self-declare an age. Withdrawable from `/settings`, re-blocking donating at once. The blocked donate error links there instead of dead-ending. Recorded, **not verified**: the guardian's own 본인인증 needs 사업자등록, and the page says so rather than implying otherwise. | `src/app/guardian-consent/` |
| ~~32~~ | ✅ **Shipped — 2026-08-18.** A per-item turnaround the creator sets (1–90 days, blank allowed and default — an invented window is worse than none), shown on the public item card, stamped onto the order at redemption, and surfaced as a due date that turns red when it passes, on both the fan's history and the Studio queue. Stamped rather than read back, so a creator lengthening their window cannot move a deadline already given — that is the test. Ignored for instant items, which have nothing to promise. | `dueAt` in `src/lib/mochi.ts` |

## Tier 6 — quality bar

| # | Item | Evidence |
| --- | --- | --- |
| ~33~ | ◐ **Automated pass — 2026-08-18.** `pnpm check:a11y` runs axe-core over 11 rendered pages in jsdom (needs `pnpm dev` running). It found two real ones: `/` and `/signup` carried `id="main"` on a `<section>`, so the skip link had a target but neither page had a `main` landmark, and everything below the hero sat outside landmarks entirely. Both fixed; the suite is clean. **Still open:** automated tooling catches roughly a third of real barriers and cannot tell you whether the result makes sense to listen to. A human screen-reader run is still owed, and interaction states (open modals) are outside what this audits. | `scripts/check-a11y.ts` |
| ~~34~~ | ✅ **Enforced — 2026-08-18.** Per-request nonce generated in `src/proxy.ts` and threaded onto the request, so Next stamps its inline scripts; `'unsafe-inline'` is gone from `script-src`. `'strict-dynamic'` was tried and **rejected on evidence**: against a real production build Next emits one un-nonced async chunk per shell page, which it would have blocked on every signed-in page. `style-src` keeps `'unsafe-inline'` because a nonce cannot cover `style=""` attributes and Safari lacks `style-src-attr`. Rollback is `CSP_MODE=report-only`, no code change. | `src/lib/csp.ts` |
| ~~35~~ | ✅ **Measurable — 2026-08-18.** `DEBUG_QUERIES=1` logs one line per Prisma call; count a page by loading exactly one. The doc's numbers were both wrong (it said /home 7, /s/[handle] ~19). Measured: **/home 18, /s/[handle] 13, /profile 15, /settings 8, /explore 7**, of which ~6 are the shell on every signed-in page. A per-request *total* is deliberately not offered — two attempts at one silently reported zero, and the reasons are written up in `src/lib/db.ts` because both are traps worth not re-entering. Also removed a redundant `Backer.findUnique` on every signed-in page, found this way. | `src/lib/db.ts` |

---

### 36 — the dev seed is in the production database

Found 2026-08-18. 63 of 70 accounts and 10 of 12 creators on the live site are
fixtures, counted in every supporter total and leaderboard. Credential access is
closed (0 can log in). Removal is written and dry-run but **not executed** —
`pnpm seed:audit --prod` and `pnpm seed:remove --prod`. It refuses while a real
holding is attached to a seeded creator; the one blocker is the owner's own test
account. Tracked in OWNER-ACTIONS B2.

## Needs you, not me

Everything requiring the Vercel console, a database statement, counsel, or a
product decision is collected in **[OWNER-ACTIONS.md](OWNER-ACTIONS.md)** so it
can be done in one sitting: #5 and the missing OAuth vars, the admin role grant,
#6, and the calls behind #3, #16 and #17.

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
