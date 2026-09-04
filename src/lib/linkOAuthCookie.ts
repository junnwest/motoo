import type { LinkableProvider } from "@/lib/oauthLinking";

/**
 * CSRF + identity carrier for the "link a provider from /settings" round
 * trip (`/api/settings/link/<provider>` → the provider's consent screen →
 * `/api/settings/link/<provider>/callback`).
 *
 * Deliberately its own cookie, not reused from Auth.js's internal PKCE/state
 * cookies: those are fixed-name and shared across every sign-in attempt, so
 * an ordinary login in another tab during a link attempt would fight over
 * the same cookie. This one can't collide with anything Auth.js manages.
 *
 * httpOnly, so it cannot be read or forged from client JS. 10 minutes, not
 * INVITE_COOKIE's 7 days — this is a single unbroken redirect round trip
 * started and finished in one sitting, not an intent that has to survive a
 * multi-day signup funnel.
 */
export const LINK_OAUTH_COOKIE = "linkOAuthState";
export const LINK_OAUTH_COOKIE_MAX_AGE = 60 * 10;

export interface LinkOAuthCookiePayload {
  state: string;
  backerId: string;
  provider: LinkableProvider;
  /** PKCE verifier for this attempt — see the note in oauthLinking.ts. */
  codeVerifier: string;
}
