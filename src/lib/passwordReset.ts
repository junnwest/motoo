import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { getEmailProvider, EMAIL_FROM } from "@/lib/email";
import { reportWarning } from "@/lib/report";

/**
 * Password reset.
 *
 * Until now there was none: signup is credentials-based, so a forgotten
 * password was a permanent lockout with no self-service path (docs/PRELAUNCH.md
 * #1). This is the money-adjacent half of that fix — the flow that can hand
 * someone an account — so the rules it enforces are worth stating.
 *
 *   - **The token is never stored.** Only its SHA-256 hash is. The emailed
 *     value is the single copy, so a database dump can't be replayed.
 *   - **Single use, and short-lived** (30 minutes). Consuming sets `usedAt`
 *     rather than deleting, so a second click can say "already used" instead of
 *     failing generically.
 *   - **Requesting never reveals whether an account exists.** `requestReset`
 *     returns the same shape for a known and an unknown address; only the email
 *     that does or doesn't arrive differs. Account enumeration on a donation
 *     product is a real privacy leak, not a theoretical one.
 *   - **A completed reset revokes every existing session** by bumping
 *     `tokenVersion`, the mechanism logout already uses (DECISIONS 2026-08-02).
 *     If a password is being reset because someone else had it, leaving their
 *     session alive would defeat the entire exercise.
 */

/** 30 minutes. Long enough for a slow inbox, short enough that a leaked mail
 *  in a shared machine's history is usually already dead. */
const TOKEN_TTL_MS = 30 * 60 * 1000;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export type RequestResetResult = { ok: true };

/**
 * Issue a reset token and email it. Always resolves `{ ok: true }` — see the
 * enumeration note above.
 */
export async function requestPasswordReset(
  email: string,
  origin: string,
): Promise<RequestResetResult> {
  const normalized = email.trim().toLowerCase();
  const backer = await prisma.backer.findUnique({
    where: { email: normalized },
    select: { id: true, passwordHash: true, nickname: true },
  });

  // No account, or an OAuth-only account with no password to reset. Both exit
  // silently: telling an OAuth user "you have no password" still confirms the
  // address is registered.
  if (!backer || !backer.passwordHash) return { ok: true };

  // Invalidate outstanding tokens for this account. Requesting a second link
  // should retire the first — otherwise an old mail keeps working for its full
  // 30 minutes after the user has visibly asked for a new one.
  await prisma.passwordResetToken.updateMany({
    where: { backerId: backer.id, usedAt: null },
    data: { usedAt: new Date() },
  });

  const token = randomBytes(32).toString("base64url");
  await prisma.passwordResetToken.create({
    data: {
      backerId: backer.id,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
    },
  });

  const url = `${origin}/reset/${token}`;
  const result = await getEmailProvider().send({
    to: normalized,
    subject: "[motoo] 비밀번호 재설정",
    text: [
      `${backer.nickname}님, 안녕하세요.`,
      "",
      "비밀번호를 재설정하려면 아래 링크를 열어주세요. 30분 안에 사용해야 해요.",
      "",
      url,
      "",
      "본인이 요청한 것이 아니라면 이 메일은 무시하셔도 괜찮아요. 비밀번호는 그대로예요.",
      "",
      `보낸 사람: ${EMAIL_FROM}`,
    ].join("\n"),
  });

  // The caller always sees `{ ok: true }` regardless (enumeration, see above) —
  // this is the only place a failed send is recorded at all. Without it, a
  // misconfigured provider (bad key, unverified domain) fails every reset
  // silently forever, indistinguishable from success on every layer above.
  if (!result.ok) {
    reportWarning(new Error(result.error), {
      scope: "requestPasswordReset.sendFailed",
      meta: { backerId: backer.id },
    });
  }

  return { ok: true };
}

export type ResetTokenState =
  | { valid: true; backerId: string }
  | { valid: false; reason: "unknown" | "expired" | "used" };

/**
 * Look a token up without consuming it — for rendering the reset form, so an
 * expired link says so before the user types a new password twice.
 */
export async function checkResetToken(token: string): Promise<ResetTokenState> {
  const row = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(token) },
    select: { backerId: true, expiresAt: true, usedAt: true },
  });
  if (!row) return { valid: false, reason: "unknown" };
  if (row.usedAt) return { valid: false, reason: "used" };
  if (row.expiresAt.getTime() < Date.now())
    return { valid: false, reason: "expired" };
  return { valid: true, backerId: row.backerId };
}

export type CompleteResetResult =
  | { ok: true }
  | { ok: false; reason: "unknown" | "expired" | "used" };

/**
 * Consume a token and set the new password. The token check, the consume, the
 * password write and the session revocation happen in one transaction: two
 * clicks racing must not both succeed, and a password must never change without
 * the sessions being revoked alongside it.
 */
export async function completePasswordReset(
  token: string,
  newPassword: string,
): Promise<CompleteResetResult> {
  const tokenHash = hashToken(token);
  // Hashed before the transaction opens: scrypt is deliberately slow, and
  // holding a row lock across it would serialise every concurrent reset.
  const passwordHash = hashPassword(newPassword);

  try {
    return await prisma.$transaction(async (tx) => {
      const row = await tx.passwordResetToken.findUnique({
        where: { tokenHash },
        select: { id: true, backerId: true, expiresAt: true, usedAt: true },
      });
      if (!row) return { ok: false, reason: "unknown" as const };
      if (row.usedAt) return { ok: false, reason: "used" as const };
      if (row.expiresAt.getTime() < Date.now())
        return { ok: false, reason: "expired" as const };

      // Conditional update: `usedAt: null` in the where clause is what makes a
      // concurrent second consume fail rather than double-apply.
      const claimed = await tx.passwordResetToken.updateMany({
        where: { id: row.id, usedAt: null },
        data: { usedAt: new Date() },
      });
      if (claimed.count === 0) return { ok: false, reason: "used" as const };

      await tx.backer.update({
        where: { id: row.backerId },
        data: {
          passwordHash,
          // Revoke every existing session (DECISIONS 2026-08-02).
          tokenVersion: { increment: 1 },
        },
      });

      return { ok: true as const };
    });
  } catch {
    return { ok: false, reason: "unknown" };
  }
}

/**
 * Expired and consumed rows, for the existing purge cron to sweep. Kept here
 * rather than in the cron route so the retention rule lives beside the model it
 * describes.
 */
export async function purgeStaleResetTokens(): Promise<number> {
  const { count } = await prisma.passwordResetToken.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
  return count;
}
