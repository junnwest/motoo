"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentBacker, getCurrentCreator } from "@/lib/session";
import { checkRateLimit } from "@/lib/rateLimit";

/**
 * Block mutations, both directions (docs/PRELAUNCH.md #13). The rules they
 * enforce, and why the two directions differ, are documented in `lib/blocks.ts`.
 *
 * Separate file from the reads for the same reason `follow-actions.ts` is: a
 * module with a top-level "use server" cannot also export cached read helpers,
 * and both sides are imported by client components.
 */

/** A fan hides a creator, or stops hiding them. Returns the new state. */
export async function toggleHideCreator(
  streamerId: string,
): Promise<{ ok: true; hidden: boolean } | { ok: false; error: string }> {
  const backer = await getCurrentBacker();
  if (!backer) return { ok: false, error: "signedOut" };
  if (!(await checkRateLimit("follow", backer.id))) {
    return { ok: false, error: "tooMany" };
  }

  const existing = await prisma.block.findUnique({
    where: {
      backerId_streamerId_initiator: {
        backerId: backer.id,
        streamerId,
        initiator: "fan",
      },
    },
    select: { id: true },
  });

  if (existing) {
    await prisma.block.delete({ where: { id: existing.id } });
    revalidateSocial();
    return { ok: true, hidden: false };
  }

  // Hiding and following are contradictory states, so hiding drops the follow
  // rather than leaving a creator in the sidebar that no page will show.
  await prisma.$transaction([
    prisma.block.create({
      data: { backerId: backer.id, streamerId, initiator: "fan" },
    }),
    prisma.follow.deleteMany({ where: { backerId: backer.id, streamerId } }),
  ]);
  revalidateSocial();
  return { ok: true, hidden: true };
}

/**
 * A creator blocks a fan. Creator-side, so it takes the streamer from the
 * session's own Studio — never from an argument, or one creator could block a
 * fan on another's behalf.
 */
export async function blockSupporterAction(input: {
  backerId: string;
  reason?: string | null;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const creator = await getCurrentCreator();
  if (!creator) return { ok: false, error: "forbidden" };

  const target = await prisma.backer.findUnique({
    where: { id: input.backerId },
    select: { id: true },
  });
  if (!target) return { ok: false, error: "notFound" };
  // A creator blocking themselves would lock them out of their own market.
  if (creator.ownerId === input.backerId) {
    return { ok: false, error: "self" };
  }

  await prisma.$transaction([
    prisma.block.upsert({
      where: {
        backerId_streamerId_initiator: {
          backerId: input.backerId,
          streamerId: creator.id,
          initiator: "creator",
        },
      },
      create: {
        backerId: input.backerId,
        streamerId: creator.id,
        initiator: "creator",
        reason: input.reason?.trim() || null,
      },
      update: { reason: input.reason?.trim() || null },
    }),
    prisma.follow.deleteMany({
      where: { backerId: input.backerId, streamerId: creator.id },
    }),
  ]);

  revalidatePath("/studio");
  revalidateSocial();
  return { ok: true };
}

export async function unblockSupporterAction(input: {
  backerId: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const creator = await getCurrentCreator();
  if (!creator) return { ok: false, error: "forbidden" };

  await prisma.block.deleteMany({
    where: {
      backerId: input.backerId,
      streamerId: creator.id,
      initiator: "creator",
    },
  });

  revalidatePath("/studio");
  revalidateSocial();
  return { ok: true };
}

/**
 * The sidebar's following list and the rail's discovery pool render on every
 * ConsumerShell page, and both change when a block does — the same revalidation
 * set `toggleFollow` uses, for the same reason.
 */
function revalidateSocial() {
  revalidatePath("/", "layout");
  revalidatePath("/home");
  revalidatePath("/explore");
  revalidatePath("/settings");
}
