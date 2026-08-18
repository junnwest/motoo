"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { getCurrentBacker } from "@/lib/session";
import { getAdmin } from "@/lib/admin";
import { checkRateLimit } from "@/lib/rateLimit";
import { reportWarning } from "@/lib/report";

/**
 * Abuse reporting (docs/PRELAUNCH.md #12).
 *
 * There was no way to tell anyone about a bad creator or item — which mattered
 * more here than in most products, because creator registration auto-approves,
 * so "someone reports it" is the *first* line of defence rather than the last.
 */

const submitSchema = z.object({
  targetType: z.enum(["creator", "item"]),
  targetId: z.string().min(1),
  reason: z.enum(["impersonation", "scam", "sexual", "harassment", "other"]),
  detail: z.string().max(1000).optional().nullable(),
});

export async function submitReportAction(
  input: z.infer<typeof submitSchema>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = submitSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "generic" };

  // Signed-in only. Accountability is the point: an anonymous queue is a spam
  // queue, and a report nobody can follow up on is not worth triaging.
  const backer = await getCurrentBacker();
  if (!backer) return { ok: false, error: "login" };

  if (!(await checkRateLimit("account", `report:${backer.id}`))) {
    return { ok: false, error: "tooMany" };
  }

  try {
    await prisma.report.create({
      data: {
        reporterId: backer.id,
        targetType: parsed.data.targetType,
        targetId: parsed.data.targetId,
        reason: parsed.data.reason,
        detail: parsed.data.detail?.trim() || null,
      },
    });
  } catch (e) {
    // The unique index is the dedupe. Reporting the same thing twice is not an
    // error worth showing — from the user's side it already worked.
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      return { ok: true };
    }
    return { ok: false, error: "generic" };
  }

  // Surfaced where the operator already looks, so a report does not sit in a
  // table nobody queries until someone thinks to.
  reportWarning(new Error("abuse report filed"), {
    scope: "report.submitted",
    meta: {
      targetType: parsed.data.targetType,
      targetId: parsed.data.targetId,
      reason: parsed.data.reason,
    },
  });

  revalidatePath("/admin");
  return { ok: true };
}

const resolveSchema = z.object({
  reportId: z.string().min(1),
  status: z.enum(["actioned", "dismissed"]),
  resolution: z.string().max(500).optional().nullable(),
});

/** Admin triage. Kept separate from suspension on purpose: resolving a report
 *  records a judgement, suspending changes the world, and conflating them would
 *  make "dismissed" ambiguous about whether anything happened. */
export async function resolveReportAction(
  input: z.infer<typeof resolveSchema>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = await getAdmin();
  if (!admin) return { ok: false, error: "forbidden" };

  const parsed = resolveSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "generic" };

  await prisma.report.update({
    where: { id: parsed.data.reportId },
    data: {
      status: parsed.data.status,
      reviewedAt: new Date(),
      reviewedBy: admin.email,
      resolution: parsed.data.resolution?.trim() || null,
    },
  });

  revalidatePath("/admin");
  return { ok: true };
}
