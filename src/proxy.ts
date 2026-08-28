import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig, isOnboardingExempt } from "./auth.config";
import { buildCsp, cspHeaderName } from "./lib/csp";
import { isStudioPage, splitEnabled } from "./lib/hostRouting";

// Edge middleware — uses the Prisma-free config so it can run at the edge. The
// session (incl. `user.creator`, the Studio handle) rides in the JWT, so the
// two-domain split below needs no database access.
import {
  PRELAUNCH,
  isPublicDuringPrelaunch,
  isSignedInAllowedDuringPrelaunch,
} from "@/lib/prelaunch";

const { auth } = NextAuth(authConfig);

/**
 * Two-domain routing:
 *   themotoo.com        → the consumer app (explore, profiles, "my mochi", auth)
 *   studio.themotoo.com → the creator console (the /studio route group)
 *
 * Any host beginning with `studio.` is the Studio subdomain. There it serves
 * clean URLs (`/` = dashboard, `/settings`) that we rewrite into the internal
 * `/studio` route group; consumer paths there 308 back to the apex. On the apex,
 * `/studio*` 308s over to the subdomain. Login/onboarding/become-creator all
 * live on the apex, and the session cookie is shared across `.themotoo.com`
 * (see AUTH_COOKIE_DOMAIN in src/auth.ts), so a login on either host works on
 * both.
 */
const STUDIO_PREFIX = "studio.";

/**
 * The production apex, and the host it actually canonicalizes to.
 *
 * Vercel serves the consumer app on **www** and 308s the bare apex to it, so
 * stripping `studio.` off the request host lands on a redirect rather than the
 * real page: `studio.themotoo.com/explore` → `themotoo.com/explore` (307) →
 * `www.themotoo.com/explore` (308). Sending cross-host hops straight to the
 * canonical host makes that one redirect instead of two — it's on every click
 * of the Studio nav's motoo pill.
 *
 * Hardcoded, like `splitEnabled` below: the split only ever activates on this
 * domain (or localhost), so there's nothing to derive it from. Everything else
 * — dev, previews — keeps the plain host-derived value.
 */
const PROD_APEX = "themotoo.com";
const PROD_CANONICAL_APEX = "www.themotoo.com";

const isProd = process.env.NODE_ENV === "production";

/**
 * The per-request nonce that lets the CSP stop allowing inline script
 * (docs/PRELAUNCH.md #34).
 *
 * Next reads it back off the *request's* own CSP header and stamps it onto the
 * script tags it injects, so it has to be set on the request as well as the
 * response — which is why every pass-through below rebuilds the request headers
 * instead of calling a bare NextResponse.next().
 *
 * crypto.randomUUID() rather than Math.random(): a guessable nonce is not one,
 * and the edge runtime has WebCrypto.
 */
function withCsp(
  req: Parameters<Parameters<typeof auth>[0]>[0],
  make: (requestHeaders: Headers) => NextResponse,
): NextResponse {
  const nonce = crypto.randomUUID();
  const csp = buildCsp(nonce, isProd);
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-nonce", nonce);
  // Next looks for this exact header on the request. Always the enforcing name
  // here even when the response reports only, or Next finds no nonce to use.
  requestHeaders.set("Content-Security-Policy", csp);

  const res = make(requestHeaders);
  res.headers.set(cspHeaderName(), csp);
  return res;
}

export default auth((req) => {
  const url = req.nextUrl;
  const path = url.pathname;
  const host = req.headers.get("host") ?? url.host;
  const user = req.auth?.user;

  // Pre-launch gate. While PRELAUNCH=1 the product is invite-only: we are
  // approaching creators directly and only they can hold an account. A signed-
  // OUT visitor sees the welcome page, the legal pages, and the invite/login
  // doors; everything else is private. Signed-in users are unaffected — holding
  // a session *is* the proof of invitation, since the only way to get one is to
  // redeem an invite (see src/lib/invites.ts).
  //
  // Deliberately before the studio split, so the studio host is covered too
  // rather than only the apex.
  //
  // Nothing on the studio host is public: `/` there is the creator console, not
  // the welcome page, so it must not inherit the apex allowlist. Production
  // would also be caught by the creator gate below, but a gate whose whole job
  // is privacy should not depend on a second one being correct.
  //
  // The product is unlaunched for everyone except admins — including invited
  // creators, who get signup and Studio setup and nothing else. Admins bypass
  // the whole gate: somebody has to be able to look at the running product.
  const onStudioHostEarly = host.startsWith(STUDIO_PREFIX);
  const prelaunchBlocked =
    PRELAUNCH &&
    user?.role !== "admin" &&
    (onStudioHostEarly ||
      (user
        ? !isSignedInAllowedDuringPrelaunch(path)
        : !isPublicDuringPrelaunch(path)));
  if (prelaunchBlocked) {
    const apexForRedirect = onStudioHostEarly
      ? host.replace(/^studio\./, "")
      : host;
    return new NextResponse(null, {
      status: 307,
      headers: { location: `${
        req.headers.get("x-forwarded-proto") ??
        (url.protocol === "https:" ? "https" : "http")
      }://${apexForRedirect}/` },
    });
  }

  const canSplit = splitEnabled(host);
  const onStudioHost = host.startsWith(STUDIO_PREFIX);

  // Sibling hosts (port preserved for localhost dev). The apex is normalized to
  // the canonical host so a studio→apex hop is one redirect, not two (see
  // PROD_CANONICAL_APEX). In dev this resolves to bare `localhost:PORT` and is
  // left alone — there's no www there.
  const strippedApex = host.replace(/^studio\./, "");
  const apexHost =
    strippedApex === PROD_APEX ? PROD_CANONICAL_APEX : strippedApex;
  const studioHost = STUDIO_PREFIX + host.replace(/^www\./, "");
  const proto =
    req.headers.get("x-forwarded-proto") ??
    (url.protocol === "https:" ? "https" : "http");
  // Build the redirect by hand rather than via NextResponse.redirect(): the
  // latter emits a *relative* Location when the target origin equals the request
  // origin, which in dev (where Next pins the origin to the server binding)
  // turns a studio→apex hop into a same-host loop. An explicit absolute Location
  // always crosses hosts.
  const crossHost = (targetHost: string, pathname: string) =>
    new NextResponse(null, {
      status: 307,
      headers: { location: `${proto}://${targetHost}${pathname}${url.search}` },
    });

  if (canSplit && onStudioHost) {
    // Drop any redundant /studio prefix so subdomain URLs stay clean.
    if (path === "/studio" || path.startsWith("/studio/")) {
      return crossHost(host, path.slice("/studio".length) || "/");
    }
    // Consumer / auth / marketing pages don't belong on the studio host — send
    // them to the apex. In dev the apex host is bare `localhost:PORT`, which
    // equals Next's dev origin; Next then relativizes the Location into a
    // same-host loop. Since this hop is pure prod behavior, dev just serves the
    // page inline instead (no redirect, no loop).
    if (!isStudioPage(path)) {
      return isProd
        ? crossHost(apexHost, path)
        : withCsp(req, (headers) =>
            NextResponse.next({ request: { headers } }),
          );
    }
    // Creator gate (JWT-only, no DB). Auth + become-creator run on the apex.
    // In dev the JWT is empty (nobody's signed in), but getCurrentCreator()
    // falls back to the demo creator in the server component, so let it through.
    if (isProd && !user?.creator) {
      return crossHost(apexHost, "/api/become-creator");
    }
    // Rewrite the clean subdomain URL into the internal /studio route group.
    const rewritten = url.clone();
    rewritten.pathname = path === "/" ? "/studio" : `/studio${path}`;
    return withCsp(req, (headers) =>
      NextResponse.rewrite(rewritten, { request: { headers } }),
    );
  }

  if (canSplit && !onStudioHost) {
    // The creator console lives on the studio subdomain now.
    if (path === "/studio" || path.startsWith("/studio/")) {
      return crossHost(studioHost, path.slice("/studio".length) || "/");
    }
  }

  // Onboarding gate — a signed-in, non-onboarded fan is sent to /onboarding for
  // every page except onboarding itself and the pages it links to.
  if (
    user &&
    !user.onboarded &&
    user.role !== "admin" &&
    !isOnboardingExempt(path)
  ) {
    return NextResponse.redirect(new URL("/onboarding", url));
  }

  return withCsp(req, (headers) => NextResponse.next({ request: { headers } }));
});

export const config = {
  // Run on all pages except API routes, Next internals, and static files.
  // `_vercel` is excluded alongside Next's own internals: the analytics script
  // and its beacons are served from this origin, so without it they would go
  // through the onboarding gate — and a signed-in, not-yet-onboarded visitor
  // would have their beacon 307'd to /onboarding.
  matcher: ["/((?!api|_next/static|_next/image|_vercel|favicon.ico).*)"],
};
