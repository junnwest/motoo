"use server";

import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { hashPassword, PASSWORD_RE } from "@/lib/password";
import { signIn } from "@/auth";
import { AuthError } from "next-auth";

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().regex(PASSWORD_RE),
  nickname: z.string().trim().min(1).max(40),
});

export type SignupInput = z.input<typeof signupSchema>;

/**
 * Create a plain user account (role=backer) and sign them in. `signIn` throws a
 * NEXT_REDIRECT on success (propagated), so this only ever *returns* on failure.
 * Uniqueness is enforced by the DB unique constraint (Backer.email) — a P2002
 * maps to emailTaken, with no orphan row since the single create either
 * succeeds or does nothing.
 */
export async function signupUser(
  input: SignupInput,
): Promise<{ ok: false; error: string } | never> {
  const parsed = signupSchema.safeParse(input);
  if (!parsed.success) {
    if (!PASSWORD_RE.test(String(input?.password ?? ""))) {
      return { ok: false, error: "weakPassword" };
    }
    return { ok: false, error: "signupGeneric" };
  }

  const email = parsed.data.email.toLowerCase();
  const { password, nickname } = parsed.data;

  try {
    await prisma.backer.create({
      data: {
        email,
        nickname,
        passwordHash: hashPassword(password),
        role: "backer",
        // Not onboarded/verified yet — the middleware routes them to /onboarding.
      },
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

  try {
    // /home is the signed-in landing surface; the onboarding middleware still
    // intercepts a brand-new account and routes it through /onboarding first.
    await signIn("credentials", { email, password, redirectTo: "/home" });
  } catch (e) {
    if (!(e instanceof AuthError)) throw e; // rethrow the NEXT_REDIRECT signal
  }

  return { ok: false, error: "signupGeneric" };
}
