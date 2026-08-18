"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentBacker } from "@/lib/session";
import { verifyPassword } from "@/lib/password";
import { checkRateLimit } from "@/lib/rateLimit";
import {
  requestEmailChange,
  sendVerificationEmail,
} from "@/lib/emailVerification";

/**
 * Email actions for /settings: confirm the current address, or move to a new
 * one. Return shape matches the rest of the app — `{ ok:true } | { ok:false,
 * error }` with `error` an i18n key suffix under "settings.email.errors".
 */

/** The request's own origin, so links work in dev and prod without config. */
async function origin(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

export async function resendVerificationAction(): Promise<
  { ok: true } | { ok: false; error: string }
> {
  const backer = await getCurrentBacker();
  if (!backer) return { ok: false, error: "login" };
  if (!(await checkRateLimit("passwordReset", `verify:${backer.id}`))) {
    return { ok: false, error: "tooMany" };
  }

  await sendVerificationEmail(backer.id, await origin());
  return { ok: true };
}

const changeSchema = z.object({
  newEmail: z.string().email(),
  /** Required whenever the account has a password. An attacker sitting on a
   *  stolen session should not be able to move the account somewhere they can
   *  then "reset" their way into. */
  currentPassword: z.string().min(1),
});

export async function changeEmailAction(
  input: z.infer<typeof changeSchema>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = changeSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalidEmail" };

  const backer = await getCurrentBacker();
  if (!backer) return { ok: false, error: "login" };
  if (!(await checkRateLimit("passwordReset", `change:${backer.id}`))) {
    return { ok: false, error: "tooMany" };
  }

  const row = await prisma.backer.findUnique({
    where: { id: backer.id },
    select: { passwordHash: true },
  });
  // OAuth-only accounts have no password to re-authenticate with. Rather than
  // waving them through — the weakest possible gate on an account-takeover
  // path — the form isn't offered to them at all (see settings/page.tsx).
  if (!row?.passwordHash) return { ok: false, error: "generic" };
  if (!verifyPassword(parsed.data.currentPassword, row.passwordHash)) {
    return { ok: false, error: "wrongPassword" };
  }

  const res = await requestEmailChange(
    backer.id,
    parsed.data.newEmail,
    await origin(),
  );
  if (!res.ok) return { ok: false, error: res.error };

  revalidatePath("/settings");
  return { ok: true };
}

/**
 * Marketing consent, withdrawable.
 *
 * It was captured at onboarding and then unreachable — 개인정보보호법 expects
 * withdrawal to be as easy as giving it, and "easy" cannot mean emailing
 * support (docs/PRELAUNCH.md #7). No password gate: this is a preference, not
 * an account-takeover path, and putting friction on withdrawal is exactly the
 * pattern the rule exists to prevent.
 */
export async function setMarketingConsentAction(
  consent: boolean,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const backer = await getCurrentBacker();
  if (!backer) return { ok: false, error: "login" };

  await prisma.backer.update({
    where: { id: backer.id },
    data: { marketingConsent: consent },
  });

  revalidatePath("/settings");
  return { ok: true };
}
