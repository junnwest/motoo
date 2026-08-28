/**
 * Pre-launch mode.
 *
 * While this is on, motoo is invite-only: we are reaching out to creators
 * directly and only they can create an account. The public site is a welcome
 * page, the legal pages, and the invite/login doors — everything else is
 * private. See `src/proxy.ts` for the gate and `src/lib/invites.ts` for the key.
 *
 * An env var rather than a code change, so launch is a Vercel setting and a
 * redeploy, and so a staging host can run in the opposite mode. Off by default:
 * a missing variable must not silently lock the product.
 */
export const PRELAUNCH = process.env.PRELAUNCH === "1";

/**
 * Paths that stay reachable while signed out during pre-launch.
 *
 * The legal pages are on this list deliberately and must stay on it: `/refund`
 * is a live obligation, and `/terms` + `/privacy` are agreed to at onboarding —
 * hiding the terms someone is being asked to accept is not a thing to do for
 * marketing tidiness. `/youth` is the 청소년보호정책, same reasoning.
 */
const PUBLIC_PREFIXES = [
  "/join", // the invite door
  "/login",
  "/signup",
  "/forgot",
  "/reset",
  "/verify",
  "/terms",
  "/privacy",
  "/refund",
  "/youth",
];

export function isPublicDuringPrelaunch(path: string): boolean {
  if (path === "/") return true; // the welcome page
  return PUBLIC_PREFIXES.some((p) => path === p || path.startsWith(p + "/"));
}
