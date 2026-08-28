import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/db";

/**
 * Pre-launch invites.
 *
 * Signup is invite-only while `PRELAUNCH=1`: we reach out to specific creators
 * and only they can create an account. Each invite is its own row (see the
 * `Invite` model), so we know which creators were approached, which redeemed,
 * and which never did — a single shared code answers none of that.
 *
 * The security property that matters is **single use**. `redeemInvite` performs
 * a conditional update with `redeemedAt: null` in the where-clause, so if two
 * people open the same link at the same moment exactly one wins; the loser sees
 * the same "already used" state as someone re-opening a spent link. That check
 * lives in the database rather than in a read-then-write, which would race.
 */

/** URL-safe, unguessable, and short enough to survive being pasted into a DM. */
export function mintInviteToken(): string {
  return randomBytes(12).toString("base64url"); // 96 bits
}

export type InviteState =
  | { ok: true; id: string; label: string }
  | { ok: false; reason: "unknown" | "revoked" | "spent" };

/**
 * Look an invite up without spending it — for `/join/<token>`, which has to be
 * able to say *why* a link does not work before anyone signs up.
 */
export async function checkInvite(token: string): Promise<InviteState> {
  if (!token || token.length > 64) return { ok: false, reason: "unknown" };
  const invite = await prisma.invite.findUnique({
    where: { token },
    select: { id: true, label: true, revokedAt: true, redeemedAt: true },
  });
  if (!invite) return { ok: false, reason: "unknown" };
  if (invite.revokedAt) return { ok: false, reason: "revoked" };
  if (invite.redeemedAt) return { ok: false, reason: "spent" };
  return { ok: true, id: invite.id, label: invite.label };
}

/**
 * Spend an invite for a freshly created account, and mark that account as
 * founding.
 *
 * Called inside the signup path with the id of the account that was just
 * created. Returns false if the invite was taken between the visitor opening
 * `/join` and finishing the form — the caller decides what to do with that
 * (signup has already happened by then; see the note at the call site).
 *
 * `foundingAt` is set on `Backer`, not on `Streamer`: the account exists before
 * the Studio does, and the creator profile reads it back through `owner`, so
 * there is one source of truth rather than two that can drift.
 */
export async function redeemInvite(
  token: string,
  backerId: string,
): Promise<boolean> {
  const now = new Date();
  try {
    const [updated] = await prisma.$transaction([
      prisma.invite.updateMany({
        // The whole guard: only an unspent, unrevoked invite matches.
        where: { token, redeemedAt: null, revokedAt: null },
        data: { redeemedAt: now, redeemedByBackerId: backerId },
      }),
      prisma.backer.update({
        where: { id: backerId },
        data: { foundingAt: now },
      }),
    ]);
    if (updated.count === 1) return true;
  } catch {
    // fall through — a lost race or a concurrent write, both non-fatal here
  }
  // Lost the race: undo the founding mark so it cannot be claimed without an
  // invite actually being spent.
  await prisma.backer
    .update({ where: { id: backerId }, data: { foundingAt: null } })
    .catch(() => {});
  return false;
}

/** Mint an invite for one creator. `createdBy` is an admin email. */
export async function createInvite(input: {
  label: string;
  email?: string | null;
  note?: string | null;
  createdBy: string;
}) {
  return prisma.invite.create({
    data: {
      token: mintInviteToken(),
      label: input.label.trim().slice(0, 120),
      email: input.email?.trim().toLowerCase() || null,
      note: input.note?.trim().slice(0, 500) || null,
      createdBy: input.createdBy,
    },
    select: { id: true, token: true, label: true },
  });
}

/**
 * Revoking is deliberately not a delete: the outreach record is the point, and
 * a redeemed invite is never revocable — the account already exists, so pulling
 * the invite would only make the founding badge unexplainable.
 */
export async function revokeInvite(id: string) {
  return prisma.invite.updateMany({
    where: { id, redeemedAt: null, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function listInvites() {
  return prisma.invite.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      token: true,
      label: true,
      email: true,
      note: true,
      createdAt: true,
      createdBy: true,
      redeemedAt: true,
      revokedAt: true,
      redeemedBy: { select: { nickname: true, email: true, handle: true } },
    },
  });
}
