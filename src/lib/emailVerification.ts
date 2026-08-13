import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@/lib/db";
import { getEmailProvider } from "@/lib/email";

/**
 * Email confirmation, for two purposes that are the same mechanism:
 *
 *   - **verify** — prove the address already on the account is real. Nothing
 *     proved it before: an account could be created on someone else's address
 *     (docs/PRELAUNCH.md #3), and password reset mails to an address nobody
 *     ever confirmed.
 *   - **change** — move the account to a new address (#4). The new address is
 *     held on the token and only becomes the account's when its owner clicks,
 *     because the alternative — writing it immediately and confirming later —
 *     lets someone park an account on an address they don't own and then use
 *     password reset to take it over.
 *
 * Deliberately **not** a gate. An unverified account can still sign in, donate
 * and spend; the state is surfaced with a resend, not enforced. Blocking money
 * on an email click is a product decision nobody has made, and quietly adding
 * it here would be the wrong place to make it.
 */

/** 24 hours. Longer than a password reset because nothing is being handed over
 *  — the worst case for a stale verify link is a second click on "resend". */
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

type Purpose = "verify" | "change";

async function issue(
  backerId: string,
  purpose: Purpose,
  newEmail?: string,
): Promise<string> {
  // One live token per purpose: requesting again retires the previous link, so
  // an old mail can't still work after the user has visibly asked for a new one.
  await prisma.emailToken.updateMany({
    where: { backerId, purpose, usedAt: null },
    data: { usedAt: new Date() },
  });

  const token = randomBytes(32).toString("base64url");
  await prisma.emailToken.create({
    data: {
      backerId,
      purpose,
      newEmail: newEmail ?? null,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
    },
  });
  return token;
}

/**
 * Send (or re-send) the confirmation for the address currently on the account.
 * Silent no-op if it is already confirmed — resending a link that would do
 * nothing is just a way to get flagged as spam.
 */
export async function sendVerificationEmail(
  backerId: string,
  origin: string,
): Promise<{ ok: true }> {
  const backer = await prisma.backer.findUnique({
    where: { id: backerId },
    select: { email: true, nickname: true, emailVerifiedAt: true },
  });
  if (!backer || backer.emailVerifiedAt) return { ok: true };

  const token = await issue(backerId, "verify");
  await getEmailProvider().send({
    to: backer.email,
    subject: "[motoo] 이메일 주소 확인",
    text: [
      `${backer.nickname}님, 안녕하세요.`,
      "",
      "아래 링크를 열어 이메일 주소를 확인해 주세요. 24시간 안에 사용해야 해요.",
      "",
      `${origin}/verify/${token}`,
      "",
      "확인하지 않아도 motoo는 그대로 이용할 수 있어요. 다만 비밀번호를 잊었을 때 이 주소로만 재설정 링크를 보낼 수 있어요.",
    ].join("\n"),
  });
  return { ok: true };
}

export type ChangeEmailResult =
  | { ok: true }
  | { ok: false; error: "taken" | "same" };

/**
 * Start a move to `newEmail`. Mails the confirmation to the **new** address and
 * a heads-up to the **old** one — the old address is the only party who can
 * notice a change they didn't ask for, so telling it is the whole point.
 *
 * Caller is responsible for re-authenticating the user (the settings action
 * requires the current password). This function assumes that already happened.
 */
export async function requestEmailChange(
  backerId: string,
  newEmail: string,
  origin: string,
): Promise<ChangeEmailResult> {
  const normalized = newEmail.trim().toLowerCase();
  const backer = await prisma.backer.findUnique({
    where: { id: backerId },
    select: { email: true, nickname: true },
  });
  if (!backer) return { ok: false, error: "taken" };
  if (backer.email === normalized) return { ok: false, error: "same" };

  // Checked here for a useful message; checked again at consume time, because
  // between the two someone else may claim it.
  const existing = await prisma.backer.findUnique({
    where: { email: normalized },
    select: { id: true },
  });
  if (existing) return { ok: false, error: "taken" };

  const token = await issue(backerId, "change", normalized);

  await getEmailProvider().send({
    to: normalized,
    subject: "[motoo] 새 이메일 주소 확인",
    text: [
      `${backer.nickname}님, 안녕하세요.`,
      "",
      "이 주소를 motoo 계정의 새 이메일로 사용하려면 아래 링크를 열어주세요. 24시간 안에 사용해야 해요.",
      "",
      `${origin}/verify/${token}`,
      "",
      "본인이 요청한 것이 아니라면 이 메일은 무시해 주세요. 링크를 열기 전까지는 아무것도 바뀌지 않아요.",
    ].join("\n"),
  });

  // The security notice. Sent to the address being moved away from, and
  // deliberately carries no link — its only job is to be noticed.
  await getEmailProvider().send({
    to: backer.email,
    subject: "[motoo] 이메일 주소 변경 요청",
    text: [
      `${backer.nickname}님, 안녕하세요.`,
      "",
      `계정 이메일을 ${normalized} (으)로 변경해 달라는 요청이 접수됐어요.`,
      "새 주소에서 확인 링크를 열기 전까지는 변경되지 않아요.",
      "",
      "본인이 요청한 것이 아니라면 지금 비밀번호를 변경해 주세요.",
    ].join("\n"),
  });

  return { ok: true };
}

export type ConsumeResult =
  | { ok: true; purpose: Purpose }
  | { ok: false; reason: "unknown" | "expired" | "used" | "taken" };

/**
 * Consume a token of either purpose. One transaction, and a conditional update
 * on `usedAt: null`, so two clicks racing cannot both apply — same pattern as
 * the password reset consume.
 */
export async function consumeEmailToken(token: string): Promise<ConsumeResult> {
  const tokenHash = hashToken(token);

  try {
    return await prisma.$transaction(async (tx) => {
      const row = await tx.emailToken.findUnique({
        where: { tokenHash },
        select: {
          id: true,
          backerId: true,
          purpose: true,
          newEmail: true,
          expiresAt: true,
          usedAt: true,
        },
      });
      if (!row) return { ok: false, reason: "unknown" as const };
      if (row.usedAt) return { ok: false, reason: "used" as const };
      if (row.expiresAt.getTime() < Date.now())
        return { ok: false, reason: "expired" as const };

      const claimed = await tx.emailToken.updateMany({
        where: { id: row.id, usedAt: null },
        data: { usedAt: new Date() },
      });
      if (claimed.count === 0) return { ok: false, reason: "used" as const };

      if (row.purpose === "change") {
        if (!row.newEmail) return { ok: false, reason: "unknown" as const };
        // The address may have been taken since the token was issued. Unique
        // constraint would throw; this turns it into an answer.
        const clash = await tx.backer.findUnique({
          where: { email: row.newEmail },
          select: { id: true },
        });
        if (clash && clash.id !== row.backerId)
          return { ok: false, reason: "taken" as const };

        await tx.backer.update({
          where: { id: row.backerId },
          // Confirmed by construction: the click proves control of the address.
          data: { email: row.newEmail, emailVerifiedAt: new Date() },
        });
        return { ok: true as const, purpose: "change" as const };
      }

      await tx.backer.update({
        where: { id: row.backerId },
        data: { emailVerifiedAt: new Date() },
      });
      return { ok: true as const, purpose: "verify" as const };
    });
  } catch {
    return { ok: false, reason: "unknown" };
  }
}

/** Expired rows, for the purge cron. Mirrors `purgeStaleResetTokens`. */
export async function purgeStaleEmailTokens(): Promise<number> {
  const { count } = await prisma.emailToken.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
  return count;
}
