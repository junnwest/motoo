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

/**
 * What a signed-in **non-admin** may reach while invite-only.
 *
 * The product is genuinely unlaunched, not merely hidden: an invited creator can
 * complete signup and set their Studio up, and that is all. They cannot browse,
 * donate, or open the Studio itself — none of which would do anything useful
 * before launch anyway (payments are mocked, there are no fans, and the
 * discovery surfaces would be empty).
 *
 * So the reward for redeeming an invite is a finished account and a reserved
 * handle, which is exactly what was promised. Admins bypass this entirely —
 * somebody has to be able to look at the running product.
 */
const SIGNED_IN_PREFIXES = ["/onboarding", "/creator/onboarding"];

export function isSignedInAllowedDuringPrelaunch(path: string): boolean {
  if (isPublicDuringPrelaunch(path)) return true;
  return SIGNED_IN_PREFIXES.some((p) => path === p || path.startsWith(p + "/"));
}
