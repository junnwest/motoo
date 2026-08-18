# Owner actions — the things only Kenneth can do

_Everything in [PRELAUNCH.md](PRELAUNCH.md) that no amount of coding closes:
console access, money, a signature, or a decision that isn't a developer's to
make. Kept here so they can be done in one sitting instead of surfacing one at a
time._

Status legend: **OPEN** = still needed · **DONE** = handled, kept for the record.

---

## A. Vercel console — ~10 minutes, all of it

Use the **dashboard**, not `vercel env rm`: that command deletes the variable
across every target, not the one you name, and re-adding it from the CLI is how
production once ended up with an invalid `DATABASE_URL` (P1013, 2026-08-10).

| | Variable | Target | Why it matters | Status |
| --- | --- | --- | --- | --- |
| A1 | `CRON_SECRET` | Production | `/api/cron/purge-accounts` refuses to run without it. `/settings` promises deletion after a 30-day grace period, and in production that purge **has never executed** — so the promise is currently false. Any long random string. | **OPEN** |
| A2 | `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | Production | Google login is live in dev and **silently absent** on themotoo.com — the button is gone, with no error to notice. Values are already in your local `.env`. | **OPEN** |
| A3 | `AUTH_NAVER_ID` / `AUTH_NAVER_SECRET` | Production | Same, for Naver. Also already in `.env`. | **OPEN** |

After A1 lands, tell me — the cron route still needs `purgeStaleResetTokens` and
`purgeStaleEmailTokens` wired into it (both are written and tested, just not
called), and there is no point wiring a route that can't run.

## B. Database — one statement

| | Action | Why | Status |
| --- | --- | --- | --- |
| B1 | Grant yourself `Role.admin`: `UPDATE "Backer" SET role = 'admin' WHERE email = '…';` | `/admin` — the report queue, refund queue, creator suspension, item takedown — 404s for everyone without it. There is deliberately **no UI** to grant admin, so this is the only way in, and right now nobody in production can reach any of it. | **OPEN** |

## C. Legal — needs counsel, not code

| | Action | Why | Status |
| --- | --- | --- | --- |
| C1 | Get `/terms` and `/privacy` drafted and signed off. Drafts are in `docs/legal/`. | Both pages are **one-line placeholders**, and onboarding makes every new user tick a box agreeing to them. That is the single largest gap on the site that isn't blocked by 사업자등록. (PRELAUNCH #6) | **OPEN** |
| C2 | Review `/refund` and `/youth` against C1 once they land. | `/refund` is the single source of truth for refund copy and must not contradict the terms. The positions in it are **yours, not counsel's** — that was fine while nothing collected money, and stops being fine at the same moment the PG does. | **OPEN** |
| C3 | Decide who is named as 청소년보호책임자 on `/youth`. | The page ships with the 고객센터 address as the contact. KR convention is a named person; substitute one when there is a business entity to name them under. | **OPEN** |

## D. Blocked on 사업자등록 — for completeness, not action

Nothing here is doable before registration, and none of it is in PRELAUNCH:
the real PG (`PAYMENT_PROVIDER` leaving `mock`), real 본인인증
(`VERIFICATION_PROVIDER`), Kakao login, executing refunds as money rather than
records, and creator payouts.

The refund **queue** does not wait on this — requests, eligibility decisions and
the audit trail all work now, and approving is deliberately separate from
"환불 완료" so the record never claims a payment that hasn't happened. When the
PG lands, the approved-but-not-refunded rows are exactly the worklist.

## E. Decisions I should not make for you

| | Question | Where it bites | Status |
| --- | --- | --- | --- |
| E1 | Should email verification be **enforced** before donating? | Built and surfaced, deliberately not gating anything (PRELAUNCH #3). Enforcing it costs conversion and buys accountability; that trade is a product call. | **OPEN** |
| E2 | Analytics: which vendor, and self-hosted or not? | PRELAUNCH #17, and it drags #10 (cookie banner) in with it — the banner is not required today precisely because there are no third-party scripts. | **OPEN** |
| E3 | Error backend: Sentry, or a log drain? | PRELAUNCH #16 is half-built behind `REPORT_PROVIDER`; the adapter is ~20 lines once the vendor is chosen. A log nobody is paged on isn't monitoring. | **OPEN** |

---

## Done

| | Action | Outcome |
| --- | --- | --- |
| — | Fix the production `DATABASE_URL` broken by a CLI re-add | Handled in the dashboard, 2026-08-10. Deploy recovered. |
| — | Baseline production onto Prisma migrations | Done 2026-08-10, preserving lifetime totals through the donation-pivot rename. Never `db push` at production. |
