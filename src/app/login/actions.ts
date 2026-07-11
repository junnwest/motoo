"use server";

import { signIn } from "@/auth";
import { AuthError } from "next-auth";

/**
 * Sign in with email + password. On success `signIn` throws a NEXT_REDIRECT
 * signal (that's expected and must propagate), so the only value we ever
 * *return* is a failure. Bad credentials surface as an AuthError → { error }.
 *
 * Everyone lands on "/", which routes signed-in users to the consumer home
 * (/explore); creators reach their Studio from the nav.
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
