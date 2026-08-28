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
| Schema push + seed to Supabase | ✅ **baselined onto migrations 2026-08-10** — six Phase-1 tables (910 rows) dropped, `RateLimit` / `Backer.pendingDeletionAt` / `_prisma_migrations` present, `0_init` marked applied, `20260810020000_donation_pivot_rename` applied by the build. Live data intact. `pnpm check:drift` reports the state, read-only. |
| Vercel project + env vars + deploy | ✅ done 2026-07-20 (project `motoo`, auto-deploy on `main`) |
| Custom domain `themotoo.com` | ✅ done — Squarespace DNS → Vercel (A `76.76.21.21` + CNAME `www`), Let's Encrypt TLS; **www is primary**, apex 308-redirects |
| Studio subdomain `studio.themotoo.com` | ✅ done 2026-07-24 — Squarespace `studio` CNAME → `cname.vercel-dns.com`, added on the same Vercel project; serves the creator console (host-split in `src/proxy.ts`) |
| Production OAuth callbacks | ✅ Google + Naver added for `themotoo.com` (studio host redirects login to the apex — **no** studio callbacks) |
| Verify deployed site | ✅ `/explore` + `/s/[handle]` render 200 against Supabase, no console errors |
| Cross-host redirects | ✅ 2026-08-03 — `studio.themotoo.com/*` consumer paths 307 straight to **www** (one hop; previously two via the bare apex) |

> **Schema changes now go through migrations (2026-08-07).** The build runs
> `prisma migrate deploy && next build`, so a schema change reaches production by
> committing a folder under `prisma/migrations/` — not by remembering to run
> `db push` by hand. If `migrate deploy` fails the build fails and Vercel keeps the
> previous deployment live, which is the intended behaviour.
>
> **The one-time baseline is done (2026-08-10)** — production has `_prisma_migrations`,
> `0_init` is marked applied, and every migration since arrives with the build.
> [`scripts/baseline-prod.md`](../scripts/baseline-prod.md) is kept as the record of how,
> and for the next environment that needs it. Check drift any time with `pnpm check:drift`
> (read-only).
>
> **`DATABASE_URL` and `DIRECT_URL` are Production-scoped, deliberately.** Preview builds
> run `migrate deploy` too, so sharing them would let an unmerged PR's preview migrate
> production. Preview has no database — give it its own Supabase branch before relying on
> preview deploys again.

> **Region (resolved 2026-08-06):** the account is on **Vercel Pro**, which honours
> single-region pinning, so `vercel.json`'s `icn1` applies and functions run in Seoul
> beside the database. The earlier note here assumed Hobby and warned about
> cross-Pacific latency — that was never the case.
>
> **`CRON_SECRET` is required.** `vercel.json` schedules `/api/cron/purge-accounts`
> daily; the route refuses to run without the secret, so if it's unset the account
> deletion grace period never actually expires and nobody's account is ever purged.

## Env vars (set in Vercel + local `.env`)

| Key | Value source |
| --- | --- |
| `DATABASE_URL` | Supabase → Connect → ORM/Prisma → **pooled** (`:6543`, `?pgbouncer=true`) |
| `DIRECT_URL` | Supabase → Connect → ORM/Prisma → **direct** (`:5432`) |
| `AUTH_SECRET` | `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` |
| `AUTH_TRUST_HOST` | `true` |
| `AUTH_COOKIE_DOMAIN` | `.themotoo.com` (**Production only**, leading dot) — shares the session cookie across `themotoo.com` ↔ `studio.themotoo.com`. **Leave unset** in dev/preview so cookies stay host-only. |
| `PRELAUNCH` | `1` while invite-only (also accepts `true`/`on`; trimmed and case-insensitive, because a trailing newline from `vercel env add` would otherwise fail a strict match and leave the site public — see the CLI warning in PROGRESS). **This is the switch that makes the site public.** With it set, everything except the welcome page, the legal pages and the login/invite doors is private, and an account can only be created by redeeming an `Invite` (`/join/<token>`). Unset or any other value = launched. Launch is this variable plus a redeploy — no code change. |
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

## Schema changes — migrations, applied by the build

**Since 2026-08-07 the build runs `prisma migrate deploy && next build`.** A schema
change reaches production by committing a migration, not by remembering to run
anything by hand:

```bash
# 1. edit prisma/schema.prisma, then generate a migration against local docker
pnpm db:migrate            # prisma migrate dev

# 2. commit the generated prisma/migrations/<timestamp>_<name>/ folder
# 3. push — the Vercel build applies it before building
```

If `migrate deploy` fails, **the build fails and Vercel keeps the previous
deployment live**. That is the point: a build whose schema doesn't match never gets
promoted. Fix the migration and push again.

`pnpm db:push` still exists for throwaway local experiments. Anything that should
reach production goes through a migration.

> **2026-08-10 — the donation pivot's rename came in from `main` as a `db push`,
> and was converted to a migration on merge.** The pivot renamed
> `MochiHolding.purchasedTotal` → `mochiEarnedTotal`, `MochiIssuance.soldQuantity`
> → `grantedQuantity`, `.lifetimeSold` → `lifetimeGranted`. That branch predates
> migrations, so it reached only local dev Postgres and left prod's mochi pages
> (donate, leaderboards, ranking, Studio dashboard) 500ing pending a manual
> `db push --accept-data-loss`. The merge instead commits
> `20260810020000_donation_pivot_rename`, which does the three `ALTER TABLE …
> RENAME COLUMN`s and so **preserves the lifetime totals** a drop-and-recreate
> would have discarded. Prod picks it up from the build like any other migration —
> once prod is baselined (see PROGRESS: `migrate resolve --applied 0_init`), which
> is still the gate on deploying this branch at all.

> **This replaced a manual pre-deploy `db push`,** which was the standing footgun:
> the build only ran `prisma generate`, so a deploy carrying a new column shipped
> code querying a column the database didn't have, and every page touching that
> model 500'd. It went wrong the moment it mattered — by 2026-08-07 production was
> three stages of schema behind the repo without anyone noticing.

**`pnpm check:drift`** reports production's actual schema versus the repo, read-only.
Run it if you're ever unsure.

> If you do need to run something against production by hand, scope the credentials
> to that one process: `npx -y dotenv-cli -e .env.production.local -- <command>`. Never
> export `DATABASE_URL` into your shell — `pnpm db:seed` opens with `deleteMany()`
> and would wipe production from that window.

Applied by hand before migrations existed: `MarketplaceItem.coverImage` and
`Backer.tokenVersion` (2026-08-01/02).
