# motoo — Deployment

_Last updated: 2026-07-20_

**Live at [themotoo.com](https://themotoo.com).** Vercel (app) + Supabase Pro
(Postgres, Seoul). Auto-deploy on push to `main`, preview deploys per PR.

> No secrets live in this repo. Connection strings, DB password, and `AUTH_SECRET`
> live only in `.env` / `.env.production.local` (both gitignored) locally and in
> Vercel's env vars. A local `DEPLOY_RUNBOOK.local.md` (gitignored) has the paste-and-run steps.

## Status

| Step | State |
| --- | --- |
| Prisma `directUrl` + `vercel.json` (icn1) | ✅ done |
| Supabase project (Seoul, Data API off) | ✅ created — ref `nrfhwhefabahsfzuyxqu` |
| Push code to GitHub `junnwest/motoo` | ✅ done (main, via HTTPS remote) |
| Schema push + seed to Supabase | ✅ done 2026-07-19 (via `.env.production.local` DIRECT_URL) |
| Vercel project + env vars + deploy | ✅ done 2026-07-20 (project `motoo`, auto-deploy on `main`) |
| Custom domain `themotoo.com` | ✅ done — Squarespace DNS → Vercel (A `76.76.21.21` + CNAME `www`), Let's Encrypt TLS; **www is primary**, apex 308-redirects |
| Production OAuth callbacks | ✅ Google + Naver added for `themotoo.com` |
| Verify deployed site | ✅ `/explore` + `/s/[handle]` render 200 against Supabase, no console errors |

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

## Schema changes after deploy

For the Phase-2 pivot the schema will change. For this demo DB, re-running
`prisma db push` against the direct connection is fine (data is reseedable). If we
harden later, switch to `prisma migrate deploy` in the Vercel build.
