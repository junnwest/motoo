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
 * What happens to an unspent mochi balance when an account is purged.
 *
 * **Nothing. It is forfeited.** Owner decision, 2026-08-07: no refund, and the
 * units are NOT returned to the creator's sellable supply either. The holding
 * rows simply cascade away with the account.
 *
 * The two halves are load-bearing together, which is why there is no code here
 * rather than half of it. Payment settles directly to the creator's
 * sub-merchant at purchase time (spec §8), so:
 *
 *   - no refund + units returned to supply  → the creator is paid, then gets to
 *     sell the same units again: paid twice for one fulfilment obligation.
 *   - no refund + units stay sold (this)    → the creator is paid once and
 *     never has to fulfil. A windfall, but bounded and not resellable.
 *
 * An earlier revision decremented `MochiIssuance.soldQuantity`. That was the
 * first of those, and it was wrong.
 *
 * NOTE — **recorded as the owner's call, not counsel's.** Forfeiting an unspent
 * prepaid balance is the part of this flow most likely to be challenged under
 * the 선불전자지급수단 rules, and it sits awkwardly beside `/refund`, which
 * already promises a 잔액 환불 once 60% is spent. Take it to counsel with the
 * creator/service termination clause. If the answer changes, this is where the
 * refund call goes — the rest of the purge is unaffected.
 */

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
      // Everything the user owns cascades from Backer — holdings (and with
      // them any unspent balance, see above), orders, follows, notifications.
      // See the schema's onDelete: Cascade.
      await prisma.backer.delete({ where: { id: account.id } });
      purged++;
    } catch (err) {
      failed++;
      console.error("purgeExpiredAccounts: failed for", account.id, err);
    }
  }

  return { purged, failed };
}
