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
At the same time production is **three stages behind the repo**, plus the
donation-pivot rename that arrived with the 2026-08-10 merge:

| | production | repo |
| --- | --- | --- |
| `Tier` / `Backing` / `Perk` / `PerkDelivery` / `TrustReport` / `FoundingMembership` | present, **~900 rows** | dropped (Stage 8) |
| `RateLimit` | missing | required (Stage 7) |
| `Backer.pendingDeletionAt` | missing | required (Stage 7) |
| `UpdateVisibility.tier` | present | removed (Stage 9) |
| `MochiHolding.purchasedTotal`, `MochiIssuance.soldQuantity` / `.lifetimeSold` | present | renamed to `mochiEarnedTotal` / `grantedQuantity` / `lifetimeGranted` (donation pivot) |

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

## Step 2 — bring production up to the **pre-pivot** schema

> **Read this before running anything.** There are now two migrations: `0_init`
> and `20260810020000_donation_pivot_rename` (the donation pivot's column
> rename, merged from `main` on 2026-08-10). `db push` implements a rename as
> *drop the old column, add the new one* — so pushing the current schema
> straight at production would silently zero every `mochiEarnedTotal` and
> `lifetimeGranted` value, and then leave the rename migration pending against
> columns that no longer carry the old names, failing the next build. The point
> of Step 2 is to land prod on the state `0_init` describes, and let the rename
> arrive as a migration, which preserves the values.

```bash
# The schema as of the migration baseline — BEFORE the donation-pivot rename.
git show f4b159f:prisma/schema.prisma > prisma/schema.baseline.prisma

# Uses .env.production.local (DIRECT_URL — the non-pooled connection).
npx dotenv -e .env.production.local -- \
  npx prisma db push --accept-data-loss --schema prisma/schema.baseline.prisma

rm prisma/schema.baseline.prisma
```

`--accept-data-loss` is required and is not a formality: it is what drops the six
tables. Re-run `pnpm check:drift` afterwards — it should report
`dropped-in-repo tables still in prod: none`, `RateLimit present: true`,
`Backer.pendingDeletionAt present: true`. It will also report the three
mochi columns as differing from the repo; that is expected here — Step 5's
deploy is what renames them.

> If production's mochi lifetime totals are known-worthless (seed data only, and
> `check:drift` can tell you the row counts), you may skip the baseline-schema
> dance: push the current schema with `--accept-data-loss` and then mark **both**
> migrations applied in Step 3. That trades the totals for one less step. It is
> the only variant where the rename migration must not run.

## Step 3 — tell Prisma the baseline is already applied

```bash
npx dotenv -e .env.production.local -- npx prisma migrate resolve --applied 0_init
```

This only writes to `_prisma_migrations`; it does not touch application tables.
Without it the first `migrate deploy` fails with **P3005** (“the database schema
is not empty”) — which is what the local database did, and is why this file
exists.

**Only `0_init`.** Leave `20260810020000_donation_pivot_rename` unresolved so the
first deploy applies it for real. (The exception is the shortcut in the note
above, where both get resolved because `db push` already did the rename.)

## Step 4 — scope the database env vars to Production

**Do this before Step 5, and ideally before Step 3.** PRs get Vercel preview
deploys, and the build runs `prisma migrate deploy`. If `DATABASE_URL` /
`DIRECT_URL` are shared with the Preview environment, then once production is
baselined **any preview build from any branch will apply pending migrations to
production** — an unmerged PR quietly mutating the live schema. Today this is
masked by P3005 (previews fail before touching anything); Step 3 removes that
accident of protection.

Vercel → Settings → Environment Variables → scope `DATABASE_URL` and
`DIRECT_URL` to **Production only**, and either give Preview its own Supabase
branch/database or turn preview deploys off.

## Step 5 — set `CRON_SECRET`

Vercel → project → Settings → Environment Variables → add `CRON_SECRET`
(Production). `/api/cron/purge-accounts` refuses to run without it, so until it
is set the 30-day deletion grace period never expires and no account is ever
purged.

Generate one with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

## Step 6 — deploy

Merge and push. The build now runs `prisma migrate deploy && next build`, which
is where `20260810020000_donation_pivot_rename` actually applies. Check the build
log for `Applying migration 20260810020000_donation_pivot_rename`, then load
`/s/<handle>` and the Studio dashboard — those are the pages that read the
renamed columns.

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
