"use server";

import { signIn } from "@/auth";
import { AuthError } from "next-auth";
import {
  getEnabledOAuthProviders,
  type OAuthProvider,
} from "@/lib/auth-providers";

// Logout deliberately is NOT a server action — it's a native form POST to
// /api/logout, so the browser performs a real navigation and cancels the
// current document's in-flight RSC fetches. See src/app/api/logout/route.ts.

/**
 * Kick off an OAuth sign-in for a social provider. Only proceeds when the
 * provider is actually configured; otherwise returns { ok:false } so the client
 * can show a graceful "coming soon" note (never a broken redirect). On success
 * `signIn` throws NEXT_REDIRECT, which must propagate.
 */
export async function oauthSignIn(
  provider: OAuthProvider,
): Promise<{ ok: false; error: string } | never> {
  const enabled = getEnabledOAuthProviders();
  if (!enabled[provider]) return { ok: false, error: "comingSoon" };

  try {
    await signIn(provider, { redirectTo: "/" });
  } catch (e) {
    if (e instanceof AuthError) return { ok: false, error: "comingSoon" };
    throw e; // rethrow the NEXT_REDIRECT signal
  }
  return { ok: false, error: "comingSoon" };
}
