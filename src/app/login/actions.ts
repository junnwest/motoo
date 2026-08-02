"use server";

import { signIn } from "@/auth";
import { AuthError } from "next-auth";

/**
 * Sign in with email + password. Returns `{ ok: true }` on success and lets the
 * **client** navigate; it deliberately does not redirect from the server.
 *
 * Why: with `redirectTo`, Next finishes the action with a client-side
 * transition and resolves the destination without ever requesting it — the
 * trace showed no `GET /` at all after the action's 303. So neither `/`'s own
 * signed-in routing nor the middleware's onboarding gate ran, and a brand-new
 * user was left sitting on the marketing landing until they navigated again.
 * `revalidatePath` doesn't help, because the request isn't being served from a
 * cache we control — it isn't being made. A full navigation is: the browser
 * requests `/` with the fresh session cookie, middleware runs, and the user
 * lands where they should. See DECISIONS 2026-08-02.
 *
 * "/" is where the signed-in routing lives: a fan goes to /home, a creator to
 * their Studio (DECISIONS 2026-08-01), and a non-onboarded user is caught by
 * the middleware on the way. Keeping that fork in one place means login,
 * signup, and a bare visit to the domain all agree without each re-deriving it.
 */
export async function loginAction(
  email: string,
  password: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await signIn("credentials", {
      email: email.toLowerCase(),
      password,
      redirect: false,
    });
  } catch (e) {
    if (e instanceof AuthError) return { ok: false, error: "invalid" };
    throw e;
  }
  return { ok: true };
}
