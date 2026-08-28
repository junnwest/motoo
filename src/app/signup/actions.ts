"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { cookies } from "next/headers";
import { PRELAUNCH } from "@/lib/prelaunch";
import { INVITE_COOKIE } from "@/lib/inviteCookie";
import { checkInvite, redeemInvite } from "@/lib/invites";
import { sendVerificationEmail } from "@/lib/emailVerification";
import { hashPassword, PASSWORD_RE } from "@/lib/password";
import { signIn } from "@/auth";
import { AuthError } from "next-auth";
import { checkRateLimit } from "@/lib/rateLimit";

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().regex(PASSWORD_RE),
  nickname: z.string().trim().min(1).max(40),
});

export type SignupInput = z.input<typeof signupSchema>;

/**
 * Create a plain user account (role=backer) and sign them in, then hand back
 * `{ ok: true }` so the **client** can navigate.
 *
 * It deliberately doesn't redirect from the server: with `redirectTo`, Next
 * resolves the destination without ever requesting it, so the middleware's
 * onboarding gate never runs and a brand-new account — the one case that most
 * needs onboarding — landed on /home instead. Same fix and same reasoning as
 * loginAction. See DECISIONS 2026-08-02.
 *
 * Uniqueness is enforced by the DB unique constraint (Backer.email) — a P2002
 * maps to emailTaken, with no orphan row since the single create either
 * succeeds or does nothing.
 */
export async function signupUser(
  input: SignupInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!(await checkRateLimit("signup", String(input?.email ?? "").trim().toLowerCase()))) {
    return { ok: false, error: "tooMany" };
  }

  const parsed = signupSchema.safeParse(input);
  if (!parsed.success) {
    if (!PASSWORD_RE.test(String(input?.password ?? ""))) {
      return { ok: false, error: "weakPassword" };
    }
    return { ok: false, error: "signupGeneric" };
  }

  const email = parsed.data.email.toLowerCase();
  const { password, nickname } = parsed.data;

  // Pre-launch is invite-only, and this is where that is actually enforced.
  // The middleware only gates *pages*; a server action can be invoked directly,
  // so checking here rather than in the UI is the difference between a closed
  // signup and a hidden one. The token comes from an httpOnly cookie set by
  // /join/<token>, never from the form, so it cannot be supplied by the caller.
  let inviteToken: string | null = null;
  if (PRELAUNCH) {
    const jar = await cookies();
    inviteToken = jar.get(INVITE_COOKIE)?.value ?? null;
    if (!inviteToken) return { ok: false, error: "inviteRequired" };
    const state = await checkInvite(inviteToken);
    if (!state.ok) return { ok: false, error: "inviteInvalid" };
  }

  let created: { id: string };
  try {
    created = await prisma.backer.create({
      data: {
        email,
        nickname,
        passwordHash: hashPassword(password),
        role: "backer",
        // Not onboarded/verified yet — the middleware routes them to /onboarding.
      },
      select: { id: true },
    });
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      return { ok: false, error: "emailTaken" };
    }
    return { ok: false, error: "signupGeneric" };
  }

  // Spend the invite now that there is an account to attach it to. The
  // conditional update inside redeemInvite is what makes a link single-use even
  // if two people open it at once; the loser lands here with the account
  // already created, so they are let through as a normal (non-founding) user
  // rather than being left with an account they cannot sign into. Rare enough
  // to be worth the simpler failure mode.
  if (PRELAUNCH && inviteToken) {
    await redeemInvite(inviteToken, created.id).catch(() => false);
  }

  // Best-effort, and deliberately not awaited into the failure path: a mail
  // provider having a bad minute must not fail a signup whose account already
  // exists. The address stays unverified and /settings offers a resend.
  try {
    const h = await headers();
    const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
    const proto = h.get("x-forwarded-proto") ?? "http";
    await sendVerificationEmail(created.id, `${proto}://${host}`);
  } catch {
    // swallowed on purpose — see above
  }

  try {
    await signIn("credentials", { email, password, redirect: false });
  } catch (e) {
    if (e instanceof AuthError) return { ok: false, error: "signupGeneric" };
    throw e;
  }

  // The client sends them to "/", where the middleware catches a non-onboarded
  // account and routes it to /onboarding.
  return { ok: true };
}
