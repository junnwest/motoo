"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
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
