"use server";

import { cookies } from "next/headers";
import { signIn } from "@/auth";
import { AuthError } from "next-auth";
import { checkRateLimit } from "@/lib/rateLimit";

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
  // Keyed on the submitted email, not a session — the whole point is that there
  // is no session yet. This is what slows credential stuffing.
  if (!(await checkRateLimit("login", email.trim().toLowerCase()))) {
    return { ok: false, error: "tooMany" };
  }
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
  // `signIn` with `redirect: false` doesn't throw for every failure: a
  // non-AuthError exception raised inside the jwt() callback (e.g. a Prisma
  // error) is swallowed by @auth/core into a redirect URL instead of a throw,
  // so the catch above never runs. Without this check that left-over failure
  // reads as success — the client navigates to "/" with no session cookie
  // ever set, landing back on the logged-out page with no error shown.
  //
  // Checked via the cookie jar, not `auth()`: `auth()` resolves from the
  // *incoming* request's cookies, which cannot yet contain a cookie `signIn`
  // only just queued onto this same response — it reads back null even on a
  // real success. `cookies()` sees the pending write because `signIn` sets it
  // through the same request-scoped jar. Matched by suffix because the cookie
  // is `__Secure-`-prefixed in production (AUTH_COOKIE_DOMAIN/https) and
  // bare in dev.
  const jar = await cookies();
  const sessionCookie = jar.getAll().find((c) => c.name.endsWith("session-token"));
  if (!sessionCookie?.value) return { ok: false, error: "sessionFailed" };
  return { ok: true };
}
