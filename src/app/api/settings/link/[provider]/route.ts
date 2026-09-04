import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getEnabledOAuthProviders } from "@/lib/auth-providers";
import { checkRateLimit } from "@/lib/rateLimit";
import { buildAuthorizationUrl, generateCodeVerifier, type LinkableProvider } from "@/lib/oauthLinking";
import {
  LINK_OAUTH_COOKIE,
  LINK_OAUTH_COOKIE_MAX_AGE,
  type LinkOAuthCookiePayload,
} from "@/lib/linkOAuthCookie";

const LINKABLE_PROVIDERS: readonly LinkableProvider[] = ["google", "kakao", "naver"];

/**
 * Starts the "link a provider from /settings" round trip — see the note in
 * src/lib/oauthLinking.ts for why this doesn't reuse Auth.js's own
 * `signIn()`/`/api/auth/*`.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { provider: raw } = await params;
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const provider = raw as LinkableProvider;
  const enabled = getEnabledOAuthProviders();
  if (!LINKABLE_PROVIDERS.includes(provider) || !enabled[provider]) {
    return NextResponse.redirect(new URL("/settings?linkError=unavailable", req.url));
  }

  if (!(await checkRateLimit("linkAccount", session.user.id))) {
    return NextResponse.redirect(new URL("/settings?linkError=tooMany", req.url));
  }

  const state = randomBytes(24).toString("base64url");
  const codeVerifier = generateCodeVerifier();
  const payload: LinkOAuthCookiePayload = {
    state,
    backerId: session.user.id,
    provider,
    codeVerifier,
  };

  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "localhost:3000";
  const proto = req.headers.get("x-forwarded-proto") ?? "http";
  const origin = `${proto}://${host}`;
  const redirectUri = `${origin}/api/settings/link/${provider}/callback`;

  const res = NextResponse.redirect(
    buildAuthorizationUrl(provider, state, redirectUri, codeVerifier),
  );
  res.cookies.set(LINK_OAUTH_COOKIE, JSON.stringify(payload), {
    httpOnly: true,
    path: "/api/settings/link",
    maxAge: LINK_OAUTH_COOKIE_MAX_AGE,
    sameSite: "lax",
  });
  return res;
}
