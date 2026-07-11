"use server";

import { signIn } from "@/auth";
import { AuthError } from "next-auth";
import { prisma } from "@/lib/db";

/**
 * Sign in with email + password. On success `signIn` throws a NEXT_REDIRECT
 * signal (that's expected and must propagate), so the only value we ever
 * *return* is a failure. Bad credentials surface as an AuthError → { error }.
 *
 * Creators land on their dashboard; everyone else on the home page. The role
 * lookup only affects the redirect target — bad credentials still throw an
 * AuthError before any redirect happens.
 */
export async function loginAction(
  email: string,
  password: string,
): Promise<{ ok: false; error: string } | never> {
  const normalized = email.toLowerCase();
  const account = await prisma.backer.findUnique({
    where: { email: normalized },
    select: { role: true },
  });
  const redirectTo = account?.role === "streamer" ? "/creator/dashboard" : "/";

  try {
    await signIn("credentials", { email: normalized, password, redirectTo });
  } catch (e) {
    if (e instanceof AuthError) return { ok: false, error: "invalid" };
    throw e; // rethrow the NEXT_REDIRECT signal
  }
  return { ok: false, error: "invalid" };
}
