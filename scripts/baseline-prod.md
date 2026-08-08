# Adopting Prisma migrations on production — one-time runbook

Run this **once**, before the first deploy of the `audit/product-hardening` branch.
After it, `prisma migrate deploy` runs automatically in the Vercel build and schema
changes stop being a manual step.

Check the current state first — read-only, safe to run any time:

```bash
pnpm check:drift
```

---

## Why this needs a runbook

The project has always used `prisma db push`, so production has **no
`_prisma_migrations` table** and Prisma has no record of what has been applied.
At the same time production is **three stages behind the repo**:

| | production | repo |
| --- | --- | --- |
| `Tier` / `Backing` / `Perk` / `PerkDelivery` / `TrustReport` / `FoundingMembership` | present, **~900 rows** | dropped (Stage 8) |
| `RateLimit` | missing | required (Stage 7) |
| `Backer.pendingDeletionAt` | missing | required (Stage 7) |
| `UpdateVisibility.tier` | present | removed (Stage 9) |

**Deploying the branch before doing this will break the site**, not just the
build: `getCurrentBacker` selects `Backer.pendingDeletionAt`, which production
does not have, so every authenticated page errors.

---

## Step 1 — back up (do not skip)

Step 2 drops six tables and roughly 900 rows. Supabase Pro has PITR; take a
manual snapshot anyway so the restore point is unambiguous:

Supabase dashboard → project `nrfhwhefabahsfzuyxqu` → Database → Backups →
**Create backup**. Wait for it to complete before continuing.

> Those ~900 rows are Phase-1 Trust Report data (tiers, backings, perks,
> reports, founding memberships). The row counts match what `prisma/seed.ts`
> generates, so this is almost certainly seeded demo data rather than anything a
> real user created — but confirm that before dropping it, because it cannot be
> recovered afterwards except from the backup.

## Step 2 — bring production up to the repo schema

```bash
# Uses .env.production.local (DIRECT_URL — the non-pooled connection).
npx dotenv -e .env.production.local -- npx prisma db push --accept-data-loss
```

`--accept-data-loss` is required and is not a formality: it is what drops the six
tables. Re-run `pnpm check:drift` afterwards — it should report
`dropped-in-repo tables still in prod: none`, `RateLimit present: true`,
`Backer.pendingDeletionAt present: true`.

## Step 3 — tell Prisma the baseline is already applied

```bash
npx dotenv -e .env.production.local -- npx prisma migrate resolve --applied 0_init
```

This only writes to `_prisma_migrations`; it does not touch application tables.
Without it the first `migrate deploy` fails with **P3005** (“the database schema
is not empty”) — which is what the local database did, and is why this file
exists.

## Step 4 — set `CRON_SECRET`

Vercel → project → Settings → Environment Variables → add `CRON_SECRET`
(Production). `/api/cron/purge-accounts` refuses to run without it, so until it
is set the 30-day deletion grace period never expires and no account is ever
purged.

Generate one with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

## Step 5 — deploy

Merge and push. The build now runs `prisma migrate deploy && next build`.

---

## After this

Schema changes become: edit `prisma/schema.prisma` → `pnpm db:migrate` (creates a
migration locally against the docker database) → commit the generated folder in
`prisma/migrations/` → push. The Vercel build applies it.

`pnpm db:push` stays available for throwaway local experiments, but anything that
should reach production now goes through a migration.

If a build ever fails on `migrate deploy`, that is the intended behaviour: Vercel
keeps the previous deployment live rather than promoting a build whose schema
does not match. Fix the migration and push again.
