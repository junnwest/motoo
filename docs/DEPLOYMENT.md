# motoo — Deployment

_Last updated: 2026-07-09_

**Target:** Vercel (app, region `icn1` Seoul) + Supabase Pro (Postgres, region Seoul).
Auto-deploy on push to `main`, preview deploys per PR.

> No secrets live in this repo. Connection strings, DB password, and `AUTH_SECRET`
> live only in `.env` (gitignored) locally and in Vercel's env vars.

## Status

| Step | State |
| --- | --- |
| Prisma `directUrl` + `vercel.json` (icn1) | ✅ done |
| Supabase project (Seoul, Data API off) | ✅ created — ref `nrfhwhefabahsfzuyxqu` |
| Schema push + seed to Supabase | ⏳ blocked — need DB password |
| Push code to GitHub `junnwest/motoo` | ⏳ blocked — session git uses a read-only deploy key |
| Vercel project + env vars + deploy | ⏳ pending |
| Verify deployed site | ⏳ pending |

## Env vars (set in Vercel + local `.env`)

| Key | Value source |
| --- | --- |
| `DATABASE_URL` | Supabase → Connect → ORM/Prisma → **pooled** (`:6543`, `?pgbouncer=true`) |
| `DIRECT_URL` | Supabase → Connect → ORM/Prisma → **direct** (`:5432`) |
| `AUTH_SECRET` | `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` |
| `AUTH_TRUST_HOST` | `true` |
| `PAYMENT_PROVIDER` | `mock` |

Supabase project host: `nrfhwhefabahsfzuyxqu` @ `aws-1-ap-northeast-2.pooler.supabase.com`.

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
