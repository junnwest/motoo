import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig, isOnboardingExempt } from "./auth.config";

// Edge middleware — uses the Prisma-free config so it can run at the edge. The
// session (incl. `user.creator`, the Studio handle) rides in the JWT, so the
// two-domain split below needs no database access.
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
 * Canonical Studio pages served on the subdomain (root-relative). Extend this
 * when new routes are added under src/app/studio. Everything else on the studio
 * host is treated as a consumer page and redirected to the apex.
 */
function isStudioPage(pathname: string): boolean {
  return (
    pathname === "/" ||
    pathname === "/settings" ||
    pathname.startsWith("/settings/")
  );
}

/**
 * Only apply the split on hosts that actually have a sibling studio/apex host —
 * the production domain and localhost dev. Vercel preview deploys (*.vercel.app)
 * have no studio subdomain, so they keep the single-host behavior (serving
 * /studio inline).
 */
function splitEnabled(host: string): boolean {
  const h = host.split(":")[0];
  return (
    h === "themotoo.com" ||
    h.endsWith(".themotoo.com") ||
    h === "localhost" ||
    h.endsWith(".localhost")
  );
}

const isProd = process.env.NODE_ENV === "production";

export default auth((req) => {
  const url = req.nextUrl;
  const path = url.pathname;
  const host = req.headers.get("host") ?? url.host;
  const user = req.auth?.user;

  const canSplit = splitEnabled(host);
  const onStudioHost = host.startsWith(STUDIO_PREFIX);

  // Sibling hosts (port preserved for localhost dev).
  const apexHost = host.replace(/^studio\./, "");
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
      return isProd ? crossHost(apexHost, path) : NextResponse.next();
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
    return NextResponse.rewrite(rewritten);
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

  return NextResponse.next();
});

export const config = {
  // Run on all pages except API routes, Next internals, and static files.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
