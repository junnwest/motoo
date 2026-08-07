"use server";

import { getCurrentBacker } from "@/lib/session";
import { prisma } from "@/lib/db";
import { checkRateLimit } from "@/lib/rateLimit";
import {
  scheduleAccountDeletion,
  cancelAccountDeletion,
} from "@/lib/accountDeletion";

/**
 * Account lifecycle actions (PIPA: right to deletion, right of access).
 *
 * Kept out of settings/actions.ts, which owns profile edits — these destroy or
 * export everything the user has, and shouldn't sit next to "change nickname".
 */

export type AccountActionResult =
  | { ok: true; deadline?: string }
  | { ok: false; error: string };

/**
 * Schedule deletion. Returns the deadline so the UI can state it back.
 *
 * A creator is refused: deleting a Streamer cascades to its marketplace,
 * orders and every holder's balance, so one person leaving would destroy other
 * people's money. Creator termination is a separate flow (and a separate
 * counsel question) — better an explicit refusal than a silent partial delete.
 */
export async function requestAccountDeletion(): Promise<AccountActionResult> {
  const backer = await getCurrentBacker();
  if (!backer) return { ok: false, error: "login" };
  if (!(await checkRateLimit("account", backer.id))) {
    return { ok: false, error: "generic" };
  }

  const studio = await prisma.streamer.findUnique({
    where: { ownerId: backer.id },
    select: { id: true },
  });
  if (studio) return { ok: false, error: "creatorAccount" };

  try {
    const deadline = await scheduleAccountDeletion(backer.id);
    return { ok: true, deadline: deadline.toISOString() };
  } catch {
    return { ok: false, error: "generic" };
  }
}

/** Undo a scheduled deletion. */
export async function undoAccountDeletion(): Promise<AccountActionResult> {
  const backer = await getCurrentBacker();
  if (!backer) return { ok: false, error: "login" };
  try {
    await cancelAccountDeletion(backer.id);
    return { ok: true };
  } catch {
    return { ok: false, error: "generic" };
  }
}
