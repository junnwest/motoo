import { prisma } from "@/lib/db";

/**
 * Account deletion.
 *
 * Deleting is scheduled, not immediate: the account enters a grace period, the
 * user is told when it ends, and signing back in during the window cancels it.
 * Only after it expires is anything destroyed. Owner decision, 2026-08-06.
 */

/** Confirmed by the owner, 2026-08-06. */
export const ACCOUNT_DELETION_GRACE_DAYS = 30;

export function deletionDeadline(from: Date = new Date()): Date {
  const d = new Date(from);
  d.setDate(d.getDate() + ACCOUNT_DELETION_GRACE_DAYS);
  return d;
}

/**
 * What happens to an unspent mochi balance when an account is finally purged.
 *
 * **This is the one open question in the whole flow, and it is deliberately
 * isolated here so it can be answered late without touching anything else.**
 *
 * Decided: the units return to the creator's market supply — `soldQuantity`
 * decrements so they become sellable again. That is what this function does.
 *
 * NOT decided: whether the user gets their money back. Payment settles directly
 * to the creator's sub-merchant at purchase time (spec §8), so returning the
 * units without refunding means the creator can sell the same mochi twice while
 * the purged user receives nothing — double-payment against a single
 * fulfilment obligation. Forfeiting prepaid credit (선불전자지급수단) is also
 * close to the least defensible position under Korean law, and it contradicts
 * `/refund`'s 60% rule: a user below that threshold would do better by deleting
 * their account than by requesting a refund.
 *
 * If counsel says "refund then return", the fix is a `voidCharge`/refund call
 * at the top of this function — the rest of the purge is unaffected. Until
 * then this does the supply return only, and the open question is recorded in
 * docs/AUDIT-2026-08-06.md rather than silently resolved in code.
 */
async function releaseUnspentMochi(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  backerId: string,
): Promise<void> {
  const holdings = await tx.mochiHolding.findMany({
    where: { backerId, balance: { gt: 0 } },
    select: { streamerId: true, balance: true },
  });

  for (const h of holdings) {
    // Return the unspent units to the creator's current tier meter. Clamped at
    // zero: a price raise resets `soldQuantity`, so a holding bought in an
    // earlier tier can legitimately exceed what the current tier has sold, and
    // decrementing past zero would make the availability meter nonsense.
    await tx.$executeRaw`
      UPDATE "MochiIssuance"
      SET "soldQuantity" = GREATEST(0, "soldQuantity" - ${h.balance})
      WHERE "streamerId" = ${h.streamerId}`;
  }
}

/**
 * Schedule deletion and sign the user out everywhere.
 *
 * Bumping `tokenVersion` is what actually revokes the session — sessions are
 * stateless JWTs and Auth.js re-issues the cookie on every authenticated
 * request, so clearing the cookie alone is undone by any in-flight request
 * (DECISIONS 2026-08-02). Same mechanism logout uses.
 */
export async function scheduleAccountDeletion(backerId: string): Promise<Date> {
  const deadline = deletionDeadline();
  await prisma.backer.update({
    where: { id: backerId },
    data: {
      pendingDeletionAt: deadline,
      tokenVersion: { increment: 1 },
    },
  });
  return deadline;
}

/**
 * Cancel a scheduled deletion. Called when a user signs back in during the
 * grace period — that is the cancellation gesture, so it must be cheap and
 * must not require the user to find a setting.
 */
export async function cancelAccountDeletion(backerId: string): Promise<void> {
  await prisma.backer.updateMany({
    where: { id: backerId, pendingDeletionAt: { not: null } },
    data: { pendingDeletionAt: null },
  });
}

export type PurgeResult = { purged: number; failed: number };

/**
 * Destroy every account whose grace period has expired.
 *
 * **Idempotent and resumable**: it selects only rows whose deadline is already
 * past, and each account is purged in its own transaction, so a run that dies
 * halfway leaves the remaining accounts to be picked up by the next one. Never
 * purges in bulk — one bad row shouldn't strand the batch.
 *
 * A creator account is left alone. Deleting a Streamer cascades to its
 * marketplace, orders and every holder's balance, which would destroy other
 * people's money as a side effect of one person leaving. That needs its own
 * flow (creator termination, also with counsel), so those are skipped and
 * reported rather than silently mishandled.
 */
export async function purgeExpiredAccounts(now = new Date()): Promise<PurgeResult> {
  const due = await prisma.backer.findMany({
    where: { pendingDeletionAt: { lte: now } },
    select: { id: true, ownedStreamer: { select: { id: true } } },
  });

  let purged = 0;
  let failed = 0;

  for (const account of due) {
    if (account.ownedStreamer) {
      // Creator accounts need the termination flow, not this one.
      failed++;
      continue;
    }
    try {
      await prisma.$transaction(async (tx) => {
        await releaseUnspentMochi(tx, account.id);
        // Everything else the user owns cascades from Backer (holdings, orders,
        // follows, notifications — see the schema's onDelete: Cascade).
        await tx.backer.delete({ where: { id: account.id } });
      });
      purged++;
    } catch (err) {
      failed++;
      console.error("purgeExpiredAccounts: failed for", account.id, err);
    }
  }

  return { purged, failed };
}
