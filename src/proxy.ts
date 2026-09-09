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
  isStudioHostAllowedDuringPrelaunch,
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
    (onStudioHostEarly
      ? // The console is closed, but creator *settings* are served here and a
        // founding creator must be able to fix the handle they reserved.
        //
        // The signed-in requirement is `isProd`-only for the same reason the
        // creator gate below is: `AUTH_COOKIE_DOMAIN` is production-only, so in
        // dev the session cookie is host-only on the apex and never reaches
        // `studio.localhost`. Requiring a user here unconditionally would make
        // the studio host unreachable in dev for everyone, which is exactly the
        // trap the existing gate documents.
        (isProd && !user) || !isStudioHostAllowedDuringPrelaunch(path)
      : user
        ? !isSignedInAllowedDuringPrelaunch(path)
        : !isPublicDuringPrelaunch(path));
  if (prelaunchBlocked) {
    // A blocked studio request has to cross hosts to reach the welcome page,
    // and in dev it cannot: the dev apex is bare `localhost:PORT`, which is
    // Next's own origin, so the absolute Location built below is flattened to
    // `/` — which the browser then resolves against `studio.localhost` and
    // loops forever. Same trap as the two hops further down, so the same
    // answer: dev serves the page inline instead. Production is unaffected —
    // there the target host genuinely differs from the request host.
    if (onStudioHostEarly && !isProd) {
      return withCsp(req, (headers) =>
        NextResponse.next({ request: { headers } }),
      );
    }
    // Normalized to the canonical host for the same reason the cross-host hops
    // below are (see PROD_CANONICAL_APEX): stripping `studio.` lands on the
    // bare apex, which Vercel 308s to www, so a blocked studio request took two
    // redirects to reach the welcome page instead of one.
    const strippedForRedirect = host.replace(/^studio\./, "");
    const apexForRedirect = onStudioHostEarly
      ? strippedForRedirect === PROD_APEX
        ? PROD_CANONICAL_APEX
        : strippedForRedirect
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
  //
  // `public/` is excluded for the same reason, and it is not theoretical: only
  // `_next/*` is served from Next's own static path, so `/fonts/*` and
  // `/brand/*` were running the full gate. During PRELAUNCH that 307'd every
  // font request from a signed-out visitor to `/`, and the browser parsed the
  // welcome page's HTML as a woff2 ("invalid sfntVersion") — so the one page a
  // stranger can see rendered in a system fallback, with all 96 Pretendard
  // subsets failing. The onboarding gate did the same thing to anyone
  // mid-signup. Extensions are matched rather than a bare dot so that route
  // paths keep going through the gate; handles are `[a-z0-9_]{2,20}`, so no
  // real page path ends in one of these.
  matcher: [
    "/((?!api|_next/static|_next/image|_vercel|favicon.ico|fonts/|brand/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|woff2?|ttf|otf|webmanifest|txt|xml)$).*)",
  ],
};
