/**
 * The two host predicates behind the two-domain split (DECISIONS 2026-07-24).
 *
 * Extracted from `src/proxy.ts` so they can be tested: the middleware imports
 * NextAuth, which drags the edge runtime in with it, and these are pure string
 * functions that deserve tests far more than they deserve a test harness.
 *
 * They decide which host serves a URL. Getting either wrong does not throw — it
 * sends people to the wrong domain, or (the failure this codebase has actually
 * hit) produces a redirect loop in dev, where the apex is bare `localhost:PORT`
 * and Next flattens a cross-host Location into a same-host one.
 */

/**
 * Paths the Studio subdomain serves at its own root. Everything else on that
 * host belongs to the consumer app and is sent to the apex.
 *
 * **Adding a Studio route means adding it here**, or it will bounce to the apex
 * and look like the page does not exist.
 */
export function isStudioPage(pathname: string): boolean {
  return (
    pathname === "/" ||
    pathname === "/settings" ||
    pathname.startsWith("/settings/")
  );
}

/**
 * Only split on hosts that actually have a sibling studio/apex pair: the
 * production domain and localhost. Vercel preview deploys are `*.vercel.app`
 * with no studio subdomain, so they keep single-host behaviour and serve
 * `/studio` inline — otherwise every preview would redirect to a host that does
 * not exist.
 */
export function splitEnabled(host: string): boolean {
  const h = host.split(":")[0];
  return (
    h === "themotoo.com" ||
    h.endsWith(".themotoo.com") ||
    h === "localhost" ||
    h.endsWith(".localhost")
  );
}
