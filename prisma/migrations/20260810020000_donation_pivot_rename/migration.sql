-- The donation pivot (DECISIONS 2026-08-09): mochi is granted as a bonus on a
-- direct donation, never sold. The columns that said "sold"/"purchased" now say
-- what actually happens.
--
-- RENAME, not drop-and-add: every existing row's lifetime totals are the ledger
-- the leaderboard, the ranking and any future refund are computed from. A
-- generated `prisma db push` would have offered to drop and recreate these
-- columns (hence its --accept-data-loss prompt); this preserves the data.
ALTER TABLE "MochiIssuance" RENAME COLUMN "soldQuantity" TO "grantedQuantity";
ALTER TABLE "MochiIssuance" RENAME COLUMN "lifetimeSold" TO "lifetimeGranted";
ALTER TABLE "MochiHolding" RENAME COLUMN "purchasedTotal" TO "mochiEarnedTotal";
