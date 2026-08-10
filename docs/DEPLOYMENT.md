# motoo — Deployment

_Last updated: 2026-08-10_

**Live at [themotoo.com](https://themotoo.com)** (consumer app) and
**[studio.themotoo.com](https://studio.themotoo.com)** (creator console). Both are the
**same** Vercel project + codebase — the split is host-based routing in `src/proxy.ts`
with a session cookie shared across `.themotoo.com` (see `AUTH_COOKIE_DOMAIN` below and
DECISIONS 2026-07-24). Supabase Pro (Postgres, Seoul). Auto-deploy on push to `main`,
preview deploys per PR.

> No secrets live in this repo. Connection strings, DB password, and `AUTH_SECRET`
> live only in `.env` / `.env.production.local` (both gitignored) locally and in
> Vercel's env vars. A local `DEPLOY_RUNBOOK.local.md` (gitignored) has the paste-and-run steps.

## Status

| Step | State |
| --- | --- |
| Prisma `directUrl` + `vercel.json` (icn1) | ✅ done |
| Supabase project (Seoul, Data API off) | ✅ created — ref `nrfhwhefabahsfzuyxqu` |
| Push code to GitHub `junnwest/motoo` | ✅ done (main, via HTTPS remote) |
| Schema push + seed to Supabase | ⚠️ **out of date since 2026-08-10** — code for the donation-pivot rename is on `main`, the prod schema push isn't done yet (needs `--accept-data-loss`, needs real prod credentials nobody used this session). Mochi-related pages are 500ing on production until this runs. See "Schema changes" below. |
| Vercel project + env vars + deploy | ✅ done 2026-07-20 (project `motoo`, auto-deploy on `main`) |
| Custom domain `themotoo.com` | ✅ done — Squarespace DNS → Vercel (A `76.76.21.21` + CNAME `www`), Let's Encrypt TLS; **www is primary**, apex 308-redirects |
| Studio subdomain `studio.themotoo.com` | ✅ done 2026-07-24 — Squarespace `studio` CNAME → `cname.vercel-dns.com`, added on the same Vercel project; serves the creator console (host-split in `src/proxy.ts`) |
| Production OAuth callbacks | ✅ Google + Naver added for `themotoo.com` (studio host redirects login to the apex — **no** studio callbacks) |
| Verify deployed site | ✅ `/explore` + `/s/[handle]` render 200 against Supabase, no console errors |
| Cross-host redirects | ✅ 2026-08-03 — `studio.themotoo.com/*` consumer paths 307 straight to **www** (one hop; previously two via the bare apex) |

> **Note (Hobby plan):** function-region selection via `vercel.json` (`icn1`) is a Pro
> feature — on Hobby it's likely ignored, so functions run in Vercel's default US region
> while the DB is in Seoul (adds cross-Pacific latency per query). Fine for the demo;
> revisit on Pro.

## Env vars (set in Vercel + local `.env`)

| Key | Value source |
| --- | --- |
| `DATABASE_URL` | Supabase → Connect → ORM/Prisma → **pooled** (`:6543`, `?pgbouncer=true`) |
| `DIRECT_URL` | Supabase → Connect → ORM/Prisma → **direct** (`:5432`) |
| `AUTH_SECRET` | `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` |
| `AUTH_TRUST_HOST` | `true` |
| `AUTH_COOKIE_DOMAIN` | `.themotoo.com` (**Production only**, leading dot) — shares the session cookie across `themotoo.com` ↔ `studio.themotoo.com`. **Leave unset** in dev/preview so cookies stay host-only. |
| `PAYMENT_PROVIDER` | `mock` (real Toss/NICE/PortOne needs a merchant contract) |
| `VERIFICATION_PROVIDER` | `mock` (real 본인인증 needs a 본인확인기관 contract) |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | Google Cloud OAuth client — **set locally, live in dev** |
| `AUTH_NAVER_ID` / `AUTH_NAVER_SECRET` | Naver Developers app — **set locally, live in dev** |
| `AUTH_KAKAO_ID` / `AUTH_KAKAO_SECRET` | blank — blocked on business registration |

Supabase project host: `nrfhwhefabahsfzuyxqu` @ `aws-1-ap-northeast-2.pooler.supabase.com`.

> **OAuth redirect URIs** are per-environment. Dev uses
> `http://localhost:3000/api/auth/callback/{google,naver}`. Before deploying, add the
> production callback (`https://<domain>/api/auth/callback/{provider}`) in each provider's
> console. See `.env.example` for the per-provider setup runbook.

## One-time: initialize the Supabase database

With the real strings in a gitignored `.env.production.local` (or exported inline):

```bash
# create tables (uses DIRECT_URL / :5432)
DATABASE_URL="<pooled>" DIRECT_URL="<direct>" pnpm prisma db push

# seed (use the direct :5432 string as DATABASE_URL to avoid pooler quirks on bulk writes)
DATABASE_URL="<direct>" pnpm db:seed
```

## Push to GitHub (from a local terminal with write access)

The in-session git remote is a read-only deploy key, so push locally:

```powershell
git push origin main
# if the deploy key error persists, use HTTPS with your account:
git remote set-url origin https://github.com/junnwest/motoo.git
git push origin main
```

## Vercel setup

1. Vercel → **Add New → Project** → import `junnwest/motoo` (Next.js auto-detected).
2. Add the env vars from the table above.
3. Deploy. Region is pinned to `icn1` via `vercel.json`.
4. After the first deploy, every push to `main` auto-deploys; PRs get preview URLs.

## Schema changes — push the DB **before** the code

**The Vercel build does not run `prisma db push`.** It only runs `prisma generate`
(via `postinstall`), so a deploy carrying a new column ships code that queries a
column the database doesn't have — Prisma throws and every page touching that model
500s. Apply the schema first, then push to `main`:

```powershell
# from the repo root, BEFORE `git push`
npx -y dotenv-cli -e .env.production.local -- npx prisma db push --skip-generate
# expect: "Your database is now in sync with your Prisma schema."
```

`dotenv-cli` scopes the production credentials to that one child process. If you set
`DATABASE_URL` in your shell by hand instead, **close the window afterwards** —
`pnpm db:seed` opens with `deleteMany()` and would wipe production from that shell.

Additive, nullable columns are safe (that's all we'd shipped through 2026-08-02). Without
`--accept-data-loss`, Prisma refuses anything destructive rather than guessing. Data
here is reseedable; if that stops being true, switch to `prisma migrate deploy` in the
Vercel build so this stops being a manual step.

> **2026-08-10 — first destructive schema push, and it went out of order.** The donation
> pivot (DECISIONS 2026-08-09/10) renamed `MochiHolding.purchasedTotal` →
> `mochiEarnedTotal`, `MochiIssuance.soldQuantity` → `grantedQuantity`, `.lifetimeSold` →
> `lifetimeGranted` — a real rename, not additive, so it needs `--accept-data-loss` on
> the prod push, unlike everything before it. **The code was pushed to `main` before the
> prod schema was**, owner's explicit call, accepting that mochi-related pages
> (buy/donate, leaderboards, ranking, Studio dashboard) 500 on production until this
> command runs:
> ```bash
> npx -y dotenv-cli -e .env.production.local -- npx prisma db push --accept-data-loss --skip-generate
> ```
> No local machine used this session has `.env.production.local` — this step still needs
> to be run by someone with real Supabase prod credentials. **This is the most urgent
> open item in PROGRESS.md** until it's done.

Applied this way so far: `MarketplaceItem.coverImage` and `Backer.tokenVersion`
(2026-08-01/02).
