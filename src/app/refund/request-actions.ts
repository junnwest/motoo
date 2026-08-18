"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentBacker } from "@/lib/session";
import { getAdmin } from "@/lib/admin";
import { checkRateLimit } from "@/lib/rateLimit";
import { checkRefundEligibility } from "@/lib/refunds";
import { reportError, reportWarning } from "@/lib/report";

/**
 * Refund intake (docs/PRELAUNCH.md #8). The money leg needs a real PG; the
 * request, the eligibility decision and the audit trail do not — and shipping
 * those first means the day the PG lands there is already a queue and a record
 * to reconcile against.
 */

const requestSchema = z.object({
  donationId: z.string().min(1),
  reason: z.enum(["withdrawal", "legal", "other"]),
  detail: z.string().max(1000).optional().nullable(),
});

export async function requestRefundAction(
  input: z.infer<typeof requestSchema>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = requestSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "generic" };

  const backer = await getCurrentBacker();
  if (!backer) return { ok: false, error: "login" };
  if (!(await checkRateLimit("account", `refund:${backer.id}`))) {
    return { ok: false, error: "tooMany" };
  }

  const donation = await prisma.donation.findUnique({
    where: { id: parsed.data.donationId },
    select: { backerId: true, amountKrw: true, streamerId: true },
  });
  // Ownership checked server-side against the session, never taken from the
  // client — same rule the order-cancel action follows.
  if (!donation || donation.backerId !== backer.id) {
    return { ok: false, error: "notFound" };
  }

  const eligibility = await checkRefundEligibility(parsed.data.donationId);
  if (!eligibility.eligible && eligibility.reason === "alreadyRequested") {
    return { ok: false, error: "alreadyRequested" };
  }

  // An ineligible request is still *accepted*, not blocked. The policy's 법령
  // carve-out (a minor's payment) overrides the 7-day window entirely, so a
  // rule engine refusing to let someone ask would deny a right the page
  // promises. The eligibility answer is recorded and shown to whoever reviews.
  try {
    await prisma.refundRequest.create({
      data: {
        backerId: backer.id,
        donationId: parsed.data.donationId,
        reason: parsed.data.reason,
        detail: parsed.data.detail?.trim() || null,
        eligibleAtRequest: eligibility.eligible,
      },
    });
  } catch (e) {
    // Only the unique index means "already asked". Anything else is a real
    // failure and has to say so — telling someone their request is already on
    // file when it was never written is the worst possible lie here.
    if (
      e &&
      typeof e === "object" &&
      (e as { code?: string }).code === "P2002"
    ) {
      return { ok: false, error: "alreadyRequested" };
    }
    reportError(e, {
      scope: "refund.requestFailed",
      meta: { donationId: parsed.data.donationId },
    });
    return { ok: false, error: "generic" };
  }

  reportWarning(new Error("refund requested"), {
    scope: "refund.requested",
    meta: {
      donationId: parsed.data.donationId,
      amountKrw: donation.amountKrw,
      reason: parsed.data.reason,
      eligible: eligibility.eligible,
    },
  });

  revalidatePath("/profile");
  revalidatePath("/admin");
  return { ok: true };
}

const resolveSchema = z.object({
  requestId: z.string().min(1),
  status: z.enum(["approved", "rejected", "refunded"]),
  resolution: z.string().max(500).optional().nullable(),
});

/**
 * Admin decision. `approved` and `refunded` are separate on purpose: agreeing
 * to refund and the money actually moving are different events, and with no PG
 * yet they can be days apart. Collapsing them would let the record claim a
 * payment that never happened.
 */
export async function resolveRefundAction(
  input: z.infer<typeof resolveSchema>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = await getAdmin();
  if (!admin) return { ok: false, error: "forbidden" };

  const parsed = resolveSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "generic" };

  const req = await prisma.refundRequest.findUnique({
    where: { id: parsed.data.requestId },
    select: {
      donationId: true,
      donation: {
        select: {
          backerId: true,
          streamerId: true,
          amountKrw: true,
          mochiGranted: true,
          refundedAt: true,
        },
      },
    },
  });
  if (!req) return { ok: false, error: "notFound" };

  await prisma.$transaction(async (tx) => {
    await tx.refundRequest.update({
      where: { id: parsed.data.requestId },
      data: {
        status: parsed.data.status,
        reviewedAt: new Date(),
        reviewedBy: admin.email,
        resolution: parsed.data.resolution?.trim() || null,
      },
    });
    // Only "refunded" touches the ledger, because only "refunded" means money
    // moved. Guarded on refundedAt so two admins clicking at once cannot claw
    // the same mochi back twice — the same shape as the double-refund guard in
    // mochi.ts's cancel path.
    if (parsed.data.status === "refunded" && !req.donation.refundedAt) {
      const marked = await tx.donation.updateMany({
        where: { id: req.donationId, refundedAt: null },
        data: { refundedAt: new Date() },
      });
      if (marked.count === 1) {
        // Money back means mochi back. Leaving the bonus behind would make a
        // refund a way to acquire mochi for free, and would leave the creator's
        // leaderboard crediting a donation that no longer exists.
        const holding = await tx.mochiHolding.findUnique({
          where: {
            streamerId_backerId: {
              streamerId: req.donation.streamerId,
              backerId: req.donation.backerId,
            },
          },
          select: { id: true, balance: true },
        });
        if (holding) {
          await tx.mochiHolding.update({
            where: { id: holding.id },
            data: {
              // Clamped: eligibility guaranteed the balance covered this at
              // request time, but approval and payout can be days apart and
              // nothing freezes a balance in between. Never negative.
              balance: Math.max(0, holding.balance - req.donation.mochiGranted),
              mochiEarnedTotal: { decrement: req.donation.mochiGranted },
              krwPaidTotal: { decrement: req.donation.amountKrw },
            },
          });
        }
      }
    }
  });

  revalidatePath("/admin");
  revalidatePath("/profile");
  return { ok: true };
}
