"use server";

import { signIn } from "@/auth";
import { AuthError } from "next-auth";

/**
 * Sign in with email + password. On success `signIn` throws a NEXT_REDIRECT
 * signal (that's expected and must propagate), so the only value we ever
 * *return* is a failure. Bad credentials surface as an AuthError → { error }.
 *
 * Everyone lands on "/", which is where the signed-in routing lives: a fan goes
 * to /home, a creator goes to their Studio (DECISIONS 2026-08-01). Keeping that
 * fork in one place means login, signup, and a bare visit to the domain all
 * agree without each re-deriving it.
 */
export async function loginAction(
  email: string,
  password: string,
): Promise<{ ok: false; error: string } | never> {
  try {
    await signIn("credentials", {
      email: email.toLowerCase(),
      password,
      redirectTo: "/",
    });
  } catch (e) {
    if (e instanceof AuthError) return { ok: false, error: "invalid" };
    throw e; // rethrow the NEXT_REDIRECT signal
  }
  return { ok: false, error: "invalid" };
}
