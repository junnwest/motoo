"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentBacker, getCurrentCreator } from "@/lib/session";
import { getAdmin } from "@/lib/admin";
import { checkRateLimit } from "@/lib/rateLimit";
import { notify } from "@/lib/notify";

/**
 * Disputes about a single order (docs/PRELAUNCH.md #30).
 *
 * Cancelling already covers a *pending* order: the fan takes their mochi back
 * without anyone's permission. The gap is a **fulfilled** one — the creator
 * marked it done and nothing arrived — where the fan's only options were a
 * public report about the creator, or nothing. A report is the wrong shape for
 * "my order didn't turn up": it accuses rather than asks, and it cannot end in
 * the thing the fan actually wants, which is the item or the mochi back.
 *
 * One statement, one reply, one escalation. Not a chat: an inbox would need its
 * own moderation surface, its own notification story, and an expectation that
 * someone is reading it — none of which exist, and all of which would be
 * promised by a message box.
 *
 * The creator's way to settle it is the lever they already have: cancel the
 * order, which refunds the mochi through the tested money path. This file
 * never touches balances.
 */

const openSchema = z.object({
  orderId: z.string().min(1),
  reason: z.enum(["not_delivered", "not_as_described", "other"]),
  detail: z.string().trim().min(5).max(1000),
});

export async function openOrderIssueAction(
  input: z.infer<typeof openSchema>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = openSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };

  const backer = await getCurrentBacker();
  if (!backer) return { ok: false, error: "login" };
  if (!(await checkRateLimit("account", `issue:${backer.id}`))) {
    return { ok: false, error: "tooMany" };
  }

  const order = await prisma.order.findUnique({
    where: { id: parsed.data.orderId },
    select: {
      backerId: true,
      status: true,
      streamerId: true,
      item: { select: { title: true } },
      streamer: { select: { ownerId: true, handle: true } },
      issue: { select: { id: true } },
    },
  });
  if (!order || order.backerId !== backer.id) {
    return { ok: false, error: "notFound" };
  }
  // A cancelled order has already returned the mochi — there is nothing left to
  // dispute, and letting one be raised would produce a queue item nobody can
  // action.
  if (order.status === "cancelled") return { ok: false, error: "cancelled" };
  if (order.issue) return { ok: false, error: "alreadyOpen" };

  await prisma.orderIssue.create({
    data: {
      orderId: parsed.data.orderId,
      reason: parsed.data.reason,
      detail: parsed.data.detail,
    },
  });

  // The creator is the one who can fix it, so they are told. Best-effort and
  // after the write, the same rule every other notify() call follows.
  if (order.streamer.ownerId) {
    await notify({
      backerId: order.streamer.ownerId,
      type: "order_issue",
      title: order.item.title,
      link: "/studio#orders",
    });
  }

  revalidatePath("/profile");
  revalidatePath("/studio");
  return { ok: true };
}

const replySchema = z.object({
  issueId: z.string().min(1),
  reply: z.string().trim().min(5).max(1000),
});

/** The creator answers. Scoped to their own Studio, never to an argument. */
export async function replyToOrderIssueAction(
  input: z.infer<typeof replySchema>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = replySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };

  const creator = await getCurrentCreator();
  if (!creator) return { ok: false, error: "forbidden" };

  const issue = await prisma.orderIssue.findUnique({
    where: { id: parsed.data.issueId },
    select: {
      status: true,
      order: {
        select: { streamerId: true, backerId: true, item: { select: { title: true } } },
      },
    },
  });
  if (!issue || issue.order.streamerId !== creator.id) {
    return { ok: false, error: "notFound" };
  }

  await prisma.orderIssue.update({
    where: { id: parsed.data.issueId },
    data: {
      creatorReply: parsed.data.reply,
      repliedAt: new Date(),
      // An escalated issue that gets a reply stays escalated, and a resolved
      // one stays resolved: motoo is already looking at the first, and a reply
      // is not the creator closing their own case in either.
      ...(issue.status === "open" ? { status: "replied" as const } : {}),
    },
  });

  await notify({
    backerId: issue.order.backerId,
    type: "order_issue",
    title: issue.order.item.title,
    link: "/profile#orders",
  });

  revalidatePath("/profile");
  revalidatePath("/studio");
  revalidatePath("/admin");
  return { ok: true };
}

/**
 * The fan closes it, or hands it to motoo.
 *
 * Only the fan can do either. A creator marking their own dispute resolved is
 * the failure mode this whole path exists to prevent — it is the same move as
 * marking an undelivered order fulfilled.
 */
export async function resolveOrderIssueAction(input: {
  issueId: string;
  outcome: "resolved" | "escalated";
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const backer = await getCurrentBacker();
  if (!backer) return { ok: false, error: "login" };

  const issue = await prisma.orderIssue.findUnique({
    where: { id: input.issueId },
    select: { order: { select: { backerId: true } } },
  });
  if (!issue || issue.order.backerId !== backer.id) {
    return { ok: false, error: "notFound" };
  }

  await prisma.orderIssue.update({
    where: { id: input.issueId },
    data:
      input.outcome === "resolved"
        ? { status: "resolved", resolvedAt: new Date(), resolvedBy: "fan" }
        : { status: "escalated", escalatedAt: new Date() },
  });

  revalidatePath("/profile");
  revalidatePath("/studio");
  revalidatePath("/admin");
  return { ok: true };
}

/** An admin closes an escalated dispute, recording who did it. */
export async function closeEscalatedIssueAction(input: {
  issueId: string;
  note: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = await getAdmin();
  if (!admin) return { ok: false, error: "forbidden" };

  await prisma.orderIssue.update({
    where: { id: input.issueId },
    data: {
      status: "resolved",
      resolvedAt: new Date(),
      resolvedBy: admin.email,
      creatorReply: input.note.trim() || undefined,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/profile");
  return { ok: true };
}
