/**
 * Content-Security-Policy, now enforced (docs/PRELAUNCH.md #34).
 *
 * It shipped Report-Only because enforcing needs a per-request nonce: Next
 * injects inline bootstrap scripts, and a policy without `'unsafe-inline'`
 * blocks them — which takes the site down rather than degrading it. That nonce
 * now exists, generated in `src/proxy.ts` and threaded onto the request so Next
 * stamps it on its own script tags.
 *
 * **`script-src` is the part that matters, and it deliberately does NOT use
 * `'strict-dynamic'`.** That would have been the stronger policy, and it was
 * tried first: it makes a browser ignore `'self'` and trust only the nonced
 * bootstrap and what it loads. Against a real production build, Next emits one
 * async chunk per ConsumerShell page with no nonce on it
 * (`/_next/static/chunks/…`, on /home, /explore, /search and /profile), which
 * `'strict-dynamic'` would block — the whole shell, on every signed-in page.
 *
 * So the policy is `'self' 'nonce-…'` instead. The win is unchanged for the
 * attack this product actually has a surface for: an injected `<script>` in a
 * creator bio or an item title has no nonce and does not run, and a script from
 * another origin is refused outright. What it gives up is defence against an
 * attacker who can place a .js file on our own origin — and there is no upload
 * path that writes files at all (images are data: URLs in Postgres).
 *
 * Worth re-testing after a Next upgrade: if that chunk starts arriving nonced,
 * `'strict-dynamic'` becomes available for free.
 *
 * **`style-src` keeps `'unsafe-inline'`, deliberately.** A nonce covers
 * `<style>` elements but not `style=""` attributes, which React writes for
 * every inline style prop in the app. The CSP-3 answer is `style-src-attr`,
 * which Safari does not implement — so removing it would break rendering on
 * iOS to close a hole that does not lead anywhere: a style attribute cannot
 * run script.
 *
 * The middleware matcher skips `/api`, so those responses no longer carry a CSP
 * where the old static header did. They are JSON, and a policy about what a
 * document may load says nothing about one — the headers that do matter there
 * (X-Frame-Options, nosniff, HSTS) are still set statically in next.config.ts.
 *
 * If this turns out to block something real, `CSP_MODE=report-only` puts the
 * header back to reporting without a code change.
 */

export function buildCsp(nonce: string, isProd: boolean): string {
  return [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    // Uploaded images are data: URLs in Postgres (see src/lib/imageUpload.ts),
    // and OAuth providers serve avatars from their own hosts.
    "img-src 'self' data: https:",
    // 'unsafe-eval' in dev only — React Refresh needs it, and it is exactly the
    // thing this policy exists to forbid in production.
    `script-src 'self' 'nonce-${nonce}'${isProd ? "" : " 'unsafe-eval'"}`,
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self' data:",
    "connect-src 'self'",
    // Now meaningful: browsers ignore this in a Report-Only policy and log a
    // console error for it on every page load, which is why it was left out
    // until the header started being enforced.
    ...(isProd ? ["upgrade-insecure-requests"] : []),
  ].join("; ");
}

/**
 * Report-Only is a one-env-var rollback, not a default. Anything other than the
 * literal "report-only" enforces, so a typo fails safe (enforcing) rather than
 * silently disabling the policy.
 */
export function cspHeaderName(): string {
  return process.env.CSP_MODE === "report-only"
    ? "Content-Security-Policy-Report-Only"
    : "Content-Security-Policy";
}
