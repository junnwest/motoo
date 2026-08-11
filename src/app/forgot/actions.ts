"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { checkRateLimit } from "@/lib/rateLimit";
import {
  requestPasswordReset,
  completePasswordReset,
} from "@/lib/passwordReset";
import { PASSWORD_RE } from "@/lib/password";

/**
 * Password-reset actions. Both return `{ ok: true } | { ok: false, error }`
 * where `error` is an i18n key suffix under "auth.reset.errors", matching the
 * convention the marketplace actions use.
 */

const requestSchema = z.object({ email: z.string().email() });

/**
 * Always reports success, including for an unknown address, a rate-limited
 * caller and an OAuth-only account.
 *
 * That looks wrong and isn't: the response is the only channel an attacker
 * controls, so any difference between "sent" and "no such account" turns this
 * form into an account-existence oracle. On a donation product, confirming that
 * a given person has an account is itself the leak. The rate limit still
 * applies — it just doesn't announce itself.
 */
export async function requestResetAction(
  input: z.infer<typeof requestSchema>,
): Promise<{ ok: true }> {
  const parsed = requestSchema.safeParse(input);
  if (!parsed.success) return { ok: true };

  const email = parsed.data.email.trim().toLowerCase();
  if (!(await checkRateLimit("passwordReset", email))) return { ok: true };

  // The link has to be absolute and must point at the host the user is actually
  // on — dev is localhost, prod is www. Taken from the request rather than an
  // env var so both work without configuration.
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  await requestPasswordReset(email, `${proto}://${host}`);

  return { ok: true };
}

const completeSchema = z.object({
  token: z.string().min(1),
  password: z.string().regex(PASSWORD_RE),
});

/**
 * Consume the token and set the new password. Unlike the request above, this
 * one reports failure honestly: the user is holding a link they believe in, and
 * "expired" versus "already used" is the difference between "ask for a new one"
 * and "you already did this".
 *
 * No sign-in on success. The reset revokes every session (`tokenVersion`), so
 * the honest next step is a fresh login — and a password change that silently
 * logs you in hides the revocation that just happened.
 */
export async function completeResetAction(
  input: z.infer<typeof completeSchema>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = completeSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "weakPassword" };

  const res = await completePasswordReset(
    parsed.data.token,
    parsed.data.password,
  );
  if (res.ok) return { ok: true };
  return { ok: false, error: res.reason };
}
