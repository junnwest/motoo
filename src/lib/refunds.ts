import { prisma } from "@/lib/db";

/**
 * Refund eligibility, and the intake around it.
 *
 * `/refund` is the single source of truth for the policy (CLAUDE.md), and this
 * file exists to evaluate what that page promises rather than to restate it:
 *
 *   - **청약철회** — within 7 days of the donation, and only if not one mochi
 *     from it has been spent.
 *   - **법령 carve-out** — a minor's payment without recorded guardian consent,
 *     which the policy honours regardless of the window.
 *
 * The 60% unused-balance path was dropped on 2026-08-09 and is deliberately not
 * implemented here.
 */

/** 7 days, per 전자상거래법 §17 as reflected in /refund. */
export const WITHDRAWAL_WINDOW_DAYS = 7;

export type Eligibility =
  | { eligible: true }
  | { eligible: false; reason: "expired" | "spent" | "alreadyRequested" };

/**
 * Mochi is fungible — a holding is one balance, not a pile of per-donation
 * buckets — so "not one mochi from *that* donation has been spent" needs an
 * interpretation, and the obvious one is wrong. "Balance ≥ what this donation
 * granted" lets a fan spend a donation, donate again, and have the first turn
 * eligible: the bar never rises, so fresh mochi silently backfills spent mochi.
 * (There is a test for exactly this, and it is what caught it.)
 *
 * The rule used instead: the balance must cover everything granted by this
 * donation *and every donation after it*. If a single unit granted since then
 * were missing, that sum would exceed the balance — so nothing from this
 * donation can have been spent, whichever units you imagine went first.
 *
 * Spelled out because a future reader will otherwise assume the check tracks
 * individual units. It does not; it is a rule about totals that is sufficient
 * for the claim the policy makes.
 */
export async function checkRefundEligibility(
  donationId: string,
): Promise<Eligibility> {
  const donation = await prisma.donation.findUnique({
    where: { id: donationId },
    select: {
      backerId: true,
      streamerId: true,
      mochiGranted: true,
      createdAt: true,
      refundRequests: { select: { id: true }, take: 1 },
    },
  });
  if (!donation) return { eligible: false, reason: "expired" };
  if (donation.refundRequests.length > 0)
    return { eligible: false, reason: "alreadyRequested" };

  const ageMs = Date.now() - donation.createdAt.getTime();
  if (ageMs > WITHDRAWAL_WINDOW_DAYS * 24 * 60 * 60 * 1000) {
    return { eligible: false, reason: "expired" };
  }

  const [holding, since] = await Promise.all([
    prisma.mochiHolding.findUnique({
      where: {
        streamerId_backerId: {
          streamerId: donation.streamerId,
          backerId: donation.backerId,
        },
      },
      select: { balance: true },
    }),
    // Everything granted from this donation onward, refunded ones excluded —
    // their mochi is clawed back when the refund completes, so counting them
    // would demand a balance the fan no longer has.
    prisma.donation.aggregate({
      where: {
        backerId: donation.backerId,
        streamerId: donation.streamerId,
        createdAt: { gte: donation.createdAt },
        refundedAt: null,
      },
      _sum: { mochiGranted: true },
    }),
  ]);
  const grantedSince = since._sum.mochiGranted ?? 0;
  if (!holding || holding.balance < grantedSince) {
    return { eligible: false, reason: "spent" };
  }

  return { eligible: true };
}

/** A fan's donations, newest first, each with its current eligibility. */
export async function getDonationsWithEligibility(
  backerId: string,
  take = 20,
  skip = 0,
) {
  const donations = await prisma.donation.findMany({
    where: { backerId },
    orderBy: { createdAt: "desc" },
    skip,
    take: take + 1, // the extra row answers "is there another page"
    select: {
      id: true,
      amountKrw: true,
      mochiGranted: true,
      createdAt: true,
      refundedAt: true,
      streamer: { select: { handle: true, displayName: true } },
      refundRequests: { select: { status: true }, take: 1 },
    },
  });

  const hasMore = donations.length > take;
  const rows = await Promise.all(
    donations.slice(0, take).map(async (d) => ({
      ...d,
      requestStatus: d.refundRequests[0]?.status ?? null,
      eligibility: await checkRefundEligibility(d.id),
    })),
  );
  return { rows, hasMore };
}
