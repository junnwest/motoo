/**
 * The carrier for a pre-launch invite between `/join/<token>` and the moment
 * signup actually spends it.
 *
 * Its own module because it is imported from an edge-adjacent route, a server
 * component and a server action, and pulling in `src/lib/invites.ts` (which
 * touches Prisma) from all three would drag the client into places that do not
 * need it.
 *
 * httpOnly, so the token cannot be read or forged from client JS. 7 days to
 * match `creatorIntent` — it has to survive signup → OAuth round-trip →
 * onboarding, possibly across a closed tab.
 */
export const INVITE_COOKIE = "prelaunchInvite";
export const INVITE_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
