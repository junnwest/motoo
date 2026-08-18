# Owner actions — the things only Kenneth can do

_Everything in [PRELAUNCH.md](PRELAUNCH.md) that no amount of coding closes: console
access, money, a signature, or a decision that isn't a developer's to make. Written as
steps, not reminders, so it can be done in one sitting._

**A1 is done (2026-08-18). A2/A3 and B are what remain — about ten minutes, and both
fix something broken on the live site right now.** C is counsel's clock, not yours. E is three
questions to answer when you feel like it.

---

## A. Vercel environment variables (~10 min)

Where: **vercel.com → the `motoo` project → Settings → Environment Variables**.

⚠️ **Use the dashboard, not `vercel env rm`.** That command deletes a variable across
*every* environment, not the one you name. Re-adding it from the CLI is how production
ended up with an invalid `DATABASE_URL` on 2026-08-10 (error P1013, deploy down until
you fixed it by hand).

⚠️ **Environment variables only take effect on a new deploy.** After adding all of
them, go to **Deployments → the top one → ⋯ → Redeploy**. Do it once, at the end.

### A1 — `CRON_SECRET` (Production) ✅ DONE 2026-08-18

**Why it mattered:** `vercel.json` schedules `/api/cron/purge-accounts` daily at
03:00 KST, and the route fails closed without this secret — an unconfigured deploy
should do nothing, not everything. Until it was set, the 30-day grace period never
expired for anyone, so `/settings` was promising a deletion that had never once run
in production. It runs now.

**Verify any time** — you don't have to wait for 03:00:

```bash
curl -i -H "Authorization: Bearer YOUR_SECRET" \
  https://www.themotoo.com/api/cron/purge-accounts
```

`200` means it ran. `401` means the value doesn't match or the redeploy hasn't
finished. (Safe to run: it only purges accounts whose grace period has already
expired, and there probably aren't any yet.)

Nothing further is needed from me here. An earlier version of this file said the
route still needed the token purges wired in — that was wrong. It already calls all
four (expired accounts, closed rate-limit windows, spent reset tokens, expired email
tokens), and I have since verified the whole route locally: 401 with no secret, 401
with a wrong one, 200 and a real prune with the right one.

### A2 / A3 — Google and Naver login (Production)

**Why:** both are live in dev and **silently absent** on themotoo.com. The code only
registers a provider when its credentials are present, so the buttons simply don't
render — no error, nothing in the logs. Anyone who signed up with Google cannot get
back in.

The four values are already on your machine, in the gitignored `.env` at the repo
root. Open it and copy them across:

| Key | Environment |
| --- | --- |
| `AUTH_GOOGLE_ID` | Production |
| `AUTH_GOOGLE_SECRET` | Production |
| `AUTH_NAVER_ID` | Production |
| `AUTH_NAVER_SECRET` | Production |

**This is the part that is easy to miss.** The OAuth apps themselves also need the
production callback URL registered, or login will fail with `redirect_uri_mismatch`.
The canonical host is **`www.themotoo.com`** (`PROD_CANONICAL_APEX` in
`src/proxy.ts`), so:

- **Google** — console.cloud.google.com → APIs & Services → Credentials → your OAuth
  client → *Authorised redirect URIs* → add:
  ```
  https://www.themotoo.com/api/auth/callback/google
  ```
- **Naver** — developers.naver.com → 내 애플리케이션 → your app → API 설정 →
  *서비스 URL* `https://www.themotoo.com`, *Callback URL*:
  ```
  https://www.themotoo.com/api/auth/callback/naver
  ```

**Verify:** open https://www.themotoo.com/login in a private window. The Google and
Naver buttons should be there. Click one and complete a sign-in.

Kakao stays off — it needs 사업자등록 before Kakao will approve the app.

---

## B. One SQL statement (~2 min)

**Why:** `/admin` — the report queue, the refund queue, escalated order disputes,
creator suspension, item and post takedown — is gated on `Role.admin`, and **nobody in
production has it.** Every moderation surface built this month currently returns 404
to everyone, including you. There is deliberately no UI to grant admin (privilege
escalation should have no in-product path), so this is the only way in.

Where: **supabase.com → project `nrfhwhefabahsfzuyxqu` → SQL Editor → New query**.

```sql
UPDATE "Backer" SET role = 'admin' WHERE email = 'YOUR_LOGIN_EMAIL';
```

Use the email you actually signed up to themotoo.com with. Then confirm it took:

```sql
SELECT email, role FROM "Backer" WHERE role = 'admin';
```

**No logout needed.** The check is a fresh database read on every request, so it
applies to your next page load. Go to https://www.themotoo.com/admin — you should see
the queues instead of a 404.

---

## B2 — the dev seed is in the production database

Found 2026-08-18 while debugging admin access. **63 of 70 accounts and 10 of 12
creators on the live site are seed fixtures**, and they are counted in every
supporter total, leaderboard and headline stat a visitor sees.

The credential half is already closed — you nulled their passwords, and
`pnpm seed:audit --prod` confirms **0** seeded accounts can still log in. What is
left is that the numbers on the site are mostly fiction.

Removing them is written and dry-run, but **not executed**, because it is
irreversible against a live database:

```bash
pnpm seed:audit --prod     # what is there, and what a delete would destroy
pnpm seed:remove --prod    # dry run; prints what it would delete, changes nothing
```

The remover refuses to run, and this is the interesting part: one real holding is
attached to a seeded creator —

```
p.redee80@gmail.com → @creatorA: balance 20, paid 4000 KRW
```

That is **your own** test account, and the 4000 KRW went through the mock PG, so no
money moved. But the script cannot know that, and a cascade would erase it silently,
so it stops. When you are happy to lose it:

```bash
pnpm seed:remove --prod --accept-owner-holding --confirm
```

Also still outstanding: `admin@motoo.dev` is **still an admin**. That demote never ran.

```sql
UPDATE "Backer" SET role = 'backer' WHERE email = 'admin@motoo.dev';
```

(Deleting the seed removes that account entirely, so this only matters if you keep it.)

## A4 — turn Sentry on (2 env vars)

The adapter is written and deployed. It needs a project and a DSN:

1. sentry.io → create a project → platform **Node.js** (not Next.js — this adapter
   is server-side, see below).
2. Copy the DSN.
3. Vercel → Settings → Environment Variables → **Production**:
   - `REPORT_PROVIDER` = `sentry`
   - `SENTRY_DSN` = the DSN
4. Redeploy (or push anything — it redeploys on push).

**Server-side only, on purpose.** The browser half would need Sentry's ingest host
added to `connect-src` in the now-enforced CSP, and puts a third-party script on
the page — which is what currently keeps the cookie banner (#10) unnecessary.
Everything `reportError` is wired into is server-side anyway: the money path,
including the charged-but-not-credited case. Ask and I'll do the client half as
its own change.

If `SENTRY_DSN` is missing it logs a warning and falls back to console rather than
going quiet — silence would look exactly like "no errors", which is the one failure
mode worth engineering against.

## C. Legal — counsel's clock, not yours

| | Action | Why it matters |
| --- | --- | --- |
| C1 | Get `/terms` and `/privacy` drafted and signed off. Drafts for markup are at `docs/legal/terms-draft.md` and `docs/legal/privacy-draft.md`. | Both pages are **one-line placeholders**, and onboarding makes every new user tick a box agreeing to them. This is the largest gap on the site that 사업자등록 would not fix. |
| C2 | Have counsel review `/refund` and `/youth` against them. | `/refund` is the single source of truth for refund copy, and the positions in it are **yours, not a lawyer's**. That was fine while nothing collected money; it stops being fine the same day the PG does. |
| C3 | Decide who is named as 청소년보호책임자 on `/youth`. | It currently lists the 고객센터 address. KR convention is a named person — substitute one when there's an entity to name them under. |
| C4 | Replace the 고객센터 address. | `src/lib/support.ts` points at your personal Gmail. Fine pre-registration, not something to launch on. One constant to change — tell me the address. |

---

## D. If the site breaks after a deploy

| Symptom | Fix |
| --- | --- |
| Pages render but nothing is clickable; browser console says `Refused to execute inline script` | The CSP went from Report-Only to **enforcing** on 2026-08-18. Add `CSP_MODE=report-only` in Vercel (Production) and redeploy — no code change needed. Then send me the violation text. |

Verified working on production at the time of writing, on `/`, `/explore` and
`/youth` — but this is the one change from that day that could take the site down
rather than degrade it, so it gets its own row.

---

## E. Blocked on 사업자등록 — for completeness, not action

The real PG (`PAYMENT_PROVIDER` leaving `mock`), real 본인인증
(`VERIFICATION_PROVIDER`), Kakao login, paying refunds out as money rather than
records, and creator payouts.

The refund **queue** does not wait on this: requests, eligibility decisions and the
audit trail all work now, and "승인" is deliberately separate from "환불 완료" so the
record never claims a payment that hasn't happened. When the PG lands, the
approved-but-not-refunded rows are exactly the reconciliation worklist.

---

## F. Three decisions I should not make for you

| | Question | What hangs on it |
| --- | --- | --- |
| F1 | Should email verification be **required** before donating? | Built, surfaced, and deliberately gating nothing (PRELAUNCH #3). Requiring it costs conversion and buys accountability. That trade is a product call, not a technical one. |
| ~~F2~~ | ✅ **Vercel Analytics — chosen and shipped 2026-08-18.** No cookies, no third-party host, so no consent banner is needed and #10 is closed with it. Nothing for you to configure; it is on by default for the project. Not a funnel tool — say so if you later want one and we'll weigh the banner against it. |
| ~~F3~~ | ✅ **Sentry — chosen and built 2026-08-18.** Two env vars away from live; see A4. |

Answer any of these and I'll build it.

---

## Done

| Action | Outcome |
| --- | --- |
| Fix the production `DATABASE_URL` broken by a CLI re-add | Handled in the dashboard, 2026-08-10. Deploy recovered. |
| Baseline production onto Prisma migrations | 2026-08-10, preserving lifetime totals through the donation-pivot rename. **Never `db push` against production.** |
