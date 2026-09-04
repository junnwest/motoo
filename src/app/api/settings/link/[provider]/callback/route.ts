import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSession } from "@/lib/session";
import { exchangeCodeForToken, fetchProviderProfile, type LinkableProvider } from "@/lib/oauthLinking";
import { linkAccount } from "@/lib/linkedAccounts";
import { LINK_OAUTH_COOKIE, type LinkOAuthCookiePayload } from "@/lib/linkOAuthCookie";

/**
 * Completes the link round trip started by `../route.ts`. Never lets a
 * thrown error surface a raw response — every exit is a redirect back to
 * /settings, success or failure, with the state cookie always cleared so it
 * can't be replayed.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { provider: routeProvider } = await params;
  const url = new URL(req.url);

  function done(query: string) {
    const res = NextResponse.redirect(new URL(`/settings?${query}`, req.url));
    res.cookies.delete(LINK_OAUTH_COOKIE);
    return res;
  }

  const jar = await cookies();
  const raw = jar.get(LINK_OAUTH_COOKIE)?.value;
  if (!raw) return done("linkError=expired");

  let payload: LinkOAuthCookiePayload;
  try {
    payload = JSON.parse(raw);
  } catch {
    return done("linkError=expired");
  }

  if (payload.provider !== routeProvider || payload.state !== url.searchParams.get("state")) {
    return done("linkError=expired");
  }

  if (url.searchParams.get("error")) {
    return done("linkError=denied");
  }

  const code = url.searchParams.get("code");
  if (!code) return done("linkError=generic");

  // Defense in depth: the cookie could in principle outlive a logout or a
  // different login in the same browser mid-round-trip.
  const session = await getSession();
  if (!session?.user || session.user.id !== payload.backerId) {
    return done("linkError=sessionChanged");
  }

  const provider = payload.provider as LinkableProvider;
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "localhost:3000";
  const proto = req.headers.get("x-forwarded-proto") ?? "http";
  const redirectUri = `${proto}://${host}/api/settings/link/${provider}/callback`;

  try {
    const { access_token } = await exchangeCodeForToken(
      provider,
      code,
      redirectUri,
      payload.codeVerifier,
    );
    const { providerAccountId, email } = await fetchProviderProfile(provider, access_token);
    const result = await linkAccount(payload.backerId, provider, providerAccountId, email);
    if (!result.ok) return done(`linkError=${result.error}`);
  } catch (e) {
    console.error("link callback failed", provider, e);
    return done("linkError=generic");
  }

  return done(`linked=${provider}`);
}
